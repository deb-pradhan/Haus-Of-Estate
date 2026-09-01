import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BotChallengeResult } from "@/lib/bot-protection/types";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  issueToken: vi.fn(),
  activateToken: vi.fn(),
  sendPasswordReset: vi.fn(),
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

vi.mock("@/lib/auth/auth-db", () => ({
  authDb: { user: { findUnique: mocks.findUser } },
}));
vi.mock("@/lib/auth/action-tokens", () => ({
  issueActionToken: mocks.issueToken,
  activateIssuedActionToken: mocks.activateToken,
}));
vi.mock("@/lib/email/auth", () => ({
  sendPasswordResetEmail: mocks.sendPasswordReset,
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

import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resendVerification } from "@/app/api/auth/resend-verification/route";

function request(path: string) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      email: "surya@example.com",
      turnstileToken: "challenge-token",
    }),
  });
}

describe("bot-protected auth email actions", () => {
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
    mocks.verifyBotChallenge.mockResolvedValue({ ok: true, skipped: false });
    mocks.findUser.mockResolvedValue(null);
  });

  it("stops forgotten-password work when its challenge is rejected", async () => {
    mocks.verifyBotChallenge.mockResolvedValue({
      ok: false,
      reason: "rejected",
    });

    const response = await forgotPassword(
      request("/api/auth/forgot-password"),
    );

    expect(response.status).toBe(403);
    expect(mocks.verifyBotChallenge).toHaveBeenCalledWith({
      request: expect.any(Request),
      token: "challenge-token",
      action: "forgot_password",
    });
    expect(mocks.identifierThrottle).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.issueToken).not.toHaveBeenCalled();
    expect(mocks.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("stops verification-email resend work when verification is unavailable", async () => {
    mocks.verifyBotChallenge.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });

    const response = await resendVerification(
      request("/api/auth/resend-verification"),
    );

    expect(response.status).toBe(503);
    expect(mocks.verifyBotChallenge).toHaveBeenCalledWith({
      request: expect.any(Request),
      token: "challenge-token",
      action: "resend_verification",
    });
    expect(mocks.identifierThrottle).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.issueToken).not.toHaveBeenCalled();
    expect(mocks.sendVerification).not.toHaveBeenCalled();
  });
});
