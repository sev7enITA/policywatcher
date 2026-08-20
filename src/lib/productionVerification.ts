import { getDatabaseReadinessReport } from './databaseReadiness';
import { POLICYWATCHER_VERSION } from './release';
import { POLICYWATCHER_CANONICAL_ORIGIN } from './siteOrigin';
import type { AdminRole } from './adminAuth';

export type ProductionVerificationState = 'passed' | 'attention' | 'unavailable' | 'external';

export interface ProductionVerificationCheck {
  id: string;
  category: 'identity' | 'runtime' | 'database' | 'http' | 'security' | 'external';
  title: string;
  state: ProductionVerificationState;
  observed: string;
  expected: string;
  boundary: string;
}
export interface ProductionVerificationReport {
  contractVersion: '1.1.0';
  release: string;
  checkedAt: string;
  origin: string | null;
  role: AdminRole;
  status: 'ready' | 'attention' | 'unavailable';
  summary: Record<ProductionVerificationState, number>;
  checks: ProductionVerificationCheck[];
  boundary: string;
}

type Fetcher = typeof fetch;

function cleanOrigin(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    const localDevelopment = process.env.NODE_ENV !== 'production'
      && parsed.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localDevelopment) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (parsed.pathname !== '/' && parsed.pathname !== '') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function resolveProductionVerificationOrigin(requestOrigin: string): string | null {
  return cleanOrigin(process.env.APP_URL)
    || cleanOrigin(process.env.NEXT_PUBLIC_APP_URL)
    || cleanOrigin(requestOrigin);
}

