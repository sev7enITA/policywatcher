CREATE TABLE "PolicyDiscoveryCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "confidence" INTEGER NOT NULL,
    "discoverySource" TEXT NOT NULL,
    "retrievalSource" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "diagnosticsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    "reviewedAt" DATETIME,
    "reviewedByRole" TEXT,
    "createdPolicyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PolicyDiscoveryCandidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PolicyDiscoveryCandidate_companyId_url_type_jurisdiction_key"
ON "PolicyDiscoveryCandidate"("companyId", "url", "type", "jurisdiction");

CREATE INDEX "PolicyDiscoveryCandidate_companyId_status_idx"
ON "PolicyDiscoveryCandidate"("companyId", "status");

CREATE INDEX "PolicyDiscoveryCandidate_createdAt_idx"
ON "PolicyDiscoveryCandidate"("createdAt");
