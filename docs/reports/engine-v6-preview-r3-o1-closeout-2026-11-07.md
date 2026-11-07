# Private Preview r3: O1 closeout, 7 November 2026

**O1 is complete: r3 is deployed privately, its migration and isolation are verified, and one bounded run has completed through the administrative interface. O2 qualification has not started.** The run did not reach semantic analysis and therefore does not demonstrate hosted claim-ledger writes or source completeness.

This closes the bounded-run item left pending in the [earlier deployment receipt](https://github.com/sev7enITA/policywatcher/blob/ac0ebad/docs/reports/engine-v6-preview-r3-deployment-2026-11-07.md), without rewriting that dated evidence. The public product website remains unchanged. The frozen temporal candidate `050af19` and the r2 archive remain retained.

## Deployment and data preservation

- Target: `staging.policywatcher.online` only. Hostinger deployment `01a1b650-b2e9-716a-a69a-d3850b2e5c05` showed **Completed / Current**, completed at **15:04 Europe/Rome**, build duration 2m 21s.
- Exact archive SHA-256: `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`, built from clean source `734729732fe1b494f844406f719ce2005a4c4d6b`.
- Implementation identity: `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00`, matching HTTP, worker and deployed manifest. All **13 authenticated checks passed**.
- Database: **47 application tables / 22 migrations**, integrity `ok`, migration `20261106120000_engine_claim_ledger`. The automatic backup `preview.db.backup-20261107140227` has integrity `ok`, the previous 45/21 schema and two saved runs. An off-host copy and r2 rollback archive remain retained.
- Independent live snapshots used the same serialization before deployment, after deployment and after the run. Before the run, 43 of 45 existing application tables were unchanged; `AdminAccessLog` and `EngineOrigin` changed, alongside the separate migration ledger. After the run, nine official/configuration tables remained identical to the original snapshot: `Company`, `Policy`, `PolicySnapshot`, `PolicyChange`, `PolicyCheckLog`, `Subscriber`, `EngineOutbox`, `EngineSourceContract`, `ExtractionBaseline`.
- The run changed private operational state as expected: `EngineRun`, `EngineTask`, `EngineAttempt`, `EnginePolicyState`, `EngineReview`, `EngineOrigin`, plus administrative access logs. Both previous reports remain completed and private. Zero tasks are active after the run.
- Hosted-preview, Engine 6 and channel flags remain enabled; publication and notification flags remain **0**. No production deployment was performed.

## Bounded administrative run

The administrator session selected **Engine 6 Preview**, company **Apple**, maximum **4**, and left extraction comparison unchecked. The native interface accepted exactly one new run. Its saved report was subsequently opened in the UI and retrieved through the authenticated read-only endpoint.

| Item | Observed result |
| --- | --- |
| Run | `6982c663-2b7b-4191-b8b6-e10bdd60f013` |
| Start | 7 November 2026, 15:00:32.747 UTC / 16:00:32.747 Europe/Rome |
| Completion | 15:00:40.774 UTC, **8.027 seconds** |
| Mode | `preview`, `observe`, `silent`, limit 4, company `apple` |
| Processing | 4/4 policy tasks and 4/4 acquisition tasks completed |
| Apple Privacy Policy | Direct HTTP 200, reviewed boundary contract satisfied, `confirmation_pending` |
| Other three Apple policies | `review`, `source_contract_missing`; no document acquisition was attempted for these sources |
| Analysis and verifier | Not reached; no model comparison or inference performed |
| Ledger | `EngineClaim`: 0; `EngineClaimEvidence`: 0 |
| Official changes and notifications | None |

The completed task count is not four successfully acquired or qualified documents. The one live acquisition reused the content-addressed artifact identity from the earlier capture because the captured content matched; its task records a new observation with HTTP 200 and `notModified=false`. This observation does not belong to the frozen temporal cohort and adds no qualification day to it.

## Remaining limits and retained failures

The first SSH inspection timed out after 45 seconds. Hostinger also showed a network-error notification beside its Completed / Current state. Both are retained with successful later independent checks. Browser interference and a Mac lock delayed the administrative test; the run list was checked before retrying and contains exactly one r3 run.

The run provenance still contains historical labels `stableVersion: 5.2.0` and `previewVersion: pw-engine-6.0.0-alpha.1`. These labels are not current deployment identities; use the exact implementation hash and release manifest. This labelling limitation is recorded without modifying the candidate during qualification.

O1 establishes deployment, migration, private operation and preservation for this candidate. **Source completeness, hosted ledger write behaviour, semantic analysis/verifier accuracy, long-running process recovery and full 500-policy/day operation remain unqualified.** The local r2 rollback initializer rehearsal is retained; acceptance of additive tables by r2 readiness was established by code inspection, not by running a hosted rollback. No paid model calls, infrastructure purchases or new reviewer approvals occurred.

The public research page has not been updated by this operation. A later content-only stable release must describe the new ledger entities and these measured limits while preserving the current private r3 deployment and database.

[Machine-readable closeout](engine-v6-preview-r3-o1-closeout-2026-11-07.json) contains identities, preserved-table hashes and SHA-256 digests of the private raw evidence. Credentials, database copies and authenticated browser screenshots are excluded from Git.
