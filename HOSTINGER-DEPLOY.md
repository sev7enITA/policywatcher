# PolicyWatcher - Hostinger deployment

This is a source deployment package. It intentionally excludes `.next`,
`node_modules`, environment files and SQLite databases.

## PolicyWatcher 4.0.0 Beta 1 deployment wave

This wave adds migration `20260820100000_document_evidence_model`. It creates
the additive `Entity`, `Document`, `Version`, `Change` and `Provision` tables,
stable-public-ID constraints and provision-taxonomy indexes. Wave 1B also ships
guarded backfill, deterministic reconciliation and opt-in transactional
dual-write. None of those data operations run during install or build;
production dual-write remains disabled until the operator sets
`POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1` after a clean backfill.
When the flag is enabled, both managed build and runtime startup execute a
read-only reconciliation gate and fail closed on any error or warning.

Before staging or production:

1. Create and verify a restorable copy of the external SQLite database.
2. Build one immutable artifact from the reviewed release commit and record its
   SHA-256 checksum.
3. Deploy that exact artifact to staging with a representative sanitized copy
   of production data.
4. Run `npm run hostinger:smoke:staging -- --artifact <zip> --base-url
   https://staging.policywatcher.online` with the required staging credentials.
5. Promote only the checksum verified by staging and keep the existing rollback
   artifact plus the pre-migration database copy available.

The staging and production acceptance state for SQLite is:

- Database Readiness reports `ready`, `31/31` tables, `14/14` migrations and
  integrity `ok`.
- `/api/v1/publication-readiness` returns HTTP 200, schema v1, source
  `database`, the five stages in canonical order, `latestCapture` and
  `Cache-Control: no-store`.
- Admin Publication Readiness and the protected competitive analysis show the
  same database-derived values for equivalent scope.
- Before Wave 1B activation, canonical tables may be empty; this is not a
  failed schema deployment and must not trigger an unscheduled backfill.
- Wave 1B activation follows
  `docs/document-evidence-backfill-runbook.md`: pause writes, verify backup,
  dry-run, apply, reconcile, activate the flag, restart, run one controlled
  capture and reconcile again.
- After activation, reconciliation must report `reconciled`, zero errors and
  warnings, and canonical counts equal to expected counts.
- `ALLOW_SEEDED_PUBLIC_DATA` remains unset or false in production.

Rollback restores both the preceding application artifact and the pre-migration
SQLite copy. If only dual-write activation is rolled back, unset the flag and
restart; any subsequent legacy-only writes create a parity gap, so backfill and
reconciliation are mandatory before reactivation. The additive tables may be
left in place only when the preceding application version has been verified to
ignore them. Do not attempt a PostgreSQL cutover, canonical read switch or
object-storage activation as part of this rollback path.

The 14 August 2026 AI P0 and evaluation update replaces the retired Gemini 2.0
fallback with Gemini 3.5 Flash-Lite, enforces provider-side JSON Schema plus
local semantic validation, and adds privacy-minimized AI invocation telemetry.
Gemini 2.5 Flash remains the primary model until the frozen golden-set bake-off
justifies a promotion. This update adds the append-only `AiModelInvocation`
database migration but no environment variable. Back up the external database;
the packaged postinstall/init flow applies the migration before startup. Deploy
only the Hostinger application ZIP; Renderer and Operations Agent are unchanged.
After restart, open `/admin/explainability`, confirm that the telemetry panel is
available, and run one controlled policy scan. The structured analysis must be
complete and any fallback must be recorded as Gemini 3.5 Flash-Lite.

Beta 41 adds a browser-local dashboard experience layer (`Focus`, `Balanced`
and `Explore`), an explicit reduced-motion override and the new ER sitemap
infographic. It does not add a database migration or environment variable.
Deploy through the normal Node.js release flow, then verify the three experience
modes, `Why this interface?`, persistence after reload, keyboard skip link,
reduced motion and `/infographics` on desktop and mobile. Confirm that the
primary workflow remains visible in Focus mode and that source-quality and
publication behavior are unchanged.

