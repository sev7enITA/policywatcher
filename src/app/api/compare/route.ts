/**
 * PolicyWatcher - A/B Company Compare API
 *
 * GET /api/compare?companyA=xxx&companyB=yyy
 *
 * Returns the latest snapshot of KPI/risk data for both companies so the
 * client can render a side-by-side comparison + radar chart.
 */
import { parseDocumentTypes, documentTypeWhere, documentCoverage, typeBalancedScore, type DocumentType } from '@/lib/documentScope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { publicPolicyWhere } from '@/lib/publicDataGate';
import {
  KPI_FIELD_KEYS,
  KPI_METRICS,
  NOT_ASSESSED_KPI_VALUE,
  getKpiConcernRank,
  getMoreConcerningKpiValue,
  isAssessedKpiValue,
  type KpiField,
} from '@/lib/metricsCatalog';

/**
 * Converts a textual KPI value to a numeric 0-100 risk score.
 *
 * @param value - The human-readable KPI value (e.g. "Extensive", "Minimal").
 * @returns An integer 0-100 where 0 = safe and 100 = most concerning.
 */
function kpiToScore(field: KpiField, value: string): number {
  return Math.round((getKpiConcernRank(field, value) / 3) * 100);
}

function buildRisk(overallScore: number): string {
  return overallScore >= 7 ? 'High' : overallScore >= 4 ? 'Medium' : 'Low';
}

function aggregateCompanyKpis(
  policies: Array<{ changes: Array<Record<string, unknown>> }>
): Record<KpiField, string> {
  const aggregated = Object.fromEntries(
    KPI_FIELD_KEYS.map((field) => [field, NOT_ASSESSED_KPI_VALUE])
  ) as Record<KpiField, string>;

  policies.forEach((policy) => {
    const latestChange = policy.changes[0];
    if (!latestChange) return;
    KPI_FIELD_KEYS.forEach((field) => {
      const val = latestChange[field];
      if (typeof val === 'string' && val) {
        aggregated[field] = getMoreConcerningKpiValue(field, aggregated[field], val);
      }
    });
  });

  return aggregated;
}

/**
 * Builds a normalised company profile for the comparison view.
 *
 * Aggregates KPIs from the latest change of each policy (most concerning
 * value wins), computes an average overall score, derives a risk label,
 * and constructs radar-chart data with bilingual labels.
 *
 * @param companyId - The UUID of the company.
 * @returns The profile object, or `null` if the company does not exist.
 */
async function getCompanyProfile(companyId: string, documentTypes: DocumentType[]) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      policies: {
        where: publicPolicyWhere(documentTypeWhere(documentTypes)),
        include: {
          changes: {
            where: { publicEvidence: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!company) return null;

  const aggregated = aggregateCompanyKpis(company.policies as unknown as Array<{ changes: Array<Record<string, unknown>> }>);

  const coverage = documentCoverage(company.policies, documentTypes);
  const score = typeBalancedScore(company.policies);
  const overallScore = score === null ? null : Math.round(score * 10) / 10;
  const overallRisk = overallScore === null ? 'Not assessed' : buildRisk(overallScore);

  const radar = KPI_FIELD_KEYS.map((field) => ({
    key: field,
    labelEn: KPI_METRICS[field].label.en,
    labelIt: KPI_METRICS[field].label.it,
    value: kpiToScore(field, aggregated[field]),
    rawValue: aggregated[field],
  }));

  return {
    id: company.id,
    name: company.name,
    industry: company.industry,
    website: company.website,
    logo: company.logo,
    overallScore,
    overallRisk,
    radar,
    policiesCount: company.policies.length,
    coverage,
    byType: documentTypes.map(type => {
      const policies = company.policies.filter(p => p.type === type);
      return { type, policiesCount: policies.length, score: typeBalancedScore(policies), kpis: aggregateCompanyKpis(policies as unknown as Array<{ changes: Array<Record<string, unknown>> }>) };
    }),
  };
}

async function getIndustryBenchmarkProfile(industry: string, documentTypes: DocumentType[], excludeCompanyId?: string) {
  const companies = await db.company.findMany({
    where: { industry },
    include: {
      policies: {
        where: publicPolicyWhere(documentTypeWhere(documentTypes)),
        include: {
          changes: {
            where: { publicEvidence: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  const comparableCompanies = companies.filter((company) => company.id !== excludeCompanyId);
  const cohort = comparableCompanies.filter(company => documentCoverage(company.policies, documentTypes).complete);
  const kpiScores = Object.fromEntries(
    KPI_FIELD_KEYS.map((field) => [field, [] as number[]])
  ) as Record<KpiField, number[]>;
  let overallTotal = 0;
  let overallCount = 0;
  let policiesCount = 0;

  cohort.forEach((company) => {
    policiesCount += company.policies.length;
    const aggregated = aggregateCompanyKpis(company.policies as unknown as Array<{ changes: Array<Record<string, unknown>> }>);
    KPI_FIELD_KEYS.forEach((field) => {
      const value = aggregated[field];
      if (isAssessedKpiValue(value)) kpiScores[field].push(kpiToScore(field, value));
    });
    const score = typeBalancedScore(company.policies);
    if (score !== null) { overallTotal += score; overallCount++; }
  });

  const overallScore = overallCount > 0
    ? Math.round((overallTotal / overallCount) * 10) / 10
    : null;
  const radar = KPI_FIELD_KEYS.map((field) => {
    const scores = kpiScores[field];
    const avg = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    return {
      key: field,
      labelEn: KPI_METRICS[field].label.en,
      labelIt: KPI_METRICS[field].label.it,
      value: avg,
      rawValue: scores.length ? `Avg ${avg}/100` : NOT_ASSESSED_KPI_VALUE,
    };
  });

  return {
    id: `industry:${industry}`,
    name: `${industry} Average`,
    industry,
    website: '',
    logo: '',
    overallScore,
    overallRisk: overallScore === null ? 'Not assessed' : buildRisk(overallScore),
    radar,
    policiesCount,
    benchmarkCompanies: cohort.length,
    excludedIncompleteCompanies: comparableCompanies.length - cohort.length,
  };
}

/**
 * Handles a GET request with `companyA` and `companyB` query params.
 *
 * Fetches both company profiles in parallel, returns them side-by-side.
 *
 * @param request - The incoming request with `?companyA=&companyB=` params.
 * @returns JSON `{ companyA, companyB }` or 400/404/500 error.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-compare' });
  if (limited) return limited;

  try {
    const documentTypes = parseDocumentTypes(request.nextUrl.searchParams.get('documents'));
    if (!documentTypes) return NextResponse.json({ error: 'Invalid document types.' }, { status: 400 });
    const { searchParams } = new URL(request.url);
    const companyA = searchParams.get('companyA');
    const companyB = searchParams.get('companyB');

    if (!companyA || !companyB) {
      return NextResponse.json(
        { error: 'Both companyA and companyB query params are required.' },
        { status: 400 }
      );
    }

    const profileA = await getCompanyProfile(companyA, documentTypes);
    const profileB = companyB === 'industry-average' && profileA
      ? await getIndustryBenchmarkProfile(profileA.industry, documentTypes, profileA.id)
      : await getCompanyProfile(companyB, documentTypes);

    if (!profileA || !profileB) {
      return NextResponse.json(
        { error: 'One or both companies not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ companyA: profileA, companyB: profileB, documentTypes });
  } catch (error) {
    console.error('Error in compare API:', error);
    return NextResponse.json(
      { error: 'Internal server error during comparison.' },
      { status: 500 }
    );
  }
}
