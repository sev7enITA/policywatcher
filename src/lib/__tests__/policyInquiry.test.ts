import { describe, expect, it } from 'vitest';
import {
  buildInquiryDedupeKey,
  matchInquiryCompany,
  normalizePolicyUrl,
  parsePolicyInquiry,
  redactInquiryExcerpt,
} from '../policyInquiry';

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

describe('policy inquiry parsing and minimization', () => {
  it('parses the supplied Waze forwarded email without matching its Gmail recipient', () => {
    const parsed = parsePolicyInquiry(WAZE_EMAIL);
    expect(parsed.companyHint).toBe('Waze');
    expect(parsed.normalizedDomain).toBe('waze.com');
    expect(parsed.noticeSubject).toContain('Termini');
    expect(parsed.noticeDate?.getUTCFullYear()).toBe(2026);
    expect(parsed.effectiveDate?.getUTCMonth()).toBe(7);
    expect(parsed.policyTypes).toEqual(expect.arrayContaining(['terms', 'privacy']));
    expect(parsed.policyTypes).not.toContain('ai');
    expect(parsed.redactedExcerpt).not.toContain('alessandro.simonetta@gmail.com');
    expect(parsed.redactedExcerpt).not.toContain('mc_eid');
    expect(matchInquiryCompany(parsed, companies)).toMatchObject({ state: 'matched', company: { id: 'waze' } });
  });

  it('recognizes explicit AI policy language without treating Italian "ai" as AI', () => {
    const parsed = parsePolicyInquiry('OpenAI\nWe updated our AI training policy and artificial intelligence terms.');
    expect(parsed.policyTypes).toContain('ai');
  });

  it('recognizes the brand in the supplied Italian BlaBlaCar body without a From header', () => {
    const parsed = parsePolicyInquiry(BLABLACAR_NOTICE);
    expect(parsed.companyHint).toBe('BlaBlaCar');
    expect(parsed.policyTypes).toEqual(expect.arrayContaining(['terms', 'privacy']));
    expect(matchInquiryCompany(parsed, companies)).toMatchObject({ state: 'matched', company: { id: 'blabla' } });
  });

  it('strips email addresses and common tracking parameters from the stored excerpt', () => {
    const result = redactInquiryExcerpt('From: Jane <jane@example.com>\nTo: me@gmail.com\nhttps://example.com/privacy?utm_source=x&gclid=abc&lang=it');
    expect(result).not.toContain('jane@example.com');
    expect(result).not.toContain('me@gmail.com');
    expect(result).not.toContain('utm_source');
    expect(result).not.toContain('gclid');
    expect(result).toContain('lang=it');
  });

  it('normalizes policy URLs, detects ambiguity and produces stable dedupe keys', () => {
    expect(normalizePolicyUrl('https://EXAMPLE.com/privacy/?utm_campaign=x#top')).toBe('https://example.com/privacy');
    const parsed = parsePolicyInquiry('Acme', 'Acme');
    const ambiguous = matchInquiryCompany(parsed, [
      { id: '1', name: 'Acme Ltd', slug: 'acme', website: 'https://one.test' },
      { id: '2', name: 'Acme Inc', slug: 'acme-eu', website: 'https://two.test' },
    ]);
    expect(ambiguous.state).toBe('ambiguous');
    expect(buildInquiryDedupeKey(parsed)).toBe(buildInquiryDedupeKey(parsed));
  });

  it('rejects empty and oversized input', () => {
    expect(() => parsePolicyInquiry('')).toThrow('EMPTY_INPUT');
    expect(() => parsePolicyInquiry('x'.repeat(21 * 1024))).toThrow('INPUT_TOO_LARGE');
  });
});
