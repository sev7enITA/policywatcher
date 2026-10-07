import { createHash } from 'node:crypto';
import { buildAcquisitionKey } from './sourceReliability';
import profile from './extractionProfile.generated.json';

export const MAX_EXTRACTION_INPUT_BYTES = 2 * 1024 * 1024;
export const extractionGuardEnabled = () => process.env.POLICYWATCHER_EXTRACTION_GUARD === '1';
export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
export const extractionProfileHash = (url: string) => sha256(JSON.stringify([profile.hash, buildAcquisitionKey(url)]));
export function extractionEvidence(input: string, url: string) {
  if (!extractionGuardEnabled()) return undefined;
  return {
    profileHash: extractionProfileHash(url), inputHash: sha256(input),
    // This is the input to validateContent, not necessarily the original wire bytes (PDFs).
    input: Buffer.byteLength(input, 'utf8') <= MAX_EXTRACTION_INPUT_BYTES ? input : null,
    sourceUrl: url,
  };
}
