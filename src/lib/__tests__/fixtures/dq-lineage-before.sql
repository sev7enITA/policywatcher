-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'organization',
    "website" TEXT,
    "legacyCompanyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
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
);

-- CreateTable
CREATE TABLE "Version" (
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
);

-- CreateTable
CREATE TABLE "Change" (
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
);

-- CreateTable
CREATE TABLE "Provision" (
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
);

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

-- CreateTable
CREATE TABLE "PolicyInquiry" (
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
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "retrievalUrl" TEXT,
    "sourceMigrationPending" BOOLEAN NOT NULL DEFAULT false,
    "sourceMigrationRequestedAt" DATETIME,
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
    "reasonCode" TEXT,
    "durationMs" INTEGER,
    "scanRunId" TEXT,
    "sourceRetrievalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyCheckLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyCheckLog_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PolicyCheckLog_sourceRetrievalId_fkey" FOREIGN KEY ("sourceRetrievalId") REFERENCES "SourceRetrieval" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanRun" (
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
);

-- CreateTable
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
    CONSTRAINT "SourceRetrieval_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
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
    CONSTRAINT "HistoricalSourceReference_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricalSourceReference_sourceRetrievalId_fkey" FOREIGN KEY ("sourceRetrievalId") REFERENCES "SourceRetrieval" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "publicPublishedAt" DATETIME,
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
CREATE TABLE "WebhookDelivery" (
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
);

-- CreateTable
CREATE TABLE "WebhookDeliveryAttempt" (
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
CREATE TABLE "InvestorAccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "recipientLabel" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "lastAccessedAt" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "InvestorAccessEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT,
    "event" TEXT NOT NULL,
    "actorRole" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorAccessEvent_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InvestorAccessGrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PressMetricEvent" (
    "eventType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "AdminDashboardMetricEvent" (
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
);

