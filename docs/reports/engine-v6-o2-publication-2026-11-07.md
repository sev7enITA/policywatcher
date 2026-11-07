# O2 public notebook: delivery receipt, 7 November 2026

**Published and verified at 22:24 Europe/Rome.** The bilingual notebook now records the O2 assessment, its counterexamples and the remaining prerequisites. PolicyWatcher remains stable 5.5.0 on the official domain. Private Engine 6 r3 was restored before production publication. This content delivery does not qualify completeness, live semantic accuracy or 500 fully processed policies per day.

## Delivery chain

| Step | Hostinger deployment | Completed Europe/Rome | Verified checks |
| --- | --- | --- | --- |
| Stable content on staging | `01a1b7d9-d2a5-72e6-afc1-f3a255ffbcb3` | 22:13 | 11 operational, 51 bilingual content, 37 source hashes |
| Exact private r3 restoration | `01a1b7df-b1da-7063-aad1-a8990e93af8e` | 22:20 | 14 authenticated checks, three saved private reports |
| Same stable content on production | `01a1b7e4-07f6-705c-a6f9-f6304a5a33b4` | 22:24 | 9 internal runtime, 51 bilingual content, 37 source hashes |

The production Italian validation section was also opened and visually inspected: all three O2 entries and the assessment link were present. Content source: `0a6c5a5352d36cc716f0bd71638a6ce93eabf73c`. Archive SHA-256: `2a21f86ba96321db00d917ea67c630446ea39e81d59896027e37b3ac901023f5`. Only `src/app/engine-6-preview/page.tsx` and `release-manifest.json` differ from the preceding public package. The archive contains 1,335 entries. Production retains 35 application tables, 19 migrations and healthy integrity. All 39 production environment fields match the reviewed candidate.

The restored r3 archive SHA-256 is `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`; its implementation is `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00`. All 36 original environment fields match. The private database has 47 application tables and 22 migrations. Before/after hashes are identical for 46 of 48 tables including the migration ledger; only `AdminAccessLog` and `EngineOrigin` changed. The three saved reports remain completed, private and observe/silent; no tasks are active. Publication and notifications remain disabled. No hosted scan, inference or observation day was added. Temporary staging maintenance does not demonstrate uninterrupted Preview availability.

## Assessment boundaries

[PR #55](https://github.com/sev7enITA/policywatcher/pull/55) retains the [immutable O2 assessment](https://github.com/sev7enITA/policywatcher/blob/a6ae28a62e62d38bd73e165d16ddfa602b1bc828/docs/reports/engine-v6-o2-2026-11-07.md), protocol, diagnostics and Gemini / GLM advisory reviews. All six CI checks passed on `a6ae28a62e62d38bd73e165d16ddfa602b1bc828`. The 120 baseline tests and five new ledger controls use local fixtures and injected model outputs. Four of six incomplete-document counterexamples pass the current contract; an integral external annex is not acquired by the tested parent-document path. Six authored false claims with exact quotations pass structural validation. These observations do not establish live model error rates.

The hosted preflight counted 113 policies, one source contract and empty claim/evidence tables. No analyst/verifier model or Gemini API key was present in the inspected deployment configuration; this does not prove absence from every possible process environment or account. Existing free web sessions supplied review, not runtime API inference. A reviewed source-reference corpus and a verified free runtime model route remain prerequisites. The full 500-policy daily processing trial was not run or qualified. No paid usage or purchase occurred.

[PR #54](https://github.com/sev7enITA/policywatcher/pull/54) contains the public notebook update; six checks passed on content commit `c361226d536a51367e0ac9531bea9ed8a3c1708e`. Both PRs remain open and unmerged at this receipt. Website delivery and Git integration are separate states. This receipt is a subsequent documentation-only change.

## Retained failures and evidence

The first local checkout build included an ignored historical experiment and failed TypeScript checking. Building the exact packaged archive in an isolated directory passed without source changes. An early staging smoke check reached the previous private application during compilation (307/401); an early restoration check likewise ran before completion and failed the private API boundary. Both failures are retained separately from the completed checks. Production verification remains `attention` only because independent security assessment is `external`; all nine internal checks passed. This is not a pentest. No new IndexNow submission or indexing result is claimed.

The [machine-readable receipt](engine-v6-o2-publication-2026-11-07.json) records delivery identities and evidence hashes. Raw evidence and screenshots are retained in `output/o2-diary-20261107`; private configuration and databases are excluded from Git. Frozen candidate `050af19` and the hosted r3 implementation remain unchanged.
