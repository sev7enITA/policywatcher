# PolicyWatcher Engine 6 r3 — independent QA/QC audit

Date: 11 November 2026. Auditor: Claude Fable 5.2 (`claude-fable-5-2`), an AI model review requested by the owner. This is not third-party certification, a penetration test or an operational qualification.

Companion files: `findings.json` (machine-readable register, same IDs) and `next-wave-protocol.md` (free-only closure experiments and the 500/day design).

## 1. Executive decision

**O2 stays open. None of its four ordered gates is passed, and r3 should not advance toward O3/O4 on this evidence.**

| O2 gate (protocol of 7 Nov) | Verdict | Basis |
| --- | --- | --- |
| 1. Source completeness | **Failed** for general use | 4 of 6 incomplete documents satisfy the contract; an integral annex is absent while the parent passes |
| 2. Semantic accuracy and control flow | Control flow: supported by injected-provider tests (reported, not re-run here). **Semantic accuracy: unmeasured** | 12 live verifier attempts, 0 verdicts |
| 3. Live model and source prerequisites | **Unmet on the intended host** | Dated preflight: 113 policies, 1 contract, no model configuration. A local free project exists; its verifier route never returned a verdict |
| 4. 500 policies/day | **Not run, and not runnable unattended on the hosted preview with r3 as built** | Scheduler disabled on hosted preview, batches ≤ 50, one active task (N13) |

### What the retained evidence does support

These controls worked in the receipts or are plain in the code. They are narrow, and none is a qualification.

- Exact-span validation rejects any quote that is not a slice of the frozen text (`src/lib/engine/claims.ts:46-51`).
- The table-header rule fired on a real analyst output and blocked it before the verifier (`semantic/analyst-table.json`, reason `table_context_missing`).
- The independent keyword rule forced review of the Italian applicable-law change although the model scored it 5 (`semantic/analyst-italian-risk.json`).
- Observe/silent mode produced zero public changes, outbox rows or baseline writes in the lab database (`integration/report.json`; `before.json` and `after.json` have identical SHA-256).
- Evidence is hash-bound: all 140 inventory files, both evidence-directory inventories (8/8 and 65/65 present files) and the implementation hash recompute correctly.

### Release blockers, in priority order

1. **No semantic verdict exists (N01, G07, G08).** All six deliberately false claims pass every deterministic check. The only barrier against them is a verifier that has never answered.
2. **Completeness contracts admit incomplete documents (G02, G03).** Middle clauses, repeated occurrences, table rows, empty sections and linked annexes are invisible to the contract.
3. **No independent oracle (G09).** Every expectation was authored by the same toolchain that built the harness. There are no human labels.
4. **High-impact routing misses the product's own sensitive categories (N07, N08).** A "Training: No → Yes" default change and a sale/consent change are both `highImpact=false`.
5. **The worker re-analyses standing changes and retries deterministic failures (N03, N04).** These make any capacity or quota measurement on r3 unrepresentative and waste the 20/day verifier quota.
6. **Hosted prerequisites are absent (N13, G01).**
7. **Restore is unproven and backups are not snapshot-consistent (N17).**

Items 1–4 block any accuracy claim. Items 5–7 block any capacity claim. Fixes to 2, 4 and 5 change the implementation closure, so they need a new candidate identity (r4) and fresh affected tests.

## 2. Method, identity and limits of verification

- **Checkout:** `/Users/fabriziodegni/Projects/PolicyWatcher-preview-r3`. Worktree `HEAD` points to `refs/heads/codex/engine6-o2-qualification`, and that ref file contains `c462524d20f5c9d03bac36f7673580f72f09cd74`. I read the ref files directly; I ran no Git command.
- **Hashes:** 140/140 inventory files match. I recomputed the implementation hash from `src/lib/engineImplementation.generated.json` (82 files, each rehashed): `84085328…9a00`, matching. I did not re-derive the import closure, so I cannot confirm the 82-file list is complete.
- **Plan and harness hashes:** `semantic/plan.json` hashes to `d320ef85…e75a`; `scripts/engine-o2-live-wave.ts` to `9fbb15b5…9526`; `scripts/engine-o2-live-integration.ts` to `0c847914…cb1d`. All match the recorded values.
- **Arithmetic re-checked from receipts:** 34 HTTP requests, 17 generations, 8×504 + 2×503 + 1 abort in the wave, plus 1×504 in the integration; 5,442 + 2,908 = 8,350 tokens on the seven successful responses.
- **Tests executed: none.** No repository script, test, build, scan, model call or database query was run. Every statement about test results repeats the retained logs.
- **Status vocabulary used below.** *Measured*: read from a retained receipt. *Confirmed by code*: follows directly from the cited lines; runtime behaviour not observed. *Inferred*: a reasoned consequence that needs a test. *Unmeasured*: no evidence either way. *Disputed*: reviewers disagree and no human has adjudicated.

