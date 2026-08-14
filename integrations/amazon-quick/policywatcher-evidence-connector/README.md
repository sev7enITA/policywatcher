# PolicyWatcher OpenAPI connector for Amazon Quick

Status: source package ready for a controlled Amazon Quick team pilot. It is not deployed into an AWS account or shared with customer users by this repository.

The supplied OpenAPI 3.0 JSON description has three read-only operations, one HTTPS server and flattened JSON responses. Response schemas avoid array types, composition keywords and circular references to match Amazon Quick connector constraints.

## Pilot procedure

1. Use an isolated Amazon Quick team environment and review its access, logging and retention controls.
2. In **Connectors**, choose **Create for your team**, then **OpenAPI Specification**.
3. Import `openapi.json`, select no authentication and review the three generated read actions.
4. Share the connector only with the pilot users approved by the AWS account owner.
5. Test each action, citations, timestamps, invalid filters and zero-result wording.
6. Remove the connector or its user sharing if the pilot is not approved.

The connector sends bounded filters to a public PolicyWatcher endpoint. It does not send prompt transcripts, confidential contract text, AWS identity, tenant documents or private PolicyWatcher records. Enterprise-private access requires a separately reviewed authenticated contract.

Official reference: <https://docs.aws.amazon.com/quick/latest/userguide/openapi-integration.html>
