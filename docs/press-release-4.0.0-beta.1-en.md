# PolicyWatcher releases version 4 Foundation Beta with a canonical evidence model for policy change monitoring

Milan, 20 August 2026 - PolicyWatcher has published `4.0.0-beta.1`, named Canonical Evidence Foundation, as a GitHub prerelease. The release record is dated 19 August 2026. It introduces a durable evidence model for connecting monitored entities, source documents, document versions, observed changes and policy provisions while keeping the current production read path unchanged.

## A structured chain for policy evidence

The new additive model follows five linked levels:

`Entity -> Document -> Version -> Change -> Provision`

Every public-facing level receives a deterministic stable identifier that is independent from internal database UUIDs. This allows external references to remain stable when names, URLs or internal storage choices change.

The first provision taxonomy covers six areas that frequently shape digital-policy analysis:

- AI training;
- data sharing;
- retention;
- arbitration;
- content licensing;
- liability.

The taxonomy classifies observed language. It does not determine legal validity, applicability or compliance.

## One publication-readiness contract

Version 4 replaces competing readiness summaries with one database-derived contract shared by the protected Admin area, the internal competitive comparison and the public API.

The contract reports configured, retrieved, baseline-verified, public and analysed policy records, together with the latest successful capture. Missing measurements remain unavailable instead of being converted to zero. The public payload is aggregate-only and excludes policy text, private review notes and retrieval diagnostics.

Public contract: `https://policywatcher.online/api/v1/publication-readiness`

## Migration controls included in the beta

The release includes guarded tools for historical backfill, deterministic reconciliation and opt-in transactional dual-write. A canonical write failure rolls back the associated legacy mutation so the two models cannot silently diverge.

The migration remains controlled:

- backfill is not executed by install or build;
- dual-write is disabled by default;
- SQLite remains the current production database;
- PostgreSQL portability is verified in CI and through an isolated rehearsal workflow;
- object storage and canonical read switching are not activated.

## Verification evidence

The promoted source commit passed the repository quality gate, PostgreSQL portability and dual-write rehearsal, 153 test files with 999 tests, TypeScript, ESLint, the Next.js production build, Sonar, CodeQL and OpenSSF Scorecard checks. Four report-writer time-of-check/time-of-use findings identified during promotion were removed by using exclusive atomic file creation.

The GitHub prerelease includes a checksum-verified Hostinger source artifact. This artifact still requires staging deployment, a representative database rehearsal and post-deploy verification before production promotion.

## Availability

- GitHub prerelease: `https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1`
- Functional report and 3.x comparison: `https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/policywatcher-v4-vs-v3-2026-08-20.html`
- Architecture: `https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-model.md`
- Migration runbook: `https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-backfill-runbook.md`

The public website may continue to display `3.9.0-beta.42` until the exact v4 artifact completes the separate Hostinger staging and production gates.

## Stated boundaries

PolicyWatcher 4 Foundation Beta documents implemented software controls. It does not establish exhaustive monitoring, legal review, analytical correctness, service availability, market adoption or competitive superiority. The canonical graph does not become the production source of truth until the backfill, reconciliation, dual-write and read-switch gates are explicitly completed.

## About PolicyWatcher

PolicyWatcher is an independent civic-tech project that makes public policy sources, observed changes, evidence state and analytical limitations inspectable. It is not legal advice or a compliance certification.

Press and fact-checking contact: `info@policywatcher.online`
