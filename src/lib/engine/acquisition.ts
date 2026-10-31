import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift, extractPolicyText, detectBlockPage, detectSoft404, type TransportResult } from '../scraper';
import { db } from '../db';
import { digest, normalized, structureDocument, assessDocument, type SourceContract, type StructuredDocument } from './document';
import { DAILY_MS, putArtifact, readArtifact, type TaskInput, type Tx } from './store';

export interface CaptureBody {
  html: string; document: StructuredDocument; language?: string;
  extraction?: { retainedDisclosureIds: string[]; retainedDocumentHeaders: number; restoredTitleFromDom: boolean; retainedUnstructuredRuns?: number; issues?: Array<{ reason: string; target: string | null; chars: number }>;
    reviewedExclusionHash?: string; appliedExclusions?: Array<{ selector: string; htmlSha256: string; reviewNote: string }> };
}
export interface Observation {
  artifactId: string | null; observedAt: string; source: string; httpStatus: number; finalUrl: string;
  notModified: boolean; eligible: boolean; reasons: string[]; retryAfterMs?: number;
  diagnostics: Array<{ source: string; status: number; reason: string }>;
  cache?: { key: string; etag: string | null; lastModified: string | null; profileHash: string };
}
/** Called only inside a fenced baseline/unchanged commit, never for an unconfirmed candidate. */
export async function saveRepresentation(tx: Tx, observation: Observation) {
  if (!observation.cache || !observation.artifactId) return;
  const { key, ...validators } = observation.cache;
  const data = { ...validators, artifactId: observation.artifactId, validatedAt: new Date(), expiresAt: new Date(Date.now() + 7 * DAILY_MS) };
  await tx.engineHttpCache.upsert({ where: { key }, create: { key, ...data }, update: data });
}
export type Transport = typeof acquireEngineTransport;
/** Preserve document semantics before the shared boilerplate normalizer runs.
 * Collapsed content is retained only when a disclosure control in the document
 * explicitly references its unique ID. Unrelated hidden DOM stays excluded.
 */
