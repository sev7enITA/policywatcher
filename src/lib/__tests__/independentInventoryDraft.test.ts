import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseSourceContract } from '../engine/document';
const dirs: string[] = [];
const main = '# Terms\n\n## Use\n\nThe reviewed independent service policy requires complete receipts and prohibits disclosure of personal credentials.\n\n## Contact\n\nContact the policy owner for questions about these terms.';
const annex = '# Annex\n\nThe independently reviewed attachment requires retention of all original audit receipts for seven years after each service has ended.';
const raw = '<html lang="en"><main><h1>Annex</h1><p>The independently reviewed attachment requires retention of all original audit receipts for seven years after each service has ended.</p></main></html>';
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'pw-independent-draft-')); dirs.push(directory);
  writeFileSync(join(directory,'reference.txt'),main); writeFileSync(join(directory,'annex.html'),raw); writeFileSync(join(directory,'annex-reference.txt'),annex);
  const reference = { method: 'manual_reference', url: 'https://example.org/retained-reference', sha256: sha(main),
    capturedAt: '2026-11-22T10:00:00Z', reviewedAt: '2026-11-22T10:10:00Z', reviewNote: 'Separately retained authored reference reviewed before acquisition.' };
  const spec = { contract: { schemaVersion: 1, sourceUrl: 'https://example.org/terms', language: 'en', titleAliases: ['Terms'], requiredHeadings: ['Use','Contact'],
    terminalText: 'Contact the policy owner for questions about these terms.', minimumChars: 100, maximumChars: 500000,
    preferredTransport: 'direct', reviewedAt: reference.reviewedAt, reviewNote: reference.reviewNote }, referenceFile: 'reference.txt', reference, links: [{ url: 'https://example.org/annex', occurrences: 1, purpose: 'attachment' }],
    independence: { captureId: 'separate-capture-1', reviewId: 'review-1', independentOfCandidate: true,
      procedure: 'Manual reference text and attachment reviewed from separately retained material before assessing the candidate.' },
    attachments: [{ id: 'annex-1', url: 'https://example.org/annex', mediaType: 'text/html', rawFile: 'annex.html', referenceTextFile: 'annex-reference.txt',
      linkOccurrences: 1, reference: { ...reference, sha256: sha(raw), url: 'https://example.org/annex' } }] };
  writeFileSync(join(directory,'spec.json'), JSON.stringify(spec));
  return { directory, spec };
}
function run(directory: string) {
  return spawnSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'),resolve('scripts/prepare-independent-inventory.ts'),
    '--spec', join(directory,'spec.json'),'--out',join(directory,'draft.json')], { encoding:'utf8', timeout: 20000 });
}
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory,{recursive:true,force:true}); });
describe('offline independent reference authoring', () => {
  it('reads actual separate references and emits a review draft with no automatic approval', () => {
    const { directory } = fixture(); const result = run(directory); expect(result.status, result.stderr).toBe(0);
    const draft = JSON.parse(readFileSync(join(directory,'draft.json'),'utf8'));
    expect(draft).toMatchObject({state:'draft_requires_human_review',automaticApproval:false,originVerified:false,sourceCompletenessQualified:false});
    const inventory = parseSourceContract(draft.contract).completenessInventory!;
    expect(inventory.schemaVersion).toBe(2); expect(inventory.elements).toHaveLength(inventory.units.length);
    expect(inventory.attachments![0].bytesSha256).toBe(sha(raw)); expect(inventory.reference.sha256).toBe(sha(main));
    expect(result.stdout).not.toContain(main); expect(result.stdout).not.toContain(raw);
  });
  it('refuses changed main reference bytes instead of refreshing expectations silently', () => {
    const { directory } = fixture(); writeFileSync(join(directory,'reference.txt'), main.replace('complete receipts','incomplete receipts'));
    const result = run(directory); expect(result.status).not.toBe(0); expect(result.stderr).toContain('main_reference_artifact_digest_mismatch');
  });
  it('refuses changed attachment bytes even when the reviewed text is unchanged', () => {
    const { directory } = fixture(); writeFileSync(join(directory,'annex.html'),raw+'<p>An extra clause.</p>');
    const result = run(directory); expect(result.status).not.toBe(0); expect(result.stderr).toContain('attachment_reference_artifact_digest_mismatch');
  });
  it('rejects a symlink reference instead of checking one pathname and reading another target', () => {
    const { directory } = fixture();
    unlinkSync(join(directory, 'reference.txt')); writeFileSync(join(directory, 'different.txt'), main);
    symlinkSync(join(directory, 'different.txt'), join(directory, 'reference.txt'));
    const result = run(directory); expect(result.status).not.toBe(0); expect(result.stderr).toContain('ELOOP');
  });
  it('bounds file reads before allocating or trusting changed reference bytes', () => {
    const { directory } = fixture(); writeFileSync(join(directory, 'reference.txt'), Buffer.alloc(500001, 65));
    const result = run(directory); expect(result.status).not.toBe(0); expect(result.stderr).toContain('reference_file_budget_or_type');
  });
  it('preserves an earlier draft instead of overwriting its evidence', () => {
    const { directory } = fixture(); expect(run(directory).status).toBe(0);
    const original = readFileSync(join(directory,'draft.json'),'utf8'); expect(run(directory).status).not.toBe(0);
    expect(readFileSync(join(directory,'draft.json'),'utf8')).toBe(original);
  });
});
