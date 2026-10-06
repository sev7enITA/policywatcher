import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import { validateCachedFeed, type ChangeFeed } from '@/domain/changeEvent';
import { DEFAULT_PREFERENCES, migratePreferences, readWithFallback, type PersistedPreferences } from '@/domain/storageCodec';
import { POLICYWATCHER_ORIGIN } from './origin';
import { parseCitizenFeed, parseCitizenPreferences, type CitizenFeed } from '../../../../shared/citizen';

export { DEFAULT_PREFERENCES, migratePreferences, readWithFallback, type PersistedPreferences } from '@/domain/storageCodec';

const webStore = {
  getItem: async (key: string) => globalThis.localStorage.getItem(key),
  setItem: async (key: string, value: string) => { globalThis.localStorage.setItem(key, value); },
};

const store = Platform.OS === 'web' ? webStore : Storage;
const PREFS_KEY = 'policywatcher.companion.preferences.v2';
const FEED_KEY = 'policywatcher.companion.feed.v1';

export async function loadPreferences(): Promise<PersistedPreferences> {
  const raw = await store.getItem(PREFS_KEY);
  const value: unknown = raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid stored preferences');
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== undefined && candidate.version !== 1 && candidate.version !== 2 && candidate.version !== 3) throw new Error('Unsupported stored preferences');
  if (candidate.version === 3 && !parseCitizenPreferences(JSON.stringify(candidate.citizen))) throw new Error('Invalid citizen preferences');
  return migratePreferences(value);
}

export async function savePreferences(value: PersistedPreferences): Promise<void> {
  await store.setItem(PREFS_KEY, JSON.stringify(value));
}

export interface FeedCache { feed: ChangeFeed; refreshedAt: string }

export async function loadFeedCache(): Promise<FeedCache | null> {
  const value = await readWithFallback<unknown>(() => store.getItem(FEED_KEY), null);
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<FeedCache>;
  const feed = validateCachedFeed(candidate.feed, POLICYWATCHER_ORIGIN);
  const timestamp = typeof candidate.refreshedAt === 'string' ? new Date(candidate.refreshedAt) : null;
  if (!feed || !timestamp || !Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== candidate.refreshedAt) return null;
  return { feed, refreshedAt: candidate.refreshedAt };
}

export async function saveFeedCache(value: FeedCache): Promise<void> {
  await store.setItem(FEED_KEY, JSON.stringify(value));
}

const CITIZEN_FEED_KEY = 'policywatcher.companion.citizen-feed.v1';
export async function loadCitizenCache(): Promise<CitizenFeed | null> {
  return parseCitizenFeed(await readWithFallback<unknown>(() => store.getItem(CITIZEN_FEED_KEY), null));
}
export async function saveCitizenCache(feed: CitizenFeed): Promise<void> {
  await store.setItem(CITIZEN_FEED_KEY, JSON.stringify(feed));
}

/** Explicit recovery export keeps the original stored bytes intact. */
export async function readRawPreferences(): Promise<string | null> {
  return store.getItem(PREFS_KEY);
}
