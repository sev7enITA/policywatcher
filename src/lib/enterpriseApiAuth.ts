import {
  createPublicKey,
  randomUUID,
  timingSafeEqual,
  verify,
  type JsonWebKey as NodeJsonWebKey,
} from 'node:crypto';

const ENTRA_TENANT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TOKEN_LENGTH = 16_384;
const CLOCK_SKEW_SECONDS = 60;
const DEFAULT_JWKS_TTL_MS = 60 * 60 * 1000;
const MAX_JWKS_TTL_MS = 24 * 60 * 60 * 1000;

export const ENTERPRISE_READ_SCOPE = 'policywatcher.read' as const;
export const ENTERPRISE_READ_ROLE = 'PolicyWatcher.Read.All' as const;

interface JwtHeader {
  alg?: unknown;
  kid?: unknown;
  typ?: unknown;
}

interface JwtClaims {
  aud?: unknown;
  azp?: unknown;
  exp?: unknown;
  iat?: unknown;
  iss?: unknown;
  nbf?: unknown;
  oid?: unknown;
  preferred_username?: unknown;
  roles?: unknown;
  scp?: unknown;
  sub?: unknown;
  tid?: unknown;
  ver?: unknown;
}

interface EntraJwk extends NodeJsonWebKey {
  kid?: string;
  use?: string;
  alg?: string;
}

interface EntraJwksResponse {
  keys?: EntraJwk[];
}

interface CachedJwks {
  expiresAt: number;
  keys: EntraJwk[];
}

export interface EnterpriseAuthConfig {
  audiences: readonly string[];
  allowedTenantIds: readonly string[];
  allowAnyTenant: boolean;
  readScopes: readonly string[];
  readRoles: readonly string[];
}

export interface EnterpriseAuthContext {
  tenantId: string;
  subjectId: string;
  clientId: string | null;
  username: string | null;
  scopes: readonly string[];
  roles: readonly string[];
  authentication: 'delegated' | 'application';
}

export type EnterpriseAuthFailureCode =
  | 'auth_not_configured'
  | 'authorization_required'
  | 'gateway_required'
  | 'invalid_access_token'
  | 'tenant_not_allowed'
  | 'insufficient_permissions';

export interface EnterpriseAuthFailure {
  ok: false;
  code: EnterpriseAuthFailureCode;
  status: 401 | 403 | 503;
  detail: string;
}

export interface EnterpriseAuthSuccess {
  ok: true;
  context: EnterpriseAuthContext;
}

export type EnterpriseAuthResult = EnterpriseAuthFailure | EnterpriseAuthSuccess;

export interface VerifyEnterpriseTokenOptions {
  nowSeconds?: number;
  getSigningKeys?: (tenantId: string, forceRefresh: boolean) => Promise<readonly EntraJwk[]>;
}

const jwksCache = new Map<string, CachedJwks>();

function configuredList(value: string | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];
}

export function loadEnterpriseAuthConfig(
  environment: NodeJS.ProcessEnv = process.env
): EnterpriseAuthConfig | null {
  const audiences = configuredList(environment.POLICYWATCHER_ENTRA_AUDIENCES);
  const tenantEntries = configuredList(environment.POLICYWATCHER_ENTRA_ALLOWED_TENANTS);
  if (audiences.length === 0 || tenantEntries.length === 0) return null;

  const allowAnyTenant = tenantEntries.includes('*');
  const allowedTenantIds = tenantEntries
    .filter((entry) => entry !== '*')
    .map((tenantId) => tenantId.toLowerCase());
  if (allowedTenantIds.some((tenantId) => !ENTRA_TENANT_ID_RE.test(tenantId))) {
    return null;
  }

  const configuredReadScopes = configuredList(environment.POLICYWATCHER_ENTRA_READ_SCOPES);
  const configuredReadRoles = configuredList(environment.POLICYWATCHER_ENTRA_READ_ROLES);

  return {
    audiences,
    allowedTenantIds,
    allowAnyTenant,
    readScopes: configuredReadScopes.length > 0
      ? configuredReadScopes
      : [ENTERPRISE_READ_SCOPE],
    readRoles: configuredReadRoles.length > 0
      ? configuredReadRoles
      : [ENTERPRISE_READ_ROLE],
  };
}

function decodeJsonSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function parseMaxAge(cacheControl: string | null): number | null {
  const match = cacheControl?.match(/(?:^|,)\s*max-age=(\d+)\s*(?:,|$)/i);
  if (!match) return null;
  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) ? seconds : null;
}

async function fetchSigningKeys(tenantId: string, forceRefresh: boolean): Promise<readonly EntraJwk[]> {
  const now = Date.now();
  const cached = jwksCache.get(tenantId);
  if (!forceRefresh && cached && cached.expiresAt > now) return cached.keys;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/discovery/v2.0/keys`,
      {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }
    );
    if (!response.ok) throw new Error(`Entra JWKS request failed with HTTP ${response.status}.`);

    const body = await response.json() as EntraJwksResponse;
    const keys = Array.isArray(body.keys)
      ? body.keys.filter((key) =>
          key.kty === 'RSA' &&
          typeof key.kid === 'string' &&
          (!key.use || key.use === 'sig') &&
          (!key.alg || key.alg === 'RS256')
        )
      : [];
    if (keys.length === 0) throw new Error('Entra JWKS response did not contain RSA signing keys.');

    const maxAgeSeconds = parseMaxAge(response.headers.get('cache-control'));
    const ttlMs = Math.min(
      maxAgeSeconds === null ? DEFAULT_JWKS_TTL_MS : maxAgeSeconds * 1000,
      MAX_JWKS_TTL_MS
    );
    jwksCache.set(tenantId, { keys, expiresAt: now + ttlMs });
    return keys;
  } finally {
    clearTimeout(timeout);
  }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

function audienceMatches(value: unknown, configuredAudiences: readonly string[]): boolean {
  const tokenAudiences = typeof value === 'string' ? [value] : stringList(value);
  return tokenAudiences.some((audience) => configuredAudiences.includes(audience));
}

function tenantAllowed(tenantId: string, config: EnterpriseAuthConfig): boolean {
  return config.allowAnyTenant || config.allowedTenantIds.includes(tenantId);
}

function authenticationFailure(
  code: EnterpriseAuthFailureCode,
  status: EnterpriseAuthFailure['status'],
  detail: string
): EnterpriseAuthFailure {
  return { ok: false, code, status, detail };
}

export async function verifyEnterpriseAccessToken(
  token: string,
  config: EnterpriseAuthConfig,
  options: VerifyEnterpriseTokenOptions = {}
): Promise<EnterpriseAuthResult> {
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return authenticationFailure('invalid_access_token', 401, 'The access token is invalid.');
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return authenticationFailure('invalid_access_token', 401, 'The access token is invalid.');
  }

  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const header = decodeJsonSegment<JwtHeader>(encodedHeader);
  const claims = decodeJsonSegment<JwtClaims>(encodedClaims);
  if (!header || !claims || header.alg !== 'RS256' || typeof header.kid !== 'string') {
    return authenticationFailure('invalid_access_token', 401, 'The access token is invalid.');
  }

  const tenantId = typeof claims.tid === 'string' ? claims.tid.toLowerCase() : '';
  if (!ENTRA_TENANT_ID_RE.test(tenantId)) {
    return authenticationFailure('invalid_access_token', 401, 'The access token tenant is invalid.');
  }
  if (!tenantAllowed(tenantId, config)) {
    return authenticationFailure('tenant_not_allowed', 403, 'This Microsoft Entra tenant is not enabled.');
  }

  const expectedIssuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (
    claims.iss !== expectedIssuer ||
    claims.ver !== '2.0' ||
    !audienceMatches(claims.aud, config.audiences) ||
    typeof claims.exp !== 'number' ||
    claims.exp < nowSeconds - CLOCK_SKEW_SECONDS ||
    (typeof claims.nbf === 'number' && claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS)
  ) {
    return authenticationFailure('invalid_access_token', 401, 'The access token claims are invalid.');
  }

  const getSigningKeys = options.getSigningKeys ?? fetchSigningKeys;
  let signingKeys: readonly EntraJwk[];
  try {
    signingKeys = await getSigningKeys(tenantId, false);
    if (!signingKeys.some((key) => key.kid === header.kid)) {
      signingKeys = await getSigningKeys(tenantId, true);
    }
  } catch {
    return authenticationFailure('invalid_access_token', 401, 'The token signing key could not be verified.');
  }

  const signingKey = signingKeys.find((key) => key.kid === header.kid);
  if (!signingKey) {
    return authenticationFailure('invalid_access_token', 401, 'The token signing key is unknown.');
  }

  let signatureValid = false;
  try {
    const publicKey = createPublicKey({ key: signingKey, format: 'jwk' });
    signatureValid = verify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedClaims}`, 'ascii'),
      publicKey,
      Buffer.from(encodedSignature, 'base64url')
    );
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) {
    return authenticationFailure('invalid_access_token', 401, 'The access token signature is invalid.');
  }

  const scopes = typeof claims.scp === 'string'
    ? [...new Set(claims.scp.split(/\s+/).filter(Boolean))]
    : [];
  const roles = stringList(claims.roles);
  const hasReadPermission =
    scopes.some((scope) => config.readScopes.includes(scope)) ||
    roles.some((role) => config.readRoles.includes(role));
  if (!hasReadPermission) {
    return authenticationFailure(
      'insufficient_permissions',
      403,
      'The access token does not grant PolicyWatcher read access.'
    );
  }

  const subjectId = typeof claims.oid === 'string'
    ? claims.oid
    : typeof claims.sub === 'string'
      ? claims.sub
      : '';
  if (!subjectId) {
    return authenticationFailure('invalid_access_token', 401, 'The access token subject is invalid.');
  }

  return {
    ok: true,
    context: {
      tenantId,
      subjectId,
      clientId: typeof claims.azp === 'string' ? claims.azp : null,
      username: typeof claims.preferred_username === 'string' ? claims.preferred_username : null,
      scopes,
      roles,
      authentication: scopes.length > 0 ? 'delegated' : 'application',
    },
  };
}