-- CreateTable
CREATE TABLE "AiModelInvocation" (
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
    "confirmationToken" TEXT,
    "confirmationRequestedAt" DATETIME,
    "confirmedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
CREATE UNIQUE INDEX "Entity_publicId_key" ON "Entity"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_canonicalKey_key" ON "Entity"("canonicalKey");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_legacyCompanyId_key" ON "Entity"("legacyCompanyId");

-- CreateIndex
CREATE INDEX "Entity_entityType_idx" ON "Entity"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Document_publicId_key" ON "Document"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_legacyPolicyId_key" ON "Document"("legacyPolicyId");

-- CreateIndex
CREATE INDEX "Document_entityId_idx" ON "Document"("entityId");

-- CreateIndex
CREATE INDEX "Document_documentType_jurisdiction_idx" ON "Document"("documentType", "jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "Document_entityId_canonicalKey_key" ON "Document"("entityId", "canonicalKey");

-- CreateIndex
CREATE UNIQUE INDEX "Version_publicId_key" ON "Version"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Version_legacySnapshotId_key" ON "Version"("legacySnapshotId");

-- CreateIndex
CREATE INDEX "Version_documentId_capturedAt_idx" ON "Version"("documentId", "capturedAt");

-- CreateIndex
CREATE INDEX "Version_publicEvidence_idx" ON "Version"("publicEvidence");

-- CreateIndex
CREATE UNIQUE INDEX "Version_documentId_sequence_key" ON "Version"("documentId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Version_documentId_contentHash_key" ON "Version"("documentId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Change_publicId_key" ON "Change"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Change_legacyPolicyChangeId_key" ON "Change"("legacyPolicyChangeId");

-- CreateIndex
CREATE INDEX "Change_documentId_detectedAt_idx" ON "Change"("documentId", "detectedAt");

-- CreateIndex
CREATE INDEX "Change_fromVersionId_idx" ON "Change"("fromVersionId");

-- CreateIndex
CREATE INDEX "Change_toVersionId_idx" ON "Change"("toVersionId");

-- CreateIndex
CREATE INDEX "Change_publicEvidence_publishedAt_idx" ON "Change"("publicEvidence", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Change_documentId_toVersionId_key" ON "Change"("documentId", "toVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Provision_publicId_key" ON "Provision"("publicId");

-- CreateIndex
CREATE INDEX "Provision_taxonomyKey_assessment_idx" ON "Provision"("taxonomyKey", "assessment");

-- CreateIndex
CREATE INDEX "Provision_reviewStatus_idx" ON "Provision"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Provision_changeId_taxonomyKey_ordinal_key" ON "Provision"("changeId", "taxonomyKey", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDiscoveryJob_companyId_key" ON "PolicyDiscoveryJob"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDiscoveryJob_runToken_key" ON "PolicyDiscoveryJob"("runToken");

-- CreateIndex
CREATE INDEX "PolicyDiscoveryJob_status_startedAt_idx" ON "PolicyDiscoveryJob"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyInquiry_publicToken_key" ON "PolicyInquiry"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyInquiry_activeDedupeKey_key" ON "PolicyInquiry"("activeDedupeKey");

-- CreateIndex
CREATE INDEX "PolicyInquiry_status_createdAt_idx" ON "PolicyInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PolicyInquiry_dedupeKey_idx" ON "PolicyInquiry"("dedupeKey");

-- CreateIndex
CREATE INDEX "PolicyInquiry_matchedCompanyId_idx" ON "PolicyInquiry"("matchedCompanyId");

-- CreateIndex
CREATE INDEX "PolicyDiscoveryCandidate_companyId_status_idx" ON "PolicyDiscoveryCandidate"("companyId", "status");

-- CreateIndex
CREATE INDEX "PolicyDiscoveryCandidate_createdAt_idx" ON "PolicyDiscoveryCandidate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDiscoveryCandidate_companyId_url_type_jurisdiction_key" ON "PolicyDiscoveryCandidate"("companyId", "url", "type", "jurisdiction");

-- CreateIndex
CREATE INDEX "Policy_companyId_idx" ON "Policy"("companyId");

-- CreateIndex
CREATE INDEX "Policy_jurisdiction_idx" ON "Policy"("jurisdiction");

-- CreateIndex
CREATE INDEX "Policy_sourceMigrationPending_idx" ON "Policy"("sourceMigrationPending");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_companyId_type_jurisdiction_url_key" ON "Policy"("companyId", "type", "jurisdiction", "url");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_policyId_idx" ON "PolicyCheckLog"("policyId");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_checkedAt_idx" ON "PolicyCheckLog"("checkedAt");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_status_idx" ON "PolicyCheckLog"("status");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_scanRunId_idx" ON "PolicyCheckLog"("scanRunId");

-- CreateIndex
CREATE INDEX "PolicyCheckLog_sourceRetrievalId_idx" ON "PolicyCheckLog"("sourceRetrievalId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanRun_leaseKey_key" ON "ScanRun"("leaseKey");

-- CreateIndex
CREATE INDEX "ScanRun_startedAt_idx" ON "ScanRun"("startedAt");

-- CreateIndex
CREATE INDEX "ScanRun_status_idx" ON "ScanRun"("status");

-- CreateIndex
CREATE INDEX "ScanRun_leaseExpiresAt_idx" ON "ScanRun"("leaseExpiresAt");

-- CreateIndex
CREATE INDEX "SourceRetrieval_retrievalKey_createdAt_idx" ON "SourceRetrieval"("retrievalKey", "createdAt");

-- CreateIndex
CREATE INDEX "SourceRetrieval_status_idx" ON "SourceRetrieval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRetrieval_scanRunId_retrievalKey_key" ON "SourceRetrieval"("scanRunId", "retrievalKey");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRemediationIssue_retrievalKey_key" ON "SourceRemediationIssue"("retrievalKey");

-- CreateIndex
CREATE INDEX "SourceRemediationIssue_status_lastDetectedAt_idx" ON "SourceRemediationIssue"("status", "lastDetectedAt");

-- CreateIndex
CREATE INDEX "SourceRemediationIssue_reasonCode_idx" ON "SourceRemediationIssue"("reasonCode");

-- CreateIndex
CREATE INDEX "HistoricalSourceReference_policyId_capturedAt_idx" ON "HistoricalSourceReference"("policyId", "capturedAt");

-- CreateIndex
CREATE INDEX "HistoricalSourceReference_sourceRetrievalId_idx" ON "HistoricalSourceReference"("sourceRetrievalId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalSourceReference_policyId_source_capturedAt_key" ON "HistoricalSourceReference"("policyId", "source", "capturedAt");

-- CreateIndex
CREATE INDEX "PolicySnapshot_policyId_idx" ON "PolicySnapshot"("policyId");

-- CreateIndex
CREATE INDEX "PolicyChange_policyId_idx" ON "PolicyChange"("policyId");

-- CreateIndex
CREATE INDEX "PolicyChange_createdAt_idx" ON "PolicyChange"("createdAt");

-- CreateIndex
CREATE INDEX "PolicyChange_publicPublishedAt_idx" ON "PolicyChange"("publicPublishedAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_createdAt_idx" ON "WebhookDelivery"("endpointId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_changeId_idx" ON "WebhookDelivery"("changeId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_endpointId_eventId_key" ON "WebhookDelivery"("endpointId", "eventId");

-- CreateIndex
CREATE INDEX "WebhookDeliveryAttempt_deliveryId_attemptedAt_idx" ON "WebhookDeliveryAttempt"("deliveryId", "attemptedAt");

-- CreateIndex
CREATE INDEX "WebhookDeliveryAttempt_outcome_attemptedAt_idx" ON "WebhookDeliveryAttempt"("outcome", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDeliveryAttempt_deliveryId_attemptNumber_key" ON "WebhookDeliveryAttempt"("deliveryId", "attemptNumber");

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
CREATE INDEX "SourceOnboardingBatch_createdAt_idx" ON "SourceOnboardingBatch"("createdAt");

-- CreateIndex
CREATE INDEX "SourceOnboardingBatch_status_idx" ON "SourceOnboardingBatch"("status");

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

-- CreateIndex
CREATE UNIQUE INDEX "SourceOnboardingItem_batchId_rowNumber_key" ON "SourceOnboardingItem"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAccessLog_event_idx" ON "AdminAccessLog"("event");

-- CreateIndex
CREATE INDEX "AdminAccessLog_username_idx" ON "AdminAccessLog"("username");

-- CreateIndex
CREATE INDEX "AdminAccessLog_ipAddress_idx" ON "AdminAccessLog"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorAccessGrant_tokenHash_key" ON "InvestorAccessGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "InvestorAccessGrant_expiresAt_idx" ON "InvestorAccessGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "InvestorAccessGrant_revokedAt_idx" ON "InvestorAccessGrant"("revokedAt");

-- CreateIndex
CREATE INDEX "InvestorAccessGrant_createdAt_idx" ON "InvestorAccessGrant"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorAccessEvent_grantId_createdAt_idx" ON "InvestorAccessEvent"("grantId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestorAccessEvent_event_createdAt_idx" ON "InvestorAccessEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "InvestorAccessEvent_createdAt_idx" ON "InvestorAccessEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PressMetricEvent_eventType_createdAt_idx" ON "PressMetricEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "PressMetricEvent_eventType_target_createdAt_idx" ON "PressMetricEvent"("eventType", "target", "createdAt");

-- CreateIndex
CREATE INDEX "AdminDashboardMetricEvent_eventType_createdAt_idx" ON "AdminDashboardMetricEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AdminDashboardMetricEvent_createdAt_idx" ON "AdminDashboardMetricEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDashboardMetricEvent_visitId_eventKey_key" ON "AdminDashboardMetricEvent"("visitId", "eventKey");

-- CreateIndex
CREATE INDEX "AiModelInvocation_createdAt_idx" ON "AiModelInvocation"("createdAt");

-- CreateIndex
CREATE INDEX "AiModelInvocation_operation_createdAt_idx" ON "AiModelInvocation"("operation", "createdAt");

-- CreateIndex
CREATE INDEX "AiModelInvocation_modelId_outcome_createdAt_idx" ON "AiModelInvocation"("modelId", "outcome", "createdAt");

-- CreateIndex
CREATE INDEX "AiModelInvocation_traceId_idx" ON "AiModelInvocation"("traceId");

-- CreateIndex
CREATE INDEX "RegionImpact_policyChangeId_idx" ON "RegionImpact"("policyChangeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_confirmationToken_key" ON "Subscriber"("confirmationToken");

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
