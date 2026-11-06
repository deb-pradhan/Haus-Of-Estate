import "server-only";
import { CAREERS_PUBLIC_ENABLED } from "@/lib/careers-availability";
import { HR_INBOX } from "@/lib/careers";
import { readResendSettings } from "@/lib/email/resend-settings";

export function isCareersIntakeEnabled(): boolean {
  if (!CAREERS_PUBLIC_ENABLED || process.env.CAREERS_INTAKE_ENABLED !== "true") return false;
  // A stale or conflicting setting must never reroute applicant information.
  const configuredInbox = process.env.CAREERS_EMAIL?.trim().toLowerCase();
  if (configuredInbox && configuredInbox !== HR_INBOX) return false;
  try {
    readResendSettings();
    return true;
  } catch {
    return false;
  }
}

export function getCareersInbox(): string {
  return HR_INBOX;
}
