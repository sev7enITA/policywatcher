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

CREATE INDEX "AiModelInvocation_createdAt_idx" ON "AiModelInvocation"("createdAt");
CREATE INDEX "AiModelInvocation_operation_createdAt_idx" ON "AiModelInvocation"("operation", "createdAt");
CREATE INDEX "AiModelInvocation_modelId_outcome_createdAt_idx" ON "AiModelInvocation"("modelId", "outcome", "createdAt");
CREATE INDEX "AiModelInvocation_traceId_idx" ON "AiModelInvocation"("traceId");
