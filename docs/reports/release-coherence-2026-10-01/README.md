# PolicyWatcher Beta 5: release coherence review

Scope: methodology, dashboard document selection, Site Atlas, Feature Atlas, release history, related public pages, Git integration and release preparation. Review performed on 1 October 2026 against a sanitized copy of the repaired dataset. No real email, webhook, subscription or administrative scan was triggered.

## Result and publication boundary

The source candidate aligns the document-type scope and evidence boundaries across the dashboard, English/Italian methodology and its modal, both atlases, changelog, release impact, roadmap, trust page, newsroom and public embed. Historical releases keep their original identity. Press Kit facts retain their snapshot date and archived PDFs remain explicitly dated.

The source branch starts from GitHub main `d1f463fc2bf714e16c0212235a696d684e8c4af2`. It preserves GitHub-only files and tests, incorporates the previously deployed September source improvements recovered for this task, and adds the Beta 4/Beta 5 repair and document-scope work. The primary user's dirty checkout is untouched.

**Not deployed:** the live public manifest still reports `4.0.0-beta.3`; Hostinger's browser session is at Log in. Staging verification, promotion and the final online audit of Beta 5 remain pending. Build success and a source commit do not establish deployment.

## Verification

- 1,117 tests passed; one scan-mutating integration test intentionally skipped on the read-only fixture. The focused document-scope integration cases were enabled against the sanitized database.
- Production build with Next.js 16.3.8 and critical-test TypeScript checks passed.
- Web lint: zero errors; 15 existing full-navigation warnings exposed by the new Next.js lint version. Navigation behavior was retained.
- Runtime dependency audit: zero known vulnerabilities. Next.js 16.3.8, Nodemailer 10.0.13 and sharp 0.35.5 are locked; undici and browser-mapping transitive fixes are in the lockfile. Advisory references: https://github.com/advisories/GHSA-vcvr-r3jv-pc5j and https://github.com/advisories/GHSA-v53p-9fqp-m79j . An audit is not a claim of absence of all vulnerabilities.
- All 72 route templates opened individually in the browser: 53 public/utility templates and 19 administrative templates. Protected sections used a local-only account and sanitized fixture.
- 427 concrete URLs checked on the final compiled build: zero HTTP errors. Includes sitemap records, static routes, expected authentication redirects, and grounded share/embed examples.
- 478 distinct internal paths inventoried; source-backed public files checked for existence; 11 additional HTTP HEAD checks, including both archived fact sheets, passed.
- Methodology and Press Kit checked in English and Italian; MethodologyModal and ChangelogModal opened through a temporary local component harness. The harness was removed before the final build and packaging.
- Methodology, both atlases and the Beta 5 release page checked at 390px: no document-wide horizontal overflow. Viewport restored.
- Screenshot capture timed out in the browser; evidence is DOM/HTTP and code/test based. No pixel-perfect visual claim. CSV output content is tested; browser download-event verification remains unavailable from the earlier scope work.

## Findings corrected

1. Feature Atlas and release-impact registry showed Beta 3 as current while release metadata said Beta 5.
2. Newsroom's historical Beta 3 slug inherited the current version/date. It now remains archived under its own identity and Beta 5 has its own record.
3. Roadmap and changelog described older work as the current release.
4. Methodology now states document scope, missing assessments, equal weighting, complete-type eligibility and the distinction between availability and confidence. It no longer calls an AI score proof of safety.
5. Dataset QA explicitly describes its all-history denominator; 820/1,185 (69.2%) is distinct from the current public dashboard's 375/675 (55.6%) in this fixture.
6. Public embed now describes evidence classification, policy risk and unassessed change impact separately.
7. Current release date incorrectly formed a nonexistent Press Kit PDF filename; actual archived EN/IT files are linked and dated.
8. Release dependency audit findings were corrected and all relevant checks rerun.

## Conditions still visible

Five source records remain unavailable (four Revolut, one TikTok Community Guidelines) and are excluded by public evidence controls. Historical KPI gaps and regional-analysis issues remain visible in administrative QA. These are not silently filled or marked reviewed. The quality score is not statistical confidence.

The private executive study cannot load without confidential configuration; investor routes were tested only at their missing-token boundary. Word host integration, external VPS, SMTP delivery, independent security assessment and Hostinger promotion were not established by this local review.

Use [the per-page register](pages-and-sections.md) and [structured section inventory](pages-and-sections.json) for individual outcomes. Raw browser captures are retained in the local release audit directory, outside public Git history.
