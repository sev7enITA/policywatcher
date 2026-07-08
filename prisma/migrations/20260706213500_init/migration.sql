-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "industry" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Global',
    "currentText" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "dataStatus" TEXT NOT NULL DEFAULT 'Available',
    "lastCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulCheckDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionMethod" TEXT NOT NULL DEFAULT 'Seeded',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyCheckLog" (
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
);

-- CreateTable
CREATE TABLE "PolicySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "publicEvidence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicySnapshot_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyChange" (
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
);

-- CreateTable
CREATE TABLE "DatasetQaIssueReview" (
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
);

-- CreateTable
CREATE TABLE "AdminReviewLog" (
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
);

-- CreateTable
CREATE TABLE "AdminAccessLog" (
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
);

-- CreateTable
CREATE TABLE "RegionImpact" (
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
);

-- CreateTable
CREATE TABLE "Subscriber" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Policy_companyId_idx" ON "Policy"("companyId");

-- CreateIndex
CREATE INDEX "Policy_jurisdiction_idx" ON "Policy"("jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_companyId_type_jurisdiction_key" ON "Policy"("companyId", "type", "jurisdiction");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_policyId_idx" ON "PolicyCheckLog"("policyId");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_checkedAt_idx" ON "PolicyCheckLog"("checkedAt");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_status_idx" ON "PolicyCheckLog"("status");

-- CreateIndex
CREATE INDEX "PolicySnapshot_policyId_idx" ON "PolicySnapshot"("policyId");

-- CreateIndex
CREATE INDEX "PolicyChange_policyId_idx" ON "PolicyChange"("policyId");

-- CreateIndex
CREATE INDEX "PolicyChange_createdAt_idx" ON "PolicyChange"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetQaIssueReview_issueKey_key" ON "DatasetQaIssueReview"("issueKey");

-- CreateIndex
CREATE INDEX "DatasetQaIssueReview_status_idx" ON "DatasetQaIssueReview"("status");

-- CreateIndex
CREATE INDEX "DatasetQaIssueReview_severity_idx" ON "DatasetQaIssueReview"("severity");

-- CreateIndex
CREATE INDEX "DatasetQaIssueReview_area_idx" ON "DatasetQaIssueReview"("area");

-- CreateIndex
CREATE INDEX "DatasetQaIssueReview_entityType_entityId_idx" ON "DatasetQaIssueReview"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminReviewLog_createdAt_idx" ON "AdminReviewLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminReviewLog_action_idx" ON "AdminReviewLog"("action");

-- CreateIndex
CREATE INDEX "AdminReviewLog_targetType_targetId_idx" ON "AdminReviewLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminReviewLog_policyChangeId_idx" ON "AdminReviewLog"("policyChangeId");

-- CreateIndex
CREATE INDEX "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAccessLog_event_idx" ON "AdminAccessLog"("event");

-- CreateIndex
CREATE INDEX "AdminAccessLog_username_idx" ON "AdminAccessLog"("username");

-- CreateIndex
CREATE INDEX "AdminAccessLog_ipAddress_idx" ON "AdminAccessLog"("ipAddress");

-- CreateIndex
CREATE INDEX "RegionImpact_policyChangeId_idx" ON "RegionImpact"("policyChangeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken");
