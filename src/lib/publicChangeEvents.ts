import { createHash } from 'node:crypto';

export const PUBLIC_CHANGE_EVENT_SCHEMA_VERSION = '1.0.0' as const;
export const PUBLIC_CHANGE_EVENT_DEFAULT_LIMIT = 25;
export const PUBLIC_CHANGE_EVENT_MAX_LIMIT = 100;
export const PUBLIC_CHANGE_EVENT_BOUNDARY =
  'This feed reports PolicyWatcher publication events for already-public evidence records. It is a polling surface, not a webhook, delivery receipt, legal alert, exhaustive source history or guarantee that an external source remains available.';

export type PublicChangeEventLocale = 'en' | 'it';

export interface PublicChangeEventCursor {
  version: 1;
  occurredAt: string;
  changeId: string;
}

export interface PublicChangeEventRow {
  id: string;
  publicPublishedAt: Date | string;
  overallRisk: string;
  overallScore: number;
  tldrEn: string | null;
  tldrIt: string | null;
  aiSummaryEn: string;
  aiSummaryIt: string;
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    company: {
      id: string;
      name: string;
      slug: string;
      industry: string;
    };
  };
}

export type PublicChangeEventQuery = {
  ok: true;
  locale: PublicChangeEventLocale;
  limit: number;
  cursor: PublicChangeEventCursor | null;
} | {
  ok: false;
  error: string;
};

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUERY_KEYS = new Set(['cursor', 'limit', 'lang']);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalTimestamp(value: string): string | null {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  const canonical = parsed.toISOString();
  return canonical === value ? canonical : null;
}

export function encodePublicChangeEventCursor(cursor: PublicChangeEventCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodePublicChangeEventCursor(raw: string): PublicChangeEventCursor | null {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(raw)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<PublicChangeEventCursor>;
    if (parsed.version !== 1 || typeof parsed.occurredAt !== 'string' || typeof parsed.changeId !== 'string') return null;
    const occurredAt = canonicalTimestamp(parsed.occurredAt);
    if (!occurredAt || !UUID_V4_RE.test(parsed.changeId)) return null;
    const normalized = { version: 1 as const, occurredAt, changeId: parsed.changeId.toLowerCase() };
    return encodePublicChangeEventCursor(normalized) === raw ? normalized : null;
  } catch {
    return null;
  }
}

export function parsePublicChangeEventQuery(searchParams: URLSearchParams): PublicChangeEventQuery {
  if ([...searchParams.keys()].some((key) => !QUERY_KEYS.has(key))) {
    return { ok: false, error: 'Only cursor, limit and lang parameters are supported.' };
  }
  if (searchParams.getAll('cursor').length > 1 || searchParams.getAll('limit').length > 1 || searchParams.getAll('lang').length > 1) {
    return { ok: false, error: 'Provide each supported parameter at most once.' };
  }

  const locale = searchParams.get('lang') || 'en';
  if (locale !== 'en' && locale !== 'it') return { ok: false, error: 'Only lang=en or lang=it is supported.' };

  const limitRaw = searchParams.get('limit');
  const limit = limitRaw === null ? PUBLIC_CHANGE_EVENT_DEFAULT_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > PUBLIC_CHANGE_EVENT_MAX_LIMIT) {
    return { ok: false, error: `limit must be an integer from 1 to ${PUBLIC_CHANGE_EVENT_MAX_LIMIT}.` };
  }

  const cursorRaw = searchParams.get('cursor');
  const cursor = cursorRaw ? decodePublicChangeEventCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) return { ok: false, error: 'cursor is invalid or unsupported.' };

  return { ok: true, locale, limit, cursor };
}

export function buildPublicChangeEventFeed(
  rows: readonly PublicChangeEventRow[],
  options: { locale: PublicChangeEventLocale; limit: number; inputCursor: PublicChangeEventCursor | null; hasMore: boolean; initialWindowTruncated: boolean },
) {
  const events = rows.map((row) => {
    const occurredAt = new Date(row.publicPublishedAt).toISOString();
    return {
      eventId: `pwe_${sha256(`policy.change.published:${row.id}:${occurredAt}`).slice(0, 20)}`,
      eventType: 'policy.change.published' as const,
      schemaVersion: PUBLIC_CHANGE_EVENT_SCHEMA_VERSION,
      occurredAt,
      subject: {
        changeId: row.id,
        company: { id: row.policy.company.id, name: row.policy.company.name, slug: row.policy.company.slug, industry: row.policy.company.industry },
        policy: { id: row.policy.id, name: row.policy.name, type: row.policy.type, jurisdiction: row.policy.jurisdiction },
      },
      screening: {
        overallRisk: row.overallRisk,
        overallScore: row.overallScore,
        summary: options.locale === 'it' ? (row.tldrIt || row.aiSummaryIt) : (row.tldrEn || row.aiSummaryEn),
        boundary: 'AI-assisted screening output for human review; not a legal or compliance verdict.',
      },
      links: {
        change: `https://policywatcher.online/change/${row.id}`,
        evidence: `https://policywatcher.online/evidence/${row.id}`,
        evidenceJson: `https://policywatcher.online/api/evidence-packet/${row.id}?format=json`,
      },
    };
  });

  const newest = rows.at(-1);
  const nextCursor = newest
    ? encodePublicChangeEventCursor({ version: 1, occurredAt: new Date(newest.publicPublishedAt).toISOString(), changeId: newest.id })
    : options.inputCursor ? encodePublicChangeEventCursor(options.inputCursor) : null;

  return {
    schema: 'https://policywatcher.online/schemas/change-event-feed/v1',
    schemaVersion: PUBLIC_CHANGE_EVENT_SCHEMA_VERSION,
    mode: 'forward-polling' as const,
    locale: options.locale,
    count: events.length,
    limit: options.limit,
    hasMore: options.hasMore,
    initialWindowTruncated: options.initialWindowTruncated,
    nextCursor,
    events,
    boundary: PUBLIC_CHANGE_EVENT_BOUNDARY,
  } as const;
}

export type PublicChangeEventFeed = ReturnType<typeof buildPublicChangeEventFeed>;
