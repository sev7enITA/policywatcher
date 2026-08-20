import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { readBoundedJsonObject } from '@/lib/requestBody';
import { isValidSubscriberEmail } from '@/lib/subscriberPreferences';

const MAX_CONFIRMATION_BODY_BYTES = 2 * 1024;
const CONFIRMATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const GENERIC_CONFIRMATION_MESSAGE =
  'If the confirmation link is valid, PolicyWatcher alerts are now active for this address.';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60 * 60 * 1000,
    max: 10,
    name: 'subscriber-confirm',
  });
  if (limited) return limited;

  const body = await readBoundedJsonObject(request, MAX_CONFIRMATION_BODY_BYTES);
  if (!body.ok) {
    return NextResponse.json(
      { error: body.reason === 'body_too_large' ? 'Payload too large.' : 'Invalid JSON body.' },
      { status: body.reason === 'body_too_large' ? 413 : 400 },
    );
  }

  const email = typeof body.value.email === 'string' ? body.value.email.trim().toLowerCase() : '';
  const token = typeof body.value.token === 'string' ? body.value.token.trim() : '';
  if (!isValidSubscriberEmail(email) || token.length < 16 || token.length > 128) {
    return NextResponse.json({ message: GENERIC_CONFIRMATION_MESSAGE }, { status: 200 });
  }

  try {
    const subscriber = await db.subscriber.findUnique({ where: { confirmationToken: token } });
    const requestedAt = subscriber?.confirmationRequestedAt?.getTime() ?? Number.NaN;
    const now = new Date();
    const confirmationIsCurrent = Number.isFinite(requestedAt)
      && requestedAt <= now.getTime()
      && requestedAt >= now.getTime() - CONFIRMATION_TOKEN_TTL_MS;
    if (subscriber && subscriber.email === email && !subscriber.isActive && confirmationIsCurrent) {
      await db.subscriber.update({
        where: { id: subscriber.id },
        data: {
          isActive: true,
          confirmedAt: now,
          confirmationToken: null,
        },
      });
    }
    return NextResponse.json({ message: GENERIC_CONFIRMATION_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error('[Subscribers Confirm API] Confirmation failed:', error instanceof Error ? error.message : 'unknown_error');
    return NextResponse.json({ error: 'Confirmation is temporarily unavailable.' }, { status: 500 });
  }
}
