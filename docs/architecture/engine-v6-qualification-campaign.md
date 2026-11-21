# Engine 6 qualification campaign

Owner authorization, 31 October 2026: qualify source completeness, observations over multiple days, and realistic capacity up to 500 policies/day; delegate independent checks to GLM-5.3 Max and Gemini 4 High; keep Git and the public website updated with measured work in progress. This does not automatically activate Engine 6 publication.

## Current evidence boundary

Implementation checkpoint `ec736c2`, evidence checkpoint `8b27951`. There are 1,437 passing tests, 14 skipped; 118 focused engine/audit tests. Twelve public sources were retrieved in several windows on 31 October and replayed under the final parser. Those are one daily window, not several days. A separate 500-record/four-process crash test used synthetic sources. No complete provider contracts, 500 distinct Internet source workload, or production model accuracy has been qualified.

## Work packages

1. **Source completeness.** Preserve source bytes, retrieval metadata, scope, language and parser version. Build an occurrence-aware evidence audit and a source-by-source adjudication ledger with policy content, interface content, unresolved content and unavailable content kept separate. Record critical clauses, headings, terminal text, disclosures, exclusions, fragments and PDF limitations. Comparison to DOM text is only a diagnostic; an absent upstream clause cannot be discovered from that DOM. Independent model findings need local verification. No contract is approved from length, HTTP 200, a model answer or an automatically generated expected-text list.
2. **Daily campaign.** Freeze the corpus and code/profile identity. Count at most one eligible window per Europe/Rome date, with at least 20 actual elapsed hours between counted windows and at least 48 hours from first to last for every source. Require three observed dates, preserve failures and retries, and never replace a failed attempt with a success-only record. Replays and 304s are not fresh source observations. Code or corpus changes require a new live cohort; explicitly comparable replay is reported separately and never supplies missing live days. Three successful windows establish only a bounded three-day observation, not weekly variability or complete qualification. Record available Date/Age/cache metadata; a fresh request and HTTP 200 do not prove fresh origin bytes. A scheduled run must be quiet when unchanged and notify only actionable failures, material progress or completion.
3. **Capacity.** Inventory actual distinct public sources, then run bounded real retrieval with per-origin pacing, timeouts, retry/backoff and explicit network/storage budgets. Measure attempts, completeness holds, queue age, wall time, p50/p95, bytes, peak resource use and model costs where actual inference is involved. A 500-work-item replay is useful but must never be reported as 500 distinct live policies. The current public catalogue previously had 113 policies; verify current inventory before deciding the live denominator. Test storage growth/restore and use an isolated database/runtime. Production database/public baselines/notifications stay outside the experiment.

## Delegated checks

- Gemini 4 High: adversarial source-completeness and daily-window methodology; identify concrete ways the evidence could falsely report a complete source or a qualified multi-day campaign, propose falsifiable acceptance criteria.
- GLM-5.3 Max: independent runtime/capacity and persistence review against the frozen code and planned runner; identify concrete measurement, retry, budget, denominator and recovery defects. Read-only review; no credentials, production mutations, deployment or unsupervised network scans.
- Codex: implement and execute isolated tests, adjudicate findings against source and observations, commit evidence, publish truthful website progress and arrange the next real daily observations.

## Activation and progress reporting

Keep implementation, observed results, reviewer opinions and pending qualification distinct. Missing dates remain pending. Unannotated or unresolved sources remain held. The public notebook should show timestamp, source commit, corpus size, actual completed daily windows, measured test/scale scope and explicit limitations. Preserve earlier evidence and update the progress record only from verified outputs. A new paid service, infrastructure purchase, production Engine 6 activation or publication of policy changes is not part of this campaign's implicit authorization.

## Archived KPI replay in Preview

The read-only command below evaluates retrospective proposals against an archived cohort. It writes a JSON report to stdout and requires no database connection. Snapshot identity, edition and publication eligibility come from the independently prepared cohort. Keep the digest of the original cohort when comparing runs.

```sh
npm run --silent engine:retro-review -- cohort.json archive.json proposals.json decisions.json "$FROZEN_COHORT_SHA256" > report.json
```

The cohort has schema `pw-retro-kpi-1` and an `analyses` array with one row per historical analysis. Each row contains `changeId`, `snapshotId`, `sha256`, `source` and `values`. The source contains `edition`, integer `version` and boolean `publicEvidence`, or is null if the source is unverified. Include all 15 catalogue fields in `values`, preserving the original string or null. The denominator is the number of analyses times 15. Existing values outside the field’s allowed vocabulary are reported separately.

The archive is a JSON object mapping each SHA-256 digest to its UTF-8 source text. Keep any non-public source material inside its authorised environment. Each proposal includes `changeId`, `field`, `snapshotId`, `sha256`, `version`, `edition`, `value`, `reviewer` and `quotes`. Each quote contains literal `text` and Unicode code-point offsets `start` and `end` (exclusive). The reviewer identifier should come from the model receipt or authenticated operator record held by the caller.

On the first pass, supply an empty array for decisions. An eligible proposal yields a `proposalHash`. A separate reviewer checks that the cited clause supports the proposed value for this edition, recipient and purpose, and records `{proposalHash, reviewer, verdict, reason}`. Use `supported`, `unsupported` or `uncertain` for the verdict. On replay, each cell with one independently supported value contributes once to projected coverage. Conflicting approved values leave the cell unresolved. The report preserves the digests of all four inputs for comparison and audit. A passing coverage result measures the number of values meeting these checks. Semantic accuracy of historical values and operating capacity require their own qualification.


To locate candidate passages before sending material for review, run:

```sh
npm run --silent engine:retro-candidates -- cohort.json archive.json "$FROZEN_COHORT_SHA256" > passages.json
```

The command scans each verified version with English and Italian clause vocabulary. It returns up to four distinct, ranked passages for each unassessed or out-of-catalogue field. Each passage carries its exact position in the source. An empty shortlist describes the search result. Reviewers can inspect the full original version when different terminology, context across paragraphs or an incorporated document is material. Prior to external review, select public records and omit internal identifiers unless needed. Withheld sources never contribute text to the shortlist.
