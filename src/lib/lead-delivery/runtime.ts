import { randomUUID } from "node:crypto";

import {
  isLeadDeliveryEnabled,
  readLeadDeliveryWorkerOptions,
  readPowerAutomateConfig,
  type LeadDeliveryEnvironment,
} from "./config";
import { PowerAutomateLeadDeliveryTransport } from "./power-automate";
import { createPrismaLeadDeliveryOutboxRepository } from "./prisma-outbox";
import type {
  LeadDeliveryLogger,
  LeadDeliveryWorkerResult,
} from "./types";
import {
  processLeadDeliveryOutboxId,
  runLeadDeliveryWorker,
} from "./worker";

export const leadDeliveryLogger: LeadDeliveryLogger = {
  info(event, fields = {}) {
    console.info(JSON.stringify({ component: "lead-delivery", event, ...fields }));
  },
  error(event, fields = {}) {
    console.error(JSON.stringify({ component: "lead-delivery", event, ...fields }));
  },
};

function configuredDependencies(
  environment: LeadDeliveryEnvironment,
  workerPrefix: string,
) {
  const workerId = `${workerPrefix}-${randomUUID()}`;
  return {
    repository: createPrismaLeadDeliveryOutboxRepository(),
    transport: new PowerAutomateLeadDeliveryTransport(
      readPowerAutomateConfig(environment),
    ),
    logger: leadDeliveryLogger,
    options: readLeadDeliveryWorkerOptions(workerId, environment),
  };
}

export async function attemptImmediateLeadDelivery(
  outboxId: string,
  environment: LeadDeliveryEnvironment = process.env,
): Promise<"disabled" | "delivered" | "retried" | "deadLettered" | "conflict" | "notReady"> {
  if (!isLeadDeliveryEnabled(environment)) return "disabled";
  const dependencies = configuredDependencies(environment, "web");
  return processLeadDeliveryOutboxId(outboxId, dependencies);
}

export async function runConfiguredLeadDeliveryWorker(
  environment: LeadDeliveryEnvironment = process.env,
): Promise<LeadDeliveryWorkerResult | "disabled"> {
  if (!isLeadDeliveryEnabled(environment)) {
    leadDeliveryLogger.info("lead_delivery_worker_disabled");
    return "disabled";
  }
  return runLeadDeliveryWorker(configuredDependencies(environment, "cron"));
}
