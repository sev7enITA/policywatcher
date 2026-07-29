import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_DATA_SOURCES,
  PUBLIC_DATA_SOURCE_ISSUES,
  buildPublicDataSourceUrl,
  getPublicDataSourceQueryKey,
  loadPublicDataSource,
  validatePublicDataSourceRegistry,
  type PublicDataSourceSpec,
} from '../dataSourceRegistry';

describe('public data-source registry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ships a valid immutable registry with explicit evidence gates', () => {
    expect(PUBLIC_DATA_SOURCE_ISSUES).toEqual([]);
    expect(Object.isFrozen(PUBLIC_DATA_SOURCES)).toBe(true);
    expect(PUBLIC_DATA_SOURCES.dashboardCompanies).toMatchObject({
      endpoint: '/api/companies',
      visibilityContext: 'public',
      evidenceGate: 'public-policy',
    });
    expect(PUBLIC_DATA_SOURCES.marketPulse.evidenceGate).toBe('public-change');
    expect(PUBLIC_DATA_SOURCES.companyComparison).toMatchObject({
      endpoint: '/api/compare',
      evidenceGate: 'public-change',
      allowedQueryParams: ['companyA', 'companyB'],
    });
    expect(PUBLIC_DATA_SOURCES.policyDetails).toMatchObject({
      endpoint: '/api/policies/{policyId}',
      evidenceGate: 'public-change',
      allowedPathParams: ['policyId'],
    });
    expect(PUBLIC_DATA_SOURCES.sourceSuspensions.evidenceGate).toBe('public-suspension');
    expect(PUBLIC_DATA_SOURCES.sourceContinuity).toMatchObject({
      endpoint: '/api/source-continuity',
      evidenceGate: 'public-suspension',
      allowedQueryParams: [],
    });
    expect(PUBLIC_DATA_SOURCES.observatoryRegistry).toMatchObject({
      endpoint: '/api/v1/observatory',
      evidenceGate: 'public-reference',
      allowedQueryParams: ['lang'],
    });
    expect(PUBLIC_DATA_SOURCES.evidenceCollections).toMatchObject({
      endpoint: '/api/v1/evidence-collections',
      allowedQueryParams: ['changes', 'format'],
      evidenceGate: 'public-change',
    });
  });

  it('builds canonical URLs and visibility-scoped query keys', () => {
    expect(
      buildPublicDataSourceUrl('marketPulse', {
        pageSize: 50,
        industry: 'FinTech',
        page: 1,
        q: undefined,
      })
    ).toBe('/api/changes?industry=FinTech&page=1&pageSize=50');
    expect(getPublicDataSourceQueryKey('riskTrends', { industry: 'FinTech' })).toBe(
      'public:public-change:/api/trends?industry=FinTech'
    );
    expect(buildPublicDataSourceUrl('policyDetails', { policyId: 'policy_123-safe' })).toBe(
      '/api/policies/policy_123-safe'
    );
    expect(buildPublicDataSourceUrl('companyComparison', {
      companyB: 'industry-average',
      companyA: 'company-1',
    })).toBe('/api/compare?companyA=company-1&companyB=industry-average');
    expect(buildPublicDataSourceUrl('sourceContinuity')).toBe('/api/source-continuity');
    expect(buildPublicDataSourceUrl('observatoryRegistry', { lang: 'it' })).toBe(
      '/api/v1/observatory?lang=it'
    );
  });

  it('rejects query parameters outside the source allowlist', () => {
    expect(() => buildPublicDataSourceUrl('dashboardCompanies', { admin: true })).toThrow(
      'not allowed'
    );
    expect(() => buildPublicDataSourceUrl('marketPulse', { q: 'bad\nvalue' })).toThrow(
      'invalid'
    );
    expect(() => buildPublicDataSourceUrl('policyDetails')).toThrow('Path parameter policyId is invalid');
    expect(() => buildPublicDataSourceUrl('policyDetails', { policyId: '../admin' })).toThrow(
      'Path parameter policyId is invalid'
    );
  });

  it('detects invalid local endpoints without mutating the candidate', () => {
    const invalid = {
      ...PUBLIC_DATA_SOURCES,
      dashboardCompanies: {
        ...PUBLIC_DATA_SOURCES.dashboardCompanies,
        endpoint: 'https://remote.example/data',
      },
    } as unknown as Readonly<Record<keyof typeof PUBLIC_DATA_SOURCES, PublicDataSourceSpec>>;
    const before = JSON.stringify(invalid);

    expect(validatePublicDataSourceRegistry(invalid)).toEqual([
      expect.objectContaining({ code: 'source.endpoint_invalid' }),
    ]);
    expect(JSON.stringify(invalid)).toBe(before);
  });

  it('coalesces identical in-flight public loads and returns provenance', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ changes: [{ id: 'change-1' }] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      loadPublicDataSource<{ changes: Array<{ id: string }> }>('marketPulse', { page: 1 }),
      loadPublicDataSource<{ changes: Array<{ id: string }> }>('marketPulse', { page: 1 }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual(second.data);
    expect(first.provenance).toMatchObject({
      sourceId: 'marketPulse',
      evidenceGate: 'public-change',
      visibilityContext: 'public',
    });
  });
});
