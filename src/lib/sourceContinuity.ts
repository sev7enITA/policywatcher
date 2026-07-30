export const SOURCE_CONTINUITY_MAX_POLICIES = 100;
export const SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY = 25;

export const SOURCE_CONTINUITY_STATES = [
  'verified',
  'recovered',
  'partial',
  'unavailable',
  'needs_review',
  'baseline_pending',
] as const;

export const SOURCE_CONTINUITY_CAUSES = [
  'verified_retrieval',
  'incomplete_retrieval',
  'retrieval_unavailable',
  'quality_review_required',
  'baseline_verification_pending',
] as const;

export const SOURCE_CONTINUITY_CHANNELS = [
  'direct',
  'http2',
  'renderer',
  'archive',
  'cache',
  'commoncrawl',
  'seeded',
  'none',
  'other',
] as const;

export type SourceContinuityState = (typeof SOURCE_CONTINUITY_STATES)[number];
export type SourceContinuityCause = (typeof SOURCE_CONTINUITY_CAUSES)[number];
export type SourceContinuityChannel = (typeof SOURCE_CONTINUITY_CHANNELS)[number];
export type SourceContinuityRequestStatus = 'idle' | 'loading' | 'success' | 'error';
export type SourceContinuityRequestTrigger = 'activation' | 'retry';

export function canStartSourceContinuityRequest(
  status: SourceContinuityRequestStatus,
  trigger: SourceContinuityRequestTrigger
): boolean {
  return trigger === 'activation' ? status === 'idle' : status === 'error';
}

export interface SourceContinuityLogInput {
  id: string;
  status: string;
  checkedAt: Date | string;
  source: string | null;
}

export interface SourceContinuityPolicyInput {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  url: string;
  company: {
    id: string;
    name: string;
    slug: string;
    industry: string;
  };
  snapshots: Array<{ publicEvidence: boolean; createdAt?: Date | string }>;
  historicalReferences?: Array<{
    source: string;
    capturedAt: Date | string;
    observedAt: Date | string;
    eligibleForChangeDetection: boolean;
  }>;
  checkLogs: SourceContinuityLogInput[];
  _count?: { checkLogs: number };
}

export interface SourceContinuityEvent {
  id: string;
  checkedAt: string;
  state: SourceContinuityState;
  cause: SourceContinuityCause;
  retrievalChannel: SourceContinuityChannel;
  isLatestTransition: boolean;
  hasPublicSnapshotEvidence: boolean;
  currentness: 'verified' | 'not_verified';
  lastVerifiedEvidenceAt: string | null;
  historicalReference: {
    retrievalChannel: SourceContinuityChannel;
    capturedAt: string;
    observedAt: string;
    eligibleForChangeDetection: false;
  } | null;
  company: SourceContinuityPolicyInput['company'];
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    sourceHost: string | null;
  };
}

export interface SourceContinuityResponse {
  generatedAt: string;
  sourceCount: number;
  eventCount: number;
  recoveredCount: number;
  currentWithheldCount: number;
  truncated: boolean;
  maxPolicies: number;
  maxLogsPerPolicy: number;
  dataExposed: false;
  limitationEn: string;
  events: SourceContinuityEvent[];
}

const WITHHELD_STATES = new Set<SourceContinuityState>([
  'partial',
  'unavailable',
  'needs_review',
  'baseline_pending',
]);

export const SOURCE_CONTINUITY_LIMITATION_EN =
  'This ledger describes PolicyWatcher retrieval and publication state, not provider policy quality, legality or compliance. Verified and recovered refer only to source retrieval; private policy text remains withheld unless separately published as public evidence.';

function safeSourceHost(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function normalizeSourceContinuityChannel(value: unknown): SourceContinuityChannel {
  if (typeof value !== 'string' || !value.trim()) return 'none';

  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'direct' || normalized === 'directscrape') return 'direct';
  if (normalized === 'http2' || normalized === 'http2direct') return 'http2';
  if (normalized.includes('render')) return 'renderer';
  if (normalized.includes('wayback') || normalized.includes('archive')) return 'archive';
  if (normalized === 'cache' || normalized.endsWith('cache')) return 'cache';
  if (normalized.includes('commoncrawl')) return 'commoncrawl';
  if (normalized === 'seeded' || normalized === 'seed') return 'seeded';
  if (normalized === 'none' || normalized === 'unavailable') return 'none';
  return 'other';
}

