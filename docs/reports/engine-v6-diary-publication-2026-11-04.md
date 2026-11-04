# Engine 6 diary publication, 4 November 2026

The bilingual public diary now records the **rejected 3 November window: 11/12 sources recovered, Meta timed out, still one accepted date of three**. The full [execution receipt](engine-v6-daily-2026-11-03.md), failed attempts and bounded AWS snapshot difference remain preserved. No date was added by this website release.

## Immutable archive and delivery

- Product **PolicyWatcher 5.5.0** retains the established scanner, **35 application tables and 19 migrations**.
- Stable source: `82b99ef0371f5d056a147da72a4d334354ca57ac`.
- Archive SHA-256: `c953ae2a23082a5f3ba94474249909321e7e025018c7ada697f668907c78949b`.
- Only `src/app/engine-6-preview/page.tsx` and `release-manifest.json` changed among **1,044 package files** compared with the preceding public archive.
- Staging: **2026-11-04 04:12 Europe/Rome**, deployment `01a1a489-309a-72b9-8588-c365267dd3ef`.
- Production: **2026-11-04 04:27 Europe/Rome**, deployment `01a1a496-e0de-703b-b325-444434733f5c`, using the same staging-verified archive.
- [PR #44](https://github.com/sev7enITA/policywatcher/pull/44) had already integrated the observation into main as `4ecf21e6d136506314154798d90059b09b45b613`, with six GitHub checks passed. Source integration and website delivery are distinct events.

## Executed validation

The stable build and scoped ESLint passed before packaging. All **20 EN/IT diary checks** passed locally, in staging and in production. Staging passed **11 operational checks**, and both hosted environments matched all **30 inspected source hashes**. The public runtime retained its stable schema and passed **nine internal checks**.

Overall readiness remains `attention` because the independent security check is `external`: nine passed, zero internal attention, zero unavailable, one external. The strict production helper's exit code 1 is preserved. No independent pentest is claimed. The public diary was also visually verified; the screenshot digest is recorded in the JSON receipt.

Earlier browser-control failures and pending handoffs remain retained. Publication was completed through the existing authenticated Vivaldi session; the separate Edge email-2FA flow was not used.

## Private Preview restoration

The exact original private Preview r2 archive `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26` was restored at **2026-11-04 04:20 Europe/Rome**, deployment `01a1a490-572c-73ea-bf90-14fa98a55431`. All **12 restoration checks** passed. Implementation identity remained `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`.

The saved report remained completed and private, its run stayed observe/silent, and publication and notifications remained disabled. Full-row hashes of all **12 monitored tables** matched the fresh pre-maintenance snapshot. Worker lease metadata and administrative access logs are outside that table invariant. No new hosted scan was launched. Temporary staging maintenance does not demonstrate continuous Preview availability.

## Qualification still open

The frozen cohort remains at **one accepted date and zero accepted span hours**. The 3 November failure adds no valid day. Two further successful live dates are required, with at least 20 hours per source and at least 48 actual hours overall; the earliest possible third valid date is 5 November. No frozen code, manifest or corpus was changed.

AWS PDF language, source completeness, freshness at origin and realistic 500-source capacity remain unqualified. No new Gemini/GLM execution is claimed. The hosted artifact, frozen candidate and main source remain separately identified.

[Machine-readable publication receipt](engine-v6-diary-publication-2026-11-04.json). Raw credentials, databases and source bodies are excluded from Git.
