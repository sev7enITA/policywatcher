# PolicyWatcher 3.9.0 Beta 19 release audit

Date: 2026-07-29

## Release scope

Beta 19 adds two read-only collaboration and integration contracts: a vendor-neutral Evidence Collection handoff manifest and a public forward-polling change-event feed. It does not add persistent team accounts, third-party record creation, subscriptions or outbound webhook delivery.

## Implemented changes

- Evidence Collections accepts `format=handoff` and returns deterministic review work items with exact evidence links, packet and snapshot digests, review questions and acceptance criteria.
- `/api/v1/change-events` returns already-published change events in chronological order with deterministic event IDs, localized summaries and a strict opaque cursor.
- `PolicyChange.publicPublishedAt` records the evidence-gate transition independently from source retrieval and change creation time.
- Existing public changes are backfilled from `createdAt`; private changes retain a null publication timestamp.
- Later approval and republication remain visible to forward-polling consumers and receive a publication-specific event identity.
- Developers, Integration Hub, Community Roadmap, Feature Atlas, API documentation and release history describe the available surfaces and their delivery boundaries.

## Data and security boundaries

- The event query requires both the existing public-evidence gate and a non-null publication timestamp.
- Event payloads exclude policy text, raw retrieval failures, administrative logs, credentials, recipients and subscription data.
- Handoff payloads exclude browser-local titles and review state, assignees, due dates, access-control state and vendor-specific identifiers.
- Query parameters, UUIDs, page sizes and cursor representations fail closed.
- Both endpoints are read-only, rate-limited and expose browser CORS without credentials.

## Verification

- Automated tests: 455 passed across 81 test files.
- TypeScript: passed.
- Scoped ESLint: passed.
- Prisma schema validation and client generation: passed.
- Migration backfill and index creation: passed against a temporary SQLite database.
- Next.js production build: passed with 121 generated application routes/pages.
- Release packaging checks include version consistency, source revision, required migration and endpoint files, path traversal, forbidden runtime/database content and SHA-256 generation.

## Interpretation boundary

The handoff manifest is a portable review artifact, not evidence that a receiving system created or assigned a record. The change-event cursor is polling position, not a delivery receipt, authorization token or availability guarantee. AI-assisted screening fields remain inputs for human review and are not legal or compliance verdicts.
