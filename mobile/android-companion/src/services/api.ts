import type { Locale } from '@/domain/changeEvent';
import { validateFeed } from '@/domain/changeEvent';
import { POLICYWATCHER_ORIGIN } from './origin';

export async function fetchPublicFeed(locale: Locale, signal?: AbortSignal) {
  const url = new URL('/api/v1/change-events', POLICYWATCHER_ORIGIN);
  url.searchParams.set('limit', '25');
  url.searchParams.set('lang', locale);
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const validated = validateFeed(await response.json(), POLICYWATCHER_ORIGIN);
  if (!validated.ok) throw new Error(`Invalid public feed: ${validated.reason}`);
  return validated.feed;
}
