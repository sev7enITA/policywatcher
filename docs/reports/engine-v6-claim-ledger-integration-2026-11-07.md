# Engine 6 claim-evidence ledger: integration and impact evidence, 7 November 2026

**What happened: source integration only.** [PR #51](https://github.com/sev7enITA/policywatcher/pull/51) is integrated into `main`. Nothing was deployed: not to the private Preview, not to staging and not to `policywatcher.online`. Engine 6 publication remains disabled. Source completeness, semantic accuracy and 500 policies/day remain unqualified.

## Integration record

| Item | Value |
| --- | --- |
| Reviewed head | `dad265504acf29190a54a223208ccd7a82a99d48` (team re-review of 7 November: APPROVE, no unresolved P0/P1) |
| Previous reviewed head | `3a0b187e411de7c02bdf14627da7c2bbdf3b3d5d` (REQUEST CHANGES, report and failing logs preserved by the team) |
| Base | `c133a961b47a59ef63bfc8f67856c0ff41aa7f3b` |
| Integration commit on `main` | `7347297` (squash; the repository ruleset allows only squash merges) |
| Tree identity | `main` tree `df14356784f5ba371ec7d96b93527b53db8aa120` equals the tree of `dad2655`. The base had not moved, so the squash introduced no conflict resolution and no unreviewed change. |
| Reviewed commits kept | Branch `codex/auto-ontology-assessment` still points to `dad2655` and is not deleted |
| CI on the reviewed head | 6/6 checks passed; PostgreSQL job [128025643335](https://github.com/sev7enITA/policywatcher/actions/runs/42256692323/job/128025643335) applied the migration, ran the ledger contract smoke and returned rehearsal verdict `go` |
| Independent local validation (team) | Fresh archive of `dad2655`: 1,585 passed, 14 skipped (1,582 plus the three original review probes, unchanged) |

## Candidate identities preserved

| Candidate | Identity | State after this integration |
| --- | --- | --- |
| Frozen temporal candidate | `050af19` | Unchanged. Accepted dates 2, 4 and 5 November; rejected 3 November window retained |
| Hosted private Preview r2 | implementation `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`, archive `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26`, source `34c188c` | Unchanged, still the only artifact on `staging.policywatcher.online` |
| `main` before this integration | implementation `f8607544bb428f6e942c7c0411bfcc7ae740423cb16ea6748469339ecbd248cc` at `c133a96` | Superseded on `main`, history retained |
| `main` after this integration | implementation `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00` at `7347297` | New candidate identity. Not deployed and not qualified |

Evidence of earlier candidates (dated reports, receipts, failing windows and logs) is not edited by this integration.

## Impact by area

| Area | Change on `main` | Operational consequence |
| --- | --- | --- |
| Database schema | Additive tables `EngineClaim`, `EngineClaimEvidence`; migration `20261106120000_engine_claim_ledger` for SQLite and PostgreSQL | Database Readiness now expects **47 tables** and **22 SQLite migrations** (previously 45 and 21). No existing table or column changes |
| Deployment preparation | Both CLI-free initializers apply the ledger migration idempotently (`CREATE ... IF NOT EXISTS`) | `main` carries the `private-preview` distribution identity: `hosted-preview-preflight.mjs` refuses any build from it outside the private Preview context, so it cannot reach production. A Preview build from `main` after `7347297` runs the backup-first `prepare-database.sh` and creates the two tables in `preview.db`. The public 5.5 artifact is built from the separate stable release branch, which does not contain the ledger |
| Engine pipeline | Validated claims and spans are written in the same fenced transaction as the commit or hold, in both observe and publish modes; `approveReview()` marks them `approved` | Rows exist only where Engine 6 analysis actually runs (today only the private Preview, after deployment of a new candidate). No public write is added in observe mode |
| Admin API and UI | No new route. `approveReview` keeps the actor label `admin` | There is no reviewer view of the ledger yet; the query function `listClaimLedger()` is not exposed over HTTP |
| Encrypted backups | New exports declare `inventoryVersion: "engine-v6-claim-ledger"` (47 tables); `engine-v6` (45) and unlabelled (34/35) exports keep validating their own sets | Restore drills must check the inventory label and table count. Older backups remain decodable |
| PostgreSQL rehearsal | Fixture with one claim and one evidence row; contract smoke covers record, approval, rollback, uniqueness and cascade | Portability coverage only; not a PostgreSQL deployment |
| Public API, feeds, webhooks, pages | None | `policywatcher.online` is unchanged in behaviour and content. `analysisEvidenceJson` is still written |
| Website content | None yet | The Engine 6 notebook section "Entità e relazioni" describes the schema deployed in the Preview. It must gain the two ledger entities only after a Preview deployment that contains them (see the operationalization model) |
| Engine implementation manifest | Regenerated | Any later deployment of `main` is a new candidate and needs its own staged verification. It cannot reuse r2 receipts |
| Other teams | Files touched: `src/lib/engine/pipeline.ts`, `src/lib/engine/claimLedger.ts`, Prisma schema and migrations, `databaseReadiness.ts`, `encryptedBackup.ts`, both initializers, PostgreSQL CI scripts | Branches that modify the same files need a rebase. A conflict resolution counts as a change and needs review of its delta before integration |

## Not established by this integration

- No ledger row has been produced on real hosted data.
- No measured comparison with NVIDIA Auto Ontology; it remains deferred (`research/auto-ontology/DECISION.md`).
- No admin UI, no historical backfill, no personal reviewer identity.
- No rollback drill of an older archive against a database that already contains the ledger tables.

The operating model for moving this foundation towards use is in [`docs/architecture/engine-v6-operationalization.md`](../architecture/engine-v6-operationalization.md).
