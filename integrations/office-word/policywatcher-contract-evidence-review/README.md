# PolicyWatcher Contract Evidence Review for Word

Status: source package ready for controlled sideload validation. It is not published to Microsoft AppSource or centrally deployed to a customer tenant by this repository.

The task pane reads only the user's current Word selection after an explicit button press. Classification runs in the task pane against a fixed topic taxonomy. The selected clause is not included in the PolicyWatcher request. A second explicit acknowledgement is required before the task pane sends derived topic labels to the public Agent Evidence Gateway.

## Data flow

`Word selection → local fixed-taxonomy classification → displayed topics → user acknowledgement → public evidence query`

The public query contains topic labels, locale and a bounded result limit. It contains no selected clause, document name, document ID, tenant ID, user ID or Office access token.

## Controlled validation

1. Deploy the matching PolicyWatcher release over HTTPS.
2. Validate `manifest.xml` with the current Microsoft Office Add-in tooling.
3. Sideload the manifest in an isolated Word test environment.
4. Test no selection, unsupported host, classified selection, unknown topic, explicit acknowledgement, gateway failure and zero-result behavior.
5. Inspect network traffic and confirm that selected text never appears in a request.
6. Review tenant add-in policy before centralized deployment.

This feature maps clauses to public research evidence. It does not verify a contract, approve a clause, determine compliance or provide legal advice.

Official references:

- <https://learn.microsoft.com/en-us/office/dev/add-ins/overview/office-add-ins>
- <https://learn.microsoft.com/en-us/office/dev/add-ins/word/dictionary-task-pane-add-ins>
