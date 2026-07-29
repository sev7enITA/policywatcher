# PolicyWatcher integration options

This document is the canonical map of the supported, pilot, and planned ways to consume PolicyWatcher evidence. The public portal is the human review surface. Machine integrations should use a documented API or a purpose-built client instead of fetching or embedding arbitrary portal HTML.

Public entry points:

- Integration directory: `/integrations`
- Public developer reference: `/developers`
- Public API v1 manifest: `/api/v1/manifest`
- Enterprise API v2 OpenAPI contract: `/api/v2/openapi.json`

## Readiness matrix

| Surface | Primary use | Authentication | Readiness | Entry point |
| --- | --- | --- | --- | --- |
| Public API v1 | Public evidence discovery, Observatory sources and signals | None; read-only CORS | Available | [`public-api-v1.md`](public-api-v1.md) |
| Existing public data routes | Public companies, policy evidence, comparisons, trends and continuity where listed by the v1 manifest | Current route policy | Available | `/api/v1/manifest` |
| Shareable Evidence Collections | Select up to 12 exact public changes and export deterministic JSON, Markdown, CSV or vendor-neutral handoff records | None; browser-local selection plus read-only CORS | Available | `/collections` |
| Collaboration Handoff Manifest | Prepare review work items with evidence links, digests and acceptance criteria for authorized import | None; read-only deterministic export | Available | `/api/v1/evidence-collections?format=handoff` |
| Public Change Event Feed | Poll already-published change events with deterministic IDs and a forward cursor | None; read-only CORS | Available | `/api/v1/change-events` |
| Change-card embed | Display one published change record on a third-party page | None; published evidence only | Available | `/embed/change/{id}` |
| Chrome browser extension | Extract policy-notice clues locally and hand off a reviewed inquiry | No mailbox permission; explicit user review | Available on Chrome | `/browser-extension` |
| Enterprise API v2 | Tenant-bound access to structured companies, changes, continuity and governance signals | Microsoft Entra ID scope or app role | Pilot ready | [`azure/enterprise-api-v2.md`](azure/enterprise-api-v2.md) |
| Azure API Management facade | Gateway validation, origin shielding, request correlation and tenant-aware quotas | Entra ID plus gateway-only origin header | Pilot ready | [`azure/apim-policy.xml`](azure/apim-policy.xml) |
| Power Platform custom connector | Power Automate, Power Apps, Logic Apps and Copilot Studio actions over API v2 | Entra delegated OAuth | Pilot ready | [`../integrations/power-platform/policywatcher-v2/README.md`](../integrations/power-platform/policywatcher-v2/README.md) |
| Signed webhooks | Event-driven delivery of verified change notifications | To be designed with signing and replay protection | Planned | Roadmap |
| Microsoft Teams app | Dedicated tab and workflow actions without framing the normal portal | Entra delegated access | Planned | Roadmap |
| Copilot declarative agent or API plugin | Governed evidence retrieval through API v2 | Entra delegated access | Planned | Roadmap |
| Federated MCP server | Tool-based access to bounded evidence for approved agents | Tenant-aware authorization | Planned | Roadmap |
| Microsoft Graph connector | Optional indexed copies for Microsoft 365 search and discovery | Tenant administration and schema controls | Planned | Roadmap |
| Microsoft commercial marketplace offer | Discovery first, then optional transactable SaaS provisioning | Customer entitlement and billing lifecycle | Commercial later | Roadmap |

`Pilot ready` means that the code and contracts required for a controlled test tenant are present. It does not mean that the integration is certified, generally available, or provisioned for external customer tenants.

## Choose the integration by job

### Publish or research public evidence

Use API v1 for anonymous, cacheable, read-only access to the public evidence directory, curated Observatory registry and deterministic Evidence Collections. Clients should discover current routes and boundaries through `/api/v1/manifest` rather than assume that every portal endpoint is a stable integration contract.

Use `/collections` when a reviewer needs to group up to 12 exact public changes before handing a stable bundle to another person or tool. Selection, title and review status are stored locally. A share URL carries only sorted public UUIDs, and the JSON, Markdown and CSV exports contain provenance, digests, citations, review questions and explicit boundaries. This is a portable review artifact, not a persistent team workspace.

Use `format=handoff` when a receiving workflow needs deterministic work-item titles, acceptance criteria, evidence links and digests. The manifest is vendor-neutral and creates no Jira, Confluence, Teams, GRC or other third-party record. It contains no assignee, due date, notification state or delivery confirmation; those controls remain the responsibility of the authorized receiving system.

Use the change-card embed only when a page needs to display one published change. It is a narrow presentation surface, not a replacement for API access.

