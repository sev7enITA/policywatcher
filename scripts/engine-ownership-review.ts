import { readFile } from 'node:fs/promises';
import { qualificationDigest } from '../src/lib/engine/qualification';
import { reviewOwnership } from '../src/lib/engine/ownershipReview';

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 5)
    throw new Error('usage: previous.json inventory.json evidence.json review.json campaign-pin');
  const bytes = await Promise.all(args.slice(0, 4).map((path) => readFile(path)));
  const hashes = bytes.map(qualificationDigest);
  if (qualificationDigest(JSON.stringify(hashes.slice(0, 2))) !== args[4])
    throw new Error('ownership_campaign_pin_mismatch');
  const [prior, inventory, documents, panel] = bytes.map((b) => JSON.parse(b.toString('utf8')));
  const report = reviewOwnership(
    prior,
    inventory,
    documents.contracts,
    panel.reviews,
    panel.decisions,
    documents.sources,
  );
  console.log(
    JSON.stringify({
      ...report,
      previousReportSha256: hashes[0],
      inventorySha256: hashes[1],
      documentsSha256: hashes[2],
      reviewSha256: hashes[3],
    }),
  );
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'invalid_ownership_review');
  process.exitCode = 1;
});
