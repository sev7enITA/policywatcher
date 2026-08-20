# Document evidence backfill, reconciliation and dual-write

Status: implementation complete; production execution requires an approved maintenance window and a restorable backup.

## Safety contract

- Backfill defaults to dry-run and performs no writes.
- Apply requires the exact one-shot acknowledgement `POLICYWATCHER_DOCUMENT_EVIDENCE_BACKFILL_ACK=I_ACKNOWLEDGE_DOCUMENT_EVIDENCE_BACKFILL`.
- Dual-write is disabled unless `POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1` is set.
- When enabled, canonical projection runs inside the same Prisma transaction as the legacy mutation. Projection failure rolls back both sides.
- Managed build and runtime execute a read-only activation gate. If the flag is `1` and reconciliation has any error or warning, deployment/startup fails closed before serving traffic.
- The smoke command refuses production and accepts only database targets whose URL contains `rehearsal`, `staging`, `sandbox`, `test` or the fixed CI database marker.
- Reports may contain internal legacy identifiers. Store them as restricted operational evidence; do not publish them.

## Rehearsal on a copy

Create a consistent, sanitized database copy using the existing staging-copy procedure. Apply all migrations to that copy, then run:

```bash
export DATABASE_URL='file:/absolute/path/policywatcher-rehearsal.db'
npm run db:document-evidence:backfill -- --report artifacts/document-evidence/dry-run.json
```

Proceed only when `status` is `ready` and `sourceIssues` is empty. Apply and immediately reconcile:

```bash
export POLICYWATCHER_DOCUMENT_EVIDENCE_BACKFILL_ACK='I_ACKNOWLEDGE_DOCUMENT_EVIDENCE_BACKFILL'
npm run db:document-evidence:backfill -- --apply --report artifacts/document-evidence/apply.json
npm run db:document-evidence:reconcile -- --report artifacts/document-evidence/reconciliation.json
```

Repeat the apply with a new report path. Before and after canonical counts must be identical and both reconciliation results must contain zero errors.

Exercise the transactional path only on the rehearsal target:

```bash
export POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1
export POLICYWATCHER_DOCUMENT_EVIDENCE_SMOKE_ACK='I_ACKNOWLEDGE_DOCUMENT_EVIDENCE_SMOKE_WRITES'
npm run db:document-evidence:smoke -- --report artifacts/document-evidence/dual-write-smoke.json
```

The smoke creates a synthetic company, configured document, verified baseline and detected change with six provisions. It verifies public ID formats and bridge counts, deletes the fixture on both sides and requires a clean final reconciliation.

## Production activation sequence

1. Pause Cron Manager, on-demand scrape operations and admin source mutations.
2. Verify a restorable database backup and record its checksum and owner.
3. Deploy the additive schema with dual-write still unset.
4. Run dry-run and retain the restricted report. Any duplicate hash, text/hash mismatch, cross-policy relationship or stable-ID conflict is a stop condition.
5. Run the acknowledged apply. It commits one company or policy graph at a time; a failed run is safely resumable because projection is idempotent.
6. Run standalone reconciliation. Require `status=reconciled`, `errorCount=0`, `warningCount=0` and canonical counts equal to expected counts.
7. Set `POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1` in the secret store and restart the application.
8. Resume one controlled capture, then rerun reconciliation before resuming scheduled scans and admin mutations.
9. Retain the backfill audit log, reports, backup reference, application artifact checksum and operator decision together.

Do not run the synthetic smoke against production. Do not activate canonical reads as part of this procedure.
Suspend legacy-only repair and remediation scripts during activation. If one is intentionally run after dual-write activation, rerun the guarded backfill and reconciliation before accepting parity.

The managed build and `server.js` rerun the activation gate automatically. They report aggregate counts and bounded issue codes only; legacy IDs and issue details are not emitted to startup logs.

## Failure and rollback

- Before dual-write activation: keep legacy reads/writes authoritative, correct the reported source or identity issue and rerun apply. Previously committed policy graphs are safe to retain.
- After activation: a canonical projection error rolls back the corresponding legacy transaction. Disable the flag and restart only if operations must continue on legacy alone; this deliberately creates a parity gap, so backfill and reconciliation are mandatory before re-enabling.
- For schema or data corruption, stop writes and restore both the prior application artifact and the verified pre-wave database backup.
- Never repair a stable public ID by overwriting it. Investigate the bridge conflict and record a correction decision.

## Reconciliation contract

The report validates:

- one bridged Entity per Company and one bridged Document per Policy;
- deterministic stable IDs and immutable canonical keys;
- snapshot text/hash integrity, content payload presence, source URL, timestamps and publication flags;
- baseline and detected Change relationships, summaries and publication timestamps;
- six taxonomy 1.0.0 Provision projections for each detected legacy change;
- missing and orphaned bridged rows;
- expected versus actual counts.

Canonical objects without a legacy bridge are not silently deleted by normal reconciliation. The current release does not create such objects through public product flows.
