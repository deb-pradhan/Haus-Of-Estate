import { classifyDeliveryError } from "./errors";
import { isLeadDeliveryPayload } from "./payload";
import type {
  LeadDeliveryLogger,
  LeadDeliveryOutboxRecord,
  LeadDeliveryOutboxRepository,
  LeadDeliveryTransport,
  LeadDeliveryWorkerOptions,
  LeadDeliveryWorkerResult,
} from "./types";

export interface LeadDeliveryWorkerDependencies {
  repository: LeadDeliveryOutboxRepository;
  transport: LeadDeliveryTransport;
  logger: LeadDeliveryLogger;
  options: LeadDeliveryWorkerOptions;
  now?: () => Date;
}

type DeliveryOutcome = "delivered" | "retried" | "deadLettered" | "conflict";

export function calculateLeadDeliveryRetryDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponent = Math.max(0, Math.min(attempt - 1, 30));
  return Math.min(baseDelayMs * 2 ** exponent, maxDelayMs);
}

async function processClaimedRecord(
  record: LeadDeliveryOutboxRecord,
  dependencies: LeadDeliveryWorkerDependencies,
): Promise<DeliveryOutcome> {
  const { repository, transport, options } = dependencies;
  const now = dependencies.now ?? (() => new Date());

  if (!isLeadDeliveryPayload(record.payload)) {
    const changed = await repository.markDeadLetter(
      record.id,
      options.workerId,
      "INVALID_PAYLOAD",
    );
    return changed ? "deadLettered" : "conflict";
  }

  try {
    await transport.deliver(record.payload);
    const changed = await repository.markDelivered(
      record.id,
      options.workerId,
      now(),
    );
    return changed ? "delivered" : "conflict";
  } catch (error) {
    const failure = classifyDeliveryError(error);
    const canRetry = failure.retryable && record.attempts < options.maxAttempts;

    if (canRetry) {
      const delay = calculateLeadDeliveryRetryDelay(
        record.attempts,
        options.baseRetryDelayMs,
        options.maxRetryDelayMs,
      );
      const availableAt = new Date(now().getTime() + delay);
      const changed = await repository.releaseForRetry(
        record.id,
        options.workerId,
        availableAt,
        failure.code,
      );
      return changed ? "retried" : "conflict";
    }

    const changed = await repository.markDeadLetter(
      record.id,
      options.workerId,
      failure.code,
    );
    return changed ? "deadLettered" : "conflict";
  }
}

export async function processLeadDeliveryOutboxId(
  id: string,
  dependencies: LeadDeliveryWorkerDependencies,
): Promise<DeliveryOutcome | "notReady"> {
  const now = dependencies.now ?? (() => new Date());
  const record = await dependencies.repository.claim(
    id,
    dependencies.options.workerId,
    now(),
  );
  if (!record) return "notReady";
  return processClaimedRecord(record, dependencies);
}

export async function runLeadDeliveryWorker(
  dependencies: LeadDeliveryWorkerDependencies,
): Promise<LeadDeliveryWorkerResult> {
  const { repository, logger, options } = dependencies;
  const now = dependencies.now ?? (() => new Date());
  const startedAt = now();
  const staleBefore = new Date(startedAt.getTime() - options.leaseDurationMs);
  const result: LeadDeliveryWorkerResult = {
    recovered: await repository.recoverStaleLocks(staleBefore, startedAt),
    claimed: 0,
    delivered: 0,
    retried: 0,
    deadLettered: 0,
  };
  const readyIds = await repository.listReadyIds(startedAt, options.batchSize);

  for (const id of readyIds) {
    const outcome = await processLeadDeliveryOutboxId(id, dependencies);
    if (outcome === "notReady") continue;
    result.claimed += 1;
    if (outcome === "delivered") result.delivered += 1;
    if (outcome === "retried") result.retried += 1;
    if (outcome === "deadLettered") result.deadLettered += 1;
  }

  logger.info("lead_delivery_worker_complete", { ...result });
  return result;
}