Beta 40 added the public PolicyWatcher Civic workspace, now localized at
`/en/associations` and `/it/associazioni`; the legacy `/associazioni` URL is a
query-preserving permanent redirect to the Italian route. Its
7 August global-directory extension. It does not add a database migration or a
new environment variable. The pilot watchlist, review states, global geographic
context and draft digest are stored only in the current browser; shared Evidence
Collections continue to carry public change identifiers only.

For the Beta 40 Civic scope, deploy the Hostinger application ZIP through the normal Node.js release
flow. The separate VPS Renderer and Operations Agent packages are unchanged by
this release. After restart, verify `/en/associations#organizzazioni` and
`/it/associazioni#organizzazioni` on desktop and
mobile, select Italy, France and Spain, open one verification source, validate
the suggestion form without sending it, and confirm that the global setting
updates dashboard region/language defaults. Then confirm that eligible published
records can be added to the local watchlist and that an empty or unavailable
public catalog stays explicit instead of showing demo or private data. Also open
one Evidence Collection handoff before accepting the deployment.

Beta 39 adds end-to-end Renderer release upload to `/admin/vps-services`.
Deploy VPS Operations Agent 0.2 once before using the managed control; the
Agent then accepts bounded HMAC-signed packages from Hostinger and performs
asynchronous install, smoke verification and rollback without manual staging.
Keep `VPS_AGENT_SECRET` identical between Hostinger and the Agent, and keep the
Agent endpoint behind HTTPS. The Admin upload cap is 5 MiB decoded / 7 MiB JSON.

## Required Hostinger configuration

1. Extract the ZIP into the Node.js application directory.
2. Use Node.js 22.
3. Set both `APP_URL` and `NEXT_PUBLIC_APP_URL` exactly to
   `https://policywatcher.online`. Keep `www.policywatcher.online` as a
   redirect-only alias; the application returns a permanent 308 redirect while
   the Hostinger HTTP redirect should point directly to the same non-`www`
   HTTPS origin.
4. Configure `DATABASE_URL` as an absolute writable path outside the extracted
   release directory, for example:

   `file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db`

   If the internal Executive Study is enabled, provision its confidential JSON
   through a private deployment channel outside both the release directory and
   web root, restrict filesystem permissions to the application user, and set
   `POLICYWATCHER_INTERNAL_STUDY_PATH` to that absolute path. Never add this
   payload to Git, the public release ZIP, `public/`, or a client-side asset.

5. Install with `npm ci`. For providers that allow a custom build command, use
   `npm run hostinger:build:staging`; after promotion, use
   `npm run hostinger:build:production`. Hostinger's managed Next.js preset may
   expose only `npm run build`; that command is target-aware and runs the same
   environment gate plus backup-first database preparation whenever
   `POLICYWATCHER_DEPLOYMENT_TARGET` is `staging` or `production`.
6. Set the startup file to `server.js` or use the startup command `npm start`.
7. Do not configure `next start` directly: it bypasses the database readiness
   gate packaged with the release.
8. Restart the Node.js application after replacing the previous release.

The startup log must show the configured database path, `Database schema is
ready` and a `policyInquiries` count before Next.js starts accepting traffic.

Beta 38 serves the complete English and Italian Press Kit packages from the
public GitHub repository. The Hostinger ZIP intentionally excludes every full
`policywatcher-press-package-*.zip`; do not copy those files back into the
application directory. Package sizes and SHA-256 values remain published in
`public/press-kit/package-manifest.json`. Confirm that the committed packages
are available at the commit pinned in the package manifest before deploying the
site.

Beta 37 introduces no database migration. Deploy the Hostinger application ZIP
and the renderer 1.2 VPS ZIP as separate artifacts. Keep `RENDER_USER_AGENT`
unset on the renderer unless an official source requires a documented override;
the recommended mode uses the User-Agent native to Playwright Chromium. No
stealth or WAF-bypass plugin is part of either package.

After the Hostinger restart, verify `/api/v1/manifest`, `/trust`, the public
footer on desktop and mobile, then run one controlled Cron Manager batch. Its
progress should distinguish `[network]` from `[cached/deduplicated]` using the
same `acq:` fingerprint for shared sources. Regional paths must retain different
fingerprints.