## 3. Findings that change the picture

### N01 — The verifier failures are bounded by r3's own 120-second deadline

*Timing measured; cause inferred. Class: product configuration plus provider latency, not yet separable.*

The nine HTTP 504 responses did not arrive at scattered times. Eight in the wave completed between 118.08 s and 118.51 s after sending (`semantic/http-002, 004, 010, 012, 020, 024, 030, 034`), and the integration call at 116.8 s (`integration/http-4.json`). All carry `DEADLINE_EXCEEDED`.

r3 creates the SDK client with `httpOptions: { timeout: 120_000 }` (`claims.ts:138`). The public upstream source of the pinned SDK version (`@google/genai` 2.17.1, `package-lock.json:966-967`) forwards that value to the server as an `X-Server-Timeout` header. I checked this with one web lookup of the upstream repository, read through a fetch-and-summarise tool; I did not read the installed package, which is untracked.

So the most economical reading is that the verifier request simply did not finish within the deadline r3 itself asked for. Three facts point the same way:

- The 8 November smoke test took 26.2 s and 139 thinking tokens for a 24-token prompt on the same model (`engine-v6-o2-free-api-2026-11-08.json`).
- r3 sets no thinking configuration and allows 16,000 output tokens (`claims.ts:141-142`).
- The two 503 responses failed fast (2.6 s and 5.2 s) with an explicit high-demand message, a different failure signature.

This does not prove the cause. Free-tier queueing, a model-side stall and the deadline header are not distinguishable from these receipts, because the harness recorded no request headers (N16). The falsifier is cheap: experiment E2 in the protocol.

The consequence for G08: "provider availability" is the wrong default label for 9 of the 12 failures. It is an unresolved interaction between r3's timeout, an unbounded-thinking verifier and free-tier latency.

### N02 — The single AbortError is a harness artifact

*Measured from timestamps. Class: harness defect.*

`http-008` aborted 110.27 s after it was sent, not 120 s. The SDK had started its 120 s timer when it called `fetch`. The harness then held the request for 9.73 s of pacing inside its fetch wrapper (`scripts/engine-o2-live-wave.ts:58-62`), because the previous verifier call had failed fast. Request sent at 16:22:56.238, previous call finished at 16:22:46.505, abort at 16:24:46.511: exactly 120.0 s after the SDK call.

The wave-2 report describes this as a client abort "after the deadline". It is one more deadline expiry, shortened by the harness. Pacing must happen before the SDK call, not inside the transport.

### N03 — Unresolved changes are re-analysed every cycle

*Confirmed by code; runtime unmeasured. Class: product defect.*

Nothing remembers that a given candidate hash was already analysed.

- **Publish mode, held change.** `hold()` clears the candidate (`pipeline.ts:77-79`) and schedules the next attempt a day later (`pipeline.ts:67-69`). The next run finds the same changed text, re-confirms it after 60 minutes (`store.ts:12`), and calls analyst and verifier again. The new hold supersedes the pending review (`pipeline.ts:86-87`). A reviewer's target is replaced roughly every 25 hours, and approval expires 2 days after the observation anyway (`pipeline.ts:367`).
- **Observe mode — the only mode the hosted preview allows.** A completed observe-mode commit does not advance the baseline and does not clear the candidate (`pipeline.ts:287-297`). The next day's capture confirms immediately, and the full analyst/verifier pair runs again. `recordClaimLedger` is idempotent per task, not per content (`claimLedger.ts:42-45`), so the ledger gains a duplicate claim set each day.

Each policy that differs from its public baseline therefore costs one analyst and one verifier generation per day, indefinitely. Verifier demand tracks the *cumulative* number of diverged policies, not new changes per day. Against a dated quota of 20 verifier requests/day, this alone can exhaust the budget within days of starting an observe-mode trial. See the arithmetic in `next-wave-protocol.md` §5.

