# PolicyWatcher 4.0.0 Beta 1 release audit

Release: `4.0.0-beta.1` - Canonical Evidence Foundation

Audit date: 19 August 2026

Promotion update: the reviewed Foundation Beta source was promoted on GitHub at
commit `13b3b61f20e78c6f56df93bae4af8d592c0712f0` and published as prerelease
`v4.0.0-beta.1` on 20 August 2026. The Hostinger deployment, production
backfill, dual-write activation, canonical read switch, PostgreSQL cutover and
object-storage activation remain separate production gates.

## Audited scope

- additive `Entity -> Document -> Version -> Change -> Provision` Prisma model;
- deterministic stable public identifiers;
- provision taxonomy `1.0.0` for AI training, data sharing, retention,
  arbitration, content licensing and liability;
- SQLite migration `20260820100000_document_evidence_model` and aligned
  PostgreSQL baseline;
- one database-derived publication-readiness service reused by Admin,
  competitive analysis and the public API;
- `/api/v1/publication-readiness` contract, JSON Schema, manifest discovery,
  documentation and deployment verification;
- provider-neutral database preparation, PostgreSQL CI and rehearsal tooling.

## Release boundary

> Addendum Wave 1B: backfill, reconciliation and opt-in dual-write have since
> been implemented and rehearsed locally without touching production. The
> production execution and read switch remain gated. See
> `docs/audit-v4.0.0-beta.1-wave-1b.md`.

This release introduces the canonical schema without activating it as the
operational source of truth. Canonical tables start empty. Legacy policy,
snapshot and change tables continue to serve production reads and writes.

The original foundation release did not authorize:

- legacy-to-canonical backfill;
- dual-write or canonical read switching;
- PostgreSQL production cutover;
- object-storage activation;
- account, workspace, billing or multi-tenant persistence.

Each item requires a separate rehearsal, reconciliation and rollback decision.

## Contract controls

- Public IDs are deterministic, prefixed and independent from internal UUIDs.
- Taxonomy identifiers and version are centralized in code.
- Publication readiness uses one server-side database query and returns five
  ordered stages plus latest successful capture.
- Missing database measurements remain unavailable and are not converted to
  zero.
- The public payload is aggregate-only, rate-limited, CORS-readable and
  `Cache-Control: no-store`.
- JSON Schema is published at `/schemas/publication-readiness/v1`.

## Production acceptance

Promotion requires all of the following:

1. a reviewed clean release commit and immutable artifact checksum;
2. a restorable production SQLite backup;
3. staging rehearsal with a representative sanitized database copy;
4. Database Readiness `ready`, `31/31` tables, `14/14` migrations and integrity
   `ok`;
5. passing publication-readiness contract smoke check;
6. promotion of the exact staging-verified checksum within the configured
   promotion window;
7. post-deploy verification of the public endpoint, Admin metric and protected
   competitive comparison.

Local automated verification establishes source and contract readiness only.
It does not substitute for the staging rehearsal, backup restore proof or live
post-deploy checks.

## Local verification result

The 19 August 2026 release-candidate workspace passed:

- Vitest: 152 files and 991 tests;
- TypeScript: `tsc --noEmit`;
- ESLint: complete repository lint;
- Next.js 16.2.11 production build, including static generation of
  `/schemas/publication-readiness/v1`;
- focused PostgreSQL portability, Hostinger gate, publication-readiness,
  production-verification and public-surface contracts;
- independent Developers-page evaluation after one responsive-layout revision:
  `PASS`;
- Hostinger packaging integrity and required-entry verification for a local
  `4.0.0-beta.1` workspace-snapshot artifact.

This workspace-snapshot artifact remains historical verification evidence and
is not itself promotable. The later reviewed clean source commit and GitHub
release do not replace the staging rehearsal, exact deployment checksum or
live post-deploy checks described above.

## Residual risks

- The production corpus is not yet represented in canonical tables.
- Inline document content remains available during the storage transition;
  `contentRef` is only the provider-neutral future locator.
- PostgreSQL tooling readiness does not establish production database
  performance, backup recovery or cutover safety.
- Aggregate readiness counts do not prove source completeness, legal review,
  analytical quality or continuous availability.
