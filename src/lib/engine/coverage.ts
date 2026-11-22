import { createHash } from 'node:crypto';
import type { DocumentBlock, StructuredDocument } from './document';

/** NFC preserves compatibility characters and case; only whitespace runs are collapsed. */
export const normalizeCoverageUnit = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim();
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const HASH = /^[a-f0-9]{64}$/;
const KINDS = ['heading', 'paragraph', 'list', 'table'];
export interface CoverageScope { sourceUrl: string; language: 'en' | 'it'; referenceVersion: string }
export interface CoverageUnit { kind: DocumentBlock['kind']; section: string[]; textSha256: string; occurrences: number }
export interface ReviewedCoverageInventory {
  schemaVersion: 1;
  scope: CoverageScope;
  scopeId: string;
  reference: {
    method: 'manual_reference' | 'publisher_reference' | 'independent_capture';
    url: string; sha256: string; capturedAt: string; reviewedAt: string; reviewNote: string;
  };
  units: CoverageUnit[];
  sequenceSha256: string;
  inventorySha256: string;
}
export interface CoverageReceipt {
  referenceOriginVerified: false;
  sourceCompletenessQualified: false;
  state: 'not_configured' | 'mismatch' | 'matched_reviewed_reference';
  inventorySha256: string | null; scopeId: string | null;
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
    if (++nodes > 120_000 || entry.depth > 8) throw new Error('completeness_inventory_budget_exceeded');
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
  if (!exact(value, ['schemaVersion', 'scope', 'scopeId', 'reference', 'units', 'sequenceSha256', 'inventorySha256']) || value.schemaVersion !== 1
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
    schemaVersion: 1,
    scope: { sourceUrl: value.scope.sourceUrl as string, language: value.scope.language as 'en' | 'it', referenceVersion: value.scope.referenceVersion as string },
    scopeId: value.scopeId,
    reference: {
      method: value.reference.method as ReviewedCoverageInventory['reference']['method'], url: value.reference.url as string,
      sha256: value.reference.sha256, capturedAt: value.reference.capturedAt as string,
      reviewedAt: value.reference.reviewedAt as string, reviewNote: value.reference.reviewNote as string,
    }, units, sequenceSha256: value.sequenceSha256,
  };
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
export function assessCoverage(document: StructuredDocument, inventory: unknown, sourceUrl: string, languageHint?: string): CoverageReceipt {
  const observed = observedCoverageUnits(document);
  const receipt: CoverageReceipt = { referenceOriginVerified: false, sourceCompletenessQualified: false,
    state: 'not_configured', inventorySha256: null, scopeId: null, expectedUnits: 0, observedUnits: document.blocks.length,
    expectedGroups: 0, observedGroups: observed.length, missingUnits: 0, unexpectedUnits: 0, orderMatches: null, reasons: ['completeness_reference_not_configured'] };
  if (inventory === undefined) return receipt;
  let reference: ReviewedCoverageInventory;
  try { reference = parseCoverageInventory(inventory); } catch { return { ...receipt, state: 'mismatch', reasons: ['completeness_inventory_invalid'] }; }
  receipt.state = 'mismatch'; receipt.reasons = []; receipt.inventorySha256 = reference.inventorySha256; receipt.scopeId = reference.scopeId;
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
  if (!receipt.reasons.length) receipt.state = 'matched_reviewed_reference';
  return receipt;
}
export function publicationCoverageSatisfied(assessment: { eligible: boolean; coverage?: CoverageReceipt }): boolean {
  return assessment.eligible && assessment.coverage?.state === 'matched_reviewed_reference';
}