export async function authenticateEnterpriseRequest(request: Request): Promise<EnterpriseAuthResult> {
  const config = loadEnterpriseAuthConfig();
  if (!config) {
    return authenticationFailure(
      'auth_not_configured',
      503,
      'Enterprise authentication is not configured for this environment.'
    );
  }

  const gatewaySecret = process.env.POLICYWATCHER_APIM_SHARED_SECRET?.trim();
  if (gatewaySecret) {
    const suppliedSecret = request.headers.get('x-policywatcher-gateway-key') || '';
    const suppliedBuffer = Buffer.from(suppliedSecret, 'utf8');
    const expectedBuffer = Buffer.from(gatewaySecret, 'utf8');
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return authenticationFailure(
        'gateway_required',
        403,
        'The enterprise API must be accessed through the configured gateway.'
      );
    }
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return authenticationFailure('authorization_required', 401, 'A Microsoft Entra bearer token is required.');
  }
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return authenticationFailure('invalid_access_token', 401, 'The Authorization header is invalid.');
  }

  return verifyEnterpriseAccessToken(match[1], config);
}

export function getEnterpriseRequestId(request: Request): string {
  const supplied = request.headers.get('x-request-id');
  if (supplied && /^[A-Za-z0-9._:-]{1,100}$/.test(supplied)) return supplied;
  return randomUUID();
}
