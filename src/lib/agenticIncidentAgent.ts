import { AGENTIC_INCIDENT_BOUNDARIES } from './agenticIncidents';
import {
  AGENTIC_INCIDENT_MAX_LIMIT,
  getAgenticIncidentObservatory,
  parseAgenticIncidentQuery,
  type AgenticIncidentObservatoryPayload,
  type AgenticIncidentQuery,
} from './agenticIncidentService';
import { POLICYWATCHER_VERSION } from './release';

export const AGENTIC_INCIDENT_AGENT_SCHEMA_VERSION = '2026-08-26' as const;

export function parseAgenticIncidentBriefQuery(searchParams: URLSearchParams) {
  const translated = new URLSearchParams(searchParams);
  translated.set('vendorResponses', 'candidate');
  return parseAgenticIncidentQuery(translated);
}

type VendorResponseMonitor = AgenticIncidentObservatoryPayload['vendorResponseMonitor'];

export function formatAgenticVendorResponseCoverage(monitor: VendorResponseMonitor) {
  return `Vendor response coverage: queried ${monitor.queriedCompanies}/${monitor.companyCandidates}; truncated ${monitor.truncatedCompanies}.`;
}

export function formatAgenticVendorResponses(signalId: string, monitor: VendorResponseMonitor) {
  const timelines = monitor.timelines.filter((candidate) => candidate.incidentId === signalId);
  if (!timelines.length) return 'none available; do not infer no response';
  return timelines.map((timeline) => {
    const changes = timeline.possibleChanges.length
      ? timeline.possibleChanges
        .map((change) => `${change.observedAt}: ${change.policy.name} (${change.evidence.policyWatcherUrl})`)
        .join('; ')
      : 'no evidence-gated change in the bounded window; do not infer no response';
    return `${timeline.company.companyName} (${timeline.company.localReview.status} association): ${changes}`;
  }).join(' | ');
}

export function formatAgenticIncidentBrief(
  payload: AgenticIncidentObservatoryPayload,
  query: AgenticIncidentQuery,
) {
  const coverage = formatAgenticVendorResponseCoverage(payload.vendorResponseMonitor);
  const entries = payload.signals.map((signal, index) => {
    const associations = signal.entityAssociations.length
      ? signal.entityAssociations.map((association) => `${association.companyName} (${association.localReview.status})`).join(', ')
      : 'none';
    const capabilities = signal.capabilityContext.length
      ? signal.capabilityContext.map((capability) => `${capability.providerCapabilityId}=${capability.score}/10 external`).join(', ')
      : 'none reported';
    const changes = formatAgenticVendorResponses(signal.id, payload.vendorResponseMonitor);
    return [
      `${index + 1}. ${signal.title}`,
      `Occurred: ${signal.occurredAt || 'not established by provider'}; published: ${signal.publishedAt}; source: ${signal.source.name}.`,
      `Provider capabilities: ${capabilities}. These scores are not PolicyWatcher policy-risk scores.`,
      `Candidate company associations: ${associations}. Candidate associations require human review.`,
      `Possible later public changes: ${changes}. Temporal association only, not causation.`,
      coverage,
      `Provider record: ${signal.providerUrl}`,
      `Primary source: ${signal.source.url}`,
    ].join('\n');
  });
  const citations = payload.signals.flatMap((signal) => [signal.providerUrl, signal.source.url]);
  for (const timeline of payload.vendorResponseMonitor.timelines) {
    for (const change of timeline.possibleChanges) citations.push(change.evidence.policyWatcherUrl, change.evidence.sourceUrl);
  }
  return {
    schemaVersion: AGENTIC_INCIDENT_AGENT_SCHEMA_VERSION,
    release: POLICYWATCHER_VERSION,
    generatedAt: payload.generatedAt,
    providerState: payload.provider.retrieval.state,
    resultCount: payload.count,
    answerContext: entries.length
      ? entries.join('\n\n')
      : `No normalized records are available for this request. Provider state: ${payload.provider.retrieval.state}. Do not infer that no incidents exist. ${coverage}`,
    citations: [...new Set(citations)].join('\n'),
    filterSummary: `provider=${query.providerId}; companySlug=${query.companySlug || 'any'}; capability=${query.capability || 'any'}; limit=${query.limit}`,
    coverage,
    provenance: `retrievedAt=${payload.provenance.retrievedAt}; mappingVersion=${payload.provenance.mappingVersion}; digest=${payload.provenance.digest}`,
    boundary: AGENTIC_INCIDENT_BOUNDARIES.statement,
  };
}

export async function getAgenticIncidentBrief(searchParams: URLSearchParams) {
  const query = parseAgenticIncidentBriefQuery(searchParams);
  if (!query.ok) return query;
  const payload = await getAgenticIncidentObservatory(query.value);
  return {
    ok: true as const,
    value: formatAgenticIncidentBrief(payload, query.value),
  };
}

export function agenticIncidentOpenApiPath() {
  const parameters = [
    { name: 'provider', in: 'query', required: false, description: 'Optional external metadata provider. Currently rogue-ai-tracker.', schema: { type: 'string', enum: ['rogue-ai-tracker'], default: 'rogue-ai-tracker' } },
    { name: 'companySlug', in: 'query', required: false, description: 'Optional canonical public PolicyWatcher company slug; only unreviewed exact-name candidates are returned.', schema: { type: 'string', maxLength: 80 } },
    { name: 'capability', in: 'query', required: false, description: 'Optional provider-native capability identifier. External scores are not PolicyWatcher risk scores.', schema: { type: 'string', maxLength: 120 } },
    { name: 'limit', in: 'query', required: false, description: 'Maximum number of normalized incident records.', schema: { type: 'integer', minimum: 1, maximum: AGENTIC_INCIDENT_MAX_LIMIT, default: 20 } },
  ];
  return {
    get: {
      operationId: 'getAgenticIncidentBrief',
      summary: 'Get normalized external agentic incident context and possible later public vendor changes',
      description: 'Provider-neutral, metadata-only research context with explicit review, provenance and temporal-association boundaries.',
      'x-amzn-operation-type': 'read',
      parameters,
      responses: {
        '200': {
          description: 'Flattened agentic incident brief',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['schemaVersion', 'release', 'generatedAt', 'providerState', 'resultCount', 'answerContext', 'citations', 'filterSummary', 'coverage', 'provenance', 'boundary'],
                properties: {
                  schemaVersion: { type: 'string' },
                  release: { type: 'string' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  providerState: { type: 'string' },
                  resultCount: { type: 'integer', nullable: true },
                  answerContext: { type: 'string' },
                  citations: { type: 'string' },
                  filterSummary: { type: 'string' },
                  coverage: { type: 'string' },
                  provenance: { type: 'string' },
                  boundary: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  } as const;
}