### N04 — Deterministic failures are retried and never reach a reviewer

*Confirmed by code. Class: product defect.*

Only two error codes become holds: `analysis_context_budget_exceeded` and `analysis_output_budget_exceeded` (`pipeline.ts:310-312`). The output-budget one is practically unreachable: it needs 500,000 characters of output under a 16,000-token cap (`claims.ts:142-144`).

The realistic failure for a large change is `finishReason !== 'STOP'`, raised as `analysis_output_incomplete` (`claims.ts:143`). That goes to `failTask`, which retries three times and then marks the task failed (`store.ts:286-296`). `terminalFailure` writes a state row and, in publish mode, "Needs Review" on the policy, but creates **no `EngineReview`** (`store.ts:266-285`). The candidate is kept, so the same three generations are spent again the next day.

The same path catches a JSON parse error, `comparison_budget_exceeded` (`document.ts:150-151`), `document_size_out_of_bounds` and `artifact_size_limit`. All are deterministic at temperature 0. GLM's "D4" finding is correct in substance; its "60-block" figure is not measured.

### N05 — Provider errors are erased from durable state

*Measured and confirmed by code. Class: product defect (observability).*

`failTask` replaces any error message that is not a short code with `engine_processing_error` (`store.ts:287`). The integration task shows exactly that after the 504 (`integration/report.json`, policy task `lastError`). HTTP status, `Retry-After` and provider status are gone. Engine model calls are also absent from the `AiModelInvocation` telemetry: nothing under `src/lib/engine` references it. Failed-call quota consumption cannot be reconstructed from the database.

### N07 and N08 — High-impact routing is weaker than it looks

*Measured on the wave receipts and confirmed by code. Class: product defect.*

The deterministic rule is one regular expression over quoted source text (`claims.ts:83`). The product's own provision taxonomy has six keys: `ai_training`, `data_sharing`, `retention`, `arbitration`, `content_licensing`, `liability` (`src/lib/provisionTaxonomy.ts:3-10`). The expression covers two of them. Measured consequences:

- "Training | No" → "Training | Yes": model impact 5, `highImpact=false` (`semantic/analyst-table.json`). Had the analyst quoted the header, nothing deterministic would have required review.
- Sale/consent exception: impact 5, `highImpact=false` (`semantic/analyst-negation-exception.json`).
- By reading the expression: English "governed by the laws of …" and "we may terminate your account" do not match; only "governing law", "jurisdiction" and "termination" do.

The model's score cannot carry the gap. Five of six analyst claims scored exactly 5. The same 30→60-day retention change scored 5 in the wave and **7** in the integration run, at temperature 0, on near-identical text (`semantic/analyst-retention.json` vs `integration/analysis.json`). Seven is the review threshold. Two observations are not a rate, but they show the score can cross the routing line for the same fact.

A change that passes with a score below 7 and no keyword is published automatically at "Low" or "Medium", using the analyst's unverified number (`pipeline.ts:216, 223`). The verifier prompt never asks about impact (`claims.ts:161`).

### N09 — The date-role guard passes a false effective-date claim

*Measured. Class: product limitation.*

The guard checks that a date keyword appears somewhere in the quoted spans (`claims.ts:76-81`). The false claim "The effective date changes to October 30, 2026" passed with no structural reasons because its quotes included the unchanged line "Effective date: November 1, 2026" (`semantic/negative-date-role.json`). Phrasings without the keyword ("applies from", "a partire dal") are not checked at all. The guard stops one observed AWS error pattern; it is not a date-role control.

### N13 — The hosted preview cannot run an unattended 500/day with r3

*Confirmed by code plus the dated preflight. Class: missing prerequisite.*

- The scheduler endpoint returns `hosted_preview_scheduler_disabled` on the hosted preview (`src/app/api/cron/check-all/route.ts:1582`).
- Hosted runs are limited to 50 policies (`store.ts:34-38, 43`); 500 needs at least ten manual administrator enqueues per day.
- Only one task may be active at a time (`store.ts:163-169`), and the worker lives inside the HTTP process (`src/instrumentation.ts`). Its lifetime without traffic is an acknowledged unknown (`docs/architecture/engine-v6-hosted-preview.md:48`).
- On 7 November the preview held 113 policies, one contract and no model configuration (`engine-v6-o2-2026-11-07/hosted-preflight.json`).

