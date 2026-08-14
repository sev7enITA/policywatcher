# PolicyWatcher 3.9.0 Beta 13 audit

Date: 29 July 2026

## Scope

Beta 13 adds an editorial distribution layer to the existing public Evidence Newsroom. It introduces a reviewed Pulse registry, deterministic Story Packs, multiformat social cards, page-specific Open Graph images, machine-readable Data Room metadata, citation-bearing embeds and aggregate editorial event counts. It also includes the database-readiness and enterprise-integration work committed after Beta 12.

## Publication contract

- `/pulse` publishes only records explicitly present in the typed editorial registry with `verified` status.
- Each lead records a stable slug, Story Pack version, editorial beat, as-of date, verified facts, proof links, a citation and an interpretation boundary.
- Draft, superseded or withdrawn material is not inferred from database ranking or AI output and is not automatically promoted to public editorial content.
- Story Pack ZIP files use stable file ordering and a fixed timestamp. Repeated generation for the same story version and locale is byte-identical.
- Social cards are available in 1200 x 630, 1080 x 1080, 1080 x 1350 and 1080 x 1920 formats.
- Evidence visuals are fixed, allowlisted presentations of the configured scope, evidence pipeline or dated release sequence. They do not accept arbitrary query-defined data.

## Structured data and measurement

- Pulse stories expose `NewsArticle` structured data and story-specific Open Graph images.
- Release pages expose release-specific images in metadata and structured data.
- The Editorial Data Room exposes `Dataset` and one `DataDownload` entry per published distribution.
- Editorial event writes accept only a strict event and target matrix.
- Persistent event rows contain event type, allowlisted target, locale and server timestamp. They exclude visitor identifiers, IP addresses, user agents, referrers, query strings and raw user content.
- Admin totals are event counts, not unique people, confirmed readership, publication or conversion outcomes.

## Verification performed

- `npm test`: 70 files and 407 tests passed.
- `npm run pulse:verify`: 2 files and 10 focused tests passed.
- `npx tsc --noEmit`: completed without errors.
- Scoped ESLint for the new and changed TypeScript surfaces completed without errors.
- `npm run build`: completed and generated 108 application pages with the Beta 13 release record.
- Independent desktop and 375 px mobile evaluation passed after correcting dark embed contrast, citation wrapping and accessible copy-success announcements.
- `git diff --check`: completed without whitespace errors.

The final package command performs a second clean release verification after commit and records the exact source revision and SHA-256 checksum in the Hostinger artifact manifest.

## Boundaries

- Pulse is a small reviewed registry, not an automated newsroom or exhaustive market coverage.
- Verified means the record passed the configured editorial contract; it does not mean independent validation or legal approval.
- Deterministic generation establishes artifact identity. It does not establish continued source availability or factual correctness after the stated as-of date.
- AI-assisted assessments remain screening information and are not legal advice or compliance determinations.
- Product Hunt and Show HN material provides owned assets and factual copy. It does not request votes or imply endorsement.
