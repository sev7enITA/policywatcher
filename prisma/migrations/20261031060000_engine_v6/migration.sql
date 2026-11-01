-- AlterTable
ALTER TABLE "PolicyCheckLog" ADD COLUMN "engineTaskId" TEXT;

-- CreateTable
CREATE TABLE "EngineRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'observe',
    "notificationMode" TEXT NOT NULL DEFAULT 'silent',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "selected" INTEGER NOT NULL DEFAULT 0,
    "requestedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EngineTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "policyId" TEXT,
    "activePolicyId" TEXT,
    "dependencyId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'acquire',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "leaseToken" TEXT,
    "leaseExpiresAt" DATETIME,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedBaselineHash" TEXT,
    "inputJson" TEXT NOT NULL,
    "checkpointJson" TEXT,
    "resultJson" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "EngineTask_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EngineRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EngineArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bodyJson" TEXT NOT NULL,
    "byteCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EngineAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "reason" TEXT
);

-- CreateTable
CREATE TABLE "EngineSourceContract" (
    "policyId" TEXT NOT NULL PRIMARY KEY,
    "contractJson" TEXT NOT NULL,
    "contractHash" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EnginePolicyState" (
    "policyId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'publish',
    "candidateHash" TEXT,
    "candidateArtifactId" TEXT,
    "candidateRunId" TEXT,
    "candidateObservedAt" DATETIME,
    "candidateProfileHash" TEXT,
    "lastAttemptAt" DATETIME,
    "lastVerifiedAt" DATETIME,
    "lastChangedAt" DATETIME,
    "nextDueAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    PRIMARY KEY ("policyId", "mode")
);

-- CreateTable
CREATE TABLE "EngineOrigin" (
    "origin" TEXT NOT NULL PRIMARY KEY,
    "leaseToken" TEXT,
    "leaseExpiresAt" DATETIME,
    "nextAllowedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EngineHttpCache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "artifactId" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "profileHash" TEXT NOT NULL,
    "validatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EngineReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceKey" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'publish',
    "expectedBaselineHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reasonsJson" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "changeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EngineOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "leaseToken" TEXT,
    "leaseExpiresAt" DATETIME,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "EngineRun_requestKey_key" ON "EngineRun"("requestKey");

-- CreateIndex
CREATE INDEX "EngineRun_status_createdAt_idx" ON "EngineRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EngineTask_key_key" ON "EngineTask"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EngineTask_activePolicyId_key" ON "EngineTask"("activePolicyId");

-- CreateIndex
CREATE INDEX "EngineTask_status_nextAttemptAt_priority_idx" ON "EngineTask"("status", "nextAttemptAt", "priority");

-- CreateIndex
CREATE INDEX "EngineTask_runId_kind_idx" ON "EngineTask"("runId", "kind");

-- CreateIndex
CREATE INDEX "EngineTask_policyId_createdAt_idx" ON "EngineTask"("policyId", "createdAt");

-- CreateIndex
CREATE INDEX "EngineTask_dependencyId_idx" ON "EngineTask"("dependencyId");

-- CreateIndex
CREATE INDEX "EngineAttempt_taskId_startedAt_idx" ON "EngineAttempt"("taskId", "startedAt");

-- CreateIndex
CREATE INDEX "EnginePolicyState_mode_nextDueAt_idx" ON "EnginePolicyState"("mode", "nextDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "EngineReview_evidenceKey_key" ON "EngineReview"("evidenceKey");

-- CreateIndex
CREATE UNIQUE INDEX "EngineReview_taskId_key" ON "EngineReview"("taskId");

-- CreateIndex
CREATE INDEX "EngineReview_status_createdAt_idx" ON "EngineReview"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EngineOutbox_eventKey_key" ON "EngineOutbox"("eventKey");

-- CreateIndex
CREATE INDEX "EngineOutbox_status_nextAttemptAt_idx" ON "EngineOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyCheckLog_engineTaskId_key" ON "PolicyCheckLog"("engineTaskId");
