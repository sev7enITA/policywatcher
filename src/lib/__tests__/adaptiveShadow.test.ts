import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCapture, digest, type RawCapture } from '../adaptiveAcquisition/evidence';
import { createShadowSession, validateShadowConfig, verifyShadowReceipt, type ShadowConfig, type ShadowReceipt } from '../adaptiveAcquisition/shadow';
import { optionalShadowRuntime } from '../adaptiveAcquisition/shadowRuntime';
import { extractFrozenCapture, replayCorpus, type ReplayCorpus } from '../adaptiveAcquisition/replay';
import { resolveLesson } from '../adaptiveAcquisition/experience';
import { scrapePolicyText, hasLivePathDrift, type ScraperControlledFallbacks, type TransportResult } from '../scraper';
import * as scraperModule from '../scraper';

const url = 'https://8.8.8.8/legal/privacy';
const corpus = (): ReplayCorpus => JSON.parse(readFileSync('evals/scraping/corpus.synthetic.v1.json', 'utf8'));
const html = () => corpus().cases[0].capture.html;
const provenance = { test: digest('shadow-test') };
function config(): ShadowConfig {
  return { schemaVersion: 1, mode: 'shadow', maxObservations: 2,
    targets: [{ url, language: 'en', jurisdiction: 'EU' }], recipes: [{
      schemaVersion: 1, id: 'scoped-test', revision: 1,
      scope: { origin: 'https://8.8.8.8', pathPrefix: '/legal', language: 'en', jurisdiction: 'EU' },
      rootSelector: '#policy-document',
    }] };
}
function transport(finalUrl = url): TransportResult { return { ok: true, html: html(), status: 200, finalUrl, error: '' }; }
function controlled(overrides: Partial<ScraperControlledFallbacks> = {}): ScraperControlledFallbacks {
  const failed = async (): Promise<TransportResult> => ({ ok: false, html: '', status: 0, finalUrl: url, error: 'test_failed' });
  return { skipDelays: true, direct: async () => transport(), http2: failed, rendered: failed, wayback: failed, commoncrawl: failed, ...overrides };
}
const folders: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); vi.unstubAllEnvs(); for (const p of folders.splice(0)) await rm(p, { recursive: true, force: true }); });

