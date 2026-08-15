import { createHash } from 'node:crypto';
import { RELEASE_EVIDENCE_LEDGER, validateReleaseEvidenceLedger } from '../src/lib/releasePulse';
import { validateReleaseEvidenceJoins } from '../src/lib/releasePulseValidation';

validateReleaseEvidenceLedger(RELEASE_EVIDENCE_LEDGER);
validateReleaseEvidenceJoins(RELEASE_EVIDENCE_LEDGER);

const digest = createHash('sha256').update(JSON.stringify(RELEASE_EVIDENCE_LEDGER.releases)).digest('hex');
if (digest !== RELEASE_EVIDENCE_LEDGER.integrity.digest) {
  process.stderr.write(`Release evidence ledger digest mismatch: expected ${RELEASE_EVIDENCE_LEDGER.integrity.digest}, observed ${digest}.\n`);
  process.exit(1);
}

process.stdout.write(`Release evidence ledger valid: ${RELEASE_EVIDENCE_LEDGER.releases.length} releases, ${RELEASE_EVIDENCE_LEDGER.window.inclusiveDays} days, sha256:${digest}.\n`);
