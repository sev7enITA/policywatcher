# PolicyWatcher 5.6.0 Admin English correction

Published and verified on the official domain on 23 November 2026 at 23:50:15 Europe/Rome. Hostinger lists the deployment as Completed and Current.

- Stable source revision `3804619c241609a9739f8dc494f29012899fdfc2`. The [main pull request](https://github.com/sev7enITA/policywatcher/pull/88) passed six GitHub checks and was merged as `4fc6eada45ffd59f3f52fd981a2320ca077a85a5`.
- Archive `PolicyWatcher-5.6.0-hostinger-2026-11-23-admin-english.zip`, SHA-256 `a17d8a5438cd0ba27e534bd2a7d64cec5d980e832bf1fc503414d08589edf5b9`. Compared with the prior stable release, only the six Admin source files, two test files and the manifest differ.
- Staging deployment `01a20a90-9789-739b-95f7-aad5f5fe45ca`. All twelve operational checks passed, and the archive matched 1,139 source files on the host. Browser checks confirmed English navigation, confidence labels and formulas, and that the Italian summary opens on demand.
- Production deployment `01a20a96-9275-71f2-b65d-5f436187137f`. The same 1,139 source files matched. Nine internal operational checks passed. The independent security check retains external status.
- Authenticated browser checks repeated successfully in production. The assessment is marked English and noindex. Public Press pages returned matching English and Italian document language.
- Production integrity passed with 36 tables and 19 migrations. The database comparison found 35 identical tables, with changes limited to the administrative access log.
- The exact private Engine 6 Preview r3 was restored as `01a20a95-edf6-7064-a94d-e9cad1592940`. All 1,090 source files, 14 protected table hashes and three saved report hashes matched. All 14 private runtime checks passed.

The staging HTTP probe initially could not observe the client-rendered navigation. An authenticated browser verified both interfaces on staging and production. This release did not initiate any scans or send notifications.
