import { describe, expect, it } from 'vitest';
import {
  buildInquiryDedupeKey,
  collectLatestPortfolioEvidence,
  isPolicyInquiryStorageUnavailable,
  matchInquiryCompany,
  normalizePolicyInquiryClues,
  normalizePolicyUrl,
  prioritizePortfolioEvidence,
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

const BLABLACAR_PLAIN_TEXT_COPY = `Ci miglioriamo per ottimizzare la tua esperienza di viaggio.
Ciao!

Fabrizio, BlaBlaCar si evolve per offrirti un'esperienza di viaggio sempre più globale. Per garantire chiarezza e trasparenza durante questo processo, abbiamo aggiornato i nostri Termini e condizioni e la nostra Informativa sulla privacy.

Cosa cambia per te:
- Le prenotazioni transfrontaliere diventano più semplici.
- Le informazioni su come gestiamo i tuoi dati saranno più trasparenti.

Buon viaggio,
Il team di BlaBlaCar`;

const MIODOTTORE_PLAIN_TEXT_COPY = `Gentile utente,

Siamo sempre al lavoro per migliorare MioDottore — anche quando si tratta di gestione dei dati. Per questo abbiamo aggiornato la nostra Informativa e pubblicato una nuova cookie policy. Ecco le principali novità:

1. Abbiamo reso alcune sezioni dell'Informativa più comprensibili, per chiarire quali dati raccogliamo, perché, per quanto tempo e quali sono i tuoi diritti.

2. Più trasparenza su quali informazioni puoi conservare e gestire col tuo account e come puoi eliminarle.

3. Funzionalità supportate dall'IA e sicurezza: abbiamo aggiunto maggiori dettagli su come potrai usare le funzionalità IA per organizzare e riepilogare i documenti relativi alla salute e migliorare la tua esperienza sulla piattaforma. Le funzionalità supportate dall'IA sono facoltative.

4. Informativa sui cookie: una guida chiara su quali cookie utilizziamo, come migliorano la tua esperienza e come puoi gestire le tue preferenze.

Puoi leggere l'Informativa sulla privacy aggiornata qui e l'Informativa sui cookie aggiornata qui.

Domande? Puoi scriverci a contatto@miodottore.it.

Il Team MioDottore`;

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

  it('recognizes BlaBlaCar in a realistic plain-text copy without a leading brand or links', () => {
    const local = parsePolicyInquiryLocally(BLABLACAR_PLAIN_TEXT_COPY);
    expect(local.companyHint).toBe('BlaBlaCar');
    expect(local.policyTypes).toEqual(expect.arrayContaining(['terms', 'privacy']));
    expect(local.sourceUrl).toBeNull();
    expect(Object.keys(local)).not.toContain('input');
  });

  it('recognizes MioDottore from a signature instead of treating the greeting as a company', () => {
    const local = parsePolicyInquiryLocally(MIODOTTORE_PLAIN_TEXT_COPY);
    expect(local.companyHint).toBe('MioDottore');
    expect(local.policyTypes).toEqual(expect.arrayContaining(['privacy', 'cookies', 'ai']));
    expect(local.sourceUrl).toBeNull();
    expect(local.senderDomain).toBeNull();
    expect(Object.keys(local)).not.toContain('input');
  });

  it('fails closed on generic greetings when no organization can be inferred', () => {
    for (const greeting of ['Gentile utente,', 'Spettabile cliente,', 'Buongiorno', 'Dear customer,']) {
      expect(parsePolicyInquiryLocally(`${greeting}\nAbbiamo aggiornato la privacy policy.`).companyHint).toBeNull();
    }
  });

  it('recognizes arbitrary organization signatures without a brand allowlist', () => {
    const fixtures = [
      ['We updated our Privacy Policy.\nTeam Acme', 'Acme'],
      ['Abbiamo aggiornato i nostri Termini.\nIl team di Northwind', 'Northwind'],
      ['We updated our Terms of Service.\nThe Contoso Team', 'Contoso'],
    ] as const;
    for (const [notice, organization] of fixtures) {
      expect(parsePolicyInquiryLocally(notice).companyHint).toBe(organization);
    }
  });

  it('does not invent a source URL when plain text only contains here or qui', () => {
    for (const notice of [
      'Team Acme\nLeggi la Privacy aggiornata qui.',
      'The Contoso Team\nRead the updated Terms here.',
    ]) {
      expect(parsePolicyInquiryLocally(notice).sourceUrl).toBeNull();
    }
  });

  it('does not mistake a section heading for the company name', () => {
    const local = parsePolicyInquiryLocally('Cosa cambia per te:\nAbbiamo aggiornato i Termini e la Privacy.');
    expect(local.companyHint).toBeNull();
  });

  it('supports a plain-text notice without links and explicit company/category confirmation', () => {
    const local = parsePolicyInquiryLocally(
      'MioDottore\nAbbiamo aggiornato la nostra informativa e le regole sui cookie.',
      'MioDottore',
      '',
      { policyTypes: ['privacy', 'cookies', 'ai'] },
    );
    expect(local).toMatchObject({
      companyHint: 'MioDottore',
      sourceUrl: null,
      senderDomain: null,
      policyTypes: ['privacy', 'cookies', 'ai'],
    });
    expect(Object.keys(local)).not.toContain('input');
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

  it('returns a dedicated conflict when company and official URL identify different known companies', () => {
    const parsed = normalizePolicyInquiryClues({
      companyHint: 'WAZE', senderDomain: null, sourceUrl: 'https://google.com/privacy',
      noticeDate: null, effectiveDate: null, policyTypes: ['privacy'],
    });
    expect(matchInquiryCompany(parsed, [
      companies[0],
      { ...companies[1], policies: [{ id: 'google-privacy', type: 'privacy', url: 'https://google.com/privacy' }] },
    ])).toMatchObject({
      state: 'conflict',
      companyCandidate: { id: 'waze' },
      sourceCandidate: { id: 'google' },
    });
  });

  it('does not let a known URL silently override an explicit unmatched company confirmation', () => {
    const parsed = normalizePolicyInquiryClues({
      companyHint: 'MioDottore', senderDomain: null, sourceUrl: 'https://google.com/privacy',
      noticeDate: null, effectiveDate: null, policyTypes: ['privacy'],
    });
    expect(matchInquiryCompany(parsed, [
      { ...companies[1], policies: [{ id: 'google-privacy', type: 'privacy', url: 'https://google.com/privacy' }] },
    ])).toMatchObject({
      state: 'conflict',
      companyHint: 'MioDottore',
      companyCandidate: null,
      sourceCandidate: { id: 'google' },
    });
  });

  it('prioritizes starting categories without filtering other company evidence', () => {
    const changes = [
      { id: 'terms', policy: { type: 'terms' } },
      { id: 'privacy', policy: { type: 'privacy' } },
      { id: 'ai', policy: { type: 'ai' } },
    ];
    expect(prioritizePortfolioEvidence(changes, ['privacy', 'ai'])).toEqual({
      startingEvidence: [changes[1], changes[2]],
      otherEvidence: [changes[0]],
    });
  });

  it('collects at most one latest evidence item from every portfolio policy before ranking', async () => {
    const histories = new Map([
      ['privacy', [
        { id: 'privacy-old', createdAt: '2026-01-01', policy: { type: 'privacy' } },
        { id: 'privacy-new', createdAt: '2026-07-01', policy: { type: 'privacy' } },
      ]],
      ['terms', [
        { id: 'terms-new', createdAt: '2026-06-01', policy: { type: 'terms' } },
      ]],
      ['ai', [
        { id: 'ai-new', createdAt: '2026-05-01', policy: { type: 'ai' } },
      ]],
    ]);
    const calls: string[] = [];
    const latest = await collectLatestPortfolioEvidence(
      [...histories.keys()],
      async (policyId) => {
        calls.push(policyId);
        return [...(histories.get(policyId) || [])]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
      },
    );

    expect(calls).toEqual(['privacy', 'terms', 'ai']);
    expect(latest.map((change) => change.id)).toEqual(['privacy-new', 'terms-new', 'ai-new']);
    expect(new Set(latest.map((change) => change.policy.type)).size).toBe(3);
    expect(prioritizePortfolioEvidence(latest, ['ai'])).toEqual({
      startingEvidence: [latest[2]],
      otherEvidence: [latest[0], latest[1]],
    });
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

  it('recognizes missing/unavailable inquiry schema dependencies as controlled unavailability', () => {
    expect(isPolicyInquiryStorageUnavailable({
      code: 'P2021', message: 'The table main.PolicyInquiry does not exist',
    })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable(new Error('no such table: PolicyInquiry'))).toBe(true);
    expect(isPolicyInquiryStorageUnavailable({ code: 'P2021', message: 'The table main.Company does not exist' })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable({ code: 'P2022', message: 'The column activeDedupeKey does not exist' })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable({ code: 'P1003', message: 'Database does not exist' })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable({ code: 'P1008', message: 'Operations timed out' })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable({ code: 'P2034', message: 'Write conflict' })).toBe(true);
    expect(isPolicyInquiryStorageUnavailable(new Error('upstream request failed'))).toBe(false);
  });
});
