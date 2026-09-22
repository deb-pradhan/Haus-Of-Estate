import "server-only";
import { CAREERS_PUBLIC_ENABLED } from "@/lib/careers-availability";
import { HR_INBOX } from "@/lib/careers";

export function isCareersIntakeEnabled(): boolean {
  return CAREERS_PUBLIC_ENABLED && process.env.CAREERS_INTAKE_ENABLED === "true";
}

export function getCareersInbox(): string {
  return process.env.CAREERS_EMAIL?.trim() || HR_INBOX;
}
