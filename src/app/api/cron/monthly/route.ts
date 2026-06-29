/**
 * PolicyWatcher - Monthly Digest Cron Endpoint
 *
 * @route GET /api/cron/monthly
 *
 * Designed to be triggered by a cron scheduler once per month. Collects all
 * policy changes from the last 30 days, filters them per subscriber's
 * region/industry preferences, and sends personalised monthly digest emails
 * to ALL active subscribers (regardless of frequency preference).
 *
 * @auth    Bearer token via `Authorization` header (validated by `isAuthorized`).
 * @rateLimit None (protected by auth).
 *
 * @returns {{ success: boolean, message: string }}
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendMonthlyDigest, ChangedPolicySummary } from '@/lib/mailer';
import { isAuthorized } from '@/lib/auth';
import { normalizePreferenceKey, splitPreferenceKeys } from '@/lib/subscriberPreferences';

/**
 * Sends a personalised monthly digest to every active subscriber.
 *
 * Steps:
 * 1. Fetch all active subscribers (no frequency filter — monthly is a catch-all).
 * 2. Query PolicyChanges created within the last 30 days.
 * 3. For each subscriber, filter changes by matching regions & industries.
 * 4. Send the digest email (failures are logged but do not abort the loop).
 *
 * @param request - The incoming request (must pass auth check).
 * @returns JSON success message with the count of emails sent.
 */
// GET endpoint to be triggered by a cron job
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // 1. Get all active subscribers
    const subscribers = await db.subscriber.findMany({
      where: { isActive: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No active subscribers.' });
    }

    // 2. Get recent policy changes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChanges = await db.policyChange.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        policy: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Map to ChangedPolicySummary format
    const mappedChanges: ChangedPolicySummary[] = recentChanges.map((change) => ({
      companyName: change.policy.company.name,
      policyName: change.policy.name,
      overallRisk: change.overallRisk,
      overallScore: change.overallScore,
      summaryEn: change.aiSummaryEn.substring(0, 300),
      url: change.policy.url,
      region: change.policy.jurisdiction,
      industry: change.policy.company.industry,
    }));

    // 4. Send personalized digest to each subscriber
    let sentCount = 0;
    for (const sub of subscribers) {
      const subscriberRegions = splitPreferenceKeys(sub.regions);
      const subscriberIndustries = splitPreferenceKeys(sub.industries);

      const filteredChanges = mappedChanges.filter(p => {
        const hasRegion = subscriberRegions.includes(normalizePreferenceKey(p.region));
        const hasIndustry = subscriberIndustries.includes(normalizePreferenceKey(p.industry));
        return hasRegion && hasIndustry;
      });

      try {
        await sendMonthlyDigest(
          sub.email,
          sub.name || undefined,
          filteredChanges,
          sub.unsubscribeToken
        );
        sentCount++;
      } catch (err) {
        console.error(`Failed to send monthly digest to ${sub.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, message: `Sent updates to ${sentCount} subscribers.` });
  } catch (error) {
    console.error('Monthly cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
