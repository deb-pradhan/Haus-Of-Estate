-- Additive only: preserve existing leads, delivery state, leases and retry history.
ALTER TABLE "LeadDeliveryOutbox" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "LeadDeliveryOutbox" DROP CONSTRAINT "LeadDeliveryOutbox_destination_check";
ALTER TABLE "LeadDeliveryOutbox"
  ADD CONSTRAINT "LeadDeliveryOutbox_destination_check"
  CHECK ("destination" IN ('notification', 'google_sheets', 'customer_brochure'));
