# PolicyWatcher 5.5.0 publication: 2 November 2026

The official website now identifies product **5.5.0** and prominently introduces the separate **Engine 6.0 Preview**. The user's existing browser tab was reloaded and its changelog opened: it displays “Latest published release · 5.5.0 · STABLE” and the new Engine 6 features and boundaries. Homepage, roadmap, Feature Atlas, Site Atlas, newsroom/archive, API/feed metadata and current EN/IT PDF fact sheets are aligned. Historical releases remain archived.

## Exact publication

- Public source: `ae3da73866f6638d096fb9a00e313a45c2b55389`, branch `codex/release-5-5-public`, based on the previously deployed stable scanner `d846a498988aaa22ce1bb955aba347e9d186463f`.
- Final ZIP SHA-256: `163cf12e831d2d5bc2ad688d82ef4551ae56b4f2fae9c215d1f748efff9a6344`. Clean source, 1,332 archive entries, CRC check passed, no database or private environment files. The first unpromoted archive remains preserved; r2 corrects the machine-readable release link.
- Staging: Completed / Current at **04:28 Europe/Rome**, deployment `01a19a4b-959e-72af-aad0-25b50c55f757`. All **11 operational checks**, **49 release checks** and **474 sitemap destinations** passed.
- Production: identical ZIP, Completed / Current at **04:33 Europe/Rome**, deployment `01a19a50-2ed3-71ce-bdaf-6b3d5d0f0c9f`. All **49 release checks** and **595 sitemap destinations** passed. **30 source-file hashes** matched the artifact on each environment. Counts differ because the two databases have different public inventories.
- Production health and schema are intact: 18 companies, 35 application tables, 19 migrations and SQLite quick-check OK. Nine internal verification checks passed; the aggregate remains `attention` solely because the independent security test is external. No pentest is claimed.

## Public scanner and private Engine 6

The public release retains the established scanner, schema and dependency versions. Engine 6 remains in the separate authenticated staging workspace with publication and subscriber notifications disabled. The source integration (`d58cae7`, PR #41) preserves Engine 6 on main and separates its compiled private distribution channel from the public product number. Existing missing-flag, invalid-context and pre-migration regression tests still enforce the private boundary after the product label becomes 5.5.

The stable public branch's extraction-profile digest changes because its older generator hashes the lockfile's root package version. The newer main extraction profile stays unchanged; its implementation manifest changes with release metadata and the explicit distribution guard. Neither result is a new parser qualification, and no frozen cohort was edited or reattributed.

## Validation and retained failures

The public candidate passed **1,313 tests, 14 skipped**, lint and an optimized build. Main integration passed **1,569 tests, 14 skipped**, lint and an optimized build. The 49 local page checks passed over 116 fixture sitemap destinations. Both PDF fact sheets were rendered and visually inspected; their deployed bytes match the local artifacts.

Original logs remain under `output/release-5.5.0`: the initial stable profile check was stale after the version edit; one old release-date assertion then failed and was corrected. Local API verification initially lacked the test proxy identity; it passed after binding the isolated local server to loopback with a dedicated test header. Initial main tests exposed a stale generated Prisma client, old metadata expectations, and the previous coupling between preview access and release numbering. Regenerating the client, updating expectations and adding the independent distribution guard resolved them before publication of the source integration. All earlier failures and successful reruns are retained, rather than replaced with passing summaries.

## Preview restoration and remaining qualification

The exact hosted Preview archive `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26` was restored after the public promotion, Completed / Current at **04:38 Europe/Rome**, deployment `01a19a54-ac6f-718d-b16c-97faac66be99`. Its implementation remains `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`. All **12 read-only restoration checks** passed; the saved comparison report remains completed, private and silent. Full-row digests of all **12 observed tables** match the before snapshot. There are 113 policies, one run, eight tasks, three reviews, two artifacts and zero outbox events; no active task was interrupted.

This release adds **zero captures and zero counted daily windows**. Source completeness, three live dates across at least 48 elapsed hours, continuous worker availability and 500 distinct daily live sources remain unqualified. The frozen table-escaping cohort, older observations and the hosted Preview are distinct candidates.

[Machine-readable receipt](policywatcher-5.5.0-publication-2026-11-02.json) · [Official release](https://policywatcher.online/press-kit/releases/engine-six-preview-5-5-0) · [Private Preview](https://staging.policywatcher.online/admin/engine)
