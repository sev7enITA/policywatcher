# Engine 6 r4 audit remediation and notebook delivery, 11 November 2026

## Delivered states

- **Source merged:** PR [#56](https://github.com/sev7enITA/policywatcher/pull/56), squash `695201d1420af40600b4afaa8d0dd1636f96fb91`, after six GitHub checks passed on `a31eddc53602438e4cb8932caca04361f3c557f1`.
- **Public notebook delivered:** the cumulative 9/11 November EN/IT diary on the stable 5.5 line. Final archive SHA-256 `74cc239b99fc7e28de722a2f1aa76f17b19565da444482b517e7f22bbe1eaa34`, source `e54a62e7364c878e60c56b75de1a70e460ff5299`, production deployment `01a1cc6e-67c4-7357-bf55-52ca935adb5a`.
- **Private Preview preserved:** exact r3 archive `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`, implementation `84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00`, restored with deployment `01a1cc5d-0142-715f-a721-87dc365a43d1`.

R4 implementation `dc2fce35e44dc0bcbf234a13ada59516bd6c9de577b1bbf6c4233bbfffcbc62a` is a new source candidate, **not a hosted engine release**. The website uses the established scanner, 35 application tables and 19 migrations. Main, stable delivery and hosted private r3 are three distinct artifacts.

## Fixes and executed verification

The [remediation register](engine-v6-r4-remediation-2026-11-11/register.json) reconciles all 29 numbered findings and both rounds of patch review. Corrections include bounded assessment reuse and invalidation, actual installed-SDK token counting, explicit failure codes and terminal reviews, transport-bound confirmation, conservative review routing, transactional backup reads and clearer administrative readiness/provenance.

The first Fable patch review rejected two real defects. Both were reproduced offline and fixed: unsupported SDK request configuration and a prior semantic review hidden by an intervening acquisition failure. The final [Fable static re-review](engine-v6-r4-remediation-2026-11-11/fable-final-review.raw.txt) found no new source-merge blocker. Fable did not execute the tests; its review is separate from the execution evidence.

- Local full suite: **1,624 passed, 14 skipped**; critical TypeScript, scoped ESLint and isolated exact-source build passed.
- GitHub: six checks passed, including CodeQL, build/dataset assurance, PostgreSQL portability, Sonar and targeted coverage.
- Local fresh PostgreSQL 16: eight migrations applied, zero schema drift, assessment write/read/rollback and relational/ledger controls passed. SQLite import returned `go`; canonical dual-write passed. The dedicated container was stopped after the run. This is not backup restoration or load qualification.

No new source captures, live model inference, qualification days or r4 hosted scans were performed by this remediation. No paid access or purchased resources were used.

## Website and restoration checks

Staging deployment `01a1cc56-4584-7123-b209-143b18f55532` passed 11 operational checks. The exact archive passed 71 local EN/IT checks, 71 staging checks and 71 production checks, plus 37 deployed-source hash comparisons per environment. Only the notebook page, notebook date in press-kit data, sitemap and release manifest differ from the preceding public archive (1,047 regular files).

Production passed nine internal runtime checks. The independent security check remains `external`; overall `attention` is expected and is not a pentest verdict.

Private r3 passed 14 authenticated checks. All **14 core-table hashes captured before maintenance** are unchanged, three saved reports remain completed and private, and there are zero active tasks. A separate full snapshot taken during stable staging and before r3 restoration shows 46/48 table hashes unchanged afterward: AdminAccessLog gained one row during authenticated checks and EngineOrigin differs. Those snapshots do not retain raw rows, so individual changed scheduler fields are not asserted. Publication and notifications remain disabled. Temporary maintenance does not establish uninterrupted Preview availability.

## Failures retained and resolved

1. The first staging smoke ran while the build was in progress and reached the previous private service. Redirect/401 results are preserved; the completed staging deployment subsequently passed.
2. Production attempt `01a1cc63-5791-724c-93c2-a0e25b74c0ef` failed before database initialization because the configured staging-approved hash/date still referred to 7 November. Both were replaced with the actual 11 November receipt, and the same environment gate passed locally.
3. Attempt `01a1cc6a-13e8-719e-8879-c9aac880f076` used Hostinger's last successful 7 November source through Use previous files. UI and read-only source checks detected the mismatch. An explicit re-upload of the final archive produced the verified delivery above. The earlier attempt is not counted as new-diary publication.
4. The local dual-write smoke initially rejected the disposable database name. Only that test database was renamed to its accepted test convention and test mode made explicit; no safety guard or source was weakened. Initial logs and intentional uniqueness violations remain retained.
5. The local table-comparison assertion initially used the wrong operational table name, EngineOriginState instead of EngineOrigin. Raw snapshots remain intact; the final comparison states the actual 14/14 and 46/48 boundaries.

## Still open

**O2, general source completeness, live semantic accuracy, operational verifier reliability and real 500-policy/day capacity remain unqualified.** The old r3 timeouts and quota observations are not erased by the SDK correction. There is no new measured semantic or throughput result.

R4 qualification must use a fresh isolated database until upgrading existing r3 candidate state is tested. Publish mode stays prohibited pending a separate decision on the first-capture public status. Recurring analysis after two-day expiry, historical rejected-review refresh invalidation, global quota scheduling, complete risk taxonomy, identity-based approval, backup capacity/contention and actual restoration remain open as specified in the register. Main's r4 implementation cannot inherit qualification from the old frozen candidate or hosted r3.

The [machine-readable receipt](engine-v6-r4-closeout-2026-11-11.json) records identities, checks, failure states and evidence hashes. Raw local operational evidence remains in `PolicyWatcher-engine6-public-access/output/r4-diary-20261111`; credentials are excluded from Git and the receipt.
