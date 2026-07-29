export type PublicDataSourceId =
  | 'dashboardCompanies'
  | 'companyComparison'
  | 'marketPulse'
  | 'policyDetails'
  | 'sourceSuspensions'
  | 'sourceContinuity'
  | 'observatoryRegistry'
  | 'evidenceCollections'
  | 'riskTrends'
  | 'kpiMatrix';

export type EvidenceGate = 'public-policy' | 'public-change' | 'public-suspension' | 'public-reference';
export type FreshnessMode = 'request' | 'short-ttl';

export interface PublicDataSourceSpec {
  readonly id: PublicDataSourceId;
  readonly endpoint: `/api/${string}`;
  readonly method: 'GET';
  readonly visibilityContext: 'public';
  readonly evidenceGate: EvidenceGate;
  readonly freshness: {
    readonly mode: FreshnessMode;
    readonly maxAgeSeconds: number;
  };
  readonly allowedPathParams: readonly string[];
  readonly allowedQueryParams: readonly string[];
  readonly description: string;
}

export interface DataSourceValidationIssue {
  code:
    | 'source.key_mismatch'
    | 'source.endpoint_invalid'
    | 'source.path_param_invalid'
    | 'source.path_param_mismatch'
    | 'source.freshness_invalid'
    | 'source.query_param_duplicate';
  path: string;
  message: string;
}

export interface DataSourceLoadResult<T> {
  data: T;
  provenance: {
    sourceId: PublicDataSourceId;
    queryKey: string;
    endpoint: string;
    evidenceGate: EvidenceGate;
    visibilityContext: 'public';
  };
}

export type DataSourceQuery = Readonly<Record<string, string | number | boolean | null | undefined>>;

function sourceSpec(
  spec: Omit<PublicDataSourceSpec, 'method' | 'visibilityContext' | 'allowedPathParams'> & {
    readonly allowedPathParams?: readonly string[];
  }
): PublicDataSourceSpec {
  return Object.freeze({
    ...spec,
    method: 'GET',
    visibilityContext: 'public',
    freshness: Object.freeze({ ...spec.freshness }),
    allowedPathParams: Object.freeze([...(spec.allowedPathParams || [])]),
    allowedQueryParams: Object.freeze([...spec.allowedQueryParams]),
  });
}

export const PUBLIC_DATA_SOURCES: Readonly<Record<PublicDataSourceId, PublicDataSourceSpec>> =
  Object.freeze({
    dashboardCompanies: sourceSpec({
      id: 'dashboardCompanies',
      endpoint: '/api/companies',
      evidenceGate: 'public-policy',
      freshness: { mode: 'request', maxAgeSeconds: 0 },
      allowedQueryParams: [],
      description: 'Public companies with gated policies and their latest public change.',
    }),
    companyComparison: sourceSpec({
      id: 'companyComparison',
      endpoint: '/api/compare',
      evidenceGate: 'public-change',
      freshness: { mode: 'request', maxAgeSeconds: 0 },
      allowedQueryParams: ['companyA', 'companyB'],
      description: 'Evidence-gated company and industry KPI benchmark profiles.',
    }),
    marketPulse: sourceSpec({
      id: 'marketPulse',
      endpoint: '/api/changes',
      evidenceGate: 'public-change',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: ['company', 'from', 'industry', 'kpi', 'page', 'pageSize', 'q', 'risk', 'to'],
      description: 'Paginated public policy-change event stream.',
    }),
    policyDetails: sourceSpec({
      id: 'policyDetails',
      endpoint: '/api/policies/{policyId}',
      evidenceGate: 'public-change',
      freshness: { mode: 'request', maxAgeSeconds: 0 },
      allowedPathParams: ['policyId'],
      allowedQueryParams: [],
      description: 'Public policy detail with gated snapshots and public change analysis.',
    }),
    sourceSuspensions: sourceSpec({
      id: 'sourceSuspensions',
      endpoint: '/api/source-suspensions',
      evidenceGate: 'public-suspension',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: [],
      description: 'Sanitized metadata for sources withheld by publication gates.',
    }),
    sourceContinuity: sourceSpec({
      id: 'sourceContinuity',
      endpoint: '/api/source-continuity',
      evidenceGate: 'public-suspension',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: [],
      description: 'Sanitized history of source retrieval and publication-state transitions.',
    }),
    observatoryRegistry: sourceSpec({
      id: 'observatoryRegistry',
      endpoint: '/api/v1/observatory',
      evidenceGate: 'public-reference',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 300 },
      allowedQueryParams: ['lang'],
      description: 'Curated public registry of governance, privacy, standards and event references.',
    }),
    evidenceCollections: sourceSpec({
      id: 'evidenceCollections',
      endpoint: '/api/v1/evidence-collections',
      evidenceGate: 'public-change',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 300 },
      allowedQueryParams: ['changes', 'format'],
      description: 'Deterministic JSON, Markdown or CSV bundle for up to 12 exact public change records.',
    }),
    riskTrends: sourceSpec({
      id: 'riskTrends',
      endpoint: '/api/trends',
      evidenceGate: 'public-change',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: ['companyId', 'industry'],
      description: 'Chronological public risk-change observations with snapshot provenance.',
    }),
    kpiMatrix: sourceSpec({
      id: 'kpiMatrix',
      endpoint: '/api/matrix',
      evidenceGate: 'public-policy',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: [],
      description: 'Cross-company KPI aggregation over public policy evidence.',
    }),
  });

