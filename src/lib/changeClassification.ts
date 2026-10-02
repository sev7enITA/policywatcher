import { createHash } from 'node:crypto';
import { diffWordsWithSpace } from 'diff';
import { KPI_FIELD_KEYS } from './metricsCatalog';
import type { ChangeClassification, ChangeClassificationReason, ChangeEvidence, ChangeExcerpt, ChangeKind } from './changeClassificationTypes';

export const classificationSnapshotSelect = { id: true, policyId: true, text: true, publicEvidence: true, version: true } as const;

interface Snapshot {
  id?: string;
  policyId?: string;
  text: string;
  publicEvidence: boolean;
  version?: number;
}
interface Input {
  policyId?: string;
  oldSnapshot?: Snapshot | null;
  newSnapshot?: Snapshot | null;
  riskReasonsJson?: string | null;
}
interface Hunk { oldStart: number; oldEnd: number; newStart: number; newEnd: number }
const MAX_TEXT = 500_000;
const MAX_EVIDENCE = 4;
const cache = new Map<string, ChangeClassification>();
const kpis = new Set<string>(KPI_FIELD_KEYS);
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

/** Deliberately preserves case, numbers, punctuation, URLs, dates and word boundaries. */
export function normalizePresentation(text: string): string {
  return text.normalize('NFC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').trim();
}

function excerpt(text: string, from: number, to: number, focus?: number): ChangeExcerpt {
  const start = Math.max(0, (focus ?? from) - 80);
  const end = Math.min(text.length, Math.max(to, from + 1) + 80, start + 640);
  return { text: text.slice(start, end), start, end, changedStart: Math.max(start, Math.min(end, from)), changedEnd: Math.max(start, Math.min(end, to)) };
}

/** Recomputed from immutable evidence: no historic records or AI assessments are overwritten. */
export function classifyPolicyChange(input: Input): ChangeClassification {
  const old = input.oldSnapshot;
  const next = input.newSnapshot;
  const base = (kind: ChangeKind, reason: ChangeClassificationReason): ChangeClassification => ({
    version: '1.0', kind, reason, impact: 'not_assessed', compared: false,
    oldHash: null, newHash: null, oldVersion: null, newVersion: null, totalHunks: 0, evidence: [],
  });
  if (!old?.publicEvidence || !next?.publicEvidence || !old.text?.trim() || !next.text?.trim()
    || (old.policyId && next.policyId && old.policyId !== next.policyId)
    || (input.policyId && ((old.policyId && old.policyId !== input.policyId) || (next.policyId && next.policyId !== input.policyId)))) {
    return base('needs_review', 'missing_public_pair');
  }
  if (old.text.length > MAX_TEXT || next.text.length > MAX_TEXT) return base('needs_review', 'comparison_limit');
  const oldHash = sha(old.text), newHash = sha(next.text);
  const reasonsJson = (input.riskReasonsJson ?? '').slice(0, 16_000);
  const key = `${oldHash}:${newHash}:${sha(reasonsJson)}:${old.version}:${next.version}`;
  const cached = cache.get(key);
  if (cached) return structuredClone(cached);
  const result = { ...base('needs_review', 'unverified_meaning'), oldHash, newHash, oldVersion: old.version ?? null, newVersion: next.version ?? null };
  const save = () => {
    if (cache.size >= 64) cache.delete(cache.keys().next().value!);
    cache.set(key, structuredClone(result));
    return result;
  };
  if (old.text === next.text) {
    Object.assign(result, { kind: 'unchanged', reason: 'identical_text', compared: true });
    return save();
  }
  const oldNormalized = normalizePresentation(old.text), newNormalized = normalizePresentation(next.text);
  const editorial = oldNormalized === newNormalized;
  const parts = diffWordsWithSpace(old.text, next.text, { timeout: 80, maxEditLength: 4000 });
  if (!parts) {
    Object.assign(result, { kind: editorial ? 'editorial' : 'needs_review', reason: editorial ? 'presentation_only' : 'comparison_limit', compared: editorial });
    return save();
  }
  result.compared = true;
  const hunks: Hunk[] = [];
  let oldOffset = 0, newOffset = 0, active: Hunk | null = null;
  for (const part of parts) {
    if (part.added || part.removed) {
      active ??= { oldStart: oldOffset, oldEnd: oldOffset, newStart: newOffset, newEnd: newOffset };
      if (part.removed) oldOffset += part.value.length;
      if (part.added) newOffset += part.value.length;
      active.oldEnd = oldOffset; active.newEnd = newOffset;
    } else {
      if (active) hunks.push(active);
      active = null;
      oldOffset += part.value.length; newOffset += part.value.length;
    }
  }
  if (active) hunks.push(active);
  result.totalHunks = hunks.length;
  let anchor: { hunk: Hunk; quote: NonNullable<ChangeEvidence['anchoredQuote']>; start: number } | undefined;
  // A quote in an unchanged passage does NOT establish a change. Neither do AI scores or summaries.
  if (!editorial && Math.min(old.text.length, next.text.length) / Math.max(old.text.length, next.text.length) >= 0.65) {
    let reasons: unknown = [];
    try { reasons = JSON.parse(reasonsJson); } catch { /* legacy malformed evidence stays unverified */ }
    if (Array.isArray(reasons)) for (const reason of reasons.slice(0, 3)) {
      if (!reason || typeof reason !== 'object') continue;
      const { evidenceQuote: quote, evidenceSide: side, relatedKpi } = reason;
      if (typeof quote !== 'string' || quote.length < 30 || quote.length > 240 || !quote.trim()
        || (side !== 'old' && side !== 'new') || !kpis.has(relatedKpi)) continue;
      const source = side === 'old' ? old.text : next.text;
      const other = side === 'old' ? newNormalized : oldNormalized;
      if (other.includes(normalizePresentation(quote))) continue;
      const start = source.indexOf(quote);
      if (start < 0) continue;
      const hunk = hunks.find(h => {
        const from = side === 'old' ? h.oldStart : h.newStart;
        const to = side === 'old' ? h.oldEnd : h.newEnd;
        return from < start + quote.length && to > start
          && normalizePresentation(old.text.slice(h.oldStart, h.oldEnd)) !== normalizePresentation(next.text.slice(h.newStart, h.newEnd));
      });
      if (hunk) { anchor = { hunk, quote: { text: quote, side, relatedKpi }, start }; break; }
    }
  }
  const selected = anchor ? [anchor.hunk, ...hunks.filter(h => h !== anchor.hunk)] : hunks;
  result.evidence = selected.slice(0, MAX_EVIDENCE).map(h => ({
    before: excerpt(old.text, h.oldStart, h.oldEnd, anchor?.hunk === h && anchor.quote.side === 'old' ? anchor.start : undefined),
    after: excerpt(next.text, h.newStart, h.newEnd, anchor?.hunk === h && anchor.quote.side === 'new' ? anchor.start : undefined),
    ...(anchor?.hunk === h ? { anchoredQuote: anchor.quote } : {}),
  }));
  if (editorial) Object.assign(result, { kind: 'editorial', reason: 'presentation_only' });
  else if (anchor) Object.assign(result, { kind: 'substantive', reason: 'changed_clause_anchor' });
  return save();
}

/** Keep full snapshot texts on the server for list endpoints. */
export function withChangeClassification<T extends Input>(row: T) {
  const { oldSnapshot: _old, newSnapshot: _new, ...publicRow } = row;
  return { ...publicRow, classification: classifyPolicyChange({ ...publicRow, oldSnapshot: _old, newSnapshot: _new }) };
}