async function fetchWithTimeout(fetcher: Fetcher, url: string, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, { cache: 'no-store', redirect: 'manual', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function secretConfigurationCheck(): ProductionVerificationCheck {
  const apiSecret = process.env.API_SECRET?.trim() || '';
  const sessionSecret = process.env.SESSION_HMAC_SECRET?.trim() || '';
  const strongAndSeparate = apiSecret.length >= 32 && sessionSecret.length >= 32 && apiSecret !== sessionSecret;
  return {
    id: 'secret-separation',
    category: 'security',
    title: 'Operational and session secret separation',
    state: strongAndSeparate ? 'passed' : 'attention',
    observed: strongAndSeparate ? 'Both secrets are configured, high-entropy-length and distinct.' : 'One or both secrets are missing, short or reused.',
    expected: 'API_SECRET and SESSION_HMAC_SECRET are distinct and at least 32 characters.',
    boundary: 'Only configuration presence, length and equality are checked. Secret randomness, custody and rotation are not proved.',
  };
}

function runtimeCheck(origin: string | null): ProductionVerificationCheck {
  const production = process.env.NODE_ENV === 'production';
  const https = origin?.startsWith('https://') ?? false;
  const canonical = origin === POLICYWATCHER_CANONICAL_ORIGIN;
  return {
    id: 'production-runtime',
    category: 'runtime',
    title: 'Production runtime and canonical HTTPS origin',
    state: production && https && canonical ? 'passed' : 'attention',
    observed: `NODE_ENV=${process.env.NODE_ENV || 'undefined'}; origin ${origin || 'unavailable'}${canonical ? ' matches' : ' does not match'} the public canonical origin.`,
    expected: `Production mode with APP_URL=${POLICYWATCHER_CANONICAL_ORIGIN}.`,
    boundary: 'The check does not validate DNS ownership, certificate chain, proxy routing or service availability.',
  };
}

async function httpChecks(origin: string | null, fetcher: Fetcher): Promise<ProductionVerificationCheck[]> {
  if (!origin) {
    return [{
      id: 'deployed-http-surface', category: 'http', title: 'Deployed HTTP verification', state: 'unavailable',
      observed: 'No safe canonical origin could be resolved.', expected: 'A credential-free HTTPS APP_URL.',
      boundary: 'No deployment response was requested.',
    }];
  }

  const checks: ProductionVerificationCheck[] = [];
  const [trustResult, manifestResult, readinessResult, adminBoundaryResult, healthBoundaryResult] = await Promise.allSettled([
    fetchWithTimeout(fetcher, `${origin}/trust`),
    fetchWithTimeout(fetcher, `${origin}/api/v1/manifest`),
    fetchWithTimeout(fetcher, `${origin}/api/v1/publication-readiness`),
    fetchWithTimeout(fetcher, `${origin}/api/admin/database-readiness`),
    fetchWithTimeout(fetcher, `${origin}/api/health`),
  ]);

  if (trustResult.status === 'fulfilled') {
    const response = trustResult.value;
    const headerPass = response.ok
      && response.headers.get('strict-transport-security')?.includes('max-age=')
      && response.headers.get('x-content-type-options') === 'nosniff'
      && response.headers.get('x-frame-options') === 'DENY'
      && response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'");
    checks.push({
      id: 'security-headers', category: 'http', title: 'Live security-header boundary', state: headerPass ? 'passed' : 'attention',
      observed: headerPass ? 'The live Trust response includes the required transport, framing, MIME and CSP controls.' : `The live Trust response was HTTP ${response.status} or omitted a required header.`,
      expected: 'HTTPS response with HSTS, nosniff, DENY framing and CSP frame-ancestors none.',
      boundary: 'One response does not prove that every proxy path, cache state or subdomain has identical headers.',
    });
  } else {
    checks.push({
      id: 'security-headers', category: 'http', title: 'Live security-header boundary', state: 'unavailable',
      observed: 'The deployed Trust response could not be retrieved.', expected: 'A reachable Trust response with the required security headers.',
      boundary: 'Network failure is reported as unavailable, not as a passing or failing security posture.',
    });
  }

  if (manifestResult.status === 'fulfilled') {
    let release: string | null = null;
    try { release = (await manifestResult.value.json() as { release?: string }).release || null; } catch { release = null; }
    checks.push({
      id: 'deployed-release', category: 'runtime', title: 'Deployed release identity',
      state: manifestResult.value.ok && release === POLICYWATCHER_VERSION ? 'passed' : 'attention',
      observed: release ? `Public manifest reports ${release}.` : `Public manifest returned HTTP ${manifestResult.value.status} without a valid release.`,
      expected: `Public manifest reports ${POLICYWATCHER_VERSION}.`,
      boundary: 'Release identity does not prove that database migrations, static assets and companion services were deployed atomically.',
    });
  } else {
    checks.push({
      id: 'deployed-release', category: 'runtime', title: 'Deployed release identity', state: 'unavailable',
      observed: 'The public manifest could not be retrieved.', expected: `Public manifest reports ${POLICYWATCHER_VERSION}.`,
      boundary: 'An unavailable response is not converted into a version mismatch.',
    });
  }

  if (readinessResult.status === 'fulfilled') {
    let payload: Record<string, unknown> | null = null;
    try { payload = await readinessResult.value.json() as Record<string, unknown>; } catch { payload = null; }
    const stages = Array.isArray(payload?.stages)
      ? payload.stages.map((stage) => (stage && typeof stage === 'object' && 'id' in stage ? stage.id : null))
      : [];
    const expectedStages = ['configured', 'retrieved', 'baseline-verified', 'public', 'analysed'];
    const latestCapture = payload?.latestCapture;
    const contractPass = readinessResult.value.status === 200
      && readinessResult.value.headers.get('cache-control') === 'no-store'
      && payload?.schema === 'https://policywatcher.online/schemas/publication-readiness/v1'
      && payload?.metricId === 'publication-readiness'
      && payload?.contractVersion === '1.0.0'
      && payload?.source === 'database'
      && JSON.stringify(stages) === JSON.stringify(expectedStages)
      && typeof latestCapture === 'object'
      && latestCapture !== null
      && 'capturedAt' in latestCapture;
    checks.push({
      id: 'publication-readiness-contract', category: 'http', title: 'Authoritative publication-readiness contract',
      state: contractPass ? 'passed' : 'attention',
      observed: contractPass
        ? 'The live database-derived metric exposes the ordered stages, latest capture and no-store boundary.'
        : `The readiness endpoint returned HTTP ${readinessResult.value.status} or diverged from contract 1.0.0.`,
      expected: 'HTTP 200, schema v1, database source, five ordered stages, latest capture and Cache-Control: no-store.',
      boundary: 'This aggregate contract check does not prove source completeness, analysis quality or current availability of every configured source.',
    });
  } else {
    checks.push({
      id: 'publication-readiness-contract', category: 'http', title: 'Authoritative publication-readiness contract', state: 'unavailable',
      observed: 'The deployed publication-readiness response could not be retrieved.',
      expected: 'A reachable aggregate database-derived metric conforming to schema v1.',
      boundary: 'Network failure is reported as unavailable and never converted into zero counts.',
    });
  }

  const boundaryPairs: Array<[PromiseSettledResult<Response>, string, string]> = [
    [adminBoundaryResult, 'unauthenticated-admin-boundary', 'Protected database readiness rejects an unauthenticated request.'],
    [healthBoundaryResult, 'unauthenticated-health-boundary', 'Operational health rejects an unauthenticated request.'],
  ];
  for (const [result, id, title] of boundaryPairs) {
    checks.push({
      id, category: 'security', title,
      state: result.status === 'fulfilled' && result.value.status === 401 ? 'passed' : result.status === 'rejected' ? 'unavailable' : 'attention',
      observed: result.status === 'fulfilled' ? `Unauthenticated response returned HTTP ${result.value.status}.` : 'The boundary response could not be retrieved.',
      expected: 'HTTP 401 with no protected payload.',
      boundary: 'This negative check does not replace role-by-role authorization tests for every protected mutation.',
    });
  }

  return checks;
}

export async function getProductionVerificationReport(input: {
  requestOrigin: string;
  role: AdminRole;
  fetcher?: Fetcher;
}): Promise<ProductionVerificationReport> {
  const origin = resolveProductionVerificationOrigin(input.requestOrigin);
  const fetcher = input.fetcher ?? fetch;
  const checkedAt = new Date().toISOString();
  const checks: ProductionVerificationCheck[] = [
    {
      id: 'authenticated-session', category: 'identity', title: 'Authenticated verification session', state: 'passed',
      observed: `The verification request carries a valid ${input.role} session.`, expected: 'A valid Admin or Auditor session.',
      boundary: 'A valid session does not grant mutation rights; endpoint authorization remains authoritative.',
    },
    runtimeCheck(origin),
    secretConfigurationCheck(),
  ];

  try {
    const database = await getDatabaseReadinessReport();
    checks.push({
      id: 'database-readiness', category: 'database', title: 'Post-deploy database readiness',
      state: database.status === 'ready' ? 'passed' : database.status === 'unavailable' ? 'unavailable' : 'attention',
      observed: database.status === 'unavailable'
        ? 'Database readiness is unavailable.'
        : `${database.database.provider}: ${database.schema.presentTableCount}/${database.schema.expectedTableCount} tables and ${database.schema.appliedMigrationCount}/${database.schema.expectedMigrationCount} migrations observed; integrity=${database.integrity.quickCheck}.`,
      expected: 'Ready status, provider integrity check ok, and all provider-specific tables and migrations present; SQLite also requires readable and writable local storage.',
      boundary: 'Readiness is a point-in-time local check. It does not prove backup freshness, recovery time, data completeness or future availability.',
    });
  } catch {
    checks.push({
      id: 'database-readiness', category: 'database', title: 'Post-deploy database readiness', state: 'unavailable',
      observed: 'The readiness report could not be produced.', expected: 'A complete sanitized readiness report.',
      boundary: 'Internal error details are intentionally excluded from this report.',
    });
  }

  checks.push(...await httpChecks(origin, fetcher));
  checks.push({
    id: 'independent-dynamic-test', category: 'external', title: 'Independent dynamic security test', state: 'external',
    observed: 'No independent test result is generated or asserted by this application check.',
    expected: 'A separately scoped, dated and attributable production test with triaged findings.',
    boundary: 'The application can prepare and record verification evidence but cannot self-attest independence or a pentest outcome.',
  });

  const summary = checks.reduce<Record<ProductionVerificationState, number>>((acc, check) => {
    acc[check.state] += 1;
    return acc;
  }, { passed: 0, attention: 0, unavailable: 0, external: 0 });
  const status = summary.unavailable > 0 ? 'unavailable' : summary.attention > 0 || summary.external > 0 ? 'attention' : 'ready';

  return {
    contractVersion: '1.1.0', release: POLICYWATCHER_VERSION, checkedAt, origin, role: input.role,
    status, summary, checks,
    boundary: 'This report is a bounded post-deploy verification snapshot. It is not a penetration-test certificate, service-level statement, security certification or guarantee of continuous availability.',
  };
}
