import { createHash } from 'node:crypto';
import { structureDocument, type DocumentBlock, type StructuredDocument } from './document';
import type { TransportProof } from '../scraper';

/** NFC preserves compatibility characters and case; only whitespace runs are collapsed. */
export const normalizeCoverageUnit = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim();
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const HASH = /^[a-f0-9]{64}$/;
const KINDS = ['heading', 'paragraph', 'list', 'table'];
export interface CoverageScope { sourceUrl: string; language: 'en' | 'it'; referenceVersion: string }
export interface CoverageUnit { kind: DocumentBlock['kind']; section: string[]; textSha256: string; occurrences: number }
export interface ReviewedCoverageInventory {
  schemaVersion: 1 | 2;
  scope: CoverageScope;
  scopeId: string;
  reference: {
    method: 'manual_reference' | 'publisher_reference' | 'independent_capture';
    url: string; sha256: string; capturedAt: string; reviewedAt: string; reviewNote: string;
  };
  units: CoverageUnit[];
  sequenceSha256: string;
  inventorySha256: string;
  /** Version 2 requires these fields; version 1 remains a private observation reference. */
  independence?: { captureId: string; reviewId: string; procedure: string; independentOfCandidate: true };
  elements?: ExpectedElement[];
  attachments?: ExpectedAttachment[];
  links?: Array<{ url: string; occurrences: number; purpose: 'attachment' | 'reference' | 'navigation' }>;
}
export interface ExpectedElement extends CoverageUnit { id: string; elementKind: 'section' | 'clause' | 'table_row' }
export interface ExpectedAttachment {
  id: string; url: string; mediaType: 'text/html' | 'text/plain' | 'application/pdf';
  bytesSha256: string; linkOccurrences: number; coverage: ReviewedCoverageInventory;
}
export interface AttachmentCapture {
  url: string; finalUrl: string; status: number; mediaType: string;
  bytesBase64: string; extractionIssues: string[]; document: StructuredDocument; language?: string; transportProof?: TransportProof;
}
export interface CoverageEvidence {
  captureId?: string; attachmentLinks?: Record<string, number>; attachments?: AttachmentCapture[];
}
export interface DetailedCoverageReceipt {
  state: 'not_configured' | 'mismatch' | 'matched_reviewed_inventory';
  independence: 'not_configured' | 'reviewer_attested';
  expectedSections: number; missingSections: number; expectedClauses: number; missingClauses: number;
  expectedTableRows: number; missingTableRows: number; expectedAttachments: number; matchedAttachments: number;
  linkState: 'not_configured' | 'mismatch' | 'matched'; missingLinks: number; unexpectedLinks: number;
  elements: Array<{ id: string; kind: ExpectedElement['elementKind']; expected: number; observed: number }>;
  attachments: Array<{ id: string; state: 'missing' | 'mismatch' | 'matched'; reasons: string[] }>;
}
export interface CoverageReceipt {
  referenceOriginVerified: false;
  sourceCompletenessQualified: false;
  state: 'not_configured' | 'mismatch' | 'matched_reviewed_reference';
  inventorySha256: string | null; scopeId: string | null;
  detail: DetailedCoverageReceipt;
  expectedUnits: number; observedUnits: number; expectedGroups: number; observedGroups: number;
  missingUnits: number; unexpectedUnits: number; orderMatches: boolean | null; reasons: string[];
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(value);
}
export const coverageScopeId = (scope: CoverageScope) => hash(canonical(scope));
export function coverageInventoryDigest(inventory: Omit<ReviewedCoverageInventory, 'inventorySha256'>): string {
  return hash(canonical(inventory));
}
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  return Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k))
    && Object.values(Object.getOwnPropertyDescriptors(value)).every(d => Object.hasOwn(d, 'value'));
}
const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
function url(v: unknown): boolean {
  try { if (!text(v, 2048)) return false; const u = new URL(v as string); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
function date(v: unknown): boolean {
  return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v))
    && new Date(v).toISOString().replace('.000Z', 'Z') === v.replace('.000Z', 'Z');
}
function groupKey(unit: Pick<CoverageUnit, 'kind' | 'section' | 'textSha256'>): string {
  return canonical([unit.kind, unit.section, unit.textSha256]);
}
function checkInventoryBudget(value: unknown): void {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new Set<object>();
  let nodes = 0, bytes = 0;
  while (pending.length) {
    const entry = pending.pop()!;
    if (++nodes > 120_000 || entry.depth > 16) throw new Error('completeness_inventory_budget_exceeded');
    if (typeof entry.value === 'string') {
      bytes += Buffer.byteLength(entry.value, 'utf8');
      if (entry.value.length > 2048 || bytes > 2_000_000) throw new Error('completeness_inventory_budget_exceeded');
    } else if (entry.value && typeof entry.value === 'object') {
      if (seen.has(entry.value)) throw new Error('invalid_completeness_inventory');
      seen.add(entry.value);
      if (!Array.isArray(entry.value) && ![Object.prototype, null].includes(Object.getPrototypeOf(entry.value))) throw new Error('invalid_completeness_inventory');
      if (Object.getOwnPropertySymbols(entry.value).length) throw new Error('invalid_completeness_inventory');
      const descriptors = Object.getOwnPropertyDescriptors(entry.value);
      if (Object.keys(descriptors).length > 10_001) throw new Error('completeness_inventory_budget_exceeded');
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (key.length > 100 || !Object.hasOwn(descriptor, 'value') || ['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('invalid_completeness_inventory');
        pending.push({ value: descriptor.value, depth: entry.depth + 1 });
      }
    }
  }
}
/** Pure parser: metadata records a review attestation, not independently authenticated authorship. */
export function parseCoverageInventory(value: unknown): ReviewedCoverageInventory {
  checkInventoryBudget(value);
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 512 * 1024) throw new Error('completeness_inventory_budget_exceeded');
  const version2 = Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).schemaVersion === 2);
  const fields = ['schemaVersion', 'scope', 'scopeId', 'reference', 'units', 'sequenceSha256', 'inventorySha256', ...(version2 ? ['independence', 'elements', 'attachments', 'links'] : [])];
  if (!exact(value, fields) || ![1, 2].includes(value.schemaVersion as number)
    || !exact(value.scope, ['sourceUrl', 'language', 'referenceVersion']) || !url(value.scope.sourceUrl)
    || !['en', 'it'].includes(value.scope.language as string) || !text(value.scope.referenceVersion, 200)
    || !exact(value.reference, ['method', 'url', 'sha256', 'capturedAt', 'reviewedAt', 'reviewNote'])
    || !['manual_reference', 'publisher_reference', 'independent_capture'].includes(value.reference.method as string)
    || !url(value.reference.url) || typeof value.reference.sha256 !== 'string' || !HASH.test(value.reference.sha256)
    || !date(value.reference.capturedAt) || !date(value.reference.reviewedAt)
    || Date.parse(value.reference.capturedAt as string) > Date.parse(value.reference.reviewedAt as string)
    || Date.parse(value.reference.capturedAt as string) > Date.now() || Date.parse(value.reference.reviewedAt as string) > Date.now()
    || !text(value.reference.reviewNote, 2000) || (value.reference.reviewNote as string).trim().length < 20
    || !Array.isArray(value.units) || !value.units.length || value.units.length > 10_000
    || typeof value.sequenceSha256 !== 'string' || !HASH.test(value.sequenceSha256)
    || typeof value.scopeId !== 'string' || !HASH.test(value.scopeId)
    || typeof value.inventorySha256 !== 'string' || !HASH.test(value.inventorySha256)) throw new Error('invalid_completeness_inventory');
  const groups = new Set<string>();
  let count = 0;
  const units: CoverageUnit[] = value.units.map(raw => {
    if (!exact(raw, ['kind', 'section', 'textSha256', 'occurrences']) || !KINDS.includes(raw.kind as string)
      || !Array.isArray(raw.section) || raw.section.length > 6
      || raw.section.some(s => !text(s, 1000) || normalizeCoverageUnit(s as string) !== s)
      || typeof raw.textSha256 !== 'string' || !HASH.test(raw.textSha256)
      || !Number.isSafeInteger(raw.occurrences) || (raw.occurrences as number) < 1 || (raw.occurrences as number) > 10_000) throw new Error('invalid_completeness_unit');
    const unit = { kind: raw.kind, section: [...raw.section], textSha256: raw.textSha256, occurrences: raw.occurrences } as CoverageUnit;
    const key = groupKey(unit);
    if (groups.has(key)) throw new Error('duplicate_completeness_group');
    groups.add(key); count += unit.occurrences;
    if (count > 10_000) throw new Error('completeness_inventory_budget_exceeded');
    return unit;
  });
  const body: Omit<ReviewedCoverageInventory, 'inventorySha256'> = {
    schemaVersion: value.schemaVersion as 1 | 2,
    scope: { sourceUrl: value.scope.sourceUrl as string, language: value.scope.language as 'en' | 'it', referenceVersion: value.scope.referenceVersion as string },
    scopeId: value.scopeId,
    reference: {
      method: value.reference.method as ReviewedCoverageInventory['reference']['method'], url: value.reference.url as string,
      sha256: value.reference.sha256, capturedAt: value.reference.capturedAt as string,
      reviewedAt: value.reference.reviewedAt as string, reviewNote: value.reference.reviewNote as string,
    }, units, sequenceSha256: value.sequenceSha256,
  };
  if (version2) Object.assign(body, parseInventoryDetail(value, body));
  if (coverageScopeId(body.scope) !== body.scopeId || coverageInventoryDigest(body) !== value.inventorySha256) throw new Error('completeness_inventory_digest_mismatch');
  return { ...body, inventorySha256: value.inventorySha256 };
}
/** Observed grouping only. Never generates or approves a reference inventory. */
export function observedCoverageUnits(document: StructuredDocument): CoverageUnit[] {
  const groups = new Map<string, CoverageUnit>();
  for (const block of document.blocks) {
    const unit: CoverageUnit = { kind: block.kind, section: block.section.map(normalizeCoverageUnit), textSha256: hash(normalizeCoverageUnit(block.text)), occurrences: 1 };
    const key = groupKey(unit), found = groups.get(key);
    if (found) found.occurrences++; else groups.set(key, unit);
  }
  return [...groups.values()].sort((a, b) => { const left = groupKey(a), right = groupKey(b); return left < right ? -1 : left > right ? 1 : 0; });
}
/** Observed order fingerprint; it never approves an independent reference. */
export function observedCoverageSequenceDigest(document: StructuredDocument): string {
  return hash(canonical(document.blocks.map(block => [block.kind, block.section.map(normalizeCoverageUnit), hash(normalizeCoverageUnit(block.text))])));
}
export function assessCoverage(document: StructuredDocument, inventory: unknown, sourceUrl: string, languageHint?: string, evidence: CoverageEvidence = {}): CoverageReceipt {
  const recomputed = structureDocument(document.text);
  const structureMatches = document.hash === recomputed.hash && JSON.stringify(document.blocks) === JSON.stringify(recomputed.blocks);
  document = recomputed;
  const observed = observedCoverageUnits(document);
  const receipt: CoverageReceipt = { referenceOriginVerified: false, sourceCompletenessQualified: false,
    detail: emptyDetail(), state: 'not_configured', inventorySha256: null, scopeId: null, expectedUnits: 0, observedUnits: document.blocks.length,
    expectedGroups: 0, observedGroups: observed.length, missingUnits: 0, unexpectedUnits: 0, orderMatches: null, reasons: ['completeness_reference_not_configured'] };
  if (inventory === undefined) return receipt;
  let reference: ReviewedCoverageInventory;
  try { reference = parseCoverageInventory(inventory); } catch { return { ...receipt, state: 'mismatch', reasons: ['completeness_inventory_invalid'] }; }
  receipt.state = 'mismatch'; receipt.reasons = structureMatches ? [] : ['retained_document_structure_mismatch']; receipt.inventorySha256 = reference.inventorySha256; receipt.scopeId = reference.scopeId;
  receipt.expectedGroups = reference.units.length; receipt.expectedUnits = reference.units.reduce((n, u) => n + u.occurrences, 0);
  if (sourceUrl !== reference.scope.sourceUrl) receipt.reasons.push('completeness_scope_mismatch');
  if (languageHint?.toLowerCase().split(/[-_]/)[0] !== reference.scope.language) receipt.reasons.push('completeness_language_mismatch');
  const expectedMap = new Map(reference.units.map(u => [groupKey(u), u.occurrences]));
  const observedMap = new Map(observed.map(u => [groupKey(u), u.occurrences]));
  for (const [key, count] of expectedMap) receipt.missingUnits += Math.max(0, count - (observedMap.get(key) || 0));
  for (const [key, count] of observedMap) receipt.unexpectedUnits += Math.max(0, count - (expectedMap.get(key) || 0));
  if (receipt.missingUnits) receipt.reasons.push('completeness_reference_units_missing');
  if (receipt.unexpectedUnits) receipt.reasons.push('completeness_unexpected_units');
  receipt.orderMatches = observedCoverageSequenceDigest(document) === reference.sequenceSha256;
  if (!receipt.orderMatches) receipt.reasons.push('completeness_order_mismatch');
  receipt.detail = assessDetail(document, reference, observed, evidence);
  if (receipt.detail.state === 'mismatch') receipt.reasons.push('independent_content_inventory_mismatch');
  if (!receipt.reasons.length) receipt.state = 'matched_reviewed_reference';
  return receipt;
}
export function publicationCoverageSatisfied(assessment: { eligible: boolean; coverage?: CoverageReceipt }): boolean {
  return assessment.eligible && assessment.coverage?.state === 'matched_reviewed_reference'
    && assessment.coverage.detail?.state === 'matched_reviewed_inventory'
    // Claim analysis currently compares the parent document only. A complete
    // attachment inventory must not silently authorize an unanalysed annex change.
    && assessment.coverage.detail.expectedAttachments === 0;
}


