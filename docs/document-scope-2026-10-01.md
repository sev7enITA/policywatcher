# Document scope contract

Prepared release 4.0.0-beta.5. Not yet deployed.

The document type filter is global to the interactive dashboard and its connected analyses. Supported inventory types: privacy, terms, ai, dpa, aup, community. No selection means the historical default of all documents only when the URL parameter is absent; an explicit empty or unknown API scope is rejected. The UI always requires at least one type.

Policies are filtered before company risk/search/date predicates and before server pagination or aggregation. A company with no selected public policy remains visible with incomplete coverage, unless another explicit company filter excludes it. Completely withheld companies remain represented in the source-suspension inventory, never with fabricated scores.

Coverage distinguishes available baselines from types with a public scored analysis. This does not certify complete KPI coverage, applicability, legal compliance or confidence. KPI availability is separately measured on canonical values. Missing, baseline-only and unknown values are not zero risk.

Overall score: mean within each document type, mean across types, then equal weight per company. For an explicit subset, the dashboard mean includes only companies with scored analyses for every requested type. The denominator is displayed. All-document mode is an exploratory overview with varying coverage, explicitly labelled. Company cards still describe their named featured policy, not an invented combined narrative.

Comparison exposes per-type results and coverage. The radar requires complete type coverage for both profiles. Users can narrow the comparison to a single type from the global selection. Industry benchmarks exclude the selected company and require complete selected-type coverage; an empty cohort remains unassessed. KPI matrix cells retain the documented most-concerning-value aggregation, with per-type views and coverage per row; consensus excludes incomplete type coverage and unassessed KPI values.

The same scope reaches evidence status, suspended sources, market pulse, full policy-change timeline, comparison, KPI matrix and AI context. AI replies disclose the number of policy documents actually included versus available, including the existing 20-document context cap. The region selector retains its existing impact-context semantics; this change does not reinterpret it as a jurisdiction-source filter.

CSV rows include DocumentType and unassessed baseline rows; the manifest includes selected types, per-company coverage and view identity. Companies without a selected public document have coverage entries without fabricated policy rows. Scope survives share links, browser navigation and reset.

Public landing-page knowledge counts, external reference pages, subscriptions and administrative scan scope remain separately labelled surfaces; selecting dashboard document types does not reconfigure subscriptions or scans.

Validation: 50 tests passed on a sanitized, repaired SQLite fixture; one scan-mutating test intentionally skipped for that fixture (already verified in the preceding repair task). TypeScript and production build passed. Compiled API smoke checked privacy, privacy+terms, DPA, community with no public baseline, all documents, and invalid scopes. Browser DOM verified privacy-only, multi-select, all reset, company coverage, incomplete-comparison gating, single-type comparison and matrix, and a 390px selector without horizontal overflow. Original TermsGate restored byte-for-byte after a local component harness. Screenshot capture and browser download-event capture timed out; CSV construction/contents verified by tests, not by a downloaded file. ESLint unavailable in recovered production source because no ESLint configuration is present.

No database migration or production data mutation is needed for this feature. Publish the immutable candidate through the existing Hostinger staging/promotion process after authenticated hPanel access is available.

## Integrated GitHub release verification

The release branch is based on GitHub main, preserving repository-only checks and prior deployed source improvements. The restored full suite passes 1,117 tests (one mutating scan fixture test intentionally skipped); web lint and production build pass. Methodology, both atlases, release impact, roadmap, newsroom and changelog share the Beta 5 contract. The final per-route register is in `docs/reports/release-coherence-2026-10-01/README.md`. This supersedes the earlier recovered-source limitation about missing lint configuration.
