import { describe, expect, it } from 'vitest';
import {
  getEnterpriseApiManifest,
  hasOnlyQueryParameters,
  parseEnterpriseLocale,
  parseEnterprisePagination,
  parseIsoDate,
} from '../enterpriseApi';
import { getEnterpriseOpenApiDocument } from '../enterpriseOpenApi';

describe('enterprise API contract', () => {
  it('publishes the read-only Entra-authenticated capability directory', () => {
    const manifest = getEnterpriseApiManifest();

    expect(manifest.readOnly).toBe(true);
    expect(manifest.authentication).toMatchObject({
      provider: 'Microsoft Entra ID',
      delegatedScope: 'policywatcher.read',
      applicationRole: 'PolicyWatcher.Read.All',
      tenantBound: true,
    });
    expect(manifest.endpoints).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/api/v2/changes/{changeId}', method: 'GET' }),
      expect.objectContaining({ path: '/api/v2/sources/{sourceId}/continuity', method: 'GET' }),
    ]));
    expect(manifest.boundaries.join(' ')).toMatch(/raw policy text/i);
  });

  it('rejects ambiguous pagination, dates, locales and query keys', () => {
    expect(parseEnterprisePagination(new URLSearchParams())).toEqual({ page: 1, pageSize: 25 });
    expect(parseEnterprisePagination(new URLSearchParams('page=0'))).toBeNull();
    expect(parseEnterprisePagination(new URLSearchParams('pageSize=101'))).toBeNull();
    expect(parseEnterprisePagination(new URLSearchParams('page=1.5'))).toBeNull();
    expect(parseIsoDate('2026-02-29')).toBeNull();
    expect(parseIsoDate('2026-07-28')?.toISOString()).toBe('2026-07-28T00:00:00.000Z');
    expect(parseEnterpriseLocale('fr')).toBeNull();
    expect(hasOnlyQueryParameters(new URLSearchParams('page=1&unexpected=1'), ['page'])).toBe(false);
  });

  it('exposes an importable OAuth-secured OpenAPI contract', () => {
    const document = getEnterpriseOpenApiDocument({
      APP_URL: 'https://api.policywatcher.example/',
      POLICYWATCHER_ENTRA_AUDIENCES: 'api://client-id',
    });

    expect(document.openapi).toBe('3.0.3');
    expect(document.servers[0].url).toBe('https://api.policywatcher.example');
    expect(document.paths['/api/v2/changes'].get.operationId).toBe('ListPolicyChanges');
    expect(document.components.securitySchemes.entraOAuth.flows.clientCredentials.scopes)
      .toHaveProperty('api://client-id/.default');

    const schemaReferences = [...JSON.stringify(document).matchAll(/#\/components\/schemas\/([A-Za-z0-9]+)/g)]
      .map((match) => match[1]);
    expect(schemaReferences.length).toBeGreaterThan(0);
    expect(schemaReferences.every((name) => name in document.components.schemas)).toBe(true);
  });
});
