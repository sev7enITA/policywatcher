# SQLite-to-PostgreSQL rehearsal runbook

This procedure tests the importer on an isolated PostgreSQL database. It does
not modify SQLite, empty or replace production, or authorize a cutover.

## Safety contract

- The SQLite source is opened read-only and copied with SQLite's online backup
  API before any transformation.
- By default a second working copy removes operationally sensitive tables,
  including subscribers, inquiries, access logs, webhook attempts, telemetry
  and investor-access grants/events.
- The PostgreSQL database name must contain `rehearsal`, `staging`, `test`,
  `ci`, `sandbox` or `preview`, and the schema must be `public`.
- The importer aborts before migrations when any application table in the
  target already contains rows. It never truncates or resets a target.
- Target writes require an exact, temporary acknowledgment value.
- The final JSON contains table counts and SHA-256 reconciliation values, not
  row content, source paths, connection URLs or credentials.

## Inspect the plan

Plan mode performs no copy, connection, migration or report write:

```bash
export REHEARSAL_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/policywatcher_rehearsal?schema=public'
npm run db:postgresql:rehearsal -- \
  --plan \
  --source /secure/backups/policywatcher-stable.db
```

Connection URLs are accepted only through environment variables so npm output,
process arguments and shell history do not echo credentials.

## Run the default sanitized rehearsal

Prefer a stable, access-controlled SQLite backup. The tool still creates its
own transactionally consistent temporary copy and removes it on completion.
The supplied backup must already match the current PolicyWatcher schema; the
rehearsal never migrates or repairs its read-only source.

```bash
export REHEARSAL_DATABASE_URL='postgresql://APP_USER:PASSWORD@POOL_HOST:5432/policywatcher_rehearsal?schema=public'
export REHEARSAL_DIRECT_URL='postgresql://MIGRATION_USER:PASSWORD@DIRECT_HOST:5432/policywatcher_rehearsal?schema=public'
export POLICYWATCHER_REHEARSAL_ACK='I_UNDERSTAND_THIS_WRITES_TO_A_DISPOSABLE_POSTGRESQL_DATABASE'

npm run db:postgresql:rehearsal -- \
  --source /secure/backups/policywatcher-stable.db \
  --report artifacts/postgresql-rehearsals/representative-copy.json
```

The run:

1. checks SQLite integrity and creates a consistent read-only-source backup;
2. sanitizes the working copy;
3. generates the PostgreSQL Prisma client;
4. confirms that the target has no application rows;
5. deploys the independent PostgreSQL migration history;
6. imports all scalar fields in foreign-key-safe order within one transaction;
7. compares counts and deterministic row digests for every model;
8. runs create/read/update/cascade-delete application smoke checks;
9. regenerates the local SQLite Prisma client and destroys temporary copies.

The populated PostgreSQL rehearsal database is deliberately retained for
application-level review. Dispose of it through the database provider only
after the evidence review; the importer never drops databases.

## Sensitive-data exception

Full-fidelity import is exceptional. Use only an access-controlled environment
with approved retention and residency. It requires both acknowledgments:

```bash
export POLICYWATCHER_REHEARSAL_DATA_ACK='I_APPROVE_SENSITIVE_DATA_IN_THIS_ISOLATED_REHEARSAL'
npm run db:postgresql:rehearsal -- \
  --include-sensitive \
  --source /secure/backups/policywatcher-stable.db \
  --report artifacts/postgresql-rehearsals/full-fidelity.json
```

## Interpreting the report

`verdict: "go"` means that this run completed, every table matched by count and
digest, the application smoke test passed and the SQLite client was restored.
Any mismatch or failed stage produces `no-go` and a bounded diagnostic code.

Even `go` does not prove load capacity, point-in-time recovery, rollback time,
data residency or production availability. Those remain separate production
gates.
