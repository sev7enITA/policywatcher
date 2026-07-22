import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('policy inquiry operator notification', () => {
  it('alerts only after a new minimized inquiry was persisted', () => {
    const route = readFileSync('src/app/api/policy-inquiries/route.ts', 'utf8');
    expect(route).toContain("import { after, NextRequest, NextResponse } from 'next/server'");
    expect(route).toContain('if (created)');
    expect(route).toContain('sendPolicyInquiryAdminAlert({');
    expect(route.indexOf('sendPolicyInquiryAdminAlert({')).toBeGreaterThan(
      route.indexOf('createOrReuseActiveInquiry'),
    );
  });

  it('defines an admin alert contract without raw notification fields', () => {
    const mailer = readFileSync('src/lib/mailer.ts', 'utf8');
    const contract = mailer.match(/export interface PolicyInquiryAdminAlert \{[\s\S]*?\n\}/)?.[0] || '';
    expect(contract).toContain('reference: string');
    expect(contract).toContain('companyHint?: string | null');
    expect(contract).toContain('policyTypes: string[]');
    for (const forbidden of ['raw', 'message', 'subject', 'sender', 'recipient', 'fingerprint', 'email']) {
      expect(contract.toLowerCase()).not.toContain(forbidden);
    }
    expect(mailer).toContain('/admin/inquiries');
    expect(mailer).toContain('sendPolicyInquiryAdminAlert');
    expect(mailer).toContain(String.raw`.replace(/[\r\n]+/g, ' ')`);
  });

  it('shows the open queue count in desktop and mobile admin navigation', () => {
    const metrics = readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');
    const layout = readFileSync('src/app/admin/layout.tsx', 'utf8');
    expect(metrics).toContain('openPolicyInquiries: openPolicyInquiryCount');
    expect(metrics).toContain("notIn: ['Rejected', 'Duplicate', 'Resolved']");
    expect(layout).toContain("item.href === '/admin/inquiries'");
    expect(layout).toContain('openPolicyInquiries={openPolicyInquiries}');
    expect(layout).toContain('open inquiries');
  });
});
