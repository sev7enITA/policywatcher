ALTER TABLE "PolicyChange" ADD COLUMN "publicPublishedAt" DATETIME;

UPDATE "PolicyChange"
SET "publicPublishedAt" = "createdAt"
WHERE "publicEvidence" = 1
  AND "publicPublishedAt" IS NULL;

CREATE INDEX "PolicyChange_publicPublishedAt_idx" ON "PolicyChange"("publicPublishedAt");
