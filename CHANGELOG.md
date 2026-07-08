# Changelog

## 3.5.1 - 2026-07-05

### Added
- Audit Operations layer for the Confidence track.
- `AdminReviewLog` append-only model for human review actions.
- `DatasetQaIssueReview` model for persistent Dataset QA issue decisions.
- Hostinger-safe inventory initializer (`scripts/hostinger-seed-inventory.mjs`) that creates only monitored company/policy source rows as `Configured` + `Seeded`, without demo snapshots, fake changes, AI output, or public evidence.
- Ordered scraper fallback diagnostics on scrape results so failed scans can explain whether direct, HTTP/2, VPS renderer, Wayback, and Common Crawl were attempted, skipped, rejected, or successful.
- Dataset QA issue actions: mark reviewed, ignore with reason, and reopen.
- Review Log admin page with searchable append-only events and CSV export.
- Dataset QA filtered CSV export for auditor handoff.
- Admin VPS Services dashboard for renderer health checks, configuration gates, and admin-only render smoke tests.
- Fragment-scoped legal-hub extraction for official URLs with anchors, allowing broad provider legal pages to be monitored at the intended policy section instead of as oversized mixed documents.
- Hostinger-safe source remediation script (`scripts/hostinger-remediate-sources.mjs`) that updates corrected source URLs with Node/SQLite only, without requiring Prisma, tsx, npm, or npx in SSH.
- Browser-local dashboard personalization controls for density, view mode, visible sections, and visual accent.
- Re-baseline protection for the first verified fetch after `Seeded` ingestion evidence, preventing placeholder-to-real-text transitions from becoming false PolicyChange events or subscriber notifications.
- Persistent `publicEvidence` gates for policy snapshots and changes, preventing seeded or private historical records from becoming public when a parent policy status changes.
- Archive snapshot timestamp persistence on `PolicyCheckLog` for Wayback and Common Crawl retrieval evidence.
- Public Policy Signals Board (`/leaderboard`) plus `/api/leaderboard`, ranking source coverage, retrieval traceability, public baselines, suspension pressure, and publicEvidence-gated movement without certifying companies or compliance.
- Initial Prisma migration (`20260706213500_init`) so new deployments can use `prisma migrate deploy` instead of schema push.
- Admin access log IP minimization and 90-day retention cleanup wired into digest cron routes.
- Source-backed KPI extraction in Gemini analysis output, with closed allowed values for the 15 governance KPI fields used by public and admin matrices.

