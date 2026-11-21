import { readFile } from 'node:fs/promises';
import { retrieveArchivedKpiEvidence } from '../src/lib/engine/archivedKpiRetrieval';
import { qualificationDigest } from '../src/lib/engine/qualification';

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) throw new Error('usage: cohort.json archive.json frozen-cohort-sha256');
  const [cohort, archive] = await Promise.all(args.slice(0, 2).map(path => readFile(path)));
  const cohortSha256 = qualificationDigest(cohort);
  if (args[2] !== cohortSha256) throw new Error('frozen_cohort_changed');
  const report = retrieveArchivedKpiEvidence(JSON.parse(cohort.toString('utf8')), JSON.parse(archive.toString('utf8')));
  console.log(JSON.stringify({ ...report, cohortSha256, archiveSha256: qualificationDigest(archive) }));
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'invalid_retrieval');
  process.exitCode = 1;
});
