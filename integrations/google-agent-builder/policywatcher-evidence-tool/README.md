# PolicyWatcher tool for Vertex AI Agent Builder

Status: source package ready for a controlled Google Cloud project pilot. It is not deployed into a customer project by this repository.

The folder contains an OpenAPI 3.0 tool definition and deterministic playbook instructions. The service is hosted by PolicyWatcher; the customer agent calls it over HTTPS and receives public evidence only. No PolicyWatcher dataset is copied into Vertex AI by this package.

## Pilot procedure

1. Create or select an isolated development project and confirm the project's data-governance controls.
2. In Vertex AI Agent Builder, create an OpenAPI tool from `openapi.json`.
3. Configure no authentication only for this public evidence gateway.
4. Apply `playbook-instructions.md` to the playbook or agent instructions.
5. Test all operations, empty responses, citations, English/Italian locale and invalid filters.
6. Review invocation logs and retention settings before enabling the tool for additional users.

Do not repoint the anonymous tool to Enterprise API v2. Private enterprise access requires a separately reviewed authentication design.

Official reference: <https://docs.cloud.google.com/dialogflow/cx/docs/concept/playbook/tool>