### Changed
- Public data endpoints now exclude `Seeded` demo records by default. Set `ALLOW_SEEDED_PUBLIC_DATA=true` only for controlled demo/staging views.
- `ALLOW_SEEDED_PUBLIC_DATA=true` is ignored in production; seeded/demo visibility can no longer be opened by production env drift.
- Dataset QA now treats seeded/demo records as release blockers until they are replaced by direct, HTTP/2, VPS-rendered, Wayback, or Common Crawl retrieval evidence.
- Dataset QA and CLI assurance now flag archive evidence without timestamps, `Available` records truncated at the extraction cap, and history retained only for admin inspection.
- Over-cap retrievals now become `Partial` source suspensions instead of complete baselines, snapshots, changes, AI scores, or subscriber notifications.
- Manual and scheduled scans now classify `Seeded` records as `rebaselined` when the first verified fetch succeeds; the seeded history for that policy is replaced by one verified baseline snapshot without AI scoring. `Configured` status alone is not sufficient to trigger destructive re-baseline.
- Re-baseline now aborts if real source evidence, public evidence snapshots, or admin-reviewed change history already exists for the policy.
- Scan execution now supports `limit` and `companySlug` batch controls from both admin cron and bearer cron endpoints to reduce shared-hosting timeout risk during initial dataset regeneration.
- Limited scan batches now select the least-recently checked policies first, so repeated `limit=5` runs advance through the inventory instead of restarting from the same first records.
- Cron Manager now explains targeted scans and exposes quick company slug controls for current remediation work (`zoom`, `microsoft`, `plaid`, `amazon`, `klarna`).
- Live host-drift detection marks redirected cross-host policy fetches as `Needs Review` instead of accepting them as baseline evidence.
- Live path-drift detection rejects same-host policy URLs that redirect back to the homepage.
- The policy extractor now avoids generic `.container`/`div` overlap that could duplicate text before hashing.
- Weekly/monthly digests, sitemap, share pages, policy details, matrix, compare, trends, reports, and company APIs now require public-evidence gates before exposing change-derived data.
- Monthly digest delivery is limited to explicit digest subscribers instead of all active subscribers.
- Admin company and policy deletes now require server-side destructive confirmation payloads in addition to UI confirmation.
- Admin session signing now requires `SESSION_HMAC_SECRET`; it no longer falls back to `API_SECRET`.
- Hostinger packaging now copies only `prisma/schema.prisma` and excludes SQLite/DB files from release archives.
- Prisma runtime and CLI now share `DATABASE_URL`; production SQLite can live outside the extracted app root, and admin/health diagnostics report missing or unwritable DB paths instead of failing as an opaque login issue.
- Added `scripts/hostinger-init-db.sh` and included operational scripts in the Hostinger package so schema initialization, repair, backfill, and Dataset QA can run after deploy.
- Empty production databases now have a documented two-step bootstrap: initialize schema, then initialize source inventory; the first real Cron Manager scan establishes verified baselines in batches rather than publishing seeded/demo records.
- Initial `Seeded` re-baseline scans no longer use the inventory bootstrap timestamp as the archive freshness floor; this prevents valid Wayback/Common Crawl baseline evidence from being rejected simply because the database was initialized after the archive snapshot.
- Company cards with a verified baseline but no source-verified policy change now display baseline/source-verification status instead of the misleading default `Low (1/10)` risk score or "No policy registered yet" copy.
- Cron Manager now exposes per-policy strategy evidence in the live log and last-scan table, including each retrieval strategy outcome, HTTP status where available, rejection/failure reason, and the next fallback selected.
- Cron Manager now renders the full company baseline as selectable scan targets, with state diamonds for selected, verified, review-needed, pending, and no-policy companies instead of a hardcoded remediation shortcut list.
- Cron Manager now links operational targeting to Company Registry for adding new companies and policy sources; new entries remain non-public until a verified scan establishes evidence.
- Added a separate VPS Operations Agent package for renderer health, fixed smoke checks, backups, checksum-verified local package updates, rollback, lock-state handling, and capped operation logs.
- Admin VPS Services now monitors both the renderer and the optional operations agent, with admin-only controls for agent smoke, backup, verified update, rollback and capped logs.
- Admin-created policy records now start as `Configured` + `Seeded` and write a `PolicyCheckLog` entry, preventing newly added sources from being treated as public evidence before first successful retrieval.
- Re-baseline eligibility now checks existing source-evidence logs and public baselines before running, preventing already-verified sources from being misclassified as seeded re-baseline errors during later remediation scans.
- Scraper diagnostics now distinguish `partial` captures from accepted evidence, so over-cap sources such as broad legal hubs are shown as incomplete and suspended rather than as successful trusted baselines.
- Scraper validation now requires more substantive policy text before accepting a page, preventing short placeholder legal pages from becoming public evidence.
- The extraction cap was raised for legitimate long official policies, allowing the current Microsoft Privacy Statement to be stored as complete evidence while still suspending oversized mixed legal hubs.
- Source remediation updated official URLs for Zoom, Microsoft, Plaid, AWS DPA, and Klarna. Plaid now uses anchor-scoped sections, AWS DPA uses focused AWS documentation instead of broad service terms, and Klarna EU Terms remains intentionally suspended when the official page body is too short for evidence-grade publication.
- Source URL remediation now returns changed records to `Configured` or `Needs Review` and writes a `source_url_remediation` check-log entry, so previous evidence is not treated as current evidence for the new URL until a fresh scan succeeds.
- Archive freshness guards now require an existing public baseline before using `lastSuccessfulCheckDate` as the floor, preventing technical bootstrap check dates from blocking first-baseline archive evidence.
- Added admin authentication access logging (`AdminAccessLog`) with event, username, role, IP, user-agent, path, method, and detail fields for operational auditing and login debugging.
- Added `/admin/access-logs` and `/api/admin/access-logs` for administrator-only inspection/export of access events.
- Admin login now returns an explicit configuration error when `SESSION_HMAC_SECRET` is missing instead of creating an invalid session cookie and silently returning to the login page.
- Admin layout now redirects to login only on 401; database/configuration failures are displayed as operational errors rather than masked as password issues.
- Wayback links in admin/database and policy details now open raw Wayback availability searches instead of encoded or future timestamp URLs.
- Roadmap now distinguishes delivered controls, active 3.5.1 work, and later planned capabilities.
- Admin visible version strings updated to `3.5.1`.
- Dataset QA page now defaults to open issues and shows open/reviewed/ignored counts.
- Terms access now opens with an operational context step, then requires explicit acceptance of use boundaries in a second step.
- The prominent dashboard-top Confidence disclaimer banner has been removed from the default working view.
- Scraper URL migration now scopes updates by company and policy name, updates all matching jurisdiction rows, and supports `--dry-run` before touching production data.
- VPS renderer hardening now validates browser-triggered redirects and subresource requests, not just the initial render URL.
- Public documentation and site assets refreshed for the 3.5 Confidence maintenance release: `/trust`, `/security`, `/showcase`, `/roadmap`, How To, About, methodology, README, and third-party validation notes now describe retrieval evidence, renderer boundaries, source-fit QA, and non-certification limits.
- Showcase quality section now lists the current QA control groups without static score-like percentages: source fit, retrieval cascade, public evidence gate, re-baseline guard, drift control, evidence logs and review trail.
- Methodology page and in-app modal now document strategy diagnostics, source suspension, seed-only re-baseline eligibility, public evidence gates, Dataset QA control groups, and renderer limits using evidence-first wording.
- Showcase, Trust, Footer, Command Palette, sitemap, methodology, and README now expose the Policy Signals Board as an evidence-only transparency view.
- Leaderboard dates now render in UTC to avoid server/client timezone drift.
- Renderer bearer-token verification now uses timing-safe comparison.
- VPS Operations Agent requests use HMAC-SHA256 signatures with timestamp and nonce replay protection; mutating operations are serialized with a global lock and never accept arbitrary URLs, shell commands or package download URLs.
- Manual and scheduled scrape error handling now returns/stores correlation references instead of exposing raw exception messages to clients, persistent check logs, progress output, or admin suspension emails.
- New policy changes no longer inherit stale KPI fields from older public changes. Until KPI extraction is explicitly regenerated from current source evidence, the 15 KPI fields are set to `Not assessed`.
- Runtime Prisma configuration now imports only database URL resolution; filesystem diagnostics are isolated in async health/admin diagnostics.
- `/api/seed` no longer runs `prisma db push --accept-data-loss`; the Hostinger initializer now prefers Prisma migrations and baselines the initial migration for existing SQLite databases when needed.
- New source-verified policy changes now persist normalized KPI fields from Gemini instead of forcing all 15 KPI values to `Not assessed`.
- Public KPI matrix now withholds companies that have source-verified baselines but no source-backed KPI assessment yet, avoiding public tables filled with unassessed placeholder values.
- Admin KPI Audit now treats `Not assessed` as a neutral pending state, not as a high-risk or non-compliant value.
- Admin VPS Services now validates `RENDERER_URL` and `VPS_AGENT_URL` as absolute HTTP(S) service URLs and reports invalid configured values clearly.
- Renderer and VPS Operations Agent entrypoint detection now resolves real paths, so versioned `current` symlinks do not prevent services from starting their HTTP listeners.

