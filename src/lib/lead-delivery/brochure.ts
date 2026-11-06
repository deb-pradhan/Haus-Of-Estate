import { createHash } from "node:crypto";
import { z } from "zod";
import { BrochureStorageError, getApprovedBrochure } from "@/lib/brochures/catalog";
import { createBrochureDownloadUrl, readBrochureLinkConfig } from "@/lib/brochures/links";
import { renderBrochureEmail } from "@/lib/email/brochure";
import { readResendSettings } from "@/lib/email/resend-settings";
import type { LeadDeliveryEnvironment } from "./config";
import { LeadDeliveryError } from "./errors";
import type { LeadDeliveryContext, LeadDeliveryDestination, LeadDeliveryPayload, LeadDeliveryReceipt, LeadDeliveryTransport } from "./types";

const SAFE_RETRY_AGE_MS = 23 * 60 * 60 * 1_000;
const LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;

export function readBrochureEmailConfig(environment: LeadDeliveryEnvironment = process.env) {
  if (environment.BROCHURE_EMAIL_ENABLED !== "true") throw new Error("Brochure email is disabled");
  const sender = readResendSettings(environment);
  const replyTo = environment.BROCHURE_REPLY_TO?.trim().toLowerCase() ?? "";
  if (!z.email().safeParse(replyTo).success || !replyTo.endsWith("@hausofestate.com")) {
    throw new Error("BROCHURE_REPLY_TO must be a monitored Haus mailbox");
  }
  if (!environment.BROCHURE_CATALOG_PATH?.trim() || !environment.BROCHURE_FILES_ROOT?.trim() ||
      (environment.BROCHURE_LINK_SECRET?.trim().length ?? 0) < 32) {
    throw new Error("Private brochure storage and signing configuration required");
  }
  readBrochureLinkConfig(environment);
  const timeout = Number(environment.LEAD_DELIVERY_TIMEOUT_MS);
  return { ...sender, replyTo, timeoutMs: Number.isSafeInteger(timeout) && timeout > 0 && timeout <= 30_000 ? timeout : 8_000 };
}

/** Configuration only. DNS verification, storage approval and inbox receipt are separate checks. */
export function isBrochureEmailReady(environment: LeadDeliveryEnvironment = process.env): boolean {
  if (environment.LEAD_DELIVERY_ENABLED !== "true") return false;
  try { readBrochureEmailConfig(environment); return true; } catch { return false; }
}

/** Uses the existing bounded Resend HTTP pattern; recipients/selection come from saved validated intake. */
export class ResendBrochureDeliveryTransport implements LeadDeliveryTransport {
  constructor(
    private readonly environment: LeadDeliveryEnvironment = process.env,
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async deliver(payload: LeadDeliveryPayload, destination?: LeadDeliveryDestination, context?: LeadDeliveryContext): Promise<LeadDeliveryReceipt> {
    if (destination !== "customer_brochure" || !payload.brochure) throw new LeadDeliveryError("BROCHURE_INVALID_PAYLOAD", false);
    if (!context || !Number.isInteger(context.attempts) || context.attempts < 1) throw new LeadDeliveryError("BROCHURE_MISSING_ATTEMPT_CONTEXT", false);
    const age = this.now() - context.createdAt.getTime();
    if (!Number.isFinite(age) || age < -60_000 || age >= LINK_LIFETIME_MS ||
        (context.attempts > 1 && age >= SAFE_RETRY_AGE_MS)) {
      throw new LeadDeliveryError("BROCHURE_RETRY_REQUIRES_REVIEW", false);
    }
    let config: ReturnType<typeof readBrochureEmailConfig>;
    try { config = readBrochureEmailConfig(this.environment); }
    catch { throw new LeadDeliveryError("BROCHURE_CONFIG_INVALID", true); }
    const selection = payload.brochure;
    let downloadUrl: string;
    try {
      // Recheck approval at delivery, so withdrawn/replaced files cannot be sent from old queues.
      await getApprovedBrochure(selection.key, selection.revision, selection.projectSlug, this.environment);
      downloadUrl = createBrochureDownloadUrl(selection, payload.eventId, context.createdAt, this.environment);
    } catch (error) {
      if (error instanceof BrochureStorageError) throw new LeadDeliveryError("BROCHURE_STORAGE_UNAVAILABLE", true);
      throw new LeadDeliveryError("BROCHURE_NOT_APPROVED", false);
    }
    const email = renderBrochureEmail(selection, downloadUrl);
    const idempotencyKey = `haus-brochure-${createHash("sha256").update(payload.eventId).digest("hex")}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    timer.unref?.();
    try {
      const response = await this.fetchImplementation("https://api.resend.com/emails", {
        method: "POST", redirect: "error", signal: controller.signal,
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          from: `Haus of Estate <${config.fromEmail}>`,
          to: [selection.recipientEmail],
          reply_to: config.replyTo,
          ...email,
        }),
      });
      const raw: unknown = await response.json().catch(() => null);
      const ack = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
      if (!response.ok) throw new LeadDeliveryError(`BROCHURE_RESEND_HTTP_${response.status}`,
        response.status === 408 || response.status === 429 || response.status >= 500 ||
        (response.status === 409 && ack?.name === "concurrent_idempotent_requests"));
      if (!ack || ack.error || typeof ack.id !== "string" || !ack.id.trim()) {
        throw new LeadDeliveryError("BROCHURE_RESEND_INVALID_ACK", true);
      }
      return { provider: "resend", providerMessageId: ack.id };
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      throw new LeadDeliveryError(controller.signal.aborted ? "BROCHURE_RESEND_TIMEOUT" : "BROCHURE_RESEND_NETWORK", true);
    } finally { clearTimeout(timer); controller.abort(); }
  }
}
