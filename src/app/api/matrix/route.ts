/**
 * PolicyWatcher - Cross-Company KPI Matrix API
 *
 * @route GET /api/matrix
 *
 * Builds a company by KPI matrix where each cell contains the "most
 * concerning" value across all of a company's policies (latest change).
 * Used by the CrossCompanyMatrix component to render the heatmap.
 *
 * @auth    None (public endpoint).
 * @rateLimit 60 requests / minute per IP.
 *
 * @returns {{ companies: MatrixRow[] }} where each row has company info + kpis map.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { allowSeededPublicData, publicPolicyWhere } from '@/lib/publicDataGate';
import {
  KPI_FIELD_KEYS,
  NOT_ASSESSED_KPI_VALUE,
  getMoreConcerningKpiValue,
} from '@/lib/metricsCatalog';

/**
 * Builds the cross-company KPI matrix.
 *
 * For each company, aggregates the most concerning KPI value across all its
 * policies' latest changes, then returns a flat array suitable for table rendering.
 *
 * @param request - The incoming Next.js request.
 * @returns JSON `{ companies: MatrixRow[] }` or 500 on error.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const policyWhere = publicPolicyWhere();
    const companies = await db.company.findMany({
      where: allowSeededPublicData() ? {} : { policies: { some: policyWhere } },
      include: {
        policies: {
          where: policyWhere,
          include: {
            changes: {
              where: { publicEvidence: true },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const matrixData = companies.map((company) => {
      const aggregatedKpis: Record<string, string> = {};
      
      // Initialize with 'Not assessed'
      KPI_FIELD_KEYS.forEach((key) => {
        aggregatedKpis[key] = NOT_ASSESSED_KPI_VALUE;
      });

      // Aggregate from latest changes of all policies
      company.policies.forEach((policy) => {
        const latestChange = policy.changes[0];
        if (latestChange) {
          KPI_FIELD_KEYS.forEach((key) => {
            const val = (latestChange as unknown as Record<string, string | null>)[key];
            if (val) {
              aggregatedKpis[key] = getMoreConcerningKpiValue(key, aggregatedKpis[key], val);
            }
          });
        }
      });

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website,
        industry: company.industry,
        kpis: aggregatedKpis,
      };
    }).filter((company) =>
      Object.values(company.kpis).some(
        (value) => value && value !== NOT_ASSESSED_KPI_VALUE
      )
    );

    return NextResponse.json({ companies: matrixData });
  } catch (error) {
    console.error('Error generating matrix data:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching matrix data.' },
      { status: 500 }
    );
  }
}
