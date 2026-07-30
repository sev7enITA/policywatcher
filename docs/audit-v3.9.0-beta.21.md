# PolicyWatcher 3.9.0 Beta 21 release audit

Date: 30 July 2026

## Release outcome

Beta 21 adds operational source-reliability records, corrects the first verified-baseline path, publishes a deterministic receiver conformance suite and refreshes the protected admin information architecture. The release does not relax the public evidence gate or enable outbound webhook delivery.

## Source Reliability

- Normalized retrieval keys deduplicate network acquisition while preserving independent policy comparisons.
- Persisted scan runs distinguish selected policy records, unique source acquisitions, network attempts and deduplicated work.
- Structured retrieval causes and remediation issues replace interpretation of free-text failures as operational state.
- Canonical policy URLs remain separate from optional official retrieval mirrors or PDF locations.
- Historical archive references remain dated context and are excluded from baseline creation and change detection.
- A successful first retrieval can establish or promote an exact-hash baseline without creating a change event, score or notification.
- The Hostinger baseline-repair command is dry-run-first and requires an explicit `--apply` flag.

## Receiver Conformance Lab

- `/api/v1/webhook-conformance-suite` publishes eight deterministic positive and negative fixtures.
- The browser-local runner reports expected and actual verification decisions and exports bounded JSON results.
- The suite covers the documented receiver decision codes without accepting production secrets or contacting a receiver endpoint.
- Passing the suite is a compatibility result for the published fixtures, not implementation certification or a service guarantee.

## Admin UI and module consistency

- Admin navigation is grouped by Overview, Monitor, Assure, Govern, Registry and Outreach responsibilities.
- Dashboard metrics include a Source Reliability summary without making optional reliability tables a login dependency.
- The dedicated console exposes publication coverage, withheld records, unique retrieval keys, remediation state and scan runs.
- Empty states explain the evidence boundary and expose the next authorized operational action.
- Metric cards, action layout and table regions were checked at desktop and 390-pixel mobile viewports.
- Table regions are keyboard focusable and retain explicit captions; screenshots do not establish assistive-technology or WCAG conformance.

Visual audit evidence is stored outside the deployment package under `artifacts/qa/admin-ui-audit-beta21/`; the comparison captures used during implementation remain under `artifacts/qa/admin-ui-audit-beta20/`.

## Deployment and data boundary

- Migration `20260730043000_source_reliability` is additive.
- The release ZIP excludes SQLite files, environment files, generated runtimes, test sources and private audit artifacts.
- Existing production databases must be backed up before deployment.
- Review `npm run db:repair-public-baselines` before any explicit `-- --apply` run, then run a complete source scan.
- The repair promotes only exact snapshots supported by successful source logs and does not infer missing evidence.

## Verification record

- Complete Vitest suite: 89 test files and 485 tests passed.
- TypeScript validation and `git diff --check` passed.
- ESLint completed with zero errors; one warning remains in an unrelated untracked storytelling utility excluded from the release package.
- Production build completed with 130 generated routes/pages, including the protected Source Reliability console and public receiver conformance endpoint.
- The read-only source inventory audit completed against the local SQLite database and confirmed 50 withheld policies, 49 unique retrieval keys and no eligible local public baseline.
- The dry-run baseline repair changed no rows and retained every local record privately because matching successful source evidence was absent.
- The production-dependency advisory scan reported no known advisories at the time of the release check; this is not a claim that the application has no vulnerabilities.
- Final archive verification extracts the package, validates required entries and rejects databases, environment files, secrets, caches, test sources and path traversal.

## Residual limitations

- A source can still be unavailable, blocked, changed in structure or legally restricted after a successful scan.
- Source reliability is operational telemetry, not a provider authenticity or completeness certification.
- The public surface remains empty when no policy has exact current evidence eligible for publication.
- The conformance suite does not provide endpoint registration, subscriptions, production secret custody, push delivery, retries, replay storage, key rotation or delivery receipts.
