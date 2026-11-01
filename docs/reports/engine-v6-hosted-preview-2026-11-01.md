# Engine 6 private hosted preview qualification, 1 November 2026

The owner selected a separate online preview. This checkpoint implements `6.0.0-preview.1`; the stable public service remains 5.2.0. Hosting deployment is still pending at this checkpoint. Local production-mode tests and model reviews do not establish online availability.

The candidate has a private gateway, a fresh dedicated database, an immutable implementation manifest and a supervised Node worker with durable leadership. Preview and comparison are observation-only and silent. Stable scans, scheduler entrypoints, unrelated mutations and outbox delivery are unavailable in this environment. See the [operating boundary](../architecture/engine-v6-hosted-preview.md).

## Executed evidence

- Full automated suite: **1,536 passed, 14 skipped**. Earlier failed runs remain preserved, including release-metadata inconsistencies subsequently corrected.
- Optimized production build completed without consuming two persisted queued/blocked tasks. The first managed-wrapper rehearsal correctly rejected a local path lacking the staging naming convention; the subsequent local Next production build used the explicit build-worker exclusion. Actual managed-host build remains a separate verification.
- Candidate 2: **44 HTTP/worker checks passed**, including anonymous page/API/RSC/prefetch isolation, authenticated access, matching HTTP/worker identity, denied mutation paths, a real Apple acquisition, private same-capture extraction comparison and recovery after a real process crash.
- The Apple response was HTTP 200 and eligible under one bounded Codex-assisted source contract. Preview extracted 28,124 characters and the stable extractor 2,089 from the same capture. This is extractor divergence, not a policy change or proof of complete upstream source coverage. Outcome: `confirmation_pending`; no AI analysis or publication was performed.
- Crash/restart testing preserved queued work and the previous report, and waited for actual leadership expiry. The crash was after the live capture had completed; this does not claim interruption and recovery of a network request in progress.
- Full-row digests for policy baselines, public history, official check logs, source contracts and notification/subscriber state remained unchanged by the tested preview runs.
- Actual production runtime without `src` or `scripts`: **18 checks passed**. HTTP/worker identity matched the bundled manifest. Removing the opt-in flag retained private access while disabling execution. A first harness text expectation was corrected; its failure remains retained.

## Independent reviews and corrections

Gemini was consulted through its web interface with the selector showing **Argon Alta**. Its review emphasized shared-hosting contention, managed-process survival without HTTP traffic, source pacing, authentication/cookie isolation and storage hygiene. These are opinions and acceptance criteria, not executed tests. A fresh allowlist database avoids copying deleted private records from a production database; independent infrastructure isolation and long-term retention remain unqualified.

GLM-5.3 Max reviewed two immutable candidates in ZCode Plan mode, without executing tests. Candidate 1 raised a conditional privacy blocker and a worker renewal availability defect. Candidate 2 adds immutable preview privacy plus a pre-migration build guard, and bounded renewal retries for infrastructure errors only. Identity/lease/context failures stop immediately; an expired lease is never revived. GLM reported both findings closed and no concrete regression, explicitly retaining the need for deployment evidence.

## Corpus and remaining limits

The new database contains 18 company definitions, 113 configured policies, 110 prior public baseline texts and one bounded source contract. All other application tables started empty. Apple HTML is an explicitly recorded preview-only retrieval override; production and the frozen daily cohort are unchanged. [Source review and bootstrap](engine-v6-preview-source-review-2026-11-01.md).

The daily cohort still has 12 sources, two counted dates and 20.77 actual hours, below the 48-hour requirement. Source completeness, operation over several days and capacity for 500 distinct sources remain unqualified. The preview shares a hosting account with the stable service and has logical data separation, not an independent infrastructure security boundary.

Machine-readable results and local artifact hashes: [qualification receipt](engine-v6-hosted-preview-2026-11-01.json). Earlier candidate results and failures are retained separately and are not relabelled as candidate 2 evidence.
