import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/evidenceCollectionData', () => ({
  getPublicEvidenceCollection: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => null),
}));

import { GET, OPTIONS } from '@/app/api/v1/evidence-collections/route';
import { getPublicEvidenceCollection } from '@/lib/evidenceCollectionData';

const CHANGE_ID = '11111111-1111-4111-8111-111111111111';
const collection = {
  schema: 'https://policywatcher.online/schemas/evidence-collection/v1',
  schemaVersion: '1.0.0',
  asOf: '2026-07-29T08:00:00.000Z',
  selection: { count: 1, limit: 12, companyCount: 1, jurisdictionCount: 1, changeIds: [CHANGE_ID] },
  records: [],
  reviewChecklist: ['Review the evidence.'],
  boundary: 'Bounded public evidence collection.',
  collectionId: 'pwc_1234567890abcdef',
  contentDigest: 'a'.repeat(64),
};

describe('public evidence collection API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves deterministic JSON, Markdown and CSV projections', async () => {
    vi.mocked(getPublicEvidenceCollection).mockResolvedValue(collection as never);

    const json = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}`));
    expect(json.status).toBe(200);
    expect(json.headers.get('content-disposition')).toContain('.json');
    expect(json.headers.get('cache-control')).toContain('s-maxage=3600');
    expect((await json.json()).collectionId).toBe(collection.collectionId);

    const markdown = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}&format=markdown`));
    expect(markdown.headers.get('content-type')).toContain('text/markdown');
    expect(await markdown.text()).toContain('PolicyWatcher Evidence Collection');

    const csv = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}&format=csv`));
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(await csv.text()).toContain('change_id');
    expect(getPublicEvidenceCollection).toHaveBeenCalledWith([CHANGE_ID]);
  });

  it('rejects unknown parameters and unavailable records without partial output', async () => {
    const invalid = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}&scope=all`));
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get('access-control-allow-origin')).toBe('*');
    expect(invalid.headers.get('cache-control')).toBe('no-store');
    expect(invalid.headers.get('x-content-type-options')).toBe('nosniff');
    expect(getPublicEvidenceCollection).not.toHaveBeenCalled();

    vi.mocked(getPublicEvidenceCollection).mockResolvedValue(null);
    const unavailable = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}`));
    expect(unavailable.status).toBe(404);
    expect(unavailable.headers.get('cache-control')).toBe('no-store');
    expect(await unavailable.json()).toEqual({ error: 'The requested public evidence collection is not available.' });
  });

  it('publishes a bounded cross-origin preflight contract', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
