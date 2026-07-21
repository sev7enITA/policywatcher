#!/usr/bin/env python3
"""Hostinger-safe SQLite schema initializer.

This script uses Python's standard sqlite3 module, avoiding npx, Prisma CLI,
and Prisma Client. It is intentionally idempotent: it creates missing tables,
adds missing columns used by the current application, and creates indexes.
"""

from __future__ import annotations

import os
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    sys.exit(1)


database_url = os.environ.get("DATABASE_URL", "").strip()
if not database_url:
    fail("DATABASE_URL is not set.")
if not database_url.startswith("file:"):
    fail("Only SQLite file: DATABASE_URL values are supported by this initializer.")

raw_path = database_url[len("file:") :]
if raw_path.startswith("./") or raw_path.startswith("../"):
    db_path = (Path.cwd() / "prisma" / raw_path).resolve()
else:
    db_path = Path(raw_path)

db_path.parent.mkdir(parents=True, exist_ok=True)

if "--detect-materialized-migrations" in sys.argv:
    if not db_path.exists() or db_path.stat().st_size == 0:
        sys.exit(0)
    migration_tables = [
        (
            "20260706213500_init",
            {
                "Company",
                "Policy",
                "PolicyCheckLog",
                "PolicySnapshot",
                "PolicyChange",
                "DatasetQaIssueReview",
                "AdminReviewLog",
                "AdminAccessLog",
                "RegionImpact",
                "Subscriber",
            },
        ),
        ("20260719070000_policy_discovery", {"PolicyDiscoveryCandidate"}),
        ("20260721090000_source_onboarding", {"SourceOnboardingBatch", "SourceOnboardingItem"}),
        ("20260721120000_policy_discovery_job", {"PolicyDiscoveryJob"}),
        ("20260721150000_policy_inquiry", {"PolicyInquiry"}),
    ]
    with sqlite3.connect(f"file:{db_path}?mode=ro", uri=True) as detection_connection:
        existing_tables = {
            row[0]
            for row in detection_connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
    for migration, required_tables in migration_tables:
        if required_tables.issubset(existing_tables):
            print(migration)
    sys.exit(0)

print(f"Database file: {db_path}")
print(f"Directory: {db_path.parent}")

if not os.access(db_path.parent, os.W_OK):
    fail("Database directory is not writable by the current user.")

if db_path.exists():
    backup = db_path.with_name(f"{db_path.name}.backup-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copy2(db_path, backup)
    print(f"Backup created: {backup}")


TABLES = [
    """
    CREATE TABLE IF NOT EXISTS "Company" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "logo" TEXT,
      "industry" TEXT NOT NULL,
      "website" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicyDiscoveryCandidate" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicyDiscoveryJob" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicyInquiry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "publicToken" TEXT NOT NULL,
      "fingerprint" TEXT NOT NULL,
      "dedupeKey" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Proposed',
      "kind" TEXT NOT NULL,
      "companyHint" TEXT,
      "normalizedDomain" TEXT,
      "sourceUrl" TEXT,
      "noticeSubject" TEXT,
      "noticeDate" DATETIME,
      "effectiveDate" DATETIME,
      "policyTypesJson" TEXT,
      "redactedExcerpt" TEXT,
      "matchedCompanyId" TEXT,
      "matchedPolicyId" TEXT,
      "resolvedChangeId" TEXT,
      "adminNote" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "resolvedAt" DATETIME
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "Policy" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "SourceOnboardingBatch" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "SourceOnboardingItem" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicyCheckLog" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicySnapshot" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "policyId" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "text" TEXT NOT NULL,
      "hash" TEXT NOT NULL,
      "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PolicySnapshot_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "PolicyChange" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "RegionImpact" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "Subscriber" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "DatasetQaIssueReview" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "AdminReviewLog" (
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
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS "AdminAccessLog" (
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
    )
    """,
]

INDEXES = [
    'CREATE UNIQUE INDEX IF NOT EXISTS "Company_name_key" ON "Company"("name")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_companyId_url_type_jurisdiction_key" ON "PolicyDiscoveryCandidate"("companyId", "url", "type", "jurisdiction")',
    'CREATE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_companyId_status_idx" ON "PolicyDiscoveryCandidate"("companyId", "status")',
    'CREATE INDEX IF NOT EXISTS "PolicyDiscoveryCandidate_createdAt_idx" ON "PolicyDiscoveryCandidate"("createdAt")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryJob_companyId_key" ON "PolicyDiscoveryJob"("companyId")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "PolicyDiscoveryJob_runToken_key" ON "PolicyDiscoveryJob"("runToken")',
    'CREATE INDEX IF NOT EXISTS "PolicyDiscoveryJob_status_startedAt_idx" ON "PolicyDiscoveryJob"("status", "startedAt")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "PolicyInquiry_publicToken_key" ON "PolicyInquiry"("publicToken")',
    'CREATE INDEX IF NOT EXISTS "PolicyInquiry_status_createdAt_idx" ON "PolicyInquiry"("status", "createdAt")',
    'CREATE INDEX IF NOT EXISTS "PolicyInquiry_dedupeKey_idx" ON "PolicyInquiry"("dedupeKey")',
    'CREATE INDEX IF NOT EXISTS "PolicyInquiry_matchedCompanyId_idx" ON "PolicyInquiry"("matchedCompanyId")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingBatch_createdAt_idx" ON "SourceOnboardingBatch"("createdAt")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingBatch_status_idx" ON "SourceOnboardingBatch"("status")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "SourceOnboardingItem_batchId_rowNumber_key" ON "SourceOnboardingItem"("batchId", "rowNumber")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_batchId_stage_idx" ON "SourceOnboardingItem"("batchId", "stage")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_companyId_idx" ON "SourceOnboardingItem"("companyId")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_discoveryCandidateId_idx" ON "SourceOnboardingItem"("discoveryCandidateId")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_policyId_idx" ON "SourceOnboardingItem"("policyId")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_qaStatus_idx" ON "SourceOnboardingItem"("qaStatus")',
    'CREATE INDEX IF NOT EXISTS "SourceOnboardingItem_publicationDecision_idx" ON "SourceOnboardingItem"("publicationDecision")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Policy_companyId_type_jurisdiction_key" ON "Policy"("companyId", "type", "jurisdiction")',
    'CREATE INDEX IF NOT EXISTS "Policy_companyId_idx" ON "Policy"("companyId")',
    'CREATE INDEX IF NOT EXISTS "Policy_jurisdiction_idx" ON "Policy"("jurisdiction")',
    'CREATE INDEX IF NOT EXISTS "PolicyCheckLog_policyId_idx" ON "PolicyCheckLog"("policyId")',
    'CREATE INDEX IF NOT EXISTS "PolicyCheckLog_checkedAt_idx" ON "PolicyCheckLog"("checkedAt")',
    'CREATE INDEX IF NOT EXISTS "PolicyCheckLog_status_idx" ON "PolicyCheckLog"("status")',
    'CREATE INDEX IF NOT EXISTS "PolicySnapshot_policyId_idx" ON "PolicySnapshot"("policyId")',
    'CREATE INDEX IF NOT EXISTS "PolicyChange_policyId_idx" ON "PolicyChange"("policyId")',
    'CREATE INDEX IF NOT EXISTS "PolicyChange_createdAt_idx" ON "PolicyChange"("createdAt")',
    'CREATE INDEX IF NOT EXISTS "RegionImpact_policyChangeId_idx" ON "RegionImpact"("policyChangeId")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "DatasetQaIssueReview_issueKey_key" ON "DatasetQaIssueReview"("issueKey")',
    'CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_status_idx" ON "DatasetQaIssueReview"("status")',
    'CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_severity_idx" ON "DatasetQaIssueReview"("severity")',
    'CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_area_idx" ON "DatasetQaIssueReview"("area")',
    'CREATE INDEX IF NOT EXISTS "DatasetQaIssueReview_entityType_entityId_idx" ON "DatasetQaIssueReview"("entityType", "entityId")',
    'CREATE INDEX IF NOT EXISTS "AdminReviewLog_createdAt_idx" ON "AdminReviewLog"("createdAt")',
    'CREATE INDEX IF NOT EXISTS "AdminReviewLog_action_idx" ON "AdminReviewLog"("action")',
    'CREATE INDEX IF NOT EXISTS "AdminReviewLog_targetType_targetId_idx" ON "AdminReviewLog"("targetType", "targetId")',
    'CREATE INDEX IF NOT EXISTS "AdminReviewLog_policyChangeId_idx" ON "AdminReviewLog"("policyChangeId")',
    'CREATE INDEX IF NOT EXISTS "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt")',
    'CREATE INDEX IF NOT EXISTS "AdminAccessLog_event_idx" ON "AdminAccessLog"("event")',
    'CREATE INDEX IF NOT EXISTS "AdminAccessLog_username_idx" ON "AdminAccessLog"("username")',
    'CREATE INDEX IF NOT EXISTS "AdminAccessLog_ipAddress_idx" ON "AdminAccessLog"("ipAddress")',
]

UPGRADE_COLUMNS = {
    "Policy": [
        ("dataStatus", 'ALTER TABLE "Policy" ADD COLUMN "dataStatus" TEXT NOT NULL DEFAULT "Configured"'),
        ("lastCheckDate", 'ALTER TABLE "Policy" ADD COLUMN "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
        ("lastSuccessfulCheckDate", 'ALTER TABLE "Policy" ADD COLUMN "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
        ("ingestionMethod", 'ALTER TABLE "Policy" ADD COLUMN "ingestionMethod" TEXT NOT NULL DEFAULT "Seeded"'),
    ],
    "PolicyCheckLog": [
        ("archiveTimestamp", 'ALTER TABLE "PolicyCheckLog" ADD COLUMN "archiveTimestamp" DATETIME'),
    ],
    "PolicySnapshot": [
        ("publicEvidence", 'ALTER TABLE "PolicySnapshot" ADD COLUMN "publicEvidence" BOOLEAN NOT NULL DEFAULT false'),
    ],
    "PolicyChange": [
        ("tldrEn", 'ALTER TABLE "PolicyChange" ADD COLUMN "tldrEn" TEXT'),
        ("tldrIt", 'ALTER TABLE "PolicyChange" ADD COLUMN "tldrIt" TEXT'),
        ("keyPointsJson", 'ALTER TABLE "PolicyChange" ADD COLUMN "keyPointsJson" TEXT'),
        ("riskReasonsJson", 'ALTER TABLE "PolicyChange" ADD COLUMN "riskReasonsJson" TEXT'),
        ("publicEvidence", 'ALTER TABLE "PolicyChange" ADD COLUMN "publicEvidence" BOOLEAN NOT NULL DEFAULT false'),
        ("kpiDataCollection", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiDataCollection" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiThirdPartySharing", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiThirdPartySharing" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiDataRetention", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiDataRetention" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiRightToDeletion", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiRightToDeletion" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiCrossBorderTransfer", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiCrossBorderTransfer" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiAiTrainingOptOut", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiTrainingOptOut" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiAiOutputOwnership", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiOutputOwnership" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiAlgoTransparency", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiAlgoTransparency" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiAutomatedDecision", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiAutomatedDecision" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiAiBiasFairness", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiAiBiasFairness" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiConsentMechanism", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiConsentMechanism" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiRegulatoryCompliance", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiRegulatoryCompliance" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiBreachNotification", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiBreachNotification" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiIndependentAudit", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiIndependentAudit" TEXT NOT NULL DEFAULT "Not assessed"'),
        ("kpiContentModeration", 'ALTER TABLE "PolicyChange" ADD COLUMN "kpiContentModeration" TEXT NOT NULL DEFAULT "Not assessed"'),
    ],
}


def columns_for(connection: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')}


with sqlite3.connect(str(db_path), timeout=30) as con:
    con.execute("PRAGMA foreign_keys=ON")
    for statement in TABLES:
        con.execute(statement)

    for table, columns in UPGRADE_COLUMNS.items():
        existing = columns_for(con, table)
        for column, statement in columns:
            if column not in existing:
                con.execute(statement)
                print(f"Added {table}.{column}")

    for statement in INDEXES:
        con.execute(statement)

    con.commit()

    counts = {
        "companies": con.execute('SELECT COUNT(*) FROM "Company"').fetchone()[0],
        "discoveryCandidates": con.execute('SELECT COUNT(*) FROM "PolicyDiscoveryCandidate"').fetchone()[0],
        "discoveryJobs": con.execute('SELECT COUNT(*) FROM "PolicyDiscoveryJob"').fetchone()[0],
        "policyInquiries": con.execute('SELECT COUNT(*) FROM "PolicyInquiry"').fetchone()[0],
        "onboardingBatches": con.execute('SELECT COUNT(*) FROM "SourceOnboardingBatch"').fetchone()[0],
        "policies": con.execute('SELECT COUNT(*) FROM "Policy"').fetchone()[0],
        "snapshots": con.execute('SELECT COUNT(*) FROM "PolicySnapshot"').fetchone()[0],
        "changes": con.execute('SELECT COUNT(*) FROM "PolicyChange"').fetchone()[0],
        "accessLogs": con.execute('SELECT COUNT(*) FROM "AdminAccessLog"').fetchone()[0],
    }

print("Database schema is ready.")
print(counts)
