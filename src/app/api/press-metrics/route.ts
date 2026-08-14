import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPressMetricRecord, parsePressMetricPayload } from '@/lib/pressMetrics';
import { ensurePressMetricStorage, nextPressMetricEventDate } from '@/lib/pressMetricStorage';
import { rateLimit } from '@/lib/rateLimit';

const MAX_BODY_BYTES = 256;

function noStoreJson(body: Record<string, string>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return noStoreJson({ error: 'Expected application/json.' }, 415);

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return noStoreJson({ error: 'Payload too large.' }, 413);
  }

  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'press-metrics', logClientIp: false });
  if (limited) {
    limited.headers.set('Cache-Control', 'no-store, max-age=0');
    return limited;
  }

  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return noStoreJson({ error: 'Payload too large.' }, 413);
  }

  const parsedJson = (() => {
    try { return JSON.parse(rawBody) as unknown; } catch { return null; }
  })();
  const payload = parsePressMetricPayload(parsedJson);
  if (!payload) return noStoreJson({ error: 'Invalid event payload.' }, 400);

  try {
    await ensurePressMetricStorage();
    await db.pressMetricEvent.create({ data: createPressMetricRecord(payload, nextPressMetricEventDate()) });
  } catch {
    console.error('[PressMetrics] Event write failed.');
    return noStoreJson({ error: 'Event storage unavailable.' }, 503);
  }

  return new NextResponse(null, {
    status: 202,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
