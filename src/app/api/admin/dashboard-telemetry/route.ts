import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import {
  ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS,
  aggregateAdminDashboardTelemetry,
  buildUnavailableDashboardTelemetry,
  parseAdminDashboardTelemetryInput,
} from '@/lib/adminDashboardTelemetry';
import { recordAdminDashboardTelemetry } from '@/lib/adminDashboardTelemetryStorage';

const MAX_BODY_BYTES = 512;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) return json({ error: 'Unauthorized' }, 401);

  const checkedAt = new Date();
  const windowStartedAt = new Date(checkedAt.getTime() - ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS * 86_400_000);
  try {
    const rows = await db.adminDashboardMetricEvent.findMany({
      where: { createdAt: { gte: windowStartedAt, lte: checkedAt } },
      select: {
        visitId: true,
        eventType: true,
        priorityId: true,
        destination: true,
        numericValue: true,
        viewportClass: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5_000,
    });
    return json({
      telemetry: aggregateAdminDashboardTelemetry(rows as Parameters<typeof aggregateAdminDashboardTelemetry>[0], checkedAt.toISOString()),
      role: session.role,
    });
  } catch {
    console.error('[Admin Dashboard Telemetry] Aggregate read unavailable.');
    return json({ telemetry: buildUnavailableDashboardTelemetry(checkedAt.toISOString()), role: session.role }, 503);
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) return json({ error: 'Unauthorized' }, 401);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json({ error: 'Expected application/json.' }, 415);
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return json({ error: 'Payload too large.' }, 413);
  const limited = rateLimit(request, { intervalMs: 60_000, max: 120, name: 'admin-dashboard-telemetry', logClientIp: false });
  if (limited) {
    limited.headers.set('Cache-Control', 'no-store, max-age=0');
    return limited;
  }

  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json({ error: 'Payload too large.' }, 413);
  let decoded: unknown = null;
  try { decoded = JSON.parse(rawBody); } catch { /* strict parser returns null */ }
  const payload = parseAdminDashboardTelemetryInput(decoded);
  if (!payload) return json({ error: 'Invalid dashboard telemetry payload.' }, 400);

  try {
    const outcome = await recordAdminDashboardTelemetry(payload, session.role);
    if (outcome === 'arrival-unconfirmed') return json({ error: 'No matching CTA attempt was recorded.' }, 409);
    return json({ accepted: true, recorded: outcome === 'recorded' }, outcome === 'recorded' ? 202 : 200);
  } catch {
    console.error('[Admin Dashboard Telemetry] Event write unavailable.');
    return json({ error: 'Dashboard measurement unavailable.' }, 503);
  }
}
