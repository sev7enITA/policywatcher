import { describe, expect, it } from 'vitest';
import { assessCapture, extractEngineBody } from '../engine/acquisition';
import { CLAIM_SCHEMA, validateClaims, type AnalysisInput, type ClaimSet } from '../engine/claims';
import { compareDocuments, structureDocument, type SourceContract } from '../engine/document';

const url = 'https://policy.example.test/it/privacy';
const terminal = 'Per informazioni aggiuntive scrivere al referente della protezione dei dati.';
const contract: SourceContract = {
  schemaVersion: 1, sourceUrl: url, titleAliases: ['Informativa sulla privacy'], requiredHeadings: ['Uso dei dati', 'Contatti'],
  terminalText: terminal, language: 'it', minimumChars: 100, maximumChars: 10_000, preferredTransport: 'direct',
  reviewedAt: '2026-11-20T10:00:00.000Z', reviewNote: 'Synthetic fixture review.',
};
const body = `<h1>Informativa sulla privacy</h1><h2>Uso dei dati</h2><p>Conserviamo le richieste di assistenza per il periodo specificato nei termini del servizio.</p><h2>Contatti</h2><p>${terminal}</p>`;

function claimFixture(oldText: string, newText: string, textEn: string, textIt: string, category: 'last_updated_date' | 'effective_date') {
  const old = structureDocument(oldText), next = structureDocument(newText);
  const input: AnalysisInput = { old, next, deltas: compareDocuments(old, next).deltas };
  const set: ClaimSet = { schema: CLAIM_SCHEMA, claims: [{
    id: 'fixture', operation: 'modified', category, textEn, textIt, impact: 3,
    deltaIds: input.deltas.map(delta => delta.id), evidence: input.deltas.map(delta => ({
      side: delta.side, documentHash: delta.side === 'old' ? old.hash : next.hash,
      start: delta.block.start, end: delta.block.end, quote: delta.block.text,
    })),
  }] };
  return validateClaims(set, input);
}

describe('Engine evidence accuracy', () => {
  it('prefers the selected document language over the page shell without changing its text', () => {
    const html = `<html lang="en"><body><main lang="it">${body}</main></body></html>`;
    const capture = extractEngineBody(html, url, 'it-IT', contract);
    expect(capture.language).toBe('it');
    expect(capture.document.hash).toBe(extractEngineBody(html.replace('html lang="en"', 'html lang="it"'), url).document.hash);
    expect(assessCapture(capture, contract, url).eligible).toBe(true);
  });

  it('uses the exact fragment scope rather than languages in neighbouring documents', () => {
    const scopedUrl = url + '#notice';
    const scopedContract = { ...contract, sourceUrl: scopedUrl };
    const capture = extractEngineBody(`<html lang="en"><main><section lang="it" id="notice">${body}</section><section lang="fr"><p>Autre document.</p></section></main></html>`, scopedUrl, 'en-US', scopedContract);
    expect(capture.language).toBe('it');
    expect(capture.document.text).not.toContain('Autre document');
    expect(assessCapture(capture, scopedContract, scopedUrl).eligible).toBe(true);
  });

  it('holds conflicting language signals within the extracted scope', () => {
    const html = `<html lang="it"><main lang="it">${body}<section lang="en"><p>This part is restricted to another agreement.</p></section></main></html>`;
    const capture = extractEngineBody(html, url, 'it', contract);
    expect(capture.language).toBeUndefined();
    expect(assessCapture(capture, contract, url).reasons).toContain('document_language_conflicting');
    const fallbackConflict = extractEngineBody(`<html lang="it"><main>${body}</main></html>`, url, 'en');
    expect(assessCapture(fallbackConflict, contract, url).eligible).toBe(false);
  });

  it('treats a heading-level change that moves an unchanged clause as substantive', () => {
    const old = structureDocument('# Terms\n\n## Paid accounts\n\n### Deletion exceptions\n\nContact the account administrator to request deletion.');
    const next = structureDocument(old.text.replace('### Deletion exceptions', '## Deletion exceptions'));
    const comparison = compareDocuments(old, next);
    expect(comparison.kind).toBe('changed');
    expect(comparison.deltas.filter(delta => delta.block.kind === 'paragraph').map(delta => [delta.side, delta.block.section]))
      .toEqual([['old', ['Terms', 'Paid accounts', 'Deletion exceptions']], ['new', ['Terms', 'Deletion exceptions']]]);
    expect(compareDocuments(structureDocument('# Terms\n\n## Contact'), structureDocument('# Terms\n\n### Contact')).kind).toBe('formatting');
  });

  const dates = '# Sample Terms\n\nLast updated 1 January 2026. This policy is effective from 1 December 2025.';
  const updated = dates.replace('1 January 2026', '1 February 2026');

  it('rejects an incorrect effective-date claim even with complete and exact quotes', () => {
    expect(claimFixture(dates, updated, 'The effective date moved to 1 February 2026.',
      'La data di entrata in vigore è stata spostata al 1 febbraio 2026.', 'effective_date').reasons)
      .toEqual(['date_role_unsubstantiated']);
  });

  it('supports the changed update date with equivalent EN and IT forms', () => {
    expect(claimFixture(dates, updated, 'The last updated date changed from January 1, 2026 to 2026-02-01.',
      'L’ultimo aggiornamento è passato dal 1º gennaio 2026 al 1 febbraio 2026.', 'last_updated_date').reasons).toEqual([]);
  });

  it('supports an actual before-and-after effective date even with a second date role in the same quote', () => {
    expect(claimFixture(dates, dates.replace('1 December 2025', '20 December 2025'),
      'The effective date changed from December 1, 2025 to December 20, 2025.',
      'La data di entrata in vigore è passata dal 1 dicembre 2025 al 20 dicembre 2025.', 'effective_date').reasons).toEqual([]);
  });

  it('holds opposite date roles across the two claim languages', () => {
    const mixed = dates.replace('1 January 2026', '1 February 2026').replace('1 December 2025', '1 February 2026');
    expect(claimFixture(dates, mixed, 'The effective date is 1 February 2026.',
      'Ultimo aggiornamento al 1 febbraio 2026.', 'effective_date').reasons).toContain('date_role_unsubstantiated');
  });

  it('holds conflicting translations and reversed update dates', () => {
    expect(claimFixture(dates, updated, 'The last updated date is 1 February 2026.',
      'L’ultimo aggiornamento risale al 1 gennaio 2026.', 'last_updated_date').reasons).toContain('date_role_unsubstantiated');
    expect(claimFixture(dates, updated, 'The last updated date moved from 1 February 2026 to 1 January 2026.',
      'L’ultimo aggiornamento è passato dal 1 febbraio 2026 al 1 gennaio 2026.', 'last_updated_date').reasons).toContain('date_role_unsubstantiated');
  });
});
