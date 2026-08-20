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

CREATE TABLE "InvestorAccessEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT,
    "event" TEXT NOT NULL,
    "actorRole" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorAccessEvent_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InvestorAccessGrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "InvestorAccessGrant_tokenHash_key" ON "InvestorAccessGrant"("tokenHash");
CREATE INDEX "InvestorAccessGrant_expiresAt_idx" ON "InvestorAccessGrant"("expiresAt");
CREATE INDEX "InvestorAccessGrant_revokedAt_idx" ON "InvestorAccessGrant"("revokedAt");
CREATE INDEX "InvestorAccessGrant_createdAt_idx" ON "InvestorAccessGrant"("createdAt");
CREATE INDEX "InvestorAccessEvent_grantId_createdAt_idx" ON "InvestorAccessEvent"("grantId", "createdAt");
CREATE INDEX "InvestorAccessEvent_event_createdAt_idx" ON "InvestorAccessEvent"("event", "createdAt");
CREATE INDEX "InvestorAccessEvent_createdAt_idx" ON "InvestorAccessEvent"("createdAt");