function prepareEngineHtml(html: string, contract?: SourceContract | null) {
  const $ = load(html);
  const scope = 'main, article, [role="main"]';
  const originalIdCounts = new Map<string, number>();
  $('[id]').each((_, e) => { const id = $(e).attr('id')!; originalIdCounts.set(id, (originalIdCounts.get(id) || 0) + 1); });
  const chrome = 'nav, footer, aside, [role="banner"], [role="contentinfo"], [role="dialog"], .cookie-banner, #cookie-banner, .breadcrumb, .breadcrumbs';
  const issues: Array<{ reason: string; target: string | null; chars: number }> = [];
  const appliedExclusions: Array<{ selector: string; htmlSha256: string; reviewNote: string }> = [];
  // No blanket waiver: a reviewed UI exclusion stops matching if its DOM changes.
  for (const rule of contract?.reviewedExclusions || []) {
    try {
      const matches = $(rule.selector);
      if (matches.length !== 1) {
        issues.push({ reason: 'reviewed_exclusion_target_changed', target: rule.selector, chars: matches.text().length }); continue;
      }
      const node = matches.first();
      const htmlSha256 = digest($.html(node));
      const headings = node.find('h1,h2,h3,h4,h5,h6').map((_, h) => normalized($(h).text())).get();
      const reviewedDialog = node.is('[role="dialog"]') && rule.dialogHeadings
        && JSON.stringify(headings) === JSON.stringify(rule.dialogHeadings.map(normalized));
      if (node.is('html, body, main, article, [role="main"], h1, h2, h3, h4, h5, h6')
          || node.find('main, article, [role="main"]').length || (headings.length && !reviewedDialog)) {
        issues.push({ reason: 'reviewed_exclusion_document_boundary', target: rule.selector, chars: node.text().length }); continue;
      }
      if (htmlSha256 !== rule.htmlSha256) {
        issues.push({ reason: 'reviewed_exclusion_content_changed', target: rule.selector, chars: node.text().length }); continue;
      }
      appliedExclusions.push({ selector: rule.selector, htmlSha256, reviewNote: rule.reviewNote }); node.remove();
    } catch { issues.push({ reason: 'reviewed_exclusion_selector_invalid', target: rule.selector, chars: 0 }); }
  }
  $('[role="dialog"]').each((_, element) => {
    const node = $(element); const chars = node.text().replace(/\s+/g, ' ').trim().length;
    if (node.parents(scope).length && chars > 0) issues.push({ reason: 'dialog_document_scope_unverified', target: node.attr('id') || null, chars });
  });
  // Known UI chrome is excluded consistently, including a dialog placed inside main.
  $(chrome).remove();
  const retainedDisclosureIds: string[] = [];
  $('[aria-controls]').each((_, control) => {
    const el = $(control);
    if (el.parents('header, svg').length) return;
    for (const id of (el.attr('aria-controls') || '').split(/\s+/).filter(Boolean)) {
      const targets = $('[id]').filter((__, node) => $(node).attr('id') === id);
      const chars = targets.text().replace(/\s+/g, ' ').trim().length;
      let reason: string | undefined;
      if ((originalIdCounts.get(id) || 0) > 1) reason = 'disclosure_target_ambiguous';
      else if (targets.length !== 1) reason = 'disclosure_target_missing';
      else if (!el.parents(scope).length || !targets.parents(scope).length) reason = 'disclosure_scope_unverified';
      else if (!el.is('button[aria-expanded], a[aria-expanded], [role="button"][aria-expanded]')) reason = 'disclosure_control_unverified';
      if (reason) { issues.push({ reason, target: id, chars }); continue; }
      if (targets.attr('aria-hidden') === 'true' && targets.find('p, li, table, blockquote, dt, dd').length) {
        targets.removeAttr('aria-hidden'); retainedDisclosureIds.push(id);
      }
    }
  });
  $('[aria-hidden="true"]').each((_, node) => {
    const el = $(node);
    if (el.parents('header, svg, [aria-hidden="true"]').length) return;
    const chars = el.text().replace(/\s+/g, ' ').trim().length;
    // A short negation or exception can reverse a clause. Length is not a safe
    // completeness waiver inside the document; exact UI exclusions remain reviewed.
    if (chars >= 100 || (chars > 0 && el.parents(scope).length)) issues.push({ reason: 'hidden_document_content_unresolved', target: el.attr('id') || null, chars });
  });
  const documentTitles = new Set<unknown>();
  let retainedDocumentHeaders = 0;
  $('header').each((_, header) => {
    const el = $(header);
    if (el.is('[role="banner"]') || el.parents(chrome).length || !el.parents(`${scope}, section`).length
        || !el.find('h1, h2, h3, h4, h5, h6').length) return;
    el.find('h1').each((_, h) => { documentTitles.add(h); });
    const extra = el.clone(); extra.find('h1,h2,h3,h4,h5,h6,nav').remove();
    const chars = extra.text().replace(/\s+/g, ' ').trim().length;
    if (chars) issues.push({ reason: 'document_header_metadata_unreviewed', target: el.attr('id') || null, chars });
    // Keep attributes: fragment IDs and existing boilerplate classes are evidence.
    header.name = 'div'; retainedDocumentHeaders++;
  });
  // Some publishers put a single document h1 in a section preceding <main>.
  // Recover only that actual semantic heading, never infer a title from keywords.
  const titles = $('h1').filter((_, heading) => !$(heading).parents(`${chrome}, header, [aria-hidden="true"]`).length
      && ($(heading).parents(scope).length > 0 || documentTitles.has(heading)))
    .map((_, heading) => $(heading).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);
  // Preserve loose inline runs as complete paragraphs, in DOM order. Selecting
  // only existing p/li elements loses real clauses in div/span and legal dates.
  // Wrapping every text node separately would break qualifiers and duplicate text.
  const semantic = 'h1,h2,h3,h4,h5,h6,p,li,table,dt,dd,blockquote';
  const boundaries = `${semantic},div,section,article,main,details,summary,pre,figure,figcaption,dl,ul,ol,[role="main"]`;
  const excluded = `${chrome},header,script,style,iframe,noscript,svg,form,button,[role="button"],select,[role="combobox"],.nav-menu,#header,#footer,.sidebar,[aria-hidden="true"]`;
  let retainedUnstructuredRuns = 0;
  function preserveRuns(node: AnyNode) {
    if (!('children' in node)) return;
    const el = $(node);
    if (el.is(excluded)) return;
    if (el.is('table')) {
      el.children('caption').each((_, caption) => {
        const text = $(caption).text().replace(/\s+/g, ' ').trim();
        if (text) { el.before($('<p></p>').text(text)); retainedUnstructuredRuns++; }
      });
      return;
    }
    if (el.is(semantic)) { el.find('table').each((_, table) => { preserveRuns(table); }); return; }
    let run: AnyNode[] = [];
    function flush() {
      if (run.length && $(run).text().trim()) {
        $(run).wrapAll('<p></p>'); retainedUnstructuredRuns++;
      }
      run = [];
    }
    for (const child of [...node.children]) {
      if (child.type === 'comment') continue;
      if (child.type !== 'text' && $(child).is(excluded)) { flush(); continue; }
      if (child.type !== 'text' && ($(child).is(boundaries) || $(child).find(boundaries).length)) {
        flush(); preserveRuns(child);
      } else run.push(child);
    }
    flush();
  }
  const roots = $(scope).filter((_, node) => !$(node).parents(scope).length);
  if (!roots.length) issues.push({ reason: 'document_scope_unverified', target: null, chars: 0 });
  else if (roots.length > 1) issues.push({ reason: 'document_scope_ambiguous', target: null, chars: 0 });
  roots.each((_, node) => { preserveRuns(node); });
  return { html: $.html(), titles: [...new Set(titles)], retainedDisclosureIds, retainedDocumentHeaders, retainedUnstructuredRuns, issues, appliedExclusions };
}
export function extractEngineBody(html: string, sourceUrl: string, contentLanguage?: string, contract?: SourceContract | null): CaptureBody {
  if (Buffer.byteLength(html) > 5_000_000) throw new Error('response_body_too_large');
  if (detectBlockPage(html) || detectSoft404(html)) throw new Error('source_block_or_soft_404');
  // Identity is established by the reviewed contract, not English keyword counts.
  const prepared = prepareEngineHtml(html, contract);
  let text = extractPolicyText(prepared.html, sourceUrl, { minimumTextLength: 100 });
  const scoped = Boolean(new URL(sourceUrl).hash);
  const restoredTitleFromDom = !scoped && text.length >= 100 && prepared.titles.length === 1
    && !text.split(/\r?\n/).some(line => line.replace(/^#{1,6}\s+/, '').trim() === prepared.titles[0]);
  if (restoredTitleFromDom) text = `# ${prepared.titles[0]}\n\n${text}`;
  if (text.length < 100 || text.length > 500_000) throw new Error('extraction_size_out_of_bounds');
  const language = load(html)('html').attr('lang') || contentLanguage;
  return { html, document: structureDocument(text), ...(language ? { language } : {}),
    extraction: { retainedDisclosureIds: prepared.retainedDisclosureIds, retainedDocumentHeaders: prepared.retainedDocumentHeaders, retainedUnstructuredRuns: prepared.retainedUnstructuredRuns, restoredTitleFromDom, issues: prepared.issues, appliedExclusions: prepared.appliedExclusions,
      reviewedExclusionHash: digest(JSON.stringify(contract?.reviewedExclusions || [])) } };
}
/** Extraction uncertainty is a hard evidence gate, including cached/replayed bodies. */
export function assessCapture(body: CaptureBody, contract: SourceContract | null, sourceUrl: string) {
  const assessment = assessDocument(body.document, contract, sourceUrl, body.language);
  const exclusionsChanged = contract?.reviewedExclusions?.length && body.extraction?.reviewedExclusionHash !== digest(JSON.stringify(contract.reviewedExclusions));
  const reasons = [...new Set([...assessment.reasons, ...(exclusionsChanged ? ['reviewed_exclusion_context_mismatch'] : []), ...(body.extraction?.issues || []).map(issue => issue.reason)])];
  return { ...assessment, reasons, eligible: reasons.length === 0,
    completeness: body.extraction?.issues?.length ? 'unknown' : assessment.completeness };
}
export function cacheable(result: TransportResult, sourceUrl: string): boolean {
  const v = result.validators;
  // Conservative: no redirects and no Vary. Representation has a fixed client profile.
  return result.status === 200 && result.finalUrl === sourceUrl && Boolean(v?.etag || v?.lastModified)
    && !v?.vary && !/no-store|private/i.test(v?.cacheControl || '');
}

export async function acquire(input: TaskInput, transport: Transport = acquireEngineTransport): Promise<Observation> {
  const observedAt = new Date().toISOString();
  if (!input.contract || input.contract.sourceUrl !== input.sourceUrl) return { artifactId: null, observedAt, source: 'none', httpStatus: 0, finalUrl: input.sourceUrl,
    notModified: false, eligible: false, reasons: [input.contract ? 'source_contract_mismatch' : 'source_contract_missing'], diagnostics: [] };
  const key = digest(JSON.stringify([input.sourceUrl, input.profileHash, input.contractHash, 'engine-http-client-1']));
  const cached = !input.forceFresh ? await db.engineHttpCache.findUnique({ where: { key } }) : null;
  let cachedBody: CaptureBody | null = null;
  if (cached && cached.profileHash === input.profileHash && cached.expiresAt > new Date()) {
    try {
      cachedBody = await readArtifact<CaptureBody>(cached.artifactId);
      if (cachedBody.document.hash !== input.baselineHash) cachedBody = null;
    } catch { /* Corrupt cache forces a full retrieval. */ }
  }
  const diagnostics: Observation['diagnostics'] = [];
  const order: Array<'direct' | 'http2' | 'rendered'> = input.contract?.preferredTransport === 'rendered'
    ? ['rendered', 'direct', 'http2'] : ['direct', 'http2', 'rendered'];
  let lastStatus = 0, finalUrl = input.sourceUrl;
  let lastCandidate: Observation | null = null;
  for (const source of order) {
    let result: TransportResult;
    try { result = await transport(input.sourceUrl, source, source === 'direct' && cachedBody && cached
      ? { etag: cached.etag || undefined, lastModified: cached.lastModified || undefined } : undefined); }
    catch { diagnostics.push({ source, status: 0, reason: 'transport_failed' }); continue; }
    lastStatus = result.status; finalUrl = result.finalUrl;
    if (result.status === 429 || result.status === 503) {
      return { artifactId: null, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
        eligible: false, reasons: ['origin_backoff'], retryAfterMs: result.retryAfterMs || 60_000,
        diagnostics: [...diagnostics, { source, status: result.status, reason: 'origin_backoff' }] };
    }
    if (hasLiveHostDrift(input.sourceUrl, finalUrl, source) || hasLivePathDrift(input.sourceUrl, finalUrl, source)) {
      diagnostics.push({ source, status: result.status, reason: 'source_drift' }); continue;
    }
    if (result.status === 304) {
      if (input.forceFresh || source !== 'direct' || !cached || !cachedBody || finalUrl !== input.sourceUrl
        || result.validators?.vary || /no-store|private/i.test(result.validators?.cacheControl || '')) {
        diagnostics.push({ source, status: 304, reason: 'conditional_cache_ineligible' }); continue;
      }
      const assessment = assessCapture(cachedBody, input.contract, input.sourceUrl);
      return { artifactId: cached.artifactId, observedAt, source, httpStatus: 304, finalUrl, notModified: true,
        eligible: assessment.eligible, reasons: assessment.reasons, cache: { key, etag: cached.etag, lastModified: cached.lastModified, profileHash: input.profileHash },
        diagnostics: [...diagnostics, { source, status: 304, reason: 'cached_representation_revalidated' }] };
    }
    if (!result.ok) { diagnostics.push({ source, status: result.status, reason: 'transport_rejected' }); continue; }
    let body: CaptureBody;
    try { body = extractEngineBody(result.html, input.sourceUrl, result.validators?.contentLanguage, input.contract); }
    catch { diagnostics.push({ source, status: result.status, reason: 'extraction_rejected' }); continue; }
    const artifactId = await putArtifact(body);
    const assessment = assessCapture(body, input.contract, input.sourceUrl);
    diagnostics.push({ source, status: result.status, reason: assessment.eligible ? 'contract_satisfied' : assessment.reasons.join(',') });
    // A successful HTTP response with incomplete identity/coverage triggers the next transport.
    if (!assessment.eligible && source !== order[order.length - 1]) {
      lastCandidate = { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
        eligible: false, reasons: assessment.reasons, diagnostics };
      continue;
    }
    const cache = assessment.eligible && source === 'direct' && cacheable(result, input.sourceUrl)
      ? { key, etag: result.validators?.etag || null, lastModified: result.validators?.lastModified || null, profileHash: input.profileHash } : undefined;
    return { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
      eligible: assessment.eligible, reasons: assessment.reasons, diagnostics, cache };
  }
  if (lastCandidate) return { ...lastCandidate, diagnostics };
  return { artifactId: null, observedAt, source: 'none', httpStatus: lastStatus, finalUrl, notModified: false,
    eligible: false, reasons: ['live_source_unverified'], diagnostics };
}
