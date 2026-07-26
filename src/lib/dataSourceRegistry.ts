export type PublicDataSourceId =
  | 'dashboardCompanies'
  | 'marketPulse'
  | 'sourceSuspensions'
  | 'riskTrends'
  | 'kpiMatrix';

export type EvidenceGate = 'public-policy' | 'public-change' | 'public-suspension';
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
  readonly allowedQueryParams: readonly string[];
  readonly description: string;
}

export interface DataSourceValidationIssue {
  code:
    | 'source.key_mismatch'
    | 'source.endpoint_invalid'
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
  spec: Omit<PublicDataSourceSpec, 'method' | 'visibilityContext'>
): PublicDataSourceSpec {
  return Object.freeze({
    ...spec,
    method: 'GET',
    visibilityContext: 'public',
    freshness: Object.freeze({ ...spec.freshness }),
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
    marketPulse: sourceSpec({
      id: 'marketPulse',
      endpoint: '/api/changes',
      evidenceGate: 'public-change',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: ['company', 'from', 'industry', 'kpi', 'page', 'pageSize', 'q', 'risk', 'to'],
      description: 'Paginated public policy-change event stream.',
    }),
    sourceSuspensions: sourceSpec({
      id: 'sourceSuspensions',
      endpoint: '/api/source-suspensions',
      evidenceGate: 'public-suspension',
      freshness: { mode: 'short-ttl', maxAgeSeconds: 60 },
      allowedQueryParams: [],
      description: 'Sanitized metadata for sources withheld by publication gates.',
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

function canonicalDataSourceParams(spec: PublicDataSourceSpec, query: DataSourceQuery): URLSearchParams {
  const allowed = new Set(spec.allowedQueryParams);
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (!allowed.has(key)) {
      throw new Error(`Query parameter ${key} is not allowed for data source ${spec.id}.`);
    }
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;
    const value = String(rawValue);
    if (value.length > 200 || /[\u0000-\u001f]/.test(value)) {
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
  const params = canonicalDataSourceParams(spec, query).toString();
  return params ? `${spec.endpoint}?${params}` : spec.endpoint;
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
