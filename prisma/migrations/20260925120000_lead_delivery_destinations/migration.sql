-- Preserve every existing outbox record and its delivery/retry state.
ALTER TABLE "LeadDeliveryOutbox"
  ADD COLUMN "destination" TEXT NOT NULL DEFAULT 'notification';

-- One independent lease, retry history and receipt per lead and destination.
CREATE UNIQUE INDEX "LeadDeliveryOutbox_leadId_destination_key"
  ON "LeadDeliveryOutbox"("leadId", "destination");
DROP INDEX "LeadDeliveryOutbox_leadId_key";

ALTER TABLE "LeadDeliveryOutbox"
  ADD CONSTRAINT "LeadDeliveryOutbox_destination_check"
  CHECK ("destination" IN ('notification', 'google_sheets'));