### Build a tenant-controlled Microsoft workflow

Use API v2 through Azure API Management. The API validates Microsoft Entra tokens again at the PolicyWatcher origin and binds every accepted request to an allowlisted `tid` claim. Interactive clients use the delegated `policywatcher.read` scope; service-to-service callers use the `PolicyWatcher.Read.All` application role.

For Power Automate, Power Apps, Logic Apps or Copilot Studio, start with the Power Platform custom connector package. It calls API v2 and does not scrape or frame the portal.

### Notify another system

Use `/api/v1/change-events` for bounded anonymous polling of already-published policy change events. Start without a cursor, store the returned `nextCursor`, and pass it unchanged on subsequent requests. Cursor order follows the evidence publication gate rather than source retrieval time, so a previously withheld change can appear when it is approved. The initial response is a recent window rather than a complete historical archive; consumers deduplicate by `eventId` and follow exact Change and Evidence Packet links before routing work.

Signed outbound webhooks remain planned. The polling feed establishes a versioned public envelope, but a production push design still needs tenant-owned subscriptions, delivery retention, endpoint verification, replay protection, HMAC signing, signing-key rotation, retries and integration-health controls.

Do not treat the absence of push delivery as permission to automate portal HTML. Use the public polling feed for public events or bounded API v2 reads for a controlled Entra tenant.

### Put PolicyWatcher inside Teams or Copilot

The normal portal is protected against third-party framing. A Teams experience therefore requires a dedicated, frame-eligible route and its own authentication, content-security and navigation review. A Copilot integration should use the bounded API contract through a declarative agent or API plugin, not page fetching.

### Distribute through a marketplace

Marketplace distribution is a commercial packaging layer, not the data integration itself. A first offer may provide discovery and contact-based onboarding. A transactable SaaS offer additionally requires tenant provisioning, entitlements, plans, billing events, offboarding, consent revocation and support operations. These lifecycle controls are deliberately outside the current pilot.

## Enterprise pilot architecture

```text
Power Platform / future Teams / service client
                    |
           Microsoft Entra ID token
                    |
          Azure API Management
       token gate, quota, request ID
                    |
      gateway-only origin credential
                    |
         PolicyWatcher API v2
  token revalidation, tenant allowlist,
       evidence and field boundaries
                    |
        structured evidence response
```

The gateway is a first gate, not the only gate. The origin still verifies signature, issuer, audience, expiry, tenant and the required scope or role.

## Test-tenant inputs

The Power Platform pilot requires:

| Value | Where to find it | Secret? |
| --- | --- | --- |
| Tenant ID | Microsoft Entra admin center, **Identity > Overview > Tenant ID** | No |
| API client ID | API app registration, **Overview > Application (client) ID** | No |
| Connector client ID | Connector app registration, **Overview > Application (client) ID** | No |
| Public PolicyWatcher URL | The HTTPS origin or APIM gateway base URL | No |
| Power Platform environment ID | Power Platform admin center or the environment URL/details | No, optional for generation |
| Connector client secret value | Connector app registration, **Certificates & secrets** | Yes |

Only the secret value is a credential. Keep it out of the repository, generated connector JSON, shared shell history and screenshots. See the connector README for the exact generator and import commands.

## Evidence and privacy boundaries

All integration surfaces remain read-only in the current release. They expose only public or tenant-authorized structured evidence through an explicit publication gate. Evidence Collections may repeat public snapshot fingerprints and public analytical fields already present in exact-change Evidence Packets. They do not expose:

- raw policy text or full snapshots;
- content hashes or internal diffs;
- raw retrieval errors, final redirect URLs or private diagnostics;
- credentials, bearer tokens or gateway secrets;
- administrative logs or tenant-owned operational records;
- unrestricted AI context or unreviewed private evidence.

An integration response supports investigation and workflow routing. It is not a legal determination, compliance certification or guarantee of source completeness.

## Version choice

Use v1 when anonymous public evidence and browser-readable CORS are sufficient. Use v2 for enterprise tenant boundaries, Microsoft Entra authentication, Azure API Management and Power Platform. The two versions coexist: v2 does not replace or weaken v1.

## Production gates after the pilot

Before onboarding multiple customer tenants or publishing a commercial connector, add and verify:

1. tenant entitlement, offboarding and consent-revocation workflows;
2. a tenant-isolated PostgreSQL data model for installation and delivery records;
3. APIM quotas, monitoring, alerting and key rotation;
4. connector certification packaging and support ownership;
5. signed-event delivery only after replay and retention controls exist;
6. end-to-end isolation tests across at least two tenants.
