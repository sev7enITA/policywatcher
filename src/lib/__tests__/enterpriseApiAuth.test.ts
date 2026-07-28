import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ENTERPRISE_READ_ROLE,
  ENTERPRISE_READ_SCOPE,
  authenticateEnterpriseRequest,
  loadEnterpriseAuthConfig,
  verifyEnterpriseAccessToken,
  type EnterpriseAuthConfig,
} from '../enterpriseApiAuth';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT_ID = '22222222-2222-4222-8222-222222222222';
const AUDIENCE = 'api://policywatcher-enterprise';
const NOW = 1_800_000_000;
const KEY_ID = 'test-key-1';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicJwk = {
  ...publicKey.export({ format: 'jwk' }),
  alg: 'RS256',
  kid: KEY_ID,
  use: 'sig',
};

const config: EnterpriseAuthConfig = {
  audiences: [AUDIENCE],
  allowedTenantIds: [TENANT_ID],
  allowAnyTenant: false,
  readScopes: [ENTERPRISE_READ_SCOPE],
  readRoles: [ENTERPRISE_READ_ROLE],
};

function createToken(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    aud: AUDIENCE,
    azp: '33333333-3333-4333-8333-333333333333',
    exp: NOW + 600,
    iat: NOW - 30,
    iss: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
    nbf: NOW - 30,
    oid: '44444444-4444-4444-8444-444444444444',
    roles: [ENTERPRISE_READ_ROLE],
    sub: 'subject',
    tid: TENANT_ID,
    ver: '2.0',
    ...overrides,
  })).toString('base64url');
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${claims}`, 'ascii'), privateKey).toString('base64url');
  return `${header}.${claims}.${signature}`;
}

const tokenOptions = {
  nowSeconds: NOW,
  getSigningKeys: async () => [publicJwk],
};

describe('enterprise Entra authentication', () => {
  it('accepts an application token with the configured role', async () => {
    const result = await verifyEnterpriseAccessToken(createToken(), config, tokenOptions);

    expect(result).toMatchObject({
      ok: true,
      context: {
        tenantId: TENANT_ID,
        authentication: 'application',
        roles: [ENTERPRISE_READ_ROLE],
      },
    });
  });

  it('accepts a delegated token with the configured scope', async () => {
    const result = await verifyEnterpriseAccessToken(
      createToken({ roles: undefined, scp: `openid ${ENTERPRISE_READ_SCOPE}` }),
      config,
      tokenOptions
    );

    expect(result).toMatchObject({
      ok: true,
      context: {
        authentication: 'delegated',
        scopes: ['openid', ENTERPRISE_READ_SCOPE],
      },
    });
  });

  it.each([
    ['wrong audience', { aud: 'api://another-service' }, 'invalid_access_token'],
    ['expired token', { exp: NOW - 120 }, 'invalid_access_token'],
    ['tenant not allowlisted', {
      tid: OTHER_TENANT_ID,
      iss: `https://login.microsoftonline.com/${OTHER_TENANT_ID}/v2.0`,
    }, 'tenant_not_allowed'],
    ['missing permission', { roles: ['Unrelated.Role'] }, 'insufficient_permissions'],
  ])('rejects %s', async (_name, overrides, expectedCode) => {
    const result = await verifyEnterpriseAccessToken(createToken(overrides), config, tokenOptions);
    expect(result).toMatchObject({ ok: false, code: expectedCode });
  });

  it('rejects a token whose signed content has been changed', async () => {
    const token = createToken();
    const [header, claims, signature] = token.split('.');
    const changedClaims = Buffer.from(JSON.stringify({
      ...JSON.parse(Buffer.from(claims, 'base64url').toString('utf8')),
      roles: ['Another.Role'],
    })).toString('base64url');

    const result = await verifyEnterpriseAccessToken(
      `${header}.${changedClaims}.${signature}`,
      config,
      tokenOptions
    );
    expect(result).toMatchObject({ ok: false, code: 'invalid_access_token' });
  });

  it('loads configuration fail-closed and supports an explicit pilot allowlist', () => {
    expect(loadEnterpriseAuthConfig({})).toBeNull();
    expect(loadEnterpriseAuthConfig({
      POLICYWATCHER_ENTRA_AUDIENCES: AUDIENCE,
      POLICYWATCHER_ENTRA_ALLOWED_TENANTS: TENANT_ID,
    })).toMatchObject({
      audiences: [AUDIENCE],
      allowedTenantIds: [TENANT_ID],
      allowAnyTenant: false,
      readScopes: [ENTERPRISE_READ_SCOPE],
      readRoles: [ENTERPRISE_READ_ROLE],
    });
  });

  it('rejects direct-origin calls when the APIM gateway secret is enabled', async () => {
    const previous = {
      audiences: process.env.POLICYWATCHER_ENTRA_AUDIENCES,
      tenants: process.env.POLICYWATCHER_ENTRA_ALLOWED_TENANTS,
      gateway: process.env.POLICYWATCHER_APIM_SHARED_SECRET,
    };
    process.env.POLICYWATCHER_ENTRA_AUDIENCES = AUDIENCE;
    process.env.POLICYWATCHER_ENTRA_ALLOWED_TENANTS = TENANT_ID;
    process.env.POLICYWATCHER_APIM_SHARED_SECRET = 'test-gateway-secret';

    try {
      const result = await authenticateEnterpriseRequest(new Request('https://origin.example/api/v2/manifest'));
      expect(result).toMatchObject({ ok: false, code: 'gateway_required', status: 403 });
    } finally {
      if (previous.audiences === undefined) delete process.env.POLICYWATCHER_ENTRA_AUDIENCES;
      else process.env.POLICYWATCHER_ENTRA_AUDIENCES = previous.audiences;
      if (previous.tenants === undefined) delete process.env.POLICYWATCHER_ENTRA_ALLOWED_TENANTS;
      else process.env.POLICYWATCHER_ENTRA_ALLOWED_TENANTS = previous.tenants;
      if (previous.gateway === undefined) delete process.env.POLICYWATCHER_APIM_SHARED_SECRET;
      else process.env.POLICYWATCHER_APIM_SHARED_SECRET = previous.gateway;
    }
  });
});
