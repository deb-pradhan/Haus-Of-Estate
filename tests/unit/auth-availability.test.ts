import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";

const mocks = vi.hoisted(() => ({
  databaseAccess: vi.fn(),
  sendMail: vi.fn(),
  auth: vi.fn(),
  getHandler: vi.fn(async () => new Response("enabled GET")),
  postHandler: vi.fn(async () => new Response("enabled POST")),
}));

vi.mock("@/lib/db", () => ({
  db: new Proxy({}, {
    get(_target, property) {
      mocks.databaseAccess(property);
      throw new Error("Disabled auth must not access the database");
    },
  }),
}));
vi.mock("@/lib/email/auth", () => ({
  sendVerificationEmail: mocks.sendMail,
  sendPasswordResetEmail: mocks.sendMail,
}));
vi.mock("@/auth", () => ({
  auth: mocks.auth,
  handlers: { GET: mocks.getHandler, POST: mocks.postHandler },
}));

import { isAuthEnabled, isPropertyAssistantEnabled, isSavedContentEnabled } from "@/lib/features";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resendVerification } from "@/app/api/auth/resend-verification/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import { POST as verifyEmail } from "@/app/api/auth/verify-email/route";
import { GET as exchangeToken } from "@/app/api/auth/action-token/exchange/route";
import { GET as authGet, POST as authPost } from "@/app/api/auth/[...nextauth]/route";
import proxy from "@/proxy";

beforeEach(() => {
  vi.stubEnv("AUTH_ENABLED", "false");
  vi.stubEnv("SAVED_CONTENT_ENABLED", "true");
  vi.stubEnv("PROPERTY_ASSISTANT_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("deferred authentication", () => {
  it.each([undefined, "false", "TRUE", "1"])(
    "keeps auth and its dependent features closed for AUTH_ENABLED=%s",
    (value) => {
      vi.stubEnv("AUTH_ENABLED", value);
      expect(isAuthEnabled()).toBe(false);
      expect(isSavedContentEnabled()).toBe(false);
      expect(isPropertyAssistantEnabled()).toBe(false);
    },
  );

  it("allows independent saved and assistant opt-ins only with auth enabled", () => {
    vi.stubEnv("AUTH_ENABLED", "true");
    expect(isAuthEnabled()).toBe(true);
    expect(isSavedContentEnabled()).toBe(true);
    expect(isPropertyAssistantEnabled()).toBe(true);
    vi.stubEnv("SAVED_CONTENT_ENABLED", "false");
    vi.stubEnv("PROPERTY_ASSISTANT_ENABLED", "false");
    expect(isSavedContentEnabled()).toBe(false);
    expect(isPropertyAssistantEnabled()).toBe(false);
  });

  it.each([
    ["register", register],
    ["forgot-password", forgotPassword],
    ["resend-verification", resendVerification],
    ["reset-password", resetPassword],
    ["verify-email", verifyEmail],
  ] as const)("closes %s before body parsing, database or email work", async (path, handler) => {
    const request = new Request(`https://hausofestate.com/api/auth/${path}`, {
      method: "POST",
      headers: { origin: "https://hausofestate.com" },
      body: "not-json",
    });
    const parse = vi.spyOn(request, "json").mockRejectedValue(new Error("Do not parse"));
    const response = await handler(request);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(parse).not.toHaveBeenCalled();
    expect(mocks.databaseAccess).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("closes emailed token exchange without setting a token cookie or redirect", () => {
    const response = exchangeToken(new Request(
      "https://hausofestate.com/api/auth/action-token/exchange?purpose=email-verification&token=secret",
    ));
    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["session", "providers", "csrf", "callback/google", "callback/credentials", "signin", "signout"])(
    "closes NextAuth %s for GET and POST without invoking its handler",
    async (path) => {
      for (const method of ["GET", "POST"] as const) {
        const request = new NextRequest(`https://hausofestate.com/api/auth/${path}`, { method });
        const response = await (method === "GET" ? authGet : authPost)(request);
        expect(response.status).toBe(404);
        expect(response.headers.get("cache-control")).toBe("no-store");
      }
      expect(mocks.getHandler).not.toHaveBeenCalled();
      expect(mocks.postHandler).not.toHaveBeenCalled();
      expect(mocks.databaseAccess).not.toHaveBeenCalled();
    },
  );

  it("preserves NextAuth handler dispatch when explicitly enabled", async () => {
    vi.stubEnv("AUTH_ENABLED", "true");
    const getRequest = new NextRequest("https://hausofestate.com/api/auth/session");
    const postRequest = new NextRequest("https://hausofestate.com/api/auth/signin", { method: "POST" });
    expect(await (await authGet(getRequest)).text()).toBe("enabled GET");
    expect(await (await authPost(postRequest)).text()).toBe("enabled POST");
    expect(mocks.getHandler).toHaveBeenCalledWith(getRequest);
    expect(mocks.postHandler).toHaveBeenCalledWith(postRequest);
  });

  it.each(["/auth/login", "/auth/register", "/auth/reset-password", "/auth/verify-email", "/auth/error", "/%61uth/login", "/account", "/messages", "/viewings", "/saved", "/saved/nested"])(
    "closes page %s before session handling",
    async (path) => {
      const response = await proxy(new NextRequest(`https://hausofestate.com${path}`), {} as NextFetchEvent);
      expect(response?.status).toBe(404);
      expect(response?.headers.get("cache-control")).toBe("no-store");
      expect(response?.headers.get("x-robots-tag")).toBe("noindex");
      expect(mocks.auth).not.toHaveBeenCalled();
      expect(mocks.databaseAccess).not.toHaveBeenCalled();
    },
  );

  it.each(["/", "/enquire", "/properties", "/contact", "/careers"])(
    "keeps public page %s independent from sessions",
    async (path) => {
      const response = await proxy(new NextRequest(`https://hausofestate.com${path}`), {} as NextFetchEvent);
      expect(response?.headers.get("x-middleware-next")).toBe("1");
      expect(mocks.auth).not.toHaveBeenCalled();
      expect(mocks.databaseAccess).not.toHaveBeenCalled();
    },
  );

  it("preserves the authenticated proxy when auth is explicitly enabled", async () => {
    vi.stubEnv("AUTH_ENABLED", "true");
    const authenticatedProxy = vi.fn(() => NextResponse.next());
    mocks.auth.mockReturnValue(authenticatedProxy);
    const request = new NextRequest("https://hausofestate.com/saved");
    await proxy(request, {} as NextFetchEvent);
    expect(mocks.auth).toHaveBeenCalledOnce();
    expect(authenticatedProxy).toHaveBeenCalledWith(request, {});
  });
});
