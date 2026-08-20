# PolicyWatcher integration options

This document is the canonical map of the supported, pilot, and planned ways to consume PolicyWatcher evidence. The public portal is the human review surface. Machine integrations should use a documented API or a purpose-built client instead of fetching or embedding arbitrary portal HTML.

Public entry points:

- Integration directory: `/integrations`
- Public developer reference: `/developers`
- Public API v1 manifest: `/api/v1/manifest`
- Agent Evidence Gateway OpenAPI: `/api/v1/agent/openapi.json`
- Enterprise API v2 OpenAPI contract: `/api/v2/openapi.json`

## Readiness matrix

| Surface | Primary use | Authentication | Readiness | Entry point |
| --- | --- | --- | --- | --- |
| Public API v1 | Public evidence discovery, Observatory sources and signals | None; read-only CORS | Available | [`public-api-v1.md`](public-api-v1.md) |
| Publication Readiness metric | Aggregate configured, retrieved, baseline-verified, public and analysed counts plus latest capture | None; read-only CORS and no-store | Available | `/api/v1/publication-readiness` |
| Existing public data routes | Public companies, policy evidence, comparisons, trends and continuity where listed by the v1 manifest | Current route policy | Available | `/api/v1/manifest` |
| Shareable Evidence Collections | Select up to 12 exact public changes and export deterministic JSON, Markdown, CSV or vendor-neutral handoff records | None; browser-local selection plus read-only CORS | Available | `/collections` |
| Collaboration Handoff Manifest | Prepare review work items with evidence links, digests and acceptance criteria for authorized import | None; read-only deterministic export | Available | `/api/v1/evidence-collections?format=handoff` |
| Public Change Event Feed | Poll already-published change events with deterministic IDs and a forward cursor | None; read-only CORS | Available | `/api/v1/change-events` |
| Event Feed Continuity Lab | Inspect bounded polling windows and maintain a strict browser-local checkpoint | None; local browser state plus read-only CORS | Available | `/developers/event-continuity` |
| Webhook Readiness Kit | Verify the candidate HMAC-SHA256 receiver contract against a public deterministic vector | None; local browser verification plus read-only CORS | Available | `/developers/webhook-readiness` |
| Receiver Conformance Suite | Run eight deterministic positive and negative receiver fixtures and compare expected decisions | None; local browser execution plus read-only CORS | Available | `/api/v1/webhook-conformance-suite` |
| Configured Webhook Delivery Pilot | Deliver eligible public change events to deployment-configured HTTPS destinations with HMAC signatures and bounded retries | Deployment environment plus protected admin or cron authorization | Pilot ready | `/admin/webhook-delivery` |
| Change-card embed | Display one published change record on a third-party page | None; published evidence only | Available | `/embed/change/{id}` |
| Chrome browser extension | Extract policy-notice clues locally and hand off a reviewed inquiry | No mailbox permission; explicit user review | Available on Chrome | `/browser-extension` |
| Enterprise API v2 | Tenant-bound access to structured companies, changes, continuity and governance signals | Microsoft Entra ID scope or app role | Pilot ready | [`azure/enterprise-api-v2.md`](azure/enterprise-api-v2.md) |
| Azure API Management facade | Gateway validation, origin shielding, request correlation and tenant-aware quotas | Entra ID plus gateway-only origin header | Pilot ready | [`azure/apim-policy.xml`](azure/apim-policy.xml) |
| Power Platform custom connector | Power Automate, Power Apps, Logic Apps and Copilot Studio actions over API v2 | Entra delegated OAuth | Pilot ready | [`../integrations/power-platform/policywatcher-v2/README.md`](../integrations/power-platform/policywatcher-v2/README.md) |
| Agent Evidence Gateway | Deterministic cited public briefs for enterprise agents | None; public read-only CORS | Available | `/api/v1/agent/openapi.json` |
| Microsoft 365 Copilot evidence agent | Tenant-installed declarative agent and API plugin over the public gateway | None for public gateway; tenant app approval | Source package ready | [`../integrations/microsoft-copilot/policywatcher-evidence-agent/README.md`](../integrations/microsoft-copilot/policywatcher-evidence-agent/README.md) |
| Vertex AI Agent Builder tool | OpenAPI tool and tool-first playbook instructions | None for public gateway; Google Cloud project controls | Source package ready | [`../integrations/google-agent-builder/policywatcher-evidence-tool/README.md`](../integrations/google-agent-builder/policywatcher-evidence-tool/README.md) |
| Amazon Quick OpenAPI connector | Three-operation public evidence connector | None for public gateway; AWS account and sharing controls | Source package ready | [`../integrations/amazon-quick/policywatcher-evidence-connector/README.md`](../integrations/amazon-quick/policywatcher-evidence-connector/README.md) |
| Amazon Q Business custom plugin | Legacy compatibility for existing Amazon Q Business customers | None for public gateway; existing AWS application controls | Legacy source only | [`../integrations/amazon-q-business/policywatcher-evidence-plugin/README.md`](../integrations/amazon-q-business/policywatcher-evidence-plugin/README.md) |
| Word Contract Evidence Review | Local classification of selected contract clauses followed by a derived-topic evidence query | Office document read permission; public gateway query | Source package ready | [`../integrations/office-word/policywatcher-contract-evidence-review/README.md`](../integrations/office-word/policywatcher-contract-evidence-review/README.md) |
| Self-service webhook subscriptions | Tenant-managed endpoint registration, verification, key rotation and lifecycle controls | Tenant identity and managed secret custody | Planned | Roadmap |
| Microsoft Teams app | Dedicated tab and workflow actions without framing the normal portal | Entra delegated access | Planned | Roadmap |
| Federated MCP server | Tool-based access to bounded evidence for approved agents | Tenant-aware authorization | Planned | Roadmap |
| Microsoft Graph connector | Optional indexed copies for Microsoft 365 search and discovery | Tenant administration and schema controls | Planned | Roadmap |
| Microsoft commercial marketplace offer | Discovery first, then optional transactable SaaS provisioning | Customer entitlement and billing lifecycle | Commercial later | Roadmap |

