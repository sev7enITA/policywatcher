import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { syncCanonicalEntityForCompany } from './documentEvidenceSync';
import { buildDocumentPublicId, buildVersionPublicId, buildChangePublicId } from './publicEvidenceIds';

export const OFFICIAL_ARCHIVE_KIND = 'official_archive_comparison';
export interface OfficialCapture {
  sourceUrl: string; text: string; hash: string; capturedAt: string;
  effectiveAt?: string | null; label: string; httpStatus: number; binaryHash?: string;
}
export interface OfficialComparison {
  companySlug: string; title: string; documentType: string; jurisdiction: string;
  archiveIndexUrl: string; older: OfficialCapture; newer: OfficialCapture;
}
export function validateOfficialComparison(input: OfficialComparison, now = new Date()) {
  if (!input.companySlug || !input.title || !input.documentType || !input.jurisdiction) throw new Error('Missing document identity');
  for (const source of [input.archiveIndexUrl, input.older.sourceUrl, input.newer.sourceUrl]) {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid public source URL');
  }
  for (const capture of [input.older, input.newer]) {
    if (!capture.label || capture.text.length < 500 || capture.text.length > 1_000_000) throw new Error('Invalid capture text or label');
    if (capture.httpStatus < 200 || capture.httpStatus >= 300) throw new Error('Unsuccessful capture');
    if (createHash('sha256').update(capture.text).digest('hex') !== capture.hash) throw new Error('Capture hash mismatch');
    const captured = new Date(capture.capturedAt).getTime();
    if (!Number.isFinite(captured) || captured > now.getTime()) throw new Error('Invalid observation timestamp');
    if (capture.effectiveAt && !Number.isFinite(new Date(capture.effectiveAt).getTime())) throw new Error('Invalid effective date');
  }
  if (input.older.hash === input.newer.hash) throw new Error('Identical versions do not establish a comparison');
}
/** Audited retrospective evidence, separate from monitored current policy/KPI rows. */
export async function importOfficialComparison(tx: Prisma.TransactionClient, input: OfficialComparison) {
  validateOfficialComparison(input);
  const company = await tx.company.findUniqueOrThrow({ where: { slug: input.companySlug } });
  const entity = await syncCanonicalEntityForCompany(tx, company.id);
  const canonicalKey = `official-archive:${input.documentType}:${input.jurisdiction}:${input.title}`;
  const documentPublicId = buildDocumentPublicId(entity.publicId, canonicalKey);
  const document = await tx.document.upsert({ where: { publicId: documentPublicId },
    create: { entityId: entity.id, canonicalKey, publicId: documentPublicId, title: input.title, documentType: input.documentType, jurisdiction: input.jurisdiction, canonicalUrl: input.archiveIndexUrl },
    update: {},
  });
  const versions = [];
  for (const capture of [input.older, input.newer]) {
    const publicId = buildVersionPublicId(document.publicId, capture.hash);
    const existing = await tx.version.findUnique({ where: { publicId } });
    if (existing) { versions.push(existing); continue; }
    const maximum = await tx.version.aggregate({ where: { documentId: document.id }, _max: { sequence: true } });
    versions.push(await tx.version.create({ data: {
      publicId, documentId: document.id, sequence: (maximum._max.sequence || 0) + 1,
      contentHash: capture.hash, sourceUrl: capture.sourceUrl, capturedAt: new Date(capture.capturedAt),
      effectiveAt: capture.effectiveAt ? new Date(capture.effectiveAt) : null,
      contentText: capture.text, publicEvidence: true,
    } }));
  }
  const [older, newer] = versions;
  const publicId = buildChangePublicId(document.publicId, older.publicId, newer.publicId);
  const existing = await tx.change.findUnique({ where: { publicId } });
  if (existing) return { id: existing.publicId, created: false };
  const summary = JSON.stringify({ olderLabel: input.older.label, newerLabel: input.newer.label, archiveIndexUrl: input.archiveIndexUrl });
  const change = await tx.change.create({ data: {
    publicId, documentId: document.id, fromVersionId: older.id, toVersionId: newer.id,
    kind: OFFICIAL_ARCHIVE_KIND, summary, detectedAt: new Date(), publicEvidence: true, publishedAt: new Date(),
  } });
  await tx.adminReviewLog.create({ data: {
    actorRole: 'admin', action: 'official_archive_comparison_imported', targetType: 'Change', targetId: change.id,
    targetLabel: `${company.name} / ${input.title} / ${input.jurisdiction}`,
    note: 'Publisher-hosted versions recovered retrospectively. Capture timestamps record retrieval, not historical monitoring. No KPI, alert or notification created.',
    metadataJson: JSON.stringify({ ...JSON.parse(summary), older: { ...input.older, text: undefined }, newer: { ...input.newer, text: undefined } }),
  } });
  return { id: change.publicId, created: true };
}
