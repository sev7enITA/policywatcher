# PostgreSQL portability readiness

Status: implementation-ready for CI and isolated rehearsals; production
cutover is not approved.

## What is now portable

- `prisma/schema.prisma` remains the canonical data model and the active SQLite
  schema for local development and Hostinger production.
- `scripts/database-provider.mjs` derives the PostgreSQL Prisma schema from the
  canonical model. The generated `prisma/postgresql/schema.prisma` is ignored so
  two hand-maintained model definitions cannot drift silently.
- PostgreSQL has an independent migration history under
  `prisma/postgresql/migrations`. This is required because SQLite migration SQL
  cannot be replayed safely on PostgreSQL.
- Prisma generation, validation and migration deployment select the schema from
  `DATABASE_URL`. PostgreSQL migrations additionally require a direct
  `DIRECT_URL`; application traffic may use a pooled `DATABASE_URL`.
- Runtime readiness reports use provider-specific table, migration and storage
  checks. No connection URL or secret is returned to the admin interface.
- Transient write and unavailable-storage classification covers Prisma, SQLite
  and PostgreSQL failure forms.

## CI contract

The `postgresql-portability` job starts an ephemeral PostgreSQL 16 service and:

1. generates and validates the PostgreSQL Prisma client;
2. deploys the dedicated migration history;
3. fails on schema drift between the migrated database and canonical model;
4. exercises relational create/read/update, transaction and cascade-delete
   behavior through Prisma.

The existing quality job continues to validate SQLite, so a change must remain
compatible with both providers.

The same job also executes the complete importer against a generated SQLite
fixture. Operational use with a representative copy is described in the
[SQLite-to-PostgreSQL rehearsal runbook](postgresql-rehearsal.md).

The fixture is now canonical-backfilled and reconciled before import. After
checksum parity is established in PostgreSQL, CI runs the guarded canonical
dual-write smoke directly against the disposable PostgreSQL database and
requires a clean cleanup reconciliation. This covers the Wave 1B write path,
not only schema portability.

## Local isolated rehearsal

Use a disposable PostgreSQL database. Never point these commands at the current
production database.

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/policywatcher_rehearsal?schema=public'
export DIRECT_URL="$DATABASE_URL"
npm ci
npm run db:postgresql:validate
npm run db:postgresql:migrate
npm run db:postgresql:smoke
```

## Production guard

`scripts/prepare-database.sh` continues to route every `file:` URL through the
existing, backup-aware Hostinger SQLite initializer. A PostgreSQL URL fails
closed unless `POLICYWATCHER_POSTGRESQL_CUTOVER_APPROVED=1` is explicitly set.
The current Hostinger environment gate remains SQLite-only, providing a second
barrier against accidental cutover.

Before that guard may be enabled, a separate migration project must provide:

- an inventory and checksum reconciliation from SQLite to PostgreSQL;
- tested backup, point-in-time recovery and rollback procedures;
- a timed staging rehearsal using a representative database copy;
- connection-pool sizing, monitoring and alerting;
- a maintenance/cutover window and named approval owner;
- post-cutover evidence checks and a rollback decision threshold.

## Deliberately out of scope

No production data was copied, transformed or deleted. No workspace, account,
billing or multi-tenancy feature was enabled. Object-storage migration and its
provider abstraction remain a separate package because the current repository
does not yet have a single durable blob boundary to switch safely.
