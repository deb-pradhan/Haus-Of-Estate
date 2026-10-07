-- Add a purpose-specific property-match preference without changing legacy consent.
ALTER TABLE "Lead"
ADD COLUMN "propertyMatchOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "PropertyMatchSubscriptionStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');
CREATE TYPE "PropertyMatchConsentEventType" AS ENUM ('OPT_IN', 'WITHDRAWAL');

CREATE TABLE "PropertyMatchSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "PropertyMatchSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "criteria" JSONB,
    "consentedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyMatchSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyMatchConsentEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "leadId" TEXT,
    "type" "PropertyMatchConsentEventType" NOT NULL,
    "wording" TEXT NOT NULL,
    "privacyNoticeVersion" TEXT NOT NULL,
    "formVersion" TEXT NOT NULL,
    "pageContext" TEXT NOT NULL,
    "source" TEXT,
    "campaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyMatchConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_propertyMatchOptIn_idx" ON "Lead"("propertyMatchOptIn");
CREATE UNIQUE INDEX "PropertyMatchSubscription_email_key" ON "PropertyMatchSubscription"("email");
CREATE INDEX "PropertyMatchSubscription_status_idx" ON "PropertyMatchSubscription"("status");
CREATE INDEX "PropertyMatchSubscription_updatedAt_idx" ON "PropertyMatchSubscription"("updatedAt");
CREATE INDEX "PropertyMatchConsentEvent_subscriptionId_createdAt_idx" ON "PropertyMatchConsentEvent"("subscriptionId", "createdAt");
CREATE INDEX "PropertyMatchConsentEvent_leadId_idx" ON "PropertyMatchConsentEvent"("leadId");
CREATE INDEX "PropertyMatchConsentEvent_type_createdAt_idx" ON "PropertyMatchConsentEvent"("type", "createdAt");

ALTER TABLE "PropertyMatchConsentEvent"
ADD CONSTRAINT "PropertyMatchConsentEvent_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "PropertyMatchSubscription"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyMatchConsentEvent"
ADD CONSTRAINT "PropertyMatchConsentEvent_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