A genuine 500/day trial needs either a new candidate or an explicitly declared manual operating procedure. The existing test named "plans a full 500-policy daily batch" enqueues 500 rows that share one URL and produce two fetch tasks (`src/lib/__tests__/engineV6.test.ts:563-571`). It is a planning test, not capacity evidence.

### N14 — The live worker diagnostic bypassed the hosted guards

*Confirmed by harness code. Class: harness scope limit, under-disclosed.*

`scripts/engine-o2-live-integration.ts:20` deletes `POLICYWATCHER_HOSTED_PREVIEW`. Leader lease, single-active-task rule and hosted context assertions were therefore not on the path that met a live model. "Real r3 functions" is accurate; "the hosted worker path" would not be.

### N17 and N18 — Backup, restore and growth

*Confirmed by code. Class: missing evidence plus design gap.*

- The export reads 47 tables one after another with no transaction (`src/lib/encryptedBackup.ts:135-143`). Under a running worker the tables are not a consistent snapshot.
- The whole database, including artifacts of up to 12 MB each (`store.ts:13`), is serialised into one in-memory string.
- The payload is marked `restoreMode: 'verification-only'` (`encryptedBackup.ts:151`). The module decrypts and validates table counts; it contains no restore path. I found no evidence of a completed restore.
- The payload records application and inventory version only. It carries no implementation hash, migration identity or database provider.
- Nothing in the engine deletes artifacts, tasks, attempts or reviews. Each capture stores the raw HTML (up to 5 MB). Growth has not been measured.
- The ledger tables are included in the backup inventory. That part of G16 is satisfied.

## 4. Reconciliation of G01–G22

Class codes: **P** product defect or limitation · **A** provider availability · **H** harness defect · **E** missing evidence · **W** working control · **D** documentation.

