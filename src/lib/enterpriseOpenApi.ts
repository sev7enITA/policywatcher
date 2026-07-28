import { ENTERPRISE_API_MAX_PAGE_SIZE } from './enterpriseApi';
import { ENTERPRISE_READ_SCOPE } from './enterpriseApiAuth';
import { POLICYWATCHER_VERSION } from './release';

function normalizedServerUrl(environment: NodeJS.ProcessEnv): string {
  const value = environment.POLICYWATCHER_ENTERPRISE_API_URL?.trim()
    || environment.APP_URL?.trim()
    || 'https://policywatcher.online';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      return 'https://policywatcher.online';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'https://policywatcher.online';
  }
}

function enterpriseScopeUri(environment: NodeJS.ProcessEnv): string {
  const audience = environment.POLICYWATCHER_ENTRA_AUDIENCES?.split(',')[0]?.trim();
  if (!audience) return `api://policywatcher-enterprise/${ENTERPRISE_READ_SCOPE}`;
  if (audience.startsWith('api://') || audience.startsWith('https://')) {
    return `${audience.replace(/\/$/, '')}/${ENTERPRISE_READ_SCOPE}`;
  }
  return `api://${audience}/${ENTERPRISE_READ_SCOPE}`;
}

const paginationParameters = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
    description: 'One-based result page.',
  },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: ENTERPRISE_API_MAX_PAGE_SIZE, default: 25 },
    description: 'Results per page.',
  },
];

const standardResponses = {
  '400': { $ref: '#/components/responses/BadRequest' },
  '401': { $ref: '#/components/responses/Unauthorized' },
  '403': { $ref: '#/components/responses/Forbidden' },
  '500': { $ref: '#/components/responses/InternalError' },
  '503': { $ref: '#/components/responses/ServiceUnavailable' },
};

