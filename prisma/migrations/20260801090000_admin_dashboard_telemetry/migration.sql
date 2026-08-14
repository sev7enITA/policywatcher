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

CREATE UNIQUE INDEX "AdminDashboardMetricEvent_visitId_eventKey_key"
ON "AdminDashboardMetricEvent"("visitId", "eventKey");

CREATE INDEX "AdminDashboardMetricEvent_eventType_createdAt_idx"
ON "AdminDashboardMetricEvent"("eventType", "createdAt");

CREATE INDEX "AdminDashboardMetricEvent_createdAt_idx"
ON "AdminDashboardMetricEvent"("createdAt");
