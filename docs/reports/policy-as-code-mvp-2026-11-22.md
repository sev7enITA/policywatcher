# PolicyAsCode MVP evidence — 22 November 2026

## Delivery state

This is the implementation and verification record for structured public insights, read-only export and isolated draft import. The candidate branch is `codex/policy-as-code-mvp-20261122`. Implementation and bounded local verification are complete. Remote CI and delivery remain distinct checkpoints. No production deployment, hosted Preview update, database migration, policy activation or acquisition run is evidenced by this report.

The final Git, wiki and public-diary delivery states must be tied to their own receipts. A prepared page or branch is not evidence that an endpoint is online.

## Sintesi

L'MVP separa il dato destinato alle macchine dalla sua eventuale esecuzione. L'export contiene una proiezione limitata di un cambiamento già pubblicato; l'import conserva una bozza isolata, con provenienza e digest. Una citazione ancorata prova soltanto la corrispondenza al testo conservato. Non qualifica completezza, accuratezza dell'interpretazione o autorizzazione operativa.

## Implemented candidate surface

| Surface | Candidate behaviour |
|---|---|
| Public exporter | `GET /api/v1/insights/{changeId}`; UUID only, no query/private mode, read-only. |
| Schema | Candidate `GET /schemas/insight-ir/0.1.0` exposes only the static contract; it does not export evidence or activate anything. |
| Public-data boundary | Published change and current public snapshot, publication not in the future, non-seeded eligible policy; strict projection also checks the retrieved record. |
| Private predecessor | No capture, quote or text hash exported. Interpretations explicitly tied to it are omitted. |
| InsightIR | Version 0.1.0, strict portable contract, exact-text SHA256, declared UTF-16 offsets, explicit limitations. |
| Review/execution | Required / unapproved / indeterminate / execution disabled. |
| Draft import | Explicit destination context, separate sidecar, immutable conflict handling and idempotent repeat import. |
| Runtime changes | No active rule, spreadsheet, generated model or application database modification. |

See the [architecture and contract boundaries](../architecture/policy-as-code-mvp.md) for field-level semantics and deferred work.

## Verification ledger

Executed on 22 November 2026:

| Verification | Actual result and scope |
|---|---|
| OS network-denial probe | TCP denied by the operating system, inherited by child processes. |
| Portable contract and storage | **20/20** Node tests, including nine independent adversarial cases. |
| Public projection, API and round trip | **48/48** Vitest tests in eight files: 33 new tests and 15 relevant existing regressions. |
| Real regression detection | Two controlled mutations failed as intended: UTF-16 display truncation and false anchoring of a shortened quote. Source restored and all tests passed again. |
| Separate schema validator | AJV 2020 accepted the schema and valid synthetic fixture with format assertions disabled. Strict URL/time and cross-field rules are separately enforced by the portable runtime. This is not exhaustive schema-validator equivalence. |
| Code checks | Targeted ESLint and critical-test TypeScript checks passed. |
| Production build | Next **16.4.6** Turbopack build, including application TypeScript, passed in an isolated source copy with matching dependency lock and a disposable SQLite database. |
| Compiled route/database checks | **15/15** additional checks: actual Prisma/SQLite reads through compiled GET userland, traced schema asset, exact draft round trip, private/absent indistinguishable responses, fresh hold, no new change rows. The private distribution HTTP front door separately returned 401 as intended. Direct route invocation does not prove a publicly accessible endpoint. |
| Concurrency and destination partitioning | Eight concurrent CLI imports created exactly one draft; repeated import preserves the original receipt. Different tenants/projects remain separate storage partitions under a trusted local OS identity. |

Reproduction: `node scripts/verify-policy-as-code-mvp.mjs` on macOS. Portable adapter tests: `node --test integrations/policy-as-code/*.test.mjs`. The CI quality workflow now includes these portable tests; application tests remain in the existing Vitest workflow.

Retained local receipts are in `output/policy-as-code-mvp-20261122/`: `offline-receipt.json`, `mutation-receipt.json`, `standalone-receipt.json`, matching logs, source copies and the synthetic isolated database. The adjacent JSON report records public-safe digests. Raw private application configuration is not exported.

Initial failures are retained: the first empty-database migration attempt; an older shared dependency tree (Next16.4.3) outside the Turbopack root; the fallback webpack build's existing CSS restrictions; and the initial HTTP harness, which incorrectly expected a public route from a private distribution. The first harness also generated an invalid empty-check receipt; it is explicitly rejected. The corrected harness requires completion and all fifteen checks, and supplies the Next async-local context. No failed run is counted as a pass. The aligned dependency tree has the exact same lock SHA256; no dependency or model download was needed.

Previous assessment tests and local-model reviews are historical inputs. They are not substitutes for verification of this implementation.

## Independent challenge and GLM status

The user authorised challenge through the prepared GLM desktop session. Access was attempted through the native application control service, which returned `Trusted RPC service is not configured: sky`. App discovery returned the same service error. No GLM 5.3 MAX answer has been received for this implementation at this checkpoint; this is an outstanding review, not a completed cross-check or a finding attributed to GLM.

A separate Codex coding-agent review completed 18 adversarial tests (nine application and nine portable tests, already included in the totals above). It found and corrected quote-prefix anchoring, invalid JSON whitespace, date rollover and Unicode truncation. No P1/P2 remained in that reviewer’s bounded trusted-local-owner scope. This is not a penetration test. Earlier local GLM-4, Qwen and Ornith architectural responses do not constitute a GLM 5.3 MAX review of the final code.

## Limits that remain

- Only already-public changes are exported; the MVP has no private Preview export or hosted import service.
- The export contains bounded text interpretations, not machine-executable legal rules.
- Missing extractor metadata and source qualification remain explicit. Full text is not embedded, so an external consumer needs the corresponding retained snapshot for independent positional verification.
- Sorted-key JSON digests are integrity references, not signatures, authenticated authorship or semantic truth.
- Actor and tenant/project CLI arguments are trusted caller context. This is not a replacement for application authentication or authorisation.
- No OPA runtime test, operational activation, new source-completeness qualification or real 500-policy daily capacity result is claimed by this MVP.
- Website, wiki, repository and deployed runtime states must remain separately reported.
