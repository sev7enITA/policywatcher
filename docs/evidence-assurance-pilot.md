# Evidence assurance pilot

Implementation dated 7 October 2026, based on v5 main commit `77914ff`. Initial status: local pilot. Subsequent deployment status and runtime evidence are recorded in [the release report](reports/evidence-assurance-release-2026-10-07/README.md). The accompanying [assessment](reports/eu-terms-reuse-2026-10-07/assessment-it.md) documents the source and licensing investigation. The supplied independent audit was reviewed before implementation.

## What is implemented

| Step | Implementation | Boundary |
|---|---|---|
| 1 | Native extraction profile fingerprint, bounded private replay input, technical baseline events, recovery review | Opt-in; no copied OTA engine or executable AGPL filters |
| 5 | Dataset QA extension for reviewed substantive-change false-positive share and AI citation support | Human-selected samples, explicit denominators, null when unassessed; no population-accuracy claim |
| 2 | Bounded EU metadata discovery for Google/OpenAI/Meta privacy and terms | Proposals requiring applicability review; no automatic policy onboarding |
| 3 | Up to three historical revisions per pilot document, stable Git references, idempotent import | Metadata only; no source text, live confirmation, retroactive alerts or KPI effects |
| 4 | Transient comparison of an existing snapshot and a rights-acknowledged supplied extraction | Diagnostic lexical signals; no external fetch, persistence or automatic confidence increase |

The protected workbench is `/admin/evidence-quality`; Dataset QA links to it and displays the two new sample metrics. Admins may write reviews; auditors have read access. The application's existing administrative request-origin/body boundary also protects this route. Review logs record the authenticated role under the existing shared-admin identity model; they do not identify an individual reviewer beyond that model.

The discovery adapter uses the official public GitLab API, never the portal HTML or a presumed OTA Collection API. It fixes the repository HEAD before traversal, checks the reviewed LICENSE fingerprint, validates paths and SHA identifiers, and aborts rather than committing partial results. Responses, tree traversal and pilot scope are bounded. HTTP failures, including throttling, fail the current run; there is no background retry loop. Imports are atomic and deduplicated by project/path/commit. A Git blob ID is explicitly distinguished from a SHA-256 text hash.

The pilot scope refers to exact repository service folders. In particular, absence of a privacy document in the `Meta` folder does not establish absence across Facebook, Instagram or the wider group. The CLI reports per-service/type discovery coverage. Expanding aliases, languages, rights or historical depth is separate from the bounded pilot.

## Extraction behavior

`POLICYWATCHER_EXTRACTION_GUARD=1` enables the shared guard used by scheduled and manual scans. It is off by default while deployment and baseline readiness are being reviewed.

1. Existing unchanged live text can anchor its extractor input without changing public evidence.
2. The same profile allows ordinary comparison; confirmation includes the profile fingerprint and requires consecutive live observations. Manual scans obey this gate too when enabled.
3. A changed profile re-extracts the preserved old input. The resulting old baseline is appended without creating a `PolicyChange`, invoking AI or notifying subscribers. Even if the current provider text also changed, subsequent scans restart confirmation against the corrected old baseline.
4. Missing, oversize, corrupt or invalid old input produces a review event, not an inferred provider change. An admin can document a recovery decision in the workbench; the next successful live scan then establishes a replacement baseline. Old snapshots and changes are retained.
5. Archive-backed results cannot establish a live baseline or confirm a change through the enabled path. Failed/partial acquisition remains governed by the existing checks.

The stored input is exactly the string consumed by `validateContent`, capped at 2 MiB. For PDF handling it may already be the PDF-to-HTML extraction rather than wire bytes; `inputHash` must not be described as a hash of the original PDF. One private input is retained per policy baseline and replaced as the baseline advances. It is excluded from public and admin-overview responses and included in the authenticated encrypted full backup. Sanitized staging copies remove extraction inputs, human review notes and reviewed external references; re-import public metadata and establish staging anchors separately. Existing public snapshots are unchanged; no additional upstream UE policy text is retained.

The extraction fingerprint is generated from scraper/PDF extraction source, acquisition-key/profile logic and the resolved dependency lock. It includes the normalized acquisition key, preserving language selectors and fragment scope while allowing the scanner's existing deduplication of tracking parameters. After an extraction/dependency edit run `npm run extraction:profile`, review and commit the generated manifest. `pretest` and `prebuild` reject a stale fingerprint. Changes to additional extraction dependencies must also be represented in the generator's input list.

