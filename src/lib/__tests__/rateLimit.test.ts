import { afterEach, describe, expect, it, vi } from 'vitest';

function makeRequest(headers?: Record<string, string>) {
  return new Request('https://policywatcher.test/api/companies', { headers });
}

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('allows requests inside the bucket and rejects the next one with Retry-After', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    expect(rateLimit(makeRequest(), { intervalMs: 1000, max: 2, name: 'unit' })).toBeNull();
    expect(rateLimit(makeRequest(), { intervalMs: 1000, max: 2, name: 'unit' })).toBeNull();

    const limited = rateLimit(makeRequest(), { intervalMs: 1000, max: 2, name: 'unit' });
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get('Retry-After')).toBe('1');
    expect(warn).toHaveBeenCalledWith('[RateLimit] unit - IP local-development rate-limited. Retry in 1s.');
  });

  it('refills tokens proportionally over time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    expect(rateLimit(makeRequest(), { intervalMs: 1000, max: 1, name: 'refill' })).toBeNull();
    expect(rateLimit(makeRequest(), { intervalMs: 1000, max: 1, name: 'refill' })?.status).toBe(429);

    vi.setSystemTime(1000);
    expect(rateLimit(makeRequest(), { intervalMs: 1000, max: 1, name: 'refill' })).toBeNull();
  });

  it('does not trust spoofable proxy headers unless explicitly enabled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    expect(rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.1' }), { max: 1, name: 'proxy' })).toBeNull();
    expect(rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.2' }), { max: 1, name: 'proxy' })?.status).toBe(429);
  });

  it('fails the individual request without consuming a shared bucket when production identity is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    const first = rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.1' }), { max: 1, name: 'production' });
    const second = rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.2' }), { max: 1, name: 'production' });

    expect(first?.status).toBe(503);
    expect(second?.status).toBe(503);
    expect(await first?.json()).toMatchObject({ code: 'client_identity_unavailable' });
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('can trust provider-controlled client IP headers when configured', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'x-client-ip');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    expect(rateLimit(makeRequest({ 'x-client-ip': '203.0.113.1' }), { max: 1, name: 'trusted' })).toBeNull();
    expect(rateLimit(makeRequest({ 'x-client-ip': '203.0.113.2' }), { max: 1, name: 'trusted' })).toBeNull();
    expect(rateLimit(makeRequest({ 'x-client-ip': '203.0.113.1' }), { max: 1, name: 'trusted' })?.status).toBe(429);
  });

  it('can trust x-forwarded-for only when proxy trust is explicitly enabled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rateLimit } = await import('../rateLimit');

    expect(rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }), { max: 1, name: 'xff' })).toBeNull();
    expect(rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.11' }), { max: 1, name: 'xff' })).toBeNull();
    expect(rateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.10' }), { max: 1, name: 'xff' })?.status).toBe(429);
  });
});
