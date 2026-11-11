# Engine 6 r4: audit remediation, 11 November 2026

This is a new local implementation candidate. **O2, general completeness, semantic accuracy and real 500-policy/day operation remain unqualified.** No engine deployment, live model call, notification or new source capture was performed by this remediation work. Stable 5.5 and hosted private r3 are separate artifacts.

## Audit and adjudication

The [full Fable audit](../engine-v6-external-audit-2026-11-11/fable/audit.raw.txt), machine-readable findings and next-wave protocol are retained byte-for-byte. Fable inspected the prior r3 inventory and did not run tests. Its report could not internally attest effort; the actual desktop selector was observed as Fable 5.2 Alto before submission and during execution. These are different evidence sources, not a provider-level effort attestation. Audit source identity is the named evidence checkpoint, not proof of the current branch ref.

The [remediation register](register.json) reconciles every numbered N finding, with bounded fixes, partial corrections and still-open work. The original G01-G22 reconciliation remains in the audit. No completion percentage combines product fixes with missing research evidence.

## Implemented changes

- Persist an assessment identity for each policy/mode so the same assessed content reuses its assessment within a bounded two-day window without replacing its review. The key binds source context, baseline, contract/profile, candidate content, implementation, model configuration and transport. A changed candidate or explicit review refresh requires a new assessment. Reuse expires with the captured evidence after two days. It does not renew old evidence or make an old approval current. Intervening holds invalidate the prior assessment, and explicit refresh is also available for rejected reviews.
- Hold truncated/invalid model outputs and model quota/access failures for review, preserve bounded provider failure codes, and retain a review on terminal failures. Observe-mode terminal failure preserves all policy fields.
- Expand conservative mandatory-review patterns for training, sale/consent, retention, sharing/licensing and common law/termination wording. This reduces unsafe reliance on the model score; it does not qualify a complete risk taxonomy or score calibration.
- Count the system text together with the payload using the installed Developer API SDK converter. Keep timeout unchanged pending a bounded causal experiment. Installed SDK source confirms its 120-second client timeout also sends a server timeout header; it does not establish the cause of the old failures.
- Export all backup tables in one serializable read transaction, with candidate/provider/migration provenance. Missing migration ledger is explicit. Payload remains in memory and verification-only: no streaming or restore success is claimed.
- Expose engine configuration presence separately in the administrative readiness page; stop presenting unmeasured PostgreSQL integrity values as passed. Remove the inference that an unpublished public-evidence record was human-reviewed.
- Bind confirmation to matching transport/final URL and extend the implementation inventory to migration SQL, both deployment initializers and backup/readiness code.
- Prepare a separate r4 semantic harness with pacing before SDK entry, a two-failure stop rule, safe header allowlisting and nonzero exit on incomplete or unexpected verdicts, with explicit false-claim rejection expected for negative cases. It was not executed. The r3 protocol, harness and receipts remain unchanged.

## Validation and release boundary

Final accepted local full suite: **1,624 passed, 14 skipped, 204 files passed and three skipped**. Initial failures are retained, including expected changes to the old retention fixture's routing and a missing migration-ledger backup fixture. Routing tests now use a neutral support-response fixture for automatic publication and separate explicit sensitive-source cases. Critical TypeScript and scoped ESLint passed. The exact source head `23ce5f0f2299ae9b392a720b8d5f5084e17d7053` also passed the isolated build. GitHub CI is still queued; no CI success is inferred from local results.

The two nullable state columns have additive SQLite/PostgreSQL migrations and both CLI-free SQLite initializer upgrades. Deploying this candidate requires a distinct private artifact and candidate-specific checks. Merging source does not qualify or activate it. The real source references, independent human semantic labels, operational verifier route, full invocation budgeting, artifact-linked ledger retention, restored database, identity-based approval and intended-host 500/day experiment remain open.

PR #55 was merged as `abd71fb846569c7ac2e85ef5cc83a0e284821e80`, integrating only preceding O2 evidence and the audit handoff. The remediation merge and website delivery are separate states.

## Independent patch review and subsequent corrections

The [verbatim follow-up review](fable-patch-review.raw.txt) rejected the first patch. PR-01 (unsupported SDK countTokens configuration) and PR-02 (a semantic review hidden by an intervening acquisition failure) were reproduced offline: three failing regressions, including both pipeline modes. The corrected real-SDK boundary now reaches stubbed countTokens and generateContent endpoints without network access. Interleaved holds clear the old memo. Further controls bound memo lifetime to two days, exclude time/provider-dependent holds, expose transport changes as review holds and retain only one active terminal review per policy/mode while preserving every historical failure.

A successful first changed-content capture no longer advances successful freshness before confirmation. The installed SDK does not expose Retry-After headers: adapter support for that optional field is not evidence of a measured provider delay. A 429 conservatively closes the run to review; per-minute recovery, retained analyst reuse and a global quota scheduler remain open. Whole-database backup duration/contention, streaming, actual restore and optional provenance validation remain open. A structural hold in the prepared harness is safe but not a completed semantic adjudication and therefore does not pass the bounded semantic protocol.


## Final static re-review and candidate restrictions

The [final Fable re-review](fable-final-review.raw.txt) confirms PR-01 through PR-05 corrected and finds no new blocker for a source merge that deploys and enables nothing. Fable performed static reading and hash checks, not tests. We independently checked a clean source working tree at the reviewed commit; the retained patch and implementation hashes bind its scope.

- **FR-01:** r4 qualification must start on a fresh isolated database. Reusing r3 candidate state requires an explicit migration/reset test first; the older fingerprint must not be reported as an observed transport change. No r3 database migration is authorised by this source merge.
- **FR-02:** publish mode remains prohibited. The first changed capture currently routes public status to Needs Review as well as withholding successful freshness. This reverses the prior availability expectation and requires a separately reviewed product decision and tests before any publication-mode qualification.
- **FR-03:** memo expiry bounds reuse; recurring analysis remains. An unchanged unresolved divergence can require assessment every two to three daily cycles. The quota estimate in Fable's report is arithmetic against a dated limit, not measured capacity. N03 and 500/day remain open.
- **FR-04:** refreshing a historical rejected review can invalidate newer candidate state. This is retained as a control gap for a future patch; qualification must avoid that operation until separately tested and corrected.
- **FR-05:** the Retry-After unit fixture injects an adapter delay; it does not establish SDK header availability.
- **FR-06/07:** the suite label and bounded reuse wording above are corrected.

These restrictions are not O2 completion, production approval, or a claim that every audit gap is fixed.
