import { readFile } from 'node:fs/promises';
import { assessArchivedKpis } from '../src/lib/engine/archivedKpiReview';
import { qualificationDigest } from '../src/lib/engine/qualification';

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 5) {
    throw new Error('usage: cohort.json archive.json proposals.json adjudications.json frozen-cohort-sha256');
  }
  const [cohort, archive, proposals, adjudications] = await Promise.all(
    args.slice(0, 4).map(path => readFile(path)),
  );
  const cohortSha256 = qualificationDigest(cohort);
  if (args[4] !== cohortSha256) throw new Error('frozen_cohort_changed');

  const parse = (bytes: Buffer): unknown => JSON.parse(bytes.toString('utf8'));
  const report = assessArchivedKpis(parse(cohort), parse(archive), parse(proposals), parse(adjudications));
  console.log(JSON.stringify({
    ...report,
    cohortSha256,
    archiveSha256: qualificationDigest(archive),
    proposalsSha256: qualificationDigest(proposals),
    adjudicationsSha256: qualificationDigest(adjudications),
  }));
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'invalid_retroevaluation');
  process.exitCode = 1;
});
