# Engine 6 preview: continuing qualification, 31 October 2026

Status: local experimental engine. This record extends the initial verification at commit `6a9c91e`; it does not qualify activation in production. Public website announcement and engine runtime are separate artifacts.

## First bounded real-source probe

Twelve official public endpoints were requested sequentially with direct transport and a bounded HTTP/2 fallback. All twelve returned HTTP 200 and produced extractable text. This is **transport/extraction coverage of a small corpus**, not evidence that twelve complete policies have been validated. No AI, renderer, subscriber delivery, production database or public baseline was used.

The committed corpus is `evals/engine-v6/acquisition-corpus.json`; `scripts/engine-acquisition-probe.ts` requires an isolated database/output directory and publication/notifications disabled. Local payloads, timing, validators and hashes are in `output/engine-qualification-2026-10-31/capture-1/`. For PDF, the saved transport payload is the existing decoder's HTML representation, not the original PDF bytes.

Offline replay of the **same saved payloads** exposed and corrected extraction loss:

| Source | Initial characters | Corrected characters | Observation |
| --- | ---: | ---: | --- |
| Apple Privacy | 2,089 | 28,492 | Twelve explicitly controlled collapsed panels retained |
| Stripe restricted businesses | 25,465 | 25,505 | Actual document heading recovered |
| Stripe Privacy IT | 94,144 | 94,173 | Actual document heading recovered |
| Anthropic terms | 36,075 | 36,211 | Document header retained; ambiguous header metadata now holds the source |

Google EN/IT captures expose unresolved hidden DOM and are held for source-specific review. AWS DPA PDF produces text but lacks sufficient structure/language for the new contract gates; TikTok's nonsemantic page title also needs a reviewed source adapter. A heading, a large text count or HTTP 200 alone does not prove completeness. No complete provider contracts or independently annotated ground truth are claimed here.

## Extractor changes and adversarial review

Gemini 4 High / Argon Alta and GLM-5.3 Max are actual external reviews through the user's applications, not internal substitutes. GLM reviewed a frozen disclosure candidate and found concrete risks of silent omission and UI overinclusion. The subsequent candidate adds:

- Diagnostics for missing/ambiguous disclosure targets, unverified controls/scope, substantial unresolved hidden content and unreviewed document-header metadata.
- A hard `assessCapture` gate for new captures, conditional representations and baseline replay approval.
- Semantic link disclosures; known consent-dialog/cookie chrome exclusion; header attribute preservation; no synthetic SEO title or bare brand-heading restoration.
- Duplicate-ID checks before removing UI chrome, so sanitizing the DOM cannot erase ambiguity.
- Regression scenarios for the risks above. The extraction profile includes both transformation and assessment, with `pretest` and `prebuild` freshness checks.

These are conservative safeguards. Generic extraction cannot identify every arbitrary nonsemantic UI fragment or short hidden legal clause. Reviewed source contracts, provider-specific adapters and annotated completeness checks remain necessary; uncertain cases may be held more often. The second frozen GLM review confirmed those closures and identified the operational need for source-specific resolution. An exact, reviewed DOM-exclusion route was then implemented; the third review exposed historical replay and headed-dialog dead ends. Candidate 4 added the explicitly confirmed rebaseline route and exact dialog-heading acknowledgement. GLM confirmed R1/R2 closed and found no new P1 regression in that focused scope. The accepted operational limits (zero-match held, possible absorption of a real change during deliberate rebaseline, and no dedicated withdrawal action) are stated in the runbook and UI. See `docs/architecture/engine-source-review-runbook.md`. Test-only transports were also corrected to satisfy the complete `TransportResult` type.

## Verification checkpoint

- Full regression suite: **1,383 passed, 14 skipped** (191 files passed, 3 skipped).
- Focused suite: **64 passed**, consisting of 57 Engine 6 tests and 7 audit regressions.
- Web TypeScript and production compilation passed; critical-test TypeScript passed after the fixture-type correction.
- Lint has no errors; the existing 15 web warnings remain.
- A separate four-process, 500-policy synthetic concurrency/crash probe passed: 1,000/1,000 tasks completed in 330.4 seconds, zero remaining reservations, public policy mutations, changes or outbox deliveries. All four processes exited successfully; SQLite integrity is `ok`. An actual SIGKILL was followed by natural five-minute lease expiry and a completed second attempt. The scheduling/store code was unchanged by the later extraction-rule extension.

