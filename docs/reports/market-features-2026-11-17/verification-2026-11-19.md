# Policy Briefing release verification, 19 November 2026

The public 5.5.0 package was built from stable revision `212ba5f8839610cebcebba03f0081c1afbe01b44`. SHA-256 `c8373f9338def91328ee728756318bf9baebcbda51396eeafeb3ede6c2a4881a`. The bilingual briefing is linked from the changelog alongside the 17 November research roundup. The 7 November r3 record retains its original date.

## Review and corrections

- [GLM 5.3 Max review](https://chat.z.ai/c/5da29bab-6334-40bd-8fa4-62c05ae4bdbf) reviewed the product description. Its three hypotheses covered review history, failed-refresh exports and matching semantics. Tests retained the exact prior review, verified case-insensitive word boundaries and checked both export formats. The Markdown file now states the coverage loss in the reader’s language.
- Antigravity returned a successful Gemini 4 Argon High source review of the pagination and refresh logic. The first, broader Gemini 4 Neon High request timed out without a verdict. Argon identified loss of newer records at the 2,000-row limit, stale coverage incorrectly recovering through pagination, and cursor history clearing before refresh success. The candidate retains newer rows, reports clipped history, disables pagination while the current catalog is unavailable and clears cursor tracking after a successful refresh. Records outside the current catalog trigger a partial-coverage warning.
- The 17 November LM Studio review is recorded separately in the original receipt.

## Local delivery checks

- The production archive was built with Next.js 16.4.6. The stable package lock and extraction fingerprint were updated together. The production dependency audit reported zero known advisories.
- The stable suite passed 1,335 tests with 14 skipped on the exact final release revision with the patched dependencies. The research checkout passed 1,658 tests with 14 skipped before the same CSS correction.
- At 320 CSS pixels the Italian count labels initially extended to 358 pixels. A stacked metrics layout corrected this. An isolated production build rendered 25 synthetic changes in both languages at 320 and 390 pixels with no horizontal overflow at any of the four combinations.
- On the final mobile build, loading older records produced 28 changes. The commercial filter yielded zero. Reset restored the records. Saving a test role and exporting JSON with default settings produced 28 records and omitted the role.
- Browser verification used a local loopback reverse proxy and an isolated fixture database. No physical handset or hosted functional test is claimed.

- The local release served the new research article, the amended stable record linking to the briefing, and the original dated r3 article with HTTP 200 and the expected content in both languages.

## Hosting

Production returned 404 for the briefing before rollout. Staging hosts the authenticated private r3 service. Its current deployment was identified in hPanel and the restoration archive independently checked against SHA-256 `e82ff8ff3fe33275e62475054889cdaf97f1a12d7442bb0ca6d42ec30cf99341`. Hosted verification and promotion await the staging maintenance decision.
