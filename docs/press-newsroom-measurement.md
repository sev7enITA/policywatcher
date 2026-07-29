# Evidence Newsroom measurement contract

Status: implemented measurement definition for the current Evidence Newsroom. This document does not define a performance target or conversion-rate target.

## KPI definitions

### Primary KPI

`press_package_download` counts a click intention on a published English or Italian press-package link.

- Allowed targets: `en`, `it`.
- Interpretation: download intention only.
- It does not confirm transfer completion, file opening or a unique person.

### Drivers

`data_room_view` counts one first-party event request per Data Room component load.

- Allowed target: `data-room`.
- It is not a unique-page-view or unique-person measure.

`press_contact_intent` counts a click intention on a specialized newsroom email route.

- Allowed targets: `press`, `fact-checking`, `interview`, `speaking`.
- It does not confirm that an email client opened, a message was sent or a recipient received it.

### Editorial Pulse funnel

- `pulse_story_view`: one request per mounted story page; target is an allowlisted story slug.
- `story_pack_download`: Story Pack link action; target is an allowlisted story slug.
- `social_card_download`: social-card link action; target is `og`, `square`, `feed` or `story`.
- `citation_copy`: citation copy action; target is an allowlisted surface category.
- `embed_copy`: embed-code copy action; target is an allowlisted story slug.
- `launch_outbound`: historical Product Hunt or Show HN destination action retained for aggregate continuity; the public emitter was removed in Beta 16.
- `campaign_landing`: a `/pulse` component load carrying exactly one allowlisted Beta 13 campaign ID.

These are aggregate events, not unique readers, completed downloads, resulting publications or confirmed launch conversions.

### Protected outreach operations (Beta 14)

The separate authenticated endpoint operates five versioned Beta 13 distribution cohorts and accepts the following administrator-entered aggregate operations with an allowlisted campaign ID and its fixed locale:

- `pitch_sent`;
- `reply_received`;
- `interview_requested`;
- `coverage_confirmed`;
- `correction_requested`.

Unauthenticated and auditor writes are rejected. The public newsroom endpoint cannot submit these types. The protected endpoint accepts exactly event type, campaign target and locale; it has no field for a person, outlet, recipient, email address, subject override, message, note, referrer or source.

## Outreach KPI framework

- Primary operating KPI: qualified editorial reuse events, calculated as Story Pack actions plus citation copies plus embed-code copies.
- Drivers: Pulse story views, social-card actions, allowlisted campaign landings and manually recorded pitches sent.
- Outcome signals: replies received, interview requests and confirmed coverage, reported separately.
- Guardrails: correction requests and event-write availability.

These counts are proxies. A landing can be automated, a click does not confirm a completed download, and an operator entry does not prove delivery or an editorial decision. No percentages are calculated because the event table contains no persistent visitor or session join. No target is assigned before a stable baseline exists.

## Windows and access

The protected admin metrics response reports all-time and trailing-30-day aggregates. Existing admin metrics authorization permits authenticated `admin` and `auditor` roles. The UI labels values as aggregate event counts.

## Persisted event fields

Each accepted event row contains only:

1. event type;
2. allowlisted target;
3. locale (`en` or `it`);
4. server timestamp.

The table has no persistent event ID or visitor ID: the server timestamp is the row key. The event path does not persist IP address, user agent, referrer, URL query, cookie/session ID, fingerprint, email, outlet, free text or recipient. The shared rate limiter can use an IP address transiently in process memory; this endpoint disables IP output in rate-limit logs.

## Guardrails and limitations

- Client writes are fire-and-forget and use `keepalive`; a failed event write does not block downloads, navigation or mail links.
- Payloads must contain exactly `eventType`, `target` and `locale`, pass the event/target allowlist and remain within the small request-size cap.
- No analytics cookies or third-party analytics services are used.
- Counts are not unique visitors and automated traffic can affect them.
- No conversion rate is produced because the event stream contains no persistent visitor or session identifier.
- No target is defined until a sufficiently stable baseline can be reviewed.

## Aggregate contract

The admin metrics response exposes:

- `data.pressNewsroom.allTime`;
- `data.pressNewsroom.trailing30Days`;
- `data.pressNewsroom.trailingWindowStartedAt`;
- `data.pressNewsroom.boundary`.

Package and contact aggregates include their allowlisted target breakdown. The editorial funnel exposes bounded totals for views, packs, cards, citations, embeds, launch actions, campaign landings and protected aggregate outreach operations. The Outreach Desk reports all-time and trailing-30-day counts by campaign and event type. A missing group is represented by zero rather than omitted.
