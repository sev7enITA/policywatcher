# Hosted Preview source preparation, 1 November 2026

This is the **hosted-preview-smoke-20261101** corpus preparation, separate from the frozen daily qualification cohort. It prepares a private database and one reviewed source contract. It does not qualify overall source completeness, sustained hosted operation or real 500-source capacity.

## Sanitized catalog

The release backup was opened in SQLite read-only mode. An explicit field allowlist exported 18 company definitions and 113 configured policy definitions. Current text was included for 110 policies only where its text and hash exactly matched a public-evidence snapshot, its ingestion was not seeded, and its status permitted public display. The other three definitions have empty preview baselines and remain configured sources. No snapshot records were copied, so the private preview does not inherit a public publication history.

The new database contains only `Company`, `Policy`, one `EngineSourceContract`, and migration records. Subscriber, access, inquiry, investor, notification, scan, change, snapshot and review tables were empty after bootstrap. Its 21 migrations applied successfully. Integrity and foreign-key checks passed.

| Artifact | SHA-256 |
| --- | --- |
| Public catalog export | `03ac9df0dc8b574706b6f48c7f63702f5226dd007f09d1a31ae85541f92e2158` |
| Sanitized bootstrap input identity | `7df5917db67140c6ab291b4ceb91317d4dbb66378ded4a493e14a4418e2aee3e` |
| Initial preview database before worker execution | `c5692b14fdb004a9ab39cb0279008f4c902dc759bfa61a25cebdb4f654dfffd1` |

The bootstrap script rejects other database paths, symlink aliases, altered baseline hashes and reinitialization without a matching receipt. A repeated identical invocation made no database changes. Unknown catalog properties are omitted field by field. Seven executed bootstrap checks passed, including byte-preserving repetition and negative path/content checks.

## One bounded source review

The [official Apple Privacy Policy](https://www.apple.com/legal/privacy/en-ww/) was captured live at **2026-11-01T21:18:51.889Z**. The response was HTTP 200, retained the exact requested URL, and declared `en-US`. Its displayed update date was 30 July 2025. The reviewed document is the English global HTML policy; the catalog's EU label does not establish separate EU-only coverage.

The source review read the document through its closing notice and checked the received DOM against Engine 6 extraction. All **231 non-empty text nodes** inside its single main document scope were retained in order. The extraction retained the title, update date, all 12 content section headings and terminal notice: 14 headings and 28,124 characters in total. There were no unresolved extraction issues and no exclusions. A short language-selector prompt remains in the extracted text.

| Capture identity | SHA-256 |
| --- | --- |
| Received HTML | `a2cea95c9dc8e35523557f08cc8a6a08e7e5455f0a4bc68329065fdc892b766f` |
| Frozen extracted text | `5d3bc787e5503e924127e4af7a69675e8a44f1ebcd09793575079978c93a81be` |

The contract is attributed to **codex-assisted-review**, not to a human reviewer or either external model. Its checks pass on this captured representation. Linked product-specific notices, other languages, geographic variants and authenticated representations remain outside the review. Matching a contract is a bounded evidence check, not proof of provider-wide completeness or legal correctness.

The hosted smoke corpus deliberately retrieves Apple's canonical HTML. Production continues using its official PDF. The override records the old and new retrieval URLs and requires a fresh observation. Neither production configuration nor the frozen daily cohort manifest changed. The PDF baseline and HTML extraction must not be treated as automatically comparable.

## Preserved limitations and failures

A preliminary live Stripe capture retained all 419 main-document text nodes, but omitted its update-date metadata, which sits outside the main scope. No source contract was approved for that capture. The finding remains a completeness limitation; a successful HTTP response and text-node coverage alone did not clear it.

The first bootstrap migration attempt failed because the schema engine required an existing target file. The script now creates an exclusive empty file before migration, matching the existing Hostinger initializer behavior. The subsequent migration and checks passed; the earlier failure is retained in the local check receipt.

This preparation performed no hosted worker run, model analysis, publication, notification or temporal qualification. The next required evidence is a live authenticated preview run against this dedicated database, with its private artifacts and unchanged baseline/history/outbox verified independently. Local capture and bootstrap evidence are retained under `output/hosted-preview/`; the database and bootstrap receipt are under `output/engine-channels/hosted-preview/`.
