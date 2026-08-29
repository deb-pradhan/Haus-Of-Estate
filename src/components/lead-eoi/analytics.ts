import type { LeadInterest, LeadSurface } from "./types";

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

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Pushes a deliberately small, PII-free event shape for GTM consumers. */
export function trackLeadEvent(
  event: LeadAnalyticsEventName,
  details: Omit<LeadAnalyticsEvent, "event" | "form_name">,
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    form_name: "lead_eoi",
    ...details,
  });
}
