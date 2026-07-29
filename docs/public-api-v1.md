# PolicyWatcher public API v1

## Purpose

The `v1` integration directory is a small, read-only surface for public evidence metadata, the curated Observatory registry and deterministic multi-change evidence collections. It is intentionally separate from protected operations, policy-ingestion workflows, raw snapshot text and administrative records.

For the complete integration decision guide and readiness matrix, see [`integrations.md`](integrations.md). Enterprise tenant-bound use cases belong to the separate [API v2 pilot](azure/enterprise-api-v2.md).

## Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/manifest` | `GET` | Current integration directory: exposed public sources, parameter allowlists, evidence boundaries, cache and rate policy. |
| `/api/v1/observatory?lang=en` | `GET` | Curated local registry of sources, signals and events. Accepts `en` or `it`. |
| `/api/v1/evidence-collections?changes={uuid,...}&format=json` | `GET` | Deterministic bundle for 1 to 12 exact published changes. Accepts `json`, `markdown` or `csv`. |

All endpoints support read-only browser access with no credentials and send `Access-Control-Allow-Origin: *` without accepting cookies or credentials. The manifest and Observatory share a 60 request-per-minute in-process rate limit per IP and use a 60-second browser plus 300-second shared-cache window. Evidence Collections uses a separate 30 request-per-minute limit, a 300-second browser cache and a 3,600-second shared-cache window.

The collection route accepts exactly one comma-separated `changes` parameter and, optionally, exactly one `format` parameter. UUIDs are normalized, deduplicated and sorted. If any selected change is missing, withheld or not public, the route returns one generic unavailable response and does not disclose a partial collection.

## Data boundaries

- Public evidence records remain subject to the same publication gates used by PolicyWatcher public views.
- Observatory data is a curated local registry with a visible review timestamp. It is not an automatically ingested external news feed.
- The v1 surface omits raw policy text, raw retrieval failures, final redirect URLs, source-private records, credentials and administrative logs. A collection may repeat public snapshot fingerprints, sanitized score explanations and advisory governance mappings already exposed by the selected public Evidence Packets.
- Existing public routes listed in the manifest retain their current paths during the beta. The manifest is the versioned directory; it does not represent a promise of write access or an availability commitment.

## Relationship to v2 and the roadmap

API v2 and the Power Platform custom connector are available for a controlled Microsoft Entra test-tenant pilot. They do not replace v1 or make its anonymous endpoints authenticated.

Signed outbound events and persistent team workspaces remain planned. They must not be added until identity, access control, event schemas, replay protection, retention, endpoint verification and integration health checks have their own bounded design and test coverage.
