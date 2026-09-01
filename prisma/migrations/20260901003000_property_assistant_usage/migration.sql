BEGIN;

CREATE TABLE "PropertyAssistantUsageBucket" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "reservedTokenUnits" INTEGER NOT NULL DEFAULT 0,
    "consumedTokenUnits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAssistantUsageBucket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyAssistantUsageReservation" (
    "id" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "tokenUnits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyAssistantUsageReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyAssistantUsageBucket_scope_keyHash_key"
ON "PropertyAssistantUsageBucket"("scope", "keyHash");

CREATE INDEX "PropertyAssistantUsageBucket_windowEnd_idx"
ON "PropertyAssistantUsageBucket"("windowEnd");

CREATE INDEX "PropertyAssistantUsageReservation_bucketId_expiresAt_idx"
ON "PropertyAssistantUsageReservation"("bucketId", "expiresAt");

CREATE INDEX "PropertyAssistantUsageReservation_expiresAt_idx"
ON "PropertyAssistantUsageReservation"("expiresAt");

ALTER TABLE "PropertyAssistantUsageReservation"
ADD CONSTRAINT "PropertyAssistantUsageReservation_bucketId_fkey"
FOREIGN KEY ("bucketId") REFERENCES "PropertyAssistantUsageBucket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
