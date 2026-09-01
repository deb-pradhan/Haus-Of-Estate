import { describe, expect, it, vi } from "vitest";

import { createPrismaLeadDeliveryOutboxRepository } from "./prisma-outbox";

describe("Prisma lead delivery outbox repository", () => {
  it("claims with one conditional update before reading the row", async () => {
    const delegate = {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    };
    const repository = createPrismaLeadDeliveryOutboxRepository({
      leadDeliveryOutbox: delegate,
    });
    const claimedAt = new Date("2026-08-29T12:00:00.000Z");

    await expect(
      repository.claim("event-1", "worker-1", claimedAt),
    ).resolves.toBeNull();
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: {
        id: "event-1",
        status: "PENDING",
        availableAt: { lte: claimedAt },
      },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        lockedAt: claimedAt,
        lockedBy: "worker-1",
      },
    });
    expect(delegate.findUnique).not.toHaveBeenCalled();
  });

  it("releases stale leases without resetting attempt history", async () => {
    const delegate = {
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    };
    const repository = createPrismaLeadDeliveryOutboxRepository({
      leadDeliveryOutbox: delegate,
    });
    const staleBefore = new Date("2026-08-29T11:50:00.000Z");
    const recoveredAt = new Date("2026-08-29T12:00:00.000Z");

    await expect(
      repository.recoverStaleLocks(staleBefore, recoveredAt),
    ).resolves.toBe(3);
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: { status: "PROCESSING", lockedAt: { lte: staleBefore } },
      data: {
        status: "PENDING",
        availableAt: recoveredAt,
        lockedAt: null,
        lockedBy: null,
        lastError: "STALE_LEASE_RECOVERED",
      },
    });
  });
});
