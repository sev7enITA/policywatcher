import { createHash } from 'node:crypto';
import { diffArrays } from 'diff';

export const ENGINE_SCHEMA = 'pw-engine-6.0.0-alpha.1';
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const normalized = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

export interface DocumentBlock {
  id: string;
  kind: 'heading' | 'paragraph' | 'list' | 'table';
  section: string[];
  text: string;
  start: number;
  end: number;
}
export interface StructuredDocument {
  schema: typeof ENGINE_SCHEMA;
  hash: string;
  text: string;
  blocks: DocumentBlock[];
}

/** Offsets are UTF-16 offsets into the exact frozen extraction, never model offsets. */
export function structureDocument(text: string): StructuredDocument {
  if (!text || text.length > 500_000) throw new Error('document_size_out_of_bounds');
  const blocks: DocumentBlock[] = [];
  const occurrences = new Map<string, number>();
  const sections: string[] = [];
  // Keep original line endings and UTF-16 positions; only paragraphs join wrapped lines.
  const lines = [...text.matchAll(/[^\r\n]+|\r\n|\r|\n/g)];
  const chunks: Array<{ start: number; end: number; paragraph: boolean }> = [];
  let paragraph: { start: number; end: number; paragraph: boolean } | null = null;
  let previousLineEnd = -1;
  for (const line of lines) {
    if (/^[\r\n]+$/.test(line[0])) continue;
    const body = line[0].trim();
    if (!body) { paragraph = null; continue; }
    const start = line.index + line[0].length - line[0].trimStart().length;
    const end = start + body.length;
    const isParagraph = !/^(#{1,6}\s|\||[-*+]\s|\d+[.)]\s)/.test(body);
    const gap = previousLineEnd < 0 ? '' : text.slice(previousLineEnd, start);
    const blankLine = (gap.match(/\r\n|\r|\n/g) || []).length > 1;
    if (isParagraph && paragraph && !blankLine) paragraph.end = end;
    else {
      paragraph = isParagraph ? { start, end, paragraph: true } : null;
      chunks.push(paragraph || { start, end, paragraph: false });
    }
    previousLineEnd = end;
  }
  for (const chunk of chunks) {
    const start = chunk.start;
    const body = text.slice(start, chunk.end);
    const heading = /^(#{1,6})\s+(.+)/.exec(body);
    const kind = heading ? 'heading' : body.startsWith('|') ? 'table' : /^(?:[-*+]|\d+[.)])\s/.test(body) ? 'list' : 'paragraph';
    if (heading) {
      sections.length = Math.min(sections.length, heading[1].length - 1);
      sections.push(heading[2]);
    }
    // A repeated value in another row or section remains a distinct occurrence.
    const key = digest(JSON.stringify([kind, sections, body.replace(/^#{1,6}\s+/, '')]));
    const ordinal = occurrences.get(key) || 0;
    occurrences.set(key, ordinal + 1);
    blocks.push({ id: `${key.slice(0, 24)}:${ordinal}`, kind, section: [...sections], text: body,
      start, end: start + body.length });
  }
  if (blocks.length > 10_000) throw new Error('document_structure_budget_exceeded');
  return { schema: ENGINE_SCHEMA, text, hash: digest(text), blocks };
}

export interface SourceContract {
  schemaVersion: 1;
  /** Exact approved retrieval URL, including the document fragment. */
  sourceUrl: string;
  titleAliases: string[];
  requiredHeadings: string[];
  terminalText: string;
  language: 'en' | 'it';
  minimumChars: number;
  maximumChars: number;
  preferredTransport: 'direct' | 'rendered';
  reviewedAt: string;
  reviewNote: string;
}

export function parseSourceContract(value: unknown): SourceContract {
  if (!value || typeof value !== 'object') throw new Error('invalid_source_contract');
  const c = value as SourceContract;
  const strings = (v: unknown, max: number) => Array.isArray(v) && v.length > 0 && v.length <= max
    && v.every(x => typeof x === 'string' && x.trim().length > 0 && x.length <= 300);
  let url: URL;
  try { url = new URL(c.sourceUrl); } catch { throw new Error('invalid_contract_url'); }
  if (c.schemaVersion !== 1 || !['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || !strings(c.titleAliases, 12) || !strings(c.requiredHeadings, 100)
      || typeof c.terminalText !== 'string' || c.terminalText.trim().length < 10 || c.terminalText.length > 1000
      || !['en', 'it'].includes(c.language) || !['direct', 'rendered'].includes(c.preferredTransport)
      || !Number.isInteger(c.minimumChars) || c.minimumChars < 100
      || !Number.isInteger(c.maximumChars) || c.maximumChars > 500_000 || c.maximumChars < c.minimumChars
      || !Number.isFinite(Date.parse(c.reviewedAt))
      || typeof c.reviewNote !== 'string' || c.reviewNote.trim().length < 10 || c.reviewNote.length > 2000) {
    throw new Error('invalid_source_contract');
  }
  return { schemaVersion: 1, sourceUrl: c.sourceUrl, titleAliases: [...c.titleAliases],
    requiredHeadings: [...c.requiredHeadings], terminalText: c.terminalText, language: c.language,
    minimumChars: c.minimumChars, maximumChars: c.maximumChars,
    preferredTransport: c.preferredTransport, reviewedAt: c.reviewedAt, reviewNote: c.reviewNote };
}

export function assessDocument(document: StructuredDocument, contract: SourceContract | null, sourceUrl: string,
  languageHint?: string): { eligible: boolean; reasons: string[]; identity: string; completeness: string } {
  if (!contract) return { eligible: false, reasons: ['source_contract_missing'], identity: 'unknown', completeness: 'unknown' };
  const reasons: string[] = [];
  if (contract.sourceUrl !== sourceUrl) reasons.push('source_contract_mismatch');
  const headings = document.blocks.filter(b => b.kind === 'heading').map(b => normalized(b.text.replace(/^#+\s*/, '')));
  const titleMatches = contract.titleAliases.some(alias => headings.slice(0, 10).includes(normalized(alias)));
  if (!titleMatches) reasons.push('document_identity_unverified');
  if (!contract.requiredHeadings.every(h => headings.includes(normalized(h)))) reasons.push('required_sections_missing');
  // A required terminal is checked near the end, not anywhere in the document.
  if (!normalized(document.text.slice(-Math.max(2000, contract.terminalText.length * 3))).includes(normalized(contract.terminalText))) {
    reasons.push('document_terminal_missing');
  }
  if (document.text.length < contract.minimumChars || document.text.length > contract.maximumChars) reasons.push('document_length_outside_contract');
  if (!languageHint || languageHint.toLowerCase().split(/[-_]/)[0] !== contract.language) reasons.push('document_language_unverified');
  return { eligible: reasons.length === 0, reasons, identity: titleMatches ? 'matched' : 'unknown',
    completeness: reasons.some(r => /missing|length/.test(r)) ? 'partial' : reasons.length ? 'unknown' : 'contract_satisfied' };
}

export interface ClauseDelta { id: string; side: 'old' | 'new'; block: DocumentBlock }
export interface ClauseComparison { kind: 'unchanged' | 'formatting' | 'changed'; deltas: ClauseDelta[] }
export function compareDocuments(oldDoc: StructuredDocument, newDoc: StructuredDocument): ClauseComparison {
  if (oldDoc.hash === newDoc.hash) return { kind: 'unchanged', deltas: [] };
  const content = (b: DocumentBlock) => b.text.replace(/^#{1,6}\s+/, '');
  const parts = diffArrays(oldDoc.blocks.map(content), newDoc.blocks.map(content), { maxEditLength: 2000 });
  if (!parts) throw new Error('comparison_budget_exceeded');
  const deltas: ClauseDelta[] = [];
  let oldIndex = 0, newIndex = 0;
  for (const part of parts) {
    if (part.removed) {
      for (const b of oldDoc.blocks.slice(oldIndex, oldIndex + part.value.length)) deltas.push({ id: `old:${b.id}`, side: 'old', block: b });
      oldIndex += part.value.length;
    } else if (part.added) {
      for (const b of newDoc.blocks.slice(newIndex, newIndex + part.value.length)) deltas.push({ id: `new:${b.id}`, side: 'new', block: b });
      newIndex += part.value.length;
    } else { oldIndex += part.value.length; newIndex += part.value.length; }
  }
  return { kind: deltas.length ? 'changed' : 'formatting', deltas };
}
