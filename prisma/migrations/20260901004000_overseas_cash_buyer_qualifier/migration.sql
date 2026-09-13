ALTER TABLE "Lead"
ADD COLUMN "overseasCashBuyer" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Lead_overseasCashBuyer_idx" ON "Lead"("overseasCashBuyer");
