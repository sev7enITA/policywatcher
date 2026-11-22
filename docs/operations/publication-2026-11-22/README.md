# Public release preparation: PolicyWatcher 5.6.0

**Current preparation:** see `independent-inventory-publication.json`. Earlier SHA256 `416cc4fe…` is SUPERSEDED/HOLD and must not be deployed. Full stable npm prebuild found a stale fingerprint; the replacement retains the guard and regenerates only stable extraction metadata. The historical handoff below is preserved, not current readiness.

This is a publication handoff, not a deployment receipt. The public artifact contains the cumulative EN/IT diary and responsible-AI methodology, with the stable scanner. It does not activate the new private engine or add its admin runtime. The new independent-inventory follow-up must not be attributed to this frozen package.

## Exact artifact

- Source: `557554cc2707d3739337ed92fe0c99ed58587751`, branch `codex/release-56-completeness-public`.
- File: `PolicyWatcher-5.6.0-hostinger-2026-11-22-completeness-methodology-verified-diary.zip`.
- SHA256: `416cc4fea3691fb1024366434b5656361ac4b7ea2fc16fba27c0308a08ee58d0`.
- Local preparation passed the production build, 40 release/UI tests, 24 compiled HTTP controls and one disposable database-schema control. Stable schema: 35 tables, 19 migrations.
- Older 5.5 ZIPs are held. They are historical evidence, not a rollback target selected from current hosting state.

The digest and ZIP CRC were checked again during this preparation. The archive has 1,071 files and 294 directory entries. The private PR #83 checkpoint has separate tests and CI evidence in `prepared-release.json`; it is not the public runtime.

## Publication sequence

1. Observe the current production/staging deployments and any build already submitted before sending another action. Record deployment IDs, source/version and runtime state. Do not infer online delivery from Git. Earlier staging maintenance had not completed an observed r3 restoration.
2. Take a fresh private Preview database snapshot. Keep credentials and full snapshots outside Git and outside the public upload. Record the current 14 protected evidence hashes, three saved private reports and active-task state. If tasks are active or a build is in progress, stop this sequence and reconcile the state.
3. Check this exact ZIP against its SHA256. Upload only this stable package to staging, preserving hosting secrets and database bindings. Observe build completion before continuing. Verify EN/IT methodology, diary, visible 5.6 identity, navigation, runtime/source hashes and schema. A failed/unknown control holds promotion.
4. Restore the exact private r3 archive from the preserved local handoff: SHA256 `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`. Use its private database and observe/silent configuration. Recheck the fresh snapshot's 14 evidence hashes and three saved reports, access protection, task state and disabled publication/notifications. Do not run an empty-database verifier or add an unnecessary scan.
5. Only after staging and restoration checks pass, deploy the same verified public ZIP to production. Record the resulting deployment ID and verify the public pages in EN/IT, actual version/source, runtime/schema and protected data. A rollback must use the exact currently verified previous production artifact/configuration retained in step 1, not an arbitrarily old archive.
6. Append a separate delivery receipt and update the wiki with actual outcomes. Preserve this preparation checkpoint and all failed attempts.

## Access and limits

Desktop control last failed with `Trusted RPC service is not configured: sky`. No hosted upload, configuration save, deployment or Preview restoration was performed by this preparation. This receipt supplies no credentials. Independent source completeness, attachment coverage and 500 successful daily full-pipeline completions remain unqualified.
