# PolicyWatcher 3.9.0 Beta 36 audit

Date: 2 August 2026

## Delivered Administrative Mutation Hardening

- Central boundary for unsafe `POST`, `PUT`, `PATCH` and `DELETE` requests under `/api/admin/*` only.
- Cross-site Fetch Metadata denial, exact Origin matching and production fail-closed provenance behavior.
- Explicit controlled missing-provenance path restricted to non-production environments.
- Validated Content-Length parsing and differentiated route caps, including onboarding and encrypted-backup payloads.
- JSON media-type enforcement with explicit known no-body and optional-body action policies.
- Bounded process-local per-route and method mutation rate limit.
- `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` and bounded `Vary` metadata on admin API responses.
- Denial logging limited to normalized route, method and reason without body, credential, query or client-address content.
- Existing nonce CSP and embed and Office framing behavior retained for non-API pages.

## Verification

- Focused tests cover same-origin acceptance, cross-site and mismatched-origin denial, production provenance failure, malformed and oversized declarations, route-specific caps, media types, no-body actions, rate behavior, safe response headers, bounded logs and page CSP regression.
- TypeScript, lint, the application suite and production build cover the centralized integration.

## Residual boundary

The limiter is in-memory and process-local for the current single-instance deployment. This boundary is defense in depth, not a penetration test, CSRF certification, distributed rate limit, guarantee against denial of service or proof of reverse-proxy behavior.
