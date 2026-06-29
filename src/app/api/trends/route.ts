/**
 * PolicyWatcher - Risk Trends API
 *
 * GET /api/trends
 *   ?companyId=xxx   -> risk score history for a single company (all its policies)
 *   ?industry=xxx    -> aggregated risk score history for an industry sector
 *
 * Returns chronologically-ordered data points suitable for line/area charts:
 *   { points: [{ date, score, companyName, policyName, version }], summary: {...} }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import type { Prisma } from '@prisma/client';

/** A single data point on the risk-score timeline chart. */
interface TrendPoint {
  date: string; // ISO
  score: number;
  companyName: string;
  policyName: string;
  version: number;
  risk: string;
}

/**
 * Returns chronologically ordered risk-score data points.
 *
 * Supports two optional query params for scoping:
 * - `companyId`: limit to a single company's policies.
 * - `industry`: limit to all companies in a given industry sector.
 *
 * Also computes a summary object with avg/min/max/delta for quick insights.
 *
 * @param request - The incoming request with optional `?companyId=` or `?industry=`.
 * @returns JSON `{ points: TrendPoint[], summary }` or 500 on error.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const industry = searchParams.get('industry');

    const whereClause: Prisma.PolicyChangeWhereInput = {};
    if (companyId) {
      whereClause.policy = { companyId };
    } else if (industry) {
      whereClause.policy = {
        company: { industry },
      };
    }

    const changes = await db.policyChange.findMany({
      where: whereClause,
      include: {
        policy: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const points: TrendPoint[] = changes.map((c) => ({
      date: c.createdAt.toISOString(),
      score: c.overallScore,
      companyName: c.policy.company.name,
      policyName: c.policy.name,
      version: c.newSnapshotId ? 0 : 0, // version not directly available here
      risk: c.overallRisk,
    }));

    // Summary stats
    const scores = points.map((p) => p.score);
    const summary = {
      count: points.length,
      avgScore: scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0,
      minScore: scores.length ? Math.min(...scores) : 0,
      maxScore: scores.length ? Math.max(...scores) : 0,
      latestScore: scores.length ? scores[scores.length - 1] : 0,
      firstScore: scores.length ? scores[0] : 0,
      // delta: latest - first (positive = worsening)
      delta: scores.length
        ? Math.round((scores[scores.length - 1] - scores[0]) * 10) / 10
        : 0,
    };

    return NextResponse.json({ points, summary });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching trends.' },
      { status: 500 }
    );
  }
}
