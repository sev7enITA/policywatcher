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

CREATE UNIQUE INDEX "Entity_publicId_key" ON "Entity"("publicId");
CREATE UNIQUE INDEX "Entity_canonicalKey_key" ON "Entity"("canonicalKey");
CREATE UNIQUE INDEX "Entity_legacyCompanyId_key" ON "Entity"("legacyCompanyId");
CREATE INDEX "Entity_entityType_idx" ON "Entity"("entityType");

CREATE UNIQUE INDEX "Document_publicId_key" ON "Document"("publicId");
CREATE UNIQUE INDEX "Document_legacyPolicyId_key" ON "Document"("legacyPolicyId");
CREATE UNIQUE INDEX "Document_entityId_canonicalKey_key" ON "Document"("entityId", "canonicalKey");
CREATE INDEX "Document_entityId_idx" ON "Document"("entityId");
CREATE INDEX "Document_documentType_jurisdiction_idx" ON "Document"("documentType", "jurisdiction");

CREATE UNIQUE INDEX "Version_publicId_key" ON "Version"("publicId");
CREATE UNIQUE INDEX "Version_legacySnapshotId_key" ON "Version"("legacySnapshotId");
CREATE UNIQUE INDEX "Version_documentId_sequence_key" ON "Version"("documentId", "sequence");
CREATE UNIQUE INDEX "Version_documentId_contentHash_key" ON "Version"("documentId", "contentHash");
CREATE INDEX "Version_documentId_capturedAt_idx" ON "Version"("documentId", "capturedAt");
CREATE INDEX "Version_publicEvidence_idx" ON "Version"("publicEvidence");

CREATE UNIQUE INDEX "Change_publicId_key" ON "Change"("publicId");
CREATE UNIQUE INDEX "Change_legacyPolicyChangeId_key" ON "Change"("legacyPolicyChangeId");
CREATE UNIQUE INDEX "Change_documentId_toVersionId_key" ON "Change"("documentId", "toVersionId");
CREATE INDEX "Change_documentId_detectedAt_idx" ON "Change"("documentId", "detectedAt");
CREATE INDEX "Change_fromVersionId_idx" ON "Change"("fromVersionId");
CREATE INDEX "Change_toVersionId_idx" ON "Change"("toVersionId");
CREATE INDEX "Change_publicEvidence_publishedAt_idx" ON "Change"("publicEvidence", "publishedAt");

CREATE UNIQUE INDEX "Provision_publicId_key" ON "Provision"("publicId");
CREATE UNIQUE INDEX "Provision_changeId_taxonomyKey_ordinal_key" ON "Provision"("changeId", "taxonomyKey", "ordinal");
CREATE INDEX "Provision_taxonomyKey_assessment_idx" ON "Provision"("taxonomyKey", "assessment");
CREATE INDEX "Provision_reviewStatus_idx" ON "Provision"("reviewStatus");
