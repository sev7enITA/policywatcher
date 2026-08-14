# PolicyWatcher - Hostinger deployment

This is a source deployment package. It intentionally excludes `.next`,
`node_modules`, environment files and SQLite databases.

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

Beta 40 added the public `/associazioni` PolicyWatcher Civico workspace and its
7 August global-directory extension. It does not add a database migration or a
new environment variable. The pilot watchlist, review states, global geographic
context and draft digest are stored only in the current browser; shared Evidence
Collections continue to carry public change identifiers only.

For the Beta 40 Civic scope, deploy the Hostinger application ZIP through the normal Node.js release
flow. The separate VPS Renderer and Operations Agent packages are unchanged by
this release. After restart, verify `/associazioni#organizzazioni` on desktop and
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

5. Install with `npm ci` and build with `npm run build`.
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
