-- Privacy-minimized newsroom aggregate events.
-- The timestamp is the row key so no separate persistent event or visitor identifier is required.
CREATE TABLE "PressMetricEvent" (
    "eventType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL PRIMARY KEY
);

CREATE INDEX "PressMetricEvent_eventType_createdAt_idx" ON "PressMetricEvent"("eventType", "createdAt");
CREATE INDEX "PressMetricEvent_eventType_target_createdAt_idx" ON "PressMetricEvent"("eventType", "target", "createdAt");
