# PolicyWatcher State of the Art

Date: 2026-07-05
Track: 3.5.1 Confidence Maintenance / Audit Operations
Scope: local source tree, public documentation, Hostinger deployment package, and separate VPS renderer setup

## Executive Summary

PolicyWatcher is now positioned as an inspectable civic-tech platform for
monitoring configured public policy sources. The platform does not operate as
certify legal compliance or internal company behavior. Its defensible position
is narrower and stronger:

> PolicyWatcher maps configured public policy texts, records retrieval evidence,
> detects text changes, exposes Dataset QA status, and explains the limits of
> AI-assisted analysis.

The 3.5 Confidence track and 3.5.1 maintenance work focused on reliability,
traceability, and public trust evidence. The release adds visible data-status
labels, ingestion-method metadata, check logs, append-only QA review decisions,
public trust pages, OpenSSF evidence, security-header hardening, source-fit URL
migration, and a separate renderer service for script-rendered policy pages.

## What Changed in the 3.5.1 Maintenance Work

### Retrieval and Scraper Confidence

- Direct HTTP/1.1 retrieval remains the primary path.
- Explicit HTTP/2 retrieval is attempted when a provider rejects HTTP/1.1 or
  returns a short unusable shell.
- An optional VPS renderer can execute a headless browser fetch for
  script-rendered policy pages.
- The renderer is not hosted on Hostinger; it runs as a separate hardened VPS
  service because Chromium is not suitable for shared hosting.
- Renderer calls are protected with `RENDERER_SECRET`.
- Initial URLs, browser redirects, and browser subresource requests are checked
  against SSRF validation rules.
- Wayback Machine and Common Crawl are fallback sources only when live
  retrieval fails.
- Archive snapshots older than the last successful check are rejected so stale
  cache data cannot look like a fresh policy change.
- Common Crawl WARC bodies are decompressed before text extraction.

### Source-Fit and Dataset QA

- URL migration can run in dry-run mode before changing production data.
- Migrations can be scoped by company, policy name, and jurisdiction.
- Meta and Wise source mappings were corrected away from unsuitable or
  localized URLs where a better canonical/market source exists.
- Dataset QA checks URL hygiene, hash consistency, latest version alignment,
  check-log presence, check-log status alignment, timestamps, duplicate
  normalized URLs, AI reason JSON parseability, KPI coverage, and region-impact
  coverage.
- Dataset QA issues can be marked reviewed, ignored with reason, or reopened.
- Each QA decision writes an append-only admin review-log event.

### Public Trust Surface

The public site and repository now expose trust evidence through:

- `/trust` for badge and evidence explanations.
- `/methodology/confidence` for data provenance, retrieval cascade, AI limits,
  and non-certification boundaries.
- `/roadmap` for the release cadence and separation between delivered,
  planned, and intentionally postponed work.
- `/showcase` for a product overview that describes current functions without
  exposing the admin login as a public CTA.
- `/security` for vulnerability disclosure plus 3.5 confidence controls.
- `README.md`, `CHANGELOG.md`, and this report.
- `docs/third-party-validation.md` for GitHub, CodeQL, OpenSSF, Sonar,
  Codecov, MDN Observatory, SecurityHeaders.com, and renderer checks.

## Current Platform Capabilities

### Public Interface

- Company and policy cards.
- EU, US, and Global jurisdiction filters.
- Individual and enterprise perspective filters.
- Search and sector filtering.
- Timeline of policy-change rows.
- Policy detail modal with overview, diff, archive, AI governance, risk trend,
  remediation notes, source links, and evidence telemetry.
- Region heatmap and regulatory jurisdiction map.
- Risk trend chart.
- Industry benchmark radar.
- KPI governance matrix.
- Executive PDF report generation.
- Public change pages, share views, embed widgets, and OG image output.
- Public trust, methodology, roadmap, security, and showcase pages.

### Administrative Interface

- Admin and auditor roles.
- HMAC-signed HTTP-only session cookies.
- Login rate limiting and constant-time credential comparison.
- System metrics.
- Company and policy management.
- Dataset QA status, issue queue, decisions, and CSV export.
- Append-only Review Log page and API.
- KPI audit matrix.
- Explainability documentation.
- Cron status and scan controls.
- Database inspection.
- Encrypted backup export and decrypt-preview utility.
- Evidence telemetry in policy details.

The admin area can be described publicly, but the login route should not be
used as a public marketing CTA.

## Dataset and QA Snapshot

Reference local dataset profile for the current release line:

Configured local inventory, not public-confidence evidence until source
retrieval logs are available:

| Area | Count |
| --- | ---: |
| Companies | 16 |
| Policies | 50 |
| Policy version records | 103 |
| Policy change records | 53 |
| Region impact rows | 318 |
| Policy check logs | 50 |
| Subscribers | 1 |

