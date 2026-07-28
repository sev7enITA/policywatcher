# PolicyWatcher public API v1

## Purpose

The `v1` integration directory is a small, read-only surface for public evidence metadata and the curated Observatory registry. It is intentionally separate from protected operations, policy-ingestion workflows, raw snapshots and administrative records.

For the complete integration decision guide and readiness matrix, see [`integrations.md`](integrations.md). Enterprise tenant-bound use cases belong to the separate [API v2 pilot](azure/enterprise-api-v2.md).

## Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/manifest` | `GET` | Current integration directory: exposed public sources, parameter allowlists, evidence boundaries, cache and rate policy. |
| `/api/v1/observatory?lang=en` | `GET` | Curated local registry of sources, signals and events. Accepts `en` or `it`. |

Both endpoints support read-only browser access with no credentials. They send `Access-Control-Allow-Origin: *`, do not accept cookies or credentials, and share a 60 request-per-minute in-process rate limit per IP. `Cache-Control` uses a 60-second browser and 300-second shared-cache window.

## Data boundaries

- Public evidence records remain subject to the same publication gates used by PolicyWatcher public views.
- Observatory data is a curated local registry with a visible review timestamp. It is not an automatically ingested external news feed.
- The v1 surface omits policy text, hashes, raw retrieval failures, final redirect URLs, AI analysis, source-private records, credentials and administrative logs.
- Existing public routes listed in the manifest retain their current paths during the beta. The manifest is the versioned directory; it does not represent a promise of write access or an availability commitment.

## Relationship to v2 and the roadmap

API v2 and the Power Platform custom connector are available for a controlled Microsoft Entra test-tenant pilot. They do not replace v1 or make its anonymous endpoints authenticated.

Signed outbound events remain planned. They must not be added until event schemas, replay protection, retention, endpoint verification and integration health checks have their own bounded design and test coverage.
