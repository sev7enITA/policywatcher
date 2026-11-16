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

The regression suite removes the first matched Amazon reference from a copy of the archived token stream. The comparator reports that exact passage missing. It also checks that a homepage fixture serving only the English link fails the Italian release check. A page reached with the wrong language or without the validation section fails independently.

## Site and language reconciliation

The staging gate follows each homepage diary link, checks its destination language and validation section and requires the bilingual check in the promotion receipt. The diary renders each dated receipt in a separate list item with a 44-pixel minimum link height and a visible keyboard focus outline.

The [corrected matrix](engine-v6-evidence-fixes-2026-11-16/language-pairs.csv) first resolves reciprocal language alternatives in the [archived sitemap](engine-v6-evidence-fixes-2026-11-16/sitemap.xml.gz). The English and Italian associations pages form one measured pair with 82 headings on each page. Across 522 pairs, 306 had identical heading sequences, 211 differed, two lacked comparable headings and three lacked a pair of HTTP 200 observations. The historical path-only matrix remains available in the [original assessment](engine-v6-reconciliation-2026-11-16.md).
