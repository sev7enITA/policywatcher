import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';

process.env.RENDERER_SECRET = 'SYNTHETIC_LOCAL_HTTP_TEST_SECRET_32';
process.env.RENDERER_ALLOWED_DOMAINS = 'example.com';
const { createRendererServer, createBrowserGetter, validateTargetUrl } = await import('./server.mjs?http-tests');
const auth = { Authorization: 'Bearer SYNTHETIC_LOCAL_HTTP_TEST_SECRET_32', 'Content-Type': 'application/json' };
const fakeBrowser = () => ({ isConnected: () => true, version: () => '149.0.0.0', on() {} });
const syntheticRender = async url => ({ html: '<html><body>synthetic only</body></html>', finalUrl: url, status: 200 });
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
async function setup(t, options = {}) {
  const server = createRendererServer({ capacity: 1, browser: async () => fakeBrowser(), validateUrl: async () => ({ ok: true }), render: syntheticRender, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const ready = async () => (await fetch(origin + '/readyz', { headers: auth })).json();
  const post = (body = JSON.stringify({ url: 'https://example.com/policy' })) => fetch(origin + '/render', { method: 'POST', headers: auth, body });
  return { origin, ready, post };
}
async function waitForIdle(ready) {
  for (let i = 0; i < 30; i++) { const status = await ready(); assert(status.active >= 0); if (status.active === 0) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.fail('Reservation was not released within the bounded local observation.');
}

test('reserves before asynchronous validation; a second real HTTP request receives 429 at capacity one', async t => {
  const entered = deferred(), validation = deferred(); let renders = 0;
  t.after(() => validation.resolve({ ok: true }));
  const { post, ready } = await setup(t, { validateUrl: async () => { entered.resolve(); return validation.promise; }, render: async url => { renders++; return syntheticRender(url); } });
  const first = post(); await entered.promise;
  assert.equal((await ready()).active, 1);
  const busy = await post(); assert.equal(busy.status, 429); assert.equal(busy.headers.get('retry-after'), '5');
  assert.equal((await ready()).active, 1); assert.equal(renders, 0);
  validation.resolve({ ok: true }); assert.equal((await first).status, 200);
  await waitForIdle(ready); assert.equal(renders, 1);
});

for (const [name, options, body, expected] of [
  ['malformed JSON', {}, '{', 400],
  ['missing URL', {}, '{}', 400],
  ['denied target', { validateUrl: async () => ({ ok: false, reason: 'blocked_private_address' }) }, undefined, 400],
  ['DNS exception', { validateUrl: async () => { throw Error('dns_lookup_failed'); } }, undefined, 502],
  ['render exception', { render: async () => { throw Error('synthetic_render_failure'); } }, undefined, 502],
  ['oversized body', {}, 'x'.repeat(20_000), 413],
  ['validation deadline', { validationTimeoutMs: 20, validateUrl: () => new Promise(() => {}) }, undefined, 502],
]) test(`releases its reservation after ${name}`, async t => {
  const { post, ready } = await setup(t, options); assert.equal((await post(body)).status, expected); await waitForIdle(ready);
});

test('times out a stalled HTTP body and returns 408 without retaining a reservation', async t => {
  const { origin, ready } = await setup(t, { bodyTimeoutMs: 30 });
  const status = await new Promise((resolve, reject) => {
    const req = request(origin + '/render', { method: 'POST', headers: auth }, res => { res.resume(); res.on('end', () => { req.destroy(); resolve(res.statusCode); }); });
    req.on('error', reject); req.write('{');
  });
  assert.equal(status, 408); await waitForIdle(ready);
});

test('releases a partial-body client disconnect without an unhandled stream error', async t => {
  const { origin, ready } = await setup(t);
  const req = request(origin + '/render', { method: 'POST', headers: auth }); req.on('error', () => {}); req.write('{');
  for (let i = 0; i < 30 && (await ready()).active === 0; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal((await ready()).active, 1); req.destroy(); await waitForIdle(ready);
});

test('cancels rendering when the response connection closes and releases the slot', async t => {
  const entered = deferred(); let cancelled = false;
  const { origin, ready } = await setup(t, { render: (_url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => { cancelled = true; reject(Error('synthetic_cancel')); }, { once: true }); entered.resolve();
  }) });
  const req = request(origin + '/render', { method: 'POST', headers: auth }); req.on('error', () => {}); req.end(JSON.stringify({ url: 'https://example.com/policy' }));
  await entered.promise; assert.equal((await ready()).active, 1); req.destroy(); await waitForIdle(ready); assert.equal(cancelled, true);
});

test('does not reserve capacity for unauthorized or unknown routes', async t => {
  const { origin, ready } = await setup(t);
  assert.equal((await fetch(origin + '/render', { method: 'POST', body: '{}' })).status, 401);
  assert.equal((await fetch(origin + '/unknown', { headers: auth })).status, 404);
  assert.equal((await ready()).active, 0);
});

test('an unsuccessful browser launch remains a 503, then a fresh readiness request can recover', async t => {
  let attempts = 0;
  const browser = createBrowserGetter(async () => { attempts++; if (attempts === 1) throw Error('synthetic_initial_failure'); return fakeBrowser(); });
  const { origin } = await setup(t, { browser });
  assert.equal((await fetch(origin + '/readyz', { headers: auth })).status, 503);
  assert.equal((await fetch(origin + '/readyz', { headers: auth })).status, 200);
  assert.equal(attempts, 2);
});

test('concurrent launch waiters share failure; retry and disconnected events do not clear a newer browser', async () => {
  const first = deferred(); let attempts = 0; const handlers = []; const browsers = [];
  const getBrowser = createBrowserGetter(() => {
    attempts++; if (attempts === 1) return first.promise;
    const browser = { ...fakeBrowser(), on: (_event, handler) => handlers.push(handler) }; browsers.push(browser); return browser;
  });
  const waiting = Promise.allSettled([getBrowser(), getBrowser(), getBrowser()]);
  first.reject(Error('synthetic_shared_failure')); assert((await waiting).every(result => result.status === 'rejected')); assert.equal(attempts, 1);
  assert.equal(await getBrowser(), browsers[0]); assert.equal(attempts, 2);
  handlers[0](); assert.equal(await getBrowser(), browsers[1]); assert.equal(attempts, 3);
  handlers[0](); assert.equal(await getBrowser(), browsers[1]); assert.equal(attempts, 3);
});

test('a DNS lookup has its own deadline without making an external request', async () => {
  assert.deepEqual(await validateTargetUrl('https://example.com/policy', { allowedDomains: ['example.com'], dnsTimeoutMs: 10, lookupFn: () => new Promise(() => {}) }), { ok: false, reason: 'dns_lookup_failed' });
});

test('shutdown does not launch a browser and closes an already launched browser only once', async () => {
  let attempts = 0, closes = 0;
  const browser = createBrowserGetter(async () => { attempts++; return { ...fakeBrowser(), close: async () => { closes++; } }; });
  await browser.close(); assert.equal(attempts, 0);
  await browser(); await browser.close(); await browser.close();
  assert.equal(attempts, 1); assert.equal(closes, 1);
});
