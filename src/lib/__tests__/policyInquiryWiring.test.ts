import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('policy inquiry security and admin wiring', () => {
  it('gates public evidence, limits bodies and never sends user input to AI or fetches submitted URLs', () => {
    const route = readFileSync('src/app/api/policy-inquiries/route.ts', 'utf8');
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    expect(route).toContain('publicPolicyWhere');
    expect(route).toContain('publicChangeWhere');
    expect(route).toContain("max: 5");
    expect(route).toContain('ALLOWED_BODY_KEYS');
    expect(route).toContain('!ALLOWED_BODY_KEYS.has(key)');
    expect(route).not.toContain('body.input');
    expect(client).toContain('parsePolicyInquiryLocally(input');
    expect(client).not.toContain('JSON.stringify({ input');
    expect(route).not.toContain('@google/genai');
    expect(route).not.toMatch(/fetch\s*\(/);
    expect(route).toContain('createOrReuseActiveInquiry');
    expect(route).toContain('activeDedupeKey: dedupeKey');
    const inquiryModel = schema.match(/model PolicyInquiry \{[\s\S]*?\n\}/)?.[0] || '';
    expect(inquiryModel).not.toContain('fingerprint');
    expect(inquiryModel).not.toContain('noticeSubject');
    expect(inquiryModel).not.toContain('redactedExcerpt');
  });

  it('requires admin access and writes review logs for every supported transition', () => {
    const route = readFileSync('src/app/api/admin/inquiries/route.ts', 'utf8');
    expect(route).toContain("session.role !== 'admin'");
    for (const action of ['link_company', 'approve_new_company', 'reject', 'duplicate', 'resolve_change']) {
      expect(route).toContain(action);
    }
    expect(route).toContain('adminReviewLog.create');
    expect(route).toContain('createCompanyAndStartDiscovery');
    expect(route).toContain('publicChangeWhere');
  });

  it('integrates public and protected navigation surfaces', () => {
    expect(readFileSync('src/components/Navigation.tsx', 'utf8')).toContain("href: '/what-changed'");
    expect(readFileSync('src/app/admin/layout.tsx', 'utf8')).toContain("href: '/admin/inquiries'");
    expect(readFileSync('src/app/sitemap.ts', 'utf8')).toContain('/what-changed');
  });

  it('keeps correlated evidence wording and the admin queue responsive', () => {
    const publicRoute = readFileSync('src/app/api/policy-inquiries/route.ts', 'utf8');
    const publicClient = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const adminStyles = readFileSync('src/app/admin/inquiries/inquiries.module.css', 'utf8');
    expect(publicRoute).toContain("relationship: match.reason === 'exact_policy_url'");
    expect(publicClient).toContain('Perimetro della verifica');
    expect(publicClient).toContain('Le categorie iniziali ordinano i risultati senza escludere le altre policy');
    expect(adminStyles).toContain('@media (max-width: 720px)');
    expect(adminStyles).toContain('grid-template-columns: minmax(0, 1fr)');
  });

  it('implements a progressive mobile intake, portfolio-wide evidence and controlled storage failure', () => {
    const route = readFileSync('src/app/api/policy-inquiries/route.ts', 'utf8');
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const styles = readFileSync('src/app/what-changed/whatChanged.module.css', 'utf8');

    expect(client).toContain('Il copia-incolla non conserva i link nascosti');
    expect(client).toContain('Copy and paste cannot preserve links hidden');
    expect(client).toContain('Usa l’estensione browser');
    expect(client).toContain('Use the browser extension');
    expect(client).toContain('Nome dell’organizzazione');
    expect(client).toContain('Organization name');
    expect(client).not.toContain('es. MioDottore');
    expect(client).not.toContain('e.g. DocPlanner');
    expect(client).toContain('ref={messageInputRef}');
    expect(client).toContain('onClick={focusPasteInput}');
    expect(client).toContain("window.history.replaceState(null, '', '#paste-notice')");
    expect(client).toContain("textarea.focus({ preventScroll: true })");
    expect(client).toContain("textarea.scrollIntoView({");
    expect(client).toContain('Correggi o aggiungi dettagli');
    expect(client).toContain('Correct or add details');
    expect(client).toContain('Verifica cosa è cambiato');
    expect(client).toContain('Check what changed');
    expect(client).toContain('role="status" aria-live="polite"');
    expect(client).toContain('<details className={styles.disclosure}>');
    expect(client).not.toContain('<section className={styles.explainer}');
    expect(client).toContain('aria-pressed={selectedTypes.includes(type)}');
    expect(client).toContain('parsePolicyInquiryLocally(input, companyOverride || companyName, websiteUrl, {');
    expect(route).toContain("state: 'conflict'");
    expect(route).toContain('startingEvidence: prioritized.startingEvidence');
    expect(route).toContain('otherEvidence: prioritized.otherEvidence');
    expect(route).toContain('collectLatestPortfolioEvidence');
    expect(route).toContain('db.policyChange.findFirst');
    expect(route).toContain('publicChangeWhere({ policyId: policy.id })');
    expect(route).toContain("orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]");
    expect(route).not.toContain('db.policyChange.findMany');
    expect(route).not.toContain('take: 12');
    expect(route).not.toContain('type: { in: parsed.policyTypes }');
    expect(route).toContain("code: 'POLICY_INQUIRY_STORAGE_UNAVAILABLE'");
    expect(route).toContain("status: 503");
    expect(styles).toContain('.localSummary');
    expect(styles).toContain('.mobileExtensionNote');
    expect(styles).toContain('.extensionPath{display:none}');
    expect(styles).toContain('.afterPaste>.submit');
    expect(styles).toContain('min-height:54px');
    expect(styles).toContain('.header nav a:focus-visible,.header nav button:focus-visible');
    expect(styles).toContain('@media(max-width:700px)');
    expect(styles).not.toContain('overflow-x:hidden');
  });

  it('keeps explainability accessible without putting it in the primary task flow', () => {
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const explainabilityStyles = readFileSync('src/app/what-changed/explainability.module.css', 'utf8');

    expect(client).toContain('Privacy e come funziona');
    expect(client).toContain('Privacy and how it works');
    expect(client).toContain('Il testo grezzo, l’oggetto, il destinatario e qualsiasi fingerprint restano nel browser');
    expect(client).toContain('Raw text, subject, recipient and any fingerprint stay in the browser');
    expect(client).toContain('Controlleremo tutte le policy pubbliche monitorate');
    expect(client).toContain('We check every monitored public policy');
    expect(client).toContain('Una nuova azienda o fonte viene pubblicata soltanto dopo approvazione e QA umano');
    expect(client).toContain('A new company or source is published only after human approval and QA');
    for (const state of ['matched', 'monitored_no_verified_change', 'queued', 'ambiguous']) {
      expect(client).toContain(`data-result-explanation="${state}"`);
    }
    expect(client).toContain('Pubblica solo dopo il QA');
    expect(client).toContain('Publish only after QA');
    expect(client).toContain('href="/privacy"');
    expect(client).toContain('href="/methodology/confidence"');
    expect(client).not.toContain('className={styles.rail}');
    expect(client).toContain('explainability.narrowActions');
    expect(explainabilityStyles).toContain('.privacyBoundary');
    expect(explainabilityStyles).toContain('@media (max-width: 700px)');
    expect(explainabilityStyles).toContain('font-size: 0.8rem');
    expect(explainabilityStyles).toContain('flex-direction: column');
    expect(explainabilityStyles).not.toContain('overflow-x');
  });

  it('never presents failed storage as an accepted request and names the successful admin destination', () => {
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const styles = readFileSync('src/app/what-changed/whatChanged.module.css', 'utf8');
    expect(client).toContain("storageTitle: 'Richiesta non registrata'");
    expect(client).toContain("storageTitle: 'Request not registered'");
    expect(client).toContain("queued: 'Richiesta registrata'");
    expect(client).toContain("queued: 'Request registered'");
    expect(client).toContain('Admin → Policy inquiries');
    expect(client).toContain("whatNext: 'Cosa succede ora?'");
    expect(client).toContain("whatNext: 'What happens next?'");
    expect(client).toContain('className={`${styles.receipt} ${styles.queuedReceipt}`}');
    expect(client).toContain('className={`${styles.disclosure} ${styles.receiptDisclosure}`}');
    expect(client).toContain('L’amministratore riceve solo gli indizi operativi');
    expect(client).toContain('The administrator receives only operational clues');
    expect(styles).toContain('.queuedReceipt{border-left-color:#0f766e}');
    expect(client).toContain('aria-live="assertive" data-result-explanation="storage_unavailable"');
    expect(client).toContain('onClick={() => void submit()}');
    expect(client).not.toContain('<p>{t.queued}</p><h2>{t.storageTitle}</h2>');
  });

  it('labels the extension capture path as Beta in both languages', () => {
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    expect(client).toContain('Consigliato su computer · Beta');
    expect(client).toContain('Recommended on a computer · Beta');
    expect(client).toContain('In questa Beta, estrazione o evidenze possono essere incomplete.');
    expect(client).toContain('In this Beta, extraction or evidence may be incomplete.');
  });
});