| ID | My verdict | Status | Class | Key evidence and what I add |
| --- | --- | --- | --- | --- |
| G01 | Upheld, and wider | Confirmed by code | P, E | A contract is one administrator's self-attested JSON with a note of ≥ 10 characters; the stored reviewer is the role label `admin` (`api/admin/engine/route.ts:74-94`). No second reviewer, no attached reference. Language is "verified" from the publisher's `lang` attribute or header, not the text (`acquisition.ts:205`, `document.ts:140`). Jurisdiction is not in the contract at all (`document.ts:78-92`). |
| G02 | Upheld | Measured | P | `boundary-falsifiers.json`: 4 of 6 incomplete documents eligible. `assessDocument` checks title, heading-set inclusion, tail text, length and language hint only (`document.ts:126-143`). It demonstrates an insufficient contract, not an observed extractor omission. |
| G03 | Upheld | Measured | P | `offline-diagnostics.json`, fixture `external-annex`: eligible with the annex absent. The contract schema has no dependency field. The extractor emits no link targets. |
| G04 | Upheld, stronger | Confirmed by code | P | The converter emits only `<p>` inside `<article>`, with no headings and no `lang` (`src/lib/pdfPolicy.ts:13-17`). Every PDF therefore fails identity and sections under the current contract; original bytes and page boundaries are not retained. A safe hold, but PDF sources cannot be qualified by r3. |
| G05 | Upheld, wider | Confirmed by code | P, E | The transport returns `Age` and `Date` (`src/lib/scraper.ts:505-506`); acquisition never reads them. "Independent confirmation" means the same hash twice, 60 minutes apart, from the same host and transport (`pipeline.ts:163-166`). The baseline's transport is not compared with the new capture's, so direct/rendered differences could confirm as a change (inferred). `hidden`-attribute text is retained without a flag; only `aria-hidden` is examined (`acquisition.ts:106-113`). |
| G06 | Upheld | Confirmed by code; model behaviour unmeasured | P, E | The header rule requires only the first row of a contiguous table run (`claims.ts:66-74`). A row-spanning group cell in an earlier row, multi-row headers and headerless tables are unprotected. Nested table rows are flattened into the outer table (`scraper.ts:1675-1689`). The section diagnostic tested a swap; a heading rename with unchanged paragraphs was not tested. |
| G07 | Upheld | Measured | P | Six of six false claims pass structure (`semantic/negative-*.json`). See also N09. |
| G08 | **Reframed** | Timing measured; cause inferred | P, A, H | See N01, N02. Nine deadline expiries near r3's own timeout, two explicit overloads, one harness-shortened abort. The verifier was never shown to work on this prompt shape. |
| G09 | Upheld | Confirmed | E | Corpus self-describes as authored synthetic (`evals/engine-v6/claims-corpus.json`). The returned `modelVersion` equals the requested alias, so receipts cannot detect a silent model revision. The verifier sees the same untrusted text as the analyst, so the errors are correlated by construction. |
| G10 | Disputed; my reading sides with the flag | Disputed | E | The analyst wrote "personal data sales exclude advertising identifiers except when the user consents". That sentence drops "We do not sell personal data" and presupposes that personal-data sales exist. I would label it not faithful enough to publish. This is one more model opinion, not adjudication. EN and IT are mutually equivalent; both share the defect. |
| G11 | Upheld, stronger | Measured and confirmed | P | See N07, N08. |
| G12 | Upheld | Confirmed by code; robustness unmeasured | P, E | Full old and new documents are sent with no truncation (`claims.ts:116-121`). Limits: 4,000,000 characters and 750,000 tokens (`claims.ts:137, 140`), above the observed free input limit of 250,000 tokens/minute. Silent omission of a delta is caught by `change_coverage_incomplete` (`claims.ts:85`), a working control. Truncated output is not safely held (N04). No injection was ever presented to a working verifier. |
| G13 | Upheld, with new defects | Confirmed by code | P, E | N03, N04, N05. Fencing and lease logic read coherently (`store.ts:197-217`), and the retained log reports the fencing tests passing; I did not re-run them. Retry-to-completion with a live model has never been observed. |
| G14 | Partly cleared | Confirmed by code | W, P, E | The commit is one transaction: attempt record, publication, ledger, task completion (`pipeline.ts:287-297`). GLM's static point is correct: if `publish()` throws `public_old_snapshot_missing`, everything rolls back, the task fails terminally with no review and no ledger rows, and the analysis survives only in the task checkpoint. Not reproduced. The 15-second transaction limit (`store.ts:216`) under large payloads on SQLite is unmeasured. Ledger rows have no foreign key to task, policy, review or change. |
| G15 | Largely a working control, with gaps | Confirmed by code | W, E | Hosted context requires the exact database path, a single hard link and explicit `0` flags (`src/lib/hostedPreview.ts:15-41`); claims are restricted to observe runs unless publication is on (`store.ts:154`). Not exercised with a live model (N14). The readiness report does not list the engine model variables or flags (`src/lib/databaseReadiness.ts:85-94`). |
| G16 | Upheld | Confirmed by code | P, E | N17, N18. PostgreSQL readiness reports `ok` integrity and foreign keys as constants (`databaseReadiness.ts:263-267`); migrations are matched by name only. The schema provider is SQLite; PostgreSQL evidence is migration and rehearsal coverage, as the project's own note says. |
| G17 | Upheld | Confirmed | E | N13. No 500/day evidence exists for any candidate. |
| G18 | Upheld, stronger | Confirmed by code plus dated quota | P, E | N03, N04 and no rate awareness anywhere in the engine: a 429 from the model is a generic error with a fixed 2- and 4-minute backoff (`store.ts:289`). Evidence expires after 2 days (`pipeline.ts:284`), so a verifier backlog turns into `evidence_stale` holds and a new cycle. |
| G19 | Upheld | Confirmed | H | Plan hash not embedded (`engine-o2-live-wave.ts:33`); no count assertions; exit 0 on total verifier failure. I add: pacing inside the SDK timeout (N02); no stop rule for repeated 5xx, so 12 of 20 daily verifier requests were spent for zero verdicts (N15); all request headers omitted (N16); hosted flag deleted (N14). |
| G20 | Upheld | Confirmed | D, P | On the hosted build the "implementation hash" is the value bundled at build time, not a hash of running files (`src/lib/scanChannels.ts:25-29`). `stableVersion: '5.2.0'` is hard-coded (`scanChannels.ts:81`, `engine/comparison.ts:18`) while the package is 5.5.0. `engine-v6-hosted-preview.md:3` says the public service "remains 5.2.0", mixing product and extractor identity. I could not inspect any hosted state. |
| G21 | Upheld | Confirmed | D | Retained errors: GLM's "4 of 7", GLM's table-loss claim (falsified by `reviewer-repros.json`), Gemini's "paid access is mandatory" and invented verdict codes. I add: GLM's proposal to set an abstention threshold after the run is post-hoc; the retained transcripts are accessibility-tree scrapes with sentences cut mid-way (for example `semantic/glm-adjudication-ax.txt:27`). No reviewer noticed the 118-second cluster. |
| G22 | Narrowed | Confirmed | D, P | No ontology code exists in the checkout. `research/auto-ontology/DECISION.md` records it as deferred with no run; the claim ledger is its "arm B". Real interactions: approval records the role label `admin` (`claimLedger.ts:63-65`); the canonical-graph projection marks provisions of a published change `published`, and `reviewed` when public but unpublished (`src/lib/documentEvidenceSync.ts:115-119`), which reads as human review that did not occur. |

