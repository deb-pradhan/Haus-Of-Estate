import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  clientIp: vi.fn(() => "203.0.113.8"),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/auth/request-security", () => ({
  getClientIp: mocks.clientIp,
}));

import { getPropertyAssistantConfig } from "@/lib/property-assistant/config";
import {
  finalizePropertyAssistantUsage,
  releasePropertyAssistantUsage,
  reservePropertyAssistantUsage,
} from "@/lib/property-assistant/usage";

type Bucket = {
  id: string;
  scope: string;
  keyHash: string;
  windowStart: Date;
  windowEnd: Date;
  requestCount: number;
  reservedTokenUnits: number;
  consumedTokenUnits: number;
  createdAt: Date;
  updatedAt: Date;
};

type Reservation = {
  id: string;
  bucketId: string;
  tokenUnits: number;
  expiresAt: Date;
  createdAt: Date;
};

function makeDatabaseHarness() {
  const buckets: Bucket[] = [];
  const reservations: Reservation[] = [];
  let bucketSequence = 0;

  function updateBucket(bucket: Bucket, data: Record<string, unknown>) {
    for (const [key, value] of Object.entries(data)) {
      if (
        isIncrement(value) &&
        (key === "requestCount" ||
          key === "reservedTokenUnits" ||
          key === "consumedTokenUnits")
      ) {
        bucket[key] += value.increment;
      } else {
        Reflect.set(bucket, key, value);
      }
    }
    bucket.updatedAt = new Date();
    return { ...bucket };
  }

  const tx = {
    propertyAssistantUsageBucket: {
      findUnique: vi.fn(async ({ where }) => {
        const match = where.scope_keyHash
          ? buckets.find(
              (bucket) =>
                bucket.scope === where.scope_keyHash.scope &&
                bucket.keyHash === where.scope_keyHash.keyHash,
            )
          : buckets.find((bucket) => bucket.id === where.id);
        return match ? { ...match } : null;
      }),
      create: vi.fn(async ({ data }) => {
        const now = new Date();
        const bucket: Bucket = {
          id: `bucket-${++bucketSequence}`,
          scope: data.scope,
          keyHash: data.keyHash,
          windowStart: data.windowStart,
          windowEnd: data.windowEnd,
          requestCount: data.requestCount ?? 0,
          reservedTokenUnits: data.reservedTokenUnits ?? 0,
          consumedTokenUnits: data.consumedTokenUnits ?? 0,
          createdAt: now,
          updatedAt: now,
        };
        buckets.push(bucket);
        return { ...bucket };
      }),
      update: vi.fn(async ({ where, data }) => {
        const bucket = buckets.find((candidate) => candidate.id === where.id);
        if (!bucket) throw new Error("missing bucket");
        return updateBucket(bucket, data);
      }),
      deleteMany: vi.fn(async ({ where }) => {
        const before = buckets.length;
        for (let index = buckets.length - 1; index >= 0; index -= 1) {
          const bucket = buckets[index];
          if (
            bucket &&
            where.scope.in.includes(bucket.scope) &&
            bucket.windowEnd < where.windowEnd.lt
          ) {
            buckets.splice(index, 1);
          }
        }
        return { count: before - buckets.length };
      }),
    },
    propertyAssistantUsageReservation: {
      findMany: vi.fn(async ({ where }) =>
        reservations
          .filter(
            (reservation) =>
              reservation.bucketId === where.bucketId &&
              reservation.expiresAt <= where.expiresAt.lte,
          )
          .map((reservation) => ({
            id: reservation.id,
            tokenUnits: reservation.tokenUnits,
          })),
      ),
      create: vi.fn(async ({ data }) => {
        const reservation = { ...data, createdAt: new Date() };
        reservations.push(reservation);
        return { ...reservation };
      }),
      findUnique: vi.fn(async ({ where }) => {
        const reservation = reservations.find(
          (candidate) => candidate.id === where.id,
        );
        return reservation ? { ...reservation } : null;
      }),
      delete: vi.fn(async ({ where }) => {
        const index = reservations.findIndex(
          (reservation) => reservation.id === where.id,
        );
        if (index < 0) throw new Error("missing reservation");
        return reservations.splice(index, 1)[0];
      }),
      deleteMany: vi.fn(async ({ where }) => {
        const ids = where.id?.in as string[] | undefined;
        const before = reservations.length;
        for (let index = reservations.length - 1; index >= 0; index -= 1) {
          const reservation = reservations[index];
          if (
            reservation &&
            (reservation.bucketId === where.bucketId ||
              (ids?.includes(reservation.id) ?? false))
          ) {
            reservations.splice(index, 1);
          }
        }
        return { count: before - reservations.length };
      }),
    },
  };

  const runTransaction = async (operation: (client: typeof tx) => unknown) =>
    operation(tx);
  return { buckets, reservations, tx, runTransaction };
}

function isIncrement(value: unknown): value is { increment: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "increment" in value &&
    typeof (value as { increment?: unknown }).increment === "number"
  );
}

function request() {
  return new Request("https://hausofestate.com/api/property-assistant");
}

