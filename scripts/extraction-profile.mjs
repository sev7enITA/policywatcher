import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

// Include extraction code and resolved dependencies, not deployment timestamps.
const inputs = ['src/lib/scraper.ts', 'src/lib/pdfPolicy.ts', 'src/lib/sourceReliability.ts', 'src/lib/extractionProfile.ts', 'package-lock.json'];
const files = Object.fromEntries(inputs.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]));
const profile = { version: 1, files, hash: createHash('sha256').update(JSON.stringify(files)).digest('hex') };
const target = 'src/lib/extractionProfile.generated.json';
const rendered = JSON.stringify(profile, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== rendered) throw new Error('Extraction profile is stale. Run npm run extraction:profile.');
} else writeFileSync(target, rendered);
