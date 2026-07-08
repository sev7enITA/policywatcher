# PolicyWatcher Dataset Confidence Audit - 2026-07-05

## Trigger

The audit was triggered by a mismatch between public timeline entries and
official provider pages. Example: Stripe, Google and other policies appeared in
the Market Pulse timeline with `June 1, 2026` changes, while manual inspection of
the provider sites did not confirm that date. Admin links to Wayback also opened
empty archive-search pages.

## Findings

### 1. Timeline dates came from seeded demo data

Local database state:

- Companies: 16
- Policies: 50
- Policy snapshots: 103
- Policy changes: 53
- PolicyCheckLog rows: 50
- Policies with `ingestionMethod = Seeded`: 50 / 50
- Public-confidence policies after the new gate: 0 / 50
- Public-confidence changes after the new gate: 0 / 53

The bundled seed contains hand-written snapshot text and future-dated changes,
including Stripe and Google records dated `2026-06-01`. Those records are useful
as development fixtures, but they are not source-verified policy changes.

Impact: public timeline, dashboard, comparison, reports, chat context and OG
routes could present seeded analysis as if it were verified evidence.

Severity: critical for public confidence.

### 2. Dataset QA underweighted source evidence

The previous CLI assurance script could pass a seed-only database because hashes,
snapshots and check logs were internally consistent. That checked internal
shape, but not whether the source was retrieved from a real provider page.

Fix: `Seeded` records are now release blockers in both admin Dataset QA and the
CLI dataset assurance script.

### 3. Wayback links were misleading

Two separate problems existed:

- Admin database links encoded the full policy URL after `/web/*/`, producing
  searches such as `https%3A%2F%2Fstripe.com%2Fus%2Fprivacy`.
- Version archive links used seeded snapshot timestamps. For future dates such
  as `2026-06-01`, Wayback cannot have a snapshot, so the link appeared broken.

Fix: Wayback buttons now open raw availability searches and use timestamped
searches only when the timestamp is not in the future. Labels now say
`Wayback search`, not `archived version`.

### 4. VPS renderer is online but is not the root cause

External health check:

- `GET https://render.policywatcher.online/healthz` returned HTTP 200.
- `POST /render` without bearer returned `unauthorized`, which is expected.

The renderer is a fallback path. It appears in logs only when the direct or
HTTP/2 retrieval path does not produce valid policy text. A `[direct]` log entry
therefore does not mean the VPS is missing.

## Implemented Guardrails

- Added `src/lib/publicDataGate.ts`.
- Public APIs now exclude seeded records by default:
  - `/api/companies`
  - `/api/changes`
  - `/api/trends`
  - `/api/matrix`
  - `/api/compare`
  - `/api/chat`
  - `/api/policies/[id]`
  - `/share/[id]`
  - `/change/[id]`
  - `/embed/change/[id]`
  - `/api/og/change/[id]`
  - `/api/report/[policyId]`
- Seeded public data can be re-enabled only with:
  - `ALLOW_SEEDED_PUBLIC_DATA=true`
- Seed output changed from `Available` to `Configured`.
- Existing local seed rows were downgraded from `Available` to `Configured`.
- Admin and policy-detail Wayback links now use source-safe raw searches.
- Dataset QA and CLI assurance now treat seeded source evidence as blockers.
- Public source suspension exposes only a controlled suspension notice and
  minimal metadata for seed-only, anomalous, partial, `Needs Review`, or
  `Unavailable` sources. It does not expose policy text, risk scores, timeline
  events, KPI values, or AI summaries until retrieval evidence is valid.
- Re-baseline protection prevents the first successful fetch after `Seeded`
  ingestion evidence from becoming a false public change event. The system
  replaces the seeded history for that policy, writes one verified baseline
  snapshot, and skips AI scoring and subscriber notifications. `Configured`
  status alone does not trigger destructive re-baseline.
- Snapshot/change rows now carry a persistent `publicEvidence` flag. Public
  APIs, sitemap, digests, share pages, reports, matrix, compare and trends only
  expose change-derived data when this flag is true and the parent policy has at
  least one public-evidence snapshot.
- Archive fallback evidence now persists the Wayback/Common Crawl snapshot
  timestamp into `PolicyCheckLog.archiveTimestamp`; Dataset QA flags archive
  `Available` rows that lack it.
- Text extraction over the 200k cap now marks the source `Partial`, writes only
  check-log telemetry, sends an admin suspension alert, and does not create a
  baseline, snapshot, PolicyChange, AI score or subscriber notification.
- Re-baseline now aborts if any real source check-log evidence, public-evidence
  snapshot, or admin-reviewed change history already exists for that policy.
- `SESSION_HMAC_SECRET` is mandatory and no longer falls back to `API_SECRET`.
- Admin company/policy deletes require server-side destructive confirmation.
- Hostinger packaging excludes SQLite/DB files and existing `*-with-db*.zip`
  packages were moved to `deployment-quarantine/unsafe-with-db/`.
- Manual and scheduled suspensions can now trigger an internal administrator
  email with only source metadata, anomaly reason, transport source, timestamp,
  and a Dataset QA console link.
- Public docs and draft media copy were updated to remove `0 blockers` claims.

## Current Gate Result

`npm run build` passes.

`npm run qa:dataset` intentionally fails on the local seed-only DB:

- Status: `fail`
- Policies: 50
- Blockers: 150 checks across seeded source evidence, missing public-evidence
  snapshots, and latest seeded check-log source
- Warnings: retained private/demo PolicyChange rows and source-fit issues that
  require human review before promotion
- URL follow-up: the historical Plaid legal-hub warning was resolved after this
  audit by using anchor-scoped legal sections; Klarna EU Terms remains a
  deliberate suspension candidate when the official page body is too short for
  evidence-grade publication.

This is the desired result until production or local data is refreshed through
real scans.

## Required Next Step

Run a controlled ingestion refresh with the production renderer configured:

1. Ensure Hostinger has `RENDERER_URL` and `RENDERER_SECRET`.
2. Run `scripts/migrate-urls.ts --dry-run`, then the real URL migration.
3. Run targeted admin cron scans by `companySlug` for remediated companies.
4. Review `PolicyCheckLog.source` distribution and per-strategy diagnostics.
5. Re-run Dataset QA.
6. Promote public timeline/dashboard only when non-seeded source evidence exists.

The platform should not publicly cite timeline dates or risk analyses generated
only from seed fixtures.
