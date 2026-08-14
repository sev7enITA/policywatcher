import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/webhook-conformance-suite/route';
import { rateLimit } from '@/lib/rateLimit';

describe('webhook conformance suite API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves eight deterministic cases with read-only CORS and cache controls', async () => {
    const response = GET(new NextRequest('https://policywatcher.online/api/v1/webhook-conformance-suite'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(body).toMatchObject({
      suiteVersion: '1.0.0',
      executionMode: 'local-receiver',
      deliveryAvailable: false,
      caseCount: 8,
      expectedSummary: { passed: 8, failed: 0 },
    });
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      max: 60,
      logClientIp: false,
    }));
  });

  it('publishes a GET-only preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
