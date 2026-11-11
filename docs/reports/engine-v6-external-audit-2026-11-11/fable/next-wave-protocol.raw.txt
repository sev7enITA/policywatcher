# Engine 6 — proposed next-wave protocol (free-only)

Prepared 11 November 2026 by Claude Fable 5.2 as part of the external QA/QC audit. **Nothing here was executed.** Every experiment is a proposal that needs the owner's authorisation before it runs. Finding IDs (N01…, G01…) refer to `audit.md` and `findings.json`.

## 1. Ground rules for every experiment

1. **Immutable candidate.** Record source commit and implementation hash before and after. Experiments on r3 use `84085328…9a00` unchanged. Any code fix creates r4 with its own hash; r3 results never transfer.
2. **Frozen plan, embedded hash.** The plan (corpus, expectations, budgets, stop rules) is committed first. The harness carries the plan's SHA-256 as a constant and refuses to run on mismatch. This closes the gap where the wave-2 hash was only checked externally.
3. **Independent oracle.** Expected outcomes are written by someone who did not write the harness or the engine, before the run, and are not shown to the models.
4. **Denominators fixed in advance and asserted.** The harness asserts case counts at start and derives explicit outcome labels at the end. A missing outcome is a named category, never a silent gap.
5. **Exit status means success.** The process exits non-zero unless every predeclared acceptance condition holds. "Completed" is reported separately from "passed".
6. **No rerun-to-green.** Each case runs once per plan. A failed wave is retained and a new plan gets a new identifier.
7. **Isolation.** New SQLite file under `output/`, publication and notifications `0`, no hosted system, no real subscriber data. Network allow-list per experiment.
8. **Free tier only.** Confirm the tier in the provider console before each inference day and record it. Stop on any 429 or 403. No billing change, no paid fallback.
9. **Quota bound per day, stated per experiment,** counting failed attempts as spent until the provider console shows otherwise.
10. **Receipts.** Request body, non-secret request headers, response status, response headers, body, and three timestamps: SDK call, first byte, completion. Redact only the credential.
11. **Pacing outside the timeout.** Wait before calling the SDK, never inside the transport (N02).

## 2. Sequence at a glance

| Step | Purpose | Candidate | Inference | Closes |
| --- | --- | --- | --- | --- |
| E1 | Confirm how the SDK applies the timeout | r3, read-only | none | N01 (part) |
| E2 | Separate deadline, model latency and overload on the verifier route | r3 request shape, external harness | ≤ 6 verifier calls/day | N01, G08 |
| E3 | Fault-injection map of worker behaviour | r3 | none | N03, N04, N05, G13 |
| E4 | Independent completeness references | r3 as baseline, r4 for the fix | none | G02, G03, G05, G06 |
| E5 | High-impact routing against the taxonomy | r3 as baseline, r4 for the fix | none | N07, G11 |
| E6 | Blind-labelled semantic trial | the candidate that passed E2–E5 | ≤ 18 verifier calls/day | G07, G09, G10, G12 |
| E7 | One real end-to-end workflow, real clock, hosted guard path | same candidate | ≤ 2 pairs | G13, G14, G15, N14 |
| E8 | Backup and restore drill | same candidate | none | G16, N17, N18 |
| E9 | 500/day qualification | qualified candidate on the intended host | measured | G17, G18 |

E1–E5 and E8 cost no model quota and can start first. E6 must not start until E2 shows a verifier route that returns verdicts. E9 must not start until E2–E8 are closed.

## 3. Experiments

### E1 — Timeout handling, read-only

- **Question.** Does the pinned `@google/genai` 2.17.1 send the client timeout to the server, and does it retry?
- **Method.** With owner authorisation, read the installed package source under `node_modules/@google/genai`. No calls.
- **Oracle.** The source text itself.
- **Acceptance.** A written answer with file and line for: the timeout header, the abort timer, and default retry behaviour.
- **Quota.** Zero.
- **Why first.** My web lookup of the upstream source says the header is sent and retries are off by default. That is second-hand and must be confirmed on the installed bytes.

### E2 — Verifier route diagnosis

A configuration diagnostic, not an accuracy trial. Verdict text is recorded but excluded from every accuracy denominator, because these fixtures are already known to the project.

