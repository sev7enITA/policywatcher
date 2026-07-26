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
    expect(PUBLIC_DATA_SOURCES.sourceSuspensions.evidenceGate).toBe('public-suspension');
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
  });

  it('rejects query parameters outside the source allowlist', () => {
    expect(() => buildPublicDataSourceUrl('dashboardCompanies', { admin: true })).toThrow(
      'not allowed'
    );
    expect(() => buildPublicDataSourceUrl('marketPulse', { q: 'bad\nvalue' })).toThrow(
      'invalid'
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
