# PolicyWatcher Enterprise API v2 on Microsoft Azure

## Implemented foundation

The Enterprise API is a separate, read-only surface under `/api/v2`. It does not change or relax the anonymous public API v1.

- Microsoft Entra ID JWT verification is repeated at the PolicyWatcher origin, even when Azure API Management validates the token at the gateway.
- When `POLICYWATCHER_APIM_SHARED_SECRET` is configured, the origin also requires the gateway-only header injected by APIM.
- Both the delegated `policywatcher.read` scope and the `PolicyWatcher.Read.All` application role are supported.
- The verified `tid` claim creates the tenant boundary. Pilot tenants must be explicitly allowlisted.
- All responses use a stable `apiVersion`, `data`, and `meta` envelope. Errors use `application/problem+json` and include a correlation ID.
- Responses are private and non-cacheable. Raw policy text, hashes, private retrieval diagnostics, credentials, and admin logs are excluded.

The machine-readable contract is available at `/api/v2/openapi.json` and is intentionally public. Data endpoints require Entra authentication.

See [`../integrations.md`](../integrations.md) for the complete integration readiness matrix and the boundary between APIs, Power Platform, Teams, Copilot, MCP and Marketplace distribution.

## Entra application registration

Create one application registration for the PolicyWatcher Enterprise API. For the first test-tenant pilot, use a single-tenant registration. A future external customer pilot can make this API registration multi-tenant only after entitlement, consent-revocation and offboarding controls are implemented.

1. Set the Application ID URI, normally `api://<application-client-id>`.
2. Expose delegated scope `policywatcher.read` for Teams and interactive clients.
3. Define application role `PolicyWatcher.Read.All`, allowed for applications, for Power Automate, Logic Apps, and service-to-service access.
4. Grant only pilot customer tenants and record their tenant UUIDs in `POLICYWATCHER_ENTRA_ALLOWED_TENANTS`.
5. Configure `POLICYWATCHER_ENTRA_AUDIENCES` with the exact audience values emitted in access tokens.

Do not set the tenant allowlist to `*` until customer entitlement, offboarding, and consent revocation are implemented.

Interactive clients request the delegated `policywatcher.read` scope. Client-credentials callers request `<Application ID URI>/.default`; Entra then emits the assigned `PolicyWatcher.Read.All` role in the access token.

The Power Platform pilot uses a second app registration for the connector client. Do not reuse the protected API registration as the interactive connector client. The complete two-app setup and generator command are in the [Power Platform connector README](../../integrations/power-platform/policywatcher-v2/README.md).

## Azure API Management

1. Import `https://<policywatcher-host>/api/v2/openapi.json` into API Management.
2. Configure the backend origin and HTTPS only.
3. Add the named values referenced by `apim-policy.xml`.
4. Apply the inbound policy at the v2 API scope.
5. Set `POLICYWATCHER_ENTERPRISE_API_URL` to the public APIM base URL and configure the same high-entropy gateway secret at the origin and as a secret APIM named value.
6. Keep the origin-side Entra verification enabled. APIM validation is the first gate, not a replacement for backend authentication.
7. Configure tenant-aware quotas in APIM before onboarding more than one pilot tenant.

The sample policy validates issuer and audience at the gateway, propagates a safe request ID, and adds a coarse subscription rate limit. Scope or role authorization remains enforced by the origin so delegated and application tokens share one tested rule.

## Current endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v2/manifest` | Authenticated integration directory and data boundaries |
| `GET /api/v2/companies` | Paginated monitored companies and publishable sources |
| `GET /api/v2/changes` | Paginated, filtered, evidence-gated changes |
| `GET /api/v2/changes/{changeId}` | Structured change evidence without raw policy text |
| `GET /api/v2/sources/{sourceId}/continuity` | Sanitized source-state transitions |
| `GET /api/v2/observatory/signals` | Curated regulatory and governance signals |

## Deliberately deferred

This wave does not add tenant-owned records to SQLite. Watchlists, entitlements, connector installations, webhook subscriptions, delivery attempts, and audit retention require the PostgreSQL tenant schema. Signed outbound events and write operations must not be added before that migration and its isolation tests.

## Pilot acceptance checks

- A token from an allowlisted tenant with the delegated scope succeeds.
- A client-credentials token with the application role succeeds.
- Wrong audience, issuer, tenant, signature, expired token, and missing permission are rejected.
- Direct calls to the PolicyWatcher origin are rejected when the gateway secret is enabled; APIM-forwarded calls still undergo full Entra verification at the origin.
- Every response has `X-Request-Id`; errors can be correlated without logging bearer tokens.
- Only evidence-gated records appear and the excluded fields remain absent.