### Notes
- Current local seed-only databases intentionally fail Dataset QA source-evidence checks until a fresh scan produces non-seeded retrieval logs.
- Codecov external upload still requires repository secret `CODECOV_TOKEN`; the GitHub coverage workflow remains green and produces the coverage artifact without that secret.
- The unauthenticated debug environment endpoint from commit `ec2f699` has been removed from `main` by commit `f453b4a` and is excluded from deployment packages. If commit `ec2f699` was deployed, rotate `ADMIN_PASSWORD`, `SESSION_HMAC_SECRET`, and `API_SECRET`.

## 3.5.0 - 2026-07-02

### Added
- Truth & Confidence Layer for policy data status, ingestion metadata, last-check timestamps, and check-log evidence.
- `PolicyCheckLog` model and backfill/repair scripts for existing datasets.
- Dataset assurance command (`npm run qa:dataset`) covering hashes, version records, check logs, data statuses, timestamps, URL duplicates, and AI JSON icon hygiene.
- Trust & Quality public page (`/trust`) with GitHub Quality Gate, CodeQL, OpenSSF Scorecard, OpenSSF Best Practices passing badge, targeted reliability coverage workflow status, Sonar/Codecov readiness, live-header report links, and explicit non-certification boundary.
- GitHub Actions workflows for quality gate, CodeQL, OpenSSF Scorecard, targeted Vitest reliability coverage, and SonarQube Cloud readiness.
- Vitest targeted reliability tests and coverage for auth/session, rate limiting, confidence metadata, diff parsing, subscriber preferences, and export/report utilities.
- Open-source governance files: `SECURITY.md`, `CODE_OF_CONDUCT.md`, and third-party validation setup guide.
- OpenSSF Best Practices project `13465` badge integration for README and `/trust`.
- Highlighted badge section on `/trust` and README to make obtained/public quality evidence easier to inspect.
- Public State of the Art reports in `docs/platform-state-of-art-2026-07-02.md` and `docs/platform-state-of-art-2026-07-02.it.md`.

