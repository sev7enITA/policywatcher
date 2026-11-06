# Engine 6 QA diary published, 6 November 2026

The [bilingual public diary](https://policywatcher.online/engine-6-preview?lang=it#validation) was published at **09:39 Europe/Rome on 6 November**, deployment `01a1b001-899b-715e-b819-e3405271c558`. It now presents the bounded 500-endpoint trial, independent Apple browser comparison, source-contract counterexamples and private administrative execution. **Source completeness, semantic accuracy and full 500 policies/day remain unqualified.**

## Exact stable artifact and verification

The public product remains **5.5.0**, with its established scanner, 35 application tables, 19 migrations and 18 companies. Only `src/app/engine-6-preview/page.tsx` and `release-manifest.json` differ among 1,044 package files. Source: `3e58c6d8ebbbdab23c4ec0b248d922aaf44b3967`. Archive SHA-256: `ee2cf2f9663b304685e236155305493e5976459e95a7736a5e0f0b5a3a024e6b`.

The same archive passed staging at **08:32 Europe/Rome**, deployment `01a1afc4-35c3-7365-b877-f55550990f1a`: eleven operational checks, 32 EN/IT page checks and 30 source hash comparisons. All 32 page checks and 30 source hashes also passed in production. Nine internal production checks passed, health and database integrity are correct. The independent security assessment remains external; the strict verifier's exit 1 and overall `attention` status are retained. No pentest is claimed.

## Private Preview preserved

The original r2 archive was restored before public deployment, as `01a1afd0-8966-72c3-a4e1-db6dfd02ca7f`. Thirteen read-only checks passed, including both saved reports. All twelve monitored table hashes and release metadata match the fresh pre-maintenance snapshot, which includes the authorised morning QA run. Both the old and new reports remain completed, private and observe/silent; zero tasks are active, and publication and notifications stay disabled.

Preview archive `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26` and implementation `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88` remain unchanged. Delivery added no scan or temporal day. Temporary staging maintenance does not prove uninterrupted availability.

## Visual and delivery history

Fresh canonical navigation in the independent browser displayed the new 6 November sections; screenshot and DOM digests are retained. The already-open identical URL initially showed the previous page, so a fresh navigation was verified rather than assuming the browser refreshed. No specific cache-layer cause is asserted.

The earlier [staging/restoration receipt](engine-v6-diary-staging-2026-11-06.md) remains as a dated record of the production-pending stage. Native file-selection corrections, environment-import behaviour, Mac locking, browser interference and the initial local build failure are preserved in the [machine-readable final receipt](engine-v6-diary-publication-2026-11-06.json). The [QA evidence](https://github.com/sev7enITA/policywatcher/pull/49) was already integrated into main with six checks passed. This delivery does not activate Engine 6 on the public service or modify the frozen cohort.
