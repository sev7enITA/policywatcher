import {
  decodePublicChangeEventCursor,
  encodePublicChangeEventCursor,
  type PublicChangeEventCursor,
  type PublicChangeEventLocale,
  type PublicChangeEventRow,
} from './publicChangeEvents';
import { buildPaloPolicyWatcherSignal } from './paloPolicyWatcherSignal';

export const PALO_POLICYWATCHER_BATCH_FORMAT = 'palo-policywatcher-signal-batch' as const;
export const PALO_POLICYWATCHER_BATCH_SCHEMA_VERSION = '1.0.0' as const;
export const PALO_POLICYWATCHER_BATCH_MAX_LIMIT = 25;
export const PALO_POLICYWATCHER_BATCH_BOUNDARY =
  'This complete forward page contains only currently public, evidence-gated PolicyWatcher changes. Consumers must traverse every page before treating an absent signal as withdrawn, validate each PALO-owned signal and retain the non-authoritative human-review boundary.' as const;

export type PaloPolicyWatcherBatchQuery = {
  ok: true;
  locale: PublicChangeEventLocale;
  limit: number;
  cursor: PublicChangeEventCursor | null;
} | {
  ok: false;
  error: string;
};

const QUERY_KEYS = new Set(['cursor', 'limit', 'lang']);

export function parsePaloPolicyWatcherBatchQuery(searchParams: URLSearchParams): PaloPolicyWatcherBatchQuery {
  if ([...searchParams.keys()].some((key) => !QUERY_KEYS.has(key))) {
    return { ok: false, error: 'Only cursor, limit and lang parameters are supported.' };
  }
  if (searchParams.getAll('cursor').length > 1 || searchParams.getAll('limit').length > 1 || searchParams.getAll('lang').length > 1) {
    return { ok: false, error: 'Provide each supported parameter at most once.' };
  }

  const locale = searchParams.get('lang') || 'en';
  if (locale !== 'en' && locale !== 'it') return { ok: false, error: 'Only lang=en or lang=it is supported.' };

  const limitRaw = searchParams.get('limit');
  const limit = limitRaw === null ? PALO_POLICYWATCHER_BATCH_MAX_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > PALO_POLICYWATCHER_BATCH_MAX_LIMIT) {
    return { ok: false, error: `limit must be an integer from 1 to ${PALO_POLICYWATCHER_BATCH_MAX_LIMIT}.` };
  }

  const cursorRaw = searchParams.get('cursor');
  const cursor = cursorRaw ? decodePublicChangeEventCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) return { ok: false, error: 'cursor is invalid or unsupported.' };

  return { ok: true, locale, limit, cursor };
}

export function buildPaloPolicyWatcherBatch(
  rows: readonly PublicChangeEventRow[],
  options: {
    locale: PublicChangeEventLocale;
    limit: number;
    inputCursor: PublicChangeEventCursor | null;
    hasMore: boolean;
  },
) {
  const newest = rows.at(-1);
  const nextCursor = newest
    ? encodePublicChangeEventCursor({
      version: 1,
      occurredAt: new Date(newest.publicPublishedAt).toISOString(),
      changeId: newest.id,
    })
    : options.inputCursor ? encodePublicChangeEventCursor(options.inputCursor) : null;

  return {
    format: PALO_POLICYWATCHER_BATCH_FORMAT,
    schemaVersion: PALO_POLICYWATCHER_BATCH_SCHEMA_VERSION,
    mode: 'complete-active-snapshot' as const,
    locale: options.locale,
    count: rows.length,
    limit: options.limit,
    hasMore: options.hasMore,
    nextCursor,
    signals: rows.map((row) => buildPaloPolicyWatcherSignal(row, options.locale)),
    boundary: PALO_POLICYWATCHER_BATCH_BOUNDARY,
  } as const;
}

export type PaloPolicyWatcherBatch = ReturnType<typeof buildPaloPolicyWatcherBatch>;
