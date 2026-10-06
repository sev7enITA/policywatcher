import { describe, expect, it, vi, afterEach } from 'vitest';
import { migratePreferences } from '../src/domain/storageCodec';
import { mergeCitizenPage } from '../src/domain/citizenFeed';
import { emptyCitizenPreferences, type CitizenFeed } from '../../../shared/citizen';
import { fetchCitizenFeed } from '../src/services/citizenApi';
vi.mock('../src/services/origin', () => ({ POLICYWATCHER_ORIGIN: 'https://policywatcher.online' }));

const date = '2026-10-06T12:00:00.000Z';
const feed = (): CitizenFeed => ({ schemaVersion: '1.0', generatedAt: date, services: [{ id: 'openai', name: 'OpenAI', slug: 'openai', website: 'https://openai.com', policies: [{ id: 'privacy', name: 'Privacy', type: 'privacy', jurisdiction: 'global', sourceUrl: 'https://openai.com/privacy', lastRetrievedAt: date, freshness: 'recent', latestChange: { id: 'new', publishedAt: date } }] }], changes: [{ id: 'new', serviceId: 'openai', policyId: 'privacy', publishedAt: date, detectedAt: date, summary: { it: 'Una modifica', en: 'A change' }, kind: 'substantive', impact: 'not_assessed', evidence: [], detailPath: '/change/new', evidencePath: '/api/evidence-packet/new' }], history: { limit: 25, hasMore: true, nextCursor: 'public-cursor' }, catalogTruncated: false });
afterEach(() => vi.unstubAllGlobals());

describe('citizen companion integration boundaries', () => {
  it('migrates all200 legacy watched IDs without dropping the original collection', () => {
    const ids = Array.from({ length: 200 }, (_, i) => `company-${i}`);
    const value = migratePreferences({ version: 2, locale: 'en', watchlist: ids, explainerDismissed: true, collection: [{ changeId: 'evidence-1', title: 'Title', companyName: 'Company', status: 'reviewed', addedAt: date }] });
    expect(value.version).toBe(3);
    expect(value.citizen.followed.map(service => service.serviceId)).toEqual(ids);
    expect(value.watchlist).toEqual(ids);
    expect(value.collection[0]?.status).toBe('reviewed');
    expect(value.explainerDismissed).toBe(true);
  });
  it('preserves local country, plans and unavailable service names on rehydration', () => {
    const citizen = { ...emptyCitizenPreferences(), country: 'it', followed: [{ serviceId: 'missing', name: 'Unavailable service', slug: 'missing', plan: 'Personal' }] };
    expect(migratePreferences({ version: 3, citizen }).citizen).toEqual(citizen);
  });
  it('retains bounded pagination metadata and only sends a public cursor', async () => {
    const mocked = vi.fn().mockResolvedValue({ ok: true, json: async () => feed() });
    vi.stubGlobal('fetch', mocked);
    const result = await fetchCitizenFeed('public-cursor');
    expect(result.history).toEqual(feed().history);
    const [url, request] = mocked.mock.calls[0]!;
    expect(url).toBe('https://policywatcher.online/api/v1/citizen-feed?cursor=public-cursor');
    expect(request.credentials).toBe('omit');
    expect(request.body).toBeUndefined();
  });
  it('rejects malformed network payloads instead of inserting demonstration data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ demo: true }) }));
    await expect(fetchCitizenFeed()).rejects.toThrow('Invalid citizen feed');
  });
  it('deduplicates pages and drops evidence for services withdrawn from the fresh catalog', () => {
    const current = feed();
    expect(mergeCitizenPage(current, feed()).changes).toHaveLength(1);
    const next = { ...feed(), services: [], changes: [], history: { limit: 25, hasMore: false, nextCursor: null } };
    expect(mergeCitizenPage(current, next)).toEqual(next);
  });
});