## Reviews and metric definitions

- False-positive share = reviews marked non-substantive / assessed substantive-change reviews. This is a share among reviewed detections, not the statistical false-positive rate over all unchanged documents.
- Citation support = claims judged supported / assessed claim reviews. A supported verdict requires a literal source passage and a claim present in the stored AI summary; a human still decides semantic support.
- Unassessed verdicts are excluded from each assessed denominator and counted separately. No assessed observations yields null, not zero or 100%.
- Fingerprints bind review evidence to both snapshot contents/hashes, summaries and diff. Changed or deleted evidence invalidates the old review for current metrics. Re-saving the same claim updates its current review and appends an audit entry instead of inflating the sample.
- Samples are purposive operator selections. Comparison with the EU archive is not independent ground truth. No metric is added to the existing aggregate Dataset QA score or public risk KPI.

The transient comparison requires an explicit equivalence check and a stated processing basis. It measures exact identity, token overlap, numeric differences and counts of negation terms; none proves legal equivalence. The supplied external text is not stored or logged by the feature and is cleared from the form after success. This acknowledgement is not a legal determination or a substitute for the rights assessment.

## Local validation and pilot commands

Use an isolated database. `--apply` writes only external metadata; omitting it is a dry run. It does not launch scans, invoke AI or send email.

```sh
DATABASE_URL=file:/absolute/path/to/isolated-pilot.db node scripts/hostinger-init-db.mjs
DATABASE_URL=file:/absolute/path/to/isolated-pilot.db npm run eu:pilot
DATABASE_URL=file:/absolute/path/to/isolated-pilot.db npm run eu:pilot -- --apply
```

The actual retrieval on 7 October returned seven pilot documents and 16 historical references at collection HEAD `0dbd93e5c9b3af461ae31afb9d6b73760b6270c3`. See the [metadata receipt](reports/eu-terms-reuse-2026-10-07/pilot-result.json). These counts establish bounded retrieval, not complete provider coverage or full historical acquisition. Synthetic local QA rows used for browser tests must not be imported into production.

Detailed results and limitations are recorded in the [validation receipt](reports/eu-terms-reuse-2026-10-07/validation-it.md).

## Deployment and rollback

The additive `20261007120000_evidence_assurance` migration exists for SQLite and PostgreSQL. Both Hostinger fallback initializers, readiness inventories, encrypted backup inventory and the staging schema gate include the new tables. Existing applied migration files are unchanged. The provider-specific PostgreSQL migration/runtime/rehearsal CI passed at commit `1336cb4`; repeat it for the release candidate.

Rollout sequence:

1. Keep production untouched while validating this branch. Capture the committed artifact and a verified current database backup before staging promotion.
2. Set `POLICYWATCHER_SCANS_PAUSED=1`, stop scheduled triggers and drain in-flight work before a migration/rollback window. The new code rejects new scheduled, admin-triggered and manual scans while paused; it does not cancel already running requests.
3. Apply additive schema changes in staging using the existing guarded deployment process. Verify initializer idempotency, readiness and backup completeness.
4. Enable the extraction guard in staging. While scans are paused and drained, run `npx tsx scripts/extraction-readiness.ts --apply` to anchor only exact live matches; changed or unavailable baselines remain unresolved. Then resume scans and inspect unchanged anchors, missing-input holds, parser upgrades, pending confirmation and sample review metrics. Run the existing public-evidence, subscription and staging checks before promotion.
5. Promote only the same verified artifact; enable the production guard deliberately with a baseline-readiness review. A successful local test is not production activation.

Rollback criteria include unexpected guard holds, a false provider-change event after parser-only modification, snapshot/hash mismatch, missing review provenance or inability to restore the backup. Pause and drain scans first. Prefer a forward fix preserving the guard. Do not simply disable the guard or roll back extraction code while scanning against re-extracted baselines: that could manufacture reverse changes. If returning to an earlier application, retain the maintenance boundary and use a reviewed, consistent application/database recovery point; preserve post-backup records separately before any restore. Do not drop the additive tables as a routine rollback.

## Workspace alignment

Implementation is in shared v5 core modules on `codex/eu-evidence-quality`, based on current `origin/main`. The Desktop checkout was on an older branch with pre-existing edits and was not overwritten. Align it through normal Git reconciliation after this branch is accepted; do not duplicate a second independently edited implementation or cherry-pick schema-dependent scanner code alone.
