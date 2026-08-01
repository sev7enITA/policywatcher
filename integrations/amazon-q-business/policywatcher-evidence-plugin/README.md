# PolicyWatcher custom plugin for Amazon Q Business

Status: legacy compatibility source for an existing Amazon Q Business customer test application. AWS states that Amazon Q Business is not open to new customers from 31 July 2026; new pilots should use the Amazon Quick package in `integrations/amazon-quick`. This repository does not deploy either package into an AWS account.

The supplied OpenAPI 3.0 description has three read-only operations, one HTTPS server and JSON responses. Response schemas avoid array types and composition keywords to stay within Amazon Q Business custom-plugin constraints.

## Pilot procedure

1. Create a test Amazon Q Business application and review its access controls.
2. Import `openapi.json` inline or from the organization's approved Amazon S3 location.
3. Configure the custom plugin for the public PolicyWatcher endpoint.
4. Test each action before associating the plugin with a production web experience.
5. Verify citations, timestamps, zero-result wording, invalid-filter rejection and the evidence boundary.

This plugin uses no AWS credentials and accesses public evidence only. Do not add confidential contract text to the query parameters. Enterprise-private access requires an authenticated contract and Secrets Manager-backed credential lifecycle.

Official references:

- <https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/custom-plugin.html>
- <https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/plugins-api-schema.html>
