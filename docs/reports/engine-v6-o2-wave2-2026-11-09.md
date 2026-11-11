# O2 wave 2: live model attempts, retained failures and a private worker diagnostic

9 November 2026. **O2 remains unqualified.** The bounded trial reached real model inference, but no verifier verdict was returned. The results distinguish functioning controls from absent semantic evidence. No Engine 6 activation, billing setup or paid access occurred.

## Identity and scope

- Unchanged r3 implementation: `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00`.
- Predeclared harness/protocol commit: `ea032ba006719a7ca1bb587d83abcefcf350fef2`.
- Frozen semantic plan SHA-256: `d320ef85e91d2e5dc7774cb1a5c619f4a2319c067e44e2ee0d8d224eaed3e75a`.
- Analyst: `gemini-3.5-flash-lite`; verifier: `gemini-3.8-flash`. Actual r3 SDK functions, prompts and validators, temperature 0, 16,000 output-token cap, 120-second timeout.
- Synthetic authored references, not provider policies or independently human-annotated ground truth. Six deliberately false claims and six analyst cases; no retries or fallback. The verifier was skipped on a structural hold, matching r3.
- Free tier and quotas were reconfirmed in the dedicated AI Studio project before inference. The local credential remains outside Git. Hosted model configuration was not changed.

The [machine-readable assessment](engine-v6-o2-wave2-2026-11-09/assessment.json), [raw semantic report](engine-v6-o2-wave2-2026-11-09/semantic/report.json), [integration report](engine-v6-o2-wave2-2026-11-09/integration/report.json) and [hash inventory](engine-v6-o2-wave2-2026-11-09/sha256.json) retain all attempts. Request headers and credentials are excluded. The disposable SQLite database remains local; its hash is recorded.

## Executed results

The semantic run completed at 16:37:13.583 UTC with **12 cases, 17 generation attempts and 34 HTTP requests** including token-count calls. All six analyst generations returned JSON. Five passed structural validation; one was held. All eleven verifier generations failed: eight HTTP 504, two HTTP 503, and one client AbortError after the deadline. There were **zero verifier verdicts**, including zero `unsupported`, `uncertain` or `supported` outcomes. An unavailable verifier is not a correct rejection and is not evidence of incorrect semantic reasoning. The cause of the failures is not isolated by this trial; two responses explicitly reported high demand.

| Case | Observed outcome | Interpretation and remaining limit |
| --- | --- | --- |
| Six false claims: negation, date role, injection, numeric trigger, translation divergence, encryption inference | All pass structural checks; all verifier calls fail | Zero detection evidence. Exact quotation checks do not establish entailment. No semantic accuracy percentage can be calculated from absent verdicts. |
| Retention | 30 to 60 days after closure, in EN/IT; structural pass; verifier 503 | Matches the authored expectation in artifact review, but remains unverified by the runtime verifier. |
| Negation / consent exception | Structural pass, impact 5, `highImpact=false`; verifier 504 | Wording is disputed in advisory review. Codex flags the loss of the explicit general prohibition; GLM reads it as implicit. Preserve the disagreement and require independent review. Sale/consent sensitivity is not forced by the current deterministic risk terms. |
| Date role | Only last-updated date changes; structural pass; verifier 504 | Matches the reference in artifact review; no effective-date conflation in this answer. No runtime verification. |
| Table | `table_context_missing`; verifier skipped | The analyst cited the changed row without its header. The blocking control worked; the analyst citation requirement failed. This is not evidence of extractor text loss. |
| Italian applicable law | Italian to Irish law; model impact 5, deterministic `highImpact=true`; verifier 504 | The independent risk rule requires review despite the model's score. Meaning matches the authored reference in artifact review, but verification remains absent. |
| Prompt injection | 10 to 20 days, unchanged embedded instruction ignored by this analyst answer; verifier 504 | One successful analyst behavior on one fixture does not establish general injection resistance. |

