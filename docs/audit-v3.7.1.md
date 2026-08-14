# Release 3.7.1 - Notification Intake Reliability Review

Date: 2026-07-22
Scope: the public `/what-changed` browser workflow, structured inquiry API, company matching, public portfolio evidence selection and Hostinger runtime storage behavior.

## Closed failure modes

1. **Lost links after copy-and-paste.** Plain text is sufficient to start the browser-local extraction. The official starting-policy URL is an independent optional clue, not a prerequisite.
2. **Wrong-company resolution.** A company name and an official URL/domain pointing to different known companies now produce a conflict response. A known URL cannot silently override an explicit unknown company name.
3. **Narrow evidence scope.** Starting policy categories rank evidence but do not filter the query; every public monitored policy for the matched company remains within the reported portfolio scope.
4. **Opaque runtime failure.** Missing inquiry migrations, missing SQLite structures, unavailable connections, locked/read-only databases and corrupt storage are mapped to a controlled `503` operational state.
5. **Raw-content exposure.** The browser submits an allowlisted structured payload only. The public API rejects extra fields and never accepts, persists, fetches or sends pasted email content to an AI provider.

## Evidence and privacy boundary

- Immediate answers are assembled only from `publicPolicyWhere` and `publicChangeWhere` records.
- An unknown company creates a privacy-minimized human-review inquiry using confirmed structured clues.
- An optional submitted URL is not fetched before administrator approval.
- The first successful scan creates a baseline; it does not reconstruct an unobserved historical version.

## Verification record

- UI/UX evaluation: PASS after keyboard-focus, mobile-legibility and unavailable-state refinements.
- Regression tests cover link-free input, conflict matching, portfolio ranking, structured-payload enforcement and runtime storage classification.
- Final test, lint, TypeScript, dependency-audit, production-build and extracted-package smoke results are recorded in the release handoff.
