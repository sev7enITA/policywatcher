import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(() => null) }));

import { GET, OPTIONS } from '@/app/api/v1/webhook-verification-kit/route';
import { rateLimit } from '@/lib/rateLimit';

describe('webhook verification kit API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serves the public readiness contract with immutable-style cache and CORS', async () => {
    const response = GET(new NextRequest('https://policywatcher.online/api/v1/webhook-verification-kit'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(body).toMatchObject({
      status: 'readiness-contract',
      deliveryAvailable: false,
      testVector: {
        verificationMode: 'signature-compatibility-only',
        freshnessReferenceSeconds: 1_785_326_400,
      },
    });
    expect(body.testVectorInstructions).toHaveLength(3);
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      max: 60,
      logClientIp: false,
    }));
  });

  it('publishes a read-only preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
