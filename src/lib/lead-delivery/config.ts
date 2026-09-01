import type { LeadDeliveryWorkerOptions } from "./types";

const DEFAULT_POWER_AUTOMATE_SCOPE =
  "https://service.flow.microsoft.com//.default";

export interface LeadDeliveryEnvironment {
  [key: string]: string | undefined;
  LEAD_DELIVERY_ENABLED?: string;
  LEAD_DELIVERY_BATCH_SIZE?: string;
  LEAD_DELIVERY_MAX_ATTEMPTS?: string;
  LEAD_DELIVERY_LEASE_SECONDS?: string;
  LEAD_DELIVERY_BASE_DELAY_SECONDS?: string;
  LEAD_DELIVERY_MAX_DELAY_SECONDS?: string;
  LEAD_DELIVERY_TIMEOUT_MS?: string;
  POWER_AUTOMATE_FLOW_URL?: string;
  POWER_AUTOMATE_TENANT_ID?: string;
  POWER_AUTOMATE_CLIENT_ID?: string;
  POWER_AUTOMATE_CLIENT_SECRET?: string;
  POWER_AUTOMATE_SCOPE?: string;
}

export interface PowerAutomateConfig {
  flowUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  timeoutMs: number;
}

function positiveInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    return fallback;
  }
  return parsed;
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

export function isLeadDeliveryEnabled(
  environment: LeadDeliveryEnvironment = process.env,
): boolean {
  return environment.LEAD_DELIVERY_ENABLED?.trim().toLowerCase() === "true";
}

export function readPowerAutomateConfig(
  environment: LeadDeliveryEnvironment = process.env,
): PowerAutomateConfig {
  const flowUrl = required(
    environment.POWER_AUTOMATE_FLOW_URL,
    "POWER_AUTOMATE_FLOW_URL",
  );
  const parsedFlowUrl = new URL(flowUrl);
  if (parsedFlowUrl.protocol !== "https:") {
    throw new Error("POWER_AUTOMATE_FLOW_URL must use HTTPS");
  }

  return {
    flowUrl: parsedFlowUrl.toString(),
    tenantId: required(
      environment.POWER_AUTOMATE_TENANT_ID,
      "POWER_AUTOMATE_TENANT_ID",
    ),
    clientId: required(
      environment.POWER_AUTOMATE_CLIENT_ID,
      "POWER_AUTOMATE_CLIENT_ID",
    ),
    clientSecret: required(
      environment.POWER_AUTOMATE_CLIENT_SECRET,
      "POWER_AUTOMATE_CLIENT_SECRET",
    ),
    scope:
      environment.POWER_AUTOMATE_SCOPE?.trim() || DEFAULT_POWER_AUTOMATE_SCOPE,
    timeoutMs: positiveInteger(
      environment.LEAD_DELIVERY_TIMEOUT_MS,
      8_000,
      30_000,
    ),
  };
}

export function readLeadDeliveryWorkerOptions(
  workerId: string,
  environment: LeadDeliveryEnvironment = process.env,
): LeadDeliveryWorkerOptions {
  return {
    workerId,
    batchSize: positiveInteger(
      environment.LEAD_DELIVERY_BATCH_SIZE,
      20,
      100,
    ),
    maxAttempts: positiveInteger(
      environment.LEAD_DELIVERY_MAX_ATTEMPTS,
      8,
      20,
    ),
    leaseDurationMs:
      positiveInteger(
        environment.LEAD_DELIVERY_LEASE_SECONDS,
        600,
        3_600,
      ) * 1_000,
    baseRetryDelayMs:
      positiveInteger(
        environment.LEAD_DELIVERY_BASE_DELAY_SECONDS,
        300,
        3_600,
      ) * 1_000,
    maxRetryDelayMs:
      positiveInteger(
        environment.LEAD_DELIVERY_MAX_DELAY_SECONDS,
        21_600,
        86_400,
      ) * 1_000,
  };
}
