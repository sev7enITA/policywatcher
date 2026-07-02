# PolicyWatcher State of the Art

Date: 2026-07-02  
Track: 3.5.0 Confidence  
Scope: local source tree and local SQLite dataset before public commit/deploy

## Executive Summary

PolicyWatcher is now positioned as a civic-tech policy intelligence platform
with a visible Confidence layer. The platform monitors configured public policy
source URLs, records version metadata, maps detected changes, produces
AI-assisted risk and governance indicators, and exposes dataset QA status in
both public and administrative views.

The 3.5 Confidence work shifts the product away from feature expansion alone
and toward inspection, assurance, and reviewability. The strongest current
assets are:

- public dashboard and policy detail views;
- policy-change timeline and stable change permalinks;
- regional impact views, risk trends, benchmark radar, heatmaps, KPI matrix,
  and executive PDF output;
- admin console with companies, policies, cron status, database view, KPI audit,
  explainability, encrypted backup, and Dataset QA;
- data-status telemetry exposed in cards, pills, and policy details;
- check-log evidence for each policy record;
- public `/trust` page with build, CodeQL, OpenSSF Scorecard, OpenSSF Best
  Practices passing badge, coverage workflow, Sonar/Codecov readiness,
  live-header scan links, and non-certification boundary;
- repository-level governance files and third-party validation setup.

PolicyWatcher should continue to avoid claims such as certification,
guaranteed compliance, legal validity, complete coverage, or real-time
monitoring. Its strongest public claim is narrower and more defensible:

> PolicyWatcher maps configured public policy texts and exposes analysis,
> change evidence, dataset QA state, and methodological limits.

## Current Dataset Profile

Local dataset counts at the time of this report:

| Area | Count |
| --- | ---: |
| Companies | 16 |
| Policies | 50 |
| Policy version records | 103 |
| Policy change records | 53 |
| Region impact rows | 318 |
| Policy check logs | 50 |
| Subscribers | 1 |

Current policy data statuses:

| Data status | Count |
| --- | ---: |
| Available | 50 |

Important boundary: `Available` means the local record has coherent internal
evidence in the dataset. It does not mean the provider source is currently
reachable, legally valid, complete, or independently verified.

## Product Capabilities

### Public Interface

The public application includes:

- dashboard cards by company and policy;
- risk score, risk label, TL;DR, key points, and risk reasons;
- Dataset QA status badge per policy and aggregated company status;
- regional filters for EU, US, and Global;
- individual and enterprise perspective filters;
- company comparison and benchmark radar;
- KPI governance matrix;
- policy details modal with overview/diff, archive, AI governance, risk trends,
  remediations, sources, and evidence telemetry;
- timeline of change records;
- public `/change/[id]` pages;
- share pages and embeddable change widgets;
- executive PDF report generation;
- public `/methodology/confidence`, `/roadmap`, `/showcase`, and `/trust`
  pages.

### Administrative Interface

The admin console currently supports:

- admin and auditor roles;
- HMAC-signed HTTP-only session cookies;
- login rate limiting and constant-time credential comparison;
- system metrics;
- company and policy management;
- Dataset QA status page and API;
- KPI audit matrix;
- explainability documentation;
- cron status and scan controls;
- database inspection;
- encrypted backup export and verification/decrypt preview;
- evidence telemetry in policy details.

The admin area is intentionally not linked from the public showcase as a public
CTA. Public material can describe the existence and nature of the admin
controls without exposing the login route as a marketing path.

## Data Quality and Assurance

### Implemented Controls

The Dataset QA and command-line assurance layer currently checks:

- policy inventory presence;
- accepted `dataStatus` values;
- `currentText` to `currentHash` SHA-256 consistency;
- latest version record alignment with current policy hash;
- every version record hash against its text;
- at least one check-log row per policy;
- latest check-log status validity;
- latest check-log status alignment with policy status;
- latest check-log hash and text length alignment;
- required timestamp presence;
- normalized duplicate source URLs;
- `riskReasonsJson` parseability and supported icon keys.

The command is:

```bash
npm run qa:dataset
```

Latest result:

- Status: `warn`
- Blockers: `0`
- Warnings: `1`

Remaining warning:

- `https://plaid.com/legal` is used by Plaid Privacy Policy and End User
  Services Agreement records across US/EU. This may be a legitimate legal-hub
  mapping, but it should be confirmed or refined with more specific provider
  anchors/pages if available.

### Repair and Backfill

The repair flow is:

```bash
npm run db:repair
npm run db:backfill-check-logs
npm run qa:dataset
```

`db:repair` now aligns current policy state to the latest version record,
normalizes AI JSON reason icons, fixes hash inconsistencies, and updates latest
check-log text hash/length where needed.

## AI Methodology

PolicyWatcher uses Google Gemini models for structured analysis. Current public
methodology correctly states that:

- outputs are generated from retrieved/versioned policy text records;
- unsupported fields should remain unspecified or unavailable;
- AI output is not legal advice;
- risk scores are analytical indicators;
- internal company behavior is not validated;
- legal compliance is not certified.

Recommended wording remains:

- "evidence available";
- "requires human review";
- "configured source";
- "version record";
- "Dataset QA status";
- "automated checks";
- "operational evidence".

