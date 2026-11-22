/** Offline draft authoring from separately retained reference files. No network or approval. */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { digest, parseSourceContract, structureDocument, type SourceContract } from '../src/lib/engine/document';
import { createHash } from 'node:crypto';
import { coverageInventoryDigest, coverageScopeId, observedCoverageSequenceDigest, observedCoverageUnits,
  type ReviewedCoverageInventory, type ExpectedAttachment } from '../src/lib/engine/coverage';

const args = process.argv.slice(2);
function argument(name: string) {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1]) throw new Error(`Missing ${name}`);
  return resolve(args[index + 1]);
}
const specPath = argument('--spec'), destination = argument('--out');
if (statSync(specPath).size > 512 * 1024) throw new Error('reference_spec_budget_exceeded');
const spec = JSON.parse(readFileSync(specPath, 'utf8')) as {
  contract: SourceContract;
  referenceFile: string;
  reference: ReviewedCoverageInventory['reference'];
  independence: NonNullable<ReviewedCoverageInventory['independence']>;
  links: NonNullable<ReviewedCoverageInventory['links']>;
  attachments: Array<{ id: string; url: string; mediaType: ExpectedAttachment['mediaType']; rawFile: string;
    referenceTextFile: string; linkOccurrences: number; reference: ReviewedCoverageInventory['reference'] }>;
};
if (!spec || !Array.isArray(spec.attachments) || spec.attachments.length > 4 || spec.contract.completenessInventory !== undefined) throw new Error('invalid_reference_spec');
const base = dirname(specPath);
function retained(path: string, limit: number) {
  const file = resolve(base, path);
  if (file === destination || statSync(file).size > limit) throw new Error('reference_file_budget_or_output_overlap');
  return readFileSync(file);
}
function inventory(referenceText: string, sourceUrl: string, reference: ReviewedCoverageInventory['reference'], version: string): ReviewedCoverageInventory {
  const scope = { sourceUrl, language: spec.contract.language, referenceVersion: version };
  const doc = structureDocument(referenceText);
  const body = { schemaVersion: 1 as const, scope, scopeId: coverageScopeId(scope), reference,
    units: observedCoverageUnits(doc), sequenceSha256: observedCoverageSequenceDigest(doc) };
  return { ...body, inventorySha256: coverageInventoryDigest(body) };
}
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const main = retained(spec.referenceFile, 500_000);
if (spec.reference.sha256 !== sha(main)) throw new Error('main_reference_artifact_digest_mismatch');
const version = spec.reference.sha256;
const mainInventory = inventory(main.toString('utf8'), spec.contract.sourceUrl, spec.reference, version);
const attachments = spec.attachments.map(attachment => {
  const bytes = retained(attachment.rawFile, 1_000_000);
  const text = retained(attachment.referenceTextFile, 500_000);
  if (attachment.reference.sha256 !== sha(bytes)) throw new Error('attachment_reference_artifact_digest_mismatch');
  if (attachment.mediaType === 'application/pdf' && bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('reference_pdf_signature_missing');
  return { id: attachment.id, url: attachment.url, mediaType: attachment.mediaType, linkOccurrences: attachment.linkOccurrences,
    bytesSha256: sha(bytes), coverage: inventory(text.toString('utf8'), attachment.url, attachment.reference, sha(bytes)) };
});
const { inventorySha256: ignored, ...body } = mainInventory; void ignored;
const detailed = { ...body, schemaVersion: 2 as const, independence: spec.independence, links: spec.links,
  elements: body.units.map((unit, index) => ({ ...unit, section: [...unit.section], id: `reference-element-${index + 1}`,
    elementKind: unit.kind === 'heading' ? 'section' as const : unit.kind === 'table' ? 'table_row' as const : 'clause' as const })), attachments };
const reviewed = { ...detailed, inventorySha256: coverageInventoryDigest(detailed) };
const contract = parseSourceContract({ ...spec.contract, completenessInventory: reviewed });
if (Buffer.byteLength(JSON.stringify({ action: 'contract', contract }), 'utf8') > 512 * 1024) throw new Error('source_contract_request_budget_exceeded');
const result = { state: 'draft_requires_human_review', automaticApproval: false, originVerified: false,
  sourceCompletenessQualified: false, referenceTextSha256: digest(main.toString('utf8')),
  notice: 'Review actual retained reference files, segmentation and attachment scope independently before saving this contract in the administrator interface. This tool does not prove independent acquisition or authenticate the publisher.', contract };
writeFileSync(destination, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
process.stdout.write(JSON.stringify({ state: result.state, elements: reviewed.elements.length, attachments: attachments.length, inventorySha256: reviewed.inventorySha256 }) + '\n');
