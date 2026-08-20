# PolicyWatcher 4.0.0 Beta 2 - Production Readiness Hardening - August 2026

Record date: 20 August 2026

Status: promoted. Immutable source tag `v4.0.0-beta.2` and production deployment
verified on 20 August 2026.

PolicyWatcher 4 Beta 2 applies the material findings from three independent
Foundation Beta assessments while retaining the canonical evidence model.

## Highlights

- fail-closed trusted client identity and route-specific public rate limits;
- bounded scraper, archive, chat and TTS inputs with bounded AI output;
- constant-memory canonical activation verification;
- durable full-scan lease, renewal, overlap rejection and stale recovery;
- distinct admin/investor session keys and global admin-session revocation;
- subscriber double opt-in with a rotated 48-hour token and timestamped consent evidence;
- complete 31-table versioned encrypted export with legacy verification;
- SQLite WAL, busy-timeout readiness and WAL-consistent deployment backups;
- proxy protection for all Admin shells, read-only auditor semantics, minimal
  public liveness, language synchronization and deferred dashboard modals.
- explicit dashboard acquisition errors with retry plus root loading/error
  boundaries, so transport failure is not presented as an empty evidence state.

## Upgrade notes

Apply SQLite migrations `20260820130000_scan_run_lifecycle` and
`20260820133000_subscriber_double_opt_in`. Database Readiness must report
`31/31` tables and `16/16` migrations.

Replace the legacy shared session secret with three mutually distinct values:
`API_SECRET`, `ADMIN_SESSION_HMAC_SECRET` and
`INVESTOR_SESSION_HMAC_SECRET`. Configure `ADMIN_SESSION_VERSION` and exactly
one verified client-identity source.

New and reactivated subscribers remain inactive until confirmation. Existing
active rows are not disabled and no historical confirmation timestamp is
invented.

## Promotion evidence

The final artefact passed `11/11` staging controls and the identical checksum
was promoted to Hostinger production after a database backup. The public
manifest reports `4.0.0-beta.2`; minimal liveness is active; proxy overwrite
behaviour was verified in staging and production; and the protected database
check reports `31/31` tables, `16/16` migrations, integrity `ok`, WAL and a
five-second busy timeout.

Source verification passed `1,034/1,034` tests, TypeScript, ESLint and the
Next.js production build. Source tests, deployment checks and independent
testing remain separate evidence classes.

## Boundaries

SMTP receipt evidence, an independent dynamic test and complete hosting-layer
CSP alignment are not asserted by this release record.

PostgreSQL cutover, object storage, canonical reads, workspaces, accounts,
billing and multi-tenancy remain separate gates.

Full remediation audit:
`docs/audit-v4.0.0-beta.2-assessment-remediation.md`

Release communications:
`docs/communications/policywatcher-v4-beta2-assessment-remediation-2026-08-20-en.md`
and
`docs/communications/policywatcher-v4-beta2-assessment-remediation-2026-08-20-it.md`

PolicyWatcher 4 operating-model infographic:
`public/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`

Editable source and generation disclosure:
`docs/media/policywatcher-v4-beta2-value-2026-08-20/`
