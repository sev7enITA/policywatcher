-- CreateTable
CREATE TABLE "ExtractionBaseline" (
    "policyId" TEXT NOT NULL PRIMARY KEY,
    "baselineHash" TEXT NOT NULL,
    "profileHash" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "input" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtractionBaseline_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalDocumentReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceKey" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "blobId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "suggestedType" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'unconfirmed',
    "language" TEXT NOT NULL DEFAULT 'en',
    "referenceUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "policyId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EvidenceQualityReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectKey" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "claim" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalDocumentReference_referenceKey_key" ON "ExternalDocumentReference"("referenceKey");

-- CreateIndex
CREATE INDEX "ExternalDocumentReference_service_status_idx" ON "ExternalDocumentReference"("service", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceQualityReview_subjectKey_key" ON "EvidenceQualityReview"("subjectKey");

-- CreateIndex
CREATE INDEX "EvidenceQualityReview_changeId_idx" ON "EvidenceQualityReview"("changeId");

-- CreateIndex
CREATE INDEX "EvidenceQualityReview_metric_idx" ON "EvidenceQualityReview"("metric");

