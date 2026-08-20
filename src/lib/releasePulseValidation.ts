import { pressKitReleases } from './pressKit';
import { RELEASE_IMPACT_ITEMS } from './releaseImpact';
import type { ReleaseEvidenceLedger } from './releasePulse';

export function validateReleaseEvidenceJoins(ledger: ReleaseEvidenceLedger): void {
  const pressVersions = new Set(pressKitReleases.map((release) => release.version));
  const impactIds = new Set(RELEASE_IMPACT_ITEMS.map((item) => item.id));
  for (const release of ledger.releases) {
    if (!pressVersions.has(release.version)) throw new Error(`Release ledger entry is missing from the Press Kit: ${release.version}.`);
    for (const evidenceId of release.evidence) {
      if (!impactIds.has(evidenceId)) throw new Error(`Release ledger evidence is missing from the impact registry: ${evidenceId}.`);
    }
  }
}