function normalizeStatus(status: unknown): {
  state: Exclude<SourceContinuityState, 'recovered'>;
  cause: SourceContinuityCause;
} {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (normalized === 'available' || normalized === 'reviewed') {
    return { state: 'verified', cause: 'verified_retrieval' };
  }
  if (normalized === 'partial') {
    return { state: 'partial', cause: 'incomplete_retrieval' };
  }
  if (normalized === 'unavailable') {
    return { state: 'unavailable', cause: 'retrieval_unavailable' };
  }
  if (normalized === 'configured') {
    return { state: 'baseline_pending', cause: 'baseline_verification_pending' };
  }
  return { state: 'needs_review', cause: 'quality_review_required' };
}

function validCheckedAt(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function eventsForPolicy(policy: SourceContinuityPolicyInput): SourceContinuityEvent[] {
  const hasPublicSnapshotEvidence = policy.snapshots.some((snapshot) => snapshot.publicEvidence);
  const lastVerifiedEvidenceAt = policy.snapshots
    .map((snapshot) => validCheckedAt(snapshot.createdAt || ''))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() || null;
  const latestHistoricalReference = (policy.historicalReferences || [])
    .map((reference) => ({
      reference,
      capturedAt: validCheckedAt(reference.capturedAt),
      observedAt: validCheckedAt(reference.observedAt),
    }))
    .filter((entry): entry is typeof entry & { capturedAt: Date; observedAt: Date } =>
      Boolean(entry.capturedAt && entry.observedAt)
    )
    .sort((left, right) => right.capturedAt.getTime() - left.capturedAt.getTime())[0];
  const recentLogs = policy.checkLogs
    .map((log) => ({ log, date: validCheckedAt(log.checkedAt) }))
    .filter((entry): entry is { log: SourceContinuityLogInput; date: Date } => Boolean(entry.date))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const transitions: SourceContinuityEvent[] = [];
  let previousBaseState: Exclude<SourceContinuityState, 'recovered'> | null = null;

  for (const { log, date } of recentLogs) {
    const normalized = normalizeStatus(log.status);
    if (normalized.state === previousBaseState) continue;

    const state: SourceContinuityState =
      normalized.state === 'verified' &&
      previousBaseState !== null &&
      WITHHELD_STATES.has(previousBaseState) &&
      hasPublicSnapshotEvidence
        ? 'recovered'
        : normalized.state;

    previousBaseState = normalized.state;

    transitions.push({
      id: log.id,
      checkedAt: date.toISOString(),
      state,
      cause: normalized.cause,
      retrievalChannel: normalizeSourceContinuityChannel(log.source),
      isLatestTransition: false,
      hasPublicSnapshotEvidence,
      currentness: normalized.state === 'verified' ? 'verified' : 'not_verified',
      lastVerifiedEvidenceAt,
      historicalReference: latestHistoricalReference
        ? {
            retrievalChannel: normalizeSourceContinuityChannel(latestHistoricalReference.reference.source),
            capturedAt: latestHistoricalReference.capturedAt.toISOString(),
            observedAt: latestHistoricalReference.observedAt.toISOString(),
            eligibleForChangeDetection: false,
          }
        : null,
      company: { ...policy.company },
      policy: {
        id: policy.id,
        name: policy.name,
        type: policy.type,
        jurisdiction: policy.jurisdiction,
        sourceHost: safeSourceHost(policy.url),
      },
    });
  }

  if (transitions.length > 0) {
    transitions[transitions.length - 1] = {
      ...transitions[transitions.length - 1],
      isLatestTransition: true,
    };
  }

  return transitions;
}

export function buildSourceContinuityResponse(
  policies: SourceContinuityPolicyInput[],
  totalQualifiedPolicies: number,
  generatedAt = new Date()
): SourceContinuityResponse {
  const boundedPolicies = policies.slice(0, SOURCE_CONTINUITY_MAX_POLICIES);
  const groupedEvents = boundedPolicies.map(eventsForPolicy).filter((events) => events.length > 0);
  const events = groupedEvents
    .flat()
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  const latestEvents = events.filter((event) => event.isLatestTransition);

  return {
    generatedAt: generatedAt.toISOString(),
    sourceCount: groupedEvents.length,
    eventCount: events.length,
    recoveredCount: events.filter((event) => event.state === 'recovered').length,
    currentWithheldCount: latestEvents.filter((event) => WITHHELD_STATES.has(event.state)).length,
    truncated:
      totalQualifiedPolicies > SOURCE_CONTINUITY_MAX_POLICIES ||
      boundedPolicies.some(
        (policy) =>
          (policy._count?.checkLogs ?? policy.checkLogs.length) >
          SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY
      ),
    maxPolicies: SOURCE_CONTINUITY_MAX_POLICIES,
    maxLogsPerPolicy: SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY,
    dataExposed: false,
    limitationEn: SOURCE_CONTINUITY_LIMITATION_EN,
    events,
  };
}
