import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hash: vi.fn(async () => "hashed-password"),
  findUser: vi.fn(),
  createUserWithToken: vi.fn(),
  sendVerification: vi.fn(),
  sameOrigin: vi.fn(() => true),
  throttle: vi.fn(async () => ({ allowed: true, retryAfterSeconds: 0 })),
}));

vi.mock("bcryptjs", () => ({ default: { hash: mocks.hash } }));
vi.mock("@/lib/auth/auth-db", () => ({
  authDb: { user: { findUnique: mocks.findUser } },
}));
vi.mock("@/lib/auth/action-tokens", () => ({
  createUnverifiedUserWithToken: mocks.createUserWithToken,
}));
vi.mock("@/lib/email/auth", () => ({
  sendVerificationEmail: mocks.sendVerification,
}));
vi.mock("@/lib/auth/request-security", () => ({
  isSameOriginRequest: mocks.sameOrigin,
}));
vi.mock("@/lib/auth/throttle", () => ({
  enforceAuthThrottle: mocks.throttle,
}));

import { POST } from "@/app/api/auth/register/route";

function registrationRequest(body: unknown) {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mocks.sameOrigin.mockReturnValue(true);
    mocks.findUser.mockResolvedValue(null);
    mocks.createUserWithToken.mockResolvedValue({
      userId: "user-1",
      rawToken: "verification-token",
    });
    mocks.sendVerification.mockResolvedValue({ id: "email-1" });
  });

  it("creates only an unverified account and verification token", async () => {
    const response = await POST(
      registrationRequest({
        name: "  Surya   Kommuri ",
        email: " SURYA@example.com ",
        password: "secure-password",
        returnTo: "/saved?tab=properties",
        intent: "buyer",
        consentGiven: true,
      }),
    );

    expect(response.status).toBe(202);
    expect(mocks.createUserWithToken).toHaveBeenCalledWith({
      name: "Surya Kommuri",
      email: "surya@example.com",
      phone: undefined,
      passwordHash: "hashed-password",
    });
    expect(mocks.sendVerification).toHaveBeenCalledWith({
      to: "surya@example.com",
      name: "Surya Kommuri",
      rawToken: "verification-token",
      returnTo: "/saved?tab=properties",
    });

    const serializedCalls = JSON.stringify(
      mocks.createUserWithToken.mock.calls,
    );
    expect(serializedCalls).not.toContain("consent");
    expect(serializedCalls).not.toContain("intent");
    expect(serializedCalls).not.toContain("lead");
  });

  it("returns the same public response for an existing address", async () => {
    mocks.findUser.mockResolvedValue({ id: "existing-user" });

    const response = await POST(
      registrationRequest({
        name: "Existing User",
        email: "existing@example.com",
        password: "secure-password",
      }),
    );

    expect(response.status).toBe(202);
    expect(mocks.createUserWithToken).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("rejects a cross-origin request before account work", async () => {
    mocks.sameOrigin.mockReturnValue(false);

    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "surya@example.com",
        password: "secure-password",
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.createUserWithToken).not.toHaveBeenCalled();
  });

  it("returns field errors without hashing invalid passwords", async () => {
    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "not-an-email",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.hash).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      fieldErrors: expect.objectContaining({ email: expect.any(Array) }),
    });
  });
});
