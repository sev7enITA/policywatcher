# Engine 6 daily diary publication, 2 November 2026

The bilingual public diary now records the first live window of the frozen table-escaping candidate: **12/12 HTTP 200, day 1 of 3**, with completeness and realistic 500-source capacity still unqualified. [Capture receipt](engine-v6-daily-2026-11-02.md). The earlier parser's two dates remain separate.

## Exact public artifact and delivery

- Product remains **PolicyWatcher 5.5.0**, with the established scanner, **35 application tables and 19 migrations**.
- Source: `d6e06a42acc823cbd113a0796ff5887935cf8852` on the stable public line.
- Archive SHA-256: `71674cbeca61b4d1d0063aa9e784d3536ee2311e2080335a11b8ccaf768ae951`.
- Compared with the morning 5.5 archive, only `src/app/engine-6-preview/page.tsx` and `release-manifest.json` changed among 1,044 package files.
- Staging completed at **2026-11-02 21:28 Europe/Rome**, deployment `01a19df0-9ffd-7221-be76-194e705fa202`.
- Production completed at **2026-11-02 22:32 Europe/Rome**, deployment `01a19e2b-a92d-730d-b840-86a8be775335`, using the same staging-verified archive.
- [PR #42](https://github.com/sev7enITA/policywatcher/pull/42) integrated the observation report and diary into main as `9b680f9ad87cd02c48044561b05a2b901c2aa957`; all six GitHub checks passed. This source integration did not deploy Engine 6.

## Executed checks and retained failures

Scoped ESLint and the stable production build passed. The 18 bilingual diary checks passed locally, in staging and in production. Staging passed all 11 required operational checks; staging and production each matched all 30 inspected source hashes. The production runtime retained its stable schema and passed its internal readiness checks. The readiness endpoint retains status `attention` because the independent security check remains external: nine internal checks passed, zero internal attention or unavailable results, one external check. The strict helper therefore exited 1; that result is retained rather than rewritten as ready. No pentest is claimed.

The initial staging HTTP check failed under Node's default address-family selection. Both its failed report and the successful retry with `--no-network-family-autoselection` are retained. Subsequent browser uploads to production and for Preview restoration were interrupted while Hostinger logged repeated network fetch failures. No production deployment was submitted by those failed uploads. After connectivity returned, the exact private Preview was restored first, and the immutable verified diary was then uploaded and promoted. These retries add no daily observations.

The public diary was also visually verified in an independent browser, displaying the current day-1 row and its limits. Vivaldi returned blank screenshots while exposing the correct DOM and visible styles. That symptom did not reproduce in the independent browser; its cause remains unestablished. Both the blank captures and the successful screenshot are retained locally, with a digest in the JSON receipt.

## Private Preview preservation

The exact private Preview archive `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26` was restored at **2026-11-02 22:25 Europe/Rome**, deployment `01a19e24-a62b-7175-b313-b4804b4bc4fa`. All **12 restoration checks** passed. The HTTP process and worker retained implementation `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`; the saved completed report remained readable, publication stayed disabled, and the run remained observe/silent.

Full-row hashes of all **12 monitored tables** matched their pre-maintenance values. This invariant covers the recorded policy/evidence/engine tables, not worker lease metadata or administrative access logs. There were no new scans or source captures. The temporary staging maintenance interval does not establish continuous Preview availability.

## Remaining qualification

The current frozen cohort has one accepted live date and zero within-cohort span hours. AWS PDF language and source completeness remain unverified. The automation retains the actual 48-hour guard: the third window must not start before **4 November 21:03:43 Europe/Rome**. Source annotation and 500-source live capacity remain separate open work.

[Machine-readable delivery receipt](engine-v6-diary-publication-2026-11-02.json) contains checks, digests and retained failure summaries. Raw configuration, databases and source bodies are excluded from Git.
