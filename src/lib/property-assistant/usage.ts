import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getClientIp } from "@/lib/auth/request-security";
import { db } from "@/lib/db";
import {
  getPropertyAssistantUsageSecret,
  type PropertyAssistantConfig,
} from "@/lib/property-assistant/config";

const ACCOUNT_SCOPE = "PROPERTY_ASSISTANT_ACCOUNT";
const IP_SCOPE = "PROPERTY_ASSISTANT_IP";
const GLOBAL_SCOPE = "PROPERTY_ASSISTANT_GLOBAL_DAILY";
const GLOBAL_KEY_HASH = createHash("sha256")
  .update("haus-property-assistant-global-daily-v1")
  .digest("hex");

export interface PropertyAssistantUsageGrant {
  allowed: true;
  reservationId: string;
}

export interface PropertyAssistantUsageDenial {
  allowed: false;
  retryAfterSeconds: number;
}

export type PropertyAssistantUsageDecision =
  | PropertyAssistantUsageGrant
  | PropertyAssistantUsageDenial;

function hashUsageKey(scope: string, value: string): string {
  return createHmac("sha256", getPropertyAssistantUsageSecret())
    .update(`${scope}:${value}`)
    .digest("hex");
}

function fixedWindow(now: Date, durationMs: number) {
  const startMs = Math.floor(now.getTime() / durationMs) * durationMs;
  return {
    start: new Date(startMs),
    end: new Date(startMs + durationMs),
  };
}

function utcDayWindow(now: Date) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1_000) };
}

function secondsUntil(date: Date, now: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1_000));
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["P2002", "P2034"].includes(String((error as { code?: unknown }).code))
  );
}

type UsageBucket = {
  id: string;
  windowStart: Date;
  windowEnd: Date;
  requestCount: number;
  reservedTokenUnits: number;
  consumedTokenUnits: number;
};

async function currentBucket(
  transaction: Prisma.TransactionClient,
  input: {
    scope: string;
    keyHash: string;
    start: Date;
    end: Date;
    now: Date;
  },
): Promise<UsageBucket> {
  const existing = await transaction.propertyAssistantUsageBucket.findUnique({
    where: {
      scope_keyHash: { scope: input.scope, keyHash: input.keyHash },
    },
  });

  if (!existing) {
    return transaction.propertyAssistantUsageBucket.create({
      data: {
        scope: input.scope,
        keyHash: input.keyHash,
        windowStart: input.start,
        windowEnd: input.end,
      },
    });
  }

  if (
    existing.windowEnd <= input.now ||
    existing.windowStart.getTime() !== input.start.getTime()
  ) {
    if (input.scope === GLOBAL_SCOPE) {
      await transaction.propertyAssistantUsageReservation.deleteMany({
        where: { bucketId: existing.id },
      });
    }
    return transaction.propertyAssistantUsageBucket.update({
      where: { id: existing.id },
      data: {
        windowStart: input.start,
        windowEnd: input.end,
        requestCount: 0,
        reservedTokenUnits: 0,
        consumedTokenUnits: 0,
      },
    });
  }

  return existing;
}

async function reclaimExpiredReservations(
  transaction: Prisma.TransactionClient,
  bucket: UsageBucket,
  now: Date,
): Promise<UsageBucket> {
  const expired = await transaction.propertyAssistantUsageReservation.findMany({
    where: { bucketId: bucket.id, expiresAt: { lte: now } },
    select: { id: true, tokenUnits: true },
  });
  if (expired.length === 0) return bucket;

  const expiredUnits = expired.reduce(
    (total, reservation) => total + reservation.tokenUnits,
    0,
  );
  await transaction.propertyAssistantUsageReservation.deleteMany({
    where: { id: { in: expired.map((reservation) => reservation.id) } },
  });
  return transaction.propertyAssistantUsageBucket.update({
    where: { id: bucket.id },
    data: {
      reservedTokenUnits: Math.max(
        0,
        bucket.reservedTokenUnits - expiredUnits,
      ),
      consumedTokenUnits: { increment: expiredUnits },
    },
  });
}

