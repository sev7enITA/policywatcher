/**
 * PolicyWatcher - Evidence Signals Board API
 *
 * @route GET /api/leaderboard
 *
 * Returns evidence-only leaderboard data derived from public baselines, source
 * retrieval logs, and publicEvidence-gated policy changes.
 *
 * @auth None (public endpoint).
 * @rateLimit 60 requests / minute per IP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardSnapshot } from '@/lib/leaderboardData';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-leaderboard' });
  if (limited) return limited;

  try {
    return NextResponse.json(await getLeaderboardSnapshot());
  } catch (error) {
    console.error('Error building leaderboard:', error);
    return NextResponse.json(
      { error: 'Evidence signals are temporarily unavailable.' },
      { status: 500 }
    );
  }
}
