-- CreateTable
CREATE TABLE "SourceOnboardingBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "successfulItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SourceOnboardingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "companySlug" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "policyUrl" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "companyId" TEXT,
    "discoveryCandidateId" TEXT,
    "policyId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Proposed',
    "qaStatus" TEXT NOT NULL DEFAULT 'Pending',
    "qaSummary" TEXT,
    "qaChecksJson" TEXT,
    "publicationDecision" TEXT NOT NULL DEFAULT 'Pending',
    "reviewedByRole" TEXT,
    "reviewedAt" DATETIME,
    "decisionByRole" TEXT,
    "decisionAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SourceOnboardingItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SourceOnboardingBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SourceOnboardingItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceOnboardingItem_discoveryCandidateId_fkey" FOREIGN KEY ("discoveryCandidateId") REFERENCES "PolicyDiscoveryCandidate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceOnboardingItem_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SourceOnboardingBatch_createdAt_idx" ON "SourceOnboardingBatch"("createdAt");

-- CreateIndex
CREATE INDEX "SourceOnboardingBatch_status_idx" ON "SourceOnboardingBatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOnboardingItem_batchId_rowNumber_key" ON "SourceOnboardingItem"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_batchId_stage_idx" ON "SourceOnboardingItem"("batchId", "stage");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_companyId_idx" ON "SourceOnboardingItem"("companyId");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_discoveryCandidateId_idx" ON "SourceOnboardingItem"("discoveryCandidateId");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_policyId_idx" ON "SourceOnboardingItem"("policyId");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_qaStatus_idx" ON "SourceOnboardingItem"("qaStatus");

-- CreateIndex
CREATE INDEX "SourceOnboardingItem_publicationDecision_idx" ON "SourceOnboardingItem"("publicationDecision");
