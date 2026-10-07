# Evidence assurance release · 7 October 2026

Product version: 5.0.0. Artifact revision: evidence-assurance-r1. Production promotion authorized by the user on 7 October; activation is recorded only after runtime verification.

The initial implementation passed all GitHub checks at `1336cb4`, including PostgreSQL schema migration, runtime portability and SQLite-to-PostgreSQL rehearsal. Local implementation validation: 1,164 tests passed, 14 skipped; desktop/mobile browser checks passed. The source assessment and metadata-only retrieval receipt are in the [research report](../eu-terms-reuse-2026-10-07/assessment-it.md).

A fresh WAL-aware production backup was created and integrity-checked before release preparation. Database subscriber data, secrets and raw inputs are kept outside Git. Sanitized staging removes subscriber/operational data and the new private assurance inputs and operator notes. This release adds three tables, bringing readiness to 34 tables and 18 SQLite migrations.

The production receipt, staging smoke and post-deployment checks will record the exact artifact and observed activation. Feature availability does not establish complete provider coverage or improved real-world accuracy. Original provider texts are not imported from the EU archive.
