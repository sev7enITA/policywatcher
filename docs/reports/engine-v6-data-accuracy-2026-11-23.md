# PolicyWatcher data accuracy and evidence repair

23 November 2026. Engine work is based on workflow-audit checkpoint `caffc1a81d33b02360ddc4434e64956997b9275b` (#84). The production data repair was performed separately against the running 5.6 service.

## Engine candidate

- The extractor uses declared language from the selected DOM scope first. Conflicting structural declarations or conflicting page-level and HTTP fallback signals produce a review hold. A replay cannot use the expected contract language as observed evidence.
- Comparison keys include the block kind and section path. Moving a clause outside its original section creates a delta even if its wording is unchanged. Changing heading syntax while preserving the relationship remains a formatting review.
- The deterministic date gate matches explicit calendar values to an update or effective-date marker on the correct version. Claim dates must agree in both languages. Ambiguous, unsupported or unchanged-role dates are held. The separate semantic verifier still evaluates the full claim.
- Public change queries require two public snapshots. The public baseline query still accepts a verified first snapshot.
- The extraction and implementation fingerprints were regenerated. Existing engine runs and qualification evidence retain their original fingerprint.

Local verification: 1,875 tests passed in 222 suites, 14 tests skipped in 3 suites. Critical TypeScript checks and both manifest checks passed. The first archive run lacked Git metadata required by the release-source test. The tracked sandbox rerun passed without altering that test.

## Production data, verified after the transaction

| Measure | Before | After |
| --- | ---: | ---: |
| Policy records | 132 | 132 |
| Snapshots | 304 | 304 |
| Change records | 156 | 156 |
| Public changes without two public versions | 4 | 0 |
| Public snapshots without a recorded canonical URL | 206 | 127 |
| Public snapshots without a recorded capture URL | 206 | 86 |

At 09:02 Europe/Rome, a guarded transaction reconstructed provenance on 120 historical snapshots using the same policy, SHA-256, UTF-16 length, verified same-run HTTP 200 log and its linked direct retrieval. The snapshot and log were less than one second apart and the retrieval was within 60 seconds. Requested and final URLs came from those receipts. For 79 of the 120, both also matched the configured official URL and the canonical field was reconstructed. The discriminator is `reconstructed`. This does not assert that historical HTML or a complete origin document was retained.

Four Plaid records, two documents in two jurisdictions, were a whole-document insertion into version 1 with no predecessor. Their historic analyses and publication timestamps are retained. The public event flag was cleared and the initial public snapshots were preserved. Independent HTTP readback returned 404 on all four event pages and 200 on a valid versioned change.

The operation was rehearsed and rolled back on a verified SQLite backup, then revalidated against production under a single transaction. It appended 124 audit entries. SQLite integrity and foreign keys passed. Hashes verified that policy records, snapshot contents, historical analysis, canonical versions and changes, check logs, acquisition receipts and source-remediation records were preserved. The verified pre-operation backup is retained privately. The audit entries contain the field values and evidence references required to undo the individual changes without restoring an old database wholesale.

## Open evidence

- 86 historical snapshots still lack a corroborated capture URL, and 41 other snapshots have recovered request and final URLs but lack a supported canonical URL.
- Two configured Perplexity policies still have no baseline. Two Stripe source-remediation records remain open. A post-failure success on the required retrieval key was not established.
- The engine fixes are on the candidate branch. Production 5.6 and the private r3 code were not redeployed. This repair provides neither a new live qualification day nor an end-to-end capacity result.
