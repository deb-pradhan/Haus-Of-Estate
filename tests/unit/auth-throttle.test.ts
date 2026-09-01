import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    authThrottle: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    tx,
    transaction: vi.fn(async (operation: (value: typeof tx) => unknown) =>
      operation(tx),
    ),
  };
});

vi.mock("@/lib/auth/auth-db", () => ({
  authDb: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/auth/request-security", () => ({
  getClientIp: () => "203.0.113.8",
}));

import {
  enforceAuthThrottle,
  hashThrottleIdentifier,
} from "@/lib/auth/throttle";

describe("auth throttle", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_THROTTLE_SECRET", "unit-test-throttle-secret");
    mocks.tx.authThrottle.findUnique.mockResolvedValue({
      id: "ip-row",
      scope: "LOGIN",
      keyHash: "hash",
      windowStart: new Date(),
      attempts: 20,
      blockedUntil: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("HMAC-hashes identifiers without retaining the raw value", () => {
    const hash = hashThrottleIdentifier(
      "LOGIN",
      "email",
      "surya@example.com",
    );
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("surya@example.com");
  });

  it("does not consume a victim email bucket after the IP is blocked", async () => {
    const result = await enforceAuthThrottle(
      new Request("https://hausofestate.com/api/auth/callback/credentials"),
      {
        scope: "LOGIN",
        identifier: { kind: "email", value: "victim@example.com" },
        ip: { limit: 10, windowMs: 600_000 },
        identifierRule: { limit: 5, windowMs: 600_000 },
      },
    );

    expect(result.allowed).toBe(false);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.authThrottle.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.tx.authThrottle.update).not.toHaveBeenCalled();
  });
});
