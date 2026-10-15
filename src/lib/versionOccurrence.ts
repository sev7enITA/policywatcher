import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';

export function versionOccurrenceDigest(contentHash: string, snapshotId: string): string {
  return createHash('sha256').update(JSON.stringify(['version-occurrence.v1', contentHash, snapshotId])).digest('hex');
}

/** Replays may update publication state, but never rewrite capture evidence. */
export async function syncVersionOccurrence(
  tx: Prisma.TransactionClient,
  input: {
    policyUrl: string;
    document: { id: string; publicId: string };
    snapshot: {
      id: string; hash: string; text: string; createdAt: Date; publicEvidence: boolean;
      sourceUrl?: string | null; requestedUrl?: string | null; finalUrl?: string | null;
      sourceProvenance?: string;
    };
    nextSequence: () => number;
    buildPublicId: (documentId: string, digest: string) => string;
  },
) {
  const { document, snapshot, buildPublicId } = input;
  if (createHash('sha256').update(snapshot.text).digest('hex') !== snapshot.hash) {
    throw new Error(`canonical_content_hash_mismatch:${snapshot.id}`);
  }
  const legacyPublicId = buildPublicId(document.publicId, snapshot.hash);
  const occurrencePublicId = buildPublicId(document.publicId, versionOccurrenceDigest(snapshot.hash, snapshot.id));
  const byLegacyId = await tx.version.findUnique({ where: { legacySnapshotId: snapshot.id } });
  const byOccurrence = await tx.version.findUnique({ where: { publicId: occurrencePublicId } });
  const oldCandidate = await tx.version.findUnique({ where: { publicId: legacyPublicId } });
  const adoptableLegacy = oldCandidate && (!oldCandidate.legacySnapshotId || oldCandidate.legacySnapshotId === snapshot.id)
    ? oldCandidate : null;
  const matches = [byLegacyId, byOccurrence, adoptableLegacy].filter((value) => value !== null);
  if (matches.some((value) => value.id !== matches[0].id)) {
    throw new Error(`canonical_version_identity_conflict:${snapshot.id}`);
  }
  const existing = matches[0];
  if (existing && (
    existing.documentId !== document.id
    || ![legacyPublicId, occurrencePublicId].includes(existing.publicId)
    || existing.contentHash !== snapshot.hash
    || (existing.legacySnapshotId && existing.legacySnapshotId !== snapshot.id)
    || (existing.contentText !== null && existing.contentText !== snapshot.text)
    || existing.capturedAt.getTime() !== snapshot.createdAt.getTime()
    || (existing.contentArtifactHash && existing.contentArtifactHash !== snapshot.hash)
  )) throw new Error(`canonical_version_immutable_evidence_conflict:${snapshot.id}`);

  const artifact = await tx.contentArtifact.upsert({
    where: { contentHash: snapshot.hash },
    create: { contentHash: snapshot.hash, text: snapshot.text },
    update: {},
  });
  if (artifact.text !== snapshot.text) throw new Error(`canonical_content_artifact_conflict:${snapshot.id}`);

  if (existing) {
    if (existing.contentArtifactHash === snapshot.hash && existing.publicEvidence === snapshot.publicEvidence
      && existing.legacySnapshotId === snapshot.id) return existing;
    return tx.version.update({
      where: { id: existing.id },
      data: {
        contentArtifactHash: snapshot.hash,
        publicEvidence: snapshot.publicEvidence,
        legacySnapshotId: snapshot.id,
      },
    });
  }
  return tx.version.create({ data: {
    publicId: occurrencePublicId,
    documentId: document.id,
    sequence: input.nextSequence(),
    contentHash: snapshot.hash,
    contentArtifactHash: snapshot.hash,
    contentText: snapshot.text,
    sourceUrl: snapshot.sourceUrl ?? input.policyUrl,
    requestedUrl: snapshot.requestedUrl ?? null,
    finalUrl: snapshot.finalUrl ?? null,
    sourceProvenance: snapshot.sourceProvenance === 'replayed' ? 'replayed'
      : snapshot.sourceUrl && snapshot.sourceProvenance === 'captured' ? 'captured' : 'reconstructed',
    capturedAt: snapshot.createdAt,
    publicEvidence: snapshot.publicEvidence,
    legacySnapshotId: snapshot.id,
    createdAt: snapshot.createdAt,
  } });
}
