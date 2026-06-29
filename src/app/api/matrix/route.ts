/**
 * PolicyWatcher - Cross-Company KPI Matrix API
 *
 * @route GET /api/matrix
 *
 * Builds a company × KPI matrix where each cell contains the "most
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

// Weights to determine the "most concerning" value
const kpiWeights: Record<string, number> = {
  // Privacy
  'Extensive': 3, 'Broad': 3, 'Indefinite': 3, 'None': 3, 'Unrestricted': 3,
  'Moderate': 2, 'Limited': 2, 'Extended': 2, 'Partial': 2, 'Controlled': 2,
  'Minimal': 1, 'Defined': 1, 'Restricted': 1, 'Full': 1,

  // AI Governance
  'Not Available': 3, 'Company Claimed': 3, 'Opaque': 3, 'Undisclosed': 3, 'Absent': 3,
  'Shared': 2, 'Mentioned': 2,
  'Available': 1, 'User Retained': 1, 'Published': 1, 'Disclosed': 1, 'Committed': 1,

  // Ethics & Governance
  'Implicit': 3, 'Unspecified': 3,
  'Opt-Out': 2,
  'Explicit Opt-In': 1, 'Comprehensive': 1, 'Within 24h': 1, 'Within 72h': 1, 'Certified': 1, 'Transparent': 1,
  
  // Default/Fallback
  'Not assessed': 0
};

/**
 * Compares two KPI values and returns the more concerning one.
 * "Not assessed" is treated as neutral and yields to any real value.
 *
 * @param val1 - First KPI value.
 * @param val2 - Second KPI value.
 * @returns The value with the higher concern weight.
 */
const getMostConcerningValue = (val1: string, val2: string): string => {
  if (!val1 || val1 === 'Not assessed') return val2 || 'Not assessed';
  if (!val2 || val2 === 'Not assessed') return val1 || 'Not assessed';
  
  const w1 = kpiWeights[val1] || 0;
  const w2 = kpiWeights[val2] || 0;
  
  return w1 >= w2 ? val1 : val2;
};

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
    const companies = await db.company.findMany({
      include: {
        policies: {
          include: {
            changes: {
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

    const kpiKeys = [
      'kpiDataCollection',
      'kpiThirdPartySharing',
      'kpiDataRetention',
      'kpiRightToDeletion',
      'kpiCrossBorderTransfer',
      'kpiAiTrainingOptOut',
      'kpiAiOutputOwnership',
      'kpiAlgoTransparency',
      'kpiAutomatedDecision',
      'kpiAiBiasFairness',
      'kpiConsentMechanism',
      'kpiRegulatoryCompliance',
      'kpiBreachNotification',
      'kpiIndependentAudit',
      'kpiContentModeration'
    ] as const;

    const matrixData = companies.map((company) => {
      const aggregatedKpis: Record<string, string> = {};
      
      // Initialize with 'Not assessed'
      kpiKeys.forEach((key: string) => {
        aggregatedKpis[key] = 'Not assessed';
      });

      // Aggregate from latest changes of all policies
      company.policies.forEach((policy) => {
        const latestChange = policy.changes[0];
        if (latestChange) {
          kpiKeys.forEach((key: string) => {
            const val = (latestChange as unknown as Record<string, string | null>)[key];
            if (val) {
              aggregatedKpis[key] = getMostConcerningValue(aggregatedKpis[key], val);
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
    });

    return NextResponse.json({ companies: matrixData });
  } catch (error) {
    console.error('Error generating matrix data:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching matrix data.' },
      { status: 500 }
    );
  }
}
