import type { LeadInterest, LeadSurface } from "./types";
import { trackAnalytics } from "@/lib/analytics";

export type LeadAnalyticsEventName =
  | "form_view"
  | "form_start"
  | "lead_submit_success"
  | "newsletter_opt_in";

interface LeadAnalyticsEvent {
  event: LeadAnalyticsEventName;
  form_name: "lead_eoi";
  form_version: string;
  surface: LeadSurface;
  interest?: LeadInterest;
  step?: number;
  has_project?: boolean;
}

/** The shared boundary drops events until analytics consent is granted. */
export function trackLeadEvent(
  event: LeadAnalyticsEventName,
  details: Omit<LeadAnalyticsEvent, "event" | "form_name">,
) {
  trackAnalytics(event, details);
}
