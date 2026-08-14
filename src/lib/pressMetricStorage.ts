import { db } from '@/lib/db';

let readiness: Promise<void> | null = null;
let lastEventTimestamp = 0;

export function nextPressMetricEventDate(now = Date.now()): Date {
  const timestamp = Math.max(now, lastEventTimestamp + 1);
  lastEventTimestamp = timestamp;
  return new Date(timestamp);
}

async function createPressMetricStorage(): Promise<void> {
  // This small idempotent guard keeps optional newsroom telemetry from making
  // the admin shell unavailable when a managed host starts the Next.js runtime
  // without executing the source-level Prisma migration hook.
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PressMetricEvent" (
      "eventType" TEXT NOT NULL,
      "target" TEXT NOT NULL,
      "locale" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL PRIMARY KEY
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PressMetricEvent_eventType_createdAt_idx"
    ON "PressMetricEvent"("eventType", "createdAt")
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PressMetricEvent_eventType_target_createdAt_idx"
    ON "PressMetricEvent"("eventType", "target", "createdAt")
  `);
}

export function ensurePressMetricStorage(): Promise<void> {
  if (!readiness) {
    readiness = createPressMetricStorage().catch((error) => {
      readiness = null;
      throw error;
    });
  }
  return readiness;
}
