import { createHash } from 'node:crypto';

export const AGENTIC_INCIDENT_SCHEMA_VERSION = '1.0.0' as const;
export const AGENTIC_INCIDENT_MAPPING_VERSION = '2026-08-26' as const;
export const AGENTIC_INCIDENT_BOUNDARIES = Object.freeze({
  temporalAssociationNotCausation: true,
  externalScoreNotPolicyRisk: true,
  providerUnavailableNotNoIncidents: true,
  statement:
    'External incident metadata is research context. A nearby PolicyWatcher change is a temporal association, not evidence that the incident caused the change. Provider capability scores are not PolicyWatcher policy-risk scores. Provider unavailability never means that no incidents exist.',
});

export type ExternalIncidentProviderId = 'rogue-ai-tracker';
export type ProviderRetrievalState = 'live' | 'stale-cache' | 'unavailable' | 'disabled';
export type ExternalReviewState = 'accepted' | 'proposed' | 'rejected' | 'unknown';
export type LocalReviewState = 'unreviewed' | 'accepted' | 'rejected';

export interface ExternalIncidentProviderDescriptor {
  id: ExternalIncidentProviderId;
  name: string;
  homepage: string;
  endpoint: string;
  contractVersion: string;
  enabled: boolean;
  dataPolicy: 'metadata-only';
  evidenceRole: 'external-research-context';
  trustBoundary: string;
}

export interface ProviderCapabilityContext {
  providerCapabilityId: string;
  score: number;
}

export interface AgenticEntityAssociation {
  companyId: string;
  companySlug: string;
  companyName: string;
  matchBasis: 'canonical-company-name-exact-phrase';
  mappingVersion: typeof AGENTIC_INCIDENT_MAPPING_VERSION;
  localReview: {
    status: LocalReviewState;
    reviewedAt: string | null;
    note: string;
  };
}

export interface NormalizedAgenticIncidentSignal {
  id: string;
  schemaVersion: typeof AGENTIC_INCIDENT_SCHEMA_VERSION;
  providerId: ExternalIncidentProviderId;
  externalId: string;
  title: string;
  occurredAt: string | null;
  publishedAt: string;
  dateBasis: string | null;
  source: { name: string; url: string };
  providerUrl: string;
  tags: string[];
  capabilityContext: ProviderCapabilityContext[];
  evidenceAttribution: string | null;
  externalProviderReview: {
    status: ExternalReviewState;
  };
  localReview: {
    status: LocalReviewState;
    reviewedAt: string | null;
    note: string;
  };
  entityAssociations: AgenticEntityAssociation[];
  provenance: {
    providerId: ExternalIncidentProviderId;
    providerEndpoint: string;
    retrievedAt: string;
    mappingVersion: typeof AGENTIC_INCIDENT_MAPPING_VERSION;
    digest: string;
    metadataOnly: true;
  };
  boundaries: typeof AGENTIC_INCIDENT_BOUNDARIES;
}

export interface AgenticIncidentProviderResult {
  descriptor: ExternalIncidentProviderDescriptor;
  retrieval: {
    state: ProviderRetrievalState;
    retrievedAt: string;
    digest: string | null;
    acceptedRecords: number | null;
    rejectedRecords: number | null;
    rejectedReasonCounts: Readonly<Record<string, number>> | null;
    warningCounts: Readonly<Record<string, number>> | null;
    message: string;
  };
  signals: NormalizedAgenticIncidentSignal[];
}

export interface ExternalIncidentProvider {
  descriptor: ExternalIncidentProviderDescriptor;
  retrieve(): Promise<AgenticIncidentProviderResult>;
}

export function stableAgenticIncidentId(providerId: ExternalIncidentProviderId, externalId: string) {
  return `pwai_${createHash('sha256').update(`${providerId}:${externalId}`).digest('hex').slice(0, 24)}`;
}