const elementKind = (kind: CoverageUnit['kind']): ExpectedElement['elementKind'] => kind === 'heading' ? 'section' : kind === 'table' ? 'table_row' : 'clause';
const identifier = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{1,119}$/.test(value);
function parseInventoryDetail(raw: Record<string, unknown>, base: Omit<ReviewedCoverageInventory, 'inventorySha256'>) {
  const independence = raw.independence;
  if (!exact(independence, ['captureId', 'reviewId', 'procedure', 'independentOfCandidate'])
    || !identifier(independence.captureId) || !identifier(independence.reviewId)
    || !text(independence.procedure, 2000) || (independence.procedure as string).trim().length < 30
    || independence.independentOfCandidate !== true || !Array.isArray(raw.elements)
    || raw.elements.length !== base.units.length || !Array.isArray(raw.attachments) || raw.attachments.length > 4 || !Array.isArray(raw.links) || raw.links.length > 1000) {
    throw new Error('invalid_independent_content_inventory');
  }
  const groups = new Map(base.units.map(unit => [groupKey(unit), unit.occurrences]));
  const ids = new Set<string>();
  const elements = raw.elements.map(rawElement => {
    if (!exact(rawElement, ['id', 'elementKind', 'kind', 'section', 'textSha256', 'occurrences'])
      || !identifier(rawElement.id) || ids.has(rawElement.id as string)
      || !KINDS.includes(rawElement.kind as string) || !Array.isArray(rawElement.section)
      || rawElement.section.some(s => typeof s !== 'string') || rawElement.section.length > 6
      || rawElement.elementKind !== elementKind(rawElement.kind as CoverageUnit['kind'])) throw new Error('invalid_expected_element');
    const element = rawElement as unknown as ExpectedElement;
    if (groups.get(groupKey(element)) !== element.occurrences) throw new Error('expected_element_not_bound_to_reference');
    ids.add(element.id); groups.delete(groupKey(element));
    return { id: element.id, elementKind: element.elementKind, kind: element.kind, section: [...element.section], textSha256: element.textSha256, occurrences: element.occurrences };
  });
  if (groups.size) throw new Error('expected_elements_incomplete');
  const linkUrls = new Set<string>();
  const links = (raw.links as unknown[]).map(link => {
    if (!exact(link, ['url', 'occurrences', 'purpose']) || !text(link.url, 2048)
      || !['attachment', 'reference', 'navigation'].includes(link.purpose as string)
      || !Number.isSafeInteger(link.occurrences) || (link.occurrences as number) < 1 || (link.occurrences as number) > 1000) throw new Error('invalid_reference_link');
    let destination: URL;
    try { destination = new URL(link.url as string); } catch { throw new Error('invalid_reference_link'); }
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(destination.protocol) || destination.username || destination.password
      || destination.toString() !== link.url || linkUrls.has(link.url as string)) throw new Error('invalid_reference_link');
    linkUrls.add(link.url as string);
    return { url: link.url as string, occurrences: link.occurrences as number, purpose: link.purpose as 'attachment' | 'reference' | 'navigation' };
  });
  const urls = new Set<string>();
  const attachments = raw.attachments.map(rawAttachment => {
    if (!exact(rawAttachment, ['id', 'url', 'mediaType', 'bytesSha256', 'linkOccurrences', 'coverage'])
      || !identifier(rawAttachment.id) || ids.has(rawAttachment.id as string) || !url(rawAttachment.url)
      || (rawAttachment.url as string).length > 2048 || new URL(rawAttachment.url as string).hash
      || urls.has(rawAttachment.url as string) || rawAttachment.url === base.scope.sourceUrl
      || !['text/html', 'text/plain', 'application/pdf'].includes(rawAttachment.mediaType as string)
      || typeof rawAttachment.bytesSha256 !== 'string' || !HASH.test(rawAttachment.bytesSha256)
      || !Number.isSafeInteger(rawAttachment.linkOccurrences) || (rawAttachment.linkOccurrences as number) < 1 || (rawAttachment.linkOccurrences as number) > 100
      || !rawAttachment.coverage || typeof rawAttachment.coverage !== 'object' || (rawAttachment.coverage as Record<string, unknown>).schemaVersion !== 1) throw new Error('invalid_expected_attachment');
    const coverage = parseCoverageInventory(rawAttachment.coverage);
    if (coverage.scope.sourceUrl !== rawAttachment.url || coverage.scope.language !== base.scope.language) throw new Error('attachment_reference_scope_mismatch');
    ids.add(rawAttachment.id as string); urls.add(rawAttachment.url as string);
    return { id: rawAttachment.id as string, url: rawAttachment.url as string,
      mediaType: rawAttachment.mediaType as ExpectedAttachment['mediaType'], bytesSha256: rawAttachment.bytesSha256,
      linkOccurrences: rawAttachment.linkOccurrences as number, coverage };
  });
  if (attachments.some(attachment => !links.some(link => link.url === attachment.url && link.purpose === 'attachment' && link.occurrences === attachment.linkOccurrences))
    || links.some(link => link.purpose === 'attachment' && !attachments.some(attachment => attachment.url === link.url))) throw new Error('attachment_link_inventory_incomplete');
  return { links, independence: { captureId: independence.captureId as string, reviewId: independence.reviewId as string,
    procedure: independence.procedure as string, independentOfCandidate: true as const }, elements, attachments };
}
function emptyDetail(): DetailedCoverageReceipt {
  return { state: 'not_configured', independence: 'not_configured', expectedSections: 0, missingSections: 0,
    expectedClauses: 0, missingClauses: 0, expectedTableRows: 0, missingTableRows: 0,
    expectedAttachments: 0, matchedAttachments: 0, linkState: 'not_configured', missingLinks: 0, unexpectedLinks: 0, elements: [], attachments: [] };
}
function assessDetail(document: StructuredDocument, reference: ReviewedCoverageInventory, observed: CoverageUnit[], evidence: CoverageEvidence): DetailedCoverageReceipt {
  const receipt = emptyDetail();
  if (reference.schemaVersion !== 2 || !reference.independence || !reference.elements || !reference.attachments) return receipt;
  receipt.independence = 'reviewer_attested'; receipt.state = 'matched_reviewed_inventory';
  if (!evidence.captureId || evidence.captureId === reference.independence.captureId) receipt.state = 'mismatch';
  const actualLinks = evidence.attachmentLinks || {};
  const expectedLinks = new Map(reference.links!.map(link => [link.url, link.occurrences]));
  for (const [url, count] of expectedLinks) receipt.missingLinks += Math.max(0, count - (actualLinks[url] || 0));
  for (const [url, count] of Object.entries(actualLinks)) receipt.unexpectedLinks += Math.max(0, count - (expectedLinks.get(url) || 0));
  receipt.linkState = evidence.attachmentLinks && !receipt.missingLinks && !receipt.unexpectedLinks ? 'matched' : 'mismatch';
  if (receipt.linkState !== 'matched') receipt.state = 'mismatch';
  const groups = new Map(observed.map(unit => [groupKey(unit), unit.occurrences]));
  for (const element of reference.elements) {
    const found = groups.get(groupKey(element)) || 0;
    receipt.elements.push({ id: element.id, kind: element.elementKind, expected: element.occurrences, observed: found });
    const missing = Math.max(0, element.occurrences - found);
    if (element.elementKind === 'section') { receipt.expectedSections += element.occurrences; receipt.missingSections += missing; }
    if (element.elementKind === 'clause') { receipt.expectedClauses += element.occurrences; receipt.missingClauses += missing; }
    if (element.elementKind === 'table_row') { receipt.expectedTableRows += element.occurrences; receipt.missingTableRows += missing; }
    if (found !== element.occurrences) receipt.state = 'mismatch';
  }
  const captures = evidence.attachments || [];
  receipt.expectedAttachments = reference.attachments.length;
  for (const attachment of reference.attachments) {
    const candidates = captures.filter(capture => capture.url === attachment.url);
    const reasons: string[] = [];
    if (evidence.attachmentLinks?.[attachment.url] !== attachment.linkOccurrences) reasons.push('attachment_link_occurrences_mismatch');
    if (candidates.length !== 1) reasons.push(candidates.length ? 'attachment_capture_ambiguous' : 'attachment_capture_missing');
    const capture = candidates[0];
    if (capture) {
      if (capture.status !== 200 || capture.finalUrl !== attachment.url) reasons.push('attachment_identity_mismatch');
      if (capture.mediaType !== attachment.mediaType) reasons.push('attachment_media_type_mismatch');
      if (!capture.transportProof || capture.transportProof.scope !== 'origin_response' || capture.transportProof.framing !== 'complete'
        || capture.transportProof.decoding !== 'completed') reasons.push('attachment_transport_unproven');
      const bytes = typeof capture.bytesBase64 === 'string' && capture.bytesBase64.length <= 1_333_336 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(capture.bytesBase64)
        ? Buffer.from(capture.bytesBase64, 'base64') : Buffer.alloc(0);
      if (!bytes.length || bytes.length > 1_000_000 || bytes.toString('base64') !== capture.bytesBase64 || hashBytes(bytes) !== attachment.bytesSha256) reasons.push('attachment_bytes_mismatch');
      if (attachment.mediaType === 'application/pdf' && bytes.subarray(0, 5).toString('ascii') !== '%PDF-') reasons.push('attachment_pdf_signature_missing');
      if (!Array.isArray(capture.extractionIssues) || capture.extractionIssues.length) reasons.push('attachment_extraction_unverified');
      if (capture.document.hash !== hash(capture.document.text)
        || assessCoverage(capture.document, attachment.coverage, attachment.url, capture.language).state !== 'matched_reviewed_reference') reasons.push('attachment_extraction_coverage_mismatch');
    }
    if (!reasons.length) receipt.matchedAttachments++; else receipt.state = 'mismatch';
    receipt.attachments.push({ id: attachment.id, state: !capture ? 'missing' : reasons.length ? 'mismatch' : 'matched', reasons });
  }
  if (captures.some(c => !reference.attachments!.some(a => a.url === c.url))) receipt.state = 'mismatch';
  // Document hash is checked independently from per-block matching.
  if (document.hash !== hash(document.text)) receipt.state = 'mismatch';
  return receipt;
}
const hashBytes = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
