# PolicyWatcher 3.9.0 Beta 15 release audit

Date: 29 July 2026

Release: Citable Coverage Registry

## Scope

This audit covers the public Coverage Registry, its four migrated external-reference records, derived summaries, citations, JSON/CSV endpoint, JSON Schema, structured data and release metadata.

## Functional controls

- One typed module supplies the public HTML page and machine-readable payloads.
- Every record has a stable ID, HTTPS source URL, classification, language, month-level publication date, record/review dates, title status, relationship boundary and source-linked status.
- Publisher-supplied titles and descriptive registry labels remain distinguishable.
- Totals are derived from the record array and are not maintained separately.
- LinkedIn source URLs exclude previously retained tracking query parameters.
- JSON and CSV are the only supported distribution formats; invalid values return a controlled 400 response.
- The JSON payload links to a published `press-coverage` schema.

## Claim boundary

Registry inclusion records a public external reference. It does not establish endorsement, certification, independent audit, readership, reach or factual validation by PolicyWatcher. The recorded review date does not guarantee later source availability or unchanged third-party content.

## Verification record

- Focused coverage, Press Kit, release and public UI checks: 32 tests passed.
- Complete automated suite: 73 test files and 423 tests passed.
- TypeScript, scoped ESLint and `git diff --check`: passed.
- Production dependency advisory check: no known npm production advisories were reported at the audit time; this is not a general vulnerability assessment.
- Production build: passed; 114 static pages generated and `/api/press/coverage` included in the route manifest.
- Independent interface evaluation: the first review identified mobile clipping at 375 px. Track sizing, wrapping and content-width constraints were corrected. The second review passed at 375 px and 320 px with all four records and actions reachable.
- Hostinger package integrity and SHA-256 are recorded in the release handoff after final packaging.

## Deployment continuity

The Beta 14 Hostinger corrections remain present: database initialization does not require `/dev/fd`, repairs the packaged Prisma schema-engine execute bit when possible and falls back to the bundled idempotent Node/Python SQLite initializer when native execution is denied.
