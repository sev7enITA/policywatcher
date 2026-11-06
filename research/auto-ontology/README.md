# NVIDIA Auto Ontology assessment for PolicyWatcher Engine 6 Preview

Status: **Auto Ontology deferred; see [DECISION.md](DECISION.md).** The relational claim ledger (arm B) was built in Engine 6 instead. No Auto Ontology prototype has been run.

The Apple text extracts in `data/extract/` are third-party content and stay local only (gitignored); `MANIFEST.json` keeps their hashes.
Branch: `codex/auto-ontology-assessment`, cut from `origin/main` at `c133a96`.

## Question

Can an ontology layer help a reviewer find an interpretation that the retained source text does not support, with the original passage always reachable? What measurable benefit does it add over the existing relational schema (`prisma/schema.prisma`) and the document-level contract checks?

## Boundaries

- Public product stays 5.5.0. Engine 6 Preview is a separate, private experiment. Nothing here touches production, publication, notifications or the frozen temporal candidate (`050af19`, worktree `PolicyWatcher-engine6-table-escaping`).
- Only selected copies live here (`data/extract/`, hashed in `MANIFEST.json`). Raw captures, DB snapshots, model transcripts and private configuration stay in `output/engine-qa-20261106` outside Git. Do not copy them in.
- Free access only. The default Auto Ontology stack needs an NVIDIA API key (`nvapi-...`) for NIM. Obtaining or using one is the user's decision; nothing has been activated.
- Ontology coverage is not document completeness. Model agreement is not independent validation.

## Pinned upstream

`NVIDIA/auto-ontology` @ `c4495670947eb7b4616f0dd9900e5ced2a48ca1e` (2026-11-05), Apache-2.0, package version 1.2.0. Inspected read-only in a scratch clone; not vendored. Re-pin in `pins.json` before any run.

## Contents

| File | Purpose |
| --- | --- |
| [compatibility.md](compatibility.md) | Native features, gaps, adaptations (step 1) |
| [model/minimal-model.md](model/minimal-model.md) | Entities, relations, provenance status (step 2) |
| [protocol/evaluation-protocol.md](protocol/evaluation-protocol.md) | Cases, split, thresholds fixed before scoring (steps 3-5) |
| [data/extract/MANIFEST.json](data/extract/MANIFEST.json) | Hashes of the copied evidence |
| [pins.json](pins.json) | Upstream and source revisions |

## First concrete task

On a small independently annotated set, test whether the ontology lets a reviewer spot an unsupported interpretation faster or more accurately than the relational view, while the verbatim passage stays one step away.
