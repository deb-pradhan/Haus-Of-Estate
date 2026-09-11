import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  sameOrigin: vi.fn(() => true),
  findMany: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  findPublishedDocument: vi.fn(),
  findPublishedDocuments: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/request-security", () => ({
  isSameOriginRequest: mocks.sameOrigin,
}));
vi.mock("@/lib/db", () => ({
  db: {
    savedContent: {
      findMany: mocks.findMany,
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}));
vi.mock("@/lib/saved-content/sanity", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/saved-content/sanity")
  >();
  return {
    ...actual,
    findPublishedSavedDocument: mocks.findPublishedDocument,
    findPublishedSavedDocuments: mocks.findPublishedDocuments,
  };
});

import { DELETE, GET, PUT } from "@/app/api/saved/route";

const savedAt = new Date("2026-09-01T12:00:00.000Z");
const publishedProperty = {
  _id: "property-1",
  _type: "property" as const,
  title: "A published home",
  slug: "a-published-home",
};

function request(
  method: "GET" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
) {
  return new Request("http://localhost:3000/api/saved", {
    method,
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/saved", () => {
  beforeEach(() => {
    process.env.SAVED_CONTENT_ENABLED = "true";
    mocks.auth.mockResolvedValue({ user: { id: "current-user" } });
    mocks.sameOrigin.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([]);
    mocks.findPublishedDocuments.mockResolvedValue([]);
    mocks.findPublishedDocument.mockResolvedValue(publishedProperty);
    mocks.upsert.mockResolvedValue({
      id: "saved-1",
      contentType: "PROPERTY",
      sanityDocumentId: "property-1",
      createdAt: savedAt,
    });
    mocks.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("returns 404 without authenticating while the feature is disabled", async () => {
    process.env.SAVED_CONTENT_ENABLED = "false";

    const response = await GET(request("GET"));

    expect(response.status).toBe(404);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("requires an authenticated account", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(request("GET"));

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("returns a generic service error when session lookup fails", async () => {
    mocks.auth.mockRejectedValue(Object.assign(new Error("database URL"), {
      code: "SESSION_LOOKUP_FAILED",
    }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(request("GET"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Saved items are temporarily unavailable.",
    });
    expect(consoleError).toHaveBeenCalledWith("Saved content lookup failed", {
      code: "SESSION_LOOKUP_FAILED",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("database URL");
  });

  it("rejects forged identity filters on reads", async () => {
    const forgedRequest = new Request(
      "http://localhost:3000/api/saved?userId=victim-user",
    );

    const response = await GET(forgedRequest);

    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("reads only the signed-in user's rows and drops unpublished content", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "saved-1",
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
        createdAt: savedAt,
      },
      {
        id: "saved-2",
        contentType: "ARTICLE",
        sanityDocumentId: "deleted-post",
        createdAt: savedAt,
      },
    ]);
    mocks.findPublishedDocuments.mockResolvedValue([publishedProperty]);

    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "current-user" } }),
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      items: [
        {
          contentType: "PROPERTY",
          sanityDocumentId: "property-1",
          content: { _id: "property-1" },
        },
      ],
    });
  });

  it("rejects a forged user ID instead of accepting it from the payload", async () => {
    const response = await PUT(
      request("PUT", {
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
        userId: "victim-user",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.findPublishedDocument).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("verifies publication and idempotently upserts for the current user", async () => {
    const response = await PUT(
      request("PUT", {
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findPublishedDocument).toHaveBeenCalledWith(
      "PROPERTY",
      "property-1",
    );
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        userId_contentType_sanityDocumentId: {
          userId: "current-user",
          contentType: "PROPERTY",
          sanityDocumentId: "property-1",
        },
      },
      create: {
        userId: "current-user",
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
      },
      update: {},
      select: {
        id: true,
        contentType: true,
        sanityDocumentId: true,
        createdAt: true,
      },
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      item: { sanityDocumentId: "property-1" },
    });
  });

  it("does not save a deleted, archived, or unpublished Sanity item", async () => {
    mocks.findPublishedDocument.mockResolvedValue(null);

    const response = await PUT(
      request("PUT", {
        contentType: "ARTICLE",
        sanityDocumentId: "post-1",
      }),
    );

    expect(response.status).toBe(404);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rejects cross-origin mutations before reading session state", async () => {
    mocks.sameOrigin.mockReturnValue(false);

    const response = await DELETE(
      request("DELETE", {
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes idempotently and scopes the operation to the current user", async () => {
    const response = await DELETE(
      request("DELETE", {
        contentType: "ARTICLE",
        sanityDocumentId: "post-1",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "current-user",
        contentType: "ARTICLE",
        sanityDocumentId: "post-1",
      },
    });
  });
});
