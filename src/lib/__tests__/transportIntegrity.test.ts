import { EventEmitter } from 'node:events';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';

type Reply = { status?: number; headers?: Record<string, string>; chunks?: Buffer[];
  complete?: boolean; aborted?: boolean; event?: 'error' | 'aborted' | 'close'; rstCode?: number };
const harness = vi.hoisted(() => ({ direct: [] as Reply[], h2: [] as Reply[] }));
vi.mock('dns/promises', () => ({ lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]) }));
vi.mock('https', () => ({ default: {
  request: vi.fn((_options: unknown, callback: (res: unknown) => void) => {
    const request = new EventEmitter() as EventEmitter & { end(): void };
    request.end = () => queueMicrotask(() => {
      const reply = harness.direct.shift(); if (!reply) throw new Error('Unexpected direct request');
      const response = new EventEmitter() as EventEmitter & { headers: Record<string,string>; statusCode: number;
        complete?: boolean; aborted: boolean; destroy(): void };
      response.headers = reply.headers ?? {}; response.statusCode = reply.status ?? 200;
      response.complete = reply.complete; response.aborted = Boolean(reply.aborted);
      response.destroy = () => { response.emit('close'); };
      callback(response);
      for (const chunk of reply.chunks ?? []) response.emit('data', chunk);
      if (reply.event === 'error') response.emit('error', new Error('PRIVATE-CANARY'));
      else if (reply.event) response.emit(reply.event);
      response.emit('end'); response.emit('close');
    });
    return request;
  }),
} }));
vi.mock('http', () => ({ default: { request: () => { throw new Error('Unexpected HTTP request'); } } }));
vi.mock('http2', () => ({ connect: vi.fn((_origin: string, _options: unknown, ready: () => void) => {
  const client = new EventEmitter() as EventEmitter & { close(): void; destroy(): void; request(): EventEmitter };
  client.close = () => {}; client.destroy = () => {};
  client.request = () => {
    const reply = harness.h2.shift(); if (!reply) throw new Error('Unexpected HTTP/2 request');
    const req = new EventEmitter() as EventEmitter & { close(): void; end(): void; rstCode?: number };
    req.close = () => { req.emit('close'); }; req.rstCode = reply.rstCode;
    req.end = () => queueMicrotask(() => {
      req.emit('response', { ':status': reply.status ?? 200, ...reply.headers });
      for (const chunk of reply.chunks ?? []) req.emit('data', chunk);
      if (reply.event === 'error') req.emit('error', new Error('PRIVATE-CANARY'));
      else if (reply.event) req.emit(reply.event);
      req.emit('end'); req.emit('close');
    }); return req;
  };
  queueMicrotask(ready); return client;
}) }));

import { acquireEngineTransport, readBoundedFetchBody, readBoundedFetchBodyWithProof,
  decodeBoundedResponseBody, MAX_NETWORK_RESPONSE_BYTES } from '../scraper';

