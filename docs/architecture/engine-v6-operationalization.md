# Engine 6 operationalization model

Status, 7 November 2026: **proposed operating model. O0 is done; O1 is deployed and verified, with its observe run pending; no later stage is authorized.** Existing documents already cover the private Preview runbook ([engine-v6-hosted-preview.md](engine-v6-hosted-preview.md)), the qualification campaign ([engine-v6-qualification-campaign.md](engine-v6-qualification-campaign.md)), source review ([engine-source-review-runbook.md](engine-source-review-runbook.md)) and stable releases ([hostinger-staging-promotion.md](../hostinger-staging-promotion.md)). None defined how Engine 6, now with the claim-evidence ledger, moves from source on `main` to operational use on `policywatcher.online`. This document fills that gap. It does not replace the gates in the [6 November QA report](../reports/engine-v6-qa-2026-11-06.md).

## Principles

1. Integration, deployment and activation are separate decisions, each with its own owner authorization and receipt.
2. Every stage names one candidate identity (implementation hash and archive SHA-256). Receipts of one candidate never qualify another.
3. Earlier candidates and their evidence stay intact: `050af19`, hosted r2, and every dated report and failed window.
4. Missing evidence is a hold. Model agreement, an HTTP 200, a process exit or a version number is not qualification.
5. The public site changes only through the stable release sequence, and its content describes only what is deployed.

## Destinations

| Destination | Role | Engine 6 |
| --- | --- | --- |
| `policywatcher.online` (and `www.`) | Public product 5.5.x, established scanner, public notebook `/engine-6-preview` | Disabled. Public pages describe the Preview but do not run it |
| `staging.policywatcher.online` | Stable-release staging **and** private Preview (`/admin/engine`) | Observe/silent only, at most 50 policies per run, dedicated `preview.db` |
| `main` on GitHub | Integrated source | Code only. Not a deployed state |

## Stages

| Stage | What it means | Entry criteria | Exit evidence | State on 7 November |
| --- | --- | --- | --- | --- |
| **O0 Integrated** | Reviewed source on `main` | Team review of the exact head, CI green | Integration receipt | Done: `7347297`, [receipt](../reports/engine-v6-claim-ledger-integration-2026-11-07.md) |
| **O1 Private Preview candidate (r3)** | `main` packaged and deployed to the private Preview, replacing r2 | Owner authorization for a Preview deployment; r2 archive, config and `preview.db` backup retained outside the release | Hostinger Completed / Current; readiness 47 tables / 22 migrations on `preview.db`; matching HTTP/worker implementation identity; anonymous isolation; a bounded observe run; official and configuration table hashes unchanged; rollback path to r2 documented | Deployed 7 November 2026 and verified (13/13 authenticated, 47/22, data preserved); bounded observe run pending. [Receipt](../reports/engine-v6-preview-r3-deployment-2026-11-07.md) |
| **O2 Qualification with the ledger** | The ledger becomes the measurement substrate for analysis and verifier accuracy | O1 complete; reviewed source contracts for the sample; model costs within free or already available credits, or an explicit owner decision | The QA report gates, measured per candidate: source identity, completeness, PDF provenance, analysis/verifier accuracy on reviewed positive and negative changes, real 500/day on the intended host, release checks | Not started |
| **O3 Production shadow** | Engine 6 runs on production data in observe/silent mode; results private | O2 gates passed for the scoped catalogue; owner decision; isolated worker resources; backup and restore drill with inventory `engine-v6-claim-ledger` | Several days of shadow runs with ledger metrics, no public write, no notification, stable scanner results unchanged | Not started |
| **O4 Gated publication** | Engine 6 may publish changes for sources with an approved contract | O3 evidence; explicit release decision; personal reviewer identity in approvals | Per-source activation receipts; human approval for high-impact or doubtful changes; rollback to established scanner per source | Not started |

A stage may stop or go back at any time. Going back never deletes held observations, failed runs or ledger rows.

## Operational workflows introduced by the ledger

### W1 Reviewer triage (O1 onward)

Daily, on the private Preview, list claims by verdict: `unsupported`, `uncertain` and `missing` first. For each claim, read the verbatim spans against the frozen capture, then close or approve the linked review in `/admin/engine`. An `unsupported` claim cannot be approved. Approval marks the claim `approved` with the actor label.

Gap: there is no HTTP route or UI for `listClaimLedger()` yet. Until one is built (admin-authenticated, read-only, paginated), triage reads the existing review detail, which shows claims and verdicts from the checkpoint.

### W2 Ledger metrics (O2 onward)

Per candidate and per run: number of claims, share of each verdict, share of `missing` verdicts (invalid verifier output), claims per held review, approval latency, and approvals per actor label. These are measurements of the engine, not proof of source completeness. Record them in dated reports with the candidate identity.

### W3 Deployment and migration (every stage that deploys)

The managed build runs `prepare-database.sh`, which makes a consistent SQLite backup and then applies the migrations idempotently. Before a deployment, confirm the target's current readiness counts. After it, confirm 47 tables and 22 SQLite migrations.

`main` carries the `private-preview` distribution identity (`src/lib/distribution.ts`). `hosted-preview-preflight.mjs` refuses to build it outside the private Preview context, so it cannot reach production. The public 5.5 artifact is built from the separate stable release branch, which does not contain the ledger. For production, O3 therefore needs a deliberate stable-branch decision: which Engine 6 revision enters it, and with which flags.

### W4 Backup and restore

New encrypted exports carry `inventoryVersion: "engine-v6-claim-ledger"`. A restore drill must check the label, 47 tables and row counts. Exports labelled `engine-v6` (45 tables) or unlabelled (34/35) remain valid and must still decode. An integrity check is not a completed restore drill.

### W5 Rollback

Rolling back to r2 leaves the additive ledger tables in the database. Before relying on it, a drill must confirm that the older code starts and that its readiness check accepts the extra tables. Keep `preview.db` and receipts outside the extracted release. Never delete ledger rows to obtain a clean state.

### W6 Website and documentation

The public notebook at `policywatcher.online/engine-6-preview` (EN/IT) changes only through a content-only stable release.

- Section 03 "Entità e relazioni" gains `EngineClaim` and `EngineClaimEvidence` **only after O1**, because it describes the schema deployed in the Preview.
- Section 04 "Validazione" reports ledger measurements only from dated receipts.
- If a content release temporarily uses staging, restore the private Preview afterwards and verify it.
- The GitHub wiki follows each receipt. It distinguishes integrated, deployed and qualified states.

### W7 Team coordination

Changes to the engine, the schema, backups or initializers are announced on the PR to the other team before merge. A conflict resolution is a change and needs review of its delta before integration. Merge only the reviewed head (`--match-head-commit`), and keep the reviewed branch.

## Decisions owed by the owner

1. O1 (deploy `main`, `84085328...`, as Preview r3): authorized by the owner on 7 November 2026 and deployed the same day; the bounded observe run is still pending ([receipt](../reports/engine-v6-preview-r3-deployment-2026-11-07.md)).
2. For O3: how Engine 6 code enters the stable release branch.
3. Priority of the gaps: admin ledger view, personal reviewer identity, rollback drill.

## Not authorized by this document

Any deployment other than O1, production activation of Engine 6, paid model use, infrastructure purchase, or change to the frozen cohort `050af19` or to hosted r2.
