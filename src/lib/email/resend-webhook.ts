import "server-only";
import { Resend } from "resend";
import { z } from "zod";
import { appendResendWebhookEvent } from "./resend-webhook-store";

export const RESEND_WEBHOOK_MAX_BYTES = 64 * 1024;

const deliveryEventTypes = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
] as const;

const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,255}$/);
const eventSchema = z.object({
  type: z.enum(deliveryEventTypes),
  created_at: z.iso.datetime({ offset: true }),
  data: z.object({ email_id: identifier }),
});

// Resend 6.25 requires a constructor key, even though webhooks.verify is entirely
// local. This noncredential is never used to call its sending or network APIs.
const verifier = new Resend("webhook-verification-only").webhooks;

class PayloadTooLargeError extends Error {}

async function readRawBody(request: Request): Promise<string> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > RESEND_WEBHOOK_MAX_BYTES) {
    throw new PayloadTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > RESEND_WEBHOOK_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        throw new PayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Reject invalid UTF-8 rather than replacing bytes before verification; keep
  // any BOM intact. Never parse and reserialize the signed request body.
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(Buffer.concat(chunks, size));
}

function response(body: Record<string, boolean | string>, status: number) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function receiveResendWebhook(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (
    process.env.RESEND_WEBHOOK_ENABLED !== "true" ||
    !secret ||
    !process.env.DATABASE_URL?.trim()
  ) {
    return response({ error: "Webhook unavailable" }, 503);
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!identifier.safeParse(id).success || !timestamp || !/^\d{1,12}$/.test(timestamp) || !signature) {
    return response({ error: "Invalid webhook signature" }, 401);
  }

  let payload: string;
  try {
    payload = await readRawBody(request);
  } catch (error) {
    return response(
      { error: error instanceof PayloadTooLargeError ? "Webhook payload too large" : "Invalid webhook body" },
      error instanceof PayloadTooLargeError ? 413 : 400,
    );
  }

  let event: unknown;
  try {
    event = verifier.verify({ payload, headers: { id: id!, timestamp, signature }, webhookSecret: secret });
  } catch {
    return response({ error: "Invalid webhook signature" }, 401);
  }

  const eventType = z.object({ type: z.string() }).safeParse(event);
  if (!eventType.success) return response({ error: "Invalid webhook event" }, 400);
  if (!deliveryEventTypes.some((type) => type === eventType.data.type)) {
    // Includes opens/clicks. Authenticate these requests, but never store their
    // payload, recipients or engagement data.
    return response({ ignored: true }, 200);
  }

  const parsed = eventSchema.safeParse(event);
  if (!parsed.success) return response({ error: "Invalid webhook event" }, 400);

  try {
    await appendResendWebhookEvent({
      svixId: id!,
      providerMessageId: parsed.data.data.email_id,
      eventType: parsed.data.type,
      occurredAt: new Date(parsed.data.created_at),
    });
  } catch {
    // Resend can retry later. Provider errors, payloads and recipient details
    // must not leak into logs or responses.
    return response({ error: "Webhook persistence unavailable" }, 503);
  }
  return response({ received: true }, 200);
}