- **Question.** Why did 9 of 12 verifier calls expire near 118 seconds?
- **Corpus, frozen.** Two verifier request bodies taken byte-for-byte from retained receipts: `semantic/http-002.json` (negative, about 760 tokens) and `semantic/http-016.json` (analyst pair).
- **Arms.** Each arm sends both bodies once, so six calls in total.
  - **A — r3-identical.** Same model, same generation settings, 120 s client timeout.
  - **B — longer deadline only.** As A, 300 s client timeout.
  - **C — bounded reasoning only.** As A, plus the provider's documented setting that limits the model's reasoning budget. Look the parameter name up in current provider documentation first; do not guess it.
- **Order and pacing.** A, B, C interleaved across the two bodies; at least 60 s between calls, applied before the SDK call.
- **Stop rules.** Any 429 or 403 stops the day. Two consecutive 503 responses stop the day; resume no sooner than the next calendar day under the same plan, without repeating completed calls.
- **Quota bound.** 6 verifier generations on a day with a 20-request allowance.
- **Predeclared readings.**

| Observation | Reading |
| --- | --- |
| A expires near 118 s, B returns after more than 120 s | Latency exceeds r3's deadline; the timeout is a product parameter to redesign |
| A expires, C returns well under 120 s | Unbounded reasoning drives latency; a candidate change to evaluate |
| A, B and C all expire or return 503 | Route not usable on this tier at this time; record and stop, do not escalate |
| A returns | The 9 November behaviour was time-dependent; repeat the same plan on a second day before concluding |

- **Acceptance for "route diagnosed".** Each arm has two receipts, and exactly one row of the table applies on two separate days. Otherwise the result is "undetermined".
- **Not allowed.** Changing r3, treating any arm's verdict as accuracy evidence, or adopting arm B or C as production settings. Those would be r4 decisions.

### E3 — Fault-injection map of the worker (no inference)

- **Question.** What durable state does r3 reach under each failure, and how many model calls does it make?
- **Method.** Isolated SQLite, synthetic transport, injected analysis provider that counts calls. One scenario per fresh database.
- **Scenarios and predeclared expectations from code reading.** A mismatch in either direction is a finding.

| # | Injection | Expected on r3 (from `audit.md`) |
| --- | --- | --- |
| 1 | Analyst returns a truncated output (`finishReason` not `STOP`) | 3 attempts, task `failed`, no review row, candidate kept (N04) |
| 2 | Analyst returns invalid JSON | Same as 1, `lastError = engine_processing_error` (N05) |
| 3 | Verifier throws a 429-shaped error with a retry delay | Retried after 2 and 4 minutes regardless of the delay (N06) |
| 4 | Verifier throws three times, then the next day's run | A second analyst call on day 2 for the same text (N03) |
| 5 | High-impact hold, then two further daily cycles with unchanged source | One analyst and one verifier call per cycle; pending review superseded each time (N03) |
| 6 | Observe-mode commit, then two further daily cycles | One pair per cycle; duplicate ledger claim sets (N03) |
| 7 | More than 2,000 block edits between versions | `comparison_budget_exceeded`, retried, no review (N04) |
| 8 | Process killed between analyst success and verifier call | After lease expiry the verifier runs once; no second analyst call |
| 9 | Lease expires during the verifier call; second worker claims | Exactly one commit; late writer rejected |
| 10 | `publish()` fails with `public_old_snapshot_missing` | Task `failed`, zero ledger rows, analysis only in checkpoint (G14) |

- **Time.** Scenarios 4–6 need days to pass. Either wait in real time, or advance the stored timers and label the run "synthetic clock" in every output, as wave 2 did.
- **Oracle.** The table above, frozen before the run; reviewed by a person who did not write the harness.
- **Acceptance.** All ten scenarios produce a recorded state and call count. The experiment "passes" as a measurement when every row is filled; it does not certify the behaviour as desirable.
- **Output feeds r4.** Required properties for the next candidate, each with a test: no repeat analysis of an already-analysed candidate hash; deterministic failures become holds with a review row; provider status and retry delay persisted.

### E4 — Independent completeness references (no inference)

