import "server-only";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { getClientIp } from "@/lib/auth/request-security";
import {
  getTurnstileServerConfig,
  isBotProtectionEnabled,
} from "./config";
import type {
  BotChallengeResult,
  BotProtectionAction,
} from "./types";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TOKEN_MAX_LENGTH = 2_048;
const VERIFY_TIMEOUT_MS = 5_000;
const PROVIDER_CONFIGURATION_ERRORS = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "sitekey-secret-mismatch",
  "invalid-input-idempotency-key",
  "bad-request",
]);

type SiteverifyResponse = {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
  "error-codes"?: unknown;
};

function unavailable(): BotChallengeResult {
  return { ok: false, reason: "unavailable" };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function postSiteverify(body: URLSearchParams): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    return await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestSiteverify(
  body: URLSearchParams,
): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await postSiteverify(body);
      if (response.ok || !isRetryableStatus(response.status) || attempt === 1) {
        return response;
      }
    } catch {
      if (attempt === 1) return null;
    }
  }

  return null;
}

export async function verifyBotChallenge(input: {
  request: Request;
  token: unknown;
  action: BotProtectionAction;
}): Promise<BotChallengeResult> {
  if (!isBotProtectionEnabled()) return { ok: true, skipped: true };

  if (
    typeof input.token !== "string" ||
    input.token.trim().length === 0 ||
    input.token.trim().length > TOKEN_MAX_LENGTH
  ) {
    return { ok: false, reason: "missing" };
  }

  let config: ReturnType<typeof getTurnstileServerConfig>;
  try {
    config = getTurnstileServerConfig();
  } catch {
    return unavailable();
  }

  const body = new URLSearchParams({
    secret: config.secretKey,
    response: input.token.trim(),
    idempotency_key: randomUUID(),
  });

  try {
    const clientIp = getClientIp(input.request);
    if (isIP(clientIp)) body.set("remoteip", clientIp);
  } catch {
    return unavailable();
  }

  const response = await requestSiteverify(body);
  if (!response?.ok) return unavailable();

  let result: SiteverifyResponse;
  try {
    result = (await response.json()) as SiteverifyResponse;
  } catch {
    return unavailable();
  }

  if (typeof result !== "object" || result === null) return unavailable();

  if (result.success !== true) {
    const codes = Array.isArray(result["error-codes"])
      ? result["error-codes"]
      : [];
    return codes.some(
      (code) =>
        code === "internal-error" ||
        (typeof code === "string" &&
          PROVIDER_CONFIGURATION_ERRORS.has(code)),
    )
      ? unavailable()
      : { ok: false, reason: "rejected" };
  }

  if (
    result.action !== input.action ||
    typeof result.hostname !== "string" ||
    !config.allowedHostnames.has(result.hostname.toLowerCase().replace(/\.$/, ""))
  ) {
    return { ok: false, reason: "rejected" };
  }

  return { ok: true, skipped: false };
}
