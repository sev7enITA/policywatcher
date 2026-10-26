import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mkdtemp, open, rm, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalJson, createCapture, digest, verifyCapture } from '../adaptiveAcquisition/evidence';
import { applyRecipe, recipeApplies, validateRecipe } from '../adaptiveAcquisition/recipe';
import { extractFrozenCapture, replayCorpus, validateCorpus, verifyReceipt, type ReplayCorpus, type ReplayReceipt } from '../adaptiveAcquisition/replay';
import { resolveLesson, type LessonProposal } from '../adaptiveAcquisition/experience';
import { privateCaptureDirectory, writeImmutableJson } from '../adaptiveAcquisition/storage';
import { emptyRetrievalMetrics, recordRetrievalDiagnostics } from '../sourceReliability';
import { scrapePolicyText, type ScraperControlledFallbacks, type TransportResult } from '../scraper';
import type { ExtractionRecipe } from '../adaptiveAcquisition/recipe';

const corpus = (): ReplayCorpus => JSON.parse(readFileSync('evals/scraping/corpus.synthetic.v1.json', 'utf8'));
const recipe = (): ExtractionRecipe => JSON.parse(readFileSync('evals/scraping/recipes.v1.json', 'utf8'))[0];
const provenance = { testEngine: digest('test-engine') };
const timestamp = '2026-10-19T00:00:00.000Z';
const run = (input = corpus(), candidate = recipe()) => replayCorpus(input, [candidate], provenance, timestamp);
const temporary: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks(); vi.unstubAllEnvs();
  for (const directory of temporary.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe('frozen evidence and recipes', () => {
  it('verifies complete provenance, not just the HTML hash', () => {
    const capture = corpus().cases[0].capture;
    expect(() => verifyCapture(capture)).not.toThrow();
    expect(() => verifyCapture({ ...capture, finalUrl: 'https://elsewhere.example' })).toThrow('integrity');
    expect(() => verifyCapture({ ...capture, html: `${capture.html}changed` })).toThrow('integrity');
    expect(() => verifyCapture({ ...capture, bodyKind: 'rendered_dom' })).toThrow('integrity');
  });
  it('limits raw bodies and refuses credential-bearing URLs', () => {
    const capture = corpus().cases[0].capture;
    expect(() => createCapture({ ...capture, html: 'a'.repeat(5_000_001) })).toThrow('limit');
    expect(() => createCapture({ ...capture, requestedUrl: 'https://user:secret@example.com' })).toThrow('url');
  });
  it('canonicalizes key order without accepting invalid JSON numbers', () => {
    expect(digest({ b: 2, a: 1 })).toBe(digest({ a: 1, b: 2 }));
    expect(() => canonicalJson({ n: NaN })).toThrow('non_json');
  });
  it('refuses duplicate bodies, duplicate IDs and related sources crossing splits', () => {
    const duplicate = corpus(); duplicate.cases[1].capture = duplicate.cases[0].capture;
    expect(() => validateCorpus(duplicate)).toThrow('duplicate_capture');
    const ids = corpus(); ids.cases[1].id = ids.cases[0].id;
    expect(() => validateCorpus(ids)).toThrow('invalid_replay');
    const leakage = corpus(); leakage.cases[3].groupId = leakage.cases[0].groupId;
    expect(() => validateCorpus(leakage)).toThrow('split_group');
  });
  it('keeps language, jurisdiction, origin and path boundaries in scope', () => {
    const r = recipe();
    expect(recipeApplies(r, 'https://fixture.example/legal/a', 'en', 'EU')).toBe(true);
    expect(recipeApplies(r, 'https://fixture.example/legalistic', 'en', 'EU')).toBe(false);
    expect(recipeApplies(r, 'https://fixture.example/legal/a', 'it', 'EU')).toBe(false);
    expect(recipeApplies(r, 'https://fixture.example/legal/a', 'en', 'US')).toBe(false);
    expect(recipeApplies(r, 'https://other.example/legal/a', 'en', 'EU')).toBe(false);
  });
  it('does not allow a recipe to alter validators and refuses ambiguous roots', () => {
    expect(() => validateRecipe({ ...recipe(), minTextLength: 0 })).toThrow('invalid_recipe');
    expect(() => validateRecipe({ ...recipe(), rootSelector: '[' })).toThrow();
    expect(() => applyRecipe('<p>a</p><p>b</p>', { ...recipe(), rootSelector: 'p' })).toThrow('not_unique');
  });
});

describe('baseline comparison and conservative promotion', () => {
  it('recommends only shadow after improvements on both splits, with stable receipts', async () => {
    const receipt = await run();
    expect(receipt.candidates[0]).toMatchObject({
      decision: 'recommend_shadow', wins: ['train-noise', 'holdout-noise'], regressions: [],
    });
    expect(receipt.candidates[0].cases.every((c) => c.passes)).toBe(true);
    expect(receipt.candidates[0].cases.find((c) => c.caseId === 'holdout-other-scope')?.applied).toBe(false);
    expect((await run()).receiptId).toBe(receipt.receiptId);
    expect(() => verifyReceipt(receipt)).not.toThrow();
    expect(() => verifyReceipt({ ...receipt, corpusSha256: digest('changed') })).toThrow('integrity');
  });
  it('abstains on a tiny corpus and retains the baseline for regression', async () => {
    const small = corpus(); small.cases = small.cases.slice(0, 2);
    expect((await run(small)).candidates[0].decision).toBe('insufficient_evidence');
    const bad = await run(corpus(), { ...recipe(), rootSelector: '#absent' });
    expect(bad.candidates[0].decision).toBe('keep_current');
    expect(bad.candidates[0].regressions).toContain('holdout-clean');
  });
  it('keeps an unrelated baseline failure visible without vetoing a scoped improvement', async () => {
    const input = corpus();
    input.cases.find((c) => c.id === 'holdout-other-scope')!.expected.required.push('missing unrelated clause');
    const receipt = await run(input);
    expect(receipt.baseline.find((c) => c.caseId === 'holdout-other-scope')?.passes).toBe(false);
    expect(receipt.candidates[0]).toMatchObject({ decision: 'recommend_shadow', regressions: [] });
    expect(receipt.candidates[0].cases.find((c) => c.caseId === 'holdout-other-scope'))
      .toMatchObject({ applied: false, passes: false });
  });
  it('still blocks remaining failures within the candidate scope', async () => {
    const input = corpus();
    input.cases.find((c) => c.id === 'holdout-noise')!.expected.required.push('missing in-scope clause');
    expect((await run(input)).candidates[0].decision).toBe('keep_current');
  });
  it('retains a baseline when the candidate changes no evaluated output', async () => {
    const receipt = await run(corpus(), { ...recipe(), rootSelector: 'body' });
    expect(receipt.candidates[0].decision).toBe('keep_current');
    expect(receipt.candidates[0].wins).toEqual([]);
  });
  it('does not treat a training win alone as held-out evidence', async () => {
    const input = corpus();
    const holdout = input.cases.find((c) => c.id === 'holdout-noise')!;
    holdout.expected.forbidden = []; // baseline now passes this held-out case too
    const receipt = await run(input);
    expect(receipt.candidates[0]).toMatchObject({ decision: 'keep_current', reasons: ['no_improvement_in_both_splits'] });
  });
  it('guards original block pages, archive currency and redirect scope before selection', async () => {
    const receipt = await run();
    const results = receipt.candidates[0].cases;
    for (const name of ['holdout-block', 'holdout-archive', 'holdout-drift']) {
      expect(results.find((c) => c.caseId === name)).toMatchObject({ accepted: false, passes: true });
    }
  });
  it('does not let a selector hide a truncation finding in the original document', async () => {
    const c = corpus().cases.find((item) => item.id === 'holdout-clean')!;
    // Cross the real 500,000-character storage boundary, without replaying the
    // oversized input twice through a full corpus whose gates are tested above.
    const longText = 'Personal data and privacy rights. '.repeat(15_154).slice(0, 500_001);
    const longSection = `<section class="oversized-supplement"><p>${longText}</p></section>`;
    c.capture = createCapture({ ...c.capture, html: c.capture.html.replace('<body>', '<body><main>').replace('</body>', `${longSection}</main></body>`) });
    expect((await extractFrozenCapture(c.capture, c, recipe())))
      .toMatchObject({ applied: true, accepted: false, reason: 'text_truncated_at_max_length' });
  }, 15_000); // Real half-megabyte DOM parsing also runs under Node 22 V8 coverage.
  it('preserves strict fragment boundaries even when a candidate selects valid policy text elsewhere', async () => {
    const input = corpus(); input.cases = [input.cases[0]];
    const item = input.cases[0];
    const url = `${item.capture.requestedUrl}#missing-policy-section`;
    item.capture = createCapture({ ...item.capture, requestedUrl: url, finalUrl: url,
      html: item.capture.html });
    item.expected = { accept: false, required: [], forbidden: [] };
    const receipt = await run(input, recipe());
    expect(receipt.candidates[0].cases[0]).toMatchObject({ accepted: false, passes: true, reason: 'scope_missing' });
  });
  it('refuses duplicate recipes and unidentifiable evaluator versions', async () => {
    await expect(replayCorpus(corpus(), [recipe(), recipe()], provenance)).rejects.toThrow('duplicate_recipe');
    await expect(replayCorpus(corpus(), [recipe()], {})).rejects.toThrow('provenance');
  });
});

function proposal(receipt: ReplayReceipt): LessonProposal {
  return {
    schemaVersion: 1, claim: 'The scoped selector excludes a promotional sibling on the frozen corpus.',
    recipeSha256: receipt.candidates[0].recipeSha256, scope: recipe().scope,
    receiptId: receipt.receiptId, evidenceCaseIds: ['train-noise', 'holdout-noise'],
    expiresAt: '2026-11-18T00:00:00.000Z',
  };
}

describe('evidence-backed experience', () => {
  it('resolves supporting evidence, derives counts and never activates a live recipe', async () => {
    const receipt = await run();
    const lesson = resolveLesson(proposal(receipt), () => receipt, new Date(timestamp));
    expect(lesson).toMatchObject({ state: 'validated_offline', successes: 8, independentGroups: 8, counterexamples: [], operationalEligible: false });
  });
  it('rejects invented receipts, cases, scope and altered receipt contents', async () => {
    const receipt = await run(); const p = proposal(receipt);
    expect(() => resolveLesson(p, () => undefined)).toThrow('unresolved');
    expect(() => resolveLesson({ ...p, evidenceCaseIds: ['invented'] }, () => receipt)).toThrow('unresolved');
    expect(() => resolveLesson({ ...p, scope: { ...p.scope, jurisdiction: 'US' } }, () => receipt)).toThrow('scope');
    const changed = structuredClone(receipt); changed.candidates[0].decision = 'keep_current';
    expect(() => resolveLesson(p, () => changed)).toThrow('integrity');
  });
  it('retains counterexamples even if a proposal only cites a passing case', async () => {
    const receipt = await run(corpus(), { ...recipe(), rootSelector: '#absent' });
    const p = { ...proposal(receipt), evidenceCaseIds: ['train-block'] };
    const lesson = resolveLesson(p, () => receipt, new Date(timestamp));
    expect(lesson.state).toBe('candidate');
    expect(lesson.counterexamples).toContain('holdout-clean');
  });
  it('expires evidence and disallows future or unlimited lifetimes', async () => {
    const receipt = await run(); const p = proposal(receipt);
    expect(resolveLesson(p, () => receipt, new Date('2026-11-19')).state).toBe('expired');
    expect(() => resolveLesson({ ...p, expiresAt: '2099-01-01' }, () => receipt, new Date(timestamp))).toThrow('lifetime');
    expect(() => resolveLesson(p, () => receipt, new Date('2026-10-18'))).toThrow('lifetime');
  });
});

const sourceUrl = 'https://8.8.8.8/policy';
function accepted(): TransportResult {
  return { ok: true, html: corpus().cases[1].capture.html, status: 200, finalUrl: sourceUrl, error: '' };
}
function fallbacks(overrides: Partial<ScraperControlledFallbacks>): ScraperControlledFallbacks {
  const failed = async (): Promise<TransportResult> => ({ ok: false, html: '', status: 0, finalUrl: sourceUrl, error: 'test_transport_failed' });
  return { direct: failed, http2: failed, rendered: failed, wayback: failed, commoncrawl: failed, skipDelays: true, ...overrides };
}

describe('scraper integration without network', () => {
  it('captures decoded extractor input privately and exposes dimensions, never the raw body', async () => {
    const captures: unknown[] = [];
    const result = await scrapePolicyText(sourceUrl, {
      controlledFallbacks: fallbacks({ direct: async () => accepted() }),
      onRawCapture: async (capture) => { verifyCapture(capture); captures.push(capture); },
    });
    expect(captures).toHaveLength(1);
    expect(captures[0]).toMatchObject({ bodyKind: 'decoded_document_html' });
    expect(result.outcome).toMatchObject({ extraction: 'accepted', quality: 'passed_scraper_checks', currency: 'live', eligibleForComparison: true, changeConfirmation: 'not_evaluated' });
    expect(result).not.toHaveProperty('html');
    expect(result).not.toHaveProperty('capture');
    expect(result.rawCaptureSummary).toEqual({ attempted: 1, recorded: 1, failed: 0 });
    const metrics = emptyRetrievalMetrics(1, 1);
    recordRetrievalDiagnostics(metrics, result.diagnostics || [], result.status, result.source, result.outcome);
    expect(metrics.acquisitionOutcomes).toMatchObject({
      'extraction:accepted': 1, 'currency:live': 1, 'eligibleForComparison:true': 1,
      'changeConfirmation:not_evaluated': 1,
    });
  });
  it('keeps successful acquisition valid when the optional corpus sink fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await scrapePolicyText(sourceUrl, {
      controlledFallbacks: fallbacks({ direct: async () => accepted() }),
      onRawCapture: async () => { throw new Error('private details'); },
    });
    expect(result.status).toBe('ok');
    expect(result.rawCaptureSummary).toEqual({ attempted: 1, recorded: 0, failed: 1 });
    expect(warn).toHaveBeenCalledWith('[Scraper] Private raw capture failed.');
  });
  it('preserves the baseline archive result while marking it ineligible for adaptive comparison', async () => {
    const result = await scrapePolicyText(sourceUrl, { controlledFallbacks: fallbacks({
      wayback: async () => ({ ...accepted(), archiveTimestamp: '20261018000000' }),
    }) });
    expect(result.status).toBe('ok');
    expect(result.text).not.toBe(''); expect(result.hash).not.toBe('');
    expect(result.outcome).toMatchObject({ currency: 'historical', eligibleForComparison: false });
  });
  it('does not equate partial acquisition with a complete comparison input', async () => {
    const result = await scrapePolicyText(sourceUrl, { controlledFallbacks: fallbacks({
      direct: async () => ({ ...accepted(), html: accepted().html.replace('</article>', `<p>${'Personal data and privacy rights. '.repeat(15_154).slice(0, 500_001)}</p></article>`) }),
    }) });
    expect(result.partial).toBe(true);
    expect(result.outcome).toMatchObject({ extraction: 'partial', eligibleForComparison: false });
  });
  it('records a failed acquisition without inferring unchanged or a confirmed change', async () => {
    const result = await scrapePolicyText(sourceUrl, { controlledFallbacks: fallbacks({}) });
    expect(result.outcome).toMatchObject({ transport: 'failed', eligibleForComparison: false, changeConfirmation: 'not_evaluated' });
  });
  it('separates complete live, partial and historical counters', () => {
    const metrics = emptyRetrievalMetrics(3, 3);
    recordRetrievalDiagnostics(metrics, [{ source: 'direct', status: 'partial' }], 'partial', 'direct');
    recordRetrievalDiagnostics(metrics, [{ source: 'direct', status: 'ok' }], 'ok', 'direct');
    recordRetrievalDiagnostics(metrics, [{ source: 'wayback', status: 'ok' }], 'unavailable', 'wayback');
    expect(metrics.directSuccesses).toBe(1);
    expect(metrics.strategies.direct).toMatchObject({ accepted: 2, completeLive: 1, partial: 1, historical: 0 });
    expect(metrics.strategies.wayback).toMatchObject({ accepted: 1, completeLive: 0, historical: 1 });
  });
});

