import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { parseOutreachOperationPayload } from '@/lib/editorialCampaigns';
import { ensurePressMetricStorage, nextPressMetricEventDate } from '@/lib/pressMetricStorage';
import { rateLimit } from '@/lib/rateLimit';

const MAX_BODY_BYTES = 256;

function noStoreJson(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) return noStoreJson({ error: 'Unauthorized' }, 401);
  if (session.role !== 'admin') return noStoreJson({ error: 'Admin access required' }, 403);

  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return noStoreJson({ error: 'Expected application/json.' }, 415);
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return noStoreJson({ error: 'Payload too large.' }, 413);

  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'admin-outreach-events', logClientIp: false });
  if (limited) {
    limited.headers.set('Cache-Control', 'no-store, max-age=0');
    return limited;
  }

  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return noStoreJson({ error: 'Payload too large.' }, 413);
  let json: unknown = null;
  try { json = JSON.parse(rawBody); } catch { /* handled by strict parser */ }
  const payload = parseOutreachOperationPayload(json);
  if (!payload) return noStoreJson({ error: 'Invalid outreach operation payload.' }, 400);

  try {
    await ensurePressMetricStorage();
    await db.pressMetricEvent.create({
      data: { ...payload, createdAt: nextPressMetricEventDate() },
    });
  } catch {
    console.error('[Admin Outreach] Aggregate event write failed.');
    return noStoreJson({ error: 'Event storage unavailable.' }, 503);
  }

  return noStoreJson({ accepted: true }, 202);
}
