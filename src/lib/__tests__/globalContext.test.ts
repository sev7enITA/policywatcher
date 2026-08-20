import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GLOBAL_CONTEXT,
  localizedCivicPath,
  normalizeGlobalContext,
  parseGlobalContext,
  resolveDashboardRegion,
  resolvePlatformLanguage,
} from '../globalContext';

describe('global context', () => {
  it('fails closed on malformed or expanded storage payloads', () => {
    expect(parseGlobalContext(null)).toBeNull();
    expect(parseGlobalContext('{bad')).toBeNull();
    expect(parseGlobalContext(JSON.stringify({ ...DEFAULT_GLOBAL_CONTEXT, extra: true }))).toBeNull();
  });

  it('derives the region from a selected country', () => {
    expect(normalizeGlobalContext({ country: 'fr', region: 'global', language: 'auto' })).toEqual({
      version: 1,
      country: 'fr',
      region: 'europe',
      language: 'auto',
    });
  });

  it('uses an honest EN fallback outside the supported Italian locale', () => {
    expect(resolvePlatformLanguage(normalizeGlobalContext({ country: 'it' }))).toBe('it');
    expect(resolvePlatformLanguage(normalizeGlobalContext({ country: 'fr' }))).toBe('en');
    expect(resolvePlatformLanguage({ ...DEFAULT_GLOBAL_CONTEXT }, 'it-IT')).toBe('it');
  });

  it('maps country context onto the dashboard region contract', () => {
    expect(resolveDashboardRegion(normalizeGlobalContext({ country: 'es' }))).toBe('EU');
    expect(resolveDashboardRegion(normalizeGlobalContext({ country: 'us' }))).toBe('US');
    expect(resolveDashboardRegion(normalizeGlobalContext({ country: 'br' }))).toBe('Global');
  });

  it('maps every Civic route to the selected localized URL', () => {
    expect(localizedCivicPath('/associazioni', 'en')).toBe('/en/associations');
    expect(localizedCivicPath('/it/associazioni', 'en')).toBe('/en/associations');
    expect(localizedCivicPath('/en/associations', 'it')).toBe('/it/associazioni');
    expect(localizedCivicPath('/trust', 'it')).toBeNull();
  });
});