The public preview page deliberately records the earlier initial checkpoint (1,369/14, including 43 engine tests), rather than presenting an unfinished live experiment as a final qualification.

## Website publication boundary

The announcement has English/Italian architecture, decision-flow and entity-relationship diagrams, text alternatives, full-size SVG links, and an accessible horizontally scrolling entity table. Gemini's independent design verdict was PASS; recommended refinements were applied. Desktop rendering and a 390px DOM/layout check passed; the automated mobile screenshot capture was unreliable and is not evidence of an actual-device visual test.

The deployment candidate is based on the currently deployed source `6780e993519d40759eacf4cdcffa7aad1467cc93`, with only 16 content/navigation/SEO files changed. No Engine 6 runtime or migration is included. The content source is isolated on `codex/engine6-preview-announcement`. Staging completed at 07:54 CET; all 11 release checks and 10 announcement-specific checks passed. The exact ZIP SHA-256 is `81c8e19aea4fb701340b316fefad1507805e503978b1e5683c626ba3d3f2af07`, source `1837889a7951dd6f060230f5dbadf6efdf820f76`. Promotion records the owner’s explicit website-publication instruction from this chat. Production completed at 08:07 CET (2m39s). All 11 announcement-specific checks passed on the public origin. The authenticated operational panel reports 9 passed, 0 attention checks, 0 unavailable, and 1 external requirement for an independent dynamic security test; its aggregate status remains `attention` for that separately unperformed external test. SQLite integrity, 35 application tables and 19 migrations are confirmed. SSH readback confirms the exact source revision, no Engine runtime directory and no Engine tables.

Before deployment, the production SQLite online-backup API produced a consistent backup; a separate restored copy passed integrity checking. It contains 18 companies, 113 policies, 118 changes and 242 snapshots; no Engine tables. The schema count includes 35 application tables plus two internal bookkeeping tables. No source database was overwritten. A second immediate backup at 08:03 CET had the same content checksum, confirming no intervening evidence-data change before this deployment.

## Additional local administrative execution

A fresh, isolated one-policy fixture on loopback port 3020 exercised the actual compiled interface and authenticated API. Selecting the policy loaded its complete contract, including pinned exclusions and retained size bounds. Invalid exclusion JSON showed an actionable error without modifying the saved contract. The ordinary approval button stayed disabled for `parser_upgrade_rebaseline_required`; the dedicated request required a substantive rationale. After clicking, database readback confirmed one audit record, `rebaseline_requested`, the original baseline hash and single snapshot preserved, zero PolicyChange and zero outbox entries. A separate automated integration test demonstrates that the first new capture is insufficient and the second confirmed capture establishes a baseline without AI or a provider-change event. Those fixture timestamps are synthetic and do not substitute for real observation windows.

## Public announcement and Git checkpoints

The live page is <https://policywatcher.online/engine-6-preview?lang=it> (English without the query). Homepage, product footer, roadmap and sitemap link to the announcement. The page clearly distinguishes local implementation, recorded verification and pending real-world qualification. Public source branch `codex/engine6-preview-announcement` ends at `1837889`; local engine checkpoints include `6a9c91e`, `1a2cdef`, `dfbd1be` and `2d1428d`. Later qualification work is committed separately. Git commits are local; no engine activation or remote branch publication is implied.

## Remaining activation evidence

At least three complete daily windows on an annotated source corpus, a workload representing up to 500 policies/day, real model/independent-verifier runtime receipts and costs, PDF/source-contract qualification, live false-change/unsupported-claim measurements, storage/retention capacity and operational restore qualification remain open. PostgreSQL execution is not qualified by SQLite tests. The preview remains disabled in production.
