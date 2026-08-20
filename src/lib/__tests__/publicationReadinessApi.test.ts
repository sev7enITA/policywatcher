import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getReadiness: vi.fn(),
  serialize: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({ rateLimit: mocks.rateLimit }));
vi.mock('@/lib/publicationReadinessServer', () => ({
  getAuthoritativePublicationReadiness: mocks.getReadiness,
  serializePublicPublicationReadiness: mocks.serialize,
}));

import { GET, OPTIONS } from '@/app/api/v1/publication-readiness/route';

describe('public publication readiness endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockReturnValue(null);
    mocks.getReadiness.mockResolvedValue({ available: true });
    mocks.serialize.mockReturnValue({
      schema: 'https://policywatcher.online/schemas/publication-readiness/v1',
      metricId: 'publication-readiness',
      source: 'database',
      stages: [],
      latestCapture: { capturedAt: null, availability: 'measured' },
    });
  });

  it('publishes only the serialized authoritative metric without caching', async () => {
    const response = await GET(
      new Request('https://policywatcher.online/api/v1/publication-readiness') as never,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.json()).toMatchObject({
      schema: 'https://policywatcher.online/schemas/publication-readiness/v1',
      metricId: 'publication-readiness',
      source: 'database',
    });
    expect(mocks.getReadiness).toHaveBeenCalledTimes(1);
    expect(mocks.serialize).toHaveBeenCalledTimes(1);
  });

  it('returns the explicit unavailable payload with a 503 status', async () => {
    mocks.getReadiness.mockResolvedValue({ available: false });
    const response = await GET(
      new Request('https://policywatcher.online/api/v1/publication-readiness') as never,
    );
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('supports credential-free CORS preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });
});
