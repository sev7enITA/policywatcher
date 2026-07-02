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
    wayback: 'Wayback cache',
    cache: 'Web cache',
    commoncrawl: 'Common Crawl',
    seeded: 'Seeded',
    none: 'None',
  };

  return labels[normalized] || source.trim();
}
