# PolicyWatcher 3.9.0 Beta 29 audit

Date: 1 August 2026

## Delivered source packages

- Microsoft 365 app manifest 1.24, declarative agent manifest 1.8 and API plugin manifest 2.4.
- Vertex AI Agent Builder OpenAPI tool and deterministic playbook instructions.
- Amazon Quick OpenAPI connector with three operations, one server, JSON responses and no array response schemas; Amazon Q Business retained as legacy compatibility for existing customers.
- Provider-specific controlled-pilot and removal guidance.

## Verification

- JSON manifests and generated OpenAPI documents parse locally.
- All packages reference the same public Agent Evidence Gateway operations.
- Private enterprise access remains separated on Entra-authenticated API v2.

## Residual boundary

The repository does not deploy into a customer tenant, Google Cloud project or AWS account. Source readiness is not provider certification, marketplace publication, tenant approval, customer adoption or general availability.
