import { listEnterpriseChanges, ENTERPRISE_RISKS } from './enterpriseApiData';
import { getPublicObservatoryPayload, type PublicApiLocale } from './publicApi';
import { POLICYWATCHER_VERSION } from './release';

export const AGENT_GATEWAY_SCHEMA_VERSION = '2026-08-01' as const;
export const AGENT_GATEWAY_MAX_RESULTS = 5;
export const AGENT_GATEWAY_BOUNDARY =
  'Public evidence only. Results are source-linked research context, not legal advice, a compliance decision, or a contract approval.';

export interface AgentBriefQuery {
  companySlug?: string;
  region?: string;
  risk?: (typeof ENTERPRISE_RISKS)[number];
  topic?: string;
  lang: PublicApiLocale;
  limit: number;
}

export type AgentQueryResult =
  | { ok: true; value: AgentBriefQuery }
  | { ok: false; error: string };

function boundedValue(value: string | null, name: string, maxLength: number, pattern?: RegExp) {
  if (value === null || value.trim() === '') return { ok: true as const, value: undefined };
  const trimmed = value.trim();
  if (trimmed.length > maxLength || (pattern && !pattern.test(trimmed))) {
    return { ok: false as const, error: `Invalid ${name} parameter.` };
  }
  return { ok: true as const, value: trimmed };
}

