import { db } from "../db";
import { LEAD_DELIVERY_STATUSES } from "./types";
import type {
  LeadDeliveryOutboxRecord,
  LeadDeliveryOutboxRepository,
} from "./types";

interface OutboxDelegate {
  updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
  findMany(args: Record<string, unknown>): Promise<Array<{ id: string }>>;
  findUnique(args: Record<string, unknown>): Promise<LeadDeliveryOutboxRecord | null>;
}

interface PrismaWithLeadDeliveryOutbox {
  leadDeliveryOutbox: OutboxDelegate;
}

export function createPrismaLeadDeliveryOutboxRepository(
  client: unknown = db,
): LeadDeliveryOutboxRepository {
  const outbox = (client as PrismaWithLeadDeliveryOutbox).leadDeliveryOutbox;

  return {
    async recoverStaleLocks(staleBefore, recoveredAt) {
      const result = await outbox.updateMany({
        where: {
          status: LEAD_DELIVERY_STATUSES.processing,
          lockedAt: { lte: staleBefore },
        },
        data: {
          status: LEAD_DELIVERY_STATUSES.pending,
          availableAt: recoveredAt,
          lockedAt: null,
          lockedBy: null,
          lastError: "STALE_LEASE_RECOVERED",
        },
      });
      return result.count;
    },

    async listReadyIds(readyAt, limit) {
      const records = await outbox.findMany({
        where: {
          status: LEAD_DELIVERY_STATUSES.pending,
          availableAt: { lte: readyAt },
        },
        orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
        take: limit,
        select: { id: true },
      });
      return records.map((record) => record.id);
    },

    async claim(id, workerId, claimedAt) {
      const result = await outbox.updateMany({
        where: {
          id,
          status: LEAD_DELIVERY_STATUSES.pending,
          availableAt: { lte: claimedAt },
        },
        data: {
          status: LEAD_DELIVERY_STATUSES.processing,
          attempts: { increment: 1 },
          lockedAt: claimedAt,
          lockedBy: workerId,
        },
      });
      if (result.count !== 1) return null;

      const record = await outbox.findUnique({ where: { id } });
      if (
        !record ||
        record.status !== LEAD_DELIVERY_STATUSES.processing ||
        record.lockedBy !== workerId
      ) {
        return null;
      }
      return record;
    },

    async markDelivered(id, workerId, deliveredAt) {
      const result = await outbox.updateMany({
        where: {
          id,
          status: LEAD_DELIVERY_STATUSES.processing,
          lockedBy: workerId,
        },
        data: {
          status: LEAD_DELIVERY_STATUSES.delivered,
          deliveredAt,
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
      });
      return result.count === 1;
    },

    async releaseForRetry(id, workerId, availableAt, errorCode) {
      const result = await outbox.updateMany({
        where: {
          id,
          status: LEAD_DELIVERY_STATUSES.processing,
          lockedBy: workerId,
        },
        data: {
          status: LEAD_DELIVERY_STATUSES.pending,
          availableAt,
          lockedAt: null,
          lockedBy: null,
          lastError: errorCode,
        },
      });
      return result.count === 1;
    },

    async markDeadLetter(id, workerId, errorCode) {
      const result = await outbox.updateMany({
        where: {
          id,
          status: LEAD_DELIVERY_STATUSES.processing,
          lockedBy: workerId,
        },
        data: {
          status: LEAD_DELIVERY_STATUSES.deadLetter,
          lockedAt: null,
          lockedBy: null,
          lastError: errorCode,
        },
      });
      return result.count === 1;
    },
  };
}
