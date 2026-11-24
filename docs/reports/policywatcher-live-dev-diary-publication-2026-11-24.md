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
