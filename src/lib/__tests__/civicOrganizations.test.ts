import { describe, expect, it } from 'vitest';
import {
  CIVIC_DIRECTORY_SCHEMA,
  CIVIC_DIRECTORY_STATS,
  CIVIC_ORGANIZATIONS,
  buildCivicCorrectionMailto,
  buildCivicDirectorySearch,
  buildCivicSuggestionMailto,
  matchesCivicDirectory,
  parseCivicDirectoryQuery,
} from '../civicOrganizations';

describe('global civic directory', () => {
  it('has unique, source-backed records across multiple regions', () => {
    expect(CIVIC_ORGANIZATIONS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(CIVIC_ORGANIZATIONS.map((organization) => organization.id)).size)
      .toBe(CIVIC_ORGANIZATIONS.length);
    expect(new Set(CIVIC_ORGANIZATIONS.map((organization) => organization.region)).size)
      .toBeGreaterThanOrEqual(5);

    for (const organization of CIVIC_ORGANIZATIONS) {
      expect(organization.schema).toBe(CIVIC_DIRECTORY_SCHEMA);
      expect(organization.website.startsWith('https://')).toBe(true);
      expect(organization.sourceUrl.startsWith('https://')).toBe(true);
      expect(organization.types.length).toBeGreaterThan(0);
    }
  });

  it('shows national, regional and global organizations in a country view', () => {
    const french = CIVIC_ORGANIZATIONS.filter((organization) => matchesCivicDirectory(organization, {
      territory: 'fr', type: 'all', query: '',
    }));
    expect(french.some((organization) => organization.id === 'fr-clcv')).toBe(true);
    expect(french.some((organization) => organization.id === 'beuc')).toBe(true);
    expect(french.some((organization) => organization.id === 'consumers-international')).toBe(true);
    expect(french.some((organization) => organization.country === 'es')).toBe(false);
  });

  it('keeps public coverage statistics derived from the catalog', () => {
    expect(CIVIC_DIRECTORY_STATS.organizations).toBe(CIVIC_ORGANIZATIONS.length);
    expect(CIVIC_DIRECTORY_STATS.countries).toBe(24);
    expect(CIVIC_DIRECTORY_STATS.digitalSpecialists).toBeGreaterThanOrEqual(40);
    expect(CIVIC_DIRECTORY_STATS.verificationSources).toBeGreaterThanOrEqual(10);
  });

  it('searches with localized protection labels', () => {
    const financial = CIVIC_ORGANIZATIONS.filter((organization) => matchesCivicDirectory(organization, {
      territory: 'global', type: 'all', query: 'servizi finanziari',
    }));
    expect(financial.some((organization) => organization.id === 'it-adusbef')).toBe(true);
    expect(financial.every((organization) => organization.types.includes('financial-services'))).toBe(true);
  });

  it('round-trips safe, shareable directory filters and preserves unrelated params', () => {
    const search = buildCivicDirectorySearch(
      { territory: 'fr', type: 'digital-rights', query: 'privacy e dati' },
      '?lang=it&civic_q=old',
    );
    expect(search).toContain('lang=it');
    expect(parseCivicDirectoryQuery(search)).toEqual({
      territory: 'fr',
      type: 'digital-rights',
      query: 'privacy e dati',
      hasExplicitFilters: true,
    });
    expect(parseCivicDirectoryQuery('?civic_territory=invalid&civic_type=invalid')).toMatchObject({
      territory: null,
      type: null,
      hasExplicitFilters: false,
    });
  });

  it('requires HTTPS evidence before composing a bounded suggestion', () => {
    expect(buildCivicSuggestionMailto({
      name: 'Example', country: 'Italy', website: 'http://example.org', sourceUrl: 'https://registry.test', focus: '',
    })).toBeNull();

    const mailto = buildCivicSuggestionMailto({
      name: 'Example\nAssociation',
      country: 'Italy',
      website: 'https://example.org/path#section',
      sourceUrl: 'https://registry.test/member',
      focus: 'Digital contracts',
    });
    expect(mailto).toContain('mailto:info@policywatcher.online');
    expect(mailto).toContain('Digital%20contracts');
    expect(mailto).not.toContain('%0AAssociation');
  });

  it('prepares a bounded correction request for an existing listing', () => {
    expect(buildCivicCorrectionMailto({
      organizationId: 'example', name: 'Example', website: 'http://example.org', sourceUrl: 'https://registry.test',
    })).toBeNull();

    const mailto = buildCivicCorrectionMailto({
      organizationId: 'it-example',
      name: 'Example Association',
      website: 'https://example.org',
      sourceUrl: 'https://registry.test/member',
    });
    expect(mailto).toContain('mailto:info@policywatcher.online');
    expect(mailto).toContain('Civic%20directory%20correction');
    expect(mailto).toContain('Listing%20ID%3A%20it-example');
    expect(mailto).toContain('does%20not%20update%20the%20directory%20automatically');
  });
});