When `DATABASE_URL` is available during `npm ci`, the post-install hook applies
the idempotent database initializer before the managed build is published. This
is the primary readiness gate for Hostinger's managed Next.js preset, which
places runtime build files in `/home/USER/domains/DOMAIN/nodejs` and retains the
uploaded source under the sibling `.builds/last-source` directory. The packaged
`server.js` also searches both source layouts when it is used as the entry file.

Beta 23 includes migration `20260730162000_webhook_delivery_pilot`. It adds a
persistent webhook outbox and a per-attempt delivery ledger. The initializer
applies both tables and their indexes additively. Configure
`POLICYWATCHER_WEBHOOK_ENDPOINTS_JSON` only through the Hostinger environment,
store each secret outside the source package, and set
`POLICYWATCHER_WEBHOOK_ALLOWED_ORIGINS` to the exact HTTPS origins permitted for
outbound requests. With no valid active destination, the cycle is a no-op.

The optional scheduled trigger sends `POST /api/cron/webhook-delivery` with
`Authorization: Bearer $API_SECRET`. The route runs one bounded cycle; it is not
a daemon or an availability commitment. The same cycle can be invoked manually
from `/admin/webhook-delivery` by an administrator. Auditors receive read-only
state. Back up the database before deployment and inspect the console after the
first controlled receiver test.

Beta 21 includes migration `20260730043000_source_reliability`. It adds scan-run,
retrieval, remediation and historical-reference records plus an optional
retrieval URL. The migration is additive and the post-install initializer
applies it automatically. Back up the production database before deployment.

After deployment, inspect the safe repair plan with
`npm run db:repair-public-baselines`. Apply only reviewed exact-evidence
promotions with `npm run db:repair-public-baselines -- --apply`, then run a
complete source scan. The repair does not create policy changes, scores or
notifications and it does not promote records without matching successful
retrieval evidence.

The 17 August 2026 source-integrity update adds migration
`20260817090000_source_integrity_control`. After backing up production, deploy
the additive schema, run `node scripts/hostinger-remediate-sources.mjs --dry-run`,
review the Wise US, TikTok and Klarna source decisions, then repeat without
`--dry-run`. Open Source Reliability and run one verification scan. A changed
acquisition endpoint remains `sourceMigrationPending` until a verified capture
establishes its replacement baseline; that transition does not create a policy
change, score or notification.

The 18 August scan-integrity maintenance hardens that transition without adding
a schema migration. The packaged initializer normalizes legacy SQLite text
dates to Prisma epoch milliseconds and recognizes the conservative legacy
`Policy.dataStatus = Configured` default when resolving an already-materialized
initial migration. Archive evidence older than `sourceMigrationRequestedAt`
cannot establish a replacement baseline. Audit date storage without writing
with `node scripts/hostinger-normalize-sqlite-datetimes.mjs`; the initializer
applies the same bounded conversion after its database backup.

Beta 20 adds the Webhook Verification Readiness Kit and does not introduce a
Prisma schema change. Beta 20 installations remain on the Beta 19 migration
level until Beta 21 is installed.

Beta 19 includes migration `20260729153000_public_change_publication_time`. It
adds the publication timestamp used by the public change-event cursor and
backfills existing public changes from their creation time. The post-install
initializer applies it automatically; manual recovery uses the same
`bash scripts/hostinger-init-db.sh` command shown below.

Admin authentication does not depend on the metrics endpoint. A missing
optional metric table can therefore produce a scoped unavailable state, but it
cannot block the complete `/admin` shell.

## Manual recovery if the startup command was previously wrong

From the retained Hostinger source directory, with the same environment
variables used by the Node.js application, run:

```bash
cd /home/USER/domains/DOMAIN/.builds/last-source
bash scripts/hostinger-init-db.sh
```

Then set the Hostinger startup file to `server.js` and restart the application.

## Acceptance check

Paste a controlled, non-personal notice ending in `Il Team MioDottore` and
containing `contatto@miodottore.it` at `/what-changed`. The local summary must
show `MioDottore`, the sender domain `miodottore.it`, and Privacy, Cookie and IA.
Submission must return an `inq_` reference, create a row in
`/admin/inquiries`, increment the open-inquiry counter and, when SMTP is
configured, send the privacy-minimized administrator alert.
