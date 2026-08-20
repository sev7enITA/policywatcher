export const PUBLICATION_READINESS_STAGE_IDS = [
  'configured',
  'retrieved',
  'baseline-verified',
  'public',
  'analysed',
] as const;

export type PublicationReadinessStageId = (typeof PUBLICATION_READINESS_STAGE_IDS)[number];
export type PublicationReadinessAvailability = 'measured' | 'unavailable' | 'review';

export interface PublicationReadinessMetric {
  available: boolean;
  count: number | null;
  reason?: string | null;
}

export interface PublicationReadinessInput {
  checkedAt: string;
  configured: PublicationReadinessMetric;
  retrieved: PublicationReadinessMetric;
  baselineVerified: PublicationReadinessMetric;
  public: PublicationReadinessMetric;
  analysed: PublicationReadinessMetric;
  latestCapture?: PublicationReadinessCaptureMetric;
  scopeBoundary?: string;
}

export interface PublicationReadinessCaptureMetric {
  available: boolean;
  capturedAt: string | null;
  reason?: string | null;
}

export interface PublicationReadinessLatestCapture {
  capturedAt: string | null;
  availability: 'measured' | 'unavailable';
  definition: string;
  reason: string | null;
}

export interface PublicationReadinessStage {
  id: PublicationReadinessStageId;
  label: string;
  count: number | null;
  denominator: number | null;
  excluded: number | null;
  availability: PublicationReadinessAvailability;
  definition: string;
  actionHref: string;
  actionLabel: string;
  reason: string | null;
  boundary: string | null;
}

export interface PublicationReadinessResult {
  checkedAt: string;
  available: boolean;
  denominator: number | null;
  stages: PublicationReadinessStage[];
  latestCapture: PublicationReadinessLatestCapture;
  consistencyWarning: string | null;
  scopeBoundary: string;
}

const SCOPE_BOUNDARY = 'Counts policy records in the configured monitoring inventory. Excluded means a record has not reached that measured stage; it does not by itself identify an error or establish source completeness.';
const LATEST_CAPTURE_DEFINITION = 'Most recent successful non-seeded retrieval with persisted text or hash evidence.';

const STAGE_METADATA: Record<PublicationReadinessStageId, Pick<PublicationReadinessStage, 'label' | 'definition' | 'actionHref' | 'actionLabel'>> = {
  configured: {
    label: 'Configured',
    definition: 'Every policy record in the configured monitoring inventory.',
    actionHref: '/admin/companies',
    actionLabel: 'Open companies',
  },
  retrieved: {
    label: 'Retrieved',
    definition: 'Policies with a successful non-seeded check and persisted text or hash evidence.',
    actionHref: '/admin/cron',
    actionLabel: 'Open scan console',
  },
  'baseline-verified': {
    label: 'Baseline verified',
    definition: 'Policies with at least one snapshot explicitly marked as public evidence.',
    actionHref: '/admin/source-reliability',
    actionLabel: 'Open reliability',
  },
  public: {
    label: 'Public',
    definition: 'Policies that pass the production publication gate for ingestion, status and evidence.',
    actionHref: '/admin/dataset-quality',
    actionLabel: 'Open Dataset QA',
  },
  analysed: {
    label: 'Analysed',
    definition: 'Public-gated policies with at least one change explicitly backed by public evidence.',
    actionHref: '/admin/kpi-audit',
    actionLabel: 'Open KPI audit',
  },
};

function safeCount(metric: PublicationReadinessMetric): number | null {
  if (!metric.available || metric.count === null || !Number.isFinite(metric.count)) return null;
  return Math.max(0, Math.trunc(metric.count));
}

function latestCapture(metric: PublicationReadinessCaptureMetric | undefined): PublicationReadinessLatestCapture {
  if (!metric?.available) {
    return {
      capturedAt: null,
      availability: 'unavailable',
      definition: LATEST_CAPTURE_DEFINITION,
      reason: metric?.reason || 'Latest-capture metric is unavailable.',
    };
  }

  const parsed = metric.capturedAt ? new Date(metric.capturedAt) : null;
  const valid = !parsed || !Number.isNaN(parsed.getTime());
  return {
    capturedAt: valid && parsed ? parsed.toISOString() : null,
    availability: valid ? 'measured' : 'unavailable',
    definition: LATEST_CAPTURE_DEFINITION,
    reason: valid ? null : 'Latest-capture timestamp is invalid.',
  };
}

export function buildPublicationReadiness(input: PublicationReadinessInput): PublicationReadinessResult {
  const configuredCount = safeCount(input.configured);
  const metrics: Record<PublicationReadinessStageId, PublicationReadinessMetric> = {
    configured: input.configured,
    retrieved: input.retrieved,
    'baseline-verified': input.baselineVerified,
    public: input.public,
    analysed: input.analysed,
  };

  let previousMeasuredCount: number | null = null;
  let previousMeasuredLabel: string | null = null;
  const warnings: string[] = [];

  const stages = PUBLICATION_READINESS_STAGE_IDS.map((id): PublicationReadinessStage => {
    const metric = metrics[id];
    const measuredCount = configuredCount === null ? null : safeCount(metric);
    const isMeasured = configuredCount !== null && measuredCount !== null;
    const metadata = STAGE_METADATA[id];
    let availability: PublicationReadinessAvailability = isMeasured ? 'measured' : 'unavailable';
    let boundary: string | null = null;

    if (isMeasured && previousMeasuredCount !== null && measuredCount > previousMeasuredCount) {
      availability = 'review';
      boundary = `${metadata.label} contains ${measuredCount} records, which is greater than the earlier measured ${previousMeasuredLabel} stage (${previousMeasuredCount}). Review persisted evidence and gate alignment.`;
      warnings.push(boundary);
    }

    if (isMeasured) {
      previousMeasuredCount = measuredCount;
      previousMeasuredLabel = metadata.label;
    }

    return {
      id,
      ...metadata,
      count: measuredCount,
      denominator: isMeasured ? configuredCount : null,
      excluded: isMeasured ? Math.max(0, configuredCount - measuredCount) : null,
      availability,
      reason: isMeasured
        ? null
        : (configuredCount === null
          ? 'The configured policy denominator is unavailable.'
          : metric.reason || 'This stage metric could not be established.'),
      boundary,
    };
  });

  return {
    checkedAt: input.checkedAt,
    available: stages.some((stage) => stage.availability !== 'unavailable'),
    denominator: configuredCount,
    stages,
    latestCapture: latestCapture(input.latestCapture),
    consistencyWarning: warnings.length > 0 ? warnings.join(' ') : null,
    scopeBoundary: input.scopeBoundary || SCOPE_BOUNDARY,
  };
}

export function buildUnavailablePublicationReadiness(checkedAt: string): PublicationReadinessResult {
  const unavailable = { available: false, count: null, reason: 'Database metrics are unavailable.' };
  return buildPublicationReadiness({
    checkedAt,
    configured: unavailable,
    retrieved: unavailable,
    baselineVerified: unavailable,
    public: unavailable,
    analysed: unavailable,
    latestCapture: {
      available: false,
      capturedAt: null,
      reason: 'Database metrics are unavailable.',
    },
  });
}
