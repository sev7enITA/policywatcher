import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('seamless company onboarding wiring', () => {
  const companiesRoute = readFileSync('src/app/api/admin/companies/route.ts', 'utf8');
  const companyManager = readFileSync('src/app/admin/companies/page.tsx', 'utf8');
  const discoveryWorkspace = readFileSync('src/components/admin/PolicyDiscoveryWorkspace.tsx', 'utf8');

  it('claims and schedules discovery in the company creation request', () => {
    expect(companiesRoute).toContain('new URL(website)');
    expect(companiesRoute).toContain("['http:', 'https:'].includes(companyWebsite.protocol)");
    expect(companiesRoute).toContain('startPolicyDiscovery(company)');
    expect(companiesRoute).toContain('runPolicyDiscoveryJob(company, discovery.runToken)');
    expect(companiesRoute).toContain('after(async () =>');
    expect(companyManager).not.toContain("fetch('/api/admin/policy-discovery'");
  });

  it('keeps first-baseline failures retryable in the same workspace', () => {
    expect(companyManager).toContain('onRunFirstScan={() => handleRunFirstScan(company)}');
    expect(companyManager).toContain('hasEstablishedCompanyBaseline(company.policies)');
    expect(companyManager).toContain('if (!baselineReady)');
    expect(discoveryWorkspace).toContain('await onRunFirstScan?.()');
    expect(discoveryWorkspace).toContain('setFirstScanLaunched(true)');
    expect(discoveryWorkspace.indexOf('await onRunFirstScan?.()'))
      .toBeLessThan(discoveryWorkspace.indexOf('setFirstScanLaunched(true)'));
  });
});
