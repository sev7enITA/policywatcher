# PolicyWatcher public API v1

## Purpose

The `v1` integration directory is a small, read-only surface for public evidence metadata, the curated Observatory registry and deterministic multi-change evidence collections. It is intentionally separate from protected operations, policy-ingestion workflows, raw snapshot text and administrative records.

For the complete integration decision guide and readiness matrix, see [`integrations.md`](integrations.md). Enterprise tenant-bound use cases belong to the separate [API v2 pilot](azure/enterprise-api-v2.md).

## Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/manifest` | `GET` | Current integration directory: exposed public sources, parameter allowlists, evidence boundaries, cache and rate policy. |
| `/api/v1/observatory?lang=en` | `GET` | Curated local registry of sources, signals and events. Accepts `en` or `it`. |
| `/api/v1/evidence-collections?changes={uuid,...}&format=json` | `GET` | Deterministic bundle for 1 to 12 exact published changes. Accepts `json`, `markdown`, `csv` or `handoff`. |
| `/api/v1/change-events?limit=25&lang=en` | `GET` | Forward-only polling feed for already-published policy change events. Accepts `cursor`, `limit` and `lang`. |
| `/api/v1/webhook-verification-kit` | `GET` | Versioned candidate receiver contract, public test-only vector and Node/Python verification examples. |

All endpoints support read-only browser access with no credentials and send `Access-Control-Allow-Origin: *` without accepting cookies or credentials. The manifest, Observatory and Webhook Verification Kit use 60 request-per-minute reference-route buckets. Evidence Collections and Change Events each use a separate 30 request-per-minute bucket. Collections uses a 300-second browser cache and a 3,600-second shared-cache window; Change Events uses a 30-second browser cache and a 60-second shared-cache window; the versioned verification kit uses a 3,600-second browser cache and an 86,400-second shared-cache window.

The collection route accepts exactly one comma-separated `changes` parameter and, optionally, exactly one `format` parameter. UUIDs are normalized, deduplicated and sorted. If any selected change is missing, withheld or not public, the route returns one generic unavailable response and does not disclose a partial collection.

`format=handoff` returns `application/vnd.policywatcher.evidence-handoff+json`. The payload contains deterministic work-item IDs, titles, evidence links, packet and snapshot digests, review questions and acceptance criteria. It deliberately omits assignees, due dates, access control, delivery state and vendor-specific record identifiers. An authorized person or controlled integration must decide whether and how to create records in a receiving system.

The change-event route returns the latest bounded public window when no cursor is supplied. Consumers store `nextCursor` and pass it unchanged on later requests to receive events published after that exact publication timestamp and change ID. The publication timestamp records the local evidence-gate transition; it is distinct from source retrieval time. Events are returned in chronological order, carry deterministic `pwe_` identifiers and link to the exact Change and Evidence Packet. A change that is withheld and later republished receives a new event identifier. Consumers must deduplicate by `eventId`, respect `hasMore`, and treat `initialWindowTruncated` as notice that the first response is not a complete historical archive.

The Webhook Verification Kit defines a candidate `v1` signature as HMAC-SHA256 over `{unix_timestamp}.{raw_request_body}` and includes one public test-only secret. The static vector is a signature-compatibility fixture: evaluate its freshness with the clock fixed at the vector timestamp. Do not disable timestamp freshness in a production receiver. Production receivers must use tenant-owned secrets, constant-time comparison, timestamp tolerance, replay storage, controlled key rotation and bounded operational logging. The kit does not create subscriptions, accept endpoint URLs or deliver events.

## Data boundaries

- Public evidence records remain subject to the same publication gates used by PolicyWatcher public views.
- Observatory data is a curated local registry with a visible review timestamp. It is not an automatically ingested external news feed.
- The v1 surface omits raw policy text, raw retrieval failures, final redirect URLs, source-private records, credentials and administrative logs. A collection may repeat public snapshot fingerprints, sanitized score explanations and advisory governance mappings already exposed by the selected public Evidence Packets.
- Existing public routes listed in the manifest retain their current paths during the beta. The manifest is the versioned directory; it does not represent a promise of write access or an availability commitment.
- A handoff manifest is a portable review aid. Its `ready-for-human-triage` state is not an assignment, approval, legal conclusion or confirmation that a receiving system created a record.
- The event feed is a polling contract only. `nextCursor` records polling position; it is not a delivery receipt, acknowledgment, secret or authorization token.
- The webhook test secret is intentionally public and must never be used outside the deterministic compatibility vector.

## Relationship to v2 and the roadmap

API v2 and the Power Platform custom connector are available for a controlled Microsoft Entra test-tenant pilot. They do not replace v1 or make its anonymous endpoints authenticated.

Signed outbound delivery and persistent team workspaces remain planned. The public event envelope can be reused as a future webhook payload, but subscriptions, identity, access control, replay protection, retention, endpoint verification, signing-key rotation and integration-health checks still require their own bounded design and test coverage.