`Pilot ready` means that the protected service code and contracts required for a controlled test tenant are present. `Source package ready` means that importable source manifests, instructions and boundaries are present but no customer tenant, cloud project or account has been changed. Neither label means certified, generally available, marketplace-published or provisioned for external customers.

## Choose the integration by job

### Publish or research public evidence

Use API v1 for anonymous, read-only access to the public evidence directory, curated Observatory registry and deterministic Evidence Collections. Clients should discover current routes and boundaries through `/api/v1/manifest` rather than assume that every portal endpoint is a stable integration contract. Most reference resources are cacheable; `/api/v1/publication-readiness` is database-derived on request and explicitly uses `Cache-Control: no-store`.

Use `/api/v1/publication-readiness` when an integration needs the same aggregate operational funnel used by Admin and competitive analysis. Its JSON Schema is `/schemas/publication-readiness/v1`. It exposes counts, availability and the latest successful capture timestamp only, never policy text, private records or internal identifiers.

Use `/collections` when a reviewer needs to group up to 12 exact public changes before handing a stable bundle to another person or tool. Selection, title and review status are stored locally. A share URL carries only sorted public UUIDs, and the JSON, Markdown and CSV exports contain provenance, digests, citations, review questions and explicit boundaries. This is a portable review artifact, not a persistent team workspace.

Use `format=handoff` when a receiving workflow needs deterministic work-item titles, acceptance criteria, evidence links and digests. The manifest is vendor-neutral and creates no Jira, Confluence, Teams, GRC or other third-party record. It contains no assignee, due date, notification state or delivery confirmation; those controls remain the responsibility of the authorized receiving system.

Use the change-card embed only when a page needs to display one published change. It is a narrow presentation surface, not a replacement for API access.

### Build a tenant-controlled Microsoft workflow

Use API v2 through Azure API Management. The API validates Microsoft Entra tokens again at the PolicyWatcher origin and binds every accepted request to an allowlisted `tid` claim. Interactive clients use the delegated `policywatcher.read` scope; service-to-service callers use the `PolicyWatcher.Read.All` application role.

For Power Automate, Power Apps, Logic Apps or Copilot Studio, start with the Power Platform custom connector package. It calls API v2 and does not scrape or frame the portal.

### Reach public evidence from an enterprise agent

Use `/api/v1/agent/openapi.json` when a Microsoft 365 Copilot declarative agent, Vertex AI Agent Builder playbook or Amazon Quick connector needs to retrieve public PolicyWatcher evidence. The contract contains three `GET` operations: capabilities, public change briefs and curated Observatory briefs. Responses are deterministic and flattened for cross-platform compatibility; citations are newline-delimited source URLs rather than inferred references. Amazon Q Business source remains available only for existing customers because AWS stopped opening that service to new customers on 31 July 2026.

The provider packages remain inside the customer's Microsoft 365 tenant, Google Cloud project or AWS account. PolicyWatcher hosts the evidence API, but it does not deploy, configure or administer those customer environments. The public gateway accepts no prompt transcript, document body, selected clause, tenant identifier, access token or arbitrary metadata. Query parameters are allowlisted and bounded, the service applies a non-persistent-IP rate bucket, and a zero-result response explicitly does not establish absence of a relevant change.

Use the Entra-authenticated Enterprise API v2 when the use case requires private or tenant-specific data. Do not convert the anonymous public gateway into a private-data path by changing agent instructions alone.

### Review contract clauses from Word

The Word source package provides a task pane at `/office-addin/contract-review`. After an explicit button press, it reads the current selection with Office.js and classifies up to 12,000 characters against a fixed contract-topic taxonomy inside the task pane. It displays the derived labels and requires a separate acknowledgement before sending only those labels, language and result limit to the public gateway.

