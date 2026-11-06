/** Diagnostic counterexamples, not source qualification or model inference. */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { assessDocument, structureDocument, type SourceContract } from '../src/lib/engine/document';

const sourceUrl = 'https://example.com/privacy';
const terminal = 'Contact our privacy team for further information about this policy.';
const critical = 'You may opt out of automated decisions and request human review.';
const retention = 'We delete records after 30 days unless you request earlier deletion.';
const row = '| Sensitive data | Explicit consent |';
const reference = ['# Privacy Policy', '## Your rights', critical, critical,
  '## Retention', retention, '## Categories', '| Category | Basis |', '| --- | --- |', row,
  '## Contact', terminal].join('\n\n');
const contract: SourceContract = { schemaVersion: 1, sourceUrl, titleAliases: ['Privacy Policy'],
  requiredHeadings: ['Your rights', 'Retention', 'Categories', 'Contact'], terminalText: terminal,
  language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct',
  reviewedAt: '2026-11-06T00:00:00Z', reviewNote: 'Synthetic reference explicitly contains two rights-clause occurrences and one table row.' };
const count = (text: string, value: string) => text.split(value).length - 1;
const cases = [
  { id: 'complete_control', text: reference, referenceComplete: true },
  { id: 'missing_middle_clause', text: reference.replace(retention, ''), referenceComplete: false },
  { id: 'lost_repeated_occurrence', text: reference.replace(critical, ''), referenceComplete: false },
  { id: 'missing_table_row', text: reference.replace(row, ''), referenceComplete: false },
  { id: 'empty_required_section', text: reference.replaceAll(critical, ''), referenceComplete: false },
  { id: 'missing_required_heading_control', text: reference.replace('## Retention', ''), referenceComplete: false },
  { id: 'missing_terminal_control', text: reference.replace(terminal, ''), referenceComplete: false },
];
const rows = cases.map(c => ({ id: c.id, referenceComplete: c.referenceComplete,
  documentHash: structureDocument(c.text).hash, length: c.text.length,
  expectedOccurrences: { rights: 2, retention: 1, sensitiveDataRow: 1 },
  observedOccurrences: { rights: count(c.text, critical), retention: count(c.text, retention), sensitiveDataRow: count(c.text, row) },
  contractAssessment: assessDocument(structureDocument(c.text), contract, sourceUrl, 'en') }));
const report = { observedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  boundary: 'Seven synthetic document-level counterexamples. They isolate contract sufficiency, not HTML extraction, live source accuracy or publication behavior. contract_satisfied is not independent completeness.',
  rows, incompleteDocumentsPassingContract: rows.filter(r => !r.referenceComplete && r.contractAssessment.eligible).map(r => r.id),
  sourceCompletenessQualified: false };
const path = resolve(process.argv[2] || 'output/engine-completeness-falsifiers.json');
if (!path.startsWith(resolve('output') + '/')) throw new Error('output_directory_required');
writeFileSync(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
