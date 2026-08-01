# PolicyWatcher Public Evidence Agent for Microsoft 365 Copilot

Status: source package ready for controlled tenant validation. It is not published to AppSource and is not enabled in any customer tenant by this repository.

The declarative agent uses three anonymous, read-only operations from the PolicyWatcher Agent Evidence Gateway. The gateway returns only already-public evidence, timestamps, source links, filters and explicit boundaries. Microsoft currently supports API plugins as actions inside declarative agents; the plugin is therefore packaged with a declarative agent rather than represented as a standalone Microsoft 365 Copilot plugin.

## Package contents

- `manifest.json`: Microsoft 365 app manifest 1.24.
- `declarativeAgent.json`: declarative agent manifest 1.8.
- `policywatcher-plugin.json`: API plugin manifest 2.4.
- `color.png`: required 192 × 192 color icon.
- `outline.png`: required 32 × 32 transparent icon placeholder for tenant validation.

## Controlled tenant validation

1. Validate `https://policywatcher.online/api/v1/agent/openapi.json` from the tenant network.
2. Review the instructions, data boundary, privacy policy and terms with the tenant administrator.
3. Replace the app ID if the tenant release process requires an environment-specific identity.
4. Zip the five package files at the archive root; do not zip the parent directory.
5. Upload the app package through the tenant's approved Microsoft 365 app-management route.
6. Test all three actions, zero-result behavior, source citations and the non-legal-advice disclaimer.
7. Remove the pilot app if validation is not approved.

Anonymous authentication is limited to public evidence. Tenant-private data must use PolicyWatcher Enterprise API v2 and its Entra authorization controls; it must not be added to this public package by changing prompts alone. Equivalent public source packages target Vertex AI Agent Builder and Amazon Quick; Amazon Q Business is retained only as a legacy compatibility path for existing customers.

Official references:

- <https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agents-are-apps>
- <https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/declarative-agent-manifest-1.8>
- <https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-manifest-2.4>
