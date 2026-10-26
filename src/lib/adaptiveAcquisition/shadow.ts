import { scrapePolicyText, type ScrapePolicyOptions, type ScrapeResult } from '../scraper';
import { digest, sha256, type RawCapture } from './evidence';
import { extractFrozenCapture } from './replay';
import { validateRecipe, type ExtractionRecipe } from './recipe';

export interface ShadowTarget { url: string; language: string; jurisdiction: string }
export interface ShadowConfig {
  schemaVersion: 1;
  mode: 'shadow';
  maxObservations: number;
  targets: ShadowTarget[];
  recipes: ExtractionRecipe[];
}
export interface ShadowComparison {
  recipeSha256: string;
  recipeId: string;
  accepted: boolean;
  reason: string;
  textSha256: string;
  textLength: number;
  disposition: 'out_of_scope' | 'both_rejected' | 'candidate_rejected'
    | 'candidate_accepts_after_baseline_rejection' | 'identical' | 'extraction_differs';
}
export interface ShadowReceipt {
  schemaVersion: 1;
  mode: 'shadow';
  runId: string;
  sequence: number;
  observedAt: string;
  configSha256: string;
  provenance: Record<string, string>;
  captureId: string;
  captureMatch: 'exact' | 'fallback';
  sourceKey: string;
  context: { language: string; jurisdiction: string };
  production: { status: string; source: string; textHash: string; partial: boolean };
  baseline: { accepted: boolean; reason: string; textSha256: string; textLength: number; matchesProduction: boolean;
    agreement: 'accepted_match' | 'ineligible_match' | 'mismatch' | 'not_comparable' };
  comparisons: ShadowComparison[];
  labelStatus: 'unreviewed';
  livePromotionAllowed: false;
  receiptId: string;
}

export function validateShadowConfig(config: ShadowConfig): void {
  if (!config || config.schemaVersion !== 1 || config.mode !== 'shadow'
    || !Number.isSafeInteger(config.maxObservations) || config.maxObservations < 1 || config.maxObservations > 100
    || !Array.isArray(config.targets) || !config.targets.length || config.targets.length > 100
    || !Array.isArray(config.recipes) || !config.recipes.length || config.recipes.length > 3) {
    throw new Error('invalid_shadow_config');
  }
  const urls = new Set<string>();
  for (const target of config.targets) {
    const url = new URL(target.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || urls.has(url.href) || typeof target.language !== 'string' || !target.language.trim()
      || typeof target.jurisdiction !== 'string' || !target.jurisdiction.trim()) throw new Error('invalid_shadow_target');
    urls.add(url.href);
  }
  const ids = new Set<string>();
  for (const recipe of config.recipes) {
    validateRecipe(recipe);
    const id = `${recipe.id}@${recipe.revision}`;
    if (ids.has(id)) throw new Error('duplicate_shadow_recipe');
    ids.add(id);
  }
}

export function verifyShadowReceipt(receipt: ShadowReceipt): void {
  const { receiptId, ...body } = receipt;
  if (receipt.schemaVersion !== 1 || receipt.mode !== 'shadow' || receipt.livePromotionAllowed !== false
    || receipt.labelStatus !== 'unreviewed' || digest(body) !== receiptId) throw new Error('shadow_receipt_integrity');
}