Avoid:

- "certified";
- "guaranteed";
- "compliant/non-compliant verdict";
- "official policy stored";
- "real-time monitoring";
- "complete coverage".

## Security and Trust Posture

Implemented controls include:

- `X-Powered-By` disabled;
- HSTS on non-embed routes;
- `X-Content-Type-Options: nosniff`;
- Referrer-Policy;
- Permissions-Policy;
- nonce-based CSP generated per request through Next Proxy;
- `default-src 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, and route-aware `frame-ancestors`;
- explicit image/connect/frame boundaries;
- `frame-ancestors 'none'` on main app/admin;
- embed route governed by CSP `frame-ancestors` instead of obsolete
  `X-Frame-Options: ALLOWALL`;
- HMAC admin sessions;
- optional dedicated `SESSION_HMAC_SECRET`;
- API bearer secret checks;
- subscriber token protections;
- escaped email dynamic values;
- encrypted backup export;
- seed endpoint disabled in production unless explicitly enabled for non-prod;
- scraper egress validation.

Repository-level validation assets:

- GitHub Quality Gate workflow;
- CodeQL workflow;
- OpenSSF Scorecard workflow;
- OpenSSF Best Practices project `13465` passing badge;
- core coverage workflow;
- SonarQube Cloud workflow prepared for `SONAR_TOKEN`;
- Codecov upload prepared for `CODECOV_TOKEN`;
- `SECURITY.md`;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- third-party validation guide.

## Test and Build Status

Local validation performed:

```bash
npm run test
npm run test:coverage
npm run qa:dataset
npm run lint
npm run build
npm audit
npm audit --omit=dev
```

Results:

- Unit tests: 3 files, 10 tests passed.
- Core coverage: 91.22% statements, 96% lines, 100% functions.
- Dataset QA: no blockers, 1 Plaid duplicate URL warning.
- ESLint: clean.
- Next production build: successful.
- npm audit: 2 moderate PostCSS findings through Next.js; no high/critical
  findings reported.

Known dependency note:

- `npm audit` still reports 2 moderate vulnerabilities through `postcss`
  bundled under Next.js. The suggested `npm audit fix --force` would install an
  incompatible old Next version, so it should not be applied blindly.

## Public Assets Updated

The following public/user-facing assets have been aligned to 3.5 Confidence:

- README;
- CHANGELOG;
- in-app changelog modal;
- How To onboarding modal;
- About/overview modal;
- Methodology modal;
- `/methodology/confidence`;
- `/showcase`;
- `/trust`;
- public metadata and SEO title/description;
- Terms gate disclaimer;
- disclaimer banner;
- share/change public pages;
- executive PDF disclaimer;
- footer build string;
- admin visible version labels;
- admin Dataset QA wording;
- third-party validation documentation.

## Deployment Notes for Hostinger

Required production environment variables:

- `NODE_ENV=production`
- `APP_URL=https://www.policywatcher.online`
- `API_SECRET`
- `SESSION_HMAC_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `AUDITOR_USER`
- `AUDITOR_PASSWORD`
- `GEMINI_API_KEY`
- `DATABASE_URL=file:./prisma/dev.db` or the actual Hostinger path used in
  deployment

Recommended production settings:

- Keep `ALLOW_DATABASE_SEED_ENDPOINT` unset or `false`.
- Rotate any secret previously shown in screenshots or logs.
- Run `npx prisma db push` after schema changes.
- Run `npm run db:repair` and `npm run db:backfill-check-logs` on a backup copy
  first, then production.
- Verify security headers on the live domain after deployment because hosting
  proxies can modify response headers.

## External Validation Roadmap

Ready now:

- GitHub Actions Quality Gate.
- CodeQL.
- OpenSSF Scorecard.
- OpenSSF Best Practices project `13465` passing badge.
- Core coverage workflow.

Requires external setup:

- SonarQube Cloud project and `SONAR_TOKEN`.
- Codecov project and `CODECOV_TOKEN`.
- MDN HTTP Observatory live scan.
- SecurityHeaders.com live scan.

## Current Risks and Priority Fixes

### P0/P1

- Confirm or refine Plaid source mapping for `https://plaid.com/legal`.
- Ensure production secrets are rotated before public release.
- After deploy, verify `/trust` badge URLs and live scanner links from the real
  domain.
- Configure branch protection so the Quality Gate becomes enforceable, not just
  decorative.

### P2

- Add admin issue queue actions: reviewed, ignored with reason, linked record.
- Add append-only human review log for policy changes and overrides.
- Expand tests from core utilities to auth, dataset assurance rules, scraper
  URL validation, and selected API route logic.
- Add a public status note when external services such as Sonar/Codecov are
  configured.

### P3

- Add PostgreSQL readiness for production scale.
- Add signed outbound webhooks only after object-level authorization and replay
  protection are designed.
- Add advisory framework mapping with wording limited to evidence and review
  needs, not compliance verdicts.

## Bottom Line

PolicyWatcher is no longer just a public policy dashboard. It is becoming an
inspectable evidence platform for monitoring configured policy sources and
reviewing how automated analysis is produced. The 3.5 Confidence track gives
the project a stronger public position: credibility through visible controls,
not through louder claims.
