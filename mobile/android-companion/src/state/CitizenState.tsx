import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState as NativeAppState } from 'react-native';
import { mergeCitizenPage } from '@/domain/citizenFeed';
import { fetchCitizenFeed } from '@/services/citizenApi';
import { loadCitizenCache, saveCitizenCache } from '@/services/storage';
import { useAppState } from './AppState';
import type { CitizenFeed } from '../../../../shared/citizen';

interface CitizenContextValue {
  feed: CitizenFeed | null;
  mode: 'loading' | 'live' | 'cached' | 'unavailable';
  loading: boolean;
  error: boolean;
  cacheError: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}
const CitizenContext = createContext<CitizenContextValue | null>(null);

export function CitizenStateProvider({ children }: React.PropsWithChildren) {
  const { hydrated, setCitizen } = useAppState();
  const [feed, setFeed] = useState<CitizenFeed | null>(null);
  const [mode, setMode] = useState<CitizenContextValue['mode']>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [cacheError, setCacheError] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const currentFeed = useRef<CitizenFeed | null>(null);

  const request = useCallback(async (older: boolean) => {
    if (busy.current) return;
    const previous = currentFeed.current;
    if (older && !previous?.history.nextCursor) return;
    busy.current = true;
    setLoading(true);
    setMode(previous ? 'cached' : 'loading');
    setError(false);
    try {
      const result = await fetchCitizenFeed(older ? previous?.history.nextCursor : null);
      if (!alive.current) return;
      const combined = older && previous ? mergeCitizenPage(previous, result) : result;
      currentFeed.current = combined;
      setFeed(combined);
      setMode('live');
      setCitizen(prefs => ({ ...prefs, followed: prefs.followed.map(followed => {
        const service = result.services.find(item => item.id === followed.serviceId);
        return service ? { ...followed, name: service.name, slug: service.slug } : followed;
      }) }));
      // Persist the bounded first window only; previously loaded pages are not a claim of full coverage.
      if (!older) await saveCitizenCache(result).then(() => setCacheError(false)).catch(() => setCacheError(true));
    } catch {
      if (alive.current) { setError(true); setMode(currentFeed.current ? 'cached' : 'unavailable'); }
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  }, [setCitizen]);
  const refresh = useCallback(() => request(false), [request]);
  const loadMore = useCallback(() => request(true), [request]);

  useEffect(() => {
    alive.current = true;
    if (!hydrated) return;
    void loadCitizenCache().then(cache => {
      if (!alive.current) return;
      if (cache) { currentFeed.current = cache; setFeed(cache); setMode('cached'); }
      void refresh();
    }).catch(() => { if (alive.current) void refresh(); });
    return () => { alive.current = false; };
  }, [hydrated, refresh]);
  useEffect(() => {
    const listener = NativeAppState.addEventListener('change', () => {
      // A foreground return must not imply that a background interval was monitored.
      setMode(value => value === 'live' ? 'cached' : value);
    });
    return () => listener.remove();
  }, []);
  return <CitizenContext.Provider value={{ feed, mode, loading, error, cacheError, refresh, loadMore }}>{children}</CitizenContext.Provider>;
}
export function useCitizenState() {
  const value = useContext(CitizenContext);
  if (!value) throw new Error('CitizenStateProvider missing');
  return value;
}
