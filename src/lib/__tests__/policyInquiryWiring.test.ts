import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('policy inquiry security and admin wiring', () => {
  it('gates public evidence, limits bodies and never sends user input to AI or fetches submitted URLs', () => {
    const route = readFileSync('src/app/api/policy-inquiries/route.ts', 'utf8');
    expect(route).toContain('publicPolicyWhere');
    expect(route).toContain('publicChangeWhere');
    expect(route).toContain('POLICY_INQUIRY_MAX_INPUT_BYTES');
    expect(route).toContain("max: 5");
    expect(route).not.toContain('@google/genai');
    expect(route).not.toMatch(/fetch\s*\(/);
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
});
