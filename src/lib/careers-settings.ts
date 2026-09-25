import "server-only";
import { CAREERS_PUBLIC_ENABLED } from "@/lib/careers-availability";
import { HR_INBOX } from "@/lib/careers";
import { readResendSettings } from "@/lib/email/resend-settings";

export function isCareersIntakeEnabled(): boolean {
  if (!CAREERS_PUBLIC_ENABLED || process.env.CAREERS_INTAKE_ENABLED !== "true") return false;
  try {
    readResendSettings();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getCareersInbox());
  } catch {
    return false;
  }
}

export function getCareersInbox(): string {
  return process.env.CAREERS_EMAIL?.trim() || HR_INBOX;
}
