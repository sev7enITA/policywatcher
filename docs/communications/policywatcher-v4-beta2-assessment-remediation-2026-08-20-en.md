# PolicyWatcher 4 Beta 2 turns independent assessment into production controls

Publication status: release follow-up. Immutable source tag and production
deployment verified on 20 August 2026.

20 August 2026 — PolicyWatcher has promoted `4.0.0-beta.2`, the Production
Readiness Hardening release for the v4 Foundation. The update applies the
material findings from three third-party reviews without changing the stable
public evidence identifiers, taxonomy or publication-readiness contract
introduced in Beta 1.

Beta 2 strengthens availability and operational integrity: trusted
client identity now fails closed on managed deployments; source and AI inputs
are bounded; full scans have a durable renewable lease; encrypted exports cover
all 31 application tables; SQLite readiness requires WAL and a five-second busy
timeout; and new or reactivated alert subscriptions require explicit 48-hour
email confirmation.

It also separates admin and investor signing keys, adds global admin-session
revocation, protects all Admin HTML shells, enforces read-only auditor behavior,
introduces a minimal public liveness endpoint and distinguishes data-acquisition
errors from genuine empty evidence states.

The exact artefact passed `11/11` staging checks before checksum-preserving
promotion. The live manifest reports Beta 2, proxy overwrite behaviour is
verified, and database readiness reports all 31 tables and 16 migrations with
SQLite integrity `ok`, WAL and a five-second busy timeout. SMTP receipt
evidence, an independent dynamic test and complete hosting-layer CSP alignment
remain separate claims. PostgreSQL, object storage, canonical reads and
multi-tenant capabilities remain separate gates.

Technical evidence:
`docs/audit-v4.0.0-beta.2-assessment-remediation.md`

Release record:
`docs/releases/policywatcher-4.0.0-beta.2-github-release.md`

PolicyWatcher 4 operating-model infographic:
`public/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`
