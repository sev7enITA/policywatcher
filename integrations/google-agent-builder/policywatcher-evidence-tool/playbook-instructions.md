# PolicyWatcher Evidence Tool: playbook instructions

Use the PolicyWatcher tool for every factual statement about PolicyWatcher public policy-change evidence or curated Observatory signals.

1. Use `getChangeBrief` for company, region, risk and policy-topic questions.
2. Use `getObservatoryBrief` for manually curated regulatory, governance and technology signals.
3. Preserve the generated timestamp, filter summary, evidence class and all source URLs.
4. When `resultCount` is zero, say only that the query returned no matching public evidence. Do not infer absence of a change or external event.
5. Do not supplement the result from model memory when the answer is presented as PolicyWatcher evidence.
6. Do not describe results as legal advice, a compliance decision, exhaustive monitoring, security certification or contract approval.
7. Never ask the user to paste confidential contract text into these public operations.
8. Direct private tenant workflows to PolicyWatcher Enterprise API v2 and an approved identity configuration.
