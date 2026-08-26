import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/publicChangeEventData', () => ({ getPublicChangeEventRow: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/integrations/palo/signal/route';
import { getPublicChangeEventRow } from '@/lib/publicChangeEventData';
import type { PublicChangeEventRow } from '@/lib/publicChangeEvents';

const CHANGE_ID = '11111111-1111-4111-8111-111111111111';
const paloSignalTestRow: PublicChangeEventRow = {
  id: CHANGE_ID,
  publicPublishedAt: '2026-08-26T10:00:00.000Z',
  overallRisk: 'Medium',
  overallScore: 5,
  tldrEn: 'Alpha published a public policy change.',
  tldrIt: 'Alpha ha pubblicato una modifica della policy.',
  aiSummaryEn: 'English fallback.',
  aiSummaryIt: 'Fallback italiano.',
  policy: {
    id: 'policy-1',
    name: 'AI Policy',
    type: 'ai',
    jurisdiction: 'EU',
    company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' },
  },
};

describe('PALO handoff API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves one public PALO signal as downloadable JSON without caching revocable evidence', async () => {
    vi.mocked(getPublicChangeEventRow).mockResolvedValue(paloSignalTestRow);
    const response = await GET(new NextRequest(
      `https://policywatcher.online/api/v1/integrations/palo/signal?changeId=${CHANGE_ID}&lang=en`,
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-disposition')).toContain(`policywatcher-palo-signal-${CHANGE_ID}.json`);
    expect(await response.json()).toMatchObject({
      format: 'palo-policywatcher-signal',
      signalId: `signal-policywatcher-${CHANGE_ID}`,
    });
    expect(getPublicChangeEventRow).toHaveBeenCalledWith(CHANGE_ID);
  });

  it('fails closed for invalid and non-public change identifiers', async () => {
    const invalid = await GET(new NextRequest('https://policywatcher.online/api/v1/integrations/palo/signal?changeId=invalid'));
    expect(invalid.status).toBe(400);
    expect(getPublicChangeEventRow).not.toHaveBeenCalled();

    vi.mocked(getPublicChangeEventRow).mockResolvedValue(null);
    const missing = await GET(new NextRequest(
      `https://policywatcher.online/api/v1/integrations/palo/signal?changeId=${CHANGE_ID}`,
    ));
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('no-store');
  });

  it('publishes a read-only CORS preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
