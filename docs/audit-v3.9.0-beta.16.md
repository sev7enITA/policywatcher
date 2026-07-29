# PolicyWatcher 3.9.0 Beta 16 release audit

Date: 29 July 2026

Release: Evidence Governance Packets

## Scope

This audit covers the removal of public launch operations from Pulse, the public Evidence Packet routes, sanitized source-confidence metadata, public snapshot fingerprints, source-passage validation, advisory framework mapping, exact-change PDF/JSON reports and the Community Roadmap update.

## Functional controls

- Evidence Packets are addressed by public `changeId`; the packet query does not substitute the latest analysis for the policy.
- The public evidence gate requires a published change, a public current snapshot, a non-seeded policy and an eligible policy data status.
- Public source-confidence fields exclude raw failure reasons, final retrieval URLs, private QA decisions, admin notes and snapshot text.
- Old-snapshot hashes and quoted passages are exposed only when the old snapshot is separately marked as public evidence.
- A stored source passage is rendered only after exact substring validation against its declared public snapshot.
- Historical reasons without a passage remain visible with a `not recorded` state; nonmatching passages are rejected rather than displayed.
- Framework mappings are deterministic links between assessed KPI topics and public framework references. They do not calculate conformity or compliance.
- JSON and PDF outputs use the same change-bound packet and deterministic content digest.
- Product Hunt and Show HN source copy remains available to protected outreach operations; public launch-kit JSON and image routes are removed.

## External reference check

Framework labels and source links were checked against the official EUR-Lex Regulation (EU) 2024/1689 record, ISO/IEC 42001:2023 page, NIST AI RMF page and OECD AI Principles page on 29 July 2026. NIST states that AI RMF 1.0 is being revised; PolicyWatcher therefore identifies the mapped reference as AI RMF 1.0 and records that revision is in progress.

## Claim boundary

Source confidence describes recorded PolicyWatcher retrieval and publication state. Snapshot hashes establish consistency of stored public evidence, not source authorship or legal authority. Source anchors establish passage occurrence, not interpretive correctness. Governance mappings are review aids, not legal advice, conformity assessments, certifications or compliance verdicts.

## Verification record

- Vitest: 75 test files and 431 tests passed.
- TypeScript: `tsc --noEmit` passed.
- Scoped ESLint and `git diff --check`: passed.
- Next.js production build: passed; 115 application pages generated or registered, including `/evidence`, `/evidence/[changeId]` and `/api/evidence-packet/[changeId]`. The removed public launch-kit routes are absent.
- Independent interface evaluation: PASS at 1440, 768, 375 and 320 pixels; no horizontal overflow was detected on Evidence, Roadmap or Pulse, and Distribution Desk content was absent.
- Production dependency advisory check: `npm audit --omit=dev` reported no known production dependency advisories at the time of the check. This is a point-in-time package-registry result, not a security guarantee.
- Hostinger shell compatibility: release and database initialization scripts passed shell syntax checks and the database initializer contains no process substitution dependency on `/dev/fd`.
- The final Hostinger archive is distributed with a SHA-256 sidecar; the exact checksum is recorded in the release handoff rather than asserted as a product-quality claim.

## Deployment continuity

The Hostinger-compatible database initialization and Prisma-engine fallback from Beta 14 remain required in the production package. The release does not include a database file and does not change the production `DATABASE_URL` boundary.
