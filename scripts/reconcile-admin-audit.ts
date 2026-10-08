import { db } from '../src/lib/db';
import { canResolveRetiredSource } from '../src/lib/retiredSource';

// No invented scores or review approvals. Dry run by default; every applied correction is logged.
async function main() {
  const apply = process.argv.includes('--apply');
  const receipt = await db.$transaction(async tx => {
    const policies = await tx.policy.findMany({ select: { id: true, url: true, retrievalUrl: true, lastSuccessfulCheckDate: true, dataStatus: true } });
    const issues = await tx.sourceRemediationIssue.findMany({ where: { status: { in: ['Open', 'Watching', 'Recovered'] } } });
    const retired = issues.filter(issue => canResolveRetiredSource(issue, policies));
    const company = await tx.company.findUnique({ where: { slug: 'coca-cola' } });
    const correctIndustry = company?.industry === 'FinTech';
    if (apply) {
      for (const issue of retired) {
        await tx.sourceRemediationIssue.update({ where: { id: issue.id }, data: { status: 'Resolved', resolvedAt: new Date(), suggestedAction: 'Retired acquisition URL: every affected policy has a different active URL and a successful check after the last failure. Original failure history retained.' } });
        await tx.adminReviewLog.create({ data: { actorRole: 'system', action: 'retired_source_reconciled', targetType: 'source_remediation_issue', targetId: issue.id, oldValue: issue.status, newValue: 'Resolved', note: 'Operational reconciliation of a superseded retrieval URL; not a human content or AI quality review.', metadataJson: JSON.stringify({ retrievalKey: issue.retrievalKey, affectedPolicyIds: JSON.parse(issue.affectedPolicyIdsJson) }) } });
      }
      if (correctIndustry && company) {
        await tx.company.update({ where: { id: company.id }, data: { industry: 'Consumer Goods' } });
        await tx.adminReviewLog.create({ data: { actorRole: 'system', action: 'company_industry_corrected', targetType: 'company', targetId: company.id, oldValue: 'FinTech', newValue: 'Consumer Goods', note: 'Administrative audit: Coca-Cola beverage company was incorrectly classified as a financial technology provider.' } });
      }
    }
    return { mode: apply ? 'applied' : 'dry_run', retiredSourceIssueIds: retired.map(issue => issue.id), industryCorrection: correctIndustry ? 'Coca Cola: FinTech -> Consumer Goods' : null };
  });
  console.log(JSON.stringify({ ...receipt, observedAt: new Date().toISOString() }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Reconciliation failed'); process.exitCode = 1; }).finally(() => db.$disconnect());
