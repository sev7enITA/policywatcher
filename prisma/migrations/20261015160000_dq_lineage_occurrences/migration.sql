-- Existing capture metadata and public IDs are preserved.
-- No historical URL is inferred or bulk rewritten by this migration.
CREATE TABLE "ContentArtifact" (
  "contentHash" TEXT NOT NULL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "PolicySnapshot" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "PolicySnapshot" ADD COLUMN "requestedUrl" TEXT;
ALTER TABLE "PolicySnapshot" ADD COLUMN "finalUrl" TEXT;
ALTER TABLE "PolicySnapshot" ADD COLUMN "sourceProvenance" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "PolicySnapshot" ADD COLUMN "sourceRetrievalId" TEXT REFERENCES "SourceRetrieval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Version" ADD COLUMN "requestedUrl" TEXT;
ALTER TABLE "Version" ADD COLUMN "finalUrl" TEXT;
ALTER TABLE "Version" ADD COLUMN "sourceProvenance" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "Version" ADD COLUMN "contentArtifactHash" TEXT REFERENCES "ContentArtifact"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "Version_documentId_contentHash_key";
CREATE INDEX "Version_documentId_contentHash_idx" ON "Version"("documentId", "contentHash");
CREATE INDEX "Version_contentArtifactHash_idx" ON "Version"("contentArtifactHash");

ALTER TABLE "PolicyChange" ADD COLUMN "analysisTraceId" TEXT;
ALTER TABLE "PolicyChange" ADD COLUMN "analysisMethod" TEXT;
ALTER TABLE "PolicyChange" ADD COLUMN "analysisSchemaVersion" TEXT;
ALTER TABLE "PolicyChange" ADD COLUMN "analysisPromptVersion" TEXT;
ALTER TABLE "PolicyChange" ADD COLUMN "analysisInputHash" TEXT;
ALTER TABLE "PolicyChange" ADD COLUMN "analysisEvidenceJson" TEXT;
