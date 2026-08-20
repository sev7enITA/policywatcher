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
    expect(manifest.rateLimit.overrides).toEqual(expect.arrayContaining([
      expect.objectContaining({ endpoint: '/api/v1/evidence-collections', requests: 30 }),
      expect.objectContaining({ endpoint: '/api/v1/change-events', requests: 30 }),
    ]));
    expect(manifest.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'observatoryRegistry',
        endpoint: '/api/v1/observatory',
        evidenceGate: 'public-reference',
      }),
      expect.objectContaining({
        id: 'publicationReadiness',
        endpoint: '/api/v1/publication-readiness',
        evidenceGate: 'public-reference',
      }),
      expect.objectContaining({
        id: 'evidenceCollections',
        endpoint: '/api/v1/evidence-collections',
        allowedQueryParams: ['changes', 'format'],
        evidenceGate: 'public-change',
      }),
      expect.objectContaining({
        id: 'publicChangeEvents',
        endpoint: '/api/v1/change-events',
        allowedQueryParams: ['cursor', 'lang', 'limit'],
        evidenceGate: 'public-change',
      }),
      expect.objectContaining({
        id: 'webhookVerificationKit',
        endpoint: '/api/v1/webhook-verification-kit',
        allowedQueryParams: [],
        evidenceGate: 'public-reference',
      }),
      expect.objectContaining({
        id: 'webhookConformanceSuite',
        endpoint: '/api/v1/webhook-conformance-suite',
        allowedQueryParams: [],
        evidenceGate: 'public-reference',
      }),
    ]));
    expect(manifest.releaseEvidence).toMatchObject({
      endpoint: '/api/v1/release-evidence',
      schema: '/schemas/release-evidence-ledger/v1',
      humanReview: '/pulse/two-week-release-impact',
    });
    expect(manifest.publicationReadiness).toMatchObject({
      endpoint: '/api/v1/publication-readiness',
      schema: '/schemas/publication-readiness/v1',
      cache: 'no-store',
    });
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
    expect(english.registry.verifiedAt).toBe('17 August 2026');
    expect(english.registry.boundary).toMatch(/not automatically ingested/i);
    expect(english.sources).toHaveLength(italian.sources.length);
    expect(english.sources).toHaveLength(8);
    expect(english.sources.find((source) => source.id === 'ai-observatory')).toMatchObject({
      url: 'https://www.ai-observatory.org/',
      evidenceStatus: 'source-review',
      evidenceReady: false,
      evidenceRole: 'research-context',
    });
    expect(english.metaObservatory.metrics).toMatchObject({
      censusSources: 8,
      evidenceReadySources: 7,
      sourcesUnderReview: 1,
      insightLenses: 3,
    });
    expect(english.metaObservatory.trustRule).toMatch(/no single-source synthesis/i);
    expect(english.metaObservatory.insights).toHaveLength(3);
    expect(english.signals[0]?.title).not.toBe(italian.signals[0]?.title);
    expect(english.signals.slice(0, 3).map((signal) => signal.id)).toEqual([
      'eu-ai-act-article-50-in-force-2026',
      'eu-ai-act-gpai-full-enforcement-2026',
      'eu-ai-literacy-supervision-2026',
    ]);
    expect(english.events.every((event) => /^https:\/\//.test(event.href))).toBe(true);
  });
});
