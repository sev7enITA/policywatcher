# Hostinger staging and production promotion

PolicyWatcher releases must not be introduced first on the public production
origin. One immutable Hostinger ZIP is deployed to an independent staging
application, verified, explicitly approved, and only then uploaded unchanged to
production. Repacking, editing or rebuilding after staging invalidates the
verification.

## Environment topology

| Boundary | Staging | Production |
| --- | --- | --- |
| Origin | `https://staging.policywatcher.online` | `https://policywatcher.online` |
| Hostinger website | Independent Node.js web app | Existing production Node.js web app |
| Database | Dedicated sanitized fixture | Restored production evidence database |
| Database example | `file:/home/u847874844/domains/staging.policywatcher.online/policywatcher-staging-data/staging.db` | `file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db` |
| Admin/API/session secrets | Unique staging values | Unique production values |
| SMTP, webhooks, VPS Agent | Unset | Configured only when operationally required |
| Build command | `npm run hostinger:build:staging` | `npm run hostinger:build:production` |
| Startup | `server.js` / `npm start` | `server.js` / `npm start` |

Create `staging.policywatcher.online` as an independent website, not as a
subfolder of production. Hostinger documents both [independent subdomain
websites](https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/)
and [Node.js ZIP deployments](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).
Use Node.js 22 for both applications.

## 1. Build one release candidate

Run the repository quality gates, then package once:

```bash
npm run lint
npm test
npm run build
POLICYWATCHER_ALLOW_DIRTY_PACKAGE=1 \
POLICYWATCHER_ARTIFACT_LABEL=release-candidate \
bash scripts/package-release.sh artifacts/hostinger
```

Record the SHA-256 from the generated `.sha256` file. The release candidate is
the only ZIP that can be tested or promoted.

## 2. Prepare a staging-only database

Never point staging to `production.db`. Never use a raw live database containing
subscriber, inquiry, access-log or operational telemetry data. Start from a
consistent offline SQLite backup and create a minimized copy:

```bash
node scripts/create-staging-database.mjs \
  --source /secure/path/stable-backup.db \
  --output /secure/path/staging.db
```

The sanitizer refuses an active WAL/SHM source, never overwrites its output,
checks SQLite integrity and clears subscribers, inquiries, admin access logs,
press/dashboard metrics, AI invocation telemetry, review decisions and webhook
delivery ledgers. Upload only the resulting `staging.db` to the dedicated
staging data directory with mode `0600`.

## 3. Configure the staging application

