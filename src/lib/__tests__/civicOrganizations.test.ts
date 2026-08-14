import { describe, expect, it } from 'vitest';
import {
  CIVIC_DIRECTORY_SCHEMA,
  CIVIC_ORGANIZATIONS,
  buildCivicSuggestionMailto,
  matchesCivicDirectory,
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
});
