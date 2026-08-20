/**
 * PolicyWatcher - Risk Trends API
 *
 * GET /api/trends
 *   ?companyId=xxx   -> risk score history for a single company (all its policies)
 *   ?industry=xxx    -> risk-change event stream for an industry sector
 *
 * Returns chronologically-ordered data points suitable for line/area charts.
 * Event sequence and source snapshot version are deliberately separate.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import type { Prisma } from '@prisma/client';
import { publicChangeWhere } from '@/lib/publicDataGate';
import { buildRiskTrendResponse } from '@/lib/riskTrends';

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
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-trends' });
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
      where: publicChangeWhere(whereClause),
      include: {
        policy: {
          include: {
            company: true,
          },
        },
        newSnapshot: {
          select: {
            version: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(buildRiskTrendResponse(changes));
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching trends.' },
      { status: 500 }
    );
  }
}