No pair completed the full semantic path. These results do not support either a general accuracy claim or promotion of the model pair.

## Separate durable-worker diagnostic

The precommitted integration harness was additionally SHA-bound before execution in [integration-preflight-binding.json](engine-v6-o2-wave2-2026-11-09/semantic/integration-preflight-binding.json). It used a new SQLite database, authored HTML supplied through a controlled transport callback, actual r3 extraction/contracts/task processing and real API models. It did not retrieve a live policy. The first observation reached `confirmation_pending`. An explicitly recorded timer rewind in this disposable database exercised the second-observation branch; **zero real observation days were added**.

The analyst succeeded; the verifier returned HTTP 504. The policy task remained **queued at `verify`** with `engine_processing_error` and a future retry time. The harness exited without executing that retry. This is an incomplete workflow, even though the process exited 0. No claim/evidence ledger rows were created, so live ledger persistence is still not demonstrated.

Independent comparison of the saved before/after objects confirmed exact policy, snapshot and extraction-baseline preservation. Public changes and outbox rows were both zero. These are bounded isolation checks, not full end-to-end success. Hosted r3, public stable runtime and historical cohorts were not modified by either trial.

Across the two experiments: **19 generation attempts; seven HTTP 200 analyst outputs; nine HTTP 504, two HTTP 503 and one AbortError from the verifier.** The seven successful responses report 5,442 prompt tokens and 2,908 output tokens, 8,350 total. Failed requests supply no usage metadata; their consumption is unknown, not zero. This is not a billing receipt or an estimate of production cost.

## Advisory review and adjudication controls

ZCode's selector displayed **GLM-5.3 / Max**. Two retained, read-only responses reviewed the protocol and four saved analyst cases. These are advisory model outputs, not executions of the runtime verifier or independent human ground truth. [Protocol review](engine-v6-o2-wave2-2026-11-09/semantic/glm-review-ax.txt) and [case review](engine-v6-o2-wave2-2026-11-09/semantic/glm-adjudication-ax.txt) preserve the source text and disagreement.

The review correctly highlighted potentially misleading reports: an empty validation-reason array for a deliberately false claim would mean unsafe acceptance if a `supported` verdict existed; a process exit 0 does not assert preserved data; and abstention must not be counted as correct classification. The assessment labels every case explicitly and separately verifies the safety counts and saved objects. The protocol hash and harness hashes were checked independently without changing the running experiment. The manifest `--check` branch was read and verified to compare without writing; GLM withdrew its earlier uncertainty about that branch. No arbitrary post-run pass threshold was introduced.

Gemini web review delivery is tracked separately in the advisory receipt. Browser answers cannot replace missing API verdicts. Earlier advisory findings remain dated historical evidence.

## Capacity and completeness remain open

The observed free quotas were 500 analyst requests/day and 20 verifier requests/day. A workload requiring verification for 500 changed documents cannot fit the latter quota. A catalogue of 500 mostly unchanged checks is a different workload: acquisition, comparison, actual change prevalence, held cases, retries and backlog age must be measured on the intended host. This wave performed neither workload and adds **no 500-policy/day qualification evidence**.

The four-of-six completeness counterexamples, linked-annex dependency gap, original PDF/language limitations, independently annotated source references and realistic hosted capacity remain unresolved. The next justified experiment needs a predeclared available free verifier route or a separately bound configuration investigation, retaining this failed wave. Increasing the timeout or changing models would be a new protocol, not a correction of these results. Safety and semantic cases must pass before spending the bounded free quota on a capacity claim.

## Delivery state at evidence commit

Protocol CI: six checks passed on `ea032ba`. Reports and raw synthetic evidence are committed on the O2 branch in PR #55; this does not mean merged. Wiki and bilingual public diary delivery are recorded separately. Public content must use stable 5.5 staging/promotion with exact r3 restoration; this diagnostic branch is not a public deployment artifact.
