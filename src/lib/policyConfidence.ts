export const DATA_STATUSES = [
  'Configured',
  'Available',
  'Partial',
  'Needs Review',
  'Unavailable',
  'Reviewed',
] as const;

export type DataStatus = (typeof DATA_STATUSES)[number];

const DATA_STATUS_SET = new Set<string>(DATA_STATUSES);

const STATUS_RANK: Record<DataStatus, number> = {
  Unavailable: 6,
  'Needs Review': 5,
  Partial: 4,
  Configured: 3,
  Available: 2,
  Reviewed: 1,
};

export function isDataStatus(value: unknown): value is DataStatus {
  return typeof value === 'string' && DATA_STATUS_SET.has(value);
}

export function normalizeDataStatus(
  value: unknown,
  fallback: DataStatus = 'Needs Review'
): DataStatus {
  return isDataStatus(value) ? value : fallback;
}

export function dataStatusClassKey(value: unknown): string {
  return normalizeDataStatus(value, 'Available').replace(/\s+/g, '').toLowerCase();
}

export function getWorstDataStatus<T extends { dataStatus?: string | null }>(
  policies: T[]
): DataStatus {
  if (policies.length === 0) return 'Configured';

  return policies
    .map((policy) => normalizeDataStatus(policy.dataStatus, 'Needs Review'))
    .sort((a, b) => STATUS_RANK[b] - STATUS_RANK[a])[0];
}

export function dataStatusFromScrapeFailure(status: string): DataStatus {
  return status === 'invalid' ? 'Needs Review' : 'Unavailable';
}

export function normalizeIngestionMethod(source: unknown): string {
  if (typeof source !== 'string' || source.trim() === '') return 'Seeded';

  const normalized = source.trim().toLowerCase();
  const labels: Record<string, string> = {
    direct: 'Direct scrape',
    http2: 'HTTP/2 scrape',
    rendered: 'Rendered scrape',
    wayback: 'Wayback cache',
    cache: 'Web cache', // legacy rows (Google Cache strategy, retired)
    commoncrawl: 'Common Crawl',
    seeded: 'Seeded',
    none: 'None',
  };

  return labels[normalized] || source.trim();
}

export function isSeededIngestionEvidence(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'seeded';
}

const verifiedSourceEvidenceSources = new Set([
  'direct',
  'http2',
  'rendered',
  'wayback',
  'commoncrawl',
]);

export function hasVerifiedSourceEvidence(
  checkLogs: Array<{ source?: string | null; textHash?: string | null }> = []
): boolean {
  return checkLogs.some((log) => {
    const source = (log.source || '').trim().toLowerCase();
    return Boolean(log.textHash) && verifiedSourceEvidenceSources.has(source);
  });
}

export function shouldRebaselineFromSeededRecord(policy: {
  dataStatus?: string | null;
  ingestionMethod?: string | null;
  checkLogs?: Array<{ source?: string | null; textHash?: string | null }> | null;
  snapshots?: Array<{ publicEvidence?: boolean | null }> | null;
}): boolean {
  if (!isSeededIngestionEvidence(policy.ingestionMethod)) return false;
  if (hasVerifiedSourceEvidence(policy.checkLogs || [])) return false;
  if ((policy.snapshots || []).some((snapshot) => snapshot.publicEvidence)) return false;
  return true;
}

/**
 * Returns the oldest archive capture that can be considered current evidence.
 *
 * A source migration must never establish its replacement baseline from an
 * archive captured before the administrator requested the migration. For all
 * other records, the last successful check remains the freshness boundary.
 * This also prevents first/seeded baselines from silently accepting evidence
 * that predates the monitoring record.
 */
export function archiveFreshnessFloor(policy: {
  lastSuccessfulCheckDate?: Date | null;
  sourceMigrationPending?: boolean | null;
  sourceMigrationRequestedAt?: Date | null;
}): Date | undefined {
  const candidate = policy.sourceMigrationPending && policy.sourceMigrationRequestedAt
    ? policy.sourceMigrationRequestedAt
    : policy.lastSuccessfulCheckDate;

  if (!(candidate instanceof Date) || Number.isNaN(candidate.getTime())) return undefined;
  return candidate;
}
