import { createHash } from "node:crypto";
import { z } from "zod";
import type { ResendLeadConfig } from "./resend-config";
import { LeadDeliveryError } from "./errors";
import type {
  LeadDeliveryPayload,
  LeadDeliveryDestination,
  LeadDeliveryTransport,
  LeadExcelRow,
} from "./types";

const EMAIL_FIELDS: Array<[string, keyof LeadExcelRow]> = [
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

// Resend retains keys for 24 hours. Use a conservative outbox-age bound with
// one hour of margin; older ambiguous attempts require operator reconciliation.
const SAFE_RETRY_AGE_MS = 23 * 60 * 60 * 1000;
type AttemptContext = { attempts: number; createdAt: Date };

/** Operational staff notification only. Provider acceptance is not inbox receipt. */
export class ResendLeadDeliveryTransport implements LeadDeliveryTransport {
  constructor(
    private readonly config: ResendLeadConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async deliver(
    payload: LeadDeliveryPayload,
    destination: LeadDeliveryDestination = "notification",
    context?: AttemptContext,
  ): Promise<void> {
    if (destination !== "notification")
      throw new LeadDeliveryError("RESEND_WRONG_DESTINATION", false);
    if (
      !context ||
      !Number.isInteger(context.attempts) ||
      context.attempts < 1
    ) {
      throw new LeadDeliveryError("RESEND_MISSING_ATTEMPT_CONTEXT", false);
    }
    const age = this.now() - context.createdAt.getTime();
    if (
      !Number.isFinite(age) ||
      age < -60_000 ||
      (context.attempts > 1 && age >= SAFE_RETRY_AGE_MS)
    ) {
      throw new LeadDeliveryError("RESEND_RETRY_REQUIRES_REVIEW", false);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    timer.unref?.();
    // The legacy Excel-safe payload cannot distinguish +alias from '+alias.
    // Do not guess a reply address when it has been escaped.
    const replyEmail = /^'[=+\-@]/.test(payload.row.email)
      ? null
      : z.email().safeParse(payload.row.email);
    const idempotencyKey = `haus-lead-${createHash("sha256").update(payload.eventId).digest("hex")}`;
    try {
      const response = await this.fetchImplementation(
        "https://api.resend.com/emails",
        {
          method: "POST",
          redirect: "error",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            from: `Haus of Estate <${this.config.fromEmail}>`,
            to: [this.config.toEmail],
            ...(replyEmail?.success ? { reply_to: replyEmail.data } : {}),
            subject: "New Haus of Estate enquiry",
            text: [
              "A website enquiry has been saved for your team to follow up.",
              `Delivery event: ${payload.eventId}`,
              "",
              ...EMAIL_FIELDS.map(([label, key]) => {
                const value = payload.row[key];
                return `${label}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : value || "—"}`;
              }),
            ].join("\n"),
          }),
        },
      );
      const acknowledgement: unknown = await response.json().catch(() => null);
      const result =
        acknowledgement && typeof acknowledgement === "object"
          ? (acknowledgement as Record<string, unknown>)
          : null;
      if (!response.ok) {
        throw new LeadDeliveryError(
          `RESEND_HTTP_${response.status}`,
          response.status === 408 ||
            response.status === 429 ||
            response.status >= 500 ||
            (response.status === 409 &&
              result?.name === "concurrent_idempotent_requests"),
        );
      }
      if (
        !result ||
        result.error ||
        typeof result.id !== "string" ||
        !result.id.trim()
      ) {
        throw new LeadDeliveryError("RESEND_INVALID_ACK", true);
      }
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      throw new LeadDeliveryError(
        controller.signal.aborted ? "RESEND_TIMEOUT" : "RESEND_NETWORK",
        true,
      );
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
}
