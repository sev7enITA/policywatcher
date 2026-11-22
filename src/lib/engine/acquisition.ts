import { load } from 'cheerio';
import { randomUUID } from 'node:crypto';
import type { AnyNode } from 'domhandler';
import { TransportIntegrityError, acquireEngineAttachment, acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift, extractPolicyText, detectBlockPage, detectSoft404, type TransportResult, type TransportProof } from '../scraper';
import { db } from '../db';
import { digest, normalized, structureDocument, assessDocument, type SourceContract, type StructuredDocument } from './document';
import { DAILY_MS, putArtifact, readArtifact, type TaskInput, type Tx } from './store';
import type { AttachmentCapture, CoverageReceipt } from './coverage';

export interface CaptureBody {
  html: string; document: StructuredDocument; language?: string;
  captureId?: string; documentUrl?: string; attachments?: AttachmentCapture[]; attachmentErrors?: Array<{ url: string; reason: string; httpStatus?: number; transportProof?: TransportProof }>;
  transportProof?: TransportProof;
  extraction?: { retainedDisclosureIds: string[]; retainedDocumentHeaders: number; restoredTitleFromDom: boolean; retainedUnstructuredRuns?: number; issues?: Array<{ reason: string; target: string | null; chars: number }>;
    reviewedExclusionHash?: string; appliedExclusions?: Array<{ selector: string; htmlSha256: string; reviewNote: string }> };
}
export interface Observation {
  artifactId: string | null; observedAt: string; source: string; httpStatus: number; finalUrl: string;
  notModified: boolean; eligible: boolean; reasons: string[]; retryAfterMs?: number;
  coverage?: CoverageReceipt; transportProof?: TransportProof;
  diagnostics: Array<{ source: string; status: number; reason: string; transportProof?: TransportProof }>;
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
  const chrome = 'nav, footer, aside, [role="banner"], [role="contentinfo"], [role="dialog"], .cookie-banner, #cookie-banner, .breadcrumb, .breadcrumbs, .nav-menu, #header, #footer, .sidebar';
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
  // Exclusion hashes bind the original DOM; presentation/code text is removed
  // only afterwards, before text-based scope gates and title recovery.
  $('script, style').remove();
  $('[role="dialog"]').each((_, element) => {
    const node = $(element); const chars = node.text().replace(/\s+/g, ' ').trim().length;
    if ((node.parents(scope).length || node.is(scope) || node.find(scope).length) && chars > 0) issues.push({ reason: 'dialog_document_scope_unverified', target: node.attr('id') || null, chars });
  });
  // Tag/class names alone do not prove that text within a legal document is UI.
  // Keep the raw body and hold until an exact, reviewed exclusion resolves it.
  $(`${chrome}, form, iframe, noscript, svg`).not('[role="dialog"]').each((_, element) => {
    const node = $(element); const chars = node.text().replace(/\s+/g, ' ').trim().length;
    if (chars && (node.parents(scope).length || node.is(scope) || node.find(scope).length)) {
      issues.push({ reason: 'removed_document_content_unreviewed', target: node.attr('id') || element.name, chars });
    }
  });
  // UI chrome stays excluded from analysis, but uncertain removals cannot pass.
  $(chrome).remove();
  const retainedDisclosureIds: string[] = [];
  const retainedDisclosureControls = new Set<AnyNode>();
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
      retainedDisclosureControls.add(control);
      if (targets.attr('aria-hidden') === 'true' && targets.find('p, li, table, blockquote, dt, dd').length) {
        targets.removeAttr('aria-hidden'); retainedDisclosureIds.push(id);
      }
    }
  });
  $('button, [role="button"], select, [role="combobox"]').each((_, element) => {
    const node = $(element); const chars = node.text().replace(/\s+/g, ' ').trim().length;
    const inlineLink = node.is('a[href][role="button"]') && !node.attr('aria-controls');
    if (chars && !inlineLink && !retainedDisclosureControls.has(element)
        && (node.parents(scope).length || node.is(scope) || node.find(scope).length)) {
      issues.push({ reason: 'interactive_document_content_unreviewed', target: node.attr('id') || element.name, chars });
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
    if (el.parents(scope).length && !el.find('h1,h2,h3,h4,h5,h6').length) {
      const chars = el.text().replace(/\s+/g, ' ').trim().length;
      if (chars) issues.push({ reason: 'removed_document_content_unreviewed', target: el.attr('id') || 'header', chars });
    }
    if (el.is('[role="banner"]') || el.parents(chrome).length || !el.parents(`${scope}, section`).length
        || !el.find('h1, h2, h3, h4, h5, h6').length) return;
    el.find('h1').each((_, h) => { documentTitles.add(h); });
    const external = !el.parents(scope).length;
    if (external && el.find('h1').length !== 1) issues.push({ reason: 'document_header_title_ambiguous', target: el.attr('id') || null, chars: el.text().trim().length });
    const extra = el.clone(); extra.find(external ? 'h1,nav' : 'h1,h2,h3,h4,h5,h6,nav').remove();
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
  const excluded = `${chrome},header,script,style,iframe,noscript,svg,form,[aria-hidden="true"]`;
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
    if (el.is(semantic)) {
      if (el.is('li,blockquote,dt,dd')) {
        // Keep the parent's inline lead/continuations for the ordered serializer;
        // only promote separate leaf layout blocks, not a wrapper around a list.
        function preserveNestedLayout(parent: AnyNode) {
          if (!('children' in parent)) return;
          for (const child of [...parent.children]) {
            if (child.type === 'text' || child.type === 'comment' || $(child).is(excluded)) continue;
            if ($(child).is(semantic) || ($(child).is(boundaries) && !$(child).find(boundaries).length)) preserveRuns(child);
            else preserveNestedLayout(child);
          }
        }
        preserveNestedLayout(node);
      } else el.find('table').each((_, table) => { preserveRuns(table); });
      return;
    }
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
  if (!roots.length) {
    issues.push({ reason: 'document_scope_unverified', target: null, chars: 0 });
    // Preserve unstructured body evidence for review. The missing-scope hold
    // remains mandatory even when a contract otherwise matches this content.
    preserveRuns($('body')[0]);
  }
  else if (roots.length > 1) issues.push({ reason: 'document_scope_ambiguous', target: null, chars: 0 });
  roots.each((_, node) => { preserveRuns(node); });
  return { html: $.html(), titles: [...new Set(titles)], retainedDisclosureIds, retainedDocumentHeaders, retainedUnstructuredRuns, issues, appliedExclusions };
}
export function extractEngineBody(html: string, sourceUrl: string, contentLanguage?: string, contract?: SourceContract | null): CaptureBody {
  if (Buffer.byteLength(html) > 5_000_000) throw new Error('response_body_too_large');
  if (detectBlockPage(html) || detectSoft404(html)) throw new Error('source_block_or_soft_404');
  // Identity is established by the reviewed contract, not English keyword counts.
  const prepared = prepareEngineHtml(html, contract);
  let text = extractPolicyText(prepared.html, sourceUrl, { minimumTextLength: 100, preserveNestedBlockOrder: true });
  const scoped = Boolean(new URL(sourceUrl).hash);
  const restoredTitleFromDom = !scoped && text.length >= 100 && prepared.titles.length === 1
    && !text.split(/\r?\n/).some(line => line.replace(/^#{1,6}\s+/, '').trim() === prepared.titles[0]);
  if (restoredTitleFromDom) text = `# ${prepared.titles[0]}\n\n${text}`;
  if (text.length < 100 || text.length > 500_000) throw new Error('extraction_size_out_of_bounds');
  const language = load(html)('html').attr('lang') || contentLanguage;
  return { html, captureId: randomUUID(), documentUrl: sourceUrl, document: structureDocument(text), ...(language ? { language } : {}),
    extraction: { retainedDisclosureIds: prepared.retainedDisclosureIds, retainedDocumentHeaders: prepared.retainedDocumentHeaders, retainedUnstructuredRuns: prepared.retainedUnstructuredRuns, restoredTitleFromDom, issues: prepared.issues, appliedExclusions: prepared.appliedExclusions,
      reviewedExclusionHash: digest(JSON.stringify(contract?.reviewedExclusions || [])) } };
}
/** Extraction uncertainty is a hard evidence gate, including cached/replayed bodies. */
export function assessCapture(body: CaptureBody, contract: SourceContract | null, sourceUrl: string) {
  const assessment = assessDocument(body.document, contract, sourceUrl, body.language, { captureId: body.captureId,
    attachmentLinks: expectedAttachmentLinks(body.html, sourceUrl, contract, body.documentUrl), attachments: body.attachments });
  const exclusionsChanged = contract?.reviewedExclusions?.length && body.extraction?.reviewedExclusionHash !== digest(JSON.stringify(contract.reviewedExclusions));
  const reasons = [...new Set([...assessment.reasons, ...(exclusionsChanged ? ['reviewed_exclusion_context_mismatch'] : []), ...(body.extraction?.issues || []).map(issue => issue.reason), ...(body.attachmentErrors || []).map(error => error.reason)])];
  return { ...assessment, reasons, eligible: reasons.length === 0,
    completeness: body.extraction?.issues?.length ? 'unknown' : assessment.completeness };
}
export function cacheable(result: TransportResult, sourceUrl: string): boolean {
  const v = result.validators;
  // Conservative: no redirects and no Vary. Representation has a fixed client profile.
  return result.status === 200 && result.finalUrl === sourceUrl && Boolean(v?.etag || v?.lastModified)
    && !v?.vary && !/no-store|private/i.test(v?.cacheControl || '');
}

export async function acquire(input: TaskInput, transport: Transport = acquireEngineTransport, attachmentTransport: typeof acquireEngineAttachment = acquireEngineAttachment): Promise<Observation> {
  let observedAt = new Date().toISOString();
  if (!input.contract || input.contract.sourceUrl !== input.sourceUrl) return { artifactId: null, observedAt, source: 'none', httpStatus: 0, finalUrl: input.sourceUrl,
    notModified: false, eligible: false, reasons: [input.contract ? 'source_contract_mismatch' : 'source_contract_missing'], diagnostics: [] };
  const key = digest(JSON.stringify([input.sourceUrl, input.profileHash, input.contractHash, 'engine-http-client-1']));
  const cached = !input.forceFresh ? await db.engineHttpCache.findUnique({ where: { key } }) : null;
  let cachedBody: CaptureBody | null = null;
  if (!input.contract.completenessInventory?.attachments?.length && cached && cached.profileHash === input.profileHash && cached.expiresAt > new Date()) {
    try {
      cachedBody = await readArtifact<CaptureBody>(cached.artifactId);
      if (cachedBody.document.hash !== input.baselineHash) cachedBody = null;
    } catch { /* Corrupt cache forces a full retrieval. */ }
  }
  const diagnostics: Observation['diagnostics'] = [];
  const attachmentRequests = new Map<string, ReturnType<typeof acquireEngineAttachment>>();
  const attachmentBudget = { reservedDecodedBytes: 0 };
  const order: Array<'direct' | 'http2' | 'rendered'> = input.contract?.preferredTransport === 'rendered'
    ? ['rendered', 'direct', 'http2'] : ['direct', 'http2', 'rendered'];
  let lastStatus = 0, finalUrl = input.sourceUrl;
  let lastCandidate: Observation | null = null;
  for (const source of order) {
    let result: TransportResult;
    try { result = await transport(input.sourceUrl, source, source === 'direct' && cachedBody && cached
      ? { etag: cached.etag || undefined, lastModified: cached.lastModified || undefined } : undefined); }
    catch (error) { const failure = boundedTransportFailure(error); lastStatus = failure.status; diagnostics.push({ source, ...failure }); continue; }
    // Confirmation spacing is measured between received representations, not
    // request starts. Each fallback response gets its own receipt timestamp.
    observedAt = new Date().toISOString();
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
        coverage: assessment.coverage, transportProof: result.transportProof,
        eligible: assessment.eligible, reasons: assessment.reasons, cache: { key, etag: cached.etag, lastModified: cached.lastModified, profileHash: input.profileHash },
        diagnostics: [...diagnostics, { source, status: 304, reason: 'cached_representation_revalidated' }] };
    }
    if (!result.ok) { diagnostics.push({ source, status: result.status, reason: 'transport_rejected', transportProof: result.transportProof }); continue; }
    let body: CaptureBody;
    try { body = extractEngineBody(result.html, input.sourceUrl, result.validators?.contentLanguage, input.contract); }
    catch { diagnostics.push({ source, status: result.status, reason: 'extraction_rejected', transportProof: result.transportProof }); continue; }
    body.documentUrl = result.finalUrl;
    if (result.transportProof) body.transportProof = result.transportProof;
    await captureExpectedAttachments(body, input, attachmentTransport, attachmentRequests, attachmentBudget);
    const artifactId = await putArtifact(body);
    const assessment = assessCapture(body, input.contract, input.sourceUrl);
    diagnostics.push({ source, status: result.status, reason: assessment.eligible
      ? assessment.coverage.state === 'matched_reviewed_reference' ? 'reviewed_reference_matched' : 'legacy_contract_only_coverage_unknown'
      : assessment.reasons.join(',') });
    // A successful HTTP response with incomplete identity/coverage triggers the next transport.
    if (!assessment.eligible && source !== order[order.length - 1]) {
      lastCandidate = { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
        coverage: assessment.coverage, transportProof: result.transportProof,
        eligible: false, reasons: assessment.reasons, diagnostics };
      continue;
    }
    const cache = assessment.eligible && source === 'direct' && cacheable(result, input.sourceUrl)
      ? { key, etag: result.validators?.etag || null, lastModified: result.validators?.lastModified || null, profileHash: input.profileHash } : undefined;
    return { artifactId, observedAt, source, httpStatus: result.status, finalUrl, notModified: false,
      coverage: assessment.coverage, transportProof: result.transportProof,
      eligible: assessment.eligible, reasons: assessment.reasons, diagnostics, cache };
  }
  if (lastCandidate) return { ...lastCandidate, diagnostics };
  return { artifactId: null, observedAt: new Date().toISOString(), source: 'none', httpStatus: lastStatus, finalUrl, notModified: false,
    eligible: false, reasons: ['live_source_unverified'], diagnostics };
}

/** Only exact reviewed attachment URLs are requested; no recursive crawler. */
export function expectedAttachmentLinks(html: string, sourceUrl: string, contract: SourceContract | null, documentUrl = sourceUrl): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);
  if (contract?.completenessInventory?.schemaVersion !== 2) return counts;
  const $ = load(html);
  const active = (node: AnyNode) => $(node).is('html') || $(node).parents('html').length > 0;
  const bases = $('base[href]').filter((_, node) => active(node) && (node as AnyNode & { namespace?: string }).namespace === 'http://www.w3.org/1999/xhtml');
  let documentBase = documentUrl;
  try {
    const documentLocation = new URL(documentUrl);
    if (!['http:', 'https:'].includes(documentLocation.protocol) || documentLocation.username || documentLocation.password) throw new Error('unsafe_document_location');
    if (bases.length > 1) throw new Error('ambiguous_document_base');
    if (bases.length) {
      const base = new URL(bases.first().attr('href')!, documentUrl);
      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('unsafe_document_base');
      documentBase = base.toString();
    }
  } catch { counts.unresolved_document_base = 1; return counts; }
  let roots = $('main, article, [role="main"]').filter((_, node) => active(node));
  try {
    const fragment = decodeURIComponent(new URL(sourceUrl).hash.slice(1));
    if (fragment) {
      roots = $('[id]').filter((_, node) => active(node) && $(node).attr('id') === fragment);
      if (roots.length !== 1) { counts.unresolved_fragment_scope = 1; return counts; }
    }
  } catch { counts.unresolved_fragment_scope = 1; return counts; }
  const anchors = (roots.length ? roots.find('a[href]').add(roots.filter('a[href]')) : $('a[href]')).filter((_, node) => active(node));
  const seen = new Set<AnyNode>();
  anchors.each((_, node) => {
    if (seen.has(node)) return; seen.add(node);
    try { const parsed = new URL($(node).attr('href')!, documentBase); const url = parsed.toString(); if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) counts[url] = (counts[url] || 0) + 1; } catch { /* malformed link cannot satisfy coverage */ }
  });
  return counts;
}
async function captureExpectedAttachments(body: CaptureBody, input: TaskInput, transport: typeof acquireEngineAttachment,
  requests: Map<string, ReturnType<typeof acquireEngineAttachment>>, budget: { reservedDecodedBytes: number }) {
  const expected = input.contract?.completenessInventory;
  if (expected?.schemaVersion !== 2 || !expected.attachments?.length) return;
  body.attachments = []; body.attachmentErrors = [];
  const links = expectedAttachmentLinks(body.html, input.sourceUrl, input.contract, body.documentUrl);
  let totalBytes = 0, totalText = 0;
  for (const attachment of expected.attachments) {
    if (new URL(attachment.url).origin !== new URL(input.sourceUrl).origin) {
      body.attachmentErrors.push({ url: attachment.url, reason: 'attachment_cross_origin_requires_dedicated_acquisition' }); continue;
    }
    if (links[attachment.url] !== attachment.linkOccurrences) {
      body.attachmentErrors.push({ url: attachment.url, reason: 'attachment_link_occurrences_mismatch' }); continue;
    }
    try {
      // Reusing an in-run promise prevents fallback retries from issuing more requests.
      if (!requests.has(attachment.url)) {
        const allowance = Math.min(1_000_000, 2_000_000 - budget.reservedDecodedBytes);
        if (allowance <= 0) throw new Error('attachment_capture_budget_exceeded');
        // Reserve before a request. A failed read retains its reservation because
        // its consumed decoded output is unknown; successful small reads refund it.
        budget.reservedDecodedBytes += allowance;
        requests.set(attachment.url, transport(attachment.url, allowance).then(result => {
          if (result.bytes.length > allowance) throw new Error('attachment_capture_budget_exceeded');
          budget.reservedDecodedBytes -= allowance - result.bytes.length;
          return result;
        }));
      }
      const result = await requests.get(attachment.url)!;
      if (result.status !== 200 || result.finalUrl !== attachment.url || result.mediaType !== attachment.mediaType) throw new Error('attachment_identity_or_type_mismatch');
      totalBytes += result.bytes.length;
      if (result.bytes.length > 1_000_000 || totalBytes > 2_000_000) throw new Error('attachment_capture_budget_exceeded');
      const captured = extractEngineBody(result.html, attachment.url, result.language);
      totalText += captured.document.text.length;
      if (totalText > 1_000_000) throw new Error('attachment_capture_budget_exceeded');
      body.attachments.push({ url: attachment.url, finalUrl: result.finalUrl, status: result.status,
        mediaType: result.mediaType, bytesBase64: result.bytes.toString('base64'), extractionIssues: (captured.extraction?.issues || []).map(issue => issue.reason), document: captured.document,
        language: captured.language, transportProof: result.transportProof });
    } catch (error) {
      const token = error instanceof Error && ['attachment_capture_budget_exceeded', 'attachment_identity_or_type_mismatch'].includes(error.message)
        ? error.message : 'attachment_capture_failed';
      if (error instanceof TransportIntegrityError) {
        const failure = boundedTransportFailure(error);
        body.attachmentErrors.push({ url: attachment.url, reason: 'attachment_' + failure.reason, httpStatus: failure.status, transportProof: failure.transportProof });
      } else body.attachmentErrors.push({ url: attachment.url, reason: token });
    }
  }
}


