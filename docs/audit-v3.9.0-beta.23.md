# PolicyWatcher 3.9.0 Beta 23 implementation audit

Date: 30 July 2026
Release: Configured Webhook Delivery Pilot

## Functional outcome

Beta 23 adds controlled outbound delivery for the existing public `policy.change.published` envelope. Destinations are supplied by deployment configuration. Eligible public changes are placed in a persistent outbox once per endpoint and event. Each attempt uses the documented HMAC-SHA256 v1 signature contract and records a sanitized outcome in a separate attempt ledger.

The feature is operated through `/admin/webhook-delivery` or one authenticated `POST /api/cron/webhook-delivery` call. An administrator can start one bounded cycle and reschedule an eligible failed item. An auditor can inspect the sanitized state but cannot mutate it.

## Implemented controls

- maximum 10 configured destinations and 50 newly discovered events per destination per cycle;
- maximum 25 due delivery records processed per cycle;
- exact deployment allowlist of public HTTPS origins;
- rejection of credentials, fragments, IP literals, localhost names, unsupported fields and non-canonical activation timestamps;
- non-public 32 to 256 character signing secret supplied outside source control;
- signature over the exact serialized request bytes with timestamp and stable public event ID headers;
- redirect rejection, credential omission, no-store request mode and an eight-second timeout;
- persistent pending, processing, retry, delivered and failed states;
- atomic claim before network delivery and recovery of processing claims older than 15 minutes;
- maximum six attempts with fixed delays of 60 seconds, 5 minutes, 30 minutes, 2 hours and 12 hours;
- retryable treatment limited to network/timeout outcomes and HTTP 408, 425, 429 and 5xx responses;
- response bodies cancelled and not stored; logs and API responses omit secrets, full destination paths, query strings and exception text;
- same-origin enforcement for protected browser mutations and bearer authorization for the cron route;
- additive Prisma migration, Hostinger JavaScript/Python fallback DDL and database-readiness coverage.

## Data model

`WebhookDelivery` identifies one event for one deployment endpoint and retains current state, bounded status metadata and timestamps. The unique `(endpointId, eventId)` key prevents duplicate outbox creation. `WebhookDeliveryAttempt` retains one numbered outcome per attempt and cascades with its parent delivery record.

No receiver request body, response body, signing secret, full destination URL, user identifier or browser fingerprint is stored in these tables.

## Verification performed

- configuration rejection and allowlist tests;
- receiver-compatible signature verification over exact bytes;
- HTTP and network outcome classification tests;
- protected admin/auditor and cron authorization tests;
- strict retry mutation and cross-origin rejection tests;
- admin UI state, limitation and responsive-ledger regression tests;
- Prisma client generation and migration deployment against a temporary SQLite database;
- Hostinger initializer syntax and schema-parity checks;
- TypeScript, lint, full test suite and production build.

The final command results are recorded in the release handoff; passing repository tests are implementation evidence, not an availability or security certification.

## Residual risks and explicit exclusions

- Deployment operators remain responsible for destination ownership, DNS and network egress policy. An origin allowlist does not independently prevent DNS rebinding after configuration.
- The pilot does not perform an endpoint challenge or prove control before activation.
- A 2xx response records HTTP acceptance only; it does not prove downstream processing or business completion.
- There is no public subscription form, tenant self-service, per-tenant identity model or automatic signing-key rotation.
- The persistent ledger is an operational record, not a guaranteed replay service or externally acknowledged receipt.
- SQLite is suitable for this bounded single-deployment pilot; broader multi-worker or multi-tenant delivery requires a production queue and isolation design.
- No delivery SLA, uptime claim, exhaustive-monitoring claim or legal/compliance conclusion is made.

## Next bounded work

Before any self-service or multi-tenant release, add endpoint proof, tenant ownership, managed secret rotation with overlap, replay-retention policy, delivery-health alerting, destination suspension controls, egress enforcement and isolation tests across separate tenants. Keep the public polling feed as an independent consumer option.
