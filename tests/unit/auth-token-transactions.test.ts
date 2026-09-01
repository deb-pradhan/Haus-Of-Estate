import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const token = {
    id: "token-1",
    userId: "user-1",
    type: "PASSWORD_RESET" as const,
    tokenHash: "token-hash",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    usedAt: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
  };
  const tx = {
    authActionToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    user: { update: vi.fn(), create: vi.fn() },
    session: { deleteMany: vi.fn() },
  };
  return {
    token,
    tx,
    transaction: vi.fn(async (operation: (value: typeof tx) => unknown) =>
      operation(tx),
    ),
  };
});

vi.mock("@/lib/auth/auth-db", () => ({
  authDb: { $transaction: mocks.transaction },
}));

import {
  activateIssuedActionToken,
  issueActionToken,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from "@/lib/auth/action-tokens";

describe("auth token transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.authActionToken.findUnique.mockResolvedValue(mocks.token);
    mocks.tx.authActionToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 1 });
    mocks.tx.user.update.mockResolvedValue({ id: "user-1" });
    mocks.tx.session.deleteMany.mockResolvedValue({ count: 2 });
    mocks.tx.authActionToken.create.mockResolvedValue(mocks.token);
  });

  it("retires older sibling links only after the replacement is delivered", async () => {
    await activateIssuedActionToken(
      "user-1",
      "PASSWORD_RESET",
      "delivered-reset-token",
    );

    expect(mocks.tx.authActionToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        type: "PASSWORD_RESET",
        tokenHash: { not: expect.any(String) },
        usedAt: null,
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("does not invalidate a working link before a replacement is delivered", async () => {
    await expect(
      issueActionToken("user-1", "PASSWORD_RESET"),
    ).resolves.toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(mocks.tx.authActionToken.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.authActionToken.updateMany).not.toHaveBeenCalled();
  });

  it("resets the password, revokes sessions, and consumes sibling tokens", async () => {
    await expect(
      resetPasswordWithToken("raw-reset-token", "new-password-hash"),
    ).resolves.toBe(true);

    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        passwordHash: "new-password-hash",
        sessionVersion: { increment: 1 },
      },
    });
    expect(mocks.tx.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mocks.tx.authActionToken.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          type: "PASSWORD_RESET",
          usedAt: null,
        }),
      }),
    );
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("retries a serialization conflict before redeeming a reset token", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    await expect(
      resetPasswordWithToken("raw-reset-token", "new-password-hash"),
    ).resolves.toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("does not mutate a user when the token is already used", async () => {
    mocks.tx.authActionToken.findUnique.mockResolvedValue({
      ...mocks.token,
      usedAt: new Date("2026-09-01T01:00:00.000Z"),
    });

    await expect(
      resetPasswordWithToken("used-token", "new-password-hash"),
    ).resolves.toBe(false);
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
    expect(mocks.tx.session.deleteMany).not.toHaveBeenCalled();
  });

  it("marks a verified account with the verification time", async () => {
    mocks.tx.authActionToken.findUnique.mockResolvedValue({
      ...mocks.token,
      type: "EMAIL_VERIFICATION",
    });

    await expect(verifyEmailWithToken("raw-verify-token")).resolves.toBe(true);
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("propagates a write failure so the database transaction can roll back", async () => {
    mocks.tx.user.update.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      resetPasswordWithToken("raw-reset-token", "new-password-hash"),
    ).rejects.toThrow("database unavailable");
  });
});
