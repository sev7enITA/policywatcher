import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import type { ChangeEvent, ChangeFeed, Locale } from '@/domain/changeEvent';
import { addCollectionItem, type CollectionItem, type ReviewStatus } from '@/domain/collection';
import { demoFeed } from '@/domain/demo';
import { COPY, type Copy } from '@/i18n/copy';
import { fetchPublicFeed } from '@/services/api';
import {
  DEFAULT_PREFERENCES,
  loadFeedCache,
  loadPreferences,
  saveFeedCache,
  savePreferences,
  type PersistedPreferences,
} from '@/services/storage';

export type FeedMode = 'loading' | 'live' | 'cached' | 'demo';

interface AppContextValue {
  hydrated: boolean;
  locale: Locale;
  copy: Copy;
  feed: ChangeFeed | null;
  feedMode: FeedMode;
  refreshedAt: string | null;
  refreshing: boolean;
  lastError: string | null;
  newWatchedCount: number;
  watchlist: string[];
  collection: CollectionItem[];
  explainerDismissed: boolean;
  refresh: () => Promise<void>;
  setLocale: (locale: Locale) => void;
  toggleWatch: (companyId: string) => void;
  toggleSaved: (event: ChangeEvent) => void;
  removeSaved: (changeId: string) => void;
  setReviewStatus: (changeId: string, status: ReviewStatus) => void;
  importCollection: (ids: readonly string[]) => number;
  dismissExplainer: (dismissed: boolean) => void;
  findEvent: (changeId: string) => ChangeEvent | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

async function haptic(kind: 'select' | 'success') {
  if (Platform.OS === 'web' || await AccessibilityInfo.isReduceMotionEnabled()) return;
  if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else await Haptics.selectionAsync();
}

export function AppStateProvider({ children }: React.PropsWithChildren) {
  const [prefs, setPrefs] = useState<PersistedPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [feed, setFeed] = useState<ChangeFeed | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('loading');
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [newWatchedCount, setNewWatchedCount] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([loadPreferences(), loadFeedCache()]).then(([storedPrefs, cache]) => {
      if (!active) return;
      setPrefs(storedPrefs);
      if (cache) {
        setFeed(cache.feed);
        setRefreshedAt(cache.refreshedAt);
        setFeedMode('cached');
      }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hydrated) void savePreferences(prefs);
  }, [hydrated, prefs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setLastError(null);
    try {
      const result = await fetchPublicFeed(prefs.locale);
      const now = new Date().toISOString();
      const previous = new Set(prefs.seenEventIds);
      const newlyWatched = result.events.filter((event) => prefs.watchlist.includes(event.company.id) && !previous.has(event.eventId)).length;
      setNewWatchedCount(newlyWatched);
      setFeed(result);
      setFeedMode('live');
      setRefreshedAt(now);
      setPrefs((current) => ({ ...current, seenEventIds: result.events.map((event) => event.eventId).slice(0, 250) }));
      await saveFeedCache({ feed: result, refreshedAt: now });
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'unavailable');
      if (feed) setFeedMode('cached');
      else {
        setFeed(demoFeed(prefs.locale));
        setFeedMode('demo');
      }
    } finally {
      setRefreshing(false);
    }
  }, [feed, prefs.locale, prefs.seenEventIds, prefs.watchlist]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
    // Refresh only after hydration or explicit locale changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, prefs.locale]);

  const update = useCallback((recipe: (current: PersistedPreferences) => PersistedPreferences) => setPrefs(recipe), []);
  const setLocale = useCallback((locale: Locale) => update((current) => ({ ...current, locale })), [update]);
  const toggleWatch = useCallback((companyId: string) => {
    if (!feed?.events.some((event) => event.company.id === companyId)) return;
    update((current) => ({
      ...current,
      watchlist: current.watchlist.includes(companyId) ? current.watchlist.filter((id) => id !== companyId) : [...current.watchlist, companyId],
    }));
    void haptic('select');
  }, [feed, update]);
  const toggleSaved = useCallback((event: ChangeEvent) => {
    update((current) => {
      const exists = current.collection.some((item) => item.changeId === event.changeId);
      return {
        ...current,
        collection: exists
          ? current.collection.filter((item) => item.changeId !== event.changeId)
          : addCollectionItem(current.collection, {
              changeId: event.changeId,
              title: event.policy.name,
              companyName: event.company.name,
              status: 'unreviewed',
              addedAt: new Date().toISOString(),
            }),
      };
    });
    void haptic('success');
  }, [update]);
  const removeSaved = useCallback((changeId: string) => {
    update((current) => ({ ...current, collection: current.collection.filter((item) => item.changeId !== changeId) }));
    void haptic('select');
  }, [update]);
  const setReviewStatus = useCallback((changeId: string, status: ReviewStatus) => {
    update((current) => ({
      ...current,
      collection: current.collection.map((item) => item.changeId === changeId ? { ...item, status } : item),
    }));
    void haptic(status === 'reviewed' ? 'success' : 'select');
  }, [update]);
  const importCollection = useCallback((ids: readonly string[]) => {
    let added = 0;
    update((current) => {
      let collection = current.collection;
      for (const id of ids) {
        if (collection.length >= 12 || collection.some((item) => item.changeId === id)) continue;
        const event = feed?.events.find((candidate) => candidate.changeId === id);
        collection = addCollectionItem(collection, {
          changeId: id,
          title: event?.policy.name ?? `Evidence ${id.slice(0, 8)}`,
          companyName: event?.company.name ?? 'PolicyWatcher',
          status: 'unreviewed',
          addedAt: new Date().toISOString(),
        });
        added += 1;
      }
      return { ...current, collection };
    });
    if (added) void haptic('success');
    return added;
  }, [feed, update]);
  const dismissExplainer = useCallback((dismissed: boolean) => update((current) => ({ ...current, explainerDismissed: dismissed })), [update]);
  const findEvent = useCallback((changeId: string) => feed?.events.find((event) => event.changeId === changeId), [feed]);

  const value = useMemo<AppContextValue>(() => ({
    hydrated,
    locale: prefs.locale,
    copy: COPY[prefs.locale],
    feed,
    feedMode,
    refreshedAt,
    refreshing,
    lastError,
    newWatchedCount,
    watchlist: prefs.watchlist,
    collection: prefs.collection,
    explainerDismissed: prefs.explainerDismissed,
    refresh,
    setLocale,
    toggleWatch,
    toggleSaved,
    removeSaved,
    setReviewStatus,
    importCollection,
    dismissExplainer,
    findEvent,
  }), [hydrated, prefs, feed, feedMode, refreshedAt, refreshing, lastError, newWatchedCount, refresh, setLocale, toggleWatch, toggleSaved, removeSaved, setReviewStatus, importCollection, dismissExplainer, findEvent]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
