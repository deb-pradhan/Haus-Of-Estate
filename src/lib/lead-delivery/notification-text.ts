import type { LeadDeliveryPayload, LeadExcelRow } from "./types";

/** Labelled lines of the staff notification, in the order the email prints them. */
export const LEAD_NOTIFICATION_FIELDS: ReadonlyArray<[string, keyof LeadExcelRow]> = [
  ["Submitted at", "submissionTime"],
  ["Lead ID", "leadId"],
  ["Name", "name"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Interest", "interest"],
  ["Country of interest", "market"],
  ["Location", "location"],
  ["Property type", "propertyType"],
  ["Bedrooms", "bedrooms"],
  ["Bathrooms", "bathrooms"],
  ["Timeframe", "timeframe"],
  ["Project", "project"],
  ["Property match opt-in", "propertyMatchOptIn"],
  ["Newsletter opt-in", "newsletterOptIn"],
  ["Overseas cash buyer", "overseasCashBuyer"],
  ["Source", "source"],
  ["Campaign", "campaign"],
  ["Landing page", "landingPage"],
  ["Status", "status"],
  ["Owner", "owner"],
  ["Enquiry message", "notes"],
];

export const LEAD_NOTIFICATION_SUBJECT = "New Haus of Estate enquiry";

/** Plain-text body of the sales notification; shared by the transport and previews. */
export function leadNotificationText(payload: LeadDeliveryPayload): string {
  return [
    "A website enquiry has been saved for your team to follow up.",
    `Delivery event: ${payload.eventId}`,
    "",
    ...LEAD_NOTIFICATION_FIELDS.map(([label, key]) => {
      const value = payload.row[key];
      return `${label}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : value || "—"}`;
    }),
  ].join("\n");
}
