# PolicyWatcher 3.9.0 Beta 26 release audit

Date: 31 July 2026
Release: Crawlable Public Knowledge Layer

## Scope

Beta 26 adds a crawlable public reference layer for records that already pass PolicyWatcher's publication gates. It does not change source acquisition, scan scheduling, change detection, analytical scoring, record approval or protected access control.

## Delivered surfaces

- `/knowledge` is a server-rendered index of eligible public companies, policies, verified baselines and published changes.
- Canonical company and policy routes expose bounded metadata, verification timestamps, source links and related public evidence.
- The home response contains a visible server-rendered Knowledge snapshot before the interactive workspace boundary.
- `robots.txt`, `llms.txt` and the dynamic sitemap connect public reference routes while excluding protected and mutation surfaces.
- Visible JSON-LD uses safely serialized `CollectionPage`, `Dataset`, `ItemList`, `Organization` and `DigitalDocument` records.
- Public header, footer, Site Atlas, Press Kit, release archive, roadmap and release-impact data identify the new layer consistently.

## Publication and privacy boundaries

- Shared evidence predicates remain authoritative for every public entity query.
- Invalid identifiers, missing entities and withheld records return HTTP 404.
- Database or migration unavailability produces a bounded public unavailable state without infrastructure details.
- Raw policy text, internal logs, retrieval errors, admin notes, credentials and withheld records are not published.
- Crawler files are discovery aids and do not assert indexing, citation, ranking or answer-engine inclusion.

## Verification

The release gate covers publication predicates, UUID validation, safe external URLs, JSON-LD escaping, initial-HTML semantics, crawler directives, sitemap records, navigation links and unavailable states. The final package is accepted only after the repository test suite, lint, production build and archive integrity checks pass.

## Verification boundary

Local and build-time checks validate implemented behavior and packaging consistency. They do not establish production indexing, crawler behavior, search ranking, citation frequency, content freshness beyond recorded timestamps, legal compliance or independent certification.