describe("property assistant database usage controls", () => {
  let harness: ReturnType<typeof makeDatabaseHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));
    vi.stubEnv("AI_GATEWAY_API_KEY", "unit-test-gateway-key");
    vi.stubEnv("PROPERTY_ASSISTANT_USAGE_SECRET", "unit-test-usage-secret");
    harness = makeDatabaseHarness();
    mocks.transaction.mockImplementation(harness.runTransaction);
    mocks.clientIp.mockReturnValue("203.0.113.8");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("enforces independent account and IP request windows", async () => {
    const base = getPropertyAssistantConfig();
    const accountLimited = {
      ...base,
      accountRequestLimit: 1,
      ipRequestLimit: 100,
    };
    expect(
      (await reservePropertyAssistantUsage(request(), "user-a", accountLimited))
        .allowed,
    ).toBe(true);
    expect(
      (await reservePropertyAssistantUsage(request(), "user-a", accountLimited))
        .allowed,
    ).toBe(false);

    harness = makeDatabaseHarness();
    mocks.transaction.mockImplementation(harness.runTransaction);
    const ipLimited = {
      ...base,
      accountRequestLimit: 100,
      ipRequestLimit: 1,
    };
    expect(
      (await reservePropertyAssistantUsage(request(), "user-a", ipLimited))
        .allowed,
    ).toBe(true);
    expect(
      (await reservePropertyAssistantUsage(request(), "user-b", ipLimited))
        .allowed,
    ).toBe(false);

    expect(JSON.stringify(harness.buckets)).not.toContain("user-b");
    expect(JSON.stringify(harness.buckets)).not.toContain("203.0.113.8");
    expect(harness.buckets.every((bucket) => /^[a-f0-9]{64}$/.test(bucket.keyHash)))
      .toBe(true);
  });

  it("reserves the global daily budget and charges expired leases conservatively", async () => {
    const base = getPropertyAssistantConfig();
    const config = {
      ...base,
      accountRequestLimit: 100,
      ipRequestLimit: 100,
      dailyTokenBudget: base.reservationTokenUnits,
    };
    expect(
      (await reservePropertyAssistantUsage(request(), "user-a", config)).allowed,
    ).toBe(true);
    const denied = await reservePropertyAssistantUsage(
      request(),
      "user-b",
      config,
    );
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) expect(denied.retryAfterSeconds).toBeGreaterThan(0);

    vi.advanceTimersByTime(config.reservationTtlMs + 1);
    const afterExpiry = await reservePropertyAssistantUsage(
      request(),
      "user-b",
      config,
    );
    expect(afterExpiry.allowed).toBe(false);
    expect(harness.reservations).toHaveLength(0);
    expect(
      harness.buckets.find((bucket) => bucket.scope.includes("GLOBAL")),
    ).toMatchObject({
      consumedTokenUnits: config.reservationTokenUnits,
      reservedTokenUnits: 0,
    });
  });

  it("keeps the global daily budget intact when the HMAC secret rotates", async () => {
    const base = getPropertyAssistantConfig();
    const config = {
      ...base,
      accountRequestLimit: 100,
      ipRequestLimit: 100,
      dailyTokenBudget: base.reservationTokenUnits,
    };

    expect(
      (await reservePropertyAssistantUsage(request(), "user-a", config)).allowed,
    ).toBe(true);

    vi.stubEnv("PROPERTY_ASSISTANT_USAGE_SECRET", "rotated-usage-secret");
    mocks.clientIp.mockReturnValue("203.0.113.99");
    const afterRotation = await reservePropertyAssistantUsage(
      request(),
      "user-b",
      config,
    );

    expect(afterRotation.allowed).toBe(false);
    expect(
      harness.buckets.filter((bucket) => bucket.scope === "PROPERTY_ASSISTANT_GLOBAL_DAILY"),
    ).toHaveLength(1);
  });

  it("settles and releases reservations idempotently", async () => {
    const config = getPropertyAssistantConfig();
    const first = await reservePropertyAssistantUsage(
      request(),
      "user-a",
      config,
    );
    expect(first.allowed).toBe(true);
    if (!first.allowed) return;

    await finalizePropertyAssistantUsage(first.reservationId, 321);
    await finalizePropertyAssistantUsage(first.reservationId, 999);
    const global = harness.buckets.find((bucket) =>
      bucket.scope.includes("GLOBAL"),
    );
    expect(global).toMatchObject({
      consumedTokenUnits: 321,
      reservedTokenUnits: 0,
    });

    const second = await reservePropertyAssistantUsage(
      request(),
      "user-b",
      config,
    );
    expect(second.allowed).toBe(true);
    if (!second.allowed) return;
    await releasePropertyAssistantUsage(second.reservationId);
    await releasePropertyAssistantUsage(second.reservationId);
    expect(global).toMatchObject({
      consumedTokenUnits: 321,
      reservedTokenUnits: 0,
    });
    expect(harness.reservations).toHaveLength(0);
  });

  it("records actual usage above the reserved estimate", async () => {
    const config = getPropertyAssistantConfig();
    const decision = await reservePropertyAssistantUsage(
      request(),
      "user-a",
      config,
    );
    expect(decision.allowed).toBe(true);
    if (!decision.allowed) return;

    const actualUsage = config.reservationTokenUnits + 1_234;
    await finalizePropertyAssistantUsage(decision.reservationId, actualUsage);

    const global = harness.buckets.find((bucket) =>
      bucket.scope.includes("GLOBAL"),
    );
    expect(global).toMatchObject({
      consumedTokenUnits: actualUsage,
      reservedTokenUnits: 0,
    });
    expect(harness.reservations).toHaveLength(0);
  });

  it("retries a serializable conflict without double-counting", async () => {
    mocks.transaction
      .mockImplementationOnce(async () => {
        throw Object.assign(new Error("serialization conflict"), {
          code: "P2034",
        });
      })
      .mockImplementation(harness.runTransaction);

    const decision = await reservePropertyAssistantUsage(
      request(),
      "user-a",
      getPropertyAssistantConfig(),
    );

    expect(decision.allowed).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(harness.reservations).toHaveLength(1);
  });
});
