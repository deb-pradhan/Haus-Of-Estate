-- Append-only delivery evidence; no FK because webhooks can precede the outbox receipt.
CREATE TABLE "ResendWebhookEvent" (
    "svixId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResendWebhookEvent_pkey" PRIMARY KEY ("svixId"),
    CONSTRAINT "ResendWebhookEvent_eventType_check" CHECK (
        "eventType" IN (
            'email.sent', 'email.delivered', 'email.delivery_delayed',
            'email.bounced', 'email.complained', 'email.failed', 'email.suppressed'
        )
    )
);

CREATE INDEX "ResendWebhookEvent_providerMessageId_idx"
    ON "ResendWebhookEvent"("providerMessageId");
CREATE INDEX "LeadDeliveryOutbox_providerMessageId_idx"
    ON "LeadDeliveryOutbox"("providerMessageId");
