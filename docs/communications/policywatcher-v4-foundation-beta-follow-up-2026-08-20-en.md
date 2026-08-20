# PolicyWatcher 4 Foundation Beta - follow-up post

Publication gate: publish after the v4 Hostinger artifact passes staging and post-deploy verification. Until then, use the GitHub-only variant below.

## Main post after web deployment

PolicyWatcher 4 Foundation Beta is now available.

The release adds a canonical evidence chain for policy monitoring:

Entity -> Document -> Version -> Change -> Provision

What this changes in practice:

- stable public identifiers preserve external references independently from internal database UUIDs;
- a versioned taxonomy starts with AI training, data sharing, retention, arbitration, content licensing and liability;
- one database-derived publication-readiness contract serves Admin, the internal competitive comparison and the public API;
- guarded backfill, deterministic reconciliation and opt-in transactional dual-write prepare the migration while current reads remain unchanged;
- PostgreSQL portability is tested, while database cutover and object storage remain separate production decisions.

The release is a foundation beta. It documents implemented controls and migration evidence; it does not claim exhaustive coverage, legal validation, analytical correctness or completed infrastructure cutover.

Release record:
https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1

Publication-readiness contract:
https://policywatcher.online/api/v1/publication-readiness

Detailed v4 infographic:
https://policywatcher.online/press-kit/policywatcher-v4-foundation-beta-en-2026-08-20.png

#CivicTech #PolicyMonitoring #DataGovernance #AITransparency #OpenSource

## GitHub-only variant before web deployment

PolicyWatcher 4 Foundation Beta has been published as a GitHub prerelease.

The source release introduces a canonical Entity, Document, Version, Change and Provision evidence model, stable public identifiers, a focused provision taxonomy and one database-derived publication-readiness contract.

The exact Hostinger artifact still has to pass staging and post-deploy verification. The public website may therefore continue to report the previous web release until that separate gate is complete.

Release and checksum-verified assets:
https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1

#CivicTech #PolicyMonitoring #DataGovernance #AITransparency #OpenSource

## First comment

Supporting material:

- Functional report and 3.x comparison: https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/policywatcher-v4-vs-v3-2026-08-20.html
- Canonical evidence model: https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-model.md
- Migration runbook: https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-backfill-runbook.md
- Public API documentation: https://github.com/sev7enITA/policywatcher/blob/main/docs/public-api-v1.md

The taxonomy classifies observed policy language. It does not establish legal validity, applicability or compliance.
