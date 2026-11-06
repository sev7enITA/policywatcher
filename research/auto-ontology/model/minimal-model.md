# Minimal model (step 2)

Proposal, not implemented. Names map to existing Prisma models where one exists.

## Entities

| Entity | Maps to | Required fields |
| --- | --- | --- |
| Source | `Entity` plus `EngineSourceContract` | origin, requested/final URL, declared language, jurisdiction |
| Document | `Document` | title, type, jurisdiction, language |
| Version | `Version` | `contentHash`, `capturedAt`, `effectiveAt` |
| Capture | `EngineAttempt`/`SourceRetrieval` | timestamp, HTTP status or "No HTTP response recorded", transport |
| Section | new | heading path, ordinal |
| Clause | new | text, start/end offset, `normalizedHash` (NFKC+whitespace), **occurrence index**, kind (paragraph, list item, table row) |
| Evidence | `Provision.evidenceText/evidenceHash/sourceLocator` | clause id, exact span |
| Change | `Change` | from/to version |
| Claim | `Provision` (assessment, rationale) | taxonomy key, stated interpretation |
| Verification | new (model verifier result) | verdict: supported / unsupported / uncertain; model id |
| HumanReview | `EngineReview` | reviewer, decision, time |

## Relations

`Source -captured_as-> Capture -yields-> Version -of-> Document`; `Version -contains-> Section -contains-> Clause`; `Change -between-> Version(from,to)`; `Claim -about-> Change`; `Claim -cites-> Clause` (via Evidence); `Verification -judges-> Claim`; `HumanReview -decides-> Claim|Verification`.

## Edge status (every relation carries exactly one)

- `observed`: deterministic from retained bytes (version contains clause, hash match).
- `inferred`: produced by a model or heuristic (claim interprets clause, clause semantically equals clause).
- `approved`: a named human accepted it, with timestamp.

Approval never upgrades text completeness. A separate `completeness` attribute on Version takes `unqualified` unless an independent reference annotation exists, mirroring the QA report's stance.

## Invariants to test

1. Every Claim has at least one Evidence edge, and that edge resolves to verbatim text whose hash matches.
2. A Claim citing a real clause can still be `unsupported`. Citation validity and interpretive support are separate checks.
3. Repeated clauses keep distinct occurrence indices; none is deduplicated.
4. Language, jurisdiction, timestamp and hash survive every projection step.
