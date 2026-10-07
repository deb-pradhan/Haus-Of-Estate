-- Additive lead intake, consent evidence, delivery outbox, and throttling schema.

CREATE TYPE "NewsletterSubscriptionStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');
CREATE TYPE "NewsletterConsentEventType" AS ENUM ('OPT_IN', 'WITHDRAWAL');

ALTER TABLE "Lead"
    ADD COLUMN "submissionId" TEXT,
    ADD COLUMN "payloadHash" TEXT,
    ADD COLUMN "bathrooms" TEXT,
    ADD COLUMN "message" TEXT,
    ADD COLUMN "projectSlug" TEXT,
    ADD COLUMN "projectTitle" TEXT,
    ADD COLUMN "projectCommunity" TEXT,
    ADD COLUMN "newsletterOptIn" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "formVersion" TEXT,
    ADD COLUMN "privacyNoticeVersion" TEXT,
    ADD COLUMN "formSurface" TEXT,
    ADD COLUMN "pagePath" TEXT,
    ADD COLUMN "referrer" TEXT,
    ADD COLUMN "utmSource" TEXT,
    ADD COLUMN "utmMedium" TEXT,
    ADD COLUMN "utmCampaign" TEXT,
    ADD COLUMN "utmContent" TEXT,
    ADD COLUMN "utmTerm" TEXT;

CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "consentedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterConsentEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "leadId" TEXT,
    "type" "NewsletterConsentEventType" NOT NULL,
    "wording" TEXT NOT NULL,
    "privacyNoticeVersion" TEXT NOT NULL,
    "formVersion" TEXT NOT NULL,
    "pageContext" TEXT NOT NULL,
    "source" TEXT,
    "campaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsletterConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadDeliveryOutbox" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeadDeliveryOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadSubmissionThrottle" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadSubmissionThrottle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Lead_submissionId_key" ON "Lead"("submissionId");
CREATE INDEX "Lead_projectSlug_idx" ON "Lead"("projectSlug");
CREATE INDEX "Lead_newsletterOptIn_idx" ON "Lead"("newsletterOptIn");
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");
CREATE INDEX "NewsletterSubscription_status_idx" ON "NewsletterSubscription"("status");
CREATE INDEX "NewsletterSubscription_updatedAt_idx" ON "NewsletterSubscription"("updatedAt");
CREATE INDEX "NewsletterConsentEvent_subscriptionId_createdAt_idx" ON "NewsletterConsentEvent"("subscriptionId", "createdAt");
CREATE INDEX "NewsletterConsentEvent_leadId_idx" ON "NewsletterConsentEvent"("leadId");
CREATE INDEX "NewsletterConsentEvent_type_createdAt_idx" ON "NewsletterConsentEvent"("type", "createdAt");
CREATE UNIQUE INDEX "LeadDeliveryOutbox_leadId_key" ON "LeadDeliveryOutbox"("leadId");
CREATE INDEX "LeadDeliveryOutbox_status_availableAt_idx" ON "LeadDeliveryOutbox"("status", "availableAt");
CREATE INDEX "LeadDeliveryOutbox_status_lockedAt_idx" ON "LeadDeliveryOutbox"("status", "lockedAt");
CREATE INDEX "LeadSubmissionThrottle_ipHash_createdAt_idx" ON "LeadSubmissionThrottle"("ipHash", "createdAt");
CREATE INDEX "LeadSubmissionThrottle_createdAt_idx" ON "LeadSubmissionThrottle"("createdAt");

ALTER TABLE "NewsletterConsentEvent" ADD CONSTRAINT "NewsletterConsentEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "NewsletterSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NewsletterConsentEvent" ADD CONSTRAINT "NewsletterConsentEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDeliveryOutbox" ADD CONSTRAINT "LeadDeliveryOutbox_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