describe('private immutable artifact storage', () => {
  it('writes private files idempotently and rejects replacement', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pw-evidence-test-')); temporary.push(directory);
    const path = join(directory, 'receipt.json');
    await writeImmutableJson(path, { a: 1 }); await writeImmutableJson(path, { a: 1 });
    const file = await open(path, 'r');
    try {
      expect((await file.stat()).mode & 0o777).toBe(0o600);
      expect(await file.readFile('utf8')).toBe('{"a":1}\n');
    } finally { await file.close(); }
    await expect(writeImmutableJson(path, { a: 2 })).rejects.toThrow('conflict');
  });
  it('rejects raw-capture directories inside the checkout, including symlinks', async () => {
    await expect(privateCaptureDirectory(process.cwd(), process.cwd())).rejects.toThrow('outside_checkout');
    const directory = await mkdtemp(join(tmpdir(), 'pw-evidence-test-')); temporary.push(directory);
    const link = join(directory, 'checkout'); await symlink(process.cwd(), link);
    await expect(privateCaptureDirectory(link, process.cwd())).rejects.toThrow('outside_checkout');
    await expect(privateCaptureDirectory(join(directory, '..raw'), directory)).rejects.toThrow('outside_checkout');
  });
  it('rejects nonexistent nested paths before creating directories, including symlink parents', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pw-evidence-test-')); temporary.push(directory);
    const nested = join(directory, 'absent', 'captures');
    await expect(privateCaptureDirectory(nested, directory)).rejects.toThrow('outside_checkout');
    await expect(stat(join(directory, 'absent'))).rejects.toMatchObject({ code: 'ENOENT' });
    const outside = await mkdtemp(join(tmpdir(), 'pw-evidence-link-')); temporary.push(outside);
    await symlink(directory, join(outside, 'alias'));
    await expect(privateCaptureDirectory(join(outside, 'alias', 'absent', 'captures'), directory))
      .rejects.toThrow('outside_checkout');
    await expect(stat(join(directory, 'absent'))).rejects.toMatchObject({ code: 'ENOENT' });
    const valid = await privateCaptureDirectory(join(outside, 'valid', 'captures'), directory);
    expect((await stat(valid)).isDirectory()).toBe(true);
  });
});
