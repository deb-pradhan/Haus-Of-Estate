import { describe, expect, it, vi } from "vitest";

import { LeadDeliveryError } from "./errors";
import { buildLeadDeliveryPayload } from "./payload";
import type {
  LeadDeliveryLogger,
  LeadDeliveryOutboxRecord,
  LeadDeliveryOutboxRepository,
  LeadDeliveryTransport,
} from "./types";
import {
  calculateLeadDeliveryRetryDelay,
  processLeadDeliveryOutboxId,
  runLeadDeliveryWorker,
  type LeadDeliveryWorkerDependencies,
} from "./worker";

const now = new Date("2026-08-29T12:00:00.000Z");

function makeRecord(
  overrides: Partial<LeadDeliveryOutboxRecord> = {},
): LeadDeliveryOutboxRecord {
  return {
    id: "event-1",
    leadId: "lead-1",
    payload: buildLeadDeliveryPayload({
      eventId: "event-1",
      leadId: "lead-1",
      submittedAt: now,
      firstName: "Surya",
      email: "person@example.com",
      interest: "buy",
      newsletterOptIn: false,
    }),
    status: "PROCESSING",
    attempts: 1,
    availableAt: now,
    lockedAt: now,
    lockedBy: "worker-1",
    deliveredAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function dependencies(
  record: LeadDeliveryOutboxRecord | null,
  deliver = vi.fn().mockResolvedValue(undefined),
) {
  const repository: LeadDeliveryOutboxRepository = {
    recoverStaleLocks: vi.fn().mockResolvedValue(0),
    listReadyIds: vi.fn().mockResolvedValue(record ? [record.id] : []),
    claim: vi.fn().mockResolvedValue(record),
    markDelivered: vi.fn().mockResolvedValue(true),
    releaseForRetry: vi.fn().mockResolvedValue(true),
    markDeadLetter: vi.fn().mockResolvedValue(true),
  };
  const transport: LeadDeliveryTransport = { deliver };
  const logger: LeadDeliveryLogger = {
    info: vi.fn(),
    error: vi.fn(),
  };
  const value: LeadDeliveryWorkerDependencies = {
    repository,
    transport,
    logger,
    now: () => now,
    options: {
      workerId: "worker-1",
      batchSize: 20,
      maxAttempts: 8,
      leaseDurationMs: 600_000,
      baseRetryDelayMs: 300_000,
      maxRetryDelayMs: 21_600_000,
    },
  };
  return { value, repository, transport, logger };
}

describe("lead delivery worker", () => {
  it("recovers stale locks, claims a bounded batch, and marks success", async () => {
    const setup = dependencies(makeRecord());
    vi.mocked(setup.repository.recoverStaleLocks).mockResolvedValue(2);

    const result = await runLeadDeliveryWorker(setup.value);

    expect(setup.repository.recoverStaleLocks).toHaveBeenCalledWith(
      new Date("2026-08-29T11:50:00.000Z"),
      now,
    );
    expect(setup.repository.listReadyIds).toHaveBeenCalledWith(now, 20);
    expect(setup.repository.markDelivered).toHaveBeenCalledWith(
      "event-1",
      "worker-1",
      now,
    );
    expect(result).toEqual({
      recovered: 2,
      claimed: 1,
      delivered: 1,
      retried: 0,
      deadLettered: 0,
    });
    expect(JSON.stringify(vi.mocked(setup.logger.info).mock.calls)).not.toContain(
      "person@example.com",
    );
  });

  it("backs off retryable failures and stores only an error code", async () => {
    const deliver = vi
      .fn()
      .mockRejectedValue(new LeadDeliveryError("FLOW_HTTP_503", true));
    const setup = dependencies(makeRecord({ attempts: 2 }), deliver);

    const outcome = await processLeadDeliveryOutboxId(
      "event-1",
      setup.value,
    );

    expect(outcome).toBe("retried");
    expect(setup.repository.releaseForRetry).toHaveBeenCalledWith(
      "event-1",
      "worker-1",
      new Date("2026-08-29T12:10:00.000Z"),
      "FLOW_HTTP_503",
    );
  });

  it("dead-letters permanent failures and exhausted retries", async () => {
    const permanent = dependencies(
      makeRecord(),
      vi.fn().mockRejectedValue(new LeadDeliveryError("FLOW_HTTP_400", false)),
    );
    await expect(
      processLeadDeliveryOutboxId("event-1", permanent.value),
    ).resolves.toBe("deadLettered");
    expect(permanent.repository.markDeadLetter).toHaveBeenCalledWith(
      "event-1",
      "worker-1",
      "FLOW_HTTP_400",
    );

    const exhausted = dependencies(
      makeRecord({ attempts: 8 }),
      vi.fn().mockRejectedValue(new LeadDeliveryError("FLOW_HTTP_503", true)),
    );
    await expect(
      processLeadDeliveryOutboxId("event-1", exhausted.value),
    ).resolves.toBe("deadLettered");
  });

  it("dead-letters invalid snapshots without contacting Power Automate", async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const setup = dependencies(makeRecord({ payload: { email: "private" } }), deliver);

    await expect(
      processLeadDeliveryOutboxId("event-1", setup.value),
    ).resolves.toBe("deadLettered");
    expect(deliver).not.toHaveBeenCalled();
    expect(setup.repository.markDeadLetter).toHaveBeenCalledWith(
      "event-1",
      "worker-1",
      "INVALID_PAYLOAD",
    );
  });

  it("does not process a row another worker already claimed", async () => {
    const setup = dependencies(null);
    await expect(
      processLeadDeliveryOutboxId("event-1", setup.value),
    ).resolves.toBe("notReady");
    expect(setup.transport.deliver).not.toHaveBeenCalled();
  });

  it("caps exponential retry delay", () => {
    expect(calculateLeadDeliveryRetryDelay(1, 300_000, 21_600_000)).toBe(
      300_000,
    );
    expect(calculateLeadDeliveryRetryDelay(2, 300_000, 21_600_000)).toBe(
      600_000,
    );
    expect(calculateLeadDeliveryRetryDelay(20, 300_000, 21_600_000)).toBe(
      21_600_000,
    );
  });
});
