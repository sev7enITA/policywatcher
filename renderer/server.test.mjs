import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBrowserContextOptions,
  isAllowedEgressHost,
  isAuthorizedWithSecrets,
  parseUserAgentOverride,
  parseAllowedDomains,
  sanitizeTargetForLog,
  validateTargetUrl,
} from './server.mjs';

test('uses the bundled Chromium user agent unless an operator override is explicit', () => {
  assert.equal('userAgent' in buildBrowserContextOptions(null), false);
  assert.equal(buildBrowserContextOptions('PolicyWatcher-Test/1').userAgent, 'PolicyWatcher-Test/1');
});

test('rejects unsafe or oversized user-agent overrides', () => {
  assert.deepEqual(parseUserAgentOverride(''), { ok: true, value: null });
  assert.equal(parseUserAgentOverride('Mozilla/5.0\nInjected: value').ok, false);
  assert.equal(parseUserAgentOverride('x'.repeat(513)).ok, false);
});

test('accepts only explicit registrable-domain allowlist entries', () => {
  assert.deepEqual(parseAllowedDomains('example.com, EXAMPLE.com.,*.invalid.test,sub.example.com,com'), ['example.com']);
  assert.equal(isAllowedEgressHost('privacy.example.com', ['example.com']), true);
  assert.equal(isAllowedEgressHost('example.com.attacker.test', ['example.com']), false);
});

test('supports bounded primary and previous secret overlap', () => {
  assert.equal(isAuthorizedWithSecrets('Bearer current-secret', ['current-secret', 'previous-secret']), true);
  assert.equal(isAuthorizedWithSecrets('Bearer previous-secret', ['current-secret', 'previous-secret']), true);
  assert.equal(isAuthorizedWithSecrets('Bearer wrong', ['current-secret', 'previous-secret']), false);
  assert.equal(isAuthorizedWithSecrets('', []), false);
});

test('requires HTTPS and an allowlisted public DNS target', async () => {
  const lookupFn = async () => [{ address: '93.184.216.34', family: 4 }];
  assert.deepEqual(await validateTargetUrl('http://example.com/policy', { allowedDomains: ['example.com'], lookupFn }), { ok: false, reason: 'https_required' });
  assert.deepEqual(await validateTargetUrl('https://attacker.test/policy', { allowedDomains: ['example.com'], lookupFn }), { ok: false, reason: 'blocked_unlisted_domain' });
  assert.deepEqual(await validateTargetUrl('https://privacy.example.com/policy', { allowedDomains: ['example.com'], lookupFn }), { ok: true });
});

test('redacts query and fragment values from operational logs', () => {
  assert.equal(sanitizeTargetForLog('https://example.com/privacy?token=secret#section'), 'https://example.com/privacy');
});
