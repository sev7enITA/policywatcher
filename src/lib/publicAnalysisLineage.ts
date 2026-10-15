import { verifyPolicyAnalysisManifest, type PolicyAnalysisManifest } from './policyAnalysisManifest';

type Snapshot = { hash: string; text: string; publicEvidence: boolean };

/** Public proof summary. Raw responses, prompts and request context stay private. */
export function publicAnalysisLineage(input: {
  evidenceJson?: string | null;
  requestHash?: string | null;
  traceId?: string | null;
  oldSnapshot?: Snapshot | null;
  newSnapshot: Snapshot;
}) {
  const boundary = 'Hash verification links retained inputs and the application SDK request. It does not prove provider execution, semantic completeness or legal correctness.';
  const unavailable = (status: 'not_recorded' | 'unverifiable' | 'mismatch') => ({ status, inputCoverage: 'unknown' as const, semanticCoverage: 'not_measured' as const, boundary });
  if (!input.evidenceJson) return unavailable('not_recorded');
  if (!input.newSnapshot.publicEvidence || (input.oldSnapshot && !input.oldSnapshot.publicEvidence)) return unavailable('unverifiable');
  try {
    const evidence = JSON.parse(input.evidenceJson);
    const manifest = evidence?.inference as PolicyAnalysisManifest | undefined;
    if (!manifest || manifest.contractVersion !== '1.0.0' || evidence.contractVersion !== '1.1.0') return unavailable('unverifiable');
    if (manifest.requestSha256 !== input.requestHash || manifest.traceId !== input.traceId
      || manifest.newDocument.sha256 !== input.newSnapshot.hash
      || (input.oldSnapshot && manifest.oldDocument.sha256 !== input.oldSnapshot.hash)) return unavailable('mismatch');
    const verification = verifyPolicyAnalysisManifest(manifest, input.oldSnapshot?.text ?? '', input.newSnapshot.text);
    if (!verification.valid) return unavailable('mismatch');
    return {
      status: 'verified' as const,
      requestSha256: manifest.requestSha256,
      responseSha256: manifest.rawResponseSha256,
      model: manifest.model,
      promptVersion: manifest.promptVersion,
      schemaVersion: manifest.schemaVersion,
      inputCoverage: manifest.inputCoverage,
      semanticCoverage: manifest.semanticCoverage,
      documents: { old: manifest.oldDocument, new: manifest.newDocument },
      boundary,
    };
  } catch {
    return unavailable('unverifiable');
  }
}
