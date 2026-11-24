# Live Dev Diary launch and Episode 001

Published 24 November 2026 on stable PolicyWatcher 5.6.0. The public [series index](https://policywatcher.online/live-dev-diary) is available in English and [Italian](https://policywatcher.online/live-dev-diary?lang=it). The [English presentation](https://policywatcher.online/live-dev-diary/episode-001) has 11 slides and a dated Episode 001 cover.

- Stable source `198b84d896314dc690b3cac761e65c7ca4200a3f`. Main merged [PR #89](https://github.com/sev7enITA/policywatcher/pull/89) as `325fda57de617863dfc4e62a8b8f9a1bad9b39a7` after six passing checks. Main's generated manifest was refreshed for the public routing dependencies.
- ZIP `PolicyWatcher-5.6.0-hostinger-2026-11-24-live-dev-diary-public.zip`, SHA-256 `2f9226f8ec013d36083ac7327cc8386f1fac92b0f943fd689c7c9a21a232e1ed`. Changes are the public diary and deck, routing, navigation, metadata and assurance checks. The separate presenter teleprompter is local.
- Staging `01a20bb7-8788-7081-b48b-a5dc0f1beb13`. Twelve operational checks and twelve diary HTTP checks passed. All 1,145 stored source files matched. The browser opened the cover, agenda and closing slide. The hosted deck retained its hash-specific security policy and staging noindex.
- Production `01a20bbb-d83c-739a-aa79-ffabf7fdbc3d`. All 1,145 stored source files matched. Eleven diary HTTP checks and nine internal operational checks passed. The independent security check is external. The production browser verified date, portrait, slide controls and QR at 05:11:13 Europe/Rome with HTTP/2. The screenshot QR decoded to the official homepage.
- The embedded browser reported a QUIC transport error when opening the production deck. The same journey worked in an independent Chrome session over HTTP/2. No hosting network settings were changed.
- Production DB integrity passed with 36 tables and 19 migrations. Thirty-five table contents matched. Only the administrative access log changed during checks.
- Private Engine 6 Preview r3 was restored as `01a20bbb-80e7-72f1-b3a9-b5c6931026f1`. All 1,090 source files, 14 protected table hashes and three saved report hashes matched. All 14 private runtime checks passed.

Earlier staging candidates were superseded before production. The first browser check exposed blocked inline style attributes. A subsequent hosted static-file check found that the CDN omitted the application security and indexing headers. The final deck is served through the application route. This publication triggered no scans or notifications.

## Episode 001 interface tour

The 24 November revision introduces the homepage, public menus, interactive workspace, citizen tools, evidence views, Atlas and methodology. The company example was removed from the deck and series index. The original dated cover and closing QR are byte-identical. Episode 002 is introduced as a look at the engine. The presenter materials stay local.

- Stable source `0237e46b8b1504525a9566b4b3d1cf4601099f9f`. [PR #90](https://github.com/sev7enITA/policywatcher/pull/90) integrated the same public content into main as `eacd8fc422ac06e3cb4e03bff2657591c70cc8a8` with six CI checks passed.
- ZIP `PolicyWatcher-5.6.0-hostinger-2026-11-24-live-dev-diary-interface-tour-final.zip`, SHA-256 `11280f7864468e6d75009156c12f9f4f9f5c2f745926658d75220bc7576038d0`. The archive updates the deck, the EN/IT index, its focused test and the release manifest. The earlier workspace-layout draft was superseded in staging.
- Staging `01a20bd2-effd-733e-84ac-c999cc8c096d` passed 12 operational checks and 12 diary HTTP checks. Production `01a20bd7-0778-739d-a6c7-939cd38c9246` passed nine internal operational checks and 11 diary HTTP checks. The independent security check remains external. Each environment matched all 1,145 stored source files.
- Browser checks covered all 11 slides through the Italian index at 1280, 375 and 320 pixels, keyboard navigation and the closing QR. Thirty distinct public links returned HTTP 200. The deck retains its existing hash-specific policy. One staging run logged a browser favicon request blocked by that policy. The portrait and QR loaded.
- Production database integrity passed with 36 tables and 19 migrations. 35 table hashes matched the before snapshot. Changed table hashes: AdminAccessLog.
- The original Preview r3 was restored as `01a20bd7-51c1-738b-87b1-4bfd06345fe6`. All 1,090 stored source files, 14 protected tables and three saved report hashes matched. Fourteen private runtime checks passed.
