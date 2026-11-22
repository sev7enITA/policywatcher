import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { sha, deriveHeld129, bodyReceiptMatches, renderDecision, scopeReasons, activeChallenge, assertFreshStaticWindow, verifyImplementationFiles } from '../../../scripts/lib/held129';
const root = 'docs/reports/engine-v6-remote133-2026-11-21/';
const catalogue = JSON.parse(readFileSync(root + 'catalogue.json', 'utf8')).rows;
const report = JSON.parse(readFileSync(root + 'followup-report.json', 'utf8'));
const cases = JSON.parse(readFileSync(root + 'case-results.json', 'utf8'));
const shell = '<html lang="en"><head><script src="/app.js"></script></head><body><div id="root"></div></body></html>';
const input = { source: 'https://example.com/privacy', status: 200, html: shell, blocked: null, soft404: false, drift: false, extractionCompleted: false };

describe('residual129 source identity and immutable evidence', () => {
  it('derives the exact residual denominator without treating four earlier held extractions as qualified', () => {
    const result = deriveHeld129(catalogue, report.rows, cases);
    expect(result.rows).toHaveLength(129); expect(result.excluded).toHaveLength(4);
    expect(new Set(result.rows.map(row => new URL(row.retrievalUrl).origin)).size).toBe(69);
    expect(result.excluded.filter(source => new URL(source).hostname === 'www.mailjet.com')).toHaveLength(3);
    expect(result.excluded.filter(source => new URL(source).hostname === 'www.tiktok.com')).toHaveLength(1);
    expect(result.rows.every(row => row.languageExpectation === 'unknown')).toBe(true);
    expect(result.rows.filter(row => row.priorReason === 'transport_rejected')).toHaveLength(98);
    expect(result.rows.filter(row => row.priorReason === 'extraction_size_out_of_bounds')).toHaveLength(24);
    expect(result.rows.filter(row => row.priorReason === 'source_block_or_soft_404')).toHaveLength(3);
    expect(result.rows.filter(row => row.priorReason === 'origin_backoff')).toHaveLength(4);
  });
  it('rejects duplicates and missing source-to-receipt associations', () => {
    expect(() => deriveHeld129([catalogue[0], ...catalogue.slice(0, -1)], report.rows, cases)).toThrow('duplicate');
    const changed = structuredClone(report.rows); changed[0].scopes[0].source = 'https://other.invalid/policy';
    expect(() => deriveHeld129(catalogue, changed, cases)).toThrow('scope_mismatch');
  });
  it('rejects a body with an old matching filename but different bytes, and a matching body from the wrong window', () => {
    const fresh = Buffer.from('fresh22November'); const receipt = { kind: 'direct', observedAt: '2026-11-22T10:01:00Z', bodyHash: sha(fresh) };
    expect(bodyReceiptMatches(fresh, receipt, '2026-11-22T10:00:00Z', '2026-11-22T10:05:00Z')).toBe(true);
    expect(bodyReceiptMatches(Buffer.from('old16November'), receipt, '2026-11-22T10:00:00Z', '2026-11-22T10:05:00Z')).toBe(false);
    expect(bodyReceiptMatches(fresh, { ...receipt, observedAt: '2026-11-16T10:01:00Z' }, '2026-11-22T10:00:00Z', '2026-11-22T10:05:00Z')).toBe(false);
  });
  it('preserves selector/fragment evidence and never silently widens a missing fragment into a whole-page scope', () => {
    expect(scopeReasons('https://example.com/p?id=one#clause', 'https://example.com/p?id=two', '<main id="other">text</main>')).toEqual(['source_selector_drift', 'fragment_missing']);
    expect(scopeReasons('https://example.com/p#clause', 'https://example.com/p', '<main id="clause">text</main>')).toEqual([]);
    expect(scopeReasons('https://example.com/p#/legal', 'https://example.com/p#/legal', shell)).toContain('fragment_client_route_unreviewed');
  });
});
describe('positive rendering selection and refusal boundaries', () => {
  it('selects a current JS shell after failed static extraction, never an already extracted document', () => {
    expect(renderDecision(input)).toEqual({ eligible: true, reason: 'script_shell_after_static_failure' });
    expect(renderDecision({ ...input, extractionCompleted: true }).eligible).toBe(false);
    expect(renderDecision({ ...input, html: '<main>short ordinary page</main>' }).eligible).toBe(false);
  });
  it('recognizes a nonstandard application root and a script-only empty body, without treating ordinary substantive text plus analytics as a shell', () => {
    expect(renderDecision({ ...input, html: '<script src="/app.js"></script><body></body>' }).eligible).toBe(true);
    expect(renderDecision({ ...input, html: '<script src="/app.js"></script><div id="app-root"></div><nav>Navigation</nav>' }).eligible).toBe(true);
    expect(renderDecision({ ...input, html: '<script src="/analytics.js"></script><main>' + 'Ordinary source text. '.repeat(30) + '</main>' }).eligible).toBe(false);
  });
  it.each([401, 403, 404, 410, 429, 451, 503])('does not use rendering to work around HTTP%d', status => {
    expect(renderDecision({ ...input, status }).eligible).toBe(false);
  });
  it.each(['captcha', 'captcha_challenge', 'access_denied', 'consent_wall', 'paywall_or_login', 'maintenance'])('does not cross a %s wall', blocked => {
    expect(renderDecision({ ...input, blocked }).eligible).toBe(false);
  });
  it('allows only a non-challenge interstitial without clicking, and holds drift/soft404/PDF', () => {
    expect(renderDecision({ ...input, blocked: 'access_interstitial' }).eligible).toBe(true);
    expect(renderDecision({ ...input, drift: true }).eligible).toBe(false);
    expect(renderDecision({ ...input, soft404: true }).eligible).toBe(false);
    expect(renderDecision({ ...input, source: 'https://example.com/legal.pdf' }).eligible).toBe(false);
  });
});

