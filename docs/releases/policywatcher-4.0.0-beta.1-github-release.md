# PolicyWatcher 4.0.0 Beta 1 - Canonical Evidence Foundation - August 2026

Release record date: 19 August 2026

PolicyWatcher 4 starts the transition from policy-centric operational records
to a durable document-evidence platform.

## What changes

- A canonical `Entity -> Document -> Version -> Change -> Provision` graph is
  added without replacing current production reads.
- Stable public identifiers decouple external references from internal UUIDs.
- Provision taxonomy `1.0.0` covers AI training, data sharing, retention,
  arbitration, content licensing and liability.
- One authoritative database query now powers publication-readiness counts in
  Admin, competitive analysis and `/api/v1/publication-readiness`.
- The public metric has JSON Schema v1, manifest discovery, aggregate-only
  boundaries and no-store caching semantics.
- PostgreSQL CI, baseline and rehearsal tooling are available while SQLite
  remains the current production provider.
- Wave 1B adds guarded historical backfill, deterministic reconciliation and
  opt-in transactional dual-write without changing the current read path.
- The promotion candidate pins patched `deepmerge-ts` 8.0.1 after the
  supply-chain gate identified GHSA-ggr8-5vv4-36mx through Prisma config;
  the production dependency audit returns zero known vulnerabilities.

## Upgrade notes

Back up the external SQLite database before deployment. The additive migration
`20260820100000_document_evidence_model` creates five canonical tables. After
startup, Database Readiness must report `31/31` tables and `14/14` migrations.

Run the staging smoke suite against the exact immutable artifact before
promotion. Verify `/api/v1/publication-readiness`, `/developers`, Admin
Publication Readiness and the protected competitive analysis after deployment.

Backfill is never run by install or build. Follow
`docs/document-evidence-backfill-runbook.md` in an approved maintenance window;
enable `POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1` only after apply and
standalone reconciliation both pass.

## Explicit boundaries

The new canonical tables start empty. This release includes but does not
automatically run the backfill or enable dual-write. It does not switch
canonical reads, cut production over to PostgreSQL or activate object storage.
Those production decisions remain separately gated.

Publication readiness is aggregate operational evidence. It is not proof of
exhaustive monitoring, legal review, analysis quality, compliance, service
availability or competitive superiority.

Full audit: `docs/audit-v4.0.0-beta.1.md`

Architecture: `docs/document-evidence-model.md`

Operations: `docs/document-evidence-backfill-runbook.md`

Public API: `docs/public-api-v1.md`

Functional report and 3.x comparison:
`docs/reports/policywatcher-v4-vs-v3-2026-08-20.html`