export function canonicalJsonDigest(value: unknown) {
  const canonicalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonicalize);
    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, canonicalize(entry)]),
      );
    }
    return input;
  };
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function buildAgenticIncidentSchema() {
  const localReview = {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'reviewedAt', 'note'],
    properties: {
      status: { type: 'string', enum: ['unreviewed', 'accepted', 'rejected'] },
      reviewedAt: { type: ['string', 'null'], format: 'date-time' },
      note: { type: 'string', maxLength: 1_000 },
    },
  } as const;
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/agentic-incident-signal/v1',
    title: 'PolicyWatcher normalized agentic incident signal',
    type: 'object',
    additionalProperties: false,
    required: [
      'id', 'schemaVersion', 'providerId', 'externalId', 'title', 'occurredAt', 'publishedAt',
      'dateBasis', 'source', 'providerUrl', 'tags', 'capabilityContext', 'evidenceAttribution', 'externalProviderReview',
      'localReview', 'entityAssociations', 'provenance', 'boundaries',
    ],
    properties: {
      id: { type: 'string', pattern: '^pwai_[0-9a-f]{24}$' },
      schemaVersion: { const: AGENTIC_INCIDENT_SCHEMA_VERSION },
      providerId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 80 },
      externalId: { type: 'string', minLength: 1, maxLength: 240 },
      title: { type: 'string', minLength: 1, maxLength: 500 },
      occurredAt: { type: ['string', 'null'], format: 'date-time' },
      publishedAt: { type: 'string', format: 'date-time' },
      dateBasis: { type: ['string', 'null'], maxLength: 120 },
      source: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'url'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 240 },
          url: { type: 'string', format: 'uri', pattern: '^https://' },
        },
      },
      providerUrl: { type: 'string', format: 'uri', pattern: '^https://' },
      tags: { type: 'array', maxItems: 40, uniqueItems: true, items: { type: 'string', minLength: 1, maxLength: 100 } },
      capabilityContext: {
        type: 'array',
        maxItems: 40,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['providerCapabilityId', 'score'],
          properties: {
            providerCapabilityId: { type: 'string', minLength: 1, maxLength: 120 },
            score: { type: 'integer', minimum: 0, maximum: 10 },
          },
        },
      },
      evidenceAttribution: { type: ['string', 'null'], maxLength: 120 },
      externalProviderReview: {
        type: 'object',
        additionalProperties: false,
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['accepted', 'proposed', 'rejected', 'unknown'] },
        },
      },
      localReview,
      entityAssociations: {
        type: 'array',
        maxItems: 50,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['companyId', 'companySlug', 'companyName', 'matchBasis', 'mappingVersion', 'localReview'],
          properties: {
            companyId: { type: 'string', minLength: 1, maxLength: 240 },
            companySlug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 80 },
            companyName: { type: 'string', minLength: 1, maxLength: 240 },
            matchBasis: { const: 'canonical-company-name-exact-phrase' },
            mappingVersion: { const: AGENTIC_INCIDENT_MAPPING_VERSION },
            localReview,
          },
        },
      },
      provenance: {
        type: 'object',
        additionalProperties: false,
        required: ['providerId', 'providerEndpoint', 'retrievedAt', 'mappingVersion', 'digest', 'metadataOnly'],
        properties: {
          providerId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 80 },
          providerEndpoint: { type: 'string', format: 'uri', pattern: '^https://' },
          retrievedAt: { type: 'string', format: 'date-time' },
          mappingVersion: { const: AGENTIC_INCIDENT_MAPPING_VERSION },
          digest: { type: 'string', pattern: '^[0-9a-f]{64}$' },
          metadataOnly: { const: true },
        },
      },
      boundaries: {
        type: 'object',
        additionalProperties: false,
        required: ['temporalAssociationNotCausation', 'externalScoreNotPolicyRisk', 'providerUnavailableNotNoIncidents', 'statement'],
        properties: {
          temporalAssociationNotCausation: { const: true },
          externalScoreNotPolicyRisk: { const: true },
          providerUnavailableNotNoIncidents: { const: true },
          statement: { const: AGENTIC_INCIDENT_BOUNDARIES.statement },
        },
      },
    },
  } as const;
}
