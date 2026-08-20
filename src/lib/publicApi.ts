import {
  PUBLIC_DATA_SOURCES,
  type EvidenceGate,
  type FreshnessMode,
  type PublicDataSourceId,
} from './dataSourceRegistry';
import {
  getMetaObservatoryMetrics,
  OBSERVATORY_VERIFIED_AT,
  observatoryEvents,
  observatoryMetaInsights,
  observatorySignals,
  observatorySources,
  type Locale,
} from './observatory';
import { POLICYWATCHER_VERSION } from './release';

/**
 * A small, read-only integration contract. It intentionally exposes public
 * records and curated registry metadata only; it is not an operations API.
 */
export const PUBLIC_API_VERSION = 'v1' as const;
export const PUBLIC_API_RATE_LIMIT = Object.freeze({
  requests: 60,
  intervalSeconds: 60,
  scope: 'default per-IP bucket for public v1 reference routes',
  overrides: Object.freeze([
    Object.freeze({ endpoint: '/api/v1/evidence-collections', requests: 30, intervalSeconds: 60 }),
    Object.freeze({ endpoint: '/api/v1/change-events', requests: 30, intervalSeconds: 60 }),
    Object.freeze({ endpoint: '/api/v1/agent/*', requests: 30, intervalSeconds: 60 }),
  ]),
});
export const PUBLIC_API_CACHE_SECONDS = 300;

export type PublicApiLocale = Locale;

export interface PublicApiManifestSource {
  id: PublicDataSourceId;
  endpoint: string;
  method: 'GET';
  evidenceGate: EvidenceGate;
  freshness: {
    mode: FreshnessMode;
    maxAgeSeconds: number;
  };
  allowedPathParams: readonly string[];
  allowedQueryParams: readonly string[];
  description: string;
}

export function parsePublicApiLocale(raw: string | null): PublicApiLocale | null {
  if (raw === null || raw === '') return 'en';
  if (raw === 'en' || raw === 'it') return raw;
  return null;
}

function serializeDataSource(sourceId: PublicDataSourceId): PublicApiManifestSource {
  const source = PUBLIC_DATA_SOURCES[sourceId];
  return {
    id: source.id,
    endpoint: source.endpoint,
    method: source.method,
    evidenceGate: source.evidenceGate,
    freshness: { ...source.freshness },
    allowedPathParams: [...source.allowedPathParams],
    allowedQueryParams: [...source.allowedQueryParams],
    description: source.description,
  };
}

export function getPublicApiManifest() {
  return {
    apiVersion: PUBLIC_API_VERSION,
    release: POLICYWATCHER_VERSION,
    documentation: '/developers',
    readOnly: true,
    authentication: 'none',
    cors: {
      enabled: true,
      credentials: false,
      methods: ['GET', 'OPTIONS'],
    },
    rateLimit: PUBLIC_API_RATE_LIMIT,
    cache: {
      maxAgeSeconds: PUBLIC_API_CACHE_SECONDS,
      policy: 'public, max-age=60, s-maxage=300',
    },
    boundaries: [
      'Only public evidence or curated public-reference metadata is exposed.',
      'The API does not expose policy text, raw failure reasons, admin logs, private records, or credentials. Evidence collections may repeat public snapshot and packet fingerprints already exposed by the selected Evidence Packets.',
      'Observatory entries are a curated local registry with review timestamps, not an automated external news feed.',
      'Published records remain subject to source availability and public-evidence gates.',
      'Publication readiness is one aggregate database-derived metric. It exposes counts and the latest successful capture timestamp, never policy text or internal identifiers.',
      'The change-event feed is a forward-polling surface. It does not confirm notification delivery or replace future signed webhook controls.',
      'The residency evidence pack distinguishes public documents, operator declarations, deployment-dependent facts and open evidence; it does not prove the live deployment region.',
    ],
    residencyEvidence: {
      endpoint: '/api/v1/residency-evidence',
      contract: 'dated bounded evidence register with deterministic SHA-256 digest',
      humanReview: '/trust/residency',
    },
    releaseEvidence: {
      endpoint: '/api/v1/release-evidence',
      schema: '/schemas/release-evidence-ledger/v1',
      contract: 'inclusive 14-day release ledger with deterministic SHA-256 digest and explicit claim boundaries',
      humanReview: '/pulse/two-week-release-impact',
    },
    publicationReadiness: {
      endpoint: '/api/v1/publication-readiness',
      schema: '/schemas/publication-readiness/v1',
      contract: 'configured → retrieved → baseline verified → public → analysed, plus latest capture',
      cache: 'no-store',
    },
    agentGateway: {
      contract: '/api/v1/agent/openapi.json',
      operations: ['/api/v1/agent/capabilities', '/api/v1/agent/change-brief', '/api/v1/agent/observatory-brief'],
      responseShape: 'flattened deterministic public evidence brief',
      inputBoundary: 'Bounded filters only; no prompt transcript, document body or selected contract text.',
    },
    sources: (Object.keys(PUBLIC_DATA_SOURCES) as PublicDataSourceId[]).map(serializeDataSource),
  };
}

export function getPublicObservatoryPayload(locale: PublicApiLocale) {
  return {
    apiVersion: PUBLIC_API_VERSION,
    release: POLICYWATCHER_VERSION,
    locale,
    registry: {
      verifiedAt: OBSERVATORY_VERIFIED_AT,
      mode: 'curated-local-registry',
      refresh: 'manual review',
      boundary:
        'Listed sources and signals support review and discovery. They are not automatically ingested into PolicyWatcher policy evidence; catalogued sources under review are not evidence-ready.',
    },
    sources: observatorySources.map((source) => ({
      id: source.id,
      name: source.name,
      shortName: source.shortName,
      url: source.url,
      region: source.region,
      authority: source.authority,
      kind: source.kind,
      evidenceStatus: source.evidenceStatus,
      evidenceRole: source.evidenceRole,
      evidenceReady: source.evidenceReady,
      lastReviewLabel: source.lastReviewLabel[locale],
      accessCapability: source.accessCapability,
      contentTypes: [...source.contentTypes],
      reviewCadence: source.reviewCadence[locale],
      note: source.note[locale],
    })),
    metaObservatory: {
      trustRule: 'catalogued ≠ verified ≠ evidence-ready; no single-source synthesis',
      metrics: getMetaObservatoryMetrics(),
      insights: observatoryMetaInsights.map((insight) => ({
        id: insight.id,
        lens: insight.lens,
        eyebrow: insight.eyebrow[locale],
        title: insight.title[locale],
        summary: insight.summary[locale],
        implication: insight.implication[locale],
        sourceIds: [...insight.sourceIds],
        evidenceBoundary: insight.evidenceBoundary,
      })),
    },
    signals: observatorySignals.map((signal) => ({
      id: signal.id,
      sourceId: signal.sourceId,
      title: signal.title[locale],
      summary: signal.summary[locale],
      contentType: signal.contentType,
      region: signal.region,
      dateLabel: signal.dateLabel[locale],
      sourceUrl: signal.sourceUrl,
      publishedOn: signal.publishedOn,
      reviewUtc: signal.reviewUtc,
      reviewTimeLabel: signal.reviewTimeLabel[locale],
      localHref: signal.localHref,
      priority: signal.priority,
    })),
    events: observatoryEvents.map((event) => ({
      id: event.id,
      title: event.title[locale],
      organizer: event.organizer,
      dateLabel: event.dateLabel[locale],
      timeLabel: event.timeLabel[locale],
      location: event.location[locale],
      summary: event.summary[locale],
      href: event.href,
      calendar: { ...event.calendar },
    })),
  };
}
