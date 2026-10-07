import "server-only";

import { isIP } from "node:net";
import { AuthConfigurationError } from "@/lib/auth/errors";
import type { BotProtectionClientConfig } from "./types";

const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "1x00000000000000000000BB",
  "2x00000000000000000000AB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);
const TURNSTILE_TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

type TurnstileServerConfig = {
  siteKey: string;
  secretKey: string;
  allowedHostnames: ReadonlySet<string>;
};

export function isBotProtectionEnabled(): boolean {
  return process.env.BOT_PROTECTION_ENABLED === "true";
}

function normalizeHostname(value: string): string | null {
  const hostname = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname.includes(":") ||
    hostname.includes("/") ||
    hostname.includes("*") ||
    /\s/.test(hostname)
  ) {
    return null;
  }

  const labels = hostname.split(".");
  const valid = labels.every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
  return valid && hostname.length <= 253 ? hostname : null;
}

export function getTurnstileServerConfig(): TurnstileServerConfig {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  const configuredHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map(normalizeHostname);

  if (!siteKey || !secretKey) {
    throw new AuthConfigurationError("TURNSTILE_CREDENTIALS_MISSING");
  }

  if (
    configuredHostnames.length === 0 ||
    configuredHostnames.some((hostname) => hostname === null)
  ) {
    throw new AuthConfigurationError("TURNSTILE_HOSTNAMES_INVALID");
  }

  const allowedHostnames = new Set(configuredHostnames as string[]);
  if (process.env.NODE_ENV === "production") {
    if (
      TURNSTILE_TEST_SITE_KEYS.has(siteKey) ||
      TURNSTILE_TEST_SECRET_KEYS.has(secretKey)
    ) {
      throw new AuthConfigurationError("TURNSTILE_TEST_KEY_IN_PRODUCTION");
    }

    if (
      [...allowedHostnames].some(
        (hostname) => hostname === "localhost" || isIP(hostname) !== 0,
      )
    ) {
      throw new AuthConfigurationError("TURNSTILE_LOCAL_HOST_IN_PRODUCTION");
    }
  }

  return { siteKey, secretKey, allowedHostnames };
}

export function getBotProtectionClientConfig(): BotProtectionClientConfig {
  if (!isBotProtectionEnabled()) return { enabled: false };

  try {
    const { siteKey } = getTurnstileServerConfig();
    return { enabled: true, siteKey };
  } catch {
    return { enabled: true, siteKey: null };
  }
}
