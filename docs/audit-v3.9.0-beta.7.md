# PolicyWatcher 3.9.0 Beta 7 release audit

- Release: `3.9.0-beta.7`
- Date: 27 July 2026
- Scope: Evidence Newsroom usability, privacy-minimized measurement and release assurance
- Browser extension: unchanged at `3.8.3-beta.3`

## Delivered behavior

- Mobile Press Kit readers see Fast Facts before long-form content and can reach five newsroom actions through a keyboard-scrollable rail with a visible horizontal-scroll cue.
- Claim Registry metadata presents type, record status, dates, review cadence, proof, boundary and permalink as visually separated fields.
- Press Kit utility pages use the compact shared footer; the complete footer remains in use on the rest of the public site.
- A first-party endpoint accepts only allowlisted newsroom events and persists event type, allowlisted target, locale and server timestamp.
- Admin and auditor roles can inspect aggregate all-time and trailing-30-day event counts with explicit zero and interpretation states.
- Public chat failures return a generic message and diagnostic reference without exposing upstream error text.
- Health responses do not disclose physical database paths.
- Production admin and auditor access requires explicitly configured usernames.
- The Next.js proxy is covered by regression tests for Content Security Policy, per-request nonce propagation and `frame-ancestors 'none'`.

## Measurement boundary

The primary KPI is the count of press-package download intentions. Data Room views and press-contact intentions are drivers. Counts are events, not unique people, verified readership, media coverage or confirmed outcomes. Automated traffic can be present. Failed measurement writes do not block the corresponding user action. No target or conversion rate is stated before sufficient baseline evidence exists.

## Data boundary

Persisted newsroom event rows contain no cookie, account identifier, IP address, user-agent, referrer, free text or destination URL. The accepted fields are event type, allowlisted target, locale and server timestamp. Rate-limit state remains transient in the application process.

## Migration evidence

All six Prisma migrations were applied to an isolated SQLite database. A valid `press_package_download` event returned HTTP 202 and persisted only `eventType`, `target`, `locale` and `createdAt` in `PressMetricEvent`.

## Verification gates

- Automated unit and regression suite: 359 tests passed across 60 files.
- TypeScript validation: passed.
- ESLint validation: no application errors; one warning remains in an unrelated untracked temporary deck script.
- Production Next.js 16.2.11 build: passed, including the `Proxy (Middleware)` stage.
- Press package regeneration: 18 assets and two localized packages generated; consecutive package hashes were identical.
- Isolated SQLite migration and event-persistence smoke test: passed.
- Independent responsive UI evaluation: PASS.
- Runtime response-header check: Content Security Policy present with a nonce and `frame-ancestors 'none'`; `X-Frame-Options: DENY` present.
- Deployable dependency audit: no advisory reported by `npm audit --omit=dev` at the time of execution. This is a point-in-time tool result, not a security certification.

The Hostinger archive checksum is generated after the release commit and must be verified against the accompanying `.sha256` file before upload.
