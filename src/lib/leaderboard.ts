/**
 * Evidence-only leaderboard helpers.
 *
 * The board ranks observable source coverage and public evidence readiness.
 * It intentionally does not rank legal compliance, corporate conduct, safety,
 * or provider trustworthiness.
 */

export type EvidenceTier = 'Evidence-ready' | 'Watchlist' | 'Suspended' | 'Inventory only';

export interface LeaderboardSnapshotInput {
  publicEvidence?: boolean | null;
}

export interface LeaderboardChangeInput {
  id: string;
  overallScore?: number | null;
  overallRisk?: string | null;
  createdAt?: Date | string | null;
}

export interface LeaderboardCheckLogInput {
  source?: string | null;
  status?: string | null;
  textHash?: string | null;
  checkedAt?: Date | string | null;
  archiveTimestamp?: Date | string | null;
}

export interface LeaderboardPolicyInput {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  dataStatus?: string | null;
  ingestionMethod?: string | null;
  lastCheckDate?: Date | string | null;
  lastSuccessfulCheckDate?: Date | string | null;
  snapshots?: LeaderboardSnapshotInput[];
  changes?: LeaderboardChangeInput[];
  checkLogs?: LeaderboardCheckLogInput[];
}

export interface LeaderboardCompanyInput {
  id: string;
  name: string;
  slug: string;
  industry: string;
  website: string;
  policies?: LeaderboardPolicyInput[];
}

export interface RetrievalMix {
  direct: number;
  http2: number;
  rendered: number;
  archive: number;
  seeded: number;
  none: number;
}

export interface LeaderboardRow {
  rank: number;
  companyId: string;
  name: string;
  slug: string;
  industry: string;
  website: string;
  evidenceIndex: number;
  tier: EvidenceTier;
  policyCount: number;
  verifiedPolicyCount: number;
  suspendedPolicyCount: number;
  sourceEvidenceCount: number;
  publicBaselineCount: number;
  publicChangeCount: number;
  averageChangeSignal: number | null;
  latestCheckAt: string | null;
  latestSuccessfulFetchAt: string | null;
  latestChangeAt: string | null;
  retrievalMix: RetrievalMix;
  notes: string[];
}

export interface LeaderboardSnapshot {
  generatedAt: string;
  methodology: {
    title: string;
    description: string;
    indexFormula: string[];
    boundaries: string[];
  };
  summary: {
    companyCount: number;
    policyCount: number;
    verifiedPolicyCount: number;
    suspendedPolicyCount: number;
    publicChangeCount: number;
    rendererBackedPolicyCount: number;
    archiveBackedPolicyCount: number;
  };
  boards: {
    evidence: LeaderboardRow[];
    movement: LeaderboardRow[];
    attention: LeaderboardRow[];
  };
  rows: LeaderboardRow[];
}

