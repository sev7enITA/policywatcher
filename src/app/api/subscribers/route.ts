/**
 * PolicyWatcher v2.0 - Subscriber API
 *
 * POST: Create a new subscriber (validates email, prevents duplicates)
 * DELETE: Unsubscribe by email
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

// -- POST: Subscribe --

/**
 * Creates a new subscriber or reactivates a previously unsubscribed one.
 *
 * Validates the email format, checks for duplicates, handles reactivation
 * of soft-deleted subscribers, and fires a confirmation email (non-blocking).
 *
 * @param request - The incoming request with `{ email, name?, regions?, industries?, frequency? }`.
 * @returns 201 on creation, 200 on reactivation, 400/409/500 on error.
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.subscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      // If previously unsubscribed, reactivate
      if (!existing.isActive) {
        const reactivated = await db.subscriber.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            name: name || existing.name,
            regions: Array.isArray(regions) ? regions.join(',') : (regions || existing.regions),
            industries: Array.isArray(industries) ? industries.join(',') : (industries || existing.industries),
            frequency: frequency || existing.frequency,
          },
        });
        
        try {
          const { sendSubscriptionConfirmation } = await import('@/lib/mailer');
          sendSubscriptionConfirmation(
            reactivated.email,
            reactivated.name || undefined,
            reactivated.regions,
            reactivated.industries,
            reactivated.frequency,
            reactivated.unsubscribeToken
          );
        } catch (mailError) {
          console.error('[Subscribers API] Failed to send confirmation:', mailError);
        }

        return NextResponse.json(
          { message: 'Subscription reactivated.', subscriber: reactivated },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'This email is already subscribed.' },
        { status: 409 }
      );
    }

    // Create new subscriber
    const regionsStr = Array.isArray(regions) ? regions.join(',') : (regions || 'EU,US,Global');
    const industriesStr = Array.isArray(industries) ? industries.join(',') : (industries || 'Tech Giant,FinTech');

    const subscriber = await db.subscriber.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name || null,
        regions: regionsStr,
        industries: industriesStr,
        frequency: frequency || 'INSTANT',
        isActive: true,
      },
    });

    // Send confirmation email (non-blocking)
    try {
      const { sendSubscriptionConfirmation } = await import('@/lib/mailer');
      sendSubscriptionConfirmation(
        subscriber.email,
        subscriber.name || undefined,
        subscriber.regions,
        subscriber.industries,
        subscriber.frequency,
        subscriber.unsubscribeToken
      );
    } catch (mailError) {
      console.error('[Subscribers API] Failed to send confirmation:', mailError);
    }

    return NextResponse.json(
      { message: 'Subscription created.', subscriber },
      { status: 201 }
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

    const subscriber = await db.subscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
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
      data: { isActive: false },
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
