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
  `CREATE TABLE IF NOT EXISTS "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "currentText" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "dataStatus" TEXT NOT NULL DEFAULT 'Configured',
    "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionMethod" TEXT NOT NULL DEFAULT 'Seeded',
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
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_policyId_idx" ON "PolicyCheckLog"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_checkedAt_idx" ON "PolicyCheckLog"("checkedAt")`,
  `CREATE INDEX IF NOT EXISTS "PolicyCheckLog_status_idx" ON "PolicyCheckLog"("status")`,
  `CREATE INDEX IF NOT EXISTS "PolicySnapshot_policyId_idx" ON "PolicySnapshot"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyChange_policyId_idx" ON "PolicyChange"("policyId")`,
  `CREATE INDEX IF NOT EXISTS "PolicyChange_createdAt_idx" ON "PolicyChange"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "RegionImpact_policyChangeId_idx" ON "RegionImpact"("policyChangeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken")`,
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
];

const upgradeColumns = {
  Policy: [
    ['dataStatus', `ALTER TABLE "Policy" ADD COLUMN "dataStatus" TEXT NOT NULL DEFAULT 'Configured'`],
    ['lastCheckDate', `ALTER TABLE "Policy" ADD COLUMN "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['lastSuccessfulCheckDate', `ALTER TABLE "Policy" ADD COLUMN "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['ingestionMethod', `ALTER TABLE "Policy" ADD COLUMN "ingestionMethod" TEXT NOT NULL DEFAULT 'Seeded'`],
  ],
  PolicyCheckLog: [
    ['archiveTimestamp', `ALTER TABLE "PolicyCheckLog" ADD COLUMN "archiveTimestamp" DATETIME`],
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

  for (const statement of indexes) {
    db.exec(statement);
  }

  const counts = {
    companies: db.prepare('SELECT COUNT(*) AS count FROM "Company"').get().count,
    discoveryCandidates: db.prepare('SELECT COUNT(*) AS count FROM "PolicyDiscoveryCandidate"').get().count,
    discoveryJobs: db.prepare('SELECT COUNT(*) AS count FROM "PolicyDiscoveryJob"').get().count,
    onboardingBatches: db.prepare('SELECT COUNT(*) AS count FROM "SourceOnboardingBatch"').get().count,
    policies: db.prepare('SELECT COUNT(*) AS count FROM "Policy"').get().count,
    snapshots: db.prepare('SELECT COUNT(*) AS count FROM "PolicySnapshot"').get().count,
    changes: db.prepare('SELECT COUNT(*) AS count FROM "PolicyChange"').get().count,
    accessLogs: db.prepare('SELECT COUNT(*) AS count FROM "AdminAccessLog"').get().count,
  };

  console.log('Database schema is ready.');
  console.log(JSON.stringify(counts, null, 2));
  db.close();
} finally {
}
