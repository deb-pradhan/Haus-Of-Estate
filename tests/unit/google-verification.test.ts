import { describe, expect, it, vi } from "vitest";
import { syncVerifiedGoogleUser } from "../../src/lib/auth/google-verification";

describe("Google verification synchronization", () => {
  it("normalizes a verified matching email and upgrades a historical account", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const now = new Date("2026-09-01T12:00:00.000Z");

    await expect(
      syncVerifiedGoogleUser(
        { user: { updateMany } },
        {
          userId: "user-1",
          userEmail: "person@example.com",
          profileEmail: " Person@Example.COM ",
          profileEmailVerified: true,
        },
        now,
      ),
    ).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", email: "person@example.com" },
      data: { emailVerified: now },
    });
  });

  it("does not trust an unverified or mismatched Google identity", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      syncVerifiedGoogleUser(
        { user: { updateMany } },
        {
          userId: "user-1",
          userEmail: "person@example.com",
          profileEmail: "other@example.com",
          profileEmailVerified: true,
        },
      ),
    ).resolves.toBe(false);
    await expect(
      syncVerifiedGoogleUser(
        { user: { updateMany } },
        {
          userId: "user-1",
          userEmail: "person@example.com",
          profileEmail: "person@example.com",
          profileEmailVerified: false,
        },
      ),
    ).resolves.toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
