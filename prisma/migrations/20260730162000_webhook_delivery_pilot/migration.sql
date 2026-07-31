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
  CONSTRAINT "WebhookDelivery_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "PolicyChange"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebhookDelivery_endpointId_eventId_key" ON "WebhookDelivery"("endpointId", "eventId");
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt");
CREATE INDEX "WebhookDelivery_endpointId_createdAt_idx" ON "WebhookDelivery"("endpointId", "createdAt");
CREATE INDEX "WebhookDelivery_changeId_idx" ON "WebhookDelivery"("changeId");

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
  CONSTRAINT "WebhookDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "WebhookDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebhookDeliveryAttempt_deliveryId_attemptNumber_key" ON "WebhookDeliveryAttempt"("deliveryId", "attemptNumber");
CREATE INDEX "WebhookDeliveryAttempt_deliveryId_attemptedAt_idx" ON "WebhookDeliveryAttempt"("deliveryId", "attemptedAt");
CREATE INDEX "WebhookDeliveryAttempt_outcome_attemptedAt_idx" ON "WebhookDeliveryAttempt"("outcome", "attemptedAt");
