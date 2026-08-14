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
  records: [{
    changeId: CHANGE_ID,
    screeningDate: '2026-07-29T08:00:00.000Z',
    company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' },
    policy: { id: 'policy-1', name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', sourceUrl: 'https://example.com/privacy' },
    sourceConfidence: { state: 'available', lastCheckedAt: '2026-07-29T07:00:00.000Z', retrievalChannel: 'direct', limitation: 'Point-in-time retrieval state.' },
    currentSnapshot: { version: 2, sha256: 'b'.repeat(64), capturedAt: '2026-07-29T07:30:00.000Z' },
    assessment: {
      summary: 'Recorded public change.',
      overallRisk: 'Medium',
      overallScore: 5,
      scoreDelta: null,
      direction: 'stable',
      reasons: [],
      explanationBoundary: 'AI-assisted screening output for human review.',
    },
    governance: { mappedFrameworks: [], boundary: 'Advisory review relevance only.' },
    reviewQuestions: ['Confirm relevance to the intended review scope.'],
    links: {
      change: `https://policywatcher.online/change/${CHANGE_ID}`,
      evidence: `https://policywatcher.online/evidence/${CHANGE_ID}`,
      json: `https://policywatcher.online/api/evidence-packet/${CHANGE_ID}?format=json`,
      pdf: `https://policywatcher.online/api/evidence-packet/${CHANGE_ID}?format=pdf`,
    },
    evidencePacketDigest: 'c'.repeat(64),
    boundary: 'Review evidence only.',
  }],
  reviewChecklist: ['Review the evidence.'],
  boundary: 'Bounded public evidence collection.',
  collectionId: 'pwc_1234567890abcdef',
  contentDigest: 'a'.repeat(64),
};

describe('public evidence collection API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves deterministic JSON, Markdown, CSV and collaboration handoff projections', async () => {
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

    const handoff = await GET(new NextRequest(`https://policywatcher.online/api/v1/evidence-collections?changes=${CHANGE_ID}&format=handoff`));
    expect(handoff.headers.get('content-type')).toContain('application/vnd.policywatcher.evidence-handoff+json');
    expect(handoff.headers.get('content-disposition')).toContain('PolicyWatcher_Review_Handoff_pwh_');
    const handoffPayload = await handoff.json();
    expect(handoffPayload.collection.id).toBe(collection.collectionId);
    expect(handoffPayload.workItems[0]).toMatchObject({
      type: 'evidence-review',
      state: 'ready-for-human-triage',
    });
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