Reference Dataset QA status:

- Source-evidence blockers: present while records remain seeded/demo text.
- Public confidence data: gated until fresh scans produce non-seeded retrieval evidence.
- Public source suspension: anomalous, seed-only, partial, `Needs Review`, or
  `Unavailable` sources expose only a suspension notice and minimal metadata.
  Policy text, scores, timeline events, KPI values, and AI summaries stay hidden.
- Public-evidence gate: snapshots and changes must carry `publicEvidence=true`
  before they can feed public APIs, sitemap, digests, share pages, reports,
  timelines, or benchmarks.
- Archive evidence: Wayback/Common Crawl retrievals persist the archive
  snapshot timestamp; Dataset QA flags archive `Available` rows without it.
- Completeness guard: truncated or incomplete retrievals become `Partial`
  suspensions rather than complete baselines or AI-scored changes.
- Re-baseline protection: the first successful fetch after `Seeded` ingestion
  evidence replaces seeded history for that policy and creates one verified
  baseline snapshot, without a PolicyChange, AI score, or subscriber email.
  `Configured` status alone does not trigger destructive re-baseline, and the
  operation aborts if real source evidence, public snapshots, or reviewed
  history already exist.
- Operational admin alerting: manual and scheduled source suspensions can email
  the configured administrator with metadata, failure reason, transport source,
  timestamp, and the Dataset QA console link.
- Source remediation follow-up: Plaid legal-hub ambiguity has been resolved with
  anchor-scoped extraction; Klarna EU Terms remains intentionally suspended when
  the official English EU/Ireland terms page returns only a short placeholder
  body.

Known QA notes:

- Seeded records are not public-confidence evidence. They must be replaced by
  direct, HTTP/2, VPS-rendered, Wayback, or Common Crawl retrieval logs before
  timeline/dashboard statements are promoted.
- Broad legal hubs should use section anchors where the provider exposes them.
  Plaid now maps privacy/EUSA records to anchor-scoped sections. If an official
  source returns only a short placeholder body, as currently observed for
  Klarna EU Terms, the record should remain suspended until a stronger source is
  found.

## Security and External Evidence

Implemented security and assurance controls include:

- nonce-based CSP through Next Proxy;
- `default-src 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, and route-aware `frame-ancestors`;
- HSTS, `nosniff`, permissions policy, and strict referrer policy;
- HMAC admin sessions;
- mandatory dedicated `SESSION_HMAC_SECRET`;
- API bearer checks;
- subscriber token protections;
- escaped dynamic email values;
- encrypted backup export;
- production seed endpoint disabled unless explicitly enabled for non-production;
- scraper egress validation;
- renderer SSRF validation.

Public validation signals:

- GitHub Quality Gate workflow.
- CodeQL workflow.
- OpenSSF Scorecard workflow.
- OpenSSF Best Practices project `13465` passing badge.
- Targeted reliability coverage workflow.
- SonarQube Cloud workflow prepared for `SONAR_TOKEN`.
- Codecov upload prepared for `CODECOV_TOKEN`.
- MDN HTTP Observatory and SecurityHeaders.com live scan links.

These are operational evidence signals. They are not security, legal, or
regulatory certifications.

## Deployment Notes

Hostinger application variables:

- `NODE_ENV=production`
- `APP_URL=https://policywatcher.online`
- `API_SECRET`
- `SESSION_HMAC_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `AUDITOR_USER`
- `AUDITOR_PASSWORD`
- `GEMINI_API_KEY`
- `DATABASE_URL`
- `RENDERER_URL=https://render.policywatcher.online` when the renderer is active
- `RENDERER_SECRET` with the same value configured in the VPS service

Production settings:

- Keep `ALLOW_DATABASE_SEED_ENDPOINT` unset or `false`.
- Rotate any secret previously shown in screenshots or logs.
- Run `npx prisma db push` after schema changes.
- Run source URL migrations with `--dry-run` first.
- Run `npm run qa:dataset` after database repair or migration steps.
- Verify `/trust`, live badges, MDN Observatory, and SecurityHeaders.com after
  deployment because hosting proxies can modify headers.

## Current Risks and Next Priorities

Priority items:

- Confirm or refine Plaid legal-hub mapping.
- Keep Hostinger and VPS renderer secrets aligned and rotated.
- Configure GitHub branch protection so the Quality Gate is enforceable.
- Complete Codecov and SonarQube Cloud external setup if their badges will be
  promoted publicly.
- Add selected API-route tests beyond current targeted utility coverage.
- Plan PostgreSQL readiness for larger production datasets.

## Bottom Line

The 3.5 line should be presented as a Confidence Release: fewer slogans, more
evidence. PolicyWatcher is strongest when it shows what it checked, where the
source came from, what the model inferred, what remains uncertain, and which
human review actions were taken.
