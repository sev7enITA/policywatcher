# Engine 6 evidence controls, 16 November 2026

The stable service is 5.5.0. The separate hosted Preview is r3. This work changes the public diary and verification tools. Retrieval and publication decisions in either runtime are outside this change.

## Source replay

The [manifest](engine-v6-evidence-fixes-2026-11-16/manifest.json) binds a new [offline corpus](engine-v6-evidence-fixes-2026-11-16/passages.json.gz) to eight retained HTTP bodies and their matching r4 extraction hashes. All ten source IDs belong to the original selection. Two further requests returned 403. Two of the eight extracted documents had no reference passages. The six populated static references contained **1,060 distinct passages**, of which **1,046 matched**. Seven misses belonged to Google IT and seven to Google EN. The manifest identifies all fourteen by DOM locator and passage digest. The earlier live browser result of 812/812 remains a separate historical observation. Its individual browser passages were not preserved.

The static reconstruction ran Chromium with JavaScript and network access disabled using the archived HTML. External stylesheets, dynamically inserted text, short clauses, linked annexes and table relationships can affect coverage. A match proves the normalized words occur contiguously. It does not establish section identity, entailment, completeness or capacity for 500 policies per day.

Each per-source packet contains the SHA-256 token dictionary, the full normalized extraction token stream, the ordered reference sequences, DOM locators, passage digests and the first zero-based matching token offset. An offset of -1 records absence. The comparator normalizes Unicode NFKC, lowercases, and tokenizes letters, marks and numbers. One source contributes each distinct normalized passage once. Identical text in different sections is therefore a single observation. The archive contains no raw page body. The [capture implementation](../../scripts/reconciliation/capture-archived.ts) can regenerate an observation when the original private HTTP bodies and their log are available. Offline replay of the published packet only needs Node and the two published files.

From a checkout run the following commands.

```sh
node scripts/reconciliation/passages.mjs docs/reports/engine-v6-evidence-fixes-2026-11-16/passages.json.gz
node --test scripts/reconciliation/controls.test.mjs
python3 scripts/reconciliation/check-language-pairs.py
```

A [second implementation using Python standard library](engine-v6-evidence-fixes-2026-11-16/replay-independent.py) checked all 1,060 offsets and passage hashes. Run it from the repository root with Python 3.10 or later. Its [recorded result](engine-v6-evidence-fixes-2026-11-16/independent-replay.json) identifies each source and denominator.

All three commands above and the independent Python replay [also passed](engine-v6-evidence-fixes-2026-11-16/offline-verification.json) with macOS network access denied using `sandbox-exec -p '(version 1)(allow default)(deny network*)'`. A separate loopback TCP connection probe in the same sandbox raised `EPERM`. Node 22.22.3 and Python 3.14.6 were used. The navigation unit tests use locally installed project dependencies.

The regression suite removes the first matched Amazon reference from a copy of the archived token stream. The comparator reports that exact passage missing. It also checks that a homepage fixture serving only the English link fails the Italian release check. A page reached with the wrong language or without the validation section fails independently.

## Site and language reconciliation

The staging gate follows each homepage diary link, checks its destination language and validation section and requires the bilingual check in the promotion receipt. The diary renders each dated receipt in a separate list item with a 44-pixel minimum link height and a visible keyboard focus outline.

The [corrected matrix](engine-v6-evidence-fixes-2026-11-16/language-pairs.csv) first resolves reciprocal language alternatives in the [archived sitemap](engine-v6-evidence-fixes-2026-11-16/sitemap.xml.gz). The English and Italian associations pages form one measured pair with 82 headings on each page. Across 522 pairs, 306 had identical heading sequences, 211 differed, two lacked comparable headings and three lacked a pair of HTTP 200 observations. The historical path-only matrix remains available in the [original assessment](engine-v6-reconciliation-2026-11-16.md).

## Independent review and acceptance

[Gemini's source review and dispositions](engine-v6-evidence-fixes-2026-11-16/gemini-review.json) retain its response from the dedicated free-tier Gemini 3.5 Flash-Lite API. Its observation about link language led to explicit label, language and duplicate-link tests. Its namespace objection was tested against the archived sitemap. The associations pair used reciprocal XHTML alternates. Gemini 4 Argon High returned no usable review on the attempted channels. GLM-5.3 Max requested human verification before returning an answer. No approval is attributed to either of those attempts.

The [delivery receipt](engine-v6-evidence-fixes-2026-11-16/delivery.json) contains the exact archive and deployment IDs, staging and production browser observations, private r3 preservation checks and the two negative controls. A copy of the live homepage with the Italian entry removed failed the real verifier. The historical raw browser reference was unavailable for a retrospective replay. The published corpus supplies a new independently repeatable token comparison.

The [first deployment](engine-v6-evidence-fixes-2026-11-16/first-deployment.json) passed HTTP verification. Chromium also recorded stalled homepage clicks during initial rendering on the public service. Four separate click probes reached the correct Italian route. The follow-up changed both homepage diary actions to native document links. The [browser acceptance script](../../scripts/reconciliation/diary-browser.mjs) checks actual navigation, independent hit targets and keyboard focus at both widths and in both languages.

The final stable archive passed all 12 staging checks. On the official site, two Chromium runs each followed both diary links at 390 and 1,366 pixels. Each found the five separate links with a minimum height of 44 pixels, visible keyboard focus and no horizontal overflow. The [mobile capture in Italian](engine-v6-evidence-fixes-2026-11-16/production-mobile-it.png) records their layout. The 516 inspected source file hashes matched the archive in each stable environment. After staging, private r3 passed its 14 authenticated checks and retained all three reports and 14 evidence table hashes. Of the 48 database tables compared, only the operational EngineOrigin digest changed.
