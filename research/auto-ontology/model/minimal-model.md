# Minimal model (step 2)

Rows marked **implemented** exist in the schema. Rows marked **proposed** do not exist and must not be cited as delivered.

## Entities

| Entity | Status | Maps to | Required fields |
| --- | --- | --- | --- |
| Source | existing | `Entity` plus `EngineSourceContract` | origin, requested/final URL, declared language, jurisdiction |
| Document | existing | `Document` | title, type, jurisdiction, language |
| Version | existing | `Version` | `contentHash`, `capturedAt`, `effectiveAt` |
| Capture | existing | `EngineAttempt`, `SourceRetrieval` | timestamp, HTTP status or "No HTTP response recorded", transport |
| Section | **proposed, not implemented** | none | heading path, ordinal |
| Clause inventory | **proposed, not implemented** | none (`structureDocument` blocks exist only in memory and artifacts) | every source block with offsets, normalized hash, occurrence index |
| Claim | **implemented** | `EngineClaim` | operation, category, EN/IT text, impact, delta ids, analyst model, prompt version |
| Evidence | **implemented** | `EngineClaimEvidence` | side, document hash, UTF-16 start/end, verbatim quote, quote hash |
| Verification | **implemented** (fields on `EngineClaim`) | `verifierModel`, `verifierVerdict`, `verifierReason` | verdict is null when the verifier output is invalid |
| HumanReview | existing | `EngineReview`, `AdminReviewLog`; `EngineClaim.approvedBy/approvedAt` | actor label, decision, time |
| Change | existing | `Change`, `PolicyChange`; `EngineClaim.changeId` | from/to version |

`Provision` is a legacy taxonomy projection of `PolicyChange` fields. It is not claim or clause evidence and is not used by this model.

## Scope of the evidence

`EngineClaimEvidence` holds only the spans that a validated claim cites. It does not inventory every clause of the source and says nothing about source completeness. A missing middle clause that no delta touches leaves no row here.

## Relations

`Source -captured_as-> Capture -yields-> Version -of-> Document`; `Claim -cites-> Evidence -within-> Version (by documentHash)`; `Claim -about-> Change (changeId, only when published)`; `Claim -held_in-> EngineReview (reviewId)`; `Verification -judges-> Claim`; `HumanReview -approves-> Claim`.

## Status (every implemented row carries exactly one)

- `observed`: evidence spans. Each quote equals the frozen text slice; checked by `validateClaims` before any row is written.
- `inferred`: claim interpretation, produced by a model. The verifier verdict is recorded beside it and never upgrades it.
- `approved`: set by `approveReview`. It records the actor label the caller supplies. The admin route currently passes the role label `admin`, not a personal identity, so approval is attributable to the admin role only.

Approval never upgrades text completeness.

## Invariants (tested in `engineV6.test.ts`, "claim ledger")

1. Every claim row has evidence rows whose quotes equal the frozen text slice and whose hashes match.
2. A claim citing real text can still be `unsupported`; such claims cannot be approved.
3. Invalid verifier output (overlength, duplicate, missing or malformed verdicts) is stored as no verdict, never as a normalized one.
4. Observe-mode runs record their validated claims without any public write.