### Changed
- Package and visible build strings updated to `3.5.0` / `3.5.0 Confidence`.
- How To, About/Overview, Methodology, Showcase, Trust, Terms Gate, share/change pages, PDF disclaimer, footer, SEO metadata, and admin copy updated to use evidence-first, non-certification wording.
- Showcase page repositioned from a 3.0 feature map to a 3.5 Confidence overview.
- Security headers refined, including nonce-based CSP, `default-src 'none'`, strict `object-src`/`base-uri`/`form-action`/`frame-ancestors`, `strict-origin-when-cross-origin`, and removal of obsolete `X-Frame-Options: ALLOWALL` from embed responses.
- Added an npm override forcing `postcss@8.5.16` so the transitive Next.js PostCSS copy is no longer vulnerable to CVE-2026-41305 / GHSA-qx2v-qp2m-jg93.
- Encrypted backup payload version updated to `3.5.0`.

### Known QA Notes
- Dataset QA currently reports one non-blocking warning: Plaid maps several US/EU policy records to the same normalized legal hub URL (`https://plaid.com/legal`). Confirm whether this is intentional or refine source URLs if Plaid exposes more specific anchors/pages.

## 3.0.1 - 2026-07-02

### Added
- Bilingual 3.5 Roadmap page (`/roadmap`) outlining the Intel-inspired development cadence (Feature Drop vs. Confidence Release) and milestones P0-P7.
- Interchangeable Navigation Framework supporting three user-controlled layouts: Bottom HUD Dock, Spotlight Command Bar, and Forensic Left Sidebar.
- Dynamic Layout Selector widget on the bottom-right of the dashboard (persisting user preferences to `localStorage`).
- Custom CSS-only localized hover tooltips on all header actions.
- Responsive mobile bottom tabs for Bottom HUD layout, and left drawer slide-out for Left Sidebar layout.

### Changed
- Refactored `src/app/page.tsx` to conditionally render logo headers and integrate the new `Navigation` component.
- Updated Global Footer build string to `v3.0.1`.
- Package version updated to `3.0.1`.

