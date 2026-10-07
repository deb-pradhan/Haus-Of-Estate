import { z } from "zod";
import type { LeadDeliveryEnvironment } from "./config";
import { readResendSettings } from "../email/resend-settings";

export interface ResendLeadConfig {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  timeoutMs: number;
}

function companyMailbox(value: string | undefined, name: string): string {
  const address = value?.trim().toLowerCase() ?? "";
  if (
    !z.email().safeParse(address).success ||
    !address.endsWith("@hausofestate.com")
  ) {
    throw new Error(`${name} must be one @hausofestate.com email address`);
  }
  return address;
}

/** Configuration presence is not proof of domain verification or inbox receipt. */
export function readResendLeadConfig(
  environment: LeadDeliveryEnvironment = process.env,
): ResendLeadConfig {
  const { apiKey, fromEmail } = readResendSettings(environment);
  const timeout = Number(environment.LEAD_DELIVERY_TIMEOUT_MS);
  return {
    apiKey,
    fromEmail,
    toEmail: companyMailbox(
      environment.LEAD_NOTIFICATION_TO,
      "LEAD_NOTIFICATION_TO",
    ),
    timeoutMs:
      Number.isSafeInteger(timeout) && timeout > 0 && timeout <= 30_000
        ? timeout
        : 8_000,
  };
}
