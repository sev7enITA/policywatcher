CREATE TABLE "PolicyDiscoveryJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "runToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PolicyDiscoveryJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PolicyDiscoveryJob_companyId_key" ON "PolicyDiscoveryJob"("companyId");
CREATE UNIQUE INDEX "PolicyDiscoveryJob_runToken_key" ON "PolicyDiscoveryJob"("runToken");
CREATE INDEX "PolicyDiscoveryJob_status_startedAt_idx" ON "PolicyDiscoveryJob"("status", "startedAt");
