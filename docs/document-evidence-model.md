# Canonical document evidence model

## Decision

PolicyWatcher introduces an additive canonical graph:

`Entity → Document → Version → Change → Provision`

The existing `Company → Policy → PolicySnapshot → PolicyChange` path remains operational during backfill and dual-write. The schema migration creates empty canonical tables only. The separately guarded Wave 1B tooling can now project historical rows, reconcile them and keep future legacy writes synchronized; it does not switch canonical reads.

## Model contract

| Model | Meaning | Stable identity input |
| --- | --- | --- |
| `Entity` | Organization or other accountable publisher | Immutable `legacy-company:<Company.id>` canonical key |
| `Document` | One governed document in an entity scope | Entity public ID + immutable `legacy-policy:<Policy.id>` canonical key |
| `Version` | One captured content state | Document public ID + content hash |
| `Change` | Baseline or transition into one version | Document public ID + previous version public ID or `baseline` + next version public ID |
| `Provision` | One classified observation within a change | Change public ID + taxonomy key + ordinal |

Every model has an internal UUID primary key and a separately materialized unique `publicId`. Public IDs use a versioned, length-prefixed SHA-256 derivation truncated to 128 bits and an object prefix (`ent_`, `doc_`, `ver_`, `chg_`, `prv_`). They do not reveal internal UUIDs or display names. Canonical keys and taxonomy ordinals become immutable once their public IDs are published.

Nullable unique `legacy*Id` fields provide an auditable bridge to the current tables. They are intentionally scalar during the transition so the legacy write path is not coupled to incomplete canonical rows.

`Version.contentRef` is the provider-neutral location for a future durable object. `contentText` is nullable and transitional for inline/backfill compatibility, so this model does not force a new database blob boundary before the separate object-storage package exists. The backfill and dual-write service requires inline content, validates its SHA-256 against `contentHash`, and refuses duplicate content hashes inside one document.

The legacy UUID is an internal stable bridge input, never the public ID itself. Mutable names, slugs, policy types and URLs do not change public identity. A stable-ID or relationship conflict is fail-closed: the service does not rewrite published identity to make a run pass.

## Change semantics

- A baseline uses `kind = baseline` and no `fromVersionId`.
- A detected transition points from an optional earlier version to one required next version.
- One document can have only one canonical change into a given next version.
- Deleting a document cascades through its canonical evidence. Deleting a previous version retains the change and clears `fromVersionId`; deleting the next version removes that change because its evidence target no longer exists.
- `publicEvidence` and `publishedAt` remain explicit gates. Creating a canonical row does not publish it.

## Provision taxonomy 1.0.0

The initial keys are:

1. `ai_training`
2. `data_sharing`
3. `retention`
4. `arbitration`
5. `content_licensing`
6. `liability`

Allowed assessments are `present`, `absent`, `conditional`, `unclear` and `not_assessed`. A provision stores the taxonomy version so past observations are not silently reinterpreted after a future taxonomy update. `reviewStatus` progresses independently through `draft`, `reviewed` and `published`.

The taxonomy classifies observed language. It is not a legal conclusion, a compliance determination or proof that a clause is enforceable. Evidence text and hashes are optional until review; a public implementation must continue to apply explicit publication gates.

## Authoritative publication-readiness metric

`/api/v1/publication-readiness` publishes one aggregate database-derived contract:

- configured;
- retrieved;
- baseline verified;
- public;
- analysed;
- latest successful capture.

The current operational `Policy`, `PolicyCheckLog`, `PolicySnapshot` and `PolicyChange` tables remain the metric source until canonical backfill and dual-write are complete. This avoids reporting empty canonical tables as product reality. One server service owns all query definitions and feeds the public endpoint, the Admin dashboard and the competitive analysis scope.

The endpoint is read-only, CORS-enabled, rate-limited and `no-store`. It exposes aggregate counts and one timestamp, not policy text, failure details, internal identifiers or database diagnostics. Query failure is represented as unavailable, never as zero.

## Adoption gates

Before switching canonical reads:

1. apply the additive schema and run the guarded dry-run on a current copy;
2. backfill into the five new tables using the stable-ID helpers;
3. reconcile counts, hashes, relationships, taxonomy projections and public gates against legacy rows;
4. repeat apply to prove idempotency, then run the non-production dual-write smoke;
5. enable `POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1` only after the production backfill reports `applied` and reconciliation reports `reconciled`;
6. monitor transactional write failures and run reconciliation after the first controlled capture;
7. rehearse the full SQLite-to-PostgreSQL import on a current schema copy;
8. switch reads only after parity is measured and reviewed.

Wave 1B implements gates 1–6 and has passed them on a sanitized local copy. It has not run against production. PostgreSQL cutover, object-storage payload movement and canonical read activation remain separately approved gates. See [Backfill, reconciliation and dual-write runbook](document-evidence-backfill-runbook.md).

## Legacy projection boundary

Every legacy snapshot becomes one canonical Version. A snapshot that is not the target of a legacy PolicyChange receives a baseline Change; a legacy PolicyChange becomes a detected Change. This preserves source-migration and first-baseline events without inventing a provider-authored transition.

Detected changes receive one ordinal-zero Provision for each taxonomy 1.0.0 key. Compatible structured fields are projected conservatively; unavailable arbitration or liability evidence remains `not_assessed`. The projection records the legacy field locator and evidence hash. It does not infer legal meaning from a risk label or claim that a clause is enforceable.

Canonical sequence numbers are append-only within a document and do not depend on potentially duplicated legacy version labels. Stable Version public identity depends on document identity and content hash, not sequence.
