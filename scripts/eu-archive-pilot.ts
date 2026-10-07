import { discoverEuPilot } from '../src/lib/euArchive';
import { db } from '../src/lib/db';

async function main() {
  const result = await discoverEuPilot();
  if (process.argv.includes('--apply')) {
    // Commit the bounded pilot atomically only after the entire upstream read succeeds.
    await db.$transaction(result.references.map(row => db.externalDocumentReference.upsert({
      where: { referenceKey: row.referenceKey }, create: row, update: {},
    })));
  }
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'metadata_imported' : 'dry_run', ...result }, null, 2));
}
main().catch(() => { console.error('EU metadata pilot failed; no partial import was committed.'); process.exitCode = 1; })
  .finally(() => db.$disconnect());
