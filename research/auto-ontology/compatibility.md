# Compatibility analysis (step 1)

Based on reading README, `pyproject.toml`, `.env.example`, `docs/mcp.md` and the `auto_ontology/semantic` and `connectors` trees at the pinned commit. **Nothing was executed.** Statements about behaviour are from documentation, not observation.

## What Auto Ontology natively does

| Capability | Source of claim | Relevance to PolicyWatcher |
| --- | --- | --- |
| Compiles terms, relationships and SQL attributes from database metadata, profiled columns and sampled values | README "Generate" | Operates on **tables and columns**, not on prose clauses |
| Human certification of names, descriptions, SQL attributes | README "Certify" | Matches our human-review requirement, but certifies *schema meaning*, not clause interpretation |
| NL-to-SQL with provenance (SQL and steps returned) | README "Answer" | Provenance is a query, not a quoted passage |
| `check_answerable` reports coverage and refuses when no term covers a concept | README step 6 | Closest analogue to "declare insufficient data". Measures **term coverage of the question**, not whether the source document is complete |
| MCP read-only tools: `search_terms`, `get_term`, `describe_table`, `ask_question` | `docs/mcp.md` | Usable for the reviewer view |
| Postgres + pgvector storage; connectors for Postgres, DuckDB, SQLite, MySQL, Snowflake and others | `pyproject.toml`, `connectors/` | SQLite and Postgres connectors exist; PolicyWatcher's Prisma DB is the candidate source |
| Apache Ossie YAML import/export | README | Gives an exchange format for the reviewed model |

## Gaps for this use case

1. **No document or clause model.** Ingestion profiles structured columns. Policy text would sit in a text column (`ContentArtifact.text`, `Version.contentText`) that it cannot decompose into clauses, tables or repeated occurrences.
2. **Evidence is SQL-shaped.** Nothing in the documentation returns a verbatim span with offset and hash.
3. **No observed / inferred / approved distinction on edges.** Certification exists on terms, not on per-relationship epistemic status.
4. **Default inference is NVIDIA NIM** (`nvidia/nemotron-3.5-lightning-30b-a3b`, embeddings, reranker) and needs an API key. Self-hosted NIM or an OpenAI-compatible endpoint is configurable via the endpoint/key/model triplets, but I have not verified any free route.
5. **Heavy stack:** Next.js, FastAPI, ingestion worker, Postgres+pgvector, optional Vault, Docker Compose. Cost is operational, not licence.
6. Upstream states it is not accepting external contributions, so adaptations stay in a fork or an external layer.

## Adaptations required

- **Clause layer outside Auto Ontology.** Derive `Clause` rows deterministically (heading path, ordinal, offsets, NFKC+whitespace-normalized hash, occurrence index) from retained text, as the Apple leaf diagnostic already does (`data/extract/apple-visible-leaves.json`). Expose them as an ordinary relational table so the ontology can describe it.
- **Export a read-only projection** of the minimal model (see `model/minimal-model.md`) into a scratch Postgres or SQLite. Never point it at the live DB.
- **Keep the verbatim passage out of the model's authority:** the reviewer UI must resolve every claim to `clause.text` by id, not to a generated summary.

## Correction after reading Engine 6

Engine 6 already has grounded claims with validated exact spans and an independent verifier (`src/lib/engine/claims.ts`). `Provision` is a legacy projection, not clause evidence. The gap was persistence and queryability, now addressed by the claim ledger (see `DECISION.md`).

## Candidate integration shapes to compare

| Arm | Description |
| --- | --- |
| A. Baseline | Current Engine 6: contract checks, grounded claims and the independent verifier, evidence as JSON |
| B. Relational+clauses | A plus the claim ledger (`EngineClaim`, `EngineClaimEvidence`) with edge status, **no ontology**; implemented |
| C. Ontology | B described and queried through Auto Ontology |

Arm B is essential. Without it any benefit from C could come merely from the clause table, not from the ontology.

## Open questions I cannot answer from reading

- Does compilation produce useful terms over a text-heavy schema, or only over structured columns?
- Can `check_answerable` be made to reflect "no supporting clause" rather than "no term"?
- Is there a free inference route that preserves reproducibility?
