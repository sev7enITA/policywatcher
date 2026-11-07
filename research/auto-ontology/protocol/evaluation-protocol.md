# Evaluation protocol (steps 3-5), fixed before scoring

Status: **proposal. No case has been annotated or scored; no comparison exists.**

Thresholds below are committed before any case is scored. Changing them after seeing results requires a dated amendment, not an edit.

## Arms

A Engine 6 as on `main` (contract checks, grounded claims, independent verifier, evidence as JSON), B claim-evidence ledger (this branch), C ontology (see `compatibility.md`). Same cases, same reviewers' instructions, same retained text.

## Cases

Independent annotation by a person who has not seen any arm's output. Annotator records, per case, the reference clauses, occurrence counts and the correct verdict.

| Category | Source of cases |
| --- | --- |
| Missing middle clause | `completeness-falsifiers.json` plus new variants |
| Lost repeated occurrence | same |
| Missing table row | same |
| Empty required section | same |
| Annex / referenced document absent | new, hand-built |
| Temporal conflict (version N vs N+1) | accepted dates 2, 4, 5 Nov from the frozen cohort, read-only |
| **Correct quotation, wrong interpretation** | new, hand-built; the primary target |
| Unanswerable (insufficient data) | new |

Split: **development** cases may be used to tune prompts or mappings; **evaluation** cases are sealed (hash recorded) and scored once. Minimum 20 evaluation cases with at least 5 in the primary category. At this size results are descriptive only: with five primary cases, +20 percentage points is a single case. No result from this protocol is an adoption certificate or establishes population accuracy (consistent with the QA report's rejection of 95%/98% targets).

## Metrics and pre-set thresholds

| Metric | Definition | Adopt-worthy threshold vs arm B |
| --- | --- | --- |
| Unsupported-interpretation detection | share of wrong-interpretation cases a reviewer flags | at least +20 percentage points |
| False-flag rate | supported claims wrongly flagged | no worse than B by more than 5 pp |
| Evidence traceability | claims resolving to verbatim span with matching hash | 100% (any miss is a defect) |
| Insufficiency declared | unanswerable cases correctly marked insufficient | at least +20 pp |
| Fabricated citation | citation not present in retained text | 0 |
| Reviewer time | median seconds per case | not more than B +10% |
| Latency / resources | per query and compile; peak RSS | reported, no pass line |

Outcome rule: **adopt** only if detection and insufficiency gains hold, traceability is 100% with zero fabrication, **and** the false-flag and reviewer-time constraints are met, and the gains repeat on a second, larger sealed set; **experiment further** if gains are present but the sample is too small or only arm B-vs-A shows benefit; **do not adopt** if C does not beat B (the ledger, not the ontology, then explains any gain).

## Independence

No model-agreement scoring. Verdicts come from the human annotation. Any model verifier is a measured subject, not a judge. Free access only; any cost is reported, not incurred.

## Reporting

Per-case table, disagreements retained, reproducible commands, pinned upstream commit, integration diagram, operational cost, recommendation.