## 5. Further gaps found in this audit

Listed in full in `findings.json` (29 entries). IDs are not contiguous: a few working numbers were merged into the G rows above (PDF eligibility into G04, freshness into G05, table association into G06). Those not already described in §3:

| ID | Gap | Status | Class |
| --- | --- | --- | --- |
| N21 | Contracts and approvals are single-administrator attestations stored under the role label `admin` (`api/admin/engine/route.ts:74-94`, `claimLedger.ts:63-65`) | Confirmed by code | P |
| N22 | The canonical-graph projection labels provisions `published` or `reviewed` from publication flags, not from a recorded review (`documentEvidenceSync.ts:115-119`) | Confirmed by code | D, P |
| N29 | Retained reviewer transcripts are accessibility-tree scrapes with truncated sentences | Confirmed | D |
| N06 | No quota- or rate-aware scheduling; r3's 750,000-token gate exceeds the observed free 250,000 tokens/minute, so some documents r3 accepts can never be served on that tier | Confirmed by code plus dated quota | P |
| N10 | Language check is declarative metadata, not content | Confirmed by code | P |
| N15 | Wave stop rule ignored repeated 5xx and timeouts | Confirmed | H |
| N16 | Receipts omit every request header, not only credentials | Confirmed | H |
| N19 | Readiness report omits engine configuration; PostgreSQL fields are constants | Confirmed by code | P |
| N20 | Ledger evidence cannot be re-verified from ledger rows alone: `documentHash` keys no retained text; the link runs through `EngineTask.checkpointJson`, which is cascade-deleted with its run (`prisma/schema.prisma`, `EngineTask`) | Inferred | P |
| N23 | Hosted implementation identity is build-asserted | Confirmed by code | D |
| N24 | A hold for high-impact review alone records the check as successful and the policy as "Available" in publish mode (`pipeline.ts:60-62, 76`), while a detected change is unpublished | Confirmed by code; an owner decision for O4 | P |
| N25 | Transport-variant drift may confirm as a change | Inferred | P |
| N27 | The token-budget check excludes the system instruction (452 counted vs 671 billed, `http-013`/`014`) and doubles HTTP requests | Measured; low | P |
| N28 | Model identity is alias-level | Measured | E |
| N31 | Public summary is `claims[0]`; public risk is the highest analyst score, never verified | Confirmed by code | P |
| N36 | Verifier-side prompt injection never tested; model text flows verbatim into the public page and subscriber e-mail | Unmeasured | E |
| N38 | 15-second transaction ceiling unmeasured for large documents | Unmeasured | E |

## 6. Claims I reject or correct

- **"Verifier unavailability"** as the summary of wave 2. Nine of twelve failures are deadline expiries near r3's own configured limit (N01).
- **"One client AbortError after the deadline."** It fired 110 s after sending because the harness consumed 10 s of the budget (N02).
- **"Changed section context was exposed in deltas"** as a general statement. One swap was tested; a heading rename was not.
- **"Worker diagnostic used real r3 functions"** without the qualifier that hosted guards were disabled (N14).
- **GLM: "the general prohibition is not lost."** Disputed; see G10.
- **Any reading of 8/11, 5/6 or 4/6 as a rate.** They are counts over authored fixtures.
- **Any inference from the 6 November Mac probe or the `050af19` cohort to r3.** Different candidates, no AI path.

I do not reject the project's own caution. The reports under audit are unusually careful about denominators, and their central conclusion — O2 open — is correct.

## 7. Thresholds that need an owner or domain-reviewer decision

I propose no percentage gates. The following need an explicit decision before any run that is meant to qualify something. Rationale and suggested forms are in `next-wave-protocol.md` §6.

