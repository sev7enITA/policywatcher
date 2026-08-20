# PolicyWatcher client compatibility matrix

Updated: 20 August 2026

| Client | Client release | Product/API line | Status | Boundary |
| --- | --- | --- | --- | --- |
| Web application | `4.0.0-beta.2` candidate | unversioned public routes plus `/api/v1` and protected `/api/v2` | Current candidate | Deployment must be verified separately. |
| Browser extension MV3 | `3.8.3-beta.3` | current public policy/company contracts | Compatible with declared current contract | No automatic contract negotiation; validate before changing response schemas. |
| Android companion | repository companion build | current public contracts | Source-compatible in CI | Store publication and installed-user upgrade are not implied. |
| Microsoft/enterprise connectors | versioned `/api/v2` contracts | Entra/APIM pilot | Gated | Tenant entitlement and multi-tenant account workflows are not active. |

The product version and companion version do not need to match. Compatibility
is determined by the consumed API contract. Any breaking change to the
unversioned public routes requires a companion compatibility test, migration
note and coordinated release; new integrations should prefer versioned APIs.
