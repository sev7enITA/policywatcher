import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { runWebhookDeliveryCycle } from '@/lib/webhookDeliveryData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    return NextResponse.json(await runWebhookDeliveryCycle(), { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('[Webhook Delivery Cron] Cycle failed:', error instanceof Error ? error.name : 'unknown_error');
    return NextResponse.json({ error: 'Webhook delivery cycle failed.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
