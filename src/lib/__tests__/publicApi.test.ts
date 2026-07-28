import { describe, expect, it } from 'vitest';
import {
  getPublicApiManifest,
  getPublicObservatoryPayload,
  parsePublicApiLocale,
  PUBLIC_API_VERSION,
} from '../publicApi';

describe('public integration directory', () => {
  it('publishes a bounded read-only manifest with the Observatory source', () => {
    const manifest = getPublicApiManifest();

    expect(manifest.apiVersion).toBe(PUBLIC_API_VERSION);
    expect(manifest.readOnly).toBe(true);
    expect(manifest.authentication).toBe('none');
    expect(manifest.cors).toMatchObject({ enabled: true, credentials: false });
    expect(manifest.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'observatoryRegistry',
        endpoint: '/api/v1/observatory',
        evidenceGate: 'public-reference',
      }),
    ]));
    expect(manifest.boundaries.join(' ')).toMatch(/does not expose policy text/i);
  });

  it('accepts only the documented localized Observatory variants', () => {
    expect(parsePublicApiLocale(null)).toBe('en');
    expect(parsePublicApiLocale('')).toBe('en');
    expect(parsePublicApiLocale('it')).toBe('it');
    expect(parsePublicApiLocale('fr')).toBeNull();
  });

  it('localizes the curated registry without converting it into a feed', () => {
    const english = getPublicObservatoryPayload('en');
    const italian = getPublicObservatoryPayload('it');

    expect(english.registry.mode).toBe('curated-local-registry');
    expect(english.registry.boundary).toMatch(/not automatically ingested/i);
    expect(english.sources).toHaveLength(italian.sources.length);
    expect(english.signals[0]?.title).not.toBe(italian.signals[0]?.title);
    expect(english.events.every((event) => /^https:\/\//.test(event.href))).toBe(true);
  });
});
