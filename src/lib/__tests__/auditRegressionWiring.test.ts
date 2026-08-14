import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('audit regression wiring', () => {
  it('refreshes the batch inside the QA revalidation failure transaction', () => {
    const route = readFileSync('src/app/api/admin/source-onboarding/[itemId]/route.ts', 'utf8');
    const failureBranch = route.slice(
      route.indexOf("if (!qa || qa.result.status !== 'Pass' || !item.policyId)"),
      route.indexOf("return NextResponse.json({ error: 'Evidence no longer passes QA")
    );
    expect(failureBranch).toContain('await refreshBatch(item.batchId, tx);');
    expect(failureBranch).toContain('source_onboarding_publication_revalidation_failed');
  });

  it('does not keep discovery jobs in global memory', () => {
    const route = readFileSync('src/app/api/admin/policy-discovery/route.ts', 'utf8');
    const workflow = readFileSync('src/lib/policyDiscoveryWorkflow.ts', 'utf8');
    expect(route).not.toContain('globalThis');
    expect(route).not.toContain('new Map');
    expect(route).toContain('startPolicyDiscovery(company)');
    expect(workflow).toContain('claimDiscoveryJob(db, company.id)');
  });
});
