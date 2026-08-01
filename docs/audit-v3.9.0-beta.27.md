# PolicyWatcher 3.9.0 Beta 27 release audit

Date: 1 August 2026
Release: Admin Operational Readiness

## Scope

Beta 27 aligns the protected administrative dashboard around one evidence sequence:

`Priorities → Readiness → Live status → Role-safe action → Bounded measurement`

The release changes operational presentation, public documentation and privacy-minimized measurement. It does not change public evidence gates, grant new permissions or establish production outcomes.

## Implemented evidence

- Operational Action Center with no more than five deterministic priorities. Each returned record includes severity, cause, evidence timestamp, affected records, impact and one canonical destination.
- Publication Readiness Funnel with Configured, Retrieved, Baseline verified, Public and Analysed stages, a shared denominator, excluded counts and explicit unavailable states.
- Independent live-status retrieval for Dataset QA, Database Readiness, Webhook Delivery and VPS services.
- Role-specific presentation: Admin routes to responsible operational consoles; Auditor routes to read-only verification evidence. Endpoint authorization remains server-side.
- Compact dashboard composition: Press Newsroom summary, system evidence bar, sanitized environment count and Database/Recovery placement for backup controls.
- Responsive and accessibility implementation evidence: stable narrow-screen containment, 44px mobile actions, focus handoff, live-region refresh feedback, reduced-motion handling and an HTML table equivalent for risk charts.
- Privacy-minimized dashboard measurement with four allowlisted event types, server-derived role, bounded values, per-visit deduplication, minimum-sample disclosure and 90-day retention.

## False-positive prevention

Missing scans, absent migrations, unavailable protected endpoints and unknown metric values are represented as unavailable. They are not converted to zero, clear or healthy. An empty Action Center or public Policy Signals Board is not an operational-health assertion.

## Explicit limitations

- Measurement events do not prove that a task was completed or that the selected destination resolved the underlying issue.
- The release does not establish usability improvement, accessibility certification, security certification, service levels, operational health, source completeness, compliance or legal conclusions.
- Status cards reflect the latest bounded protected endpoint response and are not an exhaustive incident inventory.
- Dashboard telemetry stores no IP address, user agent, referrer, email, username, account identifier, query string, free text or arbitrary metadata.
- Public leaderboard rows remain governed by the public-evidence gate and do not represent the protected five-stage readiness funnel.

## Verification plan

1. Verify centralized release metadata against `package.json` and `package-lock.json`.
2. Run focused release, public-consistency, Press Kit, Editorial Pulse and protected-dashboard tests.
3. Validate Prisma schema generation and migration inclusion.
4. Run ESLint on touched source files and `git diff --check`.
5. Run the production Next.js build.
6. Regenerate Press Kit manifests and packages, then verify checksums and current/archived release records.
7. Build the Hostinger archive only after all prior checks pass.