describe('same-acquisition shadow', () => {
  it('returns the exact baseline result and makes one network-strategy call', async () => {
    const baseline = await scrapePolicyText(url, { controlledFallbacks: controlled() });
    const direct = vi.fn(async () => transport());
    let saved: ShadowReceipt | undefined;
    const session = createShadowSession({ runId: 'one', config: config(), provenance,
      persist: async (capture, receipt) => { expect(capture.html).toBe(html()); saved = receipt; } });
    const result = await session.scrape(url, { controlledFallbacks: controlled({ direct }) });
    // Timing is diagnostic and varies between calls; all functional fields match.
    expect({ ...result, diagnostics: undefined }).toEqual({ ...baseline, diagnostics: undefined });
    expect(direct).toHaveBeenCalledTimes(1);
    expect(saved?.baseline.matchesProduction).toBe(true);
    expect(saved?.comparisons[0].disposition).toBe('extraction_differs');
    expect(saved?.labelStatus).toBe('unreviewed'); expect(saved?.livePromotionAllowed).toBe(false);
    expect(() => verifyShadowReceipt(saved!)).not.toThrow();
    expect(session.summary()).toMatchObject({ attempted: 1, persisted: 1, errors: 0 });
  });
  it('retains the baseline when evidence persistence fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const session = createShadowSession({ runId: 'sink-error', config: config(), provenance,
      persist: async () => { throw new Error('storage_failure'); } });
    const result = await session.scrape(url, { controlledFallbacks: controlled() });
    expect(result.status).toBe('ok'); expect(result.text).toContain('Promotional offer');
    expect(result).not.toHaveProperty('rawCaptureSummary');
    expect(session.summary()).toMatchObject({ persisted: 0, errors: 1 });
  });
  it('preserves an unexpected baseline exception and counts it separately from observer errors', async () => {
    const failure = new Error('unexpected_acquisition_failure');
    vi.spyOn(scraperModule, 'scrapePolicyText').mockRejectedValueOnce(failure);
    const sink = vi.fn(async () => undefined);
    const session = createShadowSession({ runId: 'acquisition-error', config: config(), provenance, persist: sink });
    await expect(session.scrape(url)).rejects.toBe(failure);
    expect(await session.close()).toMatchObject({ attempted: 1, acquisitionErrors: 1, errors: 0, persisted: 0 });
    expect(sink).not.toHaveBeenCalled();
  });
  it('reserves the observation budget before concurrent acquisitions', async () => {
    const cfg = config(); cfg.maxObservations = 1;
    const sink = vi.fn(async () => undefined);
    const session = createShadowSession({ runId: 'budget', config: cfg, provenance, persist: sink });
    const results = await Promise.all([session.scrape(url, { controlledFallbacks: controlled() }), session.scrape(url, { controlledFallbacks: controlled() })]);
    expect(results.every((r) => r.status === 'ok')).toBe(true);
    expect(sink).toHaveBeenCalledTimes(1);
    expect(session.summary()).toMatchObject({ attempted: 1, budgetSkipped: 1 });
  });
  it('waits for pending persistence on close and leaves later baseline acquisitions unobserved', async () => {
    let enter!: () => void; let release!: () => void;
    const entered = new Promise<void>((resolve) => { enter = resolve; });
    const released = new Promise<void>((resolve) => { release = resolve; });
    const sink = vi.fn(async () => { enter(); await released; });
    const session = createShadowSession({ runId: 'closing', config: config(), provenance, persist: sink });
    const acquisition = session.scrape(url, { controlledFallbacks: controlled() });
    await entered;
    const finished = vi.fn();
    const closing = session.close().then((summary) => { finished(); return summary; });
    expect((await session.scrape(url, { controlledFallbacks: controlled() })).status).toBe('ok');
    expect(finished).not.toHaveBeenCalled(); expect(sink).toHaveBeenCalledTimes(1);
    release(); await acquisition;
    expect(await closing).toMatchObject({ attempted: 1, persisted: 1, errors: 0 });
    expect(session.summary()).toMatchObject({ attempted: 1, persisted: 1 });
  });
  it('records agreement when production and replay both reject an incomplete capture', async () => {
    let saved: ShadowReceipt | undefined;
    const session = createShadowSession({ runId: 'partial', config: config(), provenance,
      persist: async (_, receipt) => { saved = receipt; } });
    const result = await session.scrape(url, { controlledFallbacks: controlled({ direct: async () => ({
      ...transport(), html: html().replace('</article>', `<p>${'Personal data and privacy rights. '.repeat(20_000)}</p></article>`),
    }) }) });
    expect(result.partial).toBe(true);
    expect(saved).toMatchObject({ captureMatch: 'exact', baseline: { agreement: 'ineligible_match', matchesProduction: true } });
    expect(session.summary().baselineMismatches).toBe(0);
  });
  it('marks a diagnostic fallback as not comparable to the returned production source', async () => {
    let saved: ShadowReceipt | undefined;
    const session = createShadowSession({ runId: 'fallback', config: config(), provenance,
      persist: async (_, receipt) => { saved = receipt; } });
    const result = await session.scrape(url, { controlledFallbacks: controlled({
      direct: async () => ({ ...transport(), ok: false, status: 503, html: '<html>Service unavailable</html>' }),
      wayback: async () => ({ ...transport(), archiveTimestamp: '20261001000000' }),
    }) });
    expect(result.status).toBe('ok');
    expect(result.outcome?.eligibleForComparison).toBe(false);
    expect(saved).toMatchObject({ captureMatch: 'fallback', baseline: { agreement: 'not_comparable', matchesProduction: false } });
    expect(session.summary()).toMatchObject({ baselineMismatches: 0, unmatchedProductionCaptures: 1 });
  });
  it('honours an existing capture sink without letting its failure replace baseline content', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onRawCapture = vi.fn(async () => { throw new Error('sink_failed'); });
    const session = createShadowSession({ runId: 'composed', config: config(), provenance, persist: async () => undefined });
    const result = await session.scrape(url, { controlledFallbacks: controlled(), onRawCapture });
    expect(result.status).toBe('ok'); expect(onRawCapture).toHaveBeenCalledTimes(1);
    expect(result.rawCaptureSummary?.failed).toBe(1);
    expect(session.summary().persisted).toBe(1);
  });
  it('does not observe sources outside the exact allowlist or mutate its configuration', async () => {
    const cfg = config(); const sink = vi.fn(async () => undefined);
    const session = createShadowSession({ runId: 'scope', config: cfg, provenance, persist: sink });
    cfg.targets[0].url = 'https://8.8.8.8/other'; cfg.maxObservations = 99;
    await session.scrape('https://8.8.8.8/other', { controlledFallbacks: controlled({ direct: async () => transport('https://8.8.8.8/other') }) });
    expect(sink).not.toHaveBeenCalled(); expect(session.summary().outOfScope).toBe(1);
    await session.scrape(url, { controlledFallbacks: controlled() });
    expect(sink).toHaveBeenCalledTimes(1);
  });
  it('records rejection of ambiguous candidates while keeping successful production extraction', async () => {
    const cfg = config(); cfg.recipes[0].rootSelector = 'p';
    let receipt: ShadowReceipt | undefined;
    const session = createShadowSession({ runId: 'ambiguous', config: cfg, provenance, persist: async (_, r) => { receipt = r; } });
    expect((await session.scrape(url, { controlledFallbacks: controlled() })).status).toBe('ok');
    expect(receipt?.comparisons[0]).toMatchObject({ disposition: 'candidate_rejected', reason: 'recipe_or_validation_error' });
  });
  it('does not use an archive as the live observation', async () => {
    let saved: RawCapture | undefined;
    const session = createShadowSession({ runId: 'archive', config: config(), provenance, persist: async (c) => { saved = c; } });
    const failed: TransportResult = { ok: false, html: '', status: 0, finalUrl: url, error: 'failed' };
    const result = await session.scrape(url, { controlledFallbacks: controlled({ direct: async () => failed,
      wayback: async () => ({ ...transport(), archiveTimestamp: '20261001000000' }) }) });
    expect(result.status).toBe('ok'); expect(result.source).toBe('wayback');
    expect(result.outcome?.eligibleForComparison).toBe(false);
    expect(saved?.transport).not.toBe('wayback');
  });
  it('does not turn unavailable captures into successes', async () => {
    const cfg = config(); cfg.targets[0].url = 'http://127.0.0.1/legal';
    const sink = vi.fn(async () => undefined);
    const session = createShadowSession({ runId: 'no-capture', config: cfg, provenance, persist: sink });
    expect((await session.scrape('http://127.0.0.1/legal')).status).toBe('unavailable');
    expect(sink).not.toHaveBeenCalled(); expect(session.summary().noCapture).toBe(1);
  });
  it('rejects excessive budgets and duplicate recipes before acquisition', () => {
    expect(() => validateShadowConfig({ ...config(), maxObservations: 101 })).toThrow('config');
    expect(() => validateShadowConfig({ ...config(), recipes: [config().recipes[0], config().recipes[0]] })).toThrow('duplicate');
    expect(() => createShadowSession({ runId: 'bad', config: config(), provenance: {}, persist: async () => undefined })).toThrow('provenance');
  });
});

