BEGIN;

-- CreateEnum
CREATE TYPE "AuthActionPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- Authentication normalizes emails. Abort before changing data if historical
-- rows would collapse to the same case-insensitive identity.
DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim("email"))
    FROM "User"
    GROUP BY lower(btrim("email"))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Case-insensitive duplicate User emails must be resolved before auth hardening';
  END IF;
END $$;

UPDATE "User" SET "email" = lower(btrim("email"));
CREATE UNIQUE INDEX "User_email_normalized_key"
ON "User" (lower(btrim("email")));

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "disabledAt" TIMESTAMP(3),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "name" DROP NOT NULL;

-- Expand rather than changing the legacy Boolean in-place. The old and new
-- application versions can therefore overlap safely during deployment and an
-- application rollback still sees the Boolean shape it expects. A later
-- contract migration may remove the Boolean after the old code is retired.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerified" = true;

-- Auth.js requires Account.type. Google is an OIDC provider. Keep the default
-- during expand/contract so the old application can still create linked
-- accounts while deployments overlap or after an application rollback.
ALTER TABLE "Account" ADD COLUMN "type" TEXT DEFAULT 'oidc';
UPDATE "Account" SET "type" = 'oidc';
ALTER TABLE "Account" ALTER COLUMN "type" SET NOT NULL;

-- CreateTable
CREATE TABLE "AuthActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthActionPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthActionToken_tokenHash_key" ON "AuthActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthActionToken_userId_type_expiresAt_idx" ON "AuthActionToken"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "AuthActionToken_expiresAt_idx" ON "AuthActionToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthThrottle_scope_keyHash_key" ON "AuthThrottle"("scope", "keyHash");

-- CreateIndex
CREATE INDEX "AuthThrottle_blockedUntil_idx" ON "AuthThrottle"("blockedUntil");

-- AddForeignKey
ALTER TABLE "AuthActionToken" ADD CONSTRAINT "AuthActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