- **Question.** Can a contract plus reference manifest detect the four known omission classes and the annex dependency, on real documents?
- **Corpus.** A small set of real policies chosen by the owner to cover: plain HTML, disclosure/accordion page, table-heavy page, page with an integral linked annex, PDF, Italian-language page. I suggest starting with 10 to 12; the number is the owner's call, since each costs reviewer time.
- **Oracle.** For each document, a person other than the engine and harness authors opens the official page in a browser, expands every disclosure, and records an occurrence-aware inventory: ordered leaf units with section path, repeated occurrences counted, table cells with row and column headers, annex links with target hash. A second person spot-checks a declared sample. The Apple 81/81 exercise is the model for this.
- **Method.** Capture once per document, store the bytes, then run the r3 extractor offline on the stored bytes and compare against the inventory. Then derive ten mutated captures per document (drop a middle unit, drop one repeated occurrence, drop a table row, empty a section, remove the annex) and record whether r3's contract holds them.
- **Denominators.** Units expected, units found in order, units missing, units extra; per mutation: held or passed.
- **Acceptance for r3.** None expected; this measures the baseline. The retained falsifiers predict that most mutations pass.
- **Acceptance for r4 (owner to approve).** Every mutated capture is held, and every unmutated capture has zero missing units against its inventory. I recommend "every", not a percentage: each escaped mutation is a concrete undetected omission, and the corpus is small enough to inspect each one.
- **Isolation.** One capture per source, polite pacing, no hosted system.

### E5 — High-impact routing against the product taxonomy (no inference)

- **Question.** Which sensitive changes reach publication without mandatory review?
- **Corpus.** Authored old/new pairs, at least two English and two Italian per category, for the six taxonomy keys in `src/lib/provisionTaxonomy.ts` plus governing law, account termination, children's data and price or renewal terms. Written by a domain reviewer, including the ordinary phrasings a company would use ("governed by the laws of", "we may terminate").
- **Method.** Build a structurally valid claim for each pair with impact fixed at 5, run `validateClaims`, record `highImpact`.
- **Oracle.** The domain reviewer's list of categories that must always be reviewed. This is threshold decision 1 in `audit.md` §7 and must exist before the run.
- **Acceptance for r4.** Every pair in a must-review category yields `highImpact=true`, independent of the model's score.

### E6 — Blind-labelled semantic trial (bounded inference)

Precondition: E2 has identified a verifier route that returns verdicts, on a declared candidate.

- **Corpus.** New cases, never used before. Positives: real or realistic changes with a reference description. Negatives: exact-quote claims that are false, across negation, condition scope, date role, table row scope, EN/IT divergence, unsupported inference, and injected instructions aimed at the verifier as well as the analyst. Include subtle negatives, not only blatant ones.
- **Oracle.** Two annotators label each claim supported, unsupported or uncertain without seeing model output. A third person adjudicates disagreements. Annotator agreement is reported.
- **Budget.** At most 18 verifier generations per day against the dated allowance of 20, leaving two spare. At that rate 60 claims take four days and 300 take seventeen.
- **Outcome labels, derived by the harness.** For negatives: `rejected`, `abstained`, `falsely_supported`, `no_verdict`, `malformed`. For positives: `supported`, `abstained`, `falsely_rejected`, `no_verdict`, `malformed`. `no_verdict` is never merged into another label.
- **Stop rule for safety.** One `falsely_supported` on a negative in a must-review category stops the trial for analysis.
- **Reporting.** Counts with exact binomial intervals, not point percentages. For orientation only: zero false acceptances in 59 negatives bounds the true rate below about 5% at 95% confidence; zero in 299 bounds it below about 1%. These are properties of sample size, not proposed gates.
- **Thresholds.** The tolerated false-acceptance bound and the tolerated abstention level are owner and domain-reviewer decisions (items 2 and 3 in `audit.md` §7), fixed before the run.

### E7 — One real workflow on the hosted guard path