const URL = 'https://public.example/privacy?private=PRIVATE-CANARY';
const BODY = Buffer.from('<main>Privacy 🧪 Policy</main>');
afterEach(() => { harness.direct.length = 0; harness.h2.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('HTTP/1 raw transport integrity (offline event-driven protocol substitutes)', () => {
  it('compares encoded bytes before gzip decoding and records only transport facts', async () => {
    const wire = gzipSync(BODY); harness.direct.push({ complete: true, headers: { 'content-length': String(wire.length), 'content-encoding': 'gzip' }, chunks: [wire] });
    const result = await acquireEngineTransport(URL, 'direct');
    expect(result).toMatchObject({ ok: true, html: BODY.toString(), transportProof: { protocol: 'http1', byteRepresentation: 'encoded', receivedBytes: wire.length,
      declaredContentLength: wire.length, framing: 'complete', lengthCheck: 'matched', decoding: 'completed', entityCompleteness: 'not_proven' } });
    expect(JSON.stringify(result.transportProof)).not.toContain('PRIVATE-CANARY');
  });
  it('rejects a short body even if the response emits end and complete=true', async () => {
    harness.direct.push({ complete: true, headers: { 'content-length': '900' }, chunks: [BODY] });
    await expect(acquireEngineTransport(URL, 'direct')).rejects.toMatchObject({ message: 'response_length_mismatch', transportProof: { receivedBytes: BODY.length, lengthCheck: 'mismatch' } });
  });
  it.each(['aborted','error','close'] as const)('rejects premature %s without exposing exception text', async event => {
    harness.direct.push({ complete: false, chunks: [BODY], event });
    try { await acquireEngineTransport(URL, 'direct'); throw new Error('Should not accept'); }
    catch (error) { expect(error).toMatchObject({ transportProof: { framing: 'incomplete', streamEnd: 'not_observed' } }); expect(String(error)).not.toContain('PRIVATE-CANARY'); }
  });
  it('rejects complete=false even when the advertised length matches', async () => {
    harness.direct.push({ complete: false, headers: { 'content-length': String(BODY.length) }, chunks: [BODY] });
    await expect(acquireEngineTransport(URL, 'direct')).rejects.toMatchObject({ message: 'response_incomplete' });
  });
  it('rejects excess bytes rather than accepting a shorter advertised response', async () => {
    harness.direct.push({ complete: true, headers: { 'content-length': '1' }, chunks: [BODY] });
    await expect(acquireEngineTransport(URL, 'direct')).rejects.toMatchObject({ message: 'response_length_mismatch' });
  });
  it('keeps absent framing and length metadata unknown instead of claiming source completeness', async () => {
    harness.direct.push({ chunks: [BODY] });
    expect(await acquireEngineTransport(URL, 'direct')).toMatchObject({ ok: true, transportProof: { framing: 'unknown', lengthCheck: 'not_declared', declaredContentLength: null, entityCompleteness: 'not_proven' } });
  });
  it('rejects unsolicited206 and corrupt compression before returning policy content', async () => {
    harness.direct.push({ status: 206, complete: true, chunks: [BODY] });
    await expect(acquireEngineTransport(URL, 'direct')).rejects.toMatchObject({ message: 'http_206_partial_response', httpStatus: 206 });
    harness.direct.push({ complete: true, headers: { 'content-encoding': 'gzip' }, chunks: [BODY] });
    await expect(acquireEngineTransport(URL, 'direct')).rejects.toMatchObject({ message: 'response_decode_failed', transportProof: { decoding: 'failed' } });
  });
  it('joins byte chunks before decoding a multibyteUTF8 boundary', async () => {
    const split = BODY.indexOf(Buffer.from('🧪')) + 2;
    harness.direct.push({ complete: true, chunks: [BODY.subarray(0,split), BODY.subarray(split)] });
    expect((await acquireEngineTransport(URL, 'direct')).html).toBe(BODY.toString());
  });
  it('does not compare304 metadata Content-Length with an absent response body', async () => {
    harness.direct.push({ status: 304, complete: true, headers: { 'content-length': '900' } });
    expect(await acquireEngineTransport(URL, 'direct')).toMatchObject({ status: 304, transportProof: { lengthCheck: 'not_comparable', receivedBytes: 0 } });
  });
});

describe('HTTP/2 stream integrity (offline event-driven protocol substitutes)', () => {
  it('retains declared length beyond the headers callback and rejects short streams', async () => {
    harness.h2.push({ headers: { 'content-length': '900' }, chunks: [BODY], rstCode: 0 });
    expect(await acquireEngineTransport(URL, 'http2')).toMatchObject({ ok: false, html: '', error: 'h2_response_length_mismatch', transportProof: { lengthCheck: 'mismatch' } });
  });
  it('checks raw compressed length then decodes the exact Unicode response', async () => {
    const wire = gzipSync(BODY); harness.h2.push({ headers: { 'content-length': String(wire.length), 'content-encoding': 'gzip' }, chunks: [wire], rstCode: 0 });
    expect(await acquireEngineTransport(URL, 'http2')).toMatchObject({ ok: true, html: BODY.toString(), transportProof: { receivedBytes: wire.length, lengthCheck: 'matched', byteRepresentation: 'encoded' } });
  });
  it.each([{ status: 206 }, { event: 'aborted' }, { event: 'close' }, { rstCode: 8 }] as Reply[])('rejects partial or reset streams (%j)', async reply => {
    harness.h2.push({ chunks: [BODY], ...reply });
    expect(await acquireEngineTransport(URL, 'http2')).toMatchObject({ ok: false, html: '', transportProof: { framing: 'incomplete' } });
  });
});

describe('Fetch streams distinguish decoded bytes from Content-Length', () => {
  it('does not compare a decoded body to its compressed wire Content-Length', async () => {
    const compressed = gzipSync(BODY); const response = new Response(BODY, { headers: { 'content-encoding': 'gzip', 'content-length': String(compressed.length) } });
    const result = await readBoundedFetchBodyWithProof(response);
    expect(result.body).toEqual(BODY);
    expect(result.transportProof).toMatchObject({ protocol: 'fetch', byteRepresentation: 'decoded', receivedBytes: BODY.length,
      declaredContentLength: compressed.length, lengthCheck: 'not_comparable', framing: 'unknown', entityCompleteness: 'not_proven' });
  });
  it('rejects short identity bodies and stream read failures', async () => {
    await expect(readBoundedFetchBody(new Response('short', { headers: { 'content-length': '20' } }))).rejects.toMatchObject({ message: 'response_length_mismatch' });
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([65])); controller.error(new Error('PRIVATE-CANARY')); } });
    await expect(readBoundedFetchBody(new Response(stream))).rejects.toMatchObject({ message: 'response_stream_failed', transportProof: { framing: 'incomplete' } });
  });
  it('accepts a headerless bounded stream with explicit unknown framing', async () => {
    expect((await readBoundedFetchBodyWithProof(new Response('policy'))).transportProof).toMatchObject({ declaredContentLength: null, lengthCheck: 'not_declared', framing: 'unknown' });
  });
  it('rejects unsolicited206 but preserves only an exact explicitly requested WARC record range', async () => {
    await expect(readBoundedFetchBody(new Response('abc', { status: 206 }))).rejects.toThrow('http_206_partial_response');
    const headers = { 'content-range': 'bytes 20-22/100', 'content-length': '3' };
    await expect(readBoundedFetchBody(new Response('abc', { status: 206, headers }), 100,
      { scope: 'archive_response', expectedByteRange: { start: 20, end: 22 } })).resolves.toEqual(Buffer.from('abc'));
    await expect(readBoundedFetchBody(new Response('ab', { status: 206, headers: { 'content-range': 'bytes 20-22/100' } }), 100,
      { scope: 'archive_response', expectedByteRange: { start: 20, end: 22 } })).rejects.toThrow('response_range_length_mismatch');
  });
  it('does not accept ignored or inconsistent archive byte ranges', async () => {
    await expect(readBoundedFetchBody(new Response('abc'), 100,
      { scope: 'archive_response', expectedByteRange: { start: 20, end: 22 } })).rejects.toThrow('response_range_not_honored');
    await expect(readBoundedFetchBody(new Response('abc', { status: 206, headers: { 'content-range': 'bytes 20-22/21' } }), 100,
      { scope: 'archive_response', expectedByteRange: { start: 20, end: 22 } })).rejects.toThrow('http_206_partial_response');
  });
  it('preserves encoded and decoded resource caps and rejects unsupported compression', async () => {
    await expect(readBoundedFetchBody(new Response('x'.repeat(17)), 16)).rejects.toThrow('response_body_too_large');
    await expect(decodeBoundedResponseBody(gzipSync('x'.repeat(100)), 'gzip', 16)).rejects.toThrow('decompressed_body_too_large');
    await expect(decodeBoundedResponseBody(Buffer.alloc(MAX_NETWORK_RESPONSE_BYTES+1), '')).rejects.toThrow('response_body_too_large');
    await expect(decodeBoundedResponseBody(BODY, 'unknown')).rejects.toThrow('unsupported_content_encoding');
  });
});

describe('rendered acquisition keeps origin partial status and API response limits explicit', () => {
  it('rejects renderer payload status206 even when the API status is200', async () => {
    vi.stubEnv('RENDERER_URL', 'https://renderer.example'); vi.stubEnv('RENDERER_SECRET', 'synthetic-secret');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ html: '<main>Partial policy</main>', status: 206 }), { headers: { 'content-type': 'application/json' } })));
    expect(await acquireEngineTransport(URL, 'rendered')).toMatchObject({ ok: false, html: '', status: 206, error: 'renderer_partial_response' });
  });
  it('does not read an unbounded renderer JSON body', async () => {
    vi.stubEnv('RENDERER_URL', 'https://renderer.example'); vi.stubEnv('RENDERER_SECRET', 'synthetic-secret');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { headers: { 'content-length': String(MAX_NETWORK_RESPONSE_BYTES+1) } })));
    expect(await acquireEngineTransport(URL, 'rendered')).toMatchObject({ ok: false, html: '', error: 'renderer_error:response_body_too_large' });
  });
});
