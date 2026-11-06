-- CreateTable
CREATE TABLE "EngineClaim" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "claimKey" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "policyId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textIt" TEXT NOT NULL,
    "impact" INTEGER NOT NULL,
    "deltaIdsJson" TEXT NOT NULL,
    "interpretationStatus" TEXT NOT NULL DEFAULT 'inferred',
    "analystModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "analysisOutputHash" TEXT NOT NULL,
    "verifierModel" TEXT,
    "verifierVerdict" TEXT,
    "verifierReason" TEXT,
    "reviewId" TEXT,
    "changeId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineClaimEvidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "quote" TEXT NOT NULL,
    "quoteHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'observed',

    CONSTRAINT "EngineClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngineClaim_policyId_createdAt_idx" ON "EngineClaim"("policyId", "createdAt");

-- CreateIndex
CREATE INDEX "EngineClaim_verifierVerdict_interpretationStatus_idx" ON "EngineClaim"("verifierVerdict", "interpretationStatus");

-- CreateIndex
CREATE INDEX "EngineClaim_changeId_idx" ON "EngineClaim"("changeId");

-- CreateIndex
CREATE INDEX "EngineClaim_reviewId_idx" ON "EngineClaim"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "EngineClaim_taskId_claimKey_key" ON "EngineClaim"("taskId", "claimKey");

-- CreateIndex
CREATE INDEX "EngineClaimEvidence_documentHash_idx" ON "EngineClaimEvidence"("documentHash");

-- CreateIndex
CREATE UNIQUE INDEX "EngineClaimEvidence_claimId_ordinal_key" ON "EngineClaimEvidence"("claimId", "ordinal");

-- AddForeignKey
ALTER TABLE "EngineClaimEvidence" ADD CONSTRAINT "EngineClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "EngineClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