export function createShadowSession(input: {
  runId: string;
  config: ShadowConfig;
  provenance: Record<string, string>;
  persist: (capture: RawCapture, receipt: ShadowReceipt) => Promise<void>;
}) {
  validateShadowConfig(input.config);
  if (!input.runId || !Object.keys(input.provenance).length
    || Object.values(input.provenance).some((hash) => !/^[a-f0-9]{64}$/.test(hash))) throw new Error('invalid_shadow_provenance');
  // Callers cannot mutate the allowlist, recipes or budget during an acquisition.
  const config = structuredClone(input.config);
  const provenance = structuredClone(input.provenance);
  const targets = new Map(config.targets.map((target) => [new URL(target.url).href, target]));
  const metrics = { mode: 'shadow' as const, attempted: 0, persisted: 0, errors: 0,
    budgetSkipped: 0, outOfScope: 0, noCapture: 0, baselineMismatches: 0, acquisitionErrors: 0,
    unmatchedProductionCaptures: 0,
    dispositions: {} as Record<string, number> };
  let closed = false;
  const pending = new Set<Promise<ScrapeResult>>();

  async function observe(url: string, options: ScrapePolicyOptions): Promise<ScrapeResult> {
    let target: ShadowTarget | undefined;
    try { target = targets.get(new URL(url).href); } catch { /* Let the scraper reject malformed sources. */ }
    if (!target) { metrics.outOfScope += 1; return scrapePolicyText(url, options); }
    if (metrics.attempted >= config.maxObservations) {
      metrics.budgetSkipped += 1; return scrapePolicyText(url, options);
    }
    const sequence = ++metrics.attempted; // Reserve before awaiting, including concurrent requests.
    const captures: RawCapture[] = [];
    let result: ScrapeResult;
    try {
      result = await scrapePolicyText(url, { ...options, onRawCapture: async (capture) => {
        captures.push(capture);
        if (options.onRawCapture) await options.onRawCapture(capture);
      } });
    } catch (error) {
      // An acquisition failure belongs to the baseline, not to observer errors.
      metrics.acquisitionErrors += 1;
      throw error;
    }
    try {
      // Compare the returned live source, or retain the last nonempty live failure
      // for diagnosis. Archive copies never substitute for a live acquisition.
      const live = captures.filter((c) => ['direct', 'http2', 'rendered'].includes(c.transport));
      const recent = [...live].reverse();
      const exactCapture = recent.find((c) => c.transport === result.source && c.finalUrl === result.finalUrl);
      const capture = exactCapture || recent.find((c) => c.html.length > 0) || recent[0];
      if (!capture) metrics.noCapture += 1;
      else {
        const baseline = await extractFrozenCapture(capture, target);
        const baselineHash = sha256(baseline.text);
        const productionAccepted = result.status === 'ok' && !result.partial;
        const agreement: ShadowReceipt['baseline']['agreement'] = !exactCapture ? 'not_comparable'
          : productionAccepted ? baseline.accepted && baselineHash === result.hash ? 'accepted_match' : 'mismatch'
          : !baseline.accepted ? 'ineligible_match' : 'mismatch';
        const matchesProduction = agreement === 'accepted_match' || agreement === 'ineligible_match';
        if (agreement === 'mismatch') metrics.baselineMismatches += 1;
        if (!exactCapture) metrics.unmatchedProductionCaptures += 1;
        const comparisons: ShadowComparison[] = [];
        for (const recipe of config.recipes) {
          const candidate = await extractFrozenCapture(capture, target, recipe);
          const textSha256 = sha256(candidate.text);
          const disposition = !candidate.applied ? 'out_of_scope'
            : !baseline.accepted && !candidate.accepted ? 'both_rejected'
            : !candidate.accepted ? 'candidate_rejected'
            : !baseline.accepted ? 'candidate_accepts_after_baseline_rejection'
            : textSha256 === baselineHash ? 'identical' : 'extraction_differs';
          comparisons.push({ recipeId: recipe.id, recipeSha256: digest(recipe), accepted: candidate.accepted,
            reason: candidate.reason, textSha256, textLength: candidate.text.length, disposition });
        }
        const body = {
          schemaVersion: 1 as const, mode: 'shadow' as const, runId: input.runId, sequence,
          observedAt: new Date().toISOString(), configSha256: digest(config), provenance,
          captureId: capture.captureId, captureMatch: exactCapture ? 'exact' as const : 'fallback' as const,
          sourceKey: sha256(new URL(url).href),
          context: { language: target.language, jurisdiction: target.jurisdiction },
          production: { status: result.status, source: result.source, textHash: result.hash, partial: Boolean(result.partial) },
          baseline: { accepted: baseline.accepted, reason: baseline.reason, textSha256: baselineHash,
            textLength: baseline.text.length, matchesProduction, agreement },
          comparisons, labelStatus: 'unreviewed' as const, livePromotionAllowed: false as const,
        };
        const receipt = { ...body, receiptId: digest(body) };
        await input.persist(capture, receipt);
        metrics.persisted += 1;
        for (const comparison of comparisons) {
          metrics.dispositions[comparison.disposition] = (metrics.dispositions[comparison.disposition] || 0) + 1;
        }
      }
    } catch {
      metrics.errors += 1;
      console.warn('[Scraping shadow] Observation failed; baseline retained.');
    }
    // The private observer must not change even the public result's shape.
    if (!options.onRawCapture) delete result.rawCaptureSummary;
    return result;
  }
  function scrape(url: string, options: ScrapePolicyOptions = {}): Promise<ScrapeResult> {
    if (closed) return scrapePolicyText(url, options);
    const operation = observe(url, options);
    pending.add(operation);
    void operation.then(() => pending.delete(operation), () => pending.delete(operation));
    return operation;
  }
  return { scrape, summary: () => structuredClone(metrics), close: async () => {
    closed = true;
    await Promise.allSettled([...pending]);
    return structuredClone(metrics);
  } };
}
