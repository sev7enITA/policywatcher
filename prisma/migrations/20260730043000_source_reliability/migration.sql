CREATE TABLE "ScanRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'running',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "selectedRecords" INTEGER NOT NULL DEFAULT 0,
  "uniqueSources" INTEGER NOT NULL DEFAULT 0,
  "networkRetrievals" INTEGER NOT NULL DEFAULT 0,
  "deduplicatedRetrievals" INTEGER NOT NULL DEFAULT 0,
  "uniqueAvailableSources" INTEGER NOT NULL DEFAULT 0,
  "uniqueUnavailableSources" INTEGER NOT NULL DEFAULT 0,
  "unavailableRecords" INTEGER NOT NULL DEFAULT 0,
  "invalidRecords" INTEGER NOT NULL DEFAULT 0,
  "partialRecords" INTEGER NOT NULL DEFAULT 0,
  "errorRecords" INTEGER NOT NULL DEFAULT 0,
  "metricsJson" TEXT,
  "optionsJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Policy" ADD COLUMN "retrievalUrl" TEXT;

CREATE TABLE "SourceRetrieval" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "scanRunId" TEXT NOT NULL,
  "retrievalKey" TEXT NOT NULL,
  "requestedUrl" TEXT NOT NULL,
  "archiveNotBefore" DATETIME,
  "status" TEXT NOT NULL,
  "source" TEXT,
  "httpStatus" INTEGER,
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "reasonCode" TEXT,
  "reason" TEXT,
  "finalUrl" TEXT,
  "archiveTimestamp" DATETIME,
  "attemptsJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceRetrieval_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SourceRemediationIssue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "retrievalKey" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Watching',
  "reasonCode" TEXT,
  "affectedPolicyIdsJson" TEXT NOT NULL DEFAULT '[]',
  "totalFailures" INTEGER NOT NULL DEFAULT 0,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "firstDetectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastDetectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recoveredAt" DATETIME,
  "resolvedAt" DATETIME,
  "suggestedAction" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "HistoricalSourceReference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "policyId" TEXT NOT NULL,
  "sourceRetrievalId" TEXT,
  "source" TEXT NOT NULL,
  "referenceUrl" TEXT,
  "capturedAt" DATETIME NOT NULL,
  "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reasonCode" TEXT NOT NULL DEFAULT 'stale_archive',
  "eligibleForChangeDetection" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistoricalSourceReference_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HistoricalSourceReference_sourceRetrievalId_fkey" FOREIGN KEY ("sourceRetrievalId") REFERENCES "SourceRetrieval"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "PolicyCheckLog" ADD COLUMN "reasonCode" TEXT;
ALTER TABLE "PolicyCheckLog" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "PolicyCheckLog" ADD COLUMN "scanRunId" TEXT REFERENCES "ScanRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyCheckLog" ADD COLUMN "sourceRetrievalId" TEXT REFERENCES "SourceRetrieval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PolicyCheckLog_scanRunId_idx" ON "PolicyCheckLog"("scanRunId");
CREATE INDEX "PolicyCheckLog_sourceRetrievalId_idx" ON "PolicyCheckLog"("sourceRetrievalId");
CREATE INDEX "ScanRun_startedAt_idx" ON "ScanRun"("startedAt");
CREATE INDEX "ScanRun_status_idx" ON "ScanRun"("status");
CREATE UNIQUE INDEX "SourceRetrieval_scanRunId_retrievalKey_key" ON "SourceRetrieval"("scanRunId", "retrievalKey");
CREATE INDEX "SourceRetrieval_retrievalKey_createdAt_idx" ON "SourceRetrieval"("retrievalKey", "createdAt");
CREATE INDEX "SourceRetrieval_status_idx" ON "SourceRetrieval"("status");
CREATE UNIQUE INDEX "SourceRemediationIssue_retrievalKey_key" ON "SourceRemediationIssue"("retrievalKey");
CREATE INDEX "SourceRemediationIssue_status_lastDetectedAt_idx" ON "SourceRemediationIssue"("status", "lastDetectedAt");
CREATE INDEX "SourceRemediationIssue_reasonCode_idx" ON "SourceRemediationIssue"("reasonCode");
CREATE UNIQUE INDEX "HistoricalSourceReference_policyId_source_capturedAt_key" ON "HistoricalSourceReference"("policyId", "source", "capturedAt");
CREATE INDEX "HistoricalSourceReference_policyId_capturedAt_idx" ON "HistoricalSourceReference"("policyId", "capturedAt");
CREATE INDEX "HistoricalSourceReference_sourceRetrievalId_idx" ON "HistoricalSourceReference"("sourceRetrievalId");
