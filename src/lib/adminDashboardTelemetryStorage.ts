import { db } from '@/lib/db';
import type { AdminRole } from '@/lib/adminAuth';
import {
  ADMIN_DASHBOARD_CLEANUP_BATCH,
  ADMIN_DASHBOARD_TELEMETRY_RETENTION_DAYS,
  type AdminDashboardTelemetryInput,
  telemetryEventKey,
} from '@/lib/adminDashboardTelemetry';

export async function recordAdminDashboardTelemetry(
  input: AdminDashboardTelemetryInput,
  actorRole: AdminRole,
): Promise<'recorded' | 'deduplicated' | 'arrival-unconfirmed'> {
  if (input.eventType === 'canonical-route-arrival') {
    const attemptKey = telemetryEventKey({ ...input, eventType: 'action-center-cta-attempt' });
    const attempt = await db.adminDashboardMetricEvent.findUnique({
      where: { visitId_eventKey: { visitId: input.visitId, eventKey: attemptKey } },
      select: { id: true },
    });
    if (!attempt) return 'arrival-unconfirmed';
  }

  try {
    await db.adminDashboardMetricEvent.create({
      data: {
        visitId: input.visitId,
        eventType: input.eventType,
        eventKey: telemetryEventKey(input),
        actorRole,
        priorityId: input.priorityId,
        destination: input.destination,
        numericValue: input.numericValue,
        viewportClass: input.viewportClass,
      },
    });
    return 'recorded';
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'P2002') return 'deduplicated';
    throw error;
  }
}

export async function cleanupAdminDashboardTelemetry(
  now = new Date(),
  limit = ADMIN_DASHBOARD_CLEANUP_BATCH,
): Promise<number> {
  const cutoff = new Date(now.getTime() - ADMIN_DASHBOARD_TELEMETRY_RETENTION_DAYS * 86_400_000);
  const boundedLimit = Math.max(1, Math.min(ADMIN_DASHBOARD_CLEANUP_BATCH, Math.floor(limit)));
  const expired = await db.adminDashboardMetricEvent.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: boundedLimit,
    select: { id: true },
  });
  if (expired.length === 0) return 0;
  const result = await db.adminDashboardMetricEvent.deleteMany({
    where: { id: { in: expired.map((event) => event.id) } },
  });
  return result.count;
}