- **Question.** Does one change travel from capture to ledger with real elapsed confirmation time, live models and the hosted-preview guards active?
- **Method.** Local production-mode rehearsal using the database path the guard already permits (`output/engine-channels/hosted-preview/preview.db`, see `src/lib/hostedPreview.ts:24`), with the hosted-preview flag set. Authored HTML through a controlled transport. No timer rewind: wait the real 60 minutes. Let the worker run its own retries to completion or exhaustion.
- **Budget.** Two analyst/verifier pairs at most.
- **Acceptance.** The task reaches `observed_change_ready`; ledger rows exist with a verifier verdict; policy, snapshots and baseline are field-for-field unchanged; zero public changes and outbox rows; the worker status shows a single leader throughout. Each is asserted by the harness.
- **If the verifier fails.** Record the terminal state reached after the worker's own retries. That is a valid result for G13.

### E8 — Backup and restore drill (no inference)

- **Method.** On a lab database populated by E3 and E7: export while a worker is processing; decrypt; restore into an empty database using a restore tool written for the drill (outside the implementation closure); compare per-table row counts and per-row content hashes with the source at a recorded instant.
- **Also measure.** Export duration, peak memory, file size, and database growth per simulated day with realistic page sizes.
- **Acceptance.** Restored tables equal the source at one consistent instant, including `EngineClaim` and `EngineClaimEvidence`; every restored ledger span still equals the slice of a restored document. A mismatch caused by the non-transactional export is the expected r3 finding (N17).
- **PostgreSQL.** Keep separate. Migration and rehearsal checks are portability evidence only.

## 4. What must be true before E9

1. A verifier route that returns verdicts on a declared candidate (E2), and a semantic trial on blind labels with results the owner accepts (E6).
2. A candidate with no repeat-analysis and no retry loop on deterministic failures (E3 properties), or a written decision to accept and budget for them.
3. Completeness references for the catalogue (E4 method), with dependencies declared.
4. High-impact routing aligned to an approved category list (E5).
5. A restore that has actually been performed (E8).
6. On the intended host: 500 reviewed identities loaded, contracts installed, model configuration present, and a declared way to enqueue work. With r3 this means ten or more manual batches of 50 per day; anything automatic is a new candidate.

## 5. A realistic 500 policies/day qualification

### 5.1 What "500/day" can honestly mean

Three different claims, never to be merged:

- **Monitored:** 500 identities attempted and accounted for each day.
- **Analysed:** the subset with a confirmed change that received analyst and verifier output.
- **Published or review-ready:** the subset that cleared every gate.

Under the dated free quotas (500 analyst and 20 verifier requests per day), "500 verified changes per day" is impossible by arithmetic. "500 monitored per day with a bounded number of verified changes" may be feasible. Whether it is depends on numbers nobody has measured yet.

### 5.2 Verifier demand, as a formula

Let **n** be new confirmed changes per day, **s** the number of policies whose change is still unresolved from earlier days, **r** the average verifier attempts per changed policy.

- On r3: daily verifier demand ≈ (n + s) × r, because standing changes are re-analysed (N03) and each task may try three times.
- On a candidate that analyses each candidate text once: demand ≈ n × r.

The run is feasible only if demand stays under the daily allowance with margin. Illustration with invented numbers, to show sensitivity and nothing else: if 1% of 500 policies changed each day, n would be 5; on r3 in observe mode s would grow by about 5 per day, so demand would pass 20 around the fourth day. The real n is unknown and must come from Phase A.

### 5.3 Phase A — prevalence and cost, no model calls

- **Duration.** Seven consecutive days is my suggestion, to cover one weekly cycle. The owner sets it.
- **Catalogue.** The frozen 500 identities, with contracts.
- **Method.** Daily observe-mode runs with the model configuration deliberately absent. Record for every identity the acquisition outcome, contract result and whether the text differs from baseline and re-confirms.
- **Known side effect on r3.** A confirmed change with no model configuration ends as a failed task with `analysis_model_configuration_required`. Count those tasks as "confirmed changed"; do not read them as engine faults.
- **Outputs.** n per day and its spread; share eligible, held and failed by reason; transport mix; per-stage latency; origin back-offs; database growth per day; worker restarts.
- **Decision rule.** If measured n × r exceeds the verifier allowance on a typical day, stop. State the supportable scope instead ("500 monitored, at most K analysed per day, oldest unverified change X days") or wait for a different free allowance. Do not start Phase B hoping it fits.

### 5.4 Phase B — the qualifying window

