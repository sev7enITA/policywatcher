# Public Preview access published, 2 November 2026

The [public homepage](https://policywatcher.online) now places **Engine 6.0 Preview is online** before the introduction, with direct links to the authenticated [private Preview](https://staging.policywatcher.online/admin/engine), the bilingual [engineering notebook](https://policywatcher.online/engine-6-preview?lang=it) and the [wiki](https://github.com/sev7enITA/policywatcher/wiki). The notebook retains architecture, decision-flow and entity diagrams and distinguishes the current parser campaign from the previous incomplete cohort.

The public runtime remains **5.2.0**. Engine **6.0.0-preview.1** runs separately on staging with its dedicated database, private observations and publication/notifications disabled. A content deployment is not activation of Engine 6 on the public service.

## Executed release sequence

| Stage | Actual evidence |
| --- | --- |
| Stable content on staging | Deployment `01a19a07-1ec8-71e3-b54c-0fa40da670ef`, Completed / Current at 03:14 Europe/Rome; 11/11 required checks and 22/22 content checks passed |
| Promotion gate | Exact archive SHA and staging receipt accepted; staging checked at 02:15:05.393 UTC |
| Same archive on production | Deployment `01a19a10-c401-703c-bb78-d874622df661`, Completed / Current at 03:24 Europe/Rome; 22/22 content checks passed |
| Production runtime | Health and database integrity ok; 18 companies, 35 application tables, 19 migrations; nine internal verification checks passed |
| Exact private Preview restored | Deployment `01a19a14-46e1-734d-bdcf-9b378d46c51b`, Completed / Current at 03:28 Europe/Rome; 12/12 restoration API checks passed |
| Browser | Public top banner rendered; authenticated saved comparison reopened; exported JSON file validated against the saved API report |

Public archive SHA-256: `2244a87a4879df0e999463263ff608747840432f2312aa36272e1a059c010f39`, source `d846a498988aaa22ce1bb955aba347e9d186463f`. Comparison with the preceding stable archive found exactly three changed entries: release manifest, homepage and notebook. Runtime and schema files were byte-identical. Five deployed source files, including both pages, package and schema, also matched the uploaded archive by SHA-256.

The public runtime verifier retained aggregate status `attention` and exit 1 because its tenth check is an **external independent dynamic security test**. All nine internal checks passed. No independent test was performed or asserted by this deployment; the aggregate status was not rewritten as ready.

## Preview data preserved

Restored archive: `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26`, source `34c188c0d54ec24d61469ca1683dec8988252c6f`, live implementation `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`. This is the same artifact as the [1 November hosted verification](engine-v6-hosted-deployment-2026-11-01.md), not the later PR #39 parser candidate.

Read-only SQLite snapshots before the temporary staging swap and after restoration have identical full-row digests for all 12 observed tables: policies, snapshots, changes, check logs, subscribers, outbox, source contracts, baselines, runs, tasks, reviews and artifacts. The database retains 113 policies, one completed run, eight tasks, three reviews and two artifacts. There are zero active tasks, official policy changes or outbox events. Database integrity is ok. No new scan or capture was started during this rollout.

Saved run `4e9eef90-0bbb-42ee-b945-922ac76ffffc` remains completed in observe/silent mode. Its browser export was downloaded at **02:29:44 UTC**, with **22,649 bytes** and SHA-256 `b0e731ed8444701c3c1a1d2159325a66233983f778c9e3a466046789b3408ad9`. Parsed JSON equals the authenticated API response, including the existing four-policy report. This closes the earlier unverified browser-export item.

## Retained failures and limits

- The first additional staging verifier expected HTTP 200 at `?lang=en`; the site correctly returned its canonical 308 redirect. The verifier was corrected to check both redirect and canonical page. The original failure remains retained, and the artifact was unchanged.
- The browser download-event observer timed out after 15 seconds. The actual completed file was found at the expected download location, with matching timestamp and run identifier, and its contents were verified. The observer timeout remains recorded separately from the successful file export.
- The [PR #39 parser correction](engine-v6-codeql-triage-2026-11-01.md) remains a separate candidate: 1,569 local tests passed, 14 skipped, with a new frozen 12-source cohort and zero live windows at initialization. The two dates and 20.77 hours of the old cohort cannot qualify the changed parser.
- This publication adds no daily observations. Source completeness, at least three dates spanning 48 actual hours, continuous managed-worker availability and 500 distinct live daily sources remain unqualified. Reviews from Gemini and GLM are not execution evidence.

The [machine-readable receipt](engine-v6-public-access-rollout-2026-11-02.json) records exact identities, checks, preserved failures and evidence digests. Private report payloads and credentials are not published.
