import {
  PUBLIC_DATA_SOURCES,
  type EvidenceGate,
  type FreshnessMode,
  type PublicDataSourceId,
} from './dataSourceRegistry';
import {
  OBSERVATORY_VERIFIED_AT,
  observatoryEvents,
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
  scope: 'per IP across the v1 public integration routes',
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
    ],
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
        'Listed sources and signals support review and discovery. They are not automatically ingested into PolicyWatcher policy evidence.',
    },
    sources: observatorySources.map((source) => ({
      id: source.id,
      name: source.name,
      shortName: source.shortName,
      url: source.url,
      region: source.region,
      authority: source.authority,
      contentTypes: [...source.contentTypes],
      reviewCadence: source.reviewCadence[locale],
      note: source.note[locale],
    })),
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