describe('source scope observed in the real pilot', () => {
  it.each(['direct', 'http2', 'rendered'])('rejects explicit US to Italian redirects on %s', async (source) => {
    expect(hasLivePathDrift('https://stripe.com/us/legal/ssa', 'https://stripe.com/en-it/legal/ssa', source)).toBe(true);
  });
  it('allows canonical locale aliases and leaves missing hints unknown', () => {
    expect(hasLivePathDrift('https://stripe.com/us/privacy', 'https://stripe.com/en-us/privacy', 'direct')).toBe(false);
    expect(hasLivePathDrift('https://stripe.com/privacy', 'https://stripe.com/en-it/privacy', 'direct')).toBe(false);
    expect(hasLivePathDrift('https://stripe.com/uk/privacy', 'https://stripe.com/en-gb/privacy', 'direct')).toBe(false);
    expect(hasLivePathDrift('https://stripe.com/us/privacy', 'https://stripe.com/en-it/privacy', 'wayback')).toBe(false);
  });
  it('rejects an explicitly changed language query', () => {
    expect(hasLivePathDrift('https://policies.google.com/privacy?hl=en', 'https://policies.google.com/privacy?hl=it', 'direct')).toBe(true);
  });
  it('withholds text and hashes on the real redirect pattern in the production scraper', async () => {
    const result = await scrapePolicyText('https://8.8.8.8/us/legal/ssa', { controlledFallbacks: controlled({
      direct: async () => transport('https://8.8.8.8/en-it/legal/ssa'),
    }) });
    expect(result).toMatchObject({ status: 'invalid', reason: 'path_drift', text: '', hash: '' });
    expect(result.outcome?.eligibleForComparison).toBe(false);
  });
  it('evaluates language on the original HTML before a candidate can discard it', async () => {
    const capture = createCapture({ ...corpus().cases[0].capture, html: html().replace('<html>', '<html lang="it">') });
    const result = await extractFrozenCapture(capture, { language: 'en', jurisdiction: 'EU' });
    expect(result).toMatchObject({ accepted: false, reason: 'document_language_mismatch' });
  });
  it('does not validate lessons from provisional labels even if the candidate wins', async () => {
    const input = corpus(); input.kind = 'provisional_captures';
    const recipes = JSON.parse(readFileSync('evals/scraping/recipes.v1.json', 'utf8'));
    const receipt = await replayCorpus(input, recipes, provenance, '2026-10-23T00:00:00.000Z');
    expect(receipt.candidates[0]).toMatchObject({ decision: 'insufficient_evidence', reasons: ['independent_labels_required'] });
    const lesson = resolveLesson({ schemaVersion: 1, claim: 'Provisional pilot', recipeSha256: receipt.candidates[0].recipeSha256,
      scope: recipes[0].scope, receiptId: receipt.receiptId, evidenceCaseIds: ['train-noise'], expiresAt: '2026-11-01T00:00:00.000Z' },
    () => receipt, new Date('2026-10-23T00:00:00.000Z'));
    expect(lesson.state).toBe('candidate'); expect(lesson.operationalEligible).toBe(false);
  });
});

