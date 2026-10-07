import "server-only";

export class PropertyAssistantConfigurationError extends Error {
  constructor() {
    super("Property assistant configuration is unavailable");
    this.name = "PropertyAssistantConfigurationError";
  }
}

const DEFAULT_MODEL = "openai/gpt-5.6-luna";
const OPENAI_GATEWAY_MODEL = /^openai\/[a-z0-9][a-z0-9._-]{0,80}$/;

function integerSetting(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new PropertyAssistantConfigurationError();
  }
  return parsed;
}

export interface PropertyAssistantConfig {
  model: string;
  maxBodyBytes: number;
  maxMessages: number;
  maxTextPartCharacters: number;
  maxInputCharacters: number;
  maxEstimatedInputTokens: number;
  maxOutputTokens: number;
  maxSteps: number;
  maxToolCalls: number;
  timeoutMs: number;
  firstChunkTimeoutMs: number;
  chunkTimeoutMs: number;
  toolTimeoutMs: number;
  usageWindowMs: number;
  accountRequestLimit: number;
  ipRequestLimit: number;
  dailyTokenBudget: number;
  reservationTokenUnits: number;
  reservationTtlMs: number;
}

export function getPropertyAssistantConfig(): PropertyAssistantConfig {
  const model = process.env.PROPERTY_ASSISTANT_MODEL?.trim() || DEFAULT_MODEL;
  if (!OPENAI_GATEWAY_MODEL.test(model)) {
    throw new PropertyAssistantConfigurationError();
  }
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new PropertyAssistantConfigurationError();
  }

  const maxOutputTokens = integerSetting(
    "PROPERTY_ASSISTANT_MAX_OUTPUT_TOKENS",
    800,
    256,
    1_000,
  );
  const maxSteps = 4;
  const maxEstimatedInputTokens = 4_000;
  // Covers the capped history, repeated system/tool context, and maximum
  // output across every allowed step before actual usage is known.
  const reservationFloor = Math.max(
    28_000,
    maxSteps * (maxEstimatedInputTokens + maxOutputTokens),
  );
  const reservationTokenUnits = integerSetting(
    "PROPERTY_ASSISTANT_TOKEN_RESERVATION",
    reservationFloor,
    reservationFloor,
    40_000,
  );

  return {
    model,
    maxBodyBytes: 48_000,
    maxMessages: 8,
    maxTextPartCharacters: 2_000,
    maxInputCharacters: 12_000,
    maxEstimatedInputTokens,
    maxOutputTokens,
    maxSteps,
    maxToolCalls: 3,
    timeoutMs: 35_000,
    firstChunkTimeoutMs: 12_000,
    chunkTimeoutMs: 10_000,
    toolTimeoutMs: 8_000,
    usageWindowMs: 10 * 60 * 1_000,
    accountRequestLimit: 12,
    ipRequestLimit: 20,
    dailyTokenBudget: integerSetting(
      "PROPERTY_ASSISTANT_DAILY_TOKEN_BUDGET",
      500_000,
      reservationTokenUnits,
      50_000_000,
    ),
    reservationTokenUnits,
    reservationTtlMs: 2 * 60 * 1_000,
  };
}

export function getPropertyAssistantUsageSecret(): string {
  const secret =
    process.env.PROPERTY_ASSISTANT_USAGE_SECRET ??
    process.env.AUTH_THROTTLE_SECRET ??
    process.env.AUTH_SECRET;
  if (secret?.trim()) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "development-only-property-assistant-usage-secret";
  }
  throw new PropertyAssistantConfigurationError();
}
