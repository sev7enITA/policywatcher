# PolicyWatcher 3.9.0 Beta 17 release audit

Date: 29 July 2026

Release: Shareable Evidence Collections

## Scope

This audit covers the browser-local Evidence Collections workspace, exact-change selection controls, canonical ID-only sharing, deterministic JSON/Markdown/CSV bundles, public API v1 registration, integration documentation and Community Roadmap updates.

## Functional controls

- A collection accepts from 1 to 12 exact UUID v4 change identifiers, normalizes case, removes duplicates and sorts the final selection.
- The server resolves every identifier through the existing public Evidence Packet gate. A missing or withheld record makes the complete request unavailable; partial collections are not returned.
- Local collection titles and review status remain in versioned browser storage and are never placed in a share URL or sent to the collection endpoint.
- Canonical share URLs contain only the sorted public change identifiers needed to reconstruct the selection.
- JSON, Markdown and CSV derive from the same normalized collection model and include a deterministic collection digest plus each selected Evidence Packet digest.
- CSV output applies field quoting and spreadsheet-formula neutralization. Markdown output escapes generated labels and untrusted display text.
- The endpoint accepts only the declared `changes` and `format` query parameters, has a bounded query length, uses an in-process rate limit and exposes no write method.
- Public navigation, Integration Hub, Developer reference, Feature Atlas, Press Kit and Roadmap distinguish the available portable bundle from future persistent collaboration and outbound delivery.

## Claim boundary

Evidence Collections are portable review artifacts, not multiuser workspaces. They provide no account, access-control, comment, assignment, delivery or shared-audit functionality. Deterministic digests establish artifact identity for the selected public records; they do not establish source completeness, authorship, legal compliance or continued availability.

## Verification record

- Focused unit and route tests cover strict parsing, deterministic ordering, digest stability, Markdown/CSV safety, public-gate failure and CORS preflight behavior.
- Full Vitest result: 78 test files and 441 tests passed.
- TypeScript and whitespace checks passed. ESLint completed with no errors and one warning in an untracked temporary deck script outside the release package.
- The Next.js production build passed and generated or registered 117 application pages, including `/collections`, `/api/v1/evidence-collections` and `/schemas/evidence-collection/v1`.
- Independent interface evaluation passed at 1440, 768, 375 and 320 pixels with no horizontal overflow. Corrupted local storage, the 12-record limit, all-or-nothing shared selection and share-URL privacy were included in scope.
- The final Hostinger archive excludes database files and is distributed with a SHA-256 sidecar. Exact command results and the archive checksum are recorded in the release handoff.

## Deployment continuity

The release adds no Prisma migration and does not change `DATABASE_URL`. The Hostinger-compatible database initializer and startup checks remain unchanged. Evidence Collections reconstruct public bundles at request time from exact public Evidence Packets.