1. Which categories always require human review (the taxonomy question behind N07).
2. Tolerance for a `supported` verdict on a labelled-false claim. I recommend zero observed, reported with its confidence bound, because one such verdict is a published falsehood.
3. Maximum acceptable age of a confirmed but unverified change.
4. Minimum share of the 500 identities that must be contract-eligible before a run is called a 500/day run rather than an N/day run.
5. Whether a held high-impact change should show the policy as successfully checked (N24).
6. Storage ceiling relative to the hosting allowance.
7. Who may approve contracts and reviews, and whether two people are required.

## 8. Sintesi in italiano

O2 resta aperto. Nessuno dei quattro cancelli è superato: i contratti di completezza accettano 4 documenti incompleti su 6; il verificatore non ha mai restituito un verdetto (12 tentativi, 0 esiti); sull'host previsto mancano contratti e configurazione dei modelli; la prova da 500 policy al giorno non è stata eseguita e, con r3 così com'è, non è eseguibile senza intervento manuale.

Tre elementi nuovi. Primo: nove errori 504 arrivano tutti a circa 118 secondi, cioè a ridosso del timeout di 120 secondi che r3 stesso imposta; è probabile che il verificatore non abbia fatto in tempo, più che un guasto casuale del fornitore. Secondo: una modifica non risolta viene rianalizzata ogni giorno, consumando la quota di 20 verifiche giornaliere. Terzo: il filtro "alto impatto" non copre addestramento IA, condivisione dati, conservazione e licenze, quattro delle sei categorie della tassonomia del prodotto.

Le correzioni richiedono un nuovo candidato (r4). Gli esperimenti gratuiti proposti sono in `next-wave-protocol.md`.

## 9. Exact limits of this audit

- **Model and effort.** The model is Claude Fable 5.2. The owner asked for High effort. I cannot confirm from inside the session that High was applied; the effort indicator visible to me suggests a lower setting. Please check the session's effort setting before relying on that label.
- **No execution.** No tests, scripts, builds, scans, model calls or database queries. All test outcomes are repeated from retained logs.
- **No Git commands.** Commit binding rests on the ref files and file hashes. I did not verify that the working tree equals the tree of `c462524` beyond the 140 inventoried files and the 82 manifest files.
- **Read in full:** the brief and inventory; both O2 protocols; all eleven files under `src/lib/engine/`; the five O2 scripts and the manifest script; the three O2 reports and the free-API JSON; `assessment.json`; the GLM 7-November review and GLM adjudication; `encryptedBackup.ts`; `databaseReadiness.ts`; `hostedPreview.ts`; `scanChannels.ts`; `pdfPolicy.ts`; the admin engine route; the 5- and 6-November reports; the hosted-preview note; both claim-ledger migrations; the engine models in `schema.prisma`.
- **Read in part or summarised programmatically:** the 34 + 4 HTTP receipts and 12 case files (all parsed; key fields and timings extracted); `offline-diagnostics.json`; `boundary-falsifiers.json`; `report.json` files; the Gemini review and GLM protocol review (compacted text; the Gemini text only to about two-thirds); `engineV6.test.ts` (test names plus three excerpts); `scraper.ts` (transport, table and boilerplate sections); `check-all/route.ts` (engine entry points); `documentEvidenceSync.ts` (projection); the CodeQL triage (headings); `research/auto-ontology` (decision and compatibility notes, outside the inventory).
- **Not read:** `prisma/seed.ts`; other migrations; `engine-v6-daily-2026-11-05.json` and `engine-v6-qa-2026-11-06.json` beyond key names; `gemini.ts`, `mailer.ts` and the rest of the 82-file closure; any other test file; `node_modules`.
- **Not opened by design:** credentials and environment files; `output/o2-live-integration-20261109/lab.db` and any other database; the full UI receipts under `output/o2-*`; any hosted system.
- **One external lookup:** the public upstream source of `@google/genai` v2.17.1, through a summarising fetch tool. It supports N01 but is second-hand and was not checked against the installed package.
- **Not verifiable here:** current hosted state, current quotas, model behaviour, whether failed requests consumed quota, and the completeness of the manifest's import closure.
- **Nature of the review.** I am a language model reading code and receipts. Line-level statements are checkable against the cited files. Statements about runtime behaviour marked "confirmed by code" are static readings and can be wrong where behaviour depends on a library, the database engine or the host.
