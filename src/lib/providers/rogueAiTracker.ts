import {
  AGENTIC_INCIDENT_BOUNDARIES,
  AGENTIC_INCIDENT_MAPPING_VERSION,
  AGENTIC_INCIDENT_SCHEMA_VERSION,
  canonicalJsonDigest,
  stableAgenticIncidentId,
  type AgenticIncidentProviderResult,
  type ExternalIncidentProvider,
  type ExternalReviewState,
  type NormalizedAgenticIncidentSignal,
} from '../agenticIncidents';

const PROVIDER_ID = 'rogue-ai-tracker' as const;
const ENDPOINT = 'https://rogueaitracker.com/api/incidents';
const HOMEPAGE = 'https://rogueaitracker.com/';
export const ROGUE_AI_TRACKER_TIMEOUT_MS = 6_000;
export const ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES = 2 * 1_024 * 1_024;
export const ROGUE_AI_TRACKER_CACHE_MS = 15 * 60 * 1_000;
export const ROGUE_AI_TRACKER_MAX_STALE_MS = 24 * 60 * 60 * 1_000;
const MAX_INCIDENTS = 500;

type FetchLike = typeof fetch;

interface ValidatedIncident {
  id: string;
  slug: string;
  title: string;
  occurredAt: string | null;
  publishedAt: string;
  dateBasis: string | null;
  sourceName: string;
  sourceUrl: string;
  evidenceAttribution: string | null;
  attributionReview: { status: ExternalReviewState };
  tags: string[];
  gateImpacts: Array<{ gateId: string; score: number }>;
}

type CacheEntry = {
  storedAt: number;
  result: AgenticIncidentProviderResult;
};

let cache: CacheEntry | null = null;

function enabled() {
  return process.env.POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED === 'true';
}

function isoDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 40) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function boundedString(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function httpsUrl(value: unknown): string | null {
  const raw = boundedString(value, 2_048);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function validateReviewState(value: unknown): ExternalReviewState {
  return value === 'accepted' || value === 'proposed' || value === 'rejected' ? value : 'unknown';
}

export function validateRogueAiTrackerIncident(value: unknown): ValidatedIncident | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const id = boundedString(row.id, 240);
  const slug = boundedString(row.slug, 240);
  const title = boundedString(row.title, 500);
  const occurredAt = row.occurredAt === null || row.occurredAt === undefined ? null : isoDate(row.occurredAt);
  const publishedAt = isoDate(row.publishedAt);
  const sourceName = boundedString(row.sourceName, 240);
  const sourceUrl = httpsUrl(row.sourceUrl);
  if (!id || !slug || !title || (row.occurredAt !== null && row.occurredAt !== undefined && !occurredAt) || !publishedAt || !sourceName || !sourceUrl) return null;

  const tags = Array.isArray(row.tags)
    ? [...new Set(row.tags.map((tag) => boundedString(tag, 100)).filter((tag): tag is string => Boolean(tag)))].slice(0, 40)
    : [];
  const impacts = Array.isArray(row.gateImpacts) ? row.gateImpacts : [];
  const gateImpacts = impacts.flatMap((impact) => {
    if (!impact || typeof impact !== 'object' || Array.isArray(impact)) return [];
    const candidate = impact as Record<string, unknown>;
    const gateId = boundedString(candidate.gateId, 120);
    const score = candidate.score;
    return gateId && typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 10
      ? [{ gateId, score }]
      : [];
  }).slice(0, 40);
  const attribution = row.attributionReview && typeof row.attributionReview === 'object' && !Array.isArray(row.attributionReview)
    ? row.attributionReview as Record<string, unknown>
    : {};

  return {
    id,
    slug,
    title,
    occurredAt,
    publishedAt,
    dateBasis: occurredAt ? boundedString(row.dateBasis, 120) : 'provider-published-date-only',
    sourceName,
    sourceUrl,
    evidenceAttribution: boundedString(row.evidenceAttribution, 120),
    attributionReview: {
      status: validateReviewState(attribution.status),
    },
    tags,
    gateImpacts,
  };
}

async function readBoundedJson(response: Response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES) {
    throw new Error('provider_response_too_large');
  }
  if (!response.body) throw new Error('provider_response_empty');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > ROGUE_AI_TRACKER_MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('provider_response_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
}

function normalize(incident: ValidatedIncident, retrievedAt: string): NormalizedAgenticIncidentSignal {
  const providerUrl = new URL(`/incidents/${encodeURIComponent(incident.slug)}`, HOMEPAGE).toString();
  const selectedMetadata = {
    providerId: PROVIDER_ID,
    externalId: incident.id,
    slug: incident.slug,
    title: incident.title,
    occurredAt: incident.occurredAt,
    publishedAt: incident.publishedAt,
    dateBasis: incident.dateBasis,
    source: { name: incident.sourceName, url: incident.sourceUrl },
    providerUrl,
    tags: incident.tags,
    capabilityContext: incident.gateImpacts.map((impact) => ({
      providerCapabilityId: impact.gateId,
      score: impact.score,
    })),
    evidenceAttribution: incident.evidenceAttribution,
    externalProviderReview: { status: incident.attributionReview.status },
  };
  return {
    id: stableAgenticIncidentId(PROVIDER_ID, incident.id),
    schemaVersion: AGENTIC_INCIDENT_SCHEMA_VERSION,
    providerId: PROVIDER_ID,
    externalId: incident.id,
    title: incident.title,
    occurredAt: incident.occurredAt,
    publishedAt: incident.publishedAt,
    dateBasis: incident.dateBasis,
    source: { name: incident.sourceName, url: incident.sourceUrl },
    providerUrl,
    tags: incident.tags,
    capabilityContext: incident.gateImpacts.map((impact) => ({
      providerCapabilityId: impact.gateId,
      score: impact.score,
    })),
    evidenceAttribution: incident.evidenceAttribution,
    externalProviderReview: incident.attributionReview,
    localReview: {
      status: 'unreviewed',
      reviewedAt: null,
      note: 'External metadata has not been accepted as PolicyWatcher policy evidence.',
    },
    entityAssociations: [],
    provenance: {
      providerId: PROVIDER_ID,
      providerEndpoint: ENDPOINT,
      retrievedAt,
      mappingVersion: AGENTIC_INCIDENT_MAPPING_VERSION,
      digest: canonicalJsonDigest(selectedMetadata),
      metadataOnly: true,
    },
    boundaries: AGENTIC_INCIDENT_BOUNDARIES,
  };
}

function unavailableResult(retrievedAt: string, message: string): AgenticIncidentProviderResult {
  return {
    descriptor: { ...rogueAiTrackerProvider.descriptor, enabled: enabled() },
    retrieval: {
      state: enabled() ? 'unavailable' : 'disabled',
      retrievedAt,
      digest: null,
      acceptedRecords: null,
      rejectedRecords: null,
      rejectedReasonCounts: null,
      warningCounts: null,
      message,
    },
    signals: [],
  };
}

export async function retrieveRogueAiTracker(options: {
  fetchImpl?: FetchLike;
  now?: Date;
  bypassCache?: boolean;
} = {}): Promise<AgenticIncidentProviderResult> {
  const now = options.now || new Date();
  const retrievedAt = now.toISOString();
  if (!enabled()) return unavailableResult(retrievedAt, 'Provider adapter is disabled by configuration.');
  if (!options.bypassCache && cache && now.getTime() - cache.storedAt < ROGUE_AI_TRACKER_CACHE_MS) return cache.result;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROGUE_AI_TRACKER_TIMEOUT_MS);
  try {
    const response = await (options.fetchImpl || fetch)(ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'PolicyWatcher/agentic-incident-adapter' },
      redirect: 'error',
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const body = await readBoundedJson(response);
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray((body as { incidents?: unknown }).incidents)) {
      throw new Error('provider_schema_invalid');
    }
    const rows = (body as { incidents: unknown[] }).incidents;
    if (rows.length > MAX_INCIDENTS) throw new Error('provider_record_limit_exceeded');
    const unique = new Map<string, ValidatedIncident>();
    let rejectedRecords = 0;
    const rejectedReasonCounts: Record<string, number> = {};
    const warningCounts: Record<string, number> = {};
    for (const row of rows) {
      const valid = validateRogueAiTrackerIncident(row);
      if (!valid) {
        rejectedRecords += 1;
        rejectedReasonCounts.invalid_schema = (rejectedReasonCounts.invalid_schema || 0) + 1;
        continue;
      }
      if (unique.has(valid.id)) {
        rejectedRecords += 1;
        rejectedReasonCounts.duplicate_external_id = (rejectedReasonCounts.duplicate_external_id || 0) + 1;
        continue;
      }
      if (!valid.occurredAt) warningCounts.missing_occurred_at = (warningCounts.missing_occurred_at || 0) + 1;
      unique.set(valid.id, valid);
    }
    const signals = [...unique.values()].map((incident) => normalize(incident, retrievedAt));
    const result: AgenticIncidentProviderResult = {
      descriptor: { ...rogueAiTrackerProvider.descriptor, enabled: true },
      retrieval: {
        state: 'live',
        retrievedAt,
        digest: canonicalJsonDigest(signals.map((signal) => signal.provenance.digest)),
        acceptedRecords: signals.length,
        rejectedRecords,
        rejectedReasonCounts,
        warningCounts,
        message: rejectedRecords || Object.keys(warningCounts).length
          ? 'Provider metadata retrieved; exclusions and non-blocking normalization warnings are reported as aggregate counts.'
          : 'Provider metadata retrieved and normalized.',
      },
      signals,
    };
    cache = { storedAt: now.getTime(), result };
    return result;
  } catch (error) {
    if (cache && now.getTime() - cache.storedAt <= ROGUE_AI_TRACKER_MAX_STALE_MS) {
      return {
        ...cache.result,
        retrieval: {
          ...cache.result.retrieval,
          state: 'stale-cache',
          message: 'Live provider retrieval failed; returning the last validated in-memory snapshot. Freshness must be reviewed.',
        },
      };
    }
    if (cache) cache = null;
    const rawCode = error instanceof Error ? error.message : '';
    const code = /^provider_[a-z0-9_]+$/.test(rawCode)
      ? rawCode
      : error instanceof DOMException && error.name === 'AbortError'
        ? 'provider_timeout'
        : 'provider_retrieval_failed';
    return unavailableResult(retrievedAt, `Provider metadata unavailable (${code}). This does not mean that no incidents exist.`);
  } finally {
    clearTimeout(timer);
  }
}

export function resetRogueAiTrackerCacheForTests() {
  cache = null;
}

export const rogueAiTrackerProvider: ExternalIncidentProvider = {
  descriptor: {
    id: PROVIDER_ID,
    name: 'Rogue AI Tracker',
    homepage: HOMEPAGE,
    endpoint: ENDPOINT,
    contractVersion: 'adapter-1.0.0',
    enabled: enabled(),
    dataPolicy: 'metadata-only',
    evidenceRole: 'external-research-context',
    trustBoundary:
      'Optional third-party metadata adapter. PolicyWatcher remains authoritative for its own evidence gates, entity review and public policy-change records.',
  },
  retrieve: () => retrieveRogueAiTracker(),
};
