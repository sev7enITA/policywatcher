# Public Preview r3 discovery update: delivery receipt, 7 November 2026

**Published and verified on the official domain at 18:06 Europe/Rome.** The public product remains 5.5.0 with the established scanner. The new research announcement is visibly separate from the 2 November stable release, including in the Italian changelog modal. The new Italian newsroom article was opened through its link. This delivery changes public content and discovery metadata; it does not activate Engine 6 on production.

## Exact delivery chain

| Step | Hostinger deployment | Completed Europe/Rome | Evidence |
| --- | --- | --- | --- |
| Stable content on staging | `01a1b6be-30f4-7190-882d-b441f6f2b05a` | 17:03 | 11 operational checks, 43 bilingual content assertions, 37 source hashes |
| Exact private r3 restoration | `01a1b6f1-e1bb-7397-bd0b-335912dd7b36` | 18:00 | 14 authenticated checks; 47 tables / 22 migrations; all three saved reports preserved |
| Same stable content on production | `01a1b6f7-8380-73c9-a97d-3172e8eed730` | 18:06 | 9 internal runtime checks, 43 bilingual assertions, 37 source hashes, 665 sitemap pages |

Content source: `9b18f5569205da7e682d0681c47cc9535e75e6d8`. The exact archive was used in staging and production: SHA-256 `e3ee594d19ac57310b633a5b7213b3aa83b61779110b6cc01f54c3a28841f962`. Sixteen files changed and three were added relative to the prior public package; scanner and schema files are unchanged. All 39 production environment fields matched the reviewed candidate. Only the release checksum, verified-staging checksum and verification timestamp differ from the prior production configuration.

The restored private r3 archive remains `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`, implementation `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00`. All 36 environment fields matched the original snapshot. Across the fresh before/after snapshots, 46 of 48 tables (including the migration ledger) have identical row hashes. Only administrative access logging and worker-origin coordination changed. All three completed observe/silent reports are retained, no tasks are active, claim tables remain empty and publication/notifications are disabled. No scan was requested. Temporary staging maintenance is not uninterrupted Preview availability.

## Discovery, review and limits

The full live sitemap audit passed **665 URLs**, with no failed checks or duplicate titles. The local empty-database audit's 168 URLs remain a separate denominator. Four canonical notebook/research URLs (EN/IT) were submitted to IndexNow at 17:08:55 UTC, response HTTP 200. This acknowledges submission only, not indexing, ranking, search traffic or AI citations.

GLM-5.3 Max and Gemini 4 Argon High supplied advisory reviews, retained and adjudicated in the [implementation report](engine-v6-public-discovery-2026-11-07.md). No paid model usage or service purchase occurred. Promotional drafts remain unpublished. The [maturity assessment](engine-v6-maturity-2026-11-07.md) distinguishes measured benefits from O2 qualification gaps.

Retained failures: initial staging homepage HTTP 503; first staging content-check timeout; initial isolated-build attempts; Mac lock delaying restoration; two IndexNow selections rejected by local canonical/indexability checks before submission (root URL, then the noncanonical newsroom path). The final validated four-URL submission is separate. The production verifier reports overall `attention` solely because independent security assessment is `external`; all nine internal checks pass. This is not a pentest.

[PR #54](https://github.com/sev7enITA/policywatcher/pull/54) remains open. Six GitHub checks passed on `4ede1142ffde2d3aff189eddf4e60eb4452ba934`; this receipt and maturity synthesis follow as documentation-only changes. Source integration and website publication are separate states. Frozen candidate 050af19, its completed temporal cohort, and the private r3 engine code are unchanged. No qualification days were added.

The [machine-readable receipt](engine-v6-public-discovery-publication-2026-11-07.json) records identities and evidence digests. Raw evidence is retained locally under `output/seo-preview-r3-20261107`; private configuration and database copies are excluded from Git.
