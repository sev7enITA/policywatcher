import type { PublicChangeEventLocale, PublicChangeEventRow } from './publicChangeEvents';

export const PALO_POLICYWATCHER_SIGNAL_FORMAT = 'palo-policywatcher-signal' as const;
export const PALO_POLICYWATCHER_SIGNAL_SCHEMA_VERSION = '1.0.0' as const;
export const PALO_POLICYWATCHER_SIGNAL_SCHEMA =
  'https://paloframework.org/schemas/policywatcher-signal.schema.json' as const;
export const PALO_POLICYWATCHER_SIGNAL_AUTHORITY = 'non-authoritative-monitoring-signal' as const;
export const PALO_POLICYWATCHER_SIGNAL_BOUNDARY =
  'PolicyWatcher exports only an already-public, evidence-gated observation. PALO remains responsible for applicability, risk, controls, decisions and accountable human review.' as const;

const CHANGE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUERY_KEYS = new Set(['changeId', 'lang']);

export type PaloPolicyWatcherSignalQuery = {
  ok: true;
  changeId: string;
  locale: PublicChangeEventLocale;
} | {
  ok: false;
  error: string;
};

export function parsePaloPolicyWatcherSignalQuery(searchParams: URLSearchParams): PaloPolicyWatcherSignalQuery {
  if ([...searchParams.keys()].some((key) => !QUERY_KEYS.has(key))) {
    return { ok: false, error: 'Only changeId and lang parameters are supported.' };
  }
  if (searchParams.getAll('changeId').length !== 1 || searchParams.getAll('lang').length > 1) {
    return { ok: false, error: 'Provide changeId exactly once and lang at most once.' };
  }
  const changeId = searchParams.get('changeId') || '';
  if (!CHANGE_ID_RE.test(changeId)) return { ok: false, error: 'changeId must be a UUID v4.' };
  const locale = searchParams.get('lang') || 'en';
  if (locale !== 'en' && locale !== 'it') return { ok: false, error: 'Only lang=en or lang=it is supported.' };
  return { ok: true, changeId: changeId.toLowerCase(), locale };
}

export function buildPaloPolicyWatcherSignal(row: PublicChangeEventRow, locale: PublicChangeEventLocale) {
  const observedAt = new Date(row.publicPublishedAt).toISOString();
  const summary = locale === 'it' ? (row.tldrIt || row.aiSummaryIt) : (row.tldrEn || row.aiSummaryEn);
  const changeUrl = `https://policywatcher.online/change/${row.id}`;
  const subjects = [...new Set([row.policy.company.slug, row.policy.type, row.policy.name].filter(Boolean))];
  const jurisdictions = row.policy.jurisdiction ? [row.policy.jurisdiction] : [];

  return {
    format: PALO_POLICYWATCHER_SIGNAL_FORMAT,
    schemaVersion: PALO_POLICYWATCHER_SIGNAL_SCHEMA_VERSION,
    signalId: `signal-policywatcher-${row.id.toLowerCase()}`,
    observedAt,
    source: {
      sourceId: `policywatcher-change-${row.id.toLowerCase()}`,
      title: `${row.policy.company.name}: ${row.policy.name}`,
      url: changeUrl,
      publisher: 'PolicyWatcher',
      checkedAt: observedAt,
    },
    summary,
    changeType: 'unknown' as const,
    subjects,
    jurisdictions,
    confidence: {
      level: 'high' as const,
      score: 1,
      rationale: 'The handoff is emitted only after the PolicyWatcher public-evidence gate; policy significance and applicability remain unreviewed.',
    },
    authority: {
      status: PALO_POLICYWATCHER_SIGNAL_AUTHORITY,
      disclaimer: 'This is a non-authoritative monitoring signal, not legal advice, a compliance verdict, an applicability determination or a PALO gate decision.',
    },
    suggestedHandoff: {
      module: 'PALO_RegulatoryWatch' as const,
      eventName: 'palo:policywatcher:signal' as const,
      reviewGateIds: ['measure', 'prove'] as const,
    },
    extensions: {
      contractOwner: 'PALO',
      canonicalSchema: PALO_POLICYWATCHER_SIGNAL_SCHEMA,
      handoffBoundary: PALO_POLICYWATCHER_SIGNAL_BOUNDARY,
      policyWatcherRecord: {
        changeId: row.id,
        eventType: 'policy.change.published',
        company: {
          id: row.policy.company.id,
          name: row.policy.company.name,
          slug: row.policy.company.slug,
          industry: row.policy.company.industry,
        },
        policy: {
          id: row.policy.id,
          name: row.policy.name,
          type: row.policy.type,
          jurisdiction: row.policy.jurisdiction,
        },
        screening: {
          overallRisk: row.overallRisk,
          overallScore: row.overallScore,
          boundary: 'AI-assisted screening output for human review; not a legal, compliance or PALO risk verdict.',
        },
        links: {
          change: changeUrl,
          evidence: `https://policywatcher.online/evidence/${row.id}`,
          evidenceJson: `https://policywatcher.online/api/evidence-packet/${row.id}?format=json`,
        },
      },
    },
  } as const;
}

export type PaloPolicyWatcherSignal = ReturnType<typeof buildPaloPolicyWatcherSignal>;
