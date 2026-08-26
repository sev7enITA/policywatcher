import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/publicChangeEventData', () => ({ getPublicPaloSignalBatch: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/integrations/palo/signals/route';
import { getPublicPaloSignalBatch } from '@/lib/publicChangeEventData';

describe('PALO signal batch API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves a no-store complete active snapshot page', async () => {
    vi.mocked(getPublicPaloSignalBatch).mockResolvedValue({
      format: 'palo-policywatcher-signal-batch', schemaVersion: '1.0.0', mode: 'complete-active-snapshot',
      locale: 'en', count: 0, limit: 25, hasMore: false, nextCursor: null, signals: [], boundary: 'Complete traversal boundary.',
    });
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/integrations/palo/signals?limit=25&lang=en'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect((await response.json()).mode).toBe('complete-active-snapshot');
    expect(getPublicPaloSignalBatch).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en', limit: 25, cursor: null }));
  });

  it('rejects unsupported or oversized queries before reading data', async () => {
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/integrations/palo/signals?limit=100'));
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getPublicPaloSignalBatch).not.toHaveBeenCalled();
  });

  it('publishes a read-only CORS preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
