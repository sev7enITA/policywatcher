import { describe, expect, it } from 'vitest';
import {
  buildInquiryDedupeKey,
  matchInquiryCompany,
  normalizePolicyInquiryClues,
  normalizePolicyUrl,
} from '../policyInquiry';
import { parsePolicyInquiryLocally } from '../policyInquiryClient';

const WAZE_EMAIL = `---------- Forwarded message ---------
From: Waze <noreply@waze.com>
Date: Fri, Jul 10, 2026 at 2:59AM
Subject: Aggiornamenti ai nostri Termini e alle nostre Norme sulla privacy
To: <alessandro.simonetta@gmail.com>

Il 1° agosto 2026 aggiorneremo i nostri Termini di servizio e le nostre Norme sulla privacy.
Leggi i Termini aggiornati https://www.waze.com/legal/terms?utm_source=email&mc_eid=secret`;

const BLABLACAR_NOTICE = `BlaBlaCar
Ci miglioriamo per ottimizzare la tua esperienza di viaggio.
Abbiamo aggiornato i nostri Termini e condizioni e la nostra Informativa sulla privacy.
Le prenotazioni transfrontaliere diventano più semplici e le informazioni sui dati più trasparenti.`;

const companies = [
  { id: 'waze', name: 'WAZE', slug: 'waze', website: 'https://www.waze.com', policies: [{ id: 'terms', type: 'terms', url: 'https://www.waze.com/legal/terms' }] },
  { id: 'google', name: 'Google', slug: 'google', website: 'https://google.com', policies: [] },
  { id: 'blabla', name: 'BlaBlaCar', slug: 'blablacar', website: 'https://www.blablacar.com', policies: [] },
];

describe('policy inquiry local-only parsing and minimization', () => {
  it('extracts Waze clues in the browser without returning recipient data or raw content', () => {
    const local = parsePolicyInquiryLocally(WAZE_EMAIL);
    expect(local.senderDomain).toBe('waze.com');
    expect(local.sourceUrl).toBe('https://www.waze.com/legal/terms');
    expect(local.noticeDate).toContain('2026-07-10');
    expect(local.effectiveDate).toContain('2026-08-01');
    expect(local.policyTypes).toEqual(expect.arrayContaining(['terms', 'privacy']));
    expect(local.policyTypes).not.toContain('ai');
    expect(JSON.stringify(local)).not.toContain('alessandro.simonetta@gmail.com');
    expect(JSON.stringify(local)).not.toContain('Aggiornamenti ai nostri Termini');

    const parsed = normalizePolicyInquiryClues(local);
    expect(matchInquiryCompany(parsed, companies)).toMatchObject({ state: 'matched', company: { id: 'waze' } });
  });

  it('recognizes the brand in the supplied Italian BlaBlaCar body without retaining the body', () => {
    const local = parsePolicyInquiryLocally(BLABLACAR_NOTICE);
    expect(local.companyHint).toBe('BlaBlaCar');
    expect(local.policyTypes).toEqual(expect.arrayContaining(['terms', 'privacy']));
    expect(Object.keys(local)).not.toContain('input');
    expect(Object.keys(local)).not.toContain('redactedExcerpt');
    expect(matchInquiryCompany(normalizePolicyInquiryClues(local), companies))
      .toMatchObject({ state: 'matched', company: { id: 'blabla' } });
  });

  it('recognizes explicit AI policy language without treating Italian "ai" as AI', () => {
    const local = parsePolicyInquiryLocally('OpenAI\nWe updated our AI training policy and artificial intelligence terms.');
    expect(local.policyTypes).toContain('ai');
  });

  it('strips every query parameter and fragment before a URL leaves the browser', () => {
    expect(normalizePolicyUrl('https://EXAMPLE.com/privacy/?utm_campaign=x&token=personal#top'))
      .toBe('https://example.com/privacy');
  });

  it('detects ambiguity and produces stable dedupe keys from structured clues only', () => {
    const parsed = normalizePolicyInquiryClues({
      companyHint: 'Acme', senderDomain: null, sourceUrl: null,
      noticeDate: null, effectiveDate: null, policyTypes: ['terms'],
    });
    const ambiguous = matchInquiryCompany(parsed, [
      { id: '1', name: 'Acme Ltd', slug: 'acme', website: 'https://one.test' },
      { id: '2', name: 'Acme Inc', slug: 'acme-eu', website: 'https://two.test' },
    ]);
    expect(ambiguous.state).toBe('ambiguous');
    expect(buildInquiryDedupeKey(parsed)).toBe(buildInquiryDedupeKey(parsed));
  });

  it('rejects empty structured clues and invalid URLs', () => {
    expect(() => normalizePolicyInquiryClues({
      companyHint: null, senderDomain: null, sourceUrl: null,
      noticeDate: null, effectiveDate: null, policyTypes: [],
    })).toThrow('EMPTY_CLUES');
    expect(() => normalizePolicyInquiryClues({
      companyHint: null, senderDomain: null, sourceUrl: 'javascript:alert(1)',
      noticeDate: null, effectiveDate: null, policyTypes: [],
    })).toThrow('INVALID_URL');
  });
});
