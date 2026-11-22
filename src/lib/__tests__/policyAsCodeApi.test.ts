import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, limited } = vi.hoisted(() => ({ findFirst: vi.fn(), limited: vi.fn(() => null as NextResponse | null) }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: { policyChange: { findFirst } } }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: limited }));
import { GET } from '@/app/api/v1/insights/[changeId]/route';
import { getPublicInsight } from '@/lib/policyAsCodeData';
import { GET as schemaGET } from '@/app/schemas/insight-ir/0.1.0/route';

const ID = '11111111-1111-4111-8111-111111111111';
const call = (suffix = '', id = ID) => GET(new NextRequest(`https://policywatcher.online/api/v1/insights/${id}${suffix}`), { params: Promise.resolve({ changeId: id }) });
function publicRow() {
  return { id: ID, publicEvidence: true, publicPublishedAt: '2026-11-21T12:00:00.000Z', createdAt: '2026-11-21T11:00:00.000Z',
    tldrEn: 'A synthetic public screening.', aiSummaryEn: 'Synthetic.', riskReasonsJson: '[]', oldSnapshot: null,
    newSnapshot: { version: 1, text: 'A synthetic source.', publicEvidence: true, createdAt: '2026-11-21T10:00:00.000Z' },
    policy: { id: '22222222-2222-4222-8222-222222222222', url: 'https://example.com/policy', jurisdiction: '', ingestionMethod: 'Direct Scrape', dataStatus: 'Available' } };
}

describe('PolicyAsCode read-only public API and repository boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); limited.mockReturnValue(null); findFirst.mockResolvedValue(null); });

  it('hard-gates published public records without using the development seeded-data bypass', async () => {
    vi.stubEnv('ALLOW_SEEDED_PUBLIC_DATA', 'true');
    try {
      expect(await getPublicInsight(ID)).toBeNull();
      expect(findFirst).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
        where: expect.objectContaining({ id: ID, publicEvidence: true,
          publicPublishedAt: { not: null, lte: expect.any(Date) }, newSnapshot: { publicEvidence: true },
          policy: { ingestionMethod: { not: 'Seeded' }, dataStatus: { in: ['Available', 'Reviewed'] } },
        }),
      }));
      const selection = JSON.stringify(findFirst.mock.calls[0][0].select);
      for (const key of ['approvedBy', 'analysisEvidenceJson', 'analysisTraceId', 'engineReviews', 'password', 'email', 'tenant']) {
        expect(selection).not.toContain(key);
      }
    } finally { vi.unstubAllEnvs(); }
  });

  it('exports JSON only, forces unknown and review, and disables caches', async () => {
    findFirst.mockResolvedValue(publicRow());
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(response.headers.get('content-disposition')).toContain(`${ID}.json`);
    const body = await response.json();
    expect(body.review.approved).toBe(false);
    expect(body.decision.executionAuthorized).toBe(false);
    expect(body.source.jurisdiction).toBeNull();
    expect(body.warnings).toContain('legacy_unanchored');
  });

  it.each(['?scope=private', '?tenant=other', '?format=json', '?format=json&format=json'])('rejects mode/scope/format override %s before querying', async (query) => {
    const response = await call(query);
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('returns identical non-cacheable 404s for unknown, held and invalid IDs', async () => {
    const unknown = await call();
    findFirst.mockResolvedValue({ ...publicRow(), publicEvidence: false });
    const held = await call();
    const invalid = await call('', '../private');
    for (const response of [unknown, held, invalid]) {
      expect(response.status).toBe(404);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(await response.json()).toEqual({ error: 'Insight not found.' });
    }
  });

  it('does not expose raw provider errors in either response or logs', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      findFirst.mockRejectedValue(new Error('PRIVATE_DATABASE_CANARY secret-token'));
      const response = await call();
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('PRIVATE_DATABASE_CANARY');
      expect(log).not.toHaveBeenCalled();
      expect(response.headers.get('cache-control')).toContain('no-store');
    } finally { log.mockRestore(); }
  });

  it('preserves non-cacheable protection on rate-limit errors', async () => {
    limited.mockReturnValue(NextResponse.json({ error: 'Too many requests.' }, { status: 429 }));
    const response = await call();
    expect(response.status).toBe(429);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('serves the pinned schema locally without private data or a remote resolver', async () => {
    const response = schemaGET();
    expect(response.headers.get('content-type')).toContain('application/schema+json');
    expect((await response.json()).$id).toBe('https://policywatcher.online/schemas/insight-ir/0.1.0');
    expect(findFirst).not.toHaveBeenCalled();
  });
});
