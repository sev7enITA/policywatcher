# Adaptive acquisition evidence

Native TypeScript evidence and bounded-replay workflow inspired by Harness2. It uses the current PolicyWatcher extractor and source/content guards. It does not import or execute the upstream Python agent harness, train a model or install recipes automatically.

## Baseline and private capture

`ScrapeResult.outcome` separates transport, extraction, scope, scraper quality, currency and comparison eligibility. `changeConfirmation` remains `not_evaluated`. These observed dimensions are not calibrated confidence or a publication decision. Complete live, partial and historical strategy counts remain separate. An archived baseline result remains unchanged but is ineligible for adaptive comparison.

`onRawCapture` is opt-in. It records the existing transport's decoded extractor input without a second fetch. Direct and archive inputs are tagged `decoded_document_html`: official PDFs have already been converted to inert HTML by the current baseline transport. Rendered input is tagged `rendered_dom`. Legacy `response_html` corpus records remain verifiable. These records are not original PDF or wire bytes. Captures are immutable and content-addressed, limited to 5 MB, and stored outside the checkout with private permissions. The callback's failure cannot replace the baseline result. Raw inputs never become public scrape-response fields.

The current PDF decoder, extraction-profile evidence, strict section boundaries, lineage and cron contracts remain in place. Explicit same-host locale changes are rejected by the existing path-drift gate; absent URL hints remain unknown and URL hints do not establish legal jurisdiction.

## Frozen replay

A corpus has independent source/version groups, reserved train/holdout splits and explicit acceptance/required/forbidden labels. Duplicate bodies and related groups across splits are rejected. `provisional_captures` never qualify as validated evidence. `reviewed_captures` is an operator trust boundary, not a cryptographic reviewer identity.

Recipes contain one bounded CSS root selector plus origin/path/language/jurisdiction scope. They cannot run commands, fetch content or change validators. Original transport, URLs, block/soft-404 detection, language and completeness are checked before selecting a candidate root. Strict missing/incomplete fragments and truncation findings cannot be hidden by a selector.

The fixed gate requires two independent training groups and three held-out groups, including two positive and one negative held-out groups, improvements in both splits, no regression and no remaining in-scope labelled failures. Other baseline failures remain visible but do not veto an unrelated scoped candidate. Outcomes are `insufficient_evidence`, `keep_current` or `recommend_shadow`. Even `recommend_shadow` only authorizes review of the evidence, not live promotion. Limits are 200 cases and 20 recipes. Replay is not a hard CPU sandbox for untrusted experiments.

Receipts fingerprint the corpus, rules, source code and dependency lockfile. The CLI also fingerprints runtime dependency entries. Current baseline fingerprints include PDF conversion, extraction profile/generated profile and locale guards. Lessons resolve a trusted receipt, verify referenced cases/recipe/scope, derive all scoped support and counterexamples, and expire within 30 days. `operationalEligible` always remains false.

## Optional shadow

The shadow session has an exact allowlist, at most 100 observation attempts and at most three recipes per observation. It reserves budget before concurrent requests, reuses the same acquisition and returns baseline output. Partial, fallback, unmatched and baseline-disagreement evidence remains explicitly distinguished. It never uses an archive as a live observation.

The cron integration persists only summary counters under `ScanRun.metricsJson.scrapingShadow`. Configuration is loaded once per scan. Shadow is **disabled by default**. An absent configuration yields `disabled`; invalid configuration, inaccessible private storage or unavailable source fingerprints yields `configuration_error` while retaining the baseline scraper. To prepare a separately authorized activation, review the example configuration and exact targets, use private absolute config/output paths outside the checkout, and set `POLICYWATCHER_SCRAPING_SHADOW_CONFIG`. Removing that variable disables the observer on the next scan. No recipe-promotion flag exists.

`finish()` stops observation admission, drains pending observations and saves one immutable summary, including concurrent calls. The failed-scan path preserves completed shadow evidence and the original exception. Summary-write failures are separate from observation errors. These drains and filesystem operations have no independent CPU deadline.

The protected Source Reliability page exposes a read-only run selector and diagnostic summary to administrators and auditors. It separates scan outcome from observer mode, handles missing/invalid/partial historical metrics explicitly, and counts recipe comparisons rather than sources. No raw body, private path or raw error is rendered. Zero observations do not imply validation.

## Offline validation and CLI

Use a checkout without a production `.env`, with lockfile dependencies and a generated Prisma client. These commands do not activate the observer:

```sh
node node_modules/vitest/vitest.mjs run --config evals/scraping/shadow.vitest.config.ts
node node_modules/vitest/vitest.mjs run --config evals/scraping/cron.vitest.config.ts
node node_modules/typescript/bin/tsc -p evals/scraping/shadow.tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p evals/scraping/cron.tsconfig.json --noEmit
node --import tsx scripts/scraping-replay.ts --out /absolute/private/replay-output
```

Capture and shadow CLI commands perform real network acquisition and require a separately authorized operator invocation:

```sh
node --import tsx scripts/scraping-capture.ts --url https://example.com/privacy --out /absolute/private/captures --language en --jurisdiction EU
node --import tsx scripts/scraping-shadow.ts --config /absolute/private/shadow-config.json
```

Only synthetic corpus data ships in this directory. Private pilot captures and receipts are not release assets. Current integration results and limits are recorded in the release validation report, not inferred from historical pilot results. See [the disposable SQLite rehearsal](CRON-REHEARSAL.md) for the controlled cron boundary.
