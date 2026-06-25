/**
 * PolicyWatcher - A/B Company Compare API
 *
 * GET /api/compare?companyA=xxx&companyB=yyy
 *
 * Returns the latest snapshot of KPI/risk data for both companies so the
 * client can render a side-by-side comparison + radar chart.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

// KPI keys compared side by side (15 total across 3 families)
const KPI_KEYS = [
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
  'kpiContentModeration',
];

// Same weighting logic used by /api/matrix to derive a numeric score per KPI
const kpiWeights: Record<string, number> = {
  Extensive: 3, Broad: 3, Indefinite: 3, None: 3, Unrestricted: 3,
  Moderate: 2, Limited: 2, Extended: 2, Partial: 2, Controlled: 2,
  Minimal: 1, Defined: 1, Restricted: 1, Full: 1,
  'Not Available': 3, 'Company Claimed': 3, Opaque: 3, Undisclosed: 3, Absent: 3,
  Shared: 2, Mentioned: 2,
  Available: 1, 'User Retained': 1, Published: 1, Disclosed: 1, Committed: 1,
  Implicit: 3, Unspecified: 3,
  'Opt-Out': 2,
  'Explicit Opt-In': 1, Comprehensive: 1, 'Within 24h': 1, 'Within 72h': 1, Certified: 1, Transparent: 1,
  'Not assessed': 0,
};

/**
 * Converts a textual KPI value to a numeric 0–100 risk score.
 *
 * @param value - The human-readable KPI value (e.g. "Extensive", "Minimal").
 * @returns An integer 0–100 where 0 = safe and 100 = most concerning.
 */
function kpiToScore(value: string): number {
  // 0-100 scale; 0 = safe, 100 = concerning
  const weight = kpiWeights[value] ?? 0;
  return Math.round((weight / 3) * 100);
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
async function getCompanyProfile(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      policies: {
        include: {
          changes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!company) return null;

  // Aggregate KPIs from the latest change of each policy (most concerning wins)
  const aggregated: Record<string, string> = {};
  KPI_KEYS.forEach((k: string) => (aggregated[k] = 'Not assessed'));

  company.policies.forEach((policy: any) => {
    const latestChange = policy.changes[0];
    if (!latestChange) return;
    KPI_KEYS.forEach((k: string) => {
      const val = (latestChange as unknown as Record<string, string>)[k];
      if (val) {
        const currentWeight = kpiWeights[aggregated[k]] ?? 0;
        const newWeight = kpiWeights[val] ?? 0;
        if (newWeight >= currentWeight) aggregated[k] = val;
      }
    });
  });

  // Latest overall risk + score (from any policy's latest change)
  let overallScore = 0;
  let overallRisk = 'Not assessed';
  let scoreCount = 0;
  company.policies.forEach((p: any) => {
    const c = p.changes[0];
    if (c) {
      overallScore += c.overallScore;
      scoreCount++;
    }
  });
  if (scoreCount > 0) {
    overallScore = Math.round((overallScore / scoreCount) * 10) / 10;
    overallRisk = overallScore >= 7 ? 'High' : overallScore >= 4 ? 'Medium' : 'Low';
  }

  // Build the radar data (label + score for both langs)
  const labels: Record<string, { en: string; it: string }> = {
    kpiDataCollection: { en: 'Data Collection', it: 'Raccolta Dati' },
    kpiThirdPartySharing: { en: 'Third-Party Sharing', it: 'Condivisione Terzi' },
    kpiDataRetention: { en: 'Data Retention', it: 'Conservazione' },
    kpiRightToDeletion: { en: 'Right to Deletion', it: 'Diritto Cancellazione' },
    kpiCrossBorderTransfer: { en: 'Cross-Border Transfer', it: 'Trasferimento Transfront.' },
    kpiAiTrainingOptOut: { en: 'AI Training Opt-Out', it: 'Opt-Out Training AI' },
    kpiAiOutputOwnership: { en: 'AI Output Ownership', it: 'Proprietà Output AI' },
    kpiAlgoTransparency: { en: 'Algorithmic Transparency', it: 'Trasparenza Algoritmica' },
    kpiAutomatedDecision: { en: 'Automated Decisions', it: 'Decisioni Automatiche' },
    kpiAiBiasFairness: { en: 'AI Bias & Fairness', it: 'Bias e Equità AI' },
    kpiConsentMechanism: { en: 'Consent Mechanism', it: 'Meccanismo Consenso' },
    kpiRegulatoryCompliance: { en: 'Regulatory Compliance', it: 'Conformità Normativa' },
    kpiBreachNotification: { en: 'Breach Notification', it: 'Notifica Violazione' },
    kpiIndependentAudit: { en: 'Independent Audit', it: 'Audit Indipendente' },
    kpiContentModeration: { en: 'Content Moderation', it: 'Moderazione Contenuti' },
  };

  const radar = KPI_KEYS.map((k: string) => ({
    key: k,
    labelEn: labels[k].en,
    labelIt: labels[k].it,
    value: kpiToScore(aggregated[k]),
    rawValue: aggregated[k],
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
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const companyA = searchParams.get('companyA');
    const companyB = searchParams.get('companyB');

    if (!companyA || !companyB) {
      return NextResponse.json(
        { error: 'Both companyA and companyB query params are required.' },
        { status: 400 }
      );
    }

    const [profileA, profileB] = await Promise.all([
      getCompanyProfile(companyA),
      getCompanyProfile(companyB),
    ]);

    if (!profileA || !profileB) {
      return NextResponse.json(
        { error: 'One or both companies not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ companyA: profileA, companyB: profileB });
  } catch (error) {
    console.error('Error in compare API:', error);
    return NextResponse.json(
      { error: 'Internal server error during comparison.' },
      { status: 500 }
    );
  }
}
