BEGIN;

-- CreateEnum
CREATE TYPE "SavedContentType" AS ENUM ('PROPERTY', 'ARTICLE');

-- CreateTable
CREATE TABLE "SavedContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "SavedContentType" NOT NULL,
    "sanityDocumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedContent_userId_contentType_sanityDocumentId_key"
ON "SavedContent"("userId", "contentType", "sanityDocumentId");

-- CreateIndex
CREATE INDEX "SavedContent_userId_contentType_createdAt_idx"
ON "SavedContent"("userId", "contentType", "createdAt");

-- AddForeignKey
ALTER TABLE "SavedContent"
ADD CONSTRAINT "SavedContent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
