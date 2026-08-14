# PolicyWatcher Enterprise v2: Power Platform pilot connector

This package creates a tenant-scoped, read-only custom connector for Power Automate, Power Apps, Logic Apps, and Copilot Studio. It calls the PolicyWatcher Enterprise API v2; it does not scrape or embed the portal. The production route uses Azure API Management. A test-tenant smoke test can temporarily call the HTTPS origin directly because the origin still performs full Entra token validation.

For the full cross-platform readiness matrix and integration decision guide, see [`docs/integrations.md`](../../../docs/integrations.md).

## What is included

- `apiDefinition.swagger.template.json`: Swagger 2.0 connector definition with Power Platform extensions and typed responses.
- `apiProperties.template.json`: Microsoft Entra OAuth settings for the connector client application.
- `scripts/generate-power-platform-connector.mjs`: generates deployable JSON without storing a client secret.
- `public/logo-mark.png`: existing PolicyWatcher icon used during import.

The connector exposes five primary actions:

1. List monitored companies.
2. List verified policy changes.
3. Get a verified policy change.
4. Get source continuity.
5. List governance signals.

## Required Entra applications

Use two app registrations in the test tenant.

### 1. PolicyWatcher Enterprise API

- Supported account type for the first pilot: accounts in the test organizational directory only.
- Application ID URI: normally `api://<API application client ID>`.
- Delegated scope: `policywatcher.read`.
- Application role: `PolicyWatcher.Read.All`, allowed member type `Application`.
- No redirect URI or client secret is required for the API registration.

Set the backend variables as follows:

```dotenv
POLICYWATCHER_ENTRA_AUDIENCES=<API-client-ID>,api://<API-client-ID>
POLICYWATCHER_ENTRA_ALLOWED_TENANTS=<tenant-ID>
POLICYWATCHER_ENTERPRISE_API_URL=https://<public-gateway-or-origin>
# Set only after APIM is active:
POLICYWATCHER_APIM_SHARED_SECRET=<high-entropy-gateway-secret>
```

### 2. PolicyWatcher Power Platform Connector

- Add Web redirect URI `https://global.consent.azure-apim.net/redirect`.
- Add delegated permission `policywatcher.read` from the API registration.
- Grant admin consent for the test tenant if tenant policy requires it.
- Create a short-lived client secret for the pilot. Keep its value outside the repository.

Microsoft recommends separate Entra applications for the protected API and its custom connector client: [custom connector for a web API](https://learn.microsoft.com/en-us/connectors/custom-connectors/create-web-api-connector).

## Generate the connector package

Client IDs and tenant IDs are identifiers, not credentials. The generator never accepts or stores the OAuth client secret.

```bash
node scripts/generate-power-platform-connector.mjs \
  --tenant-id <tenant-uuid> \
  --api-client-id <api-app-client-uuid> \
  --connector-client-id <connector-app-client-uuid> \
  --api-url https://<public-gateway-or-origin> \
  --environment-id <power-platform-environment-id>
```

Output is written to `artifacts/connectors/policywatcher-v2` and includes `settings.json` when an environment ID is supplied.

## Import into the test environment

Recommended first path: import the API into APIM, apply `docs/azure/apim-policy.xml`, then use APIM’s **Power Platform → Create a connector** flow. Microsoft documents this export path in [Export APIs from API Management to Power Platform](https://learn.microsoft.com/en-us/azure/api-management/export-api-power-platform).

For the fastest test-tenant smoke test, use the current HTTPS PolicyWatcher origin as `--api-url` and leave `POLICYWATCHER_APIM_SHARED_SECRET` unset. This mode still requires a correctly signed, allowlisted Entra v2 token. Move the connector host to APIM and enable the gateway secret before adding further tenants or production workloads.

For repeatable source-controlled import, use `paconn`:

```bash
paconn login
paconn validate --api-def artifacts/connectors/policywatcher-v2/apiDefinition.swagger.json
paconn create \
  --api-def artifacts/connectors/policywatcher-v2/apiDefinition.swagger.json \
  --api-prop artifacts/connectors/policywatcher-v2/apiProperties.json \
  --icon public/logo-mark.png \
  --secret '<connector-client-secret>' \
  --env '<power-platform-environment-id>'
```

Do not place the secret in shell history in a shared environment. Prefer an interactive prompt, a protected CI secret, or the Power Platform portal. The supported CLI workflow is documented in [Create a custom connector with the CLI](https://learn.microsoft.com/en-us/connectors/custom-connectors/paconn-cli).

## Pilot acceptance flow

Create one manual Power Automate flow:

1. Call **List verified policy changes** with `risk=High` and `pageSize=5`.
2. For each returned item, call **Get a verified policy change**.
3. Post an Adaptive Card in a test Teams channel containing company, policy, risk, TL;DR, source URL, and `meta.requestId`.

Acceptance criteria:

- consent occurs in the test tenant only;
- the access token contains the expected `tid`, `aud`, and `policywatcher.read` scope;
- APIM injects the gateway header and the origin revalidates the Entra token;
- a token from a different tenant, a wrong audience, and a direct origin call are rejected;
- connector outputs never contain policy text, snapshot hashes, private diagnostics, or admin records.

## Pilot limitations

- Pagination is explicit through `page` and `pageSize`; no automatic next-link policy is enabled.
- This connector is read-only and has no event trigger yet.
- Certification, tenant entitlements, signed webhooks, and connector health telemetry belong to the next production wave.
