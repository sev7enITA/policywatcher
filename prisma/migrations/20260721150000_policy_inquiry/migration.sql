CREATE TABLE "PolicyInquiry" (
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
);

CREATE UNIQUE INDEX "PolicyInquiry_publicToken_key" ON "PolicyInquiry"("publicToken");
CREATE INDEX "PolicyInquiry_status_createdAt_idx" ON "PolicyInquiry"("status", "createdAt");
CREATE INDEX "PolicyInquiry_dedupeKey_idx" ON "PolicyInquiry"("dedupeKey");
CREATE INDEX "PolicyInquiry_matchedCompanyId_idx" ON "PolicyInquiry"("matchedCompanyId");