export function validatePublicDataSourceRegistry(
  registry: Readonly<Record<PublicDataSourceId, PublicDataSourceSpec>>
): DataSourceValidationIssue[] {
  const issues: DataSourceValidationIssue[] = [];

  for (const [key, spec] of Object.entries(registry)) {
    if (key !== spec.id) {
      issues.push({
        code: 'source.key_mismatch',
        path: `${key}.id`,
        message: `Registry key ${key} does not match source id ${spec.id}.`,
      });
    }
    if (!spec.endpoint.startsWith('/api/') || spec.endpoint.includes('://')) {
      issues.push({
        code: 'source.endpoint_invalid',
        path: `${key}.endpoint`,
        message: `Source ${key} must use a local /api/ endpoint.`,
      });
    }
    const placeholders = [...spec.endpoint.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    const uniquePathParams = new Set(spec.allowedPathParams);
    if (uniquePathParams.size !== spec.allowedPathParams.length) {
      issues.push({
        code: 'source.path_param_invalid',
        path: `${key}.allowedPathParams`,
        message: `Source ${key} contains duplicate path parameter declarations.`,
      });
    }
    if (
      placeholders.length !== spec.allowedPathParams.length ||
      placeholders.some((placeholder) => !uniquePathParams.has(placeholder))
    ) {
      issues.push({
        code: 'source.path_param_mismatch',
        path: `${key}.endpoint`,
        message: `Source ${key} path placeholders do not match its allowlist.`,
      });
    }
    if (!Number.isInteger(spec.freshness.maxAgeSeconds) || spec.freshness.maxAgeSeconds < 0) {
      issues.push({
        code: 'source.freshness_invalid',
        path: `${key}.freshness.maxAgeSeconds`,
        message: `Source ${key} has an invalid freshness duration.`,
      });
    }
    const uniqueParams = new Set(spec.allowedQueryParams);
    if (uniqueParams.size !== spec.allowedQueryParams.length) {
      issues.push({
        code: 'source.query_param_duplicate',
        path: `${key}.allowedQueryParams`,
        message: `Source ${key} contains duplicate query parameter declarations.`,
      });
    }
  }

  return issues;
}

export const PUBLIC_DATA_SOURCE_ISSUES = validatePublicDataSourceRegistry(PUBLIC_DATA_SOURCES);

if (PUBLIC_DATA_SOURCE_ISSUES.length > 0) {
  throw new Error(
    `Invalid public data-source registry: ${PUBLIC_DATA_SOURCE_ISSUES
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ')}`
  );
}

function resolvePublicDataSourceEndpoint(
  spec: PublicDataSourceSpec,
  query: DataSourceQuery
): string {
  let endpoint: string = spec.endpoint;
  for (const pathParam of spec.allowedPathParams) {
    const rawValue = query[pathParam];
    const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(value)) {
      throw new Error(`Path parameter ${pathParam} is invalid for data source ${spec.id}.`);
    }
    endpoint = endpoint.replace(`{${pathParam}}`, encodeURIComponent(value));
  }
  return endpoint;
}

function canonicalDataSourceParams(spec: PublicDataSourceSpec, query: DataSourceQuery): URLSearchParams {
  const allowed = new Set(spec.allowedQueryParams);
  const pathParams = new Set(spec.allowedPathParams);
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (pathParams.has(key)) continue;
    if (!allowed.has(key)) {
      throw new Error(`Query parameter ${key} is not allowed for data source ${spec.id}.`);
    }
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;
    const value = String(rawValue);
    if (value.length > 500 || /[\u0000-\u001f]/.test(value)) {
      throw new Error(`Query parameter ${key} is invalid for data source ${spec.id}.`);
    }
    params.set(key, value);
  }

  params.sort();
  return params;
}

export function buildPublicDataSourceUrl(
  sourceId: PublicDataSourceId,
  query: DataSourceQuery = {}
): string {
  const spec = PUBLIC_DATA_SOURCES[sourceId];
  const endpoint = resolvePublicDataSourceEndpoint(spec, query);
  const params = canonicalDataSourceParams(spec, query).toString();
  return params ? `${endpoint}?${params}` : endpoint;
}

export function getPublicDataSourceQueryKey(
  sourceId: PublicDataSourceId,
  query: DataSourceQuery = {}
): string {
  const spec = PUBLIC_DATA_SOURCES[sourceId];
  return `${spec.visibilityContext}:${spec.evidenceGate}:${buildPublicDataSourceUrl(sourceId, query)}`;
}

const inFlightPublicLoads = new Map<string, Promise<unknown>>();

/**
 * Loads an allowlisted public source and coalesces only identical in-flight
 * requests. Results are not retained after completion.
 */
export async function loadPublicDataSource<T>(
  sourceId: PublicDataSourceId,
  query: DataSourceQuery = {}
): Promise<DataSourceLoadResult<T>> {
  const spec = PUBLIC_DATA_SOURCES[sourceId];
  const endpoint = buildPublicDataSourceUrl(sourceId, query);
  const queryKey = getPublicDataSourceQueryKey(sourceId, query);
  let pending = inFlightPublicLoads.get(queryKey) as Promise<T> | undefined;

  if (!pending) {
    pending = fetch(endpoint).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Data source ${sourceId} failed with HTTP ${response.status}.`);
      }
      return response.json() as Promise<T>;
    });
    inFlightPublicLoads.set(queryKey, pending);
    void pending.then(
      () => inFlightPublicLoads.delete(queryKey),
      () => inFlightPublicLoads.delete(queryKey)
    );
  }

  const data = await pending;
  return {
    data,
    provenance: {
      sourceId,
      queryKey,
      endpoint,
      evidenceGate: spec.evidenceGate,
      visibilityContext: spec.visibilityContext,
    },
  };
}
