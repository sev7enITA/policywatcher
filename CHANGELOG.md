# Changelog

## 3.5.1 - 2026-07-02

### Added
- Audit Operations layer for the Confidence track.
- `AdminReviewLog` append-only model for human review actions.
- `DatasetQaIssueReview` model for persistent Dataset QA issue decisions.
- Dataset QA issue actions: mark reviewed, ignore with reason, and reopen.
- Review Log admin page with searchable append-only events and CSV export.
- Dataset QA filtered CSV export for auditor handoff.

### Changed
- Roadmap now distinguishes delivered controls, active 3.5.1 work, and later planned capabilities.
- Admin visible version strings updated to `3.5.1`.
- Dataset QA page now defaults to open issues and shows open/reviewed/ignored counts.

### Notes
- Codecov external upload still requires repository secret `CODECOV_TOKEN`; the GitHub coverage workflow remains green and produces the coverage artifact without that secret.

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