- **Frozen before day 1.** Candidate hash; host and its resource limits; the 500 identities with contract and dependency manifest hashes; the reviewer who approved them; model pair; quotas observed that morning; operating procedure for enqueueing; all thresholds from §6.
- **Duration.** Consecutive real days, no synthetic clock. I suggest at least seven; the owner decides.
- **Daily accounting.** Every identity lands in exactly one terminal category per day, and the categories sum to 500. The harness asserts the sum.

| Category | Meaning |
| --- | --- |
| not attempted | with reason: origin held, run limit, worker down |
| acquisition failed | transport or extraction, with reason |
| contract held | captured but ineligible, with reasons |
| unchanged, fresh | full response, hash equals baseline |
| unchanged, revalidated | 304 against a verified representation |
| changed, awaiting confirmation | first sighting |
| changed, confirmed, awaiting analysis | backlog, with age |
| structurally held | analyst output rejected by validators |
| verifier: unsupported or uncertain | held |
| verifier: no verdict | with provider status |
| high-impact held | awaiting human review |
| observed change ready / published | cleared every gate |
| failed terminally | with reason |

- **Invariants, asserted daily.** Sum equals 500. No identity finalised twice. Zero public effects in observe mode. No ledger claim set duplicated for the same policy and candidate text. Every `supported` verdict traces to receipts for both models.
- **Measured, not gated without a decision.** Backlog age distribution; time from first sighting to cleared; generations and tokens per model per day against the console's figures; retries; peak memory; database size; time to recover after a restart.
- **Declared disturbances.** On one predeclared day, restart the managed process mid-run. On another, pause scans for a declared interval. Record recovery; nothing may be lost or duplicated.
- **Sampling for truth.** Each day a reviewer checks a predeclared random sample of "unchanged" identities against the live page and every "cleared" change against its sources. Without this, the window measures throughput, not correctness.
- **Result wording.** Report the three claims of §5.1 separately, with every held and failed identity still in the denominator.

### 5.5 What must not be done

- Multiplying a small run, replaying stored responses, or counting the 6 November Mac probe.
- Reusing observations from `050af19`, r2 or any candidate other than the one under test.
- Counting a day in which the worker was manually nudged outside the declared procedure.
- Dropping identities that fail, or replacing them mid-window.

## 6. Thresholds: who decides, and what I would propose

| # | Decision | Decider | My proposal and reason |
| --- | --- | --- | --- |
| 1 | Categories that always need human review | Owner with a legal or privacy reviewer | At least the six taxonomy keys plus governing law, termination, children's data and pricing. The product already names six of them as its subject matter. |
| 2 | Tolerated `supported` verdicts on labelled-false claims | Owner and domain reviewer | Zero observed, reported with its confidence bound. One is a published falsehood; a percentage would hide it. |
| 3 | Tolerated abstention on true claims | Owner | Decide from reviewer capacity: every abstention is a manual review. No universal number is defensible. |
| 4 | Maximum age of a confirmed, unverified change | Owner | Tie it to the product promise to subscribers. Also revisit the 2-day evidence expiry, which currently forces a new cycle. |
| 5 | Minimum eligible share for a "500/day" label | Owner | Name the number of eligible identities in the claim itself rather than setting a floor. |
| 6 | Completeness acceptance on the reference corpus | Domain reviewer | Zero missing units and every mutation held, on a corpus small enough to inspect case by case. |
| 7 | Storage and memory ceilings | Owner, from hosting limits | Derive from the hosting allowance and Phase A growth, with a stated number of days of headroom. |
| 8 | Approval authority | Owner | Record a personal identity, not the role label. Require a second person for contracts and for high-impact approvals. |
| 9 | Length of Phases A and B | Owner | Seven days each as a starting point, for the weekly cycle. Longer if Phase A shows high day-to-day variation. |

Every proposal above is conditional on the owner's approval. None is an authorised gate.

## 7. Open items this protocol cannot settle

- Whether failed model requests count against the daily allowance. Read it from the provider console during E2.
- Whether any free verifier route is fast enough for this prompt shape. E2 may answer "no"; that is a legitimate end state for the free-only constraint.
- Whether the managed hosting process stays alive without traffic. Only observation on the host answers it.
