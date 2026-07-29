import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/publicChangeEventData', () => ({ getPublicChangeEventFeed: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/change-events/route';
import { getPublicChangeEventFeed } from '@/lib/publicChangeEventData';

describe('public change event API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves the bounded feed with public cache and CORS headers', async () => {
    vi.mocked(getPublicChangeEventFeed).mockResolvedValue({
      schema: 'https://policywatcher.online/schemas/change-event-feed/v1',
      schemaVersion: '1.0.0',
      mode: 'forward-polling',
      locale: 'en',
      count: 0,
      limit: 25,
      hasMore: false,
      initialWindowTruncated: false,
      nextCursor: null,
      events: [],
      boundary: 'Polling boundary.',
    });

    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/change-events?limit=25&lang=en'));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toContain('s-maxage=60');
    expect((await response.json()).mode).toBe('forward-polling');
    expect(getPublicChangeEventFeed).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en', limit: 25, cursor: null }));
  });

  it('rejects unsupported input before reading event data', async () => {
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/change-events?includePrivate=true'));
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getPublicChangeEventFeed).not.toHaveBeenCalled();
  });

  it('publishes a read-only cross-origin preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
