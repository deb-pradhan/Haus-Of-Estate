import "server-only";
import { db } from "@/lib/db";

export interface ResendWebhookReceipt {
  svixId: string;
  providerMessageId: string;
  eventType: string;
  occurredAt: Date;
}

export async function appendResendWebhookEvent(receipt: ResendWebhookReceipt) {
  // A unique svixId makes concurrent retries harmless. Do not update an existing
  // receipt or require an outbox row: delivery evidence can arrive first.
  return db.resendWebhookEvent.createMany({ data: receipt, skipDuplicates: true });
}
