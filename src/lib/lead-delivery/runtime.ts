import { randomUUID } from "node:crypto";

import {
  isLeadDeliveryEnabled,
  readLeadDeliveryWorkerOptions,
  readPowerAutomateConfig,
  readLeadDeliveryProvider,
  readZeptoMailConfig,
  type LeadDeliveryEnvironment,
} from "./config";
import { PowerAutomateLeadDeliveryTransport } from "./power-automate";
import { ZeptoMailLeadDeliveryTransport } from "./zeptomail";
import { ResendLeadDeliveryTransport } from "./resend";
import { readResendLeadConfig } from "./resend-config";
import { GoogleSheetsLeadDeliveryTransport } from "./google-sheets";
import { isGoogleSheetsDeliveryEnabled, readGoogleSheetsLeadConfig } from "./google-sheets-config";
import { LeadDeliveryError } from "./errors";
import { createPrismaLeadDeliveryOutboxRepository } from "./prisma-outbox";
import type {
  LeadDeliveryLogger,
  LeadDeliveryWorkerResult,
  LeadDeliveryTransport,
  LeadDeliveryDestination,
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

export function createConfiguredLeadDeliveryTransport(
  environment: LeadDeliveryEnvironment = process.env,
): LeadDeliveryTransport {
  const provider = readLeadDeliveryProvider(environment);
  if (provider === "resend") return new ResendLeadDeliveryTransport(readResendLeadConfig(environment));
  return provider === "zeptomail" ? new ZeptoMailLeadDeliveryTransport(readZeptoMailConfig(environment))
    : new PowerAutomateLeadDeliveryTransport(readPowerAutomateConfig(environment));
}

/** Resolve credentials only for the claimed destination, keeping failures independent. */
export function createDestinationLeadDeliveryTransport(
  environment: LeadDeliveryEnvironment = process.env,
): LeadDeliveryTransport {
  return {
    async deliver(payload, destination = "notification", context) {
      let transport: LeadDeliveryTransport;
      try {
        transport = destination === "google_sheets"
          ? new GoogleSheetsLeadDeliveryTransport(readGoogleSheetsLeadConfig(environment))
          : createConfiguredLeadDeliveryTransport(environment);
      } catch {
        throw new LeadDeliveryError(destination === "google_sheets" ? "SHEETS_CONFIG_INVALID" : "NOTIFICATION_CONFIG_INVALID", true);
      }
      await transport.deliver(payload, destination, context);
    },
  };
}

function configuredDependencies(
  environment: LeadDeliveryEnvironment,
  workerPrefix: string,
) {
  const workerId = `${workerPrefix}-${randomUUID()}`;
  const destinations: LeadDeliveryDestination[] = ["notification"];
  if (isGoogleSheetsDeliveryEnabled(environment)) destinations.push("google_sheets");
  return {
    repository: createPrismaLeadDeliveryOutboxRepository(undefined, destinations),
    transport: createDestinationLeadDeliveryTransport(environment),
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
