/**
 * PolicyWatcher v2.0 - Subscriber API
 *
 * POST: Create a new subscriber (validates email, prevents duplicates)
 * DELETE: Unsubscribe by email
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import {
  SUBSCRIBER_FREQUENCIES,
  SUBSCRIBER_INDUSTRIES,
  SUBSCRIBER_REGIONS,
  isValidSubscriberEmail,
  normalizePreferenceValue,
} from '@/lib/subscriberPreferences';

const VALID_REGIONS = new Set<string>(SUBSCRIBER_REGIONS);
const VALID_INDUSTRIES = new Set<string>(SUBSCRIBER_INDUSTRIES);
const VALID_FREQUENCIES = new Set<string>(SUBSCRIBER_FREQUENCIES);
const GENERIC_SUBSCRIBE_MESSAGE =
  'If this email can receive PolicyWatcher alerts, a confirmation message has been sent.';

function normalizeList(
  value: unknown,
  allowed: Set<string>,
  fallback: string[]
): string | null {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : fallback;

  const normalized = raw
    .map((item) => normalizePreferenceValue(String(item)))
    .filter((item) => allowed.has(item));

  if (normalized.length === 0) return null;
  return Array.from(new Set(normalized)).join(',');
}

function normalizeFrequency(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return 'INSTANT';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return VALID_FREQUENCIES.has(normalized) ? normalized : null;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

// -- POST: Subscribe --

/**
 * Creates a pending subscriber or issues a fresh confirmation request.
 *
 * Validates the email format, checks for duplicates, handles reactivation
 * of soft-deleted subscribers, and sends a double-opt-in confirmation email.
 *
 * @param request - The incoming request with `{ email, name?, regions?, industries?, frequency? }`.
 * @returns Generic 202 response for create/reactivation/existing records.
 */
export async function POST(request: NextRequest) {
  // Rate limit: prevent email bombing. 3/hour per IP.
  const limited = rateLimit(request, {
    intervalMs: 60 * 60 * 1000,
    max: 3,
    name: 'subscribe',
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email, name, regions, industries, frequency } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidSubscriberEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    const normalizedRegions = normalizeList(regions, VALID_REGIONS, ['EU', 'US', 'Global']);
    const normalizedIndustries = normalizeList(industries, VALID_INDUSTRIES, ['Tech Giant', 'FinTech']);
    const normalizedFrequency = normalizeFrequency(frequency);

    if (!normalizedRegions || !normalizedIndustries || !normalizedFrequency) {
      return NextResponse.json(
        { error: 'Invalid subscription preferences.' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Inactive and pending records receive a new single-use confirmation token.
      if (!existing.isActive) {
        const pending = await db.subscriber.update({
          where: { id: existing.id },
          data: {
            isActive: false,
            name: normalizeName(name) || existing.name,
            regions: normalizedRegions,
            industries: normalizedIndustries,
            frequency: normalizedFrequency,
            confirmationToken: randomUUID(),
            confirmationRequestedAt: new Date(),
            confirmedAt: null,
          },
        });
        
        try {
          const { sendSubscriptionConfirmationRequest } = await import('@/lib/mailer');
          await sendSubscriptionConfirmationRequest(
            pending.email,
            pending.name || undefined,
            pending.regions,
            pending.industries,
            pending.frequency,
            pending.confirmationToken as string,
          );
        } catch (mailError) {
          console.error('[Subscribers API] Failed to send confirmation:', mailError);
        }

        return NextResponse.json(
          { message: GENERIC_SUBSCRIBE_MESSAGE },
          { status: 202 }
        );
      }

      return NextResponse.json(
        { message: GENERIC_SUBSCRIBE_MESSAGE },
        { status: 202 }
      );
    }

    // Create new subscriber
    const subscriber = await db.subscriber.create({
      data: {
        email: normalizedEmail,
        name: normalizeName(name),
        regions: normalizedRegions,
        industries: normalizedIndustries,
        frequency: normalizedFrequency,
        isActive: false,
        confirmationToken: randomUUID(),
        confirmationRequestedAt: new Date(),
        confirmedAt: null,
      },
    });

    // Send a double-opt-in request. The record remains inactive until POST /confirm.
    try {
      const { sendSubscriptionConfirmationRequest } = await import('@/lib/mailer');
      await sendSubscriptionConfirmationRequest(
        subscriber.email,
        subscriber.name || undefined,
        subscriber.regions,
        subscriber.industries,
        subscriber.frequency,
        subscriber.confirmationToken as string,
      );
    } catch (mailError) {
      console.error('[Subscribers API] Failed to send confirmation:', mailError);
    }

    return NextResponse.json(
      { message: GENERIC_SUBSCRIBE_MESSAGE },
      { status: 202 }
    );
  } catch (error) {
    console.error('[Subscribers API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// -- DELETE: Unsubscribe --

/**
 * Soft-deletes a subscriber by marking them as inactive.
 *
 * Requires both `email` and the subscriber's unique `token` to prevent
 * unauthorised unsubscription. Returns a generic error on mismatch to
 * avoid user-enumeration attacks.
 *
 * @param request - The incoming request with `{ email, token }`.
 * @returns 200 on success, 400/403/500 on error.
 */
export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60 * 60 * 1000,
    max: 10,
    name: 'unsubscribe',
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Unsubscribe token is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await db.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber || subscriber.unsubscribeToken !== token) {
      // Return a generic error to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid unsubscribe request.' },
        { status: 403 }
      );
    }

    // Soft-delete: mark as inactive
    await db.subscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        confirmationToken: null,
        confirmationRequestedAt: null,
      },
    });

    return NextResponse.json(
      { message: 'Successfully unsubscribed.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Subscribers API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
