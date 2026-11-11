# Engine 6 r4: audit remediation, 11 November 2026

This is a new local implementation candidate. **O2, general completeness, semantic accuracy and real 500-policy/day operation remain unqualified.** No engine deployment, live model call, notification or new source capture was performed by this remediation work. Stable 5.5 and hosted private r3 are separate artifacts.

## Audit and adjudication

The [full Fable audit](../engine-v6-external-audit-2026-11-11/fable/audit.md), machine-readable findings and next-wave protocol are retained byte-for-byte. Fable inspected the prior r3 inventory and did not run tests. Its report could not internally attest effort; the actual desktop selector was observed as Fable 5.2 Alto before submission and during execution. These are different evidence sources, not a provider-level effort attestation. Audit source identity is the named evidence checkpoint, not proof of the current branch ref.

The [remediation register](register.json) reconciles every numbered N finding, with bounded fixes, partial corrections and still-open work. The original G01-G22 reconciliation remains in the audit. No completion percentage combines product fixes with missing research evidence.

## Implemented changes

- Persist an assessment identity for each policy/mode so the same assessed content does not trigger daily duplicate analysis or replace its review. The key binds source context, baseline, contract/profile, candidate content, implementation, model configuration and transport. A changed candidate or explicit review refresh requires a new assessment. Reuse does not renew old evidence or make an old approval current.
- Hold truncated/invalid model outputs and model quota/access failures for review, preserve bounded provider failure codes and available retry delay, and retain a review on terminal failures. Observe-mode terminal failure preserves all policy fields.
- Expand conservative mandatory-review patterns for training, sale/consent, retention, sharing/licensing and common law/termination wording. This reduces unsafe reliance on the model score; it does not qualify a complete risk taxonomy or score calibration.
- Count the system instruction in the input budget. Keep timeout unchanged pending a bounded causal experiment. Installed SDK source confirms its 120-second client timeout also sends a server timeout header; it does not establish the cause of the old failures.
- Export all backup tables in one serializable read transaction, with candidate/provider/migration provenance. Missing migration ledger is explicit. Payload remains in memory and verification-only: no streaming or restore success is claimed.
- Expose engine configuration presence separately in the administrative readiness page; stop presenting unmeasured PostgreSQL integrity values as passed. Remove the inference that an unpublished public-evidence record was human-reviewed.
- Bind confirmation to matching transport/final URL and extend the implementation inventory to migration SQL, both deployment initializers and backup/readiness code.
- Prepare a separate r4 semantic harness with pacing before SDK entry, a two-failure stop rule, safe header allowlisting and nonzero exit on incomplete or unexpected verdicts, with explicit false-claim rejection expected for negative cases. It was not executed. The r3 protocol, harness and receipts remain unchanged.

## Validation and release boundary

Local full suite after the first fixes: **1,616 passed, 14 skipped, 203 files passed and three skipped**. Initial failures are retained, including expected changes to the old retention fixture's routing and a missing migration-ledger backup fixture. Routing tests now use a neutral support-response fixture for automatic publication and separate explicit sensitive-source cases. Critical TypeScript and scoped ESLint passed. Local build passed before the final memo-CAS hardening; final patch review and exact-head build/CI are recorded in the final delivery receipt, not inferred here.

The two nullable state columns have additive SQLite/PostgreSQL migrations and both CLI-free SQLite initializer upgrades. Deploying this candidate requires a distinct private artifact and candidate-specific checks. Merging source does not qualify or activate it. The real source references, independent human semantic labels, operational verifier route, full invocation budgeting, artifact-linked ledger retention, restored database, identity-based approval and intended-host 500/day experiment remain open.

PR #55 was merged as `abd71fb846569c7ac2e85ef5cc83a0e284821e80`, integrating only preceding O2 evidence and the audit handoff. The remediation merge and website delivery are separate states.
