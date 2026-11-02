# PolicyWatcher 5.5.0: Engine 6 Preview

PolicyWatcher 5.5 makes the separate Engine 6.0 Preview visible and accessible across the official website. The homepage announcement, changelog, roadmap, Feature Atlas, Site Atlas, newsroom, feeds, API metadata and bilingual fact sheets share the current product version.

The authenticated [Engine 6 Preview](https://staging.policywatcher.online/admin/engine) provides private durable scans, source contracts, evidence review, comparison of two extractors on the same captured response, saved reports and JSON exports. The [public notebook](https://policywatcher.online/engine-6-preview) explains the architecture, decision flow, entity relationships and qualification limits.

## Deployment boundary

Product version 5.5.0 and experimental engine version 6.0 are separate. The public deployment is built from the previously deployed stable scanner revision d846a498988aaa22ce1bb955aba347e9d186463f, with release and presentation changes. Scanner algorithms, dependency versions and database schema are unchanged. The Preview retains its dedicated database, authenticated access and disabled publication/subscriber notifications.

The source repository also contains the newer Engine 6 implementation. Its distribution remains private staging only through an explicit compiled distribution channel, independently of the product version. The public artifact does not activate it. Frozen qualification cohorts and historical observations remain unchanged. The extraction profile changes because the root package version participates in its dependency lock digest; this is not a new parser qualification result.

## Validation and remaining work

The public candidate passes 1,313 tests with 14 skipped, web lint and the optimized production build. The first full run retained one obsolete date assertion, corrected for the 2 November release before the passing rerun. Both new EN/IT PDF fact sheets were rendered and visually checked. The [publication receipt](../reports/policywatcher-5.5.0-publication-2026-11-02.md) records the completed staging/production promotion and preserved Preview: 49 production release checks, 595 sitemap destinations, 30 source-file hashes and 12 restoration checks passed.

Prior hosted Preview checks and subsequent restoration checks are distinct observations, not a combined benchmark. Complete source coverage, three distinct live dates across at least 48 elapsed hours, continuous worker availability and 500 distinct daily live sources remain unqualified.

[Release details](https://policywatcher.online/press-kit/releases/engine-six-preview-5-5-0) · [Wiki](https://github.com/sev7enITA/policywatcher/wiki/Engine-6-Preview)
