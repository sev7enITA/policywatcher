ALTER TABLE "ScanRun" ADD COLUMN "leaseKey" TEXT;
ALTER TABLE "ScanRun" ADD COLUMN "leaseExpiresAt" DATETIME;
ALTER TABLE "ScanRun" ADD COLUMN "failureReason" TEXT;

CREATE UNIQUE INDEX "ScanRun_leaseKey_key" ON "ScanRun"("leaseKey");
CREATE INDEX "ScanRun_leaseExpiresAt_idx" ON "ScanRun"("leaseExpiresAt");