## 3.0.0 - 2026-06-26

### Added
- Public policy-change timeline.
- Stable public change permalinks at `/change/[id]`.
- Embeddable change widgets at `/embed/change/[id]`.
- Dynamic Open Graph image route for social previews.
- Dynamic sitemap route.
- DiffViewer components for richer policy-change inspection.
- Admin encrypted backup export and verification tools.
- Admin decrypt-backup and export-encrypted API routes.
- Admin Dataset QA dashboard and API for source-fit, dataset integrity, freshness, KPI coverage, regional-impact coverage, and subscriber hygiene checks.
- Admin Dataset QA Status panels in the admin dashboard and Dataset QA page.

### Security
- Removed the default API secret fallback from the cron trigger script.
- Added timing-safe bearer token comparison.
- Hardened policy retrieval against DNS rebinding and malicious redirect drift with socket-pinned HTTP/1.1/HTTP/2 fetches, Public Suffix List based host-coherence checks, conservative IPv6 special-range blocking, and sanitized renderer errors.
- Tightened HTTP/2 fallback cleanup so timeout/error paths close and destroy the H2 session, and replaced raw H2 exception diagnostics with fixed error tokens.
- Added optional `SESSION_HMAC_SECRET` separation for admin session cookies.
- Made proxy-header trust explicit for rate limiting.
- Rendered Live Assistant AI responses through safe markdown rendering instead of raw HTML injection.
- Stopped returning subscriber records and unsubscribe tokens from the public subscription API.
- Added subscription preference allowlists and unsubscribe rate limiting.
- Escaped dynamic email-template values and restored weekly digest unsubscribe tokens.
- Added SSRF-oriented outbound URL validation for scraper fetches and redirects.
- Replaced query-string authentication on health/seed diagnostics with bearer auth.
- Kept the database seed endpoint disabled in production and behind an explicit development flag.
- Raised encrypted-backup password minimum length to 12 characters.
- Changed backup verification to return only backup metadata and summary counts.
- Escaped JSON-LD script data on public change pages.
- Disabled the Next.js `X-Powered-By` response header.

### Changed
- Package version updated to `3.0.0`.
- Backup payload version updated to `3.0.0`.
- Set an explicit Turbopack project root to avoid workspace-root ambiguity on hosts with multiple lockfiles.
- Replaced the admin jurisdiction map dependency on `react-simple-maps` with direct `d3-geo`/TopoJSON rendering to support clean React 19 installs on Hostinger.
- Moved map TypeScript declarations required by `next build` into production dependencies for hosts that build with dev dependencies omitted.
- Added a public header entrypoint for `/timeline` and a home-page Market Pulse timeline fed by real `/api/changes` data.
- Aligned the How To onboarding modal with the public light theme.
- Activated the regional heatmap in policy details using real regional-impact rows.
- Added an industry-average benchmark option to the Compare radar chart.
- Added Dataset QA source-fit checks for jurisdiction/localization mismatches in monitored policy URLs.
- Documented the source-selection hierarchy in Methodology and README: canonical Global English sources first, market-specific sources for EU/US analysis, localized pages flagged unless explicitly justified.
- Updated PayPal EU/US privacy and user-agreement sources to canonical English LegalHub URLs in the bundled dataset.
- Cleaned project-wide ESLint errors and warnings ahead of the 3.0 commit.
- README updated with release 3.0 highlights.
- In-app changelog updated to list release 3.0 as the current release.

### Deployment Notes
- Rotate production `API_SECRET` before deploying this release.
- Set `NODE_ENV=production`.
- Keep `/api/seed` disabled in production. Use `ALLOW_DATABASE_SEED_ENDPOINT=true` only for controlled local or staging setup.
- If Hostinger overwrites forwarding headers, set `TRUST_PROXY_HEADERS=true`; otherwise leave it unset and prefer a provider-controlled client-IP header via `TRUSTED_CLIENT_IP_HEADER`.
- Verify security headers and CSP after deployment because the hosting proxy may override application headers.