describe('review-discovered false positives and source freeze', () => {
  const waf = '<script src="https://abc.token.awswaf.com/a/challenge.js"></script><div id="challenge-container"></div><script>AwsWafIntegration.getToken()</script>';
  it('never treats an active AWS WAF token challenge as a JS app, including HTTP200', () => {
    expect(activeChallenge(waf)).toBe('aws_waf_active_challenge');
    expect(renderDecision({ ...input, html: waf }).eligible).toBe(false);
    expect(renderDecision({ ...input, status: 202, html: waf }).eligible).toBe(false);
    expect(activeChallenge('<script src="https://abc.token.awswaf.com/a/challenge.js"></script><main>ordinary document</main>')).toBe(null);
  });
  it('rejects stale, reversed and future static windows without simulating a live observation', () => {
    const now = Date.parse('2026-11-22T12:00:00Z');
    expect(() => assertFreshStaticWindow('2026-11-22T10:00Z', '2026-11-22T11:00Z', now)).not.toThrow();
    for (const [a,b] of [['2026-11-20T10:00Z','2026-11-20T11:00Z'],['2026-11-22T11:00Z','2026-11-22T10:00Z'],['2026-11-23T11:00Z','2026-11-23T12:00Z']]) expect(() => assertFreshStaticWindow(a,b,now)).toThrow('static_window');
  });
  it('detects an actual implementation edit even when HEAD and generated manifest hash are unchanged', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'pw-held129-freeze-'));
    try {
      await mkdir(join(folder,'src/lib'), { recursive:true }); await writeFile(join(folder,'source.ts'),'original');
      const files = [['source.ts',sha('original')]];
      await writeFile(join(folder,'src/lib/engineImplementation.generated.json'),JSON.stringify({ files, hash:sha(JSON.stringify(files)) }));
      expect(await verifyImplementationFiles(folder)).toBe(sha(JSON.stringify(files)));
      await writeFile(join(folder,'source.ts'),'changed but manifest untouched');
      await expect(verifyImplementationFiles(folder)).rejects.toThrow('actual_implementation_changed');
    } finally { await rm(folder,{recursive:true,force:true}); }
  });
});

it('permits only a same-provider HTTPS meta refresh as an observation, never automatic identity approval', () => {
  const html = (url: string) => '<meta http-equiv="refresh" content="0;url=' + url + '">';
  expect(renderDecision({ ...input, html: html('/legal') })).toEqual({ eligible: true, reason: 'same_provider_refresh_observation_not_identity_approval' });
  expect(renderDecision({ ...input, html: html('https://other.invalid/legal') }).eligible).toBe(false);
  expect(renderDecision({ ...input, html: html('http://example.com/legal') }).eligible).toBe(false);
  expect(renderDecision({ ...input, html: '<script src="/gatsby.js"></script><div id="___gatsby">' + 'navigation '.repeat(30) + '</div>' }).eligible).toBe(true);
});

it('does not confuse a shopping interstitial with an active validateCaptcha form', () => {
  const html = '<main>Click the button below to continue shopping</main><form action="/errors_page/validateCaptcha"><button>Continue</button></form>';
  expect(activeChallenge(html)).toBe('captcha_validation_form');
  expect(renderDecision({ ...input, html, blocked: 'access_interstitial' }).eligible).toBe(false);
  expect(activeChallenge('<script>const example="validateCaptcha";</script><main>ordinary document</main>')).toBe(null);
});
