# Google table passage recovery and live acquisition, 16 November 2026

## Root cause and correction

All fourteen previously unmatched references occur in Google privacy-policy table cells, seven in English and seven in Italian. Their characters survived extraction. Cheerio's text collection joined adjacent paragraph and list blocks without a separator, producing words such as `servicesExamples`. Unicode token comparison therefore rejected the original passage boundaries.

The candidate clones each table cell, inserts separators at block elements and line breaks, then normalizes whitespace and escapes backslashes and pipes in the existing order. Inline spans retain their word continuity. This applies to both supported table traversal modes. The shared scraper change creates a new engine implementation identity in the [run context](engine-v6-google-passages-2026-11-16/run-context.json).

## Offline verification

The [original packet](engine-v6-evidence-fixes-2026-11-16/manifest.json) remains preserved. Its eight HTTP payload hashes and 1,060 passage sequences, DOM locators and passage hashes are fixed. The [candidate packet](engine-v6-google-passages-2026-11-16/manifest.json) applies the new extractor to exactly those bodies. It recovers all fourteen Google references, with **1,060/1,060 matches** and zero lost reference matches. Two empty reference scopes and two earlier HTTP 403 responses retain their original limits.

The extraction hash also changes for Plaid, whose selected reference scope is empty. This packet cannot assess that source's completeness. No claim of source-wide completeness follows from a matching paragraph count. The historical live 812/812 sample remains separate.

The regression fails twice against the original scraper, once per traversal mode. After the fix, all 58 targeted scraper tests pass, including escaping, empty cells, repeated negative values, spans, block separation and inline word continuity. Those tests also pass with operating-system network access denied. Node replay and an independent Python implementation both reproduce the new packet with network access denied.

Run from the repository root, with project dependencies already installed for the Vitest command:

```sh
node scripts/reconciliation/passages.mjs docs/reports/engine-v6-google-passages-2026-11-16/passages.json.gz
python3 docs/reports/engine-v6-google-passages-2026-11-16/replay-independent.py
npx --no-install vitest run src/lib/__tests__/scraperTableEvidence.test.ts src/lib/__tests__/scraper.test.ts
```

On macOS, prefix each command with `sandbox-exec -p '(version 1)(allow default)(deny network*)'` to reproduce the network restriction. The [independent result](engine-v6-google-passages-2026-11-16/offline-independent.json) records every source denominator. Regeneration from the original private HTTP bodies uses `scripts/reconciliation/compare-extraction.ts`; public replay requires only the saved packet and manifest.

## Real workload

The [public inventory](engine-v6-google-passages-2026-11-16/catalogue.json) retrieved at 13:32 UTC contains 110 policy records across 18 companies, 106 distinct retrieval scopes and 101 HTTP endpoints. This is a fresh observation. It supersedes the earlier inventory for this run.

A separate [frozen 500-scope selection](engine-v6-google-passages-2026-11-16/real-500-catalogue.json) combines the current unique URLs with public Open Terms Archive declaration metadata. Selection follows declaration filename and term-type order, accepts HTTPS string fetch URLs, deduplicates exact retrieval URLs and stops at 500. It includes 495 HTTP endpoints across 199 canonical origin groups. Open Terms Archive Contributors retain attribution and the declaration repository's EUPL-1.2 license. These are candidate workload inputs, with unreviewed source contracts. Declaration selectors and custom filters are not imported into PolicyWatcher's extractor.

The local acquisition campaign uses three workers, one active request per origin, 1.5-second pacing and a 30-minute deadline. Direct transport can fall back once to HTTP/2. An origin returning 429 or 503 is held for the remaining run. Missing, rejected and held results are retained. The isolated run invokes real source HTTP requests and candidate extraction. It does not perform model inference or qualify daily end-to-end processing on the intended VPS. A completed endpoint count measures processed attempts, including failures.

The [completed real trial](engine-v6-google-passages-2026-11-16/real-500-live.json) processed all 495 endpoint records in 463.390 seconds. Across 578 HTTP attempts, 413 endpoints returned an accepted live HTTP 200 and 380 source scopes completed extraction. All 500 scopes are accounted for. There were 78 transport-rejected scopes, 27 extraction-size holds, 11 block-page or soft-404 holds and four origin-backoff holds. These 120 unsuccessful scopes are retained. The endpoint p50 was 623 ms and p95 3,635 ms, measured with the harness's floor-index percentile convention.

The [current catalogue run](engine-v6-google-passages-2026-11-16/current-catalogue-live.json) separately completed 101 endpoints in 95.275 seconds, retrieved 100 and extracted 104 of 106 scopes. Its record count is 110. Neither acquisition run measures semantic verification, 500 successful policy completions, persistence/recovery of 500 pipeline tasks, 24-hour reliability or capacity on the VPS.

The first GitHub build rejected the stale generated extraction profile. The profile and engine manifest were regenerated after the live run, producing a distinct final candidate identity. Re-extracting the original eight bodies with the repaired profile reproduced the candidate packet byte for byte. Both identities and the failed CI run are retained in the run context. The completed live trial remains attributed to its executing candidate.

## Independent review and delivery

GLM-5.3 Max returned a peak-hours resource refusal. GLM-5.3-Flash then required human security verification. The request remains pending at that checkpoint. Neither attempt supplies a review verdict.

The public stable diary update and the exact private r3 restoration require their own staging and production receipts. Preparation or a Git merge alone does not establish publication.
