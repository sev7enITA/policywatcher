# PolicyWatcher Editorial Pulse

## Purpose

`/pulse` is a small, human-approved editorial registry. It turns facts already supported by the Press Kit, Claim Registry, release archive and Data Room into reusable story leads. It does not automatically promote database rankings or AI output into editorial claims.

Each lead carries a stable slug, semantic Story Pack version, editorial beat, `as of` date, verified facts, proof links, an explicit interpretation boundary and a suggested citation. English is the default; Italian is available through `?lang=it`.

## Public routes

- `/pulse` - beat-filtered public story lead registry.
- `/pulse/[slug]` - complete lead, sources, citation, card downloads and reuse actions.
- `/api/pulse/story-pack/[slug]?lang=en&version=1.0.0` - deterministic ZIP with README, pitch, facts CSV, sources, citation and manifest.
- `/embed/pulse/[slug]?lang=en&theme=light` - iframe-friendly evidence visual with visible citation and source link.
- `/api/og/pulse/[slug]/[format]?lang=en` - branded PNG in `og`, `square`, `feed` or `story` format.

The Data Room exposes `Dataset` and `DataDownload` JSON-LD. Release pages, Pulse pages and the Data Room use specific Open Graph images rather than one generic site preview.

## Story Pack reproducibility

Story Packs are generated from `src/lib/editorialPulse.ts`. The ZIP builder uses a fixed timestamp, stable file inventory and no compression metadata. Repeated generation for the same story version and locale is byte-identical. A new factual scope or changed editorial wording requires a Story Pack version change.

Before publication, editors should still open the live source links. A checksum or deterministic archive confirms file identity, not semantic truth or continued source availability.

## Editorial funnel measurement

The existing cookie-free newsroom endpoint accepts a strict allowlist for:

- Pulse story view events;
- Story Pack download actions;
- social-card download actions by format;
- citation-copy actions;
- embed-code copy actions;
- historical Product Hunt and Show HN outbound actions recorded before the public launch desk was removed.
- valid Beta 13 campaign landings received by `/pulse`.

Persistent records contain only event type, allowlisted target, locale and server timestamp. They exclude visitor identifiers, IP addresses, user agents, referrers, query strings and raw user content. Admin totals are events, not unique people, verified readership, confirmed publication or conversion outcomes. Event-write failure never blocks the public action.

Campaign links use one query parameter, `?campaign=<allowlisted-campaign-id>`. `/pulse` records only the five identifiers in `src/lib/editorialCampaigns.ts`. An unknown value, duplicate campaign parameter or any additional parameter is ignored by campaign measurement; the raw query is never persisted.

Beta 14 adds the protected `/admin/outreach` desk and a separate administrative parser for aggregate pitch, reply, interview, coverage and correction events. It operates five versioned Beta 13 distribution cohorts; the public endpoint cannot write these types. Each administrative row retains the same four-field event shape and accepts no recipient, outlet, email, message body, note or free text.

## Launch operations boundary

Product Hunt and Show HN copy remains available only to authenticated operators through `/admin/outreach`. It is not part of the public Pulse content, and public launch-kit JSON and image endpoints are not published. Historical aggregate `launch_outbound` records remain readable so previously recorded totals are not rewritten.