The network request contains no selected text, document name, document ID, user identifier, tenant identifier or Office access token. If no fixed topic matches, the reviewer selects one controlled topic manually; the add-in does not fall back to sending extracted words. This is evidence mapping for review. It does not verify a contract, approve a clause, determine compliance or provide legal advice.

### Notify another system

Use `/api/v1/change-events` for bounded anonymous polling of already-published policy change events. Start without a cursor, store the returned `nextCursor`, and pass it unchanged on subsequent requests. Cursor order follows the evidence publication gate rather than source retrieval time, so a previously withheld change can appear when it is approved. The initial response is a recent window rather than a complete historical archive; consumers deduplicate by `eventId` and follow exact Change and Evidence Packet links before routing work.

Use `/developers/event-continuity` to rehearse that consumer behavior in the browser. The lab keeps its checkpoint local, accepts only the strict versioned checkpoint shape, reports observable duplicates, ordering regressions, overlap and truncation, and resumes only after an explicit action. It is not a hosted consumer, replay service or delivery monitor, and a clean window is not evidence of exhaustive monitoring.

Beta 23 provides a deployment-controlled outbound pilot for the same public event envelope. Operators configure a bounded list of exact HTTPS origins and receiver paths in the deployment environment, then invoke one bounded cycle through the protected admin console or authenticated cron route. Each request carries the documented HMAC-SHA256 v1 headers; a persistent outbox and per-attempt ledger record sanitized outcomes and a fixed retry schedule. The pilot does not provide public registration, tenant self-service, endpoint challenge verification, automatic key rotation, guaranteed delivery, an SLA or evidence that a receiver processed a returned 2xx request.

Use `/developers/webhook-readiness` to exercise the candidate receiver contract without sending a secret or payload to PolicyWatcher. The workbench computes the editable test signature locally, while `/api/v1/webhook-verification-kit` distributes the versioned header names, signing-input format, public test-only vector, receiver checklist and Node/Python examples. The same page runs the eight fixtures from `/api/v1/webhook-conformance-suite` and can export only case IDs, expected and actual decision codes, totals and the interpretation boundary. It excludes secret, payload, signature and browser fingerprint data. Passing the static vector or all fixtures establishes compatibility with those exact cases only; evaluate freshness at the recorded vector time and keep current-time freshness enabled for production traffic. It is not endpoint registration, delivery readiness or security certification.

Do not automate portal HTML. Use the public polling feed for anonymous consumers, the configured delivery pilot for an operator-controlled receiver, or bounded API v2 reads for a controlled Entra tenant.

### Put PolicyWatcher inside Teams or Copilot

The normal portal is protected against third-party framing. A Teams experience therefore still requires a dedicated, frame-eligible route and its own authentication, content-security and navigation review. The delivered Copilot source package uses the bounded public agent contract through a declarative agent and API plugin, not page fetching. It does not replace a future authenticated Teams or MCP surface.

### Distribute through a marketplace

Marketplace distribution is a commercial packaging layer, not the data integration itself. A first offer may provide discovery and contact-based onboarding. A transactable SaaS offer additionally requires tenant provisioning, entitlements, plans, billing events, offboarding, consent revocation and support operations. These lifecycle controls are deliberately outside the current pilot.

## Enterprise pilot architecture

```text
Power Platform / private service client
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

Public APIs and evidence bundles remain read-only. The configured webhook pilot can send the same already-public event envelope to deployment-controlled receivers; it does not expose a write API or accept third-party content. Evidence Collections may repeat public snapshot fingerprints and public analytical fields already present in exact-change Evidence Packets. The integration surfaces do not expose:

- raw policy text or full snapshots;
- content hashes or internal diffs;
- raw retrieval errors, final redirect URLs or private diagnostics;
- credentials, bearer tokens or gateway secrets;
- administrative logs or tenant-owned operational records;
- unrestricted AI context or unreviewed private evidence.

An integration response supports investigation and workflow routing. It is not a legal determination, compliance certification or guarantee of source completeness.

## Version choice

Use v1 when anonymous public evidence and browser-readable CORS are sufficient. Use the bounded v1 Agent Evidence Gateway for public evidence dialogue across Microsoft, Google and AWS agents. Use v2 for private enterprise tenant boundaries, Microsoft Entra authentication, Azure API Management and Power Platform. The versions coexist: the cross-cloud public contract does not replace or weaken v2 authorization.

## Production gates after the pilot

Before onboarding multiple customer tenants or publishing a commercial connector, add and verify:

1. tenant entitlement, offboarding and consent-revocation workflows;
2. a tenant-isolated PostgreSQL data model for installation and delivery records;
3. APIM quotas, monitoring, alerting and key rotation;
4. connector certification packaging and support ownership;
5. tenant self-service delivery only after endpoint proof, replay, rotation and retention controls exist;
6. end-to-end isolation tests across at least two tenants.