const PUBLIC_STATUSES = new Set(['available', 'reviewed']);
const SUSPENDED_STATUSES = new Set(['configured', 'partial', 'needs review', 'unavailable']);
const VERIFIED_SOURCES = new Set(['direct', 'http2', 'rendered', 'wayback', 'commoncrawl']);

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function latestIso(values: Array<Date | string | null | undefined>): string | null {
  const timestamps = values
    .map((value) => {
      const iso = toIsoDate(value);
      return iso ? new Date(iso).getTime() : null;
    })
    .filter((value): value is number => typeof value === 'number');

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function isSeeded(value: unknown): boolean {
  return normalize(value) === 'seeded';
}

function hasPublicBaseline(policy: LeaderboardPolicyInput): boolean {
  return (policy.snapshots || []).some((snapshot) => snapshot.publicEvidence === true);
}

function latestVerifiedLog(policy: LeaderboardPolicyInput): LeaderboardCheckLogInput | null {
  return [...(policy.checkLogs || [])]
    .filter((log) => Boolean(log.textHash) && VERIFIED_SOURCES.has(normalize(log.source)))
    .sort((a, b) => {
      const aTime = toIsoDate(a.checkedAt);
      const bTime = toIsoDate(b.checkedAt);
      return (bTime ? Date.parse(bTime) : 0) - (aTime ? Date.parse(aTime) : 0);
    })[0] || null;
}

function isPublicVerifiedPolicy(policy: LeaderboardPolicyInput): boolean {
  return (
    PUBLIC_STATUSES.has(normalize(policy.dataStatus)) &&
    !isSeeded(policy.ingestionMethod) &&
    hasPublicBaseline(policy)
  );
}

function isSuspendedPolicy(policy: LeaderboardPolicyInput): boolean {
  return (
    isSeeded(policy.ingestionMethod) ||
    SUSPENDED_STATUSES.has(normalize(policy.dataStatus)) ||
    !hasPublicBaseline(policy)
  );
}

function emptyRetrievalMix(): RetrievalMix {
  return {
    direct: 0,
    http2: 0,
    rendered: 0,
    archive: 0,
    seeded: 0,
    none: 0,
  };
}

function addRetrievalSource(mix: RetrievalMix, source: string) {
  const normalized = normalize(source);
  if (normalized === 'direct') mix.direct += 1;
  else if (normalized === 'http2') mix.http2 += 1;
  else if (normalized === 'rendered') mix.rendered += 1;
  else if (normalized === 'wayback' || normalized === 'commoncrawl') mix.archive += 1;
  else if (normalized === 'seeded') mix.seeded += 1;
  else mix.none += 1;
}

function freshnessPoints(latestSuccessfulFetchAt: string | null, now: Date): number {
  if (!latestSuccessfulFetchAt) return 0;
  const ageDays = Math.max(
    0,
    (now.getTime() - new Date(latestSuccessfulFetchAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (ageDays <= 14) return 14;
  if (ageDays <= 45) return 10;
  if (ageDays <= 90) return 6;
  return 2;
}

function clampEvidenceIndex(value: number): number {
  return Math.max(0, Math.min(99, Math.round(value)));
}

function tierFor(row: Omit<LeaderboardRow, 'rank' | 'tier' | 'notes'>): EvidenceTier {
  if (row.policyCount === 0) return 'Inventory only';
  if (row.verifiedPolicyCount === 0 && row.suspendedPolicyCount > 0) return 'Suspended';
  if (row.suspendedPolicyCount > 0 || row.evidenceIndex < 65) return 'Watchlist';
  return 'Evidence-ready';
}

function notesFor(row: Omit<LeaderboardRow, 'rank' | 'tier' | 'notes'>, tier: EvidenceTier): string[] {
  const notes: string[] = [];
  if (tier === 'Evidence-ready') {
    notes.push('Public-facing policy records pass the configured source-evidence gates.');
  }
  if (row.suspendedPolicyCount > 0) {
    notes.push(`${row.suspendedPolicyCount} policy source(s) require review before public evidence use.`);
  }
  if (row.retrievalMix.rendered > 0) {
    notes.push('VPS renderer was used for at least one verified source.');
  }
  if (row.retrievalMix.archive > 0) {
    notes.push('Archive fallback evidence is present and should be read with timestamp context.');
  }
  if (row.publicChangeCount === 0) {
    notes.push('No publicEvidence-gated policy movement is currently exposed.');
  }
  return notes;
}

function buildRow(company: LeaderboardCompanyInput, now: Date): Omit<LeaderboardRow, 'rank'> {
  const policies = company.policies || [];
  const policyCount = policies.length;
  const verifiedPolicies = policies.filter(isPublicVerifiedPolicy);
  const suspendedPolicies = policies.filter(isSuspendedPolicy);
  const publicBaselineCount = policies.filter(hasPublicBaseline).length;
  const sourceEvidencePolicies = policies.filter((policy) => Boolean(latestVerifiedLog(policy)));
  const publicChanges = policies.flatMap((policy) => policy.changes || []);
  const changeScores = publicChanges
    .map((change) => change.overallScore)
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
  const latestSuccessfulFetchAt = latestIso(
    policies.flatMap((policy) => [
      policy.lastSuccessfulCheckDate,
      ...(policy.checkLogs || [])
        .filter((log) => Boolean(log.textHash) && VERIFIED_SOURCES.has(normalize(log.source)))
        .map((log) => log.checkedAt),
    ])
  );
  const latestCheckAt = latestIso(
    policies.flatMap((policy) => [
      policy.lastCheckDate,
      ...(policy.checkLogs || []).map((log) => log.checkedAt),
    ])
  );
  const latestChangeAt = latestIso(publicChanges.map((change) => change.createdAt));

  const retrievalMix = emptyRetrievalMix();
  policies.forEach((policy) => {
    const latestLog = latestVerifiedLog(policy);
    if (latestLog?.source) addRetrievalSource(retrievalMix, latestLog.source);
    else if (isSeeded(policy.ingestionMethod)) addRetrievalSource(retrievalMix, 'seeded');
    else addRetrievalSource(retrievalMix, 'none');
  });

  const coverage = policyCount ? verifiedPolicies.length / policyCount : 0;
  const sourceTrace = policyCount ? sourceEvidencePolicies.length / policyCount : 0;
  const publicBaseline = policyCount ? publicBaselineCount / policyCount : 0;
  const suspendedRatio = policyCount ? suspendedPolicies.length / policyCount : 0;
  const evidenceIndex = clampEvidenceIndex(
    coverage * 38 +
      sourceTrace * 26 +
      publicBaseline * 22 +
      freshnessPoints(latestSuccessfulFetchAt, now) -
      suspendedRatio * 12
  );

  const baseRow = {
    companyId: company.id,
    name: company.name,
    slug: company.slug,
    industry: company.industry,
    website: company.website,
    evidenceIndex,
    policyCount,
    verifiedPolicyCount: verifiedPolicies.length,
    suspendedPolicyCount: suspendedPolicies.length,
    sourceEvidenceCount: sourceEvidencePolicies.length,
    publicBaselineCount,
    publicChangeCount: publicChanges.length,
    averageChangeSignal:
      changeScores.length > 0
        ? Math.round((changeScores.reduce((sum, score) => sum + score, 0) / changeScores.length) * 10) / 10
        : null,
    latestCheckAt,
    latestSuccessfulFetchAt,
    latestChangeAt,
    retrievalMix,
  };
  const tier = tierFor(baseRow);

  return {
    ...baseRow,
    tier,
    notes: notesFor(baseRow, tier),
  };
}

function applyRanks(rows: Array<Omit<LeaderboardRow, 'rank'>>): LeaderboardRow[] {
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function sortByEvidence(rows: Array<Omit<LeaderboardRow, 'rank'>>): Array<Omit<LeaderboardRow, 'rank'>> {
  return [...rows].sort((a, b) => {
    if (b.evidenceIndex !== a.evidenceIndex) return b.evidenceIndex - a.evidenceIndex;
    if (b.verifiedPolicyCount !== a.verifiedPolicyCount) return b.verifiedPolicyCount - a.verifiedPolicyCount;
    if (b.publicChangeCount !== a.publicChangeCount) return b.publicChangeCount - a.publicChangeCount;
    return a.name.localeCompare(b.name);
  });
}

function sortByMovement(rows: Array<Omit<LeaderboardRow, 'rank'>>): Array<Omit<LeaderboardRow, 'rank'>> {
  return [...rows].sort((a, b) => {
    if (b.publicChangeCount !== a.publicChangeCount) return b.publicChangeCount - a.publicChangeCount;
    if ((b.averageChangeSignal || 0) !== (a.averageChangeSignal || 0)) {
      return (b.averageChangeSignal || 0) - (a.averageChangeSignal || 0);
    }
    return a.name.localeCompare(b.name);
  });
}

function sortByAttention(rows: Array<Omit<LeaderboardRow, 'rank'>>): Array<Omit<LeaderboardRow, 'rank'>> {
  return [...rows]
    .filter((row) => row.suspendedPolicyCount > 0 || row.tier === 'Suspended')
    .sort((a, b) => {
      if (b.suspendedPolicyCount !== a.suspendedPolicyCount) {
        return b.suspendedPolicyCount - a.suspendedPolicyCount;
      }
      return a.name.localeCompare(b.name);
    });
}

export function buildLeaderboard(
  companies: LeaderboardCompanyInput[],
  now: Date = new Date()
): LeaderboardSnapshot {
  const rankedRows = sortByEvidence(companies.map((company) => buildRow(company, now)));
  const rows = applyRanks(rankedRows);
  const policyRows = rows.flatMap((row) => row);

  const summary = {
    companyCount: companies.length,
    policyCount: policyRows.reduce((sum, row) => sum + row.policyCount, 0),
    verifiedPolicyCount: policyRows.reduce((sum, row) => sum + row.verifiedPolicyCount, 0),
    suspendedPolicyCount: policyRows.reduce((sum, row) => sum + row.suspendedPolicyCount, 0),
    publicChangeCount: policyRows.reduce((sum, row) => sum + row.publicChangeCount, 0),
    rendererBackedPolicyCount: policyRows.reduce((sum, row) => sum + row.retrievalMix.rendered, 0),
    archiveBackedPolicyCount: policyRows.reduce((sum, row) => sum + row.retrievalMix.archive, 0),
  };

  return {
    generatedAt: now.toISOString(),
    methodology: {
      title: 'Evidence Signals Board',
      description:
        'Ranks observable policy-source evidence, public baselines, retrieval traceability, freshness, and publicEvidence-gated movement.',
      indexFormula: [
        'Verified policy coverage: policies with non-seeded ingestion, Available or Reviewed status, and a public baseline.',
        'Source trace coverage: policies with a verified retrieval log and text hash from direct, HTTP/2, VPS-rendered, Wayback, or Common Crawl retrieval.',
        'Freshness: latest successful source evidence contributes a small recency component.',
        'Suspension penalty: configured, partial, unavailable, seed-only, or no-public-baseline policies reduce the operational evidence index.',
        'The evidence index is capped at 99 by design and is not a compliance score.',
      ],
      boundaries: [
        'This board does not certify companies, legal compliance, internal conduct, safety, or trustworthiness.',
        'Suspended sources do not feed public policy text, AI summaries, timeline events, reports, or benchmark statements.',
        'Archive-backed entries require timestamp context and are shown as retrieval evidence, not as live-source confirmation.',
      ],
    },
    summary,
    boards: {
      evidence: rows,
      movement: applyRanks(sortByMovement(rows).filter((row) => row.publicChangeCount > 0)),
      attention: applyRanks(sortByAttention(rows)),
    },
    rows,
  };
}