describe('optional runtime wiring', () => {
  it('keeps the original scraper when configuration is absent', async () => {
    const runtime = await optionalShadowRuntime('disabled', { configPath: '' });
    expect(runtime.scrape).toBe(scrapePolicyText);
    expect((await runtime.finish()).mode).toBe('disabled');
  });
  it('falls back on an invalid configuration without starting acquisition', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const runtime = await optionalShadowRuntime('invalid', { configPath: '/nonexistent/shadow-config.json' });
    expect(runtime.scrape).toBe(scrapePolicyText);
    expect((await runtime.finish()).mode).toBe('configuration_error');
  });
  it('persists real receipts and an idempotent run summary outside the checkout', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'pw-shadow-test-')); folders.push(folder);
    const file = join(folder, 'config.json');
    await writeFile(file, JSON.stringify({ ...config(), outputDirectory: join(folder, 'data') }));
    const runtime = await optionalShadowRuntime('file-runtime', { configPath: file });
    expect(runtime.scrape).not.toBe(scrapePolicyText);
    await runtime.scrape(url, { controlledFallbacks: controlled() });
    const [summary, concurrentSummary] = await Promise.all([runtime.finish(), runtime.finish()]);
    expect(summary.persisted).toBe(1); expect(concurrentSummary).toEqual(summary);
    expect(await runtime.finish()).toEqual(summary);
    expect((await readdir(join(folder, 'data'))).filter((name) => name.endsWith('.summary.json'))).toHaveLength(1);
    const names = await readdir(join(folder, 'data', 'observations'));
    expect(names).toHaveLength(1);
    const receipt = JSON.parse(await readFile(join(folder, 'data', 'observations', names[0]), 'utf8'));
    expect(() => verifyShadowReceipt(receipt)).not.toThrow();
    expect(() => verifyShadowReceipt({ ...receipt, livePromotionAllowed: true })).toThrow('integrity');
  });
});
