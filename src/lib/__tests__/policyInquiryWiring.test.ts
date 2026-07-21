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
    expect(publicClient).toContain('Confronti verificati correlati');
    expect(publicClient).toContain('La notifica non identifica quale');
    expect(adminStyles).toContain('@media (max-width: 720px)');
    expect(adminStyles).toContain('grid-template-columns: minmax(0, 1fr)');
  });

  it('makes the browser boundary, excluded data and every result explanation explicit', () => {
    const client = readFileSync('src/app/what-changed/WhatChangedClient.tsx', 'utf8');
    const explainabilityStyles = readFileSync('src/app/what-changed/explainability.module.css', 'utf8');

    expect(client).toContain('Il testo della mail non lascia questo browser');
    expect(client).toContain('Your email text never leaves this browser');
    expect(client).toContain('Solo questi indizi attraversano il confine');
    expect(client).toContain('Only these clues cross the boundary');
    expect(client).toContain('Non vengono mai inviati o conservati');
    expect(client).toContain('Indirizzo email e destinatario');
    expect(client).toContain('Inviati solo quando disponibili');
    expect(client).toContain('l’API rifiuta i campi contenenti il testo grezzo della mail');
    expect(client).toContain('the API rejects fields containing raw email text');
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
});
