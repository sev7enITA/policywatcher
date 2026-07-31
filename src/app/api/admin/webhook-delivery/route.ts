import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import {
  getWebhookDeliveryOperations,
  runWebhookDeliveryCycle,
  scheduleWebhookDeliveryRetry,
} from '@/lib/webhookDeliveryData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };

function mutationAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) return NextResponse.json({ error: 'Admin access required' }, { status: 403, headers: NO_STORE_HEADERS });
  try {
    return NextResponse.json({ generatedAt: new Date().toISOString(), role: session.role, ...(await getWebhookDeliveryOperations()) }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Webhook Delivery Admin] Read failed:', error instanceof Error ? error.name : 'unknown_error');
    return NextResponse.json({ error: 'Webhook delivery operations are temporarily unavailable.' }, { status: 503, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403, headers: NO_STORE_HEADERS });
  if (!mutationAllowed(request)) return NextResponse.json({ error: 'Cross-origin mutation rejected' }, { status: 403, headers: NO_STORE_HEADERS });
  try {
    return NextResponse.json(await runWebhookDeliveryCycle(), { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Webhook Delivery Admin] Cycle failed:', error instanceof Error ? error.name : 'unknown_error');
    return NextResponse.json({ error: 'The bounded delivery cycle did not complete.' }, { status: 503, headers: NO_STORE_HEADERS });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403, headers: NO_STORE_HEADERS });
  if (!mutationAllowed(request)) return NextResponse.json({ error: 'Cross-origin mutation rejected' }, { status: 403, headers: NO_STORE_HEADERS });
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415, headers: NO_STORE_HEADERS });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2_048) return NextResponse.json({ error: 'Request body is too large' }, { status: 413, headers: NO_STORE_HEADERS });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (Object.keys(body).sort().join(',') !== 'action,deliveryId' || body.action !== 'retry' || typeof body.deliveryId !== 'string') {
      return NextResponse.json({ error: 'deliveryId and action=retry are required' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const result = await scheduleWebhookDeliveryRetry(body.deliveryId);
    if (!result) return NextResponse.json({ error: 'Delivery is not eligible for retry' }, { status: 409, headers: NO_STORE_HEADERS });
    return NextResponse.json({ delivery: result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE_HEADERS });
    console.error('[Webhook Delivery Admin] Retry scheduling failed:', error instanceof Error ? error.name : 'unknown_error');
    return NextResponse.json({ error: 'Unable to schedule delivery retry.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
