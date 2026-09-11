/** Offline only: evaluate a previously exported public snapshot sample without API, AI or email calls. */
import fs from 'node:fs';
import { classifyPolicyChange } from '../src/lib/changeClassification';
import { shouldNotifyChange } from '../src/lib/changeClassificationTypes';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: tsx scripts/evaluate-change-classification.ts public-snapshot-sample.json report.json');
type Change = Parameters<typeof classifyPolicyChange>[0] & { id: string };
const sample = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as { capturedAt: string; source: string; records: string[]; policies: { name: string; company: { name: string }; changes: Change[] }[] };
const ids = new Set(sample.records);
const started = performance.now();
const records = sample.policies.flatMap(policy => policy.changes.filter(change => ids.has(change.id)).map(change => {
  const classification = classifyPolicyChange(change);
  for (const evidence of classification.evidence) {
    if (evidence.before.text !== change.oldSnapshot?.text.slice(evidence.before.start, evidence.before.end)
      || evidence.after.text !== change.newSnapshot?.text.slice(evidence.after.start, evidence.after.end)) throw new Error(`Invalid excerpt in ${change.id}`);
  }
  return { id: change.id, company: policy.company.name, policy: policy.name, classification, notificationEligible: shouldNotifyChange(classification) };
}));
if (records.length !== ids.size) throw new Error('Sample is incomplete or contains duplicate changes.');
const counts = Object.fromEntries(['substantive', 'editorial', 'unchanged', 'needs_review'].map(kind => [kind, records.filter(row => row.classification.kind === kind).length]));
const report = { evaluatedAt: new Date().toISOString(), source: sample.source, sampleCapturedAt: sample.capturedAt, classifierVersion: '1.0', recordsChecked: records.length, exactExcerptValidation: 'passed', durationMs: Math.round(performance.now() - started), counts, records };
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, records: undefined }, null, 2));
