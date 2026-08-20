import { createHash } from 'node:crypto';

export const PUBLIC_EVIDENCE_ID_VERSION = '1' as const;

export const PUBLIC_EVIDENCE_ID_PREFIXES = Object.freeze({
  entity: 'ent',
  document: 'doc',
  version: 'ver',
  change: 'chg',
  provision: 'prv',
} as const);

export type PublicEvidenceIdKind = keyof typeof PUBLIC_EVIDENCE_ID_PREFIXES;

function normalizedPart(value: string, index: number): string {
  const normalized = value.normalize('NFC').trim();
  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error(`Invalid stable public ID input at position ${index}.`);
  }
  return normalized;
}

/**
 * Deterministic 128-bit public identifier. The length-prefixed, versioned
 * payload prevents boundary ambiguity and leaves internal UUIDs undisclosed.
 */
export function buildStablePublicId(
  kind: PublicEvidenceIdKind,
  parts: readonly string[],
): string {
  if (parts.length === 0) throw new Error('A stable public ID requires at least one input.');
  const digest = createHash('sha256');
  digest.update(`policywatcher:public-evidence-id:v${PUBLIC_EVIDENCE_ID_VERSION}\0${kind}\0`);
  for (const [index, raw] of parts.entries()) {
    const part = normalizedPart(raw, index);
    digest.update(`${Buffer.byteLength(part, 'utf8')}:`);
    digest.update(part, 'utf8');
    digest.update('\0');
  }
  return `${PUBLIC_EVIDENCE_ID_PREFIXES[kind]}_${digest.digest('hex').slice(0, 32)}`;
}

export function buildEntityPublicId(canonicalKey: string): string {
  return buildStablePublicId('entity', [canonicalKey]);
}

export function buildDocumentPublicId(entityPublicId: string, canonicalKey: string): string {
  return buildStablePublicId('document', [entityPublicId, canonicalKey]);
}

export function buildVersionPublicId(documentPublicId: string, contentHash: string): string {
  return buildStablePublicId('version', [documentPublicId, contentHash]);
}

export function buildChangePublicId(
  documentPublicId: string,
  fromVersionPublicId: string | null,
  toVersionPublicId: string,
): string {
  return buildStablePublicId('change', [
    documentPublicId,
    fromVersionPublicId || 'baseline',
    toVersionPublicId,
  ]);
}

export function buildProvisionPublicId(
  changePublicId: string,
  taxonomyKey: string,
  ordinal: number,
): string {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0) {
    throw new Error('Provision ordinal must be a non-negative safe integer.');
  }
  return buildStablePublicId('provision', [changePublicId, taxonomyKey, String(ordinal)]);
}
