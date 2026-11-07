# Engine 6 private Preview r3 (stage O1), 7 November 2026

**O1 complete: deployed, verified and exercised by one bounded observe run. The ledger is still empty.** The owner authorized stage O1 of the [operationalization model](../architecture/engine-v6-operationalization.md) on 7 November. The private Preview on `staging.policywatcher.online` now runs `main` at `7347297`, with the claim-evidence ledger. The bounded observe run completed on the deployed candidate without changing official data. No source reached analysis, so no claim was recorded, and with the current Preview data none can in observe mode (see [below](#bounded-observe-run-on-r3)). `policywatcher.online` was not touched. Engine 6 publication and notifications stay disabled.

## Candidate identity

| Item | r2 (previous, retained) | r3 (current) |
| --- | --- | --- |
| Source | `34c188c0d54ec24d61469ca1683dec8988252c6f` | `734729732fe1b494f844406f719ce2005a4c4d6b` (main after PR #51) |
| Archive SHA-256 | `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26` | `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341` |
| Implementation | `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88` | `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00` |
| Manifest | 6.0.0-preview.1, label `engine6-private-preview-r2` | 5.5.0, distribution `private-preview`, label `engine6-private-preview-r3`, 1,389 entries, no database or private env file |
| Hostinger deployment | `01a1ad57-9cb6-726d-8892-a5724ba6b4f4` (last restoration) | `01a1b650-b2e9-716a-a69a-d3850b2e5c05`, Completed / Current at 15:04 Europe/Rome, build 2m 21s |

The only configuration change was `POLICYWATCHER_RELEASE_SHA256`, from the r2 to the r3 checksum. The read-only configuration inspection confirms staging target, staging origins, `HOSTED_PREVIEW=1`, `ENGINE_V6=1`, `ENGINE_CHANNELS=1`, `ENGINE_PUBLICATION=0`, `ENGINE_NOTIFICATIONS=0`. The r2 archive remains available for rollback. The frozen temporal candidate `050af19` is unchanged.

## Before deployment

- Read-only SSH snapshot of the Preview: r2 active, 45 tables, 21 migrations, integrity `ok`, zero active tasks, both saved observe/silent runs (`4e9eef90`, `781ceb98`) completed.
- Consistent off-host copy of `preview.db` (read-only SQL dump, SHA-256 `34fa0111105f2248d8b19c472d4db6f562f22c67536509a8e5e8f0a7f51c5e9e`), kept privately outside Git.
- Three local rehearsals of the archive's own database preparation (`hostinger-init-db.sh`, which runs `prisma migrate deploy` after a backup):
  1. On the r2-era local Preview database.
  2. On the off-host copy of the real hosted database.
  3. Idempotence (second run).

  Each produced 47 tables and 22 recorded migrations with integrity `ok`. All 45 existing tables were row-for-row unchanged, the two ledger tables were empty, and the automatic backup was logically identical to the starting data.
- Local rollback drill: r2's own initializer ran without error on the migrated database and left the ledger tables in place. r2's readiness check reports only missing tables and migrations; this was established by reading its code, not by running r2 against the database.
- Note on tooling: the CLI-free fallback initializer creates the tables but does not record the migration in `_prisma_migrations`. The managed build uses `prisma migrate deploy`, which does. A host that falls back would show 21/22 in Database Readiness.

## After deployment

| Check | Result |
| --- | --- |
| Deployed release metadata (read-only SSH) | Manifest and implementation file of r3; release checksum `e82ff8ff...` |
| Schema | 47 tables, 22 migrations, last `20261106120000_engine_claim_ledger`, integrity `ok` |
| Data preservation, all 45 previous tables | 43 identical. `AdminAccessLog` +1 row: the verification login. `EngineOrigin`: only the two internal worker-leadership rows changed (r2 worker `d9d5dde4...` replaced by r3 worker `84085328...`, started 14:04:06 UTC, active, no error); the Apple origin row is unchanged |
| Ledger tables | `EngineClaim` 0 rows, `EngineClaimEvidence` 0 rows |
| Saved runs | Both completed, observe/silent; zero active tasks |
| Anonymous boundary | `/admin/engine` and `/` redirect to `/admin/login` (307); `/api/admin/engine` and `/api/admin/database-readiness` return 401; `x-robots-tag: noindex, nofollow, noarchive`; `cache-control: private, no-store` |
| Authenticated read-only verification, 14:14:58 UTC | **13/13 passed**: login, worker active, HTTP and worker implementation `84085328...`, private channels (stable off, preview and compare on), publication disabled, database health, readiness `ready` with 47/47 tables and 22 migrations, both saved reports retrievable |
| Public site | `https://policywatcher.online/` 200, not changed by this deployment |

The first post-deployment SSH inspection timed out while Hostinger was still building and is retained. The hPanel deployment page also showed a transient "Network error" notification next to the Completed / Current state; no consequence was observed. The owner ran the authenticated verification with the existing private staging configuration; credentials are not part of any receipt.

The comparison above uses the same method on both sides: the off-host copy before, read-only SSH after. A separate full-table comparison taken at 13:57 and 14:16 UTC agrees. It covers the 46 pre-existing tables including the migration ledger: 43 unchanged, with only `AdminAccessLog`, `EngineOrigin` and `_prisma_migrations` changed.

## Bounded observe run on r3

The owner started the run from the private admin console. It is the same scope as the 6 November runs: the four Apple policies, Preview channel, observe mode, silent notifications, no comparison and no model selected.

| Item | Result |
| --- | --- |
| Run | `6982c663-2b7b-4191-b8b6-e10bdd60f013`, created 15:00:32 UTC, completed 15:00:40 UTC (8.0 s), 4 selected |
| Identity | Run metadata and saved report carry implementation `84085328...`; extraction profile `716e9cd3...` |
| Apple privacy (`/legal/privacy/en-ww/`, reviewed contract) | HTTP 200, eligible capture (artifact `9f0fd74e...`, already stored and content-addressed). Outcome `confirmation_pending`: first sighting of the candidate under r3, awaiting independent confirmation (next due 16:00:34 UTC) |
| Three other Apple sources | No reviewed contract: not acquired, held as `review` with `source_contract_missing` (status `observed`). The three equivalent 6 November reviews became `superseded` |
| Analysis and verifier | Not reached on any source; no analysis or verifier receipt; no model call |
| Ledger | `EngineClaim` 0, `EngineClaimEvidence` 0 |
| Official and configuration data | Unchanged: `Policy`, `PolicySnapshot`, `PolicyChange`, `EngineOutbox`, `EngineSourceContract`, `ExtractionBaseline`, `Subscriber`, `NotificationLog`, `EngineArtifact`, `_prisma_migrations` |
| Engine-internal tables changed | `EngineRun` +1, `EngineTask` +8, `EngineAttempt` +8, `EngineReview` +3 (and 3 superseded), `EnginePolicyState` (candidate of the Apple privacy policy), `EngineOrigin` (worker and origin state), `AdminAccessLog` (owner logins) |
| Afterwards (independent read-only snapshot, 19:18 UTC) | 47 tables, 22 migrations, integrity `ok`, zero active tasks, the three runs completed, manifest and configuration unchanged |

### Why the ledger is still empty

This was established by reading the r3 pipeline (`src/lib/engine/pipeline.ts`) together with the hosted rows. It was not tested by a further run.

- The Apple privacy policy has `sourceMigrationPending = 1`, so the engine treats it as establishing a baseline. After independent confirmation, an establishing source ends as `observed_baseline_ready`. In observe mode nothing is written, so the source stays in this state indefinitely and never moves to analysis. The 6 November second run shows the same thing: `observed_baseline_ready` under r2.
- `ExtractionBaseline` has 0 rows. Any policy that is not establishing is held as `extraction_baseline_missing` before analysis, and only one source has a reviewed contract.

**Consequence:** with the current Preview data and publication disabled, no observe run can reach the analysis stage, and so none can produce a ledger row. A second run after 16:00 UTC would confirm the Apple candidate and end as `observed_baseline_ready`, not as claims. Producing ledger rows on hosted data therefore needs an explicit design decision before O2, for example a reviewed way to establish a Preview-only baseline. More runs of the same kind will not produce them.

## Not established

- **Ledger rows on hosted data:** none. Analysis is not reachable in the Preview's observe mode with the current baselines and contracts (above).
- No qualification of source completeness, analysis accuracy, multi-day managed-process survival or 500 policies/day.
- No public website change. The Engine 6 notebook gains the ledger entities only through a later content-only stable release (workflow W6).

Machine-readable record: [engine-v6-preview-r3-deployment-2026-11-07.json](engine-v6-preview-r3-deployment-2026-11-07.json). Raw snapshots, the off-host database copy and verification outputs are kept privately outside Git.
