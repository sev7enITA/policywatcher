# Source completeness controls: 22 November 2026

Implemented local candidate on `codex/source-completeness-controls-20261122`, separate from the frozen `050af19` cohort, hosted r3 and the PolicyAsCode PR81 candidate. No historic observations, source approvals or qualification days transfer to this implementation. No engine activation or hosted service change occurred.

## Sintesi

Il candidato confronta il documento con un riferimento revisionato, rilevando unità mancanti, occorrenze perse, righe e ordine alterati. Trasporto, corrispondenza al riferimento, interpretazione e scrittura atomica restano controlli separati: nessuna certificazione universale o percentuale inventata. Metodo EN/IT e pannello admin sono aggiornati nel codice; il pacchetto del sito stabile è preparato e verificato localmente, ma la pubblicazione resta da completare.

## What changed

The experimental engine now compares an acquired document against a reviewed all-block reference inventory: exact source/language/version context, NFC/case-preserving text fingerprints, section paths, occurrence counts and an ordered sequence fingerprint. Missing or unexpected blocks, altered repetitions/table rows, wrong scope/language and reordered content hold the candidate. Legacy contracts can support private observation but cannot qualify an Engine 6 public baseline, unchanged refresh, change commit or manual approval. These gates are recomputed from frozen artifacts and retained inside the transactional publication paths.

Reference metadata records reviewer attestation. It neither authenticates a publisher nor proves that the reference itself includes every legal provision or attachment. `referenceOriginVerified` and `sourceCompletenessQualified` stay false even when the declared reference matches. One explicit counterexample demonstrates that a self-consistent incomplete reference can match without becoming independent qualification. An authentic policy change can require a new reviewed reference; no automatic regeneration is sold as independent verification.

Transport handling checks raw encoded byte counts separately from decoded content, rejects premature endings, resets, inconsistent lengths and policy-level206 responses. A specifically requested CommonCrawl WARC byte range remains a different scoped operation. Unsupported encodings, decoding failures and body limits fail explicitly. Fetch auto-decompression is recorded as not comparable to an encoded Content-Length. Every transport proof keeps entity completeness unproven; renderer API transport is not relabelled as origin-policy evidence.

The administrator can configure an inventory, inspect separate transport/reference/interpretation states, see gaps and retain failed approval receipts. An audit-storage failure is reported explicitly while approval remains refused. Missing coverage disables the approval control. The public methodology distinguishes download integrity, reference coverage, semantic accuracy and transactional atomicity; it provides NIST/OECD design-guidance links without a compliance/certification claim. Methodology language now follows URL-selected EN/IT during server rendering, metadata and navigation.

## Executed verification

- **1,801 application tests passed,14 skipped**,219 files passed / 3 skipped, with OS-enforced TCP/IP denial and scoped Unix IPC for local test tooling. No live source/provider requests were part of that run.
- Included targeted scopes: **18 reference-coverage tests**, **25 transport-integrity tests**, **7 actual isolated SQLite/worker publication-gate tests**, **4 administrative refusal/audit/budget tests**, **3 methodology locale tests**, and the adapted **156-test engine suite**. These overlap the full-suite total and are not additional throughput measurements.
- Targeted ESLint and critical-test TypeScript passed. Next 16.4.6 production build passed in an isolated source copy with matching dependency lock and disposable SQLite database.
- Actual local ChromeBeta UI: contract loaded, malformed inventory blocked before any POST, mobile viewport390 px with zero horizontal overflow. A viewport screenshot was inspected. Full-page captures repeated the inner scrolling viewport and are retained as rejected visual evidence, not treated as duplicated UI. The local private worker was intentionally not enabled; its invalid-hosted-context status is not a hosted worker-health result.
- Separate stable5.5 build passed. **24 compiled HTTP checks plus one local database-schema check** verified EN/IT initial H1/title, language, canonicals, navigation and cumulative diary. Public stable schema remained35 tables / 19 migrations. The stable content archive includes no new engine, admin runtime or PolicyAsCode endpoint.

Earlier failures remain in `output/source-completeness-20261122`: missing-inventory fixture assumptions, an unescaped route-regex slash, contrastive-heading style checks, a stale language-link expectation, the temporary CJS seed harness and failed browser locator/module-access attempts. None is counted as a pass. Existing publishing fixtures were given explicitly authored synthetic references; observation-only legacy contracts remained legacy. No assertions or security rules were removed to hide a failure.

## Local model challenge and adjudication

Four installed model identities supplied actual proposal reviews through the local LMStudio endpoint: Qwen3.8 27B Uncensored, Qwen3.8 27B, Ornith 1.0 35B and GLM-4 9B Chat. GLM's native API attempt returned400; its subsequent compatible API response succeeded. These are runtime-declared names, not a claim of independent model families or a GLM 5.3 MAX review. A further Ornith review inspected selected actual source excerpts; it did not run tests.

Accepted: circular-reference risk; explicit reference-origin and overall-qualification limits; operational cost of reference refresh; raw/decoded length separation; fail-closed206 handling; prominent missing-evidence states; normalization specificity; and a stable lexical comparator for observation grouping.

Rejected/corrected: a match is not a universal certificate; strict URL mismatch fails closed rather than enabling a bypass; the ordered fingerprint is distinct from the sorted multiset, so the reviewer's claimed locale-sort order bypass was inaccurate, although replacing locale-dependent sorting improves reproducibility. GLM's proposed single confidence percentage/certification badge was rejected as unsupported. An emergency human approval cannot waive a missing hard evidence gate. Models are advisory and their opinions do not replace executed negative controls.

## Delivery state and remaining limits

Git candidate, wiki update and stable content preparation are separate from hosted publication. The prepared cumulative stable source is `5c6b6e6af68a21c1f80b5d87e4edd14b9e5115c4`; archive SHA256 `671fbd44b4f6d6fb0ccbb68170fb02a5b8bf15d9f1db36a63b29d778ebaf2952`. Only five entries differ from the previous prepared stable archive: diary, methodology, localized notice-verification link, public locale helper and release manifest. Other 1,066 entries, including388 protected runtime entries, are unchanged. Previous MVP/history rows remain.

No staging/production upload, Preview restoration or fresh hosted database snapshot was performed. The desktop control service still reports `Trusted RPC service is not configured: sky`; publication must follow staging, a fresh Preview snapshot and exact r3 restoration/verification before production. Prepared artifacts are not online availability.

Independent source-reference authenticity, attachments and non-text content, live complete-document qualification and 500 successful daily full-pipeline completions remain open. The main/public stable scanner remains a separate runtime. These changes create a new implementation identity requiring a new qualification cohort before any engine promotion.

## Concurrent release reconciliation

While this candidate was being prepared, PR82 advanced main to product5.6.0 (`afa8d72`). The first PR83 had a merge conflict in the generated implementation manifest, so no CI checks were scheduled. Main was merged preserving both releases and this candidate, and the manifest was regenerated rather than choosing either old hash. The combined offline suite passed **1,802 tests with14skipped** (the earlier1,801 run remains a separate checkpoint). A new5.6 build is recorded separately.

All prepared5.5 web archives, including671fbd44, are now **SUPERSEDED/HOLD: DO NOT DEPLOY**. Their original receipts and bytes are preserved. A coherent5.6 public-content candidate is being prepared from the stable runtime plus the approved PR82 public-release changes; no private engine code is promoted with it. An unauthenticated release-manifest request returned404 and health returned401, so neither is accepted as current online version proof. No claim is made that5.6 is already deployed.
