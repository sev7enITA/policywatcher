import { EventEmitter } from 'node:events';
import { lookup } from 'node:dns/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  replies: [] as Array<{ status: number; location?: string; body?: string }>,
  requested: [] as string[],
  dns: [] as string[],
  destroyed: 0,
}));
vi.mock('dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    harness.dns.push(host);
    return [{ address: host === 'private.public.example' ? '127.0.0.1' : '93.184.216.34', family: 4 }];
  }),
}));
vi.mock('http2', () => ({
  connect: vi.fn((origin: string, _options: unknown, ready: () => void) => {
    const client = new EventEmitter() as EventEmitter & {
      close: () => void; destroy: () => void; request: (headers: Record<string, string>) => EventEmitter;
    };
    client.close = vi.fn();
    client.destroy = () => { harness.destroyed++; };
    client.request = headers => {
      harness.requested.push(origin + headers[':path']);
      const reply = harness.replies.shift();
      if (!reply) throw Error('Unexpected HTTP/2 request');
      const request = new EventEmitter() as EventEmitter & { close: () => void; end: () => void };
      request.close = vi.fn();
      request.end = () => queueMicrotask(() => {
        request.emit('response', { ':status': reply.status, 'content-type': 'text/html', location: reply.location });
        if (reply.body) request.emit('data', Buffer.from(reply.body));
        request.emit('end');
      });
      return request;
    };
    queueMicrotask(ready);
    return client;
  }),
}));
import { acquireEngineTransport, hasLivePathDrift } from '../scraper';

afterEach(() => {
  vi.restoreAllMocks();
  harness.replies.length = 0;
  harness.requested.length = 0;
  harness.dns.length = 0;
  harness.destroyed = 0;
});

describe('pinned HTTP/2 redirect chains', () => {
  it('follows a relative same-host redirect and reports the final document URL', async () => {
    harness.replies.push({ status: 308, location: '/legal/privacy?lang=en' }, { status: 200, body: '<main>Privacy document</main>' });
    const result = await acquireEngineTransport('https://public.example/old', 'http2');
    expect(result).toMatchObject({ ok: true, status: 200, finalUrl: 'https://public.example/legal/privacy?lang=en' });
    expect(harness.requested).toHaveLength(2);
    expect(harness.dns).toEqual(['public.example', 'public.example']);
    expect(harness.destroyed).toBe(2);
  });

  it.each(['https://unrelated.example/privacy', 'http://public.example/privacy', 'https://user:password@public.example/privacy'])('rejects an unsafe redirect destination (%s)', async location => {
    harness.replies.push({ status: 302, location });
    const result = await acquireEngineTransport('https://public.example/privacy', 'http2');
    expect(result.ok).toBe(false);
    expect(harness.requested).toHaveLength(1);
  });

  it('stops redirect loops within the configured hop limit', async () => {
    harness.replies.push(...Array.from({ length: 6 }, () => ({ status: 301, location: '/again' })));
    const result = await acquireEngineTransport('https://public.example/privacy', 'http2');
    expect(result.error).toBe('too_many_redirects');
    expect(harness.requested).toHaveLength(6);
  });

  it('rejects a private DNS answer after a same-host redirect', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as never)
      .mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }] as never);
    harness.replies.push({ status: 301, location: '/next' });
    const result = await acquireEngineTransport('https://public.example/privacy', 'http2');
    expect(result).toMatchObject({ ok: false, error: 'blocked_private_address' });
    expect(harness.requested).toHaveLength(1);
  });

  it('enforces one deadline across the redirect chain', async () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(60_000);
    harness.replies.push({ status: 301, location: '/next' });
    expect(await acquireEngineTransport('https://public.example/privacy', 'http2')).toMatchObject({ ok: false, error: 'h2_timeout' });
    expect(harness.requested).toHaveLength(1);
  });

  it('keeps homepage path drift visible to the caller', async () => {
    harness.replies.push({ status: 301, location: '/' }, { status: 200, body: '<main>Home</main>' });
    const result = await acquireEngineTransport('https://public.example/privacy', 'http2');
    expect(hasLivePathDrift('https://public.example/privacy', result.finalUrl, 'http2')).toBe(true);
  });

  it('retains a rate-limit response without following it', async () => {
    harness.replies.push({ status: 429, body: 'Rate limited' });
    expect(await acquireEngineTransport('https://public.example/privacy', 'http2')).toMatchObject({ ok: false, status: 429 });
    expect(harness.requested).toHaveLength(1);
  });
});
