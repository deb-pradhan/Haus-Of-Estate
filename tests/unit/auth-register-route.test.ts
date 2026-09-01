import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BotChallengeResult } from "@/lib/bot-protection/types";

const mocks = vi.hoisted(() => ({
  hash: vi.fn(async () => "hashed-password"),
  findUser: vi.fn(),
  createUserWithToken: vi.fn(),
  sendVerification: vi.fn(),
  sameOrigin: vi.fn(() => true),
  ipThrottle: vi.fn(async () => ({ allowed: true, retryAfterSeconds: 0 })),
  identifierThrottle: vi.fn(async () => ({
    allowed: true,
    retryAfterSeconds: 0,
  })),
  verifyBotChallenge: vi.fn(
    async (): Promise<BotChallengeResult> => ({ ok: true, skipped: true }),
  ),
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
  enforceAuthIpThrottle: mocks.ipThrottle,
  enforceAuthIdentifierThrottle: mocks.identifierThrottle,
}));
vi.mock("@/lib/bot-protection/verify", () => ({
  verifyBotChallenge: mocks.verifyBotChallenge,
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
    mocks.ipThrottle.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.identifierThrottle.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.verifyBotChallenge.mockResolvedValue({ ok: true, skipped: true });
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

  it("throttles before verifying a challenge or doing account work", async () => {
    mocks.ipThrottle.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 120,
    });

    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "surya@example.com",
        password: "secure-password",
        turnstileToken: "challenge-token",
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.verifyBotChallenge).not.toHaveBeenCalled();
    expect(mocks.identifierThrottle).not.toHaveBeenCalled();
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("verifies the challenge before hashing or querying account data", async () => {
    mocks.verifyBotChallenge.mockResolvedValue({
      ok: false,
      reason: "rejected",
    });

    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "surya@example.com",
        password: "secure-password",
        turnstileToken: "challenge-token",
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.verifyBotChallenge).toHaveBeenCalledWith({
      request: expect.any(Request),
      token: "challenge-token",
      action: "register",
    });
    expect(mocks.identifierThrottle).not.toHaveBeenCalled();
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.createUserWithToken).not.toHaveBeenCalled();
  });

  it("returns a retryable response when challenge verification is unavailable", async () => {
    mocks.verifyBotChallenge.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });

    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "surya@example.com",
        password: "secure-password",
        turnstileToken: "challenge-token",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "BOT_CHALLENGE_UNAVAILABLE",
    });
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("uses the email quota only after a valid challenge", async () => {
    mocks.identifierThrottle.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 300,
    });

    const response = await POST(
      registrationRequest({
        name: "Surya Kommuri",
        email: "surya@example.com",
        password: "secure-password",
        turnstileToken: "challenge-token",
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.verifyBotChallenge).toHaveBeenCalled();
    expect(mocks.identifierThrottle).toHaveBeenCalledWith({
      scope: "REGISTER",
      identifier: { kind: "email", value: "surya@example.com" },
      rule: { limit: 5, windowMs: 60 * 60 * 1_000 },
    });
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });
});
