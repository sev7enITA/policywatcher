# Decision, 6 November 2026: strengthen Engine 6 before adding an ontology layer

Status: **Auto Ontology deferred, not rejected.** No Auto Ontology run took place. The decision rests on code reading, not on a measured comparison.

## What changed the assessment

Reading `src/lib/engine` corrected two assumptions in the first scaffold:

1. Engine 6 already produces clause-level grounded claims (`GroundedClaim`, exact `EvidenceSpan` offsets validated against frozen text) and runs an independent verifier (supported / unsupported / uncertain, distinct model identity required). See `src/lib/engine/claims.ts`.
2. `Provision` is a legacy projection (six taxonomy rows derived from `PolicyChange` fields), not clause evidence.

The real gap was that claims, spans and verdicts lived only as JSON (`PolicyChange.analysisEvidenceJson`, `EngineReview.payloadJson`). A reviewer could not query them, and no row distinguished observed from inferred from approved.

## What was built (arm B of the protocol)

Additive claim ledger in Engine 6, on branch `codex/auto-ontology-assessment`:

| Item | Where |
| --- | --- |
| `EngineClaim`, `EngineClaimEvidence` tables | `prisma/schema.prisma`, migrations `20261106120000_engine_claim_ledger` (SQLite and PostgreSQL), both CLI-free initializers |
| Write, approve, query | `src/lib/engine/claimLedger.ts` |
| Pipeline hooks | `src/lib/engine/pipeline.ts`: commit-stage holds, `publish()`, `approveReview()` |
| Tests | `src/lib/__tests__/engineV6.test.ts`, describe "claim ledger" |

Rules enforced:

- Rows are written only after `validateClaims` accepted every span. Analyze-stage failures write nothing.
- Evidence rows are `observed`: each quote equals the frozen text slice and carries its hash.
- Claim meaning is `inferred`. It becomes `approved` only through `approveReview` with a named actor.
- A verifier verdict is stored as-is (supported / unsupported / uncertain / null if malformed) and never upgrades status.
- An `unsupported` claim stays queryable with its verbatim passage and still cannot be approved.
- No public API, webhook, feed or page payload changed. `analysisEvidenceJson` is still written.

## When to revisit Auto Ontology

Only if, after the ledger has real reviewed data, a measured need remains that SQL over the ledger cannot meet. Examples are a shared vocabulary across sources and languages, or MCP access for external agents. The protocol in `protocol/evaluation-protocol.md` still applies, with arm A now including the Engine 6 verifier.

## Not done

- No admin UI for the ledger. `listClaimLedger()` is the query entry point.
- No backfill of claims from earlier `analysisEvidenceJson` or held reviews.
- No production or hosted Preview deployment. The engine implementation manifest hash changed, so this is a new candidate identity, distinct from the hosted r2 artifact and from the frozen temporal candidate `050af19`.