Hostinger supports importing a `.env` block or adding variables individually.
Environment changes take effect after Save and redeploy; see Hostinger's
[environment-variable guide](https://www.hostinger.com/support/how-to-edit-or-add-environment-variables-after-deployment/).

```env
POLICYWATCHER_DEPLOYMENT_TARGET=staging
POLICYWATCHER_RELEASE_SHA256=<candidate ZIP SHA-256>
APP_URL=https://staging.policywatcher.online
NEXT_PUBLIC_APP_URL=https://staging.policywatcher.online
DATABASE_URL=file:/home/u847874844/domains/staging.policywatcher.online/policywatcher-staging-data/staging.db
ADMIN_USER=<staging-only username>
ADMIN_PASSWORD=<staging-only password of at least 16 characters>
API_SECRET=<staging-only random value of at least 32 characters>
ADMIN_SESSION_HMAC_SECRET=<staging-only admin-session random value of at least 32 characters>
INVESTOR_SESSION_HMAC_SECRET=<different staging-only investor-session random value of at least 32 characters>
ADMIN_SESSION_VERSION=1
TRUSTED_CLIENT_IP_HEADER=<provider-controlled client-IP header verified in staging>
ALLOW_DATABASE_SEED_ENDPOINT=false
ALLOW_SEEDED_PUBLIC_DATA=false
ADMIN_MUTATION_ALLOW_MISSING_PROVENANCE=false
INVESTOR_MUTATION_ALLOW_MISSING_PROVENANCE=false
ALLOW_DEMO_AI_FALLBACK=false
```

Leave the following unset in staging:

```env
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
POLICYWATCHER_WEBHOOK_ENDPOINTS_JSON=
VPS_AGENT_URL=
VPS_AGENT_SECRET=
```

`GEMINI_API_KEY` is optional in staging. If configured, use AI scans only as a
specific controlled test. Do not configure production cron jobs against the
staging origin.

The staging build command fails closed if the origin, database path, secrets,
trusted client-identity source, release checksum or outbound-delivery boundary
is unsafe. Configure exactly one of `TRUSTED_CLIENT_IP_HEADER` and
`TRUST_PROXY_HEADERS=true`; never both. Staging also displays
a permanent visible banner, returns `X-Robots-Tag: noindex, nofollow, noarchive`
and disallows all crawlers in `robots.txt`.

Database Readiness must report `journalMode=wal`, `busyTimeoutMs>=5000`,
`31/31` tables and `16/16` SQLite migrations. Deployment backups are created
through the SQLite backup API so WAL state is included consistently; do not
replace that step with a raw copy of the main `.db` file.

## 4. Verify the deployed candidate

From the local release workspace, provide staging-only credentials without
putting them on the command line:

```bash
export STAGING_API_SECRET='<staging API secret>'
export STAGING_ADMIN_USER='<staging admin user>'
export STAGING_ADMIN_PASSWORD='<staging admin password>'

npm run hostinger:smoke:staging -- \
  --base-url https://staging.policywatcher.online \
  --artifact artifacts/hostinger/<candidate>.zip
```

The smoke report is bound to the ZIP SHA-256 and checks:

- initial homepage rendering and release identity;
- visible staging identity and search-engine exclusion;
- protected health boundary and a healthy non-empty staging database;
- dedicated admin authentication and database readiness;
- public evidence availability, or an explicit fail-closed empty publication
  state when the sanitized fixture contains no verified public baseline.

Any failure blocks promotion. The report expires after 24 hours.

`npm run hostinger:preflight:staging` validates the staging environment only;
it does not create or refresh this report. The timestamp is produced exclusively
by the successful staging smoke command above.

Complete manual browser checks on desktop and mobile for the homepage, Admin,
Roadmap, Observatory, Knowledge, one policy record and one change/evidence
record. Do not trigger real email, webhook, cron or production renderer actions.

## 5. Approve the exact artifact

After reviewing the automated report and manual checks:

```bash
npm run hostinger:promote -- \
  --artifact artifacts/hostinger/<candidate>.zip \
  --report artifacts/hostinger/<candidate>.zip.staging-verification.json \
  --approve STAGING-TO-PRODUCTION \
  --approved-by '<operator>'
```

The command recomputes the ZIP checksum, validates the report and emits a
promotion record plus these three production values:

```env
POLICYWATCHER_RELEASE_SHA256=<verified SHA-256>
POLICYWATCHER_STAGING_VERIFIED_SHA256=<same verified SHA-256>
POLICYWATCHER_STAGING_VERIFIED_AT=<verification timestamp>
```

## 6. Promote without rebuilding

In the production Hostinger application:

1. Back up the external production database.
2. Restore and review all production environment variables.
3. Add the three promotion values emitted above.
4. Set `POLICYWATCHER_DEPLOYMENT_TARGET=production`.
5. Select `npm run hostinger:build:production` and `server.js`.
6. Upload the exact staging-verified ZIP; do not recreate it.
7. Redeploy and review startup logs before accepting the release.
8. Run the existing protected production-verification panel and a bounded smoke
   check. Roll back if release, database, admin or public evidence readiness is
   not confirmed.

The production build gate rejects an expired verification, mismatched checksum,
staging URL, staging database path, missing admin/session configuration or
unsafe production database location.

Dependency installation deliberately does not evaluate promotion freshness or
initialize the database. Hostinger runs `postinstall` before the selected build
command, so those actions belong to the explicit build and guarded runtime
phases. The production build requires a verification no older than 24 hours;
later restarts of that already-approved exact checksum continue to validate the
environment and matching hashes without retroactively expiring the running
release. A new build or different ZIP always requires a new staging report.
