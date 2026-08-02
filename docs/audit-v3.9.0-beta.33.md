# PolicyWatcher 3.9.0 Beta 33 audit

Date: 2 August 2026

## Delivered renderer hardening

- Required registrable-domain egress allowlist and HTTPS-only target policy.
- Separate cross-site subresource allowlist while same-site resources retain PSL-based coherence checks.
- Current/previous bearer-secret overlap for bounded rotation with constant-time comparison.
- Minimal unauthenticated liveness and authenticated Chromium readiness.
- Total timeout, HTML response cap, request identifiers, query-free logs and graceful draining.
- Protected VPS console support for readiness, capacity, allowlist and rotation evidence.

## Verification

- Renderer Node tests cover allowlist parsing, subdomain boundaries, secret overlap, HTTPS enforcement and log redaction.
- Application tests, TypeScript, lint and production build cover integration wiring.

## Residual boundary

Chromium owns its sockets, so Playwright request validation is not strong DNS pinning. Renderer readiness does not certify source authenticity, continuous availability, live egress controls or secret custody.
