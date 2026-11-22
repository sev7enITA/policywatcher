import { createHash } from 'node:crypto';
import { load } from 'cheerio';
export const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export type RecordRow = { id: string; url: string; retrievalUrl: string; company?: string; name?: string };
export type PriorAttempt = { kind: string; status?: number; observedAt?: string; bodyHash?: string; bodyFile?: string | null; retryAfterMs?: number };
export type PriorScope = { source: string; extraction?: string; reason: string };
export type PriorEndpoint = { url: string; attempts: PriorAttempt[]; scopes: PriorScope[] };
export type RecoveryRow = RecordRow & { priorReason: string; category: string; priorAttempts: PriorAttempt[]; languageExpectation: 'unknown' };

export function deriveHeld129(catalogue: RecordRow[], endpoints: PriorEndpoint[], cases: Array<{ url: string; category: string }>) {
  if (catalogue.length !== 133 || endpoints.length !== 133 || cases.length !== 133) throw Error('baseline_denominator_mismatch');
  const all = new Map(catalogue.map(row => [row.retrievalUrl || row.url, row]));
  if (all.size !== 133 || new Set(catalogue.map(row => row.id)).size !== 133) throw Error('baseline_duplicate_identity');
  const scopes = new Map(endpoints.flatMap(endpoint => endpoint.scopes.map(scope => [scope.source, { scope, endpoint }] as const)));
  const categories = new Map(cases.map(row => [row.url, row.category]));
  if (scopes.size !== 133 || categories.size !== 133 || [...all.keys()].some(url => !scopes.has(url) || !categories.has(url))) throw Error('baseline_scope_mismatch');
  const excluded: string[] = [], rows: RecoveryRow[] = [];
  for (const [source, original] of all) {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw Error('baseline_url_invalid');
    const prior = scopes.get(source)!;
    if (prior.scope.extraction === 'completed') { excluded.push(source); continue; }
    rows.push({ ...original, retrievalUrl: source, priorReason: prior.scope.reason, category: categories.get(source)!, priorAttempts: prior.endpoint.attempts, languageExpectation: 'unknown' });
  }
  if (excluded.length !== 4 || rows.length !== 129) throw Error('held129_derivation_mismatch');
  return { excluded, rows };
}

export function bodyReceiptMatches(body: Buffer, receipt: PriorAttempt, windowStart: string, windowEnd: string) {
  const time = Date.parse(receipt.observedAt || '');
  return Boolean(receipt.bodyHash && sha(body) === receipt.bodyHash && Number.isFinite(time)
    && time >= Date.parse(windowStart) && time <= Date.parse(windowEnd));
}

export function scopeReasons(source: string, final: string, html: string) {
  const before = new URL(source), after = new URL(final), reasons: string[] = [];
  if (before.pathname.replace(/\/+$/, '') !== after.pathname.replace(/\/+$/, '')) reasons.push('path_identity_unreviewed');
  for (const [key, value] of before.searchParams) {
    if (/^(?:utm_.+|ref|source)$/i.test(key)) continue;
    if (after.searchParams.get(key) !== value) reasons.push('source_selector_drift');
  }
  if (before.hash) {
    let fragment: string;
    try { fragment = decodeURIComponent(before.hash.slice(1)); } catch { return [...reasons, 'fragment_invalid']; }
    if (fragment.startsWith('/')) reasons.push('fragment_client_route_unreviewed');
    else {
      const $ = load(html);
      const count = $('[id],[name]').filter((_, node) => $(node).attr('id') === fragment || $(node).attr('name') === fragment).length;
      if (count !== 1) reasons.push(count ? 'fragment_ambiguous' : 'fragment_missing');
    }
  }
  return [...new Set(reasons)];
}

export function renderDecision(input: { status: number; html: string; source: string; blocked: string | null; soft404: boolean; drift: boolean; extractionCompleted: boolean }) {
  if ([401, 403, 404, 410, 429, 451, 503].includes(input.status)) return { eligible: false, reason: 'http_denial_or_backoff' };
  if (input.drift || input.soft404) return { eligible: false, reason: 'source_identity_or_soft404_hold' };
  if (input.blocked && input.blocked !== 'access_interstitial') return { eligible: false, reason: 'no_wall_or_challenge_bypass' };
  if (/\.pdf$/i.test(new URL(input.source).pathname)) return { eligible: false, reason: 'pdf_not_browser_html' };
  const $ = load(input.html); const scripts = $('script').length;
  const shell = $('#root,#app,#app-root,#__next,#__nuxt,[data-reactroot]').length > 0 || /enable javascript|javascript is required/i.test($('noscript').text());
  const visible = load(input.html); visible('script,style,noscript,template').remove();
  const emptyScriptBody = visible('body').text().replace(/\s+/g, ' ').trim().length < 100;
  const dynamicFragment = new URL(input.source).hash.startsWith('#/');
  if (input.blocked === 'access_interstitial') return { eligible: true, reason: 'ordinary_interstitial_no_interaction' };
  if (scripts && (shell || dynamicFragment || emptyScriptBody) && !input.extractionCompleted) return { eligible: true, reason: dynamicFragment ? 'client_fragment_shell' : 'script_shell_after_static_failure' };
  return { eligible: false, reason: 'no_current_render_signal' };
}
