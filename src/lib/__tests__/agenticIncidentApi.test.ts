import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/agenticIncidentService', () => ({
  getAgenticIncidentObservatory: vi.fn(),
  parseAgenticIncidentQuery: vi.fn(() => ({
    ok: true,
    value: { providerId: 'rogue-ai-tracker', limit: 20, includeVendorResponses: true },
  })),
}));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/agentic-incidents/route';
import { getAgenticIncidentObservatory } from '@/lib/agenticIncidentService';

describe('agentic incident public API revocation boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('never places provider or vendor-response state in a shared cache', async () => {
    vi.mocked(getAgenticIncidentObservatory).mockResolvedValue({ signals: [] } as never);
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/agentic-incidents'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('keeps failures no-store and fail-closed', async () => {
    vi.mocked(getAgenticIncidentObservatory).mockRejectedValue(new Error('provider unavailable'));
    const response = await GET(new NextRequest('https://policywatcher.online/api/v1/agentic-incidents'));
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/unavailable/i) });
  });

  it('publishes a read-only no-store CORS preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
