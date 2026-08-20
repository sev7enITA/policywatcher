import { UUID_V4_RE } from './changeEvent';

export const COLLECTION_LIMIT = 12;
export type ReviewStatus = 'unreviewed' | 'reviewing' | 'reviewed';

export interface CollectionItem {
  changeId: string;
  title: string;
  companyName: string;
  status: ReviewStatus;
  addedAt: string;
}

export function canonicalizeChangeIds(values: readonly string[]): string[] | null {
  if (values.length > COLLECTION_LIMIT) return null;
  const canonical: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const id = value.trim().toLowerCase();
    if (!UUID_V4_RE.test(id)) return null;
    if (!seen.has(id)) {
      seen.add(id);
      canonical.push(id);
    }
  }
  return canonical.length <= COLLECTION_LIMIT ? canonical : null;
}

export function parseCollectionParam(raw: string | string[] | undefined): string[] | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 443) return null;
  return canonicalizeChangeIds(raw.split(','));
}

export function addCollectionItem(items: readonly CollectionItem[], next: CollectionItem): CollectionItem[] {
  if (items.some((item) => item.changeId === next.changeId)) return [...items];
  if (items.length >= COLLECTION_LIMIT) return [...items];
  return [...items, next];
}

export function buildCollectionUrl(origin: string, items: readonly Pick<CollectionItem, 'changeId'>[]): string {
  const ids = canonicalizeChangeIds(items.map((item) => item.changeId)) ?? [];
  const url = new URL('/collections', origin);
  if (ids.length > 0) url.searchParams.set('changes', ids.join(','));
  return url.toString();
}

export function buildDashboardSearchUrl(origin: string, query: string): string {
  const url = new URL('/', origin);
  const normalized = query.trim().slice(0, 200);
  if (normalized) {
    url.searchParams.set('dv', '1');
    url.searchParams.set('q', normalized);
  }
  return url.toString();
}