export async function reservePropertyAssistantUsage(
  request: Request,
  userId: string,
  config: PropertyAssistantConfig,
): Promise<PropertyAssistantUsageDecision> {
  const clientIp = getClientIp(request);
  const accountHash = hashUsageKey(ACCOUNT_SCOPE, userId);
  const ipHash = hashUsageKey(IP_SCOPE, clientIp);
  const reservationId = randomUUID();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await db.$transaction(
        async (transaction) => {
          const now = new Date();
          const shortWindow = fixedWindow(now, config.usageWindowMs);
          const dayWindow = utcDayWindow(now);

          const account = await currentBucket(transaction, {
            scope: ACCOUNT_SCOPE,
            keyHash: accountHash,
            ...shortWindow,
            now,
          });
          const ip = await currentBucket(transaction, {
            scope: IP_SCOPE,
            keyHash: ipHash,
            ...shortWindow,
            now,
          });
          let global = await currentBucket(transaction, {
            scope: GLOBAL_SCOPE,
            keyHash: GLOBAL_KEY_HASH,
            ...dayWindow,
            now,
          });
          global = await reclaimExpiredReservations(transaction, global, now);
          await transaction.propertyAssistantUsageBucket.deleteMany({
            where: {
              scope: { in: [ACCOUNT_SCOPE, IP_SCOPE] },
              windowEnd: {
                lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000),
              },
            },
          });

          if (account.requestCount >= config.accountRequestLimit) {
            return {
              allowed: false,
              retryAfterSeconds: secondsUntil(account.windowEnd, now),
            };
          }
          if (ip.requestCount >= config.ipRequestLimit) {
            return {
              allowed: false,
              retryAfterSeconds: secondsUntil(ip.windowEnd, now),
            };
          }
          if (
            global.consumedTokenUnits +
              global.reservedTokenUnits +
              config.reservationTokenUnits >
            config.dailyTokenBudget
          ) {
            return {
              allowed: false,
              retryAfterSeconds: secondsUntil(global.windowEnd, now),
            };
          }

          await transaction.propertyAssistantUsageBucket.update({
            where: { id: account.id },
            data: { requestCount: { increment: 1 } },
          });
          await transaction.propertyAssistantUsageBucket.update({
            where: { id: ip.id },
            data: { requestCount: { increment: 1 } },
          });
          await transaction.propertyAssistantUsageBucket.update({
            where: { id: global.id },
            data: {
              requestCount: { increment: 1 },
              reservedTokenUnits: {
                increment: config.reservationTokenUnits,
              },
            },
          });
          await transaction.propertyAssistantUsageReservation.create({
            data: {
              id: reservationId,
              bucketId: global.id,
              tokenUnits: config.reservationTokenUnits,
              expiresAt: new Date(now.getTime() + config.reservationTtlMs),
            },
          });
          return { allowed: true, reservationId };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === 3) throw error;
    }
  }

  throw new Error("Property assistant usage reservation failed");
}

async function settleReservation(
  reservationId: string,
  consumedTokenUnits: number,
): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await db.$transaction(
        async (transaction) => {
          const reservation =
            await transaction.propertyAssistantUsageReservation.findUnique({
              where: { id: reservationId },
            });
          if (!reservation) return;

          const bucket =
            await transaction.propertyAssistantUsageBucket.findUnique({
              where: { id: reservation.bucketId },
            });
          if (bucket) {
            const chargedUnits = Math.max(0, Math.ceil(consumedTokenUnits));
            await transaction.propertyAssistantUsageBucket.update({
              where: { id: bucket.id },
              data: {
                reservedTokenUnits: Math.max(
                  0,
                  bucket.reservedTokenUnits - reservation.tokenUnits,
                ),
                consumedTokenUnits: { increment: chargedUnits },
              },
            });
          }
          await transaction.propertyAssistantUsageReservation.delete({
            where: { id: reservation.id },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return;
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === 3) throw error;
    }
  }
}

export function finalizePropertyAssistantUsage(
  reservationId: string,
  consumedTokenUnits: number,
): Promise<void> {
  return settleReservation(reservationId, consumedTokenUnits);
}

export function releasePropertyAssistantUsage(
  reservationId: string,
): Promise<void> {
  return settleReservation(reservationId, 0);
}
