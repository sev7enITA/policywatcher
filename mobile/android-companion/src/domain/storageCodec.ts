import type { Locale } from './changeEvent';
import type { CollectionItem, ReviewStatus } from './collection';

export interface PersistedPreferences {
  version: 2;
  locale: Locale;
  watchlist: string[];
  collection: CollectionItem[];
  explainerDismissed: boolean;
  seenEventIds: string[];
}

type LegacyPreferences = {
  version?: 1 | 2;
  locale?: unknown;
  watchlist?: unknown;
  collection?: unknown;
  onboardingSeen?: unknown;
  explainerDismissed?: unknown;
  seenEventIds?: unknown;
};

export const DEFAULT_PREFERENCES: PersistedPreferences = {
  version: 2,
  locale: 'it',
  watchlist: [],
  collection: [],
  explainerDismissed: false,
  seenEventIds: [],
};

const reviewStates = new Set<ReviewStatus>(['unreviewed', 'reviewing', 'reviewed']);
const stringArray = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').slice(0, max)
  : [];

export function migratePreferences(value: unknown): PersistedPreferences {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PREFERENCES };
  const legacy = value as LegacyPreferences;
  const collection = Array.isArray(legacy.collection)
    ? legacy.collection.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return [];
        const item = candidate as Partial<CollectionItem>;
        if (typeof item.changeId !== 'string') return [];
        return [{
          changeId: item.changeId,
          title: typeof item.title === 'string' ? item.title.slice(0, 240) : 'Evidence record',
          companyName: typeof item.companyName === 'string' ? item.companyName.slice(0, 160) : 'PolicyWatcher',
          status: reviewStates.has(item.status as ReviewStatus) ? item.status as ReviewStatus : 'unreviewed' as const,
          addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date(0).toISOString(),
        }];
      }).slice(0, 12)
    : [];
  return {
    version: 2,
    locale: legacy.locale === 'en' ? 'en' : 'it',
    watchlist: stringArray(legacy.watchlist, 200),
    collection,
    explainerDismissed: legacy.version === 2 ? Boolean(legacy.explainerDismissed) : Boolean(legacy.onboardingSeen),
    seenEventIds: stringArray(legacy.seenEventIds, 250),
  };
}

export async function readWithFallback<T>(read: () => Promise<string | null>, fallback: T): Promise<T> {
  try {
    const raw = await read();
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
