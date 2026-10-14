import { z } from "zod";
import type { ZeptoMailConfig } from "./config";
import { LeadDeliveryError } from "./errors";
import type { LeadDeliveryPayload, LeadDeliveryTransport, LeadExcelRow } from "./types";

const EMAIL_FIELDS: Array<[string, keyof LeadExcelRow]> = [
  ["Submitted at", "submissionTime"], ["Lead ID", "leadId"],
  ["Name", "name"], ["Email", "email"], ["Phone", "phone"],
  ["Interest", "interest"], ["Country of interest", "market"],
  ["Location", "location"], ["Property type", "propertyType"],
  ["Bedrooms", "bedrooms"], ["Bathrooms", "bathrooms"],
  ["Timeframe", "timeframe"], ["Project", "project"],
  ["Property match opt-in", "propertyMatchOptIn"],
  ["Newsletter opt-in", "newsletterOptIn"],
  ["Overseas cash buyer", "overseasCashBuyer"],
  ["Source", "source"], ["Campaign", "campaign"],
  ["Landing page", "landingPage"], ["Status", "status"],
  ["Owner", "owner"], ["Enquiry message", "notes"],
];

function isAccepted(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return !response.error && response.object === "email" &&
    typeof response.request_id === "string" && response.request_id.trim().length > 0 &&
    Array.isArray(response.data) && response.data.length > 0 &&
    response.data.every((item: unknown) => Boolean(item) && typeof item === "object" &&
      (item as { code?: unknown }).code === "EM_104");
}

/** Sends only an operational team notification, never a customer campaign. */
export class ZeptoMailLeadDeliveryTransport implements LeadDeliveryTransport {
  constructor(
    private readonly config: ZeptoMailConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async deliver(payload: LeadDeliveryPayload): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    timer.unref?.();
    // Excel escaping is lossy: +alias and '+alias produce the same cell.
    // Never guess which mailbox was supplied; the original remains on the Lead.
    const replyEmail = /^'[=+\-@]/.test(payload.row.email)
      ? null
      : z.email().safeParse(payload.row.email);
    try {
      const response = await this.fetchImplementation(this.config.apiUrl, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Zoho-enczapikey ${this.config.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: { address: this.config.fromEmail, name: "Haus of Estate" },
          to: [{ email_address: { address: this.config.toEmail } }],
          ...(replyEmail?.success ? { reply_to: [{ address: replyEmail.data }] } : {}),
          subject: "New Haus of Estate enquiry",
          textbody: [
            "A website enquiry has been saved for your team to follow up.",
            `Delivery event: ${payload.eventId}`,
            "",
            ...EMAIL_FIELDS.map(([label, key]) => {
              const value = payload.row[key];
              return `${label}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : value || "—"}`;
            }),
          ].join("\n"),
          // This is a provider tracking reference, not an idempotency promise.
          client_reference: payload.eventId,
          track_clicks: false,
          track_opens: false,
        }),
      });
      if (!response.ok) {
        throw new LeadDeliveryError(
          `ZEPTOMAIL_HTTP_${response.status}`,
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }
      let acknowledgement: unknown;
      try {
        acknowledgement = await response.json();
      } catch {
        if (controller.signal.aborted) throw new LeadDeliveryError("ZEPTOMAIL_TIMEOUT", true);
        throw new LeadDeliveryError("ZEPTOMAIL_INVALID_ACK", true);
      }
      if (!isAccepted(acknowledgement)) throw new LeadDeliveryError("ZEPTOMAIL_INVALID_ACK", true);
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      throw new LeadDeliveryError(controller.signal.aborted ? "ZEPTOMAIL_TIMEOUT" : "ZEPTOMAIL_NETWORK", true);
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
}
