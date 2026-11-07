# Decision, 6 November 2026: strengthen Engine 6 before adding an ontology layer

Status: **Auto Ontology deferred, not rejected.** No Auto Ontology run took place. The decision rests on code reading, not on a measured comparison.

## What changed the assessment

Reading `src/lib/engine` corrected two assumptions in the first scaffold:

1. Engine 6 already produces clause-level grounded claims (`GroundedClaim`, exact `EvidenceSpan` offsets validated against frozen text) and runs an independent verifier (supported / unsupported / uncertain, distinct model identity required). See `src/lib/engine/claims.ts`.
2. `Provision` is a legacy projection (six taxonomy rows derived from `PolicyChange` fields), not clause evidence.

The real gap was that claims, spans and verdicts lived only as JSON (`PolicyChange.analysisEvidenceJson`, `EngineReview.payloadJson`). A reviewer could not query them, and no row distinguished observed from inferred from approved.

## What was built (arm B of the protocol: a claim-evidence ledger)

This records the spans that validated claims cite. It is not an inventory of every source clause and does not establish source completeness.

Additive claim ledger in Engine 6, on branch `codex/auto-ontology-assessment`:

| Item | Where |
| --- | --- |
| `EngineClaim`, `EngineClaimEvidence` tables | `prisma/schema.prisma`, migrations `20261106120000_engine_claim_ledger` (SQLite and PostgreSQL), both CLI-free initializers |
| Write, approve, query | `src/lib/engine/claimLedger.ts` |
| Pipeline hooks | `src/lib/engine/pipeline.ts`: shared commit path (publish and observe), commit-stage holds, `approveReview()` |
| Tests | `src/lib/__tests__/engineV6.test.ts`, describe "claim ledger" |

Rules enforced:

- Rows are written only after `validateClaims` accepted every span. Analyze-stage failures write nothing.
- Evidence rows are `observed`: each quote equals the frozen text slice and carries its hash.
- Claim meaning is `inferred`. It becomes `approved` only through `approveReview`, which records the caller's actor label. The admin route passes the role label `admin`, not a personal identity.
- A verifier verdict is stored only when the whole verifier output passes `validateVerification`; otherwise every verdict for that task is null (query `missing`). The raw output stays in the task checkpoint. Verdicts never upgrade status.
- Observe-mode runs record validated claims too, without `changeId` and without any public write, so the private Preview ledger is not biased toward held results.
- New encrypted backups declare inventory `engine-v6-claim-ledger` (47 tables). Historical `engine-v6` (45 tables) and pre-engine (34/35 tables) exports keep validating exactly their own table set.
- An `unsupported` claim stays queryable with its verbatim passage and still cannot be approved.
- No public API, webhook, feed or page payload changed. `analysisEvidenceJson` is still written.

## When to revisit Auto Ontology

Only if, after the ledger has real reviewed data, a measured need remains that SQL over the ledger cannot meet. Examples are a shared vocabulary across sources and languages, or MCP access for external agents. The protocol in `protocol/evaluation-protocol.md` still applies, with arm A now including the Engine 6 verifier.

## Not done

- No admin UI for the ledger and no delivered reviewer workflow. `listClaimLedger()` (keyset pagination) is the query entry point.
- No backfill of claims from earlier `analysisEvidenceJson` or held reviews.
- PostgreSQL: CI applies the migration, imports a populated ledger fixture in the rehearsal and runs record/approve/rollback/uniqueness/cascade checks in the contract smoke. That is schema and portability coverage, not a qualified deployment.
- No production or hosted Preview deployment. The engine implementation manifest hash changed, so this is a new candidate identity, distinct from the hosted r2 artifact and from the frozen temporal candidate `050af19`.
