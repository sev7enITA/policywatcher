#!/usr/bin/env node
/**
 * Hostinger-safe SQLite schema initializer.
 *
 * This script deliberately avoids `npx` and the Prisma CLI because Hostinger's
 * SSH shell may not expose package binaries even when the runtime app works.
 * It uses Node 22's built-in SQLite module and idempotent DDL so an empty
 * production DB can be created without shipping any .db file.
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (!databaseUrl.startsWith('file:')) {
  console.error('Only SQLite file: DATABASE_URL values are supported by this initializer.');
  process.exit(1);
}

function sqlitePathFromUrl(value) {
  const raw = value.slice('file:'.length);
  if (raw.startsWith('./') || raw.startsWith('../')) {
    return path.resolve(process.cwd(), 'prisma', raw);
  }
  return raw;
}

const dbPath = sqlitePathFromUrl(databaseUrl);
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

console.log(`Database file: ${dbPath}`);
console.log(`Directory: ${dbDir}`);

const ddl = [
  `CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "industry" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicyDiscoveryCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "retrievalUrl" TEXT,
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
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicyDiscoveryJob" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicyInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicToken" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "activeDedupeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    "kind" TEXT NOT NULL,
    "companyHint" TEXT,
    "normalizedDomain" TEXT,
    "sourceUrl" TEXT,
    "noticeDate" DATETIME,
    "effectiveDate" DATETIME,
    "policyTypesJson" TEXT,
    "matchedCompanyId" TEXT,
    "matchedPolicyId" TEXT,
    "resolvedChangeId" TEXT,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME
  )`,
  `CREATE TABLE IF NOT EXISTS "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "retrievalUrl" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "currentText" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "dataStatus" TEXT NOT NULL DEFAULT 'Available',
    "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionMethod" TEXT NOT NULL DEFAULT 'Seeded',
    "sourceMigrationPending" BOOLEAN NOT NULL DEFAULT false,
    "sourceMigrationRequestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "SourceOnboardingBatch" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "SourceOnboardingItem" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicyCheckLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "httpStatus" INTEGER,
    "reason" TEXT,
    "finalUrl" TEXT,
    "textHash" TEXT,
    "textLength" INTEGER,
    "archiveTimestamp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyCheckLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicySnapshot_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PolicyChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "oldSnapshotId" TEXT,
    "newSnapshotId" TEXT NOT NULL,
    "diff" TEXT NOT NULL,
    "aiSummaryEn" TEXT NOT NULL,
    "aiSummaryIt" TEXT NOT NULL,
    "tldrEn" TEXT,
    "tldrIt" TEXT,
    "keyPointsJson" TEXT,
    "riskReasonsJson" TEXT,
    "overallRisk" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "remediationsJson" TEXT NOT NULL,
    "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
    "aiTrainingOptOut" TEXT NOT NULL,
    "aiDataScrapingRestricted" TEXT NOT NULL,
    "aiIpLicensing" TEXT NOT NULL,
    "aiPromptRetention" TEXT NOT NULL,
    "kpiDataCollection" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiThirdPartySharing" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiDataRetention" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiRightToDeletion" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiCrossBorderTransfer" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiAiTrainingOptOut" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiAiOutputOwnership" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiAlgoTransparency" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiAutomatedDecision" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiAiBiasFairness" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiConsentMechanism" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiRegulatoryCompliance" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiBreachNotification" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiIndependentAudit" TEXT NOT NULL DEFAULT 'Not assessed',
    "kpiContentModeration" TEXT NOT NULL DEFAULT 'Not assessed',
    "publicPublishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyChange_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyChange_oldSnapshotId_fkey" FOREIGN KEY ("oldSnapshotId") REFERENCES "PolicySnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PolicyChange_newSnapshotId_fkey" FOREIGN KEY ("newSnapshotId") REFERENCES "PolicySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "RegionImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyChangeId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "perspective" TEXT NOT NULL,
    "impactAnalysisEn" TEXT NOT NULL,
    "impactAnalysisIt" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "complianceNoteEn" TEXT,
    "complianceNoteIt" TEXT,
    CONSTRAINT "RegionImpact_policyChangeId_fkey" FOREIGN KEY ("policyChangeId") REFERENCES "PolicyChange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Subscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "regions" TEXT NOT NULL,
    "industries" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'INSTANT',
    "unsubscribeToken" TEXT NOT NULL,
    "confirmationToken" TEXT,
    "confirmationRequestedAt" DATETIME,
    "confirmedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "DatasetQaIssueReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "severity" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "companyName" TEXT,
    "policyName" TEXT,
    "label" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "reviewedByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "AdminReviewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "note" TEXT,
    "metadataJson" TEXT,
    "policyChangeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminReviewLog_policyChangeId_fkey" FOREIGN KEY ("policyChangeId") REFERENCES "PolicyChange" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AdminAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "username" TEXT,
    "actorRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "path" TEXT,
    "method" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "InvestorAccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "recipientLabel" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "lastAccessedAt" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "InvestorAccessEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT,
    "event" TEXT NOT NULL,
    "actorRole" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorAccessEvent_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InvestorAccessGrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PressMetricEvent" (
    "eventType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS "AdminDashboardMetricEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "priorityId" TEXT,
    "destination" TEXT,
    "numericValue" INTEGER,
    "viewportClass" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AiModelInvocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "modelId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT NOT NULL,
    "errorCode" TEXT,
    "durationMs" INTEGER NOT NULL,
    "inputChars" INTEGER NOT NULL,
    "outputChars" INTEGER,
    "promptTokenCount" INTEGER,
    "outputTokenCount" INTEGER,
    "totalTokenCount" INTEGER,
    "schemaVersion" TEXT,
    "promptVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "ScanRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "leaseKey" TEXT,
    "leaseExpiresAt" DATETIME,
    "failureReason" TEXT,
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
  )`,
  `CREATE TABLE IF NOT EXISTS "SourceRetrieval" (
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
    CONSTRAINT "SourceRetrieval_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "SourceRemediationIssue" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "HistoricalSourceReference" (
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
    CONSTRAINT "HistoricalSourceReference_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricalSourceReference_sourceRetrievalId_fkey" FOREIGN KEY ("sourceRetrievalId") REFERENCES "SourceRetrieval" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpointId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME,
    "lastAttemptAt" DATETIME,
    "lastStatusCode" INTEGER,
    "lastErrorCode" TEXT,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebhookDelivery_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "PolicyChange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "WebhookDeliveryAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "statusCode" INTEGER,
    "errorCode" TEXT,
    "durationMs" INTEGER,
    "attemptedAt" DATETIME NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "WebhookDelivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'organization',
    "website" TEXT,
    "legacyCompanyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "canonicalUrl" TEXT NOT NULL,
    "legacyPolicyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "effectiveAt" DATETIME,
    "contentRef" TEXT,
    "contentText" TEXT,
    "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
    "legacySnapshotId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Change" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fromVersionId" TEXT,
    "toVersionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'detected',
    "summary" TEXT,
    "detectedAt" DATETIME NOT NULL,
    "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "legacyPolicyChangeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Change_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Change_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "Version" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Change_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "Version" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Provision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "taxonomyKey" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "assessment" TEXT NOT NULL DEFAULT 'not_assessed',
    "evidenceText" TEXT,
    "evidenceHash" TEXT,
    "sourceLocator" TEXT,
    "rationale" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Provision_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "Change" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

const indexes = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "Company_name_key" ON "Company"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_companyId_url_type_jurisdiction_key" ON "PolicyDiscoveryCandidate"("companyId", "url", "type", "jurisdiction")`,
  `CREATE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_companyId_status_idx" ON "PolicyDiscoveryCandidate"("companyId", "status")`,
  `CREATE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_createdAt_idx" ON "PolicyDiscoveryCandidate"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryJob_companyId_key" ON "PolicyDiscoveryJob"("companyId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryJob_runToken_key" ON "PolicyDiscoveryJob"("runToken")`,
  `CREATE INDEX IF NOT EXISTS "PolicyDiscoveryJob_status_startedAt_idx" ON "PolicyDiscoveryJob"("status", "startedAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyInquiry_publicToken_key" ON "PolicyInquiry"("publicToken")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyInquiry_activeDedupeKey_key" ON "PolicyInquiry"("activeDedupeKey")`,
  `CREATE INDEX IF NOT EXISTS "PolicyInquiry_status_createdAt_idx" ON "PolicyInquiry"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PolicyInquiry_dedupeKey_idx" ON "PolicyInquiry"("dedupeKey")`,
  `CREATE INDEX IF NOT EXISTS "PolicyInquiry_matchedCompanyId_idx" ON "PolicyInquiry"("matchedCompanyId")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingBatch_createdAt_idx" ON "SourceOnboardingBatch"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingBatch_status_idx" ON "SourceOnboardingBatch"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SourceOnboardingItem_batchId_rowNumber_key" ON "SourceOnboardingItem"("batchId", "rowNumber")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_batchId_stage_idx" ON "SourceOnboardingItem"("batchId", "stage")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_companyId_idx" ON "SourceOnboardingItem"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_discoveryCandidateId_idx" ON "SourceOnboardingItem"("discoveryCandidateId")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_policyId_idx" ON "SourceOnboardingItem"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_qaStatus_idx" ON "SourceOnboardingItem"("qaStatus")`,
  `CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_publicationDecision_idx" ON "SourceOnboardingItem"("publicationDecision")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Policy_companyId_type_jurisdiction_key" ON "Policy"("companyId", "type", "jurisdiction")`,
  `CREATE INDEX IF NOT EXISTS "Policy_companyId_idx" ON "Policy"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "Policy_jurisdiction_idx" ON "Policy"("jurisdiction")`,
  `CREATE INDEX IF NOT EXISTS "Policy_sourceMigrationPending_idx" ON "Policy"("sourceMigrationPending")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_policyId_idx" ON "PolicyCheckLog"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_checkedAt_idx" ON "PolicyCheckLog"("checkedAt")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_status_idx" ON "PolicyCheckLog"("status")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_scanRunId_idx" ON "PolicyCheckLog"("scanRunId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_sourceRetrievalId_idx" ON "PolicyCheckLog"("sourceRetrievalId")`,
  `CREATE INDEX IF NOT EXISTS "ScanRun_startedAt_idx" ON "ScanRun"("startedAt")`,
  `CREATE INDEX IF NOT EXISTS "ScanRun_status_idx" ON "ScanRun"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ScanRun_leaseKey_key" ON "ScanRun"("leaseKey")`,
  `CREATE INDEX IF NOT EXISTS "ScanRun_leaseExpiresAt_idx" ON "ScanRun"("leaseExpiresAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SourceRetrieval_scanRunId_retrievalKey_key" ON "SourceRetrieval"("scanRunId", "retrievalKey")`,
  `CREATE INDEX IF NOT EXISTS "SourceRetrieval_retrievalKey_createdAt_idx" ON "SourceRetrieval"("retrievalKey", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "SourceRetrieval_status_idx" ON "SourceRetrieval"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SourceRemediationIssue_retrievalKey_key" ON "SourceRemediationIssue"("retrievalKey")`,
  `CREATE INDEX IF NOT EXISTS "SourceRemediationIssue_status_lastDetectedAt_idx" ON "SourceRemediationIssue"("status", "lastDetectedAt")`,
  `CREATE INDEX IF NOT EXISTS "SourceRemediationIssue_reasonCode_idx" ON "SourceRemediationIssue"("reasonCode")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "HistoricalSourceReference_policyId_source_capturedAt_key" ON "HistoricalSourceReference"("policyId", "source", "capturedAt")`,
  `CREATE INDEX IF NOT EXISTS "HistoricalSourceReference_policyId_capturedAt_idx" ON "HistoricalSourceReference"("policyId", "capturedAt")`,
  `CREATE INDEX IF NOT EXISTS "HistoricalSourceReference_sourceRetrievalId_idx" ON "HistoricalSourceReference"("sourceRetrievalId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WebhookDelivery_endpointId_eventId_key" ON "WebhookDelivery"("endpointId", "eventId")`,
  `CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt")`,
  `CREATE INDEX IF NOT EXISTS "WebhookDelivery_endpointId_createdAt_idx" ON "WebhookDelivery"("endpointId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "WebhookDelivery_changeId_idx" ON "WebhookDelivery"("changeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WebhookDeliveryAttempt_deliveryId_attemptNumber_key" ON "WebhookDeliveryAttempt"("deliveryId", "attemptNumber")`,
  `CREATE INDEX IF NOT EXISTS "WebhookDeliveryAttempt_deliveryId_attemptedAt_idx" ON "WebhookDeliveryAttempt"("deliveryId", "attemptedAt")`,
  `CREATE INDEX IF NOT EXISTS "WebhookDeliveryAttempt_outcome_attemptedAt_idx" ON "WebhookDeliveryAttempt"("outcome", "attemptedAt")`,
  `CREATE INDEX IF NOT EXISTS "PolicySnapshot_policyId_idx" ON "PolicySnapshot"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyChange_policyId_idx" ON "PolicyChange"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyChange_createdAt_idx" ON "PolicyChange"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PolicyChange_publicPublishedAt_idx" ON "PolicyChange"("publicPublishedAt")`,
  `CREATE INDEX IF NOT EXISTS "RegionImpact_policyChangeId_idx" ON "RegionImpact"("policyChangeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_confirmationToken_key" ON "Subscriber"("confirmationToken")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DatasetQaIssueReview_issueKey_key" ON "DatasetQaIssueReview"("issueKey")`,
  `CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_status_idx" ON "DatasetQaIssueReview"("status")`,
  `CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_severity_idx" ON "DatasetQaIssueReview"("severity")`,
  `CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_area_idx" ON "DatasetQaIssueReview"("area")`,
  `CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_entityType_entityId_idx" ON "DatasetQaIssueReview"("entityType", "entityId")`,
  `CREATE INDEX IF NOT EXISTS "AdminReviewLog_createdAt_idx" ON "AdminReviewLog"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AdminReviewLog_action_idx" ON "AdminReviewLog"("action")`,
  `CREATE INDEX IF NOT EXISTS "AdminReviewLog_targetType_targetId_idx" ON "AdminReviewLog"("targetType", "targetId")`,
  `CREATE INDEX IF NOT EXISTS "AdminReviewLog_policyChangeId_idx" ON "AdminReviewLog"("policyChangeId")`,
  `CREATE INDEX IF NOT EXISTS "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AdminAccessLog_event_idx" ON "AdminAccessLog"("event")`,
  `CREATE INDEX IF NOT EXISTS "AdminAccessLog_username_idx" ON "AdminAccessLog"("username")`,
  `CREATE INDEX IF NOT EXISTS "AdminAccessLog_ipAddress_idx" ON "AdminAccessLog"("ipAddress")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "InvestorAccessGrant_tokenHash_key" ON "InvestorAccessGrant"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessGrant_expiresAt_idx" ON "InvestorAccessGrant"("expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessGrant_revokedAt_idx" ON "InvestorAccessGrant"("revokedAt")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessGrant_createdAt_idx" ON "InvestorAccessGrant"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessEvent_grantId_createdAt_idx" ON "InvestorAccessEvent"("grantId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessEvent_event_createdAt_idx" ON "InvestorAccessEvent"("event", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "InvestorAccessEvent_createdAt_idx" ON "InvestorAccessEvent"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PressMetricEvent_eventType_createdAt_idx" ON "PressMetricEvent"("eventType", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PressMetricEvent_eventType_target_createdAt_idx" ON "PressMetricEvent"("eventType", "target", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminDashboardMetricEvent_visitId_eventKey_key" ON "AdminDashboardMetricEvent"("visitId", "eventKey")`,
  `CREATE INDEX IF NOT EXISTS "AdminDashboardMetricEvent_eventType_createdAt_idx" ON "AdminDashboardMetricEvent"("eventType", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AdminDashboardMetricEvent_createdAt_idx" ON "AdminDashboardMetricEvent"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AiModelInvocation_createdAt_idx" ON "AiModelInvocation"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AiModelInvocation_operation_createdAt_idx" ON "AiModelInvocation"("operation", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AiModelInvocation_modelId_outcome_createdAt_idx" ON "AiModelInvocation"("modelId", "outcome", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AiModelInvocation_traceId_idx" ON "AiModelInvocation"("traceId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Entity_publicId_key" ON "Entity"("publicId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Entity_canonicalKey_key" ON "Entity"("canonicalKey")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Entity_legacyCompanyId_key" ON "Entity"("legacyCompanyId")`,
  `CREATE INDEX IF NOT EXISTS "Entity_entityType_idx" ON "Entity"("entityType")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Document_publicId_key" ON "Document"("publicId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Document_legacyPolicyId_key" ON "Document"("legacyPolicyId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Document_entityId_canonicalKey_key" ON "Document"("entityId", "canonicalKey")`,
  `CREATE INDEX IF NOT EXISTS "Document_entityId_idx" ON "Document"("entityId")`,
  `CREATE INDEX IF NOT EXISTS "Document_documentType_jurisdiction_idx" ON "Document"("documentType", "jurisdiction")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Version_publicId_key" ON "Version"("publicId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Version_legacySnapshotId_key" ON "Version"("legacySnapshotId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Version_documentId_sequence_key" ON "Version"("documentId", "sequence")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Version_documentId_contentHash_key" ON "Version"("documentId", "contentHash")`,
  `CREATE INDEX IF NOT EXISTS "Version_documentId_capturedAt_idx" ON "Version"("documentId", "capturedAt")`,
  `CREATE INDEX IF NOT EXISTS "Version_publicEvidence_idx" ON "Version"("publicEvidence")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Change_publicId_key" ON "Change"("publicId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Change_legacyPolicyChangeId_key" ON "Change"("legacyPolicyChangeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Change_documentId_toVersionId_key" ON "Change"("documentId", "toVersionId")`,
  `CREATE INDEX IF NOT EXISTS "Change_documentId_detectedAt_idx" ON "Change"("documentId", "detectedAt")`,
  `CREATE INDEX IF NOT EXISTS "Change_fromVersionId_idx" ON "Change"("fromVersionId")`,
  `CREATE INDEX IF NOT EXISTS "Change_toVersionId_idx" ON "Change"("toVersionId")`,
  `CREATE INDEX IF NOT EXISTS "Change_publicEvidence_publishedAt_idx" ON "Change"("publicEvidence", "publishedAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Provision_publicId_key" ON "Provision"("publicId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Provision_changeId_taxonomyKey_ordinal_key" ON "Provision"("changeId", "taxonomyKey", "ordinal")`,
  `CREATE INDEX IF NOT EXISTS "Provision_taxonomyKey_assessment_idx" ON "Provision"("taxonomyKey", "assessment")`,
  `CREATE INDEX IF NOT EXISTS "Provision_reviewStatus_idx" ON "Provision"("reviewStatus")`,
];

const upgradeColumns = {
  PolicyInquiry: [
    ['activeDedupeKey', `ALTER TABLE "PolicyInquiry" ADD COLUMN "activeDedupeKey" TEXT`],
  ],
  Policy: [
    ['dataStatus', `ALTER TABLE "Policy" ADD COLUMN "dataStatus" TEXT NOT NULL DEFAULT 'Available'`],
    ['lastCheckDate', `ALTER TABLE "Policy" ADD COLUMN "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['lastSuccessfulCheckDate', `ALTER TABLE "Policy" ADD COLUMN "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['ingestionMethod', `ALTER TABLE "Policy" ADD COLUMN "ingestionMethod" TEXT NOT NULL DEFAULT 'Seeded'`],
    ['retrievalUrl', `ALTER TABLE "Policy" ADD COLUMN "retrievalUrl" TEXT`],
    ['sourceMigrationPending', `ALTER TABLE "Policy" ADD COLUMN "sourceMigrationPending" BOOLEAN NOT NULL DEFAULT false`],
    ['sourceMigrationRequestedAt', `ALTER TABLE "Policy" ADD COLUMN "sourceMigrationRequestedAt" DATETIME`],
  ],
  PolicyCheckLog: [
    ['archiveTimestamp', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "archiveTimestamp" DATETIME`],
    ['reasonCode', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "reasonCode" TEXT`],
    ['durationMs', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "durationMs" INTEGER`],
    ['scanRunId', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "scanRunId" TEXT REFERENCES "ScanRun"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
    ['sourceRetrievalId', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "sourceRetrievalId" TEXT REFERENCES "SourceRetrieval"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
  ],
  ScanRun: [
    ['leaseKey', `ALTER TABLE "ScanRun" ADD COLUMN "leaseKey" TEXT`],
    ['leaseExpiresAt', `ALTER TABLE "ScanRun" ADD COLUMN "leaseExpiresAt" DATETIME`],
    ['failureReason', `ALTER TABLE "ScanRun" ADD COLUMN "failureReason" TEXT`],
  ],
  Subscriber: [
    ['confirmationToken', `ALTER TABLE "Subscriber" ADD COLUMN "confirmationToken" TEXT`],
    ['confirmationRequestedAt', `ALTER TABLE "Subscriber" ADD COLUMN "confirmationRequestedAt" DATETIME`],
    ['confirmedAt', `ALTER TABLE "Subscriber" ADD COLUMN "confirmedAt" DATETIME`],
  ],
  PolicySnapshot: [
    ['publicEvidence', `ALTER TABLE "PolicySnapshot" ADD COLUMN "publicEvidence" BOOLEAN NOT NULL DEFAULT false`],
  ],
  PolicyChange: [
    ['tldrEn', `ALTER TABLE "PolicyChange" ADD COLUMN "tldrEn" TEXT`],
    ['tldrIt', `ALTER TABLE "PolicyChange" ADD COLUMN "tldrIt" TEXT`],
    ['keyPointsJson', `ALTER TABLE "PolicyChange" ADD COLUMN "keyPointsJson" TEXT`],
    ['riskReasonsJson', `ALTER TABLE "PolicyChange" ADD COLUMN "riskReasonsJson" TEXT`],
    ['publicEvidence', `ALTER TABLE "PolicyChange" ADD COLUMN "publicEvidence" BOOLEAN NOT NULL DEFAULT false`],
    ['publicPublishedAt', `ALTER TABLE "PolicyChange" ADD COLUMN "publicPublishedAt" DATETIME`],
    ['kpiDataCollection', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiDataCollection" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiThirdPartySharing', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiThirdPartySharing" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiDataRetention', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiDataRetention" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiRightToDeletion', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiRightToDeletion" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiCrossBorderTransfer', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiCrossBorderTransfer" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiAiTrainingOptOut', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiTrainingOptOut" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiAiOutputOwnership', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiOutputOwnership" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiAlgoTransparency', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiAlgoTransparency" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiAutomatedDecision', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiAutomatedDecision" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiAiBiasFairness', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiBiasFairness" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiConsentMechanism', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiConsentMechanism" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiRegulatoryCompliance', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiRegulatoryCompliance" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiBreachNotification', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiBreachNotification" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiIndependentAudit', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiIndependentAudit" TEXT NOT NULL DEFAULT 'Not assessed'`],
    ['kpiContentModeration', `ALTER TABLE "PolicyChange" ADD COLUMN "kpiContentModeration" TEXT NOT NULL DEFAULT 'Not assessed'`],
  ],
};

function columnsFor(db, table) {
  const rows = db.prepare(`PRAGMA table_info("${table}")`).all();
  return new Set(rows.map((row) => row.name));
}

try {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('PRAGMA busy_timeout=5000');

  for (const statement of ddl) {
    db.exec(statement);
  }

  for (const [table, columns] of Object.entries(upgradeColumns)) {
    const existing = columnsFor(db, table);
    for (const [column, statement] of columns) {
      if (!existing.has(column)) {
        db.exec(statement);
        console.log(`Added ${table}.${column}`);
      }
    }
  }

  db.exec(`UPDATE "PolicyChange"
    SET "publicPublishedAt" = "createdAt"
    WHERE "publicEvidence" = 1 AND "publicPublishedAt" IS NULL`);

  for (const statement of indexes) {
    db.exec(statement);
  }

  const journalMode = String(db.prepare('PRAGMA journal_mode=WAL').get().journal_mode || '').toLowerCase();
  db.exec('PRAGMA synchronous=NORMAL');
  db.exec('PRAGMA wal_autocheckpoint=1000');
  if (journalMode !== 'wal') throw new Error(`SQLite refused WAL mode: ${journalMode || 'unknown'}`);

  const counts = {
    companies: db.prepare('SELECT COUNT(*) AS count FROM "Company"').get().count,
    discoveryCandidates: db.prepare('SELECT COUNT(*) AS count FROM "PolicyDiscoveryCandidate"').get().count,
    discoveryJobs: db.prepare('SELECT COUNT(*) AS count FROM "PolicyDiscoveryJob"').get().count,
    policyInquiries: db.prepare('SELECT COUNT(*) AS count FROM "PolicyInquiry"').get().count,
    onboardingBatches: db.prepare('SELECT COUNT(*) AS count FROM "SourceOnboardingBatch"').get().count,
    policies: db.prepare('SELECT COUNT(*) AS count FROM "Policy"').get().count,
    snapshots: db.prepare('SELECT COUNT(*) AS count FROM "PolicySnapshot"').get().count,
    changes: db.prepare('SELECT COUNT(*) AS count FROM "PolicyChange"').get().count,
    accessLogs: db.prepare('SELECT COUNT(*) AS count FROM "AdminAccessLog"').get().count,
    investorAccessGrants: db.prepare('SELECT COUNT(*) AS count FROM "InvestorAccessGrant"').get().count,
    pressMetricEvents: db.prepare('SELECT COUNT(*) AS count FROM "PressMetricEvent"').get().count,
    aiModelInvocations: db.prepare('SELECT COUNT(*) AS count FROM "AiModelInvocation"').get().count,
  };

  console.log('Database schema is ready.');
  console.log(JSON.stringify(counts, null, 2));
  db.close();
} finally {
}