function successResponse(description: string, schemaName: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

export function getEnterpriseOpenApiDocument(environment: NodeJS.ProcessEnv = process.env) {
  const scopeUri = enterpriseScopeUri(environment);
  const defaultScopeUri = `${scopeUri.slice(0, -ENTERPRISE_READ_SCOPE.length)}.default`;

  return {
    openapi: '3.0.3',
    info: {
      title: 'PolicyWatcher Enterprise API',
      version: '2.0.0',
      description:
        'Tenant-authenticated, read-only access to evidence-gated PolicyWatcher records and curated governance signals.',
      contact: { url: 'https://policywatcher.online/contact' },
      'x-policywatcher-release': POLICYWATCHER_VERSION,
    },
    servers: [{ url: normalizedServerUrl(environment), description: 'PolicyWatcher API origin' }],
    security: [{ entraOAuth: [scopeUri] }],
    tags: [
      { name: 'Directory', description: 'API capabilities and boundaries.' },
      { name: 'Companies', description: 'Evidence-gated monitored companies and sources.' },
      { name: 'Changes', description: 'Published policy-change evidence.' },
      { name: 'Sources', description: 'Sanitized source continuity.' },
      { name: 'Observatory', description: 'Curated governance and regulatory references.' },
    ],
    paths: {
      '/api/v2/manifest': {
        get: {
          operationId: 'GetEnterpriseManifest',
          summary: 'Get the enterprise integration directory',
          tags: ['Directory'],
          responses: {
            '200': successResponse('Enterprise API capabilities and data boundaries.', 'ManifestResponse'),
            ...standardResponses,
          },
        },
      },
      '/api/v2/companies': {
        get: {
          operationId: 'ListCompanies',
          summary: 'List monitored companies',
          tags: ['Companies'],
          parameters: [
            ...paginationParameters,
            { name: 'industry', in: 'query', schema: { type: 'string', maxLength: 80 } },
            {
              name: 'q',
              in: 'query',
              schema: { type: 'string', minLength: 2, maxLength: 100 },
              description: 'Case-insensitive company-name fragment.',
            },
          ],
          responses: {
            '200': successResponse('A paginated list of companies and evidence-gated policy sources.', 'CompanyListResponse'),
            ...standardResponses,
          },
        },
      },
      '/api/v2/changes': {
        get: {
          operationId: 'ListPolicyChanges',
          summary: 'List published policy changes',
          tags: ['Changes'],
          parameters: [
            ...paginationParameters,
            { name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
            {
              name: 'companySlug',
              in: 'query',
              schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
            },
            { name: 'region', in: 'query', schema: { type: 'string', maxLength: 50 } },
            { name: 'risk', in: 'query', schema: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
            { name: 'since', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'until', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': successResponse('A paginated list of published, evidence-gated changes.', 'ChangeListResponse'),
            ...standardResponses,
          },
        },
      },
      '/api/v2/changes/{changeId}': {
        get: {
          operationId: 'GetPolicyChange',
          summary: 'Get one published policy change',
          tags: ['Changes'],
          parameters: [
            { name: 'changeId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': successResponse('Structured evidence and reviewed analysis for the change.', 'ChangeDetailResponse'),
            '404': { $ref: '#/components/responses/NotFound' },
            ...standardResponses,
          },
        },
      },
      '/api/v2/sources/{sourceId}/continuity': {
        get: {
          operationId: 'GetSourceContinuity',
          summary: 'Get sanitized continuity for one policy source',
          tags: ['Sources'],
          parameters: [
            { name: 'sourceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': successResponse('Sanitized retrieval-state transitions without raw diagnostics.', 'ContinuityResponse'),
            '404': { $ref: '#/components/responses/NotFound' },
            ...standardResponses,
          },
        },
      },
      '/api/v2/observatory/signals': {
        get: {
          operationId: 'ListObservatorySignals',
          summary: 'List curated governance signals',
          tags: ['Observatory'],
          parameters: [
            { name: 'lang', in: 'query', schema: { type: 'string', enum: ['en', 'it'], default: 'en' } },
            { name: 'region', in: 'query', schema: { type: 'string', maxLength: 50 } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['high', 'medium', 'watch'] } },
          ],
          responses: {
            '200': successResponse('Curated signals with authority and source links.', 'ObservatorySignalListResponse'),
            ...standardResponses,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        entraOAuth: {
          type: 'oauth2',
          description: 'Microsoft Entra ID OAuth 2.0. Use a delegated scope or an assigned application role.',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
              tokenUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
              scopes: { [scopeUri]: 'Read PolicyWatcher evidence-gated enterprise data.' },
            },
            clientCredentials: {
              tokenUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
              scopes: {
                [defaultScopeUri]: 'Request the application roles assigned to the client service principal.',
              },
            },
          },
        },
      },
      schemas: {
        ResponseMeta: {
          type: 'object',
          required: ['generatedAt', 'tenantId', 'requestId'],
          properties: {
            generatedAt: { type: 'string', format: 'date-time' },
            tenantId: { type: 'string', format: 'uuid' },
            requestId: { type: 'string' },
            page: { type: 'integer', minimum: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: ENTERPRISE_API_MAX_PAGE_SIZE },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 1 },
          },
          additionalProperties: true,
        },
        CompanyReference: {
          type: 'object',
          required: ['id', 'name', 'slug', 'industry'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            industry: { type: 'string' },
            website: { type: 'string', format: 'uri' },
          },
        },
        PolicySource: {
          type: 'object',
          required: ['id', 'name', 'type', 'jurisdiction', 'url', 'dataStatus'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string' },
            jurisdiction: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            dataStatus: { type: 'string' },
            lastCheckDate: { type: 'string', format: 'date-time' },
            lastSuccessfulCheckDate: { type: 'string', format: 'date-time' },
            changes: {
              type: 'array',
              maxItems: 1,
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  createdAt: { type: 'string', format: 'date-time' },
                  overallRisk: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                  overallScore: { type: 'integer', minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        Company: {
          allOf: [
            { $ref: '#/components/schemas/CompanyReference' },
            {
              type: 'object',
              required: ['policies'],
              properties: {
                policies: { type: 'array', items: { $ref: '#/components/schemas/PolicySource' } },
              },
            },
          ],
        },
        RegionImpact: {
          type: 'object',
          required: ['region', 'perspective', 'riskLevel'],
          properties: {
            region: { type: 'string' },
            perspective: { type: 'string', enum: ['Individual', 'Enterprise'] },
            riskLevel: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            impactAnalysisEn: { type: 'string' },
            impactAnalysisIt: { type: 'string' },
            complianceNoteEn: { type: 'string', nullable: true },
            complianceNoteIt: { type: 'string', nullable: true },
          },
        },
        EvidenceReference: {
          type: 'object',
          required: ['publicEvidence', 'snapshotVersion', 'observedAt', 'sourceUrl'],
          properties: {
            publicEvidence: { type: 'boolean', enum: [true] },
            snapshotVersion: { type: 'integer', minimum: 1 },
            observedAt: { type: 'string', format: 'date-time' },
            sourceUrl: { type: 'string', format: 'uri' },
          },
        },
        PolicyChange: {
          type: 'object',
          required: ['id', 'createdAt', 'overallRisk', 'overallScore', 'policy', 'regionImpacts', 'evidence'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            overallRisk: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            overallScore: { type: 'integer', minimum: 1, maximum: 10 },
            tldrEn: { type: 'string', nullable: true },
            tldrIt: { type: 'string', nullable: true },
            aiSummaryEn: { type: 'string' },
            aiSummaryIt: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'object', additionalProperties: true } },
            riskReasons: { type: 'array', items: { type: 'object', additionalProperties: true } },
            remediations: { type: 'array', items: { type: 'object', additionalProperties: true } },
            policy: {
              type: 'object',
              required: ['id', 'name', 'type', 'jurisdiction', 'url', 'company'],
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                type: { type: 'string' },
                jurisdiction: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                company: { $ref: '#/components/schemas/CompanyReference' },
              },
            },
            regionImpacts: { type: 'array', items: { $ref: '#/components/schemas/RegionImpact' } },
            evidence: { $ref: '#/components/schemas/EvidenceReference' },
            excludedFields: { type: 'array', items: { type: 'string' } },
          },
        },
        ContinuityEvent: {
          type: 'object',
          required: ['id', 'checkedAt', 'state', 'cause', 'retrievalChannel', 'company', 'policy'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            checkedAt: { type: 'string', format: 'date-time' },
            state: { type: 'string', enum: ['verified', 'recovered', 'partial', 'unavailable', 'needs_review', 'baseline_pending'] },
            cause: { type: 'string' },
            retrievalChannel: { type: 'string' },
            isLatestTransition: { type: 'boolean' },
            hasPublicSnapshotEvidence: { type: 'boolean' },
            company: { $ref: '#/components/schemas/CompanyReference' },
            policy: { type: 'object', additionalProperties: true },
          },
        },
        ObservatorySignal: {
          type: 'object',
          required: ['id', 'title', 'summary', 'contentType', 'region', 'priority', 'publishedOn', 'sourceUrl', 'source'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            contentType: { type: 'string' },
            region: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'watch'] },
            publishedOn: { type: 'string', format: 'date' },
            reviewUtc: { type: 'string' },
            sourceUrl: { type: 'string', format: 'uri' },
            source: { type: 'object', additionalProperties: true },
          },
        },
        ManifestResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: { type: 'object', additionalProperties: true },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        CompanyListResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        ChangeListResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: { type: 'array', items: { $ref: '#/components/schemas/PolicyChange' } },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        ChangeDetailResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: { $ref: '#/components/schemas/PolicyChange' },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        ContinuityResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: {
              type: 'object',
              required: ['generatedAt', 'sourceCount', 'eventCount', 'dataExposed', 'events'],
              properties: {
                generatedAt: { type: 'string', format: 'date-time' },
                sourceCount: { type: 'integer', minimum: 0 },
                eventCount: { type: 'integer', minimum: 0 },
                recoveredCount: { type: 'integer', minimum: 0 },
                currentWithheldCount: { type: 'integer', minimum: 0 },
                truncated: { type: 'boolean' },
                dataExposed: { type: 'boolean', enum: [false] },
                limitationEn: { type: 'string' },
                events: { type: 'array', items: { $ref: '#/components/schemas/ContinuityEvent' } },
              },
            },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        ObservatorySignalListResponse: {
          type: 'object',
          required: ['apiVersion', 'data', 'meta'],
          properties: {
            apiVersion: { type: 'string', enum: ['v2'] },
            data: { type: 'array', items: { $ref: '#/components/schemas/ObservatorySignal' } },
            meta: { $ref: '#/components/schemas/ResponseMeta' },
          },
        },
        Problem: {
          type: 'object',
          required: ['type', 'title', 'status', 'detail', 'code', 'requestId'],
          properties: {
            type: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            status: { type: 'integer' },
            detail: { type: 'string' },
            code: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
      responses: {
        BadRequest: { description: 'Invalid request.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
        Unauthorized: { description: 'Missing or invalid access token.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
        Forbidden: { description: 'Tenant or permission is not allowed.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
        NotFound: { description: 'Evidence-gated resource not found.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
        InternalError: { description: 'Unexpected API error.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
        ServiceUnavailable: { description: 'Enterprise authentication or the service is unavailable.', content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } } },
      },
    },
  };
}
