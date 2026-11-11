/** Follow-up to advisory review. Offline and read-only with respect to archived evidence. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractEngineBody, assessCapture } from '../src/lib/engine/acquisition';
import { digest, type SourceContract } from '../src/lib/engine/document';
const out = resolve(process.argv[2] || '');
if (!out.startsWith(resolve('output') + '/')) throw new Error('output_directory_required');
const terminal = 'Contact our privacy team for information about this policy and your rights.';
const url = 'https://example.com/privacy';
const contract: SourceContract = { schemaVersion: 1, sourceUrl: url, titleAliases: ['Privacy Policy'], requiredHeadings: ['Data use', 'Contact'], terminalText: terminal, language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct', reviewedAt: '2026-11-07T00:00:00Z', reviewNote: 'Authored synthetic diagnostic; not provider source approval.' };
const stray = 'You may request human review of automated decisions.';
const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><table>${stray}<tr><th>Purpose</th><th>Consent</th></tr><tr><td>Training</td><td>No</td></tr></table><h2>Contact</h2><p>${terminal}</p></main></html>`;
const body = extractEngineBody(html, url);
const result: Record<string, unknown> = { observedAt: new Date().toISOString(), boundary: 'Offline reproduction of reviewer hypotheses, no new live captures or observation days.', table: { html, htmlHash: digest(html), text: body.document.text, retained: body.document.text.includes(stray), assessment: assessCapture(body, contract, url), reviewerPrediction: 'stray text absent and unreported' } };
if (process.argv[3]) {
  const bytes = readFileSync(process.argv[3], 'utf8');
  const pdfUrl = 'https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf';
  const pdfBody = extractEngineBody(bytes, pdfUrl);
  result.pdfReplay = { inputSha256: digest(bytes), originalPdfBytes: false, format: 'archived decoded HTML from 2 November, evaluated by r3', textHash: pdfBody.document.hash, headings: pdfBody.document.blocks.filter(b => b.kind === 'heading').length, language: pdfBody.language || null,
    assessment: assessCapture(pdfBody, { ...contract, sourceUrl: pdfUrl, titleAliases: ['AWS GDPR Data Processing Addendum'], requiredHeadings: ['Data Processing'], terminalText: pdfBody.document.text.slice(-100) }, pdfUrl), contractBoundary: 'Diagnostic expectations only. This contract is neither reviewed nor installed. Missing headings/language suffice to reject irrespective of exact title expectations.' };
}
writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