const integrityFailureCodes = new Set([
  'request_failed', 'response_stream_failed', 'response_aborted', 'response_incomplete', 'response_length_mismatch',
  'http_206_partial_response', 'invalid_content_length', 'response_body_too_large', 'response_decode_failed',
  'response_range_length_mismatch', 'h2_invalid_content_length', 'h2_206_partial_response', 'h2_response_body_too_large',
  'h2_response_incomplete', 'h2_response_length_mismatch', 'h2_response_decode_failed', 'h2_response_aborted', 'h2_request_failed',
]);
/** Preserve bounded transport facts, never raw exception/server text or extra properties. */
function boundedTransportFailure(error: unknown): Omit<Observation['diagnostics'][number], 'source'> {
  if (!(error instanceof TransportIntegrityError)) return { status: 0, reason: 'transport_failed' };
  const status = Number.isInteger(error.httpStatus) && error.httpStatus >= 0 && error.httpStatus <= 599 ? error.httpStatus : 0;
  const reason = integrityFailureCodes.has(error.message) ? error.message : 'transport_integrity_rejected';
  const proof = error.transportProof;
  const enums: Array<[unknown, readonly unknown[]]> = [
    [proof?.scope, ['origin_response', 'archive_response', 'renderer_api_response']],
    [proof?.protocol, ['http1', 'http2', 'fetch']], [proof?.byteRepresentation, ['encoded', 'decoded']],
    [proof?.streamEnd, ['observed', 'not_observed']], [proof?.framing, ['complete', 'incomplete', 'unknown']],
    [proof?.lengthCheck, ['matched', 'mismatch', 'not_declared', 'not_comparable']],
    [proof?.decoding, ['completed', 'failed', 'not_applied']],
  ];
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  if (!proof || proof.schemaVersion !== 1 || enums.some(([value, allowed]) => !allowed.includes(value))
    || !count(proof.receivedBytes) || (proof.declaredContentLength !== null && !count(proof.declaredContentLength))) return { status, reason };
  return { status, reason, transportProof: { schemaVersion: 1, scope: proof.scope, protocol: proof.protocol,
    byteRepresentation: proof.byteRepresentation, declaredContentLength: proof.declaredContentLength,
    receivedBytes: proof.receivedBytes, streamEnd: proof.streamEnd, framing: proof.framing,
    lengthCheck: proof.lengthCheck, decoding: proof.decoding, entityCompleteness: 'not_proven' } };
}
