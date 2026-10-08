import { db } from '../src/lib/db';
import { scrapePolicyText } from '../src/lib/scraper';
import { guardExtraction } from '../src/lib/extractionGuard';
import { archiveFreshnessFloor } from '../src/lib/policyConfidence';

// Deployment-only baseline preparation. This never invokes AI or publishes a provider change.
async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && (process.env.POLICYWATCHER_EXTRACTION_GUARD !== '1' || process.env.POLICYWATCHER_SCANS_PAUSED !== '1')) {
    throw new Error('Enable the guard and pause/drain scans before preparing extraction baselines.');
  }
  const policies = await db.policy.findMany({ orderBy: { id: 'asc' }, include: { company: { select: { slug: true } } } });
  const rows: { policyId: string; company: string; reason: string; source?: string }[] = [];
  let next = 0;
  async function worker() {
    while (next < policies.length) {
      const policy = policies[next++];
      try {
        const result = await scrapePolicyText(policy.retrievalUrl || policy.url, { archiveNotBefore: archiveFreshnessFloor(policy) });
        // Initial readiness only anchors exact matches. Review holds never replace an existing baseline.
        if (result.status === 'ok' && !result.partial && ['direct', 'http2', 'rendered'].includes(result.source) && result.hash === policy.currentHash && apply) {
          const decision = await guardExtraction(policy, result);
          rows.push({ policyId: policy.id, company: policy.company.slug, reason: decision.reason, source: result.source });
        } else {
          rows.push({ policyId: policy.id, company: policy.company.slug, source: result.source,
            reason: result.status !== 'ok' || result.partial ? 'retrieval_incomplete' : !['direct', 'http2', 'rendered'].includes(result.source) ? 'archive_only_not_live_confirmation' : result.hash === policy.currentHash ? 'exact_match_dry_run' : 'baseline_review_required' });
        }
      } catch { rows.push({ policyId: policy.id, company: policy.company.slug, reason: 'retrieval_failed' }); }
    }
  }
  await Promise.all([worker(), worker()]);
  console.log(JSON.stringify({ mode: apply ? 'exact_match_inputs_anchored' : 'dry_run', checkedAt: new Date().toISOString(),
    selected: policies.length, counts: rows.reduce<Record<string, number>>((r, row) => { r[row.reason] = (r[row.reason] || 0) + 1; return r; }, {}), rows }, null, 2));
}
main().catch(e => { console.error(e instanceof Error ? e.message : 'Extraction readiness failed'); process.exitCode = 1; })
  .finally(() => db.$disconnect());
