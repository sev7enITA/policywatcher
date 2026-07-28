# PolicyWatcher 3.9.0 Beta 11 audit

Date: 28 July 2026

## Scope

Beta 11 adds a deliberately small public integration surface. The release contains a versioned API directory, a localized public Observatory registry endpoint and the `/developers` documentation page. It does not change policy retrieval, ingestion, analysis, administrative permissions or database schema.

## Public API contract

| Route | Access | Data class | Cache | Boundary |
| --- | --- | --- | --- | --- |
| `/api/v1/manifest` | `GET`, no credentials | Public API metadata | 300 second shared cache | Directory only; no database access |
| `/api/v1/observatory?lang=en|it` | `GET`, no credentials | Curated public-reference registry | 300 second shared cache | Manually reviewed local registry, not a live external feed |

The routes use credential-free cross-origin read access, accept only `GET` and `OPTIONS`, and use a shared in-process 60 request-per-minute IP limit. Unsupported locale values fail with a `400` response. The manifest lists public routes and source gates but does not expand their existing data boundaries.

## Exclusions

The release keeps the following data outside the public integration surface:

- policy text, snapshots, hashes and diffs;
- raw retrieval reasons, final redirect destinations and renderer diagnostics;
- AI analysis content and private evidence;
- administrator records, access logs, operational controls and credentials;
- external feed ingestion, write methods, signed outbound events and webhooks.

## Discoverability

The new `/developers` directory is reachable through Builder-oriented navigation, command search, the Footer, Site Atlas, sitemap, Feature Intelligence Atlas and the Release Impact roadmap. The public header is not expanded with another top-level item in order to keep its compact navigation model.

## Verification performed

- `npm test`: 63 files and 373 tests passed.
- `npm run build`: production build completed and generated `/developers`, `/api/v1/manifest` and `/api/v1/observatory`.
- `npm run lint`: no application errors; one pre-existing warning remains in an unrelated untracked temporary presentation file under `tmp/`.
- Playwright desktop and mobile checks: `/developers` returned HTTP 200, produced no console or page errors, and had no horizontal body overflow at 1440 px or 390 px widths.
- Endpoint checks: both v1 routes returned HTTP 200 with read-only CORS headers and 300-second shared caching; `lang=fr` returned HTTP 400.

## Residual constraints

The rate limiter is process-local, which is appropriate to the bounded Hostinger runtime but is not a distributed quota service. External consumers should treat source metadata and Observatory entries as reference material with the displayed review context, then inspect the linked primary sources for their own use case.
