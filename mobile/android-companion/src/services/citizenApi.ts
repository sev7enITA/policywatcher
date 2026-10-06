import { parseCitizenFeed } from '../../../../shared/citizen';
import { POLICYWATCHER_ORIGIN } from './origin';

/** Sends only the public history cursor; local personal context never leaves the device. */
export async function fetchCitizenFeed(cursor?: string | null) {
  const url = new URL('/api/v1/citizen-feed', POLICYWATCHER_ORIGIN);
  if (cursor) url.searchParams.set('cursor', cursor);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = parseCitizenFeed(await response.json());
    if (!feed) throw new Error('Invalid citizen feed');
    return feed;
  } finally { clearTimeout(timer); }
}
