# Changelog

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
- Admin Dataset Quality Seal panels in the admin dashboard and Dataset QA page.

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