export function parseAgentBriefQuery(searchParams: URLSearchParams): AgentQueryResult {
  const allowed = new Set(['companySlug', 'region', 'risk', 'topic', 'lang', 'limit']);
  if ([...searchParams.keys()].some((key) => !allowed.has(key))) {
    return { ok: false, error: 'Unsupported query parameter.' };
  }

  const companySlug = boundedValue(searchParams.get('companySlug'), 'companySlug', 80, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  if (!companySlug.ok) return companySlug;
  const region = boundedValue(searchParams.get('region'), 'region', 80, /^[\p{L}\p{N} .,'()&/-]+$/u);
  if (!region.ok) return region;
  const topic = boundedValue(searchParams.get('topic'), 'topic', 160, /^[\p{L}\p{N} .,'()&/+-]+$/u);
  if (!topic.ok) return topic;

  const riskRaw = searchParams.get('risk');
  const risk = riskRaw && ENTERPRISE_RISKS.includes(riskRaw as (typeof ENTERPRISE_RISKS)[number])
    ? riskRaw as (typeof ENTERPRISE_RISKS)[number]
    : undefined;
  if (riskRaw && !risk) return { ok: false, error: 'Invalid risk parameter. Use Low, Medium, or High.' };

  const langRaw = searchParams.get('lang') || 'en';
  if (langRaw !== 'en' && langRaw !== 'it') return { ok: false, error: 'Invalid lang parameter. Use en or it.' };

  const limitRaw = searchParams.get('limit');
  const limit = limitRaw === null ? 3 : Number(limitRaw);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > AGENT_GATEWAY_MAX_RESULTS) {
    return { ok: false, error: `Invalid limit parameter. Use an integer from 1 to ${AGENT_GATEWAY_MAX_RESULTS}.` };
  }

  return {
    ok: true,
    value: {
      companySlug: companySlug.value,
      region: region.value,
      risk,
      topic: topic.value,
      lang: langRaw,
      limit,
    },
  };
}

function topicTokens(topic?: string) {
  return (topic || '')
    .toLocaleLowerCase('en')
    .split(/[\s,;|/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 8);
}

function includesTopic(haystack: string, topic?: string) {
  const tokens = topicTokens(topic);
  if (!tokens.length) return true;
  const normalized = haystack.toLocaleLowerCase('en');
  return tokens.some((token) => normalized.includes(token));
}

function asText(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function flattenText(value: unknown): string {
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(flattenText).join(' ');
  return asText(value);
}

export function getAgentCapabilities() {
  return {
    schemaVersion: AGENT_GATEWAY_SCHEMA_VERSION,
    release: POLICYWATCHER_VERSION,
    generatedAt: new Date().toISOString(),
    access: 'anonymous read-only public evidence',
    operations: 'getCapabilities; getChangeBrief; getObservatoryBrief',
    compatibleTargets: 'Microsoft 365 Copilot declarative agents; Vertex AI Agent Builder tools; Amazon Quick OpenAPI connectors; existing Amazon Q Business custom plugins',
    privateAccess: 'Tenant-specific enterprise access remains available through the Entra-authenticated Enterprise API v2.',
    citations: 'Every brief returns canonical PolicyWatcher and/or original source URLs as newline-delimited text.',
    boundary: AGENT_GATEWAY_BOUNDARY,
  };
}

export async function getAgentChangeBrief(query: AgentBriefQuery) {
  const payload = await listEnterpriseChanges({
    page: 1,
    pageSize: 100,
    companySlug: query.companySlug,
    region: query.region,
    risk: query.risk,
  });

  const matches = payload.data.filter((change) => includesTopic(flattenText(change), query.topic)).slice(0, query.limit);
  const entries = matches.map((change, index) => {
    const localizedSummary = query.lang === 'it'
      ? change.tldrIt || change.aiSummaryIt
      : change.tldrEn || change.aiSummaryEn;
    const observedAt = change.evidence.observedAt instanceof Date
      ? change.evidence.observedAt.toISOString()
      : String(change.evidence.observedAt);
    return [
      `${index + 1}. ${change.policy.company.name}: ${change.policy.name}`,
      `Risk: ${change.overallRisk || 'not available'}; observed: ${observedAt}.`,
      localizedSummary || 'No public summary is available for this record.',
      `Evidence: https://policywatcher.online/change/${encodeURIComponent(change.id)}`,
      `Source: ${change.evidence.sourceUrl}`,
    ].join('\n');
  });

  const citations = matches.flatMap((change) => [
    `https://policywatcher.online/change/${encodeURIComponent(change.id)}`,
    change.evidence.sourceUrl,
  ]);

  return {
    schemaVersion: AGENT_GATEWAY_SCHEMA_VERSION,
    release: POLICYWATCHER_VERSION,
    generatedAt: new Date().toISOString(),
    resultCount: matches.length,
    answerContext: entries.length
      ? entries.join('\n\n')
      : 'No public evidence matched the requested filters. Do not infer that no policy change exists.',
    citations: citations.join('\n'),
    filterSummary: `companySlug=${query.companySlug || 'any'}; region=${query.region || 'any'}; risk=${query.risk || 'any'}; topic=${query.topic || 'any'}; lang=${query.lang}; limit=${query.limit}`,
    boundary: AGENT_GATEWAY_BOUNDARY,
  };
}

export function getAgentObservatoryBrief(query: AgentBriefQuery) {
  const payload = getPublicObservatoryPayload(query.lang);
  const normalizedRegion = query.region?.toLocaleLowerCase('en');
  const matches = payload.signals
    .filter((signal) => !normalizedRegion || signal.region.toLocaleLowerCase('en').includes(normalizedRegion))
    .filter((signal) => includesTopic(`${signal.title} ${signal.summary} ${signal.contentType}`, query.topic))
    .slice(0, query.limit);

  const entries = matches.map((signal, index) => [
    `${index + 1}. ${signal.title}`,
    `Region: ${signal.region}; published: ${signal.publishedOn}; registry review: ${signal.reviewUtc}.`,
    signal.summary,
    `Source: ${signal.sourceUrl}`,
    `PolicyWatcher context: https://policywatcher.online${signal.localHref}`,
  ].join('\n'));

  return {
    schemaVersion: AGENT_GATEWAY_SCHEMA_VERSION,
    release: POLICYWATCHER_VERSION,
    generatedAt: new Date().toISOString(),
    registryVerifiedAt: payload.registry.verifiedAt,
    resultCount: matches.length,
    answerContext: entries.length
      ? entries.join('\n\n')
      : 'No curated Observatory signal matched the requested filters. Do not infer that no external development exists.',
    citations: matches.map((signal) => signal.sourceUrl).join('\n'),
    filterSummary: `region=${query.region || 'any'}; topic=${query.topic || 'any'}; lang=${query.lang}; limit=${query.limit}`,
    boundary: `${AGENT_GATEWAY_BOUNDARY} Observatory signals are manually curated references and are not automatically ingested as policy evidence.`,
  };
}

export function getAgentGatewayOpenApi() {
  const responseSchema = (properties: Record<string, unknown>, required: string[]) => ({
    type: 'object',
    additionalProperties: false,
    required,
    properties,
  });
  const string = { type: 'string' };
  const integer = { type: 'integer', format: 'int32' };
  const commonParameters = [
    { name: 'region', in: 'query', required: false, description: 'Optional public evidence region or jurisdiction filter.', schema: { type: 'string', maxLength: 80 } },
    { name: 'topic', in: 'query', required: false, description: 'Optional bounded policy or governance topic filter.', schema: { type: 'string', maxLength: 160 } },
    { name: 'lang', in: 'query', required: false, description: 'Language for returned public summaries.', schema: { type: 'string', enum: ['en', 'it'], default: 'en' } },
    { name: 'limit', in: 'query', required: false, description: 'Maximum number of public records to include, from one to five.', schema: { type: 'integer', minimum: 1, maximum: 5, default: 3 } },
  ];
  const briefResponse = responseSchema({
    schemaVersion: string,
    release: string,
    generatedAt: { type: 'string', format: 'date-time' },
    resultCount: integer,
    answerContext: string,
    citations: string,
    filterSummary: string,
    boundary: string,
  }, ['schemaVersion', 'release', 'generatedAt', 'resultCount', 'answerContext', 'citations', 'filterSummary', 'boundary']);

  return {
    openapi: '3.0.0',
    info: {
      title: 'PolicyWatcher Agent Evidence Gateway',
      version: AGENT_GATEWAY_SCHEMA_VERSION,
      description: 'Read-only, deterministic access to already-public PolicyWatcher evidence. Responses include source links and explicit limitations.',
    },
    servers: [{ url: 'https://policywatcher.online' }],
    paths: {
      '/api/v1/agent/capabilities': {
        get: {
          operationId: 'getCapabilities',
          summary: 'Describe the public agent evidence contract and its limits',
          description: 'Returns supported operations, compatibility targets, citation behavior and public evidence boundaries.',
          'x-amzn-operation-type': 'read',
          responses: {
            '200': {
              description: 'Gateway capabilities',
              content: { 'application/json': { schema: responseSchema({
                schemaVersion: string,
                release: string,
                generatedAt: { type: 'string', format: 'date-time' },
                access: string,
                operations: string,
                compatibleTargets: string,
                privateAccess: string,
                citations: string,
                boundary: string,
              }, ['schemaVersion', 'release', 'generatedAt', 'access', 'operations', 'compatibleTargets', 'privateAccess', 'citations', 'boundary']) } },
            },
          },
        },
      },
      '/api/v1/agent/change-brief': {
        get: {
          operationId: 'getChangeBrief',
          summary: 'Find source-linked public policy-change evidence',
          description: 'Returns a deterministic flattened brief over already-published PolicyWatcher change evidence.',
          'x-amzn-operation-type': 'read',
          parameters: [
            { name: 'companySlug', in: 'query', required: false, description: 'Optional canonical PolicyWatcher company slug.', schema: { type: 'string', maxLength: 80 } },
            ...commonParameters,
            { name: 'risk', in: 'query', required: false, description: 'Optional public analytical risk label filter.', schema: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
          ],
          responses: { '200': { description: 'Deterministic public evidence brief', content: { 'application/json': { schema: briefResponse } } } },
        },
      },
      '/api/v1/agent/observatory-brief': {
        get: {
          operationId: 'getObservatoryBrief',
          summary: 'Find source-linked signals in the curated public Observatory registry',
          description: 'Returns a deterministic flattened brief over manually curated public Observatory signals.',
          'x-amzn-operation-type': 'read',
          parameters: commonParameters,
          responses: { '200': { description: 'Deterministic Observatory brief', content: { 'application/json': { schema: {
            ...briefResponse,
            properties: { ...briefResponse.properties, registryVerifiedAt: string },
            required: [...briefResponse.required, 'registryVerifiedAt'],
          } } } } },
        },
      },
    },
  };
}
