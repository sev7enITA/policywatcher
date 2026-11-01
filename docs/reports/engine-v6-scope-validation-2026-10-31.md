# Engine 6 preview: scope and ordering validation, 31 October 2026

This continues [the previous adversarial checkpoint](engine-v6-adversarial-2026-10-31.md). Code checkpoints are `ec6f6bd` and `ec736c2` on `codex/engine-v6-local`. Work is local; nothing in this cycle deployed or enabled Engine 6, changed a production baseline, sent notifications, or pushed Git commits. GLM was explicitly deferred by the user. The public preview announcement remains the previously published content-only release.

## Reproduced failures and corrections

Six preserved regression runs reproduce **31 failing cases**, not 31 independently classified defects: 10 initial ordering/removal/timestamp cases, 4 additional removed-content cases, 1 semantic fragment-root case, 3 list/dialog cases, 10 cases following the second Gemini review, and 3 compound-layout cases. Thirty-six tests were added overall, including controls and a persistence/publication integration test.

- **Response time:** `observedAt` is now recorded after each transport returns, rather than before retrieval starts. A retained incomplete candidate keeps its own response timestamp when later transports fail. Confirmation still requires distinct runs and fresh eligible evidence; a 304 cannot confirm a candidate.
- **Clause order and list markers:** Engine 6 opts into ordered serialization of text before, between and after nested blocks. A trailing exception is no longer moved ahead of its clause. Compound list items receive a single marker, including paragraph-only items; nested headings are emitted once. Separate leaf layout clauses inside list items, quotations and definition descriptions remain separate. A first attempted layout correction split a list lead; the existing regression caught this and the final correction preserves that lead.
- **Removed content:** nonempty navigation/footer/sidebar and similar content intersecting a document root cannot silently disappear and remain eligible. The same applies to text in otherwise removed headers, forms, noscript and SVG. Dialog checks also cover a dialog that is or contains a document root, including when another apparently valid document remains outside it.
- **Interactive text:** an ordinary inline link with `role="button"` remains part of its sentence, preserving opt-out language. Verified disclosure labels and their uniquely referenced contents are retained. Other unresolved interactive text is held for review, including select/combobox controls. Exact reviewed exclusions still bind the original serialized DOM hash.
- **Fragment scope:** a resolved non-heading fragment gets an explicit container and cannot subsequently narrow to an incidental policy-class or OneTrust descendant. Adjacent sections remain excluded. Fragment resolution precedes OneTrust recursion; the allegation that passing an undefined URL necessarily loses fragment scope was not supported by the complete code or the regression.
- **Header and code text:** script/style content is removed after exact exclusion matching, before text-based gates and title recovery. CSS no longer creates a false title or a false removed-content issue. Unextracted external document subtitles/dates and ambiguous external titles hold for review.

The integration regression exercises real local task persistence and acquisition with synthetic HTML. Unreviewed removed text produces a pending hard review, preserves the prior policy hash, leaves the HTTP representation cache empty, invokes neither model, creates neither PolicyChange nor outbox event, and cannot be waived by ordinary approval. This is local synthetic evidence, not a production result.

## Fresh acquisition and frozen replay

The new bounded source window retrieved **12/12** sources with **12 direct HTTP 200 attempts**, no fallback needed, and 12,570 ms total measured per-source retrieval/extraction time. Inter-source pacing and process startup are additional. Node automatic address-family selection was disabled, as in the earlier successful retry; this is an observed environment configuration, not proof of a universal network remedy. Eleven sources supplied the expected language; the PDF representation still has no verified language.

These fresh requests ran at the first checkpoint. After the remaining parser corrections, both their stored bodies and the original first-window bodies were replayed under the final extraction profile: **12/12 identical text hashes and block arrays between windows**. Those replays are offline computations, not additional observations. All windows are on the same calendar date.

| Source | Previous checkpoint characters | Final characters | Bounded inclusion audit |
| --- | ---: | ---: | --- |
| AWS Service Terms | 301,235 | 301,235 | 0 missing normalized text-node values |
| Stripe Privacy IT | 94,173 | 94,175 | 0; trailing Brazilian transfer clause now follows the nested rights list |
| Microsoft Services | 121,815 | 121,815 | 0; list lead retained intact |
| Apple Privacy | 28,501 | 28,124 | 0; duplicated headings removed, list markers and control text retained |
| OpenAI Service Terms | 17,146 | 17,149 | 0; unresolved interactive UI now explicitly held |
| Anthropic Terms | 36,239 | 36,241 | 0; navigation/header/interactive uncertainty explicitly held |
| Meta Privacy | 54,855 | 54,855 | 286; missing explicit document root remains held |

The remaining five source results are included in the companion JSON. All twelve Apple disclosure targets remain retained. Small character gains include interface labels and are not evidence of greater policy accuracy. No source contract was inferred or approved by the probe. The inclusion audit still deduplicates normalized text-node values of at least twelve characters, ignores some UI and occurrence counts, and cannot detect source content absent from the response. Zero misses is not proof of completeness.

## External review and adjudication

Two actual **Gemini 4 Argon / Alta** web reviews completed. The first inspected the bounded diff; the second received preparation, fragment and extraction implementations plus adjudication. Their saved responses and candidate hashes are preserved in the companion evidence JSON. No account identifier or private conversation URL is included there.

The first review's semantic-root, dialog and list findings were reproduced and fixed. Its generic mixed-div omission example was already handled by the preparer. Its no-root example already held, and its fragment/OneTrust ordering concern was rejected after inspecting and testing the full sequence. Conservative holds for an article inside outside chrome remain intentional. Selecting the last incomplete candidate is not evidence confirmation; artifacts are retained separately.

The second review closed those prior findings and identified interactive-text omission, fragment sub-selection, script/style contamination, and external header loss. Local reproductions confirmed the relevant failures and the final fixes pass their regressions. Its compound-layout limitation also led to three reproduced and corrected cases. **The final fixes were tested locally after that review; there is no separate external sign-off of the final commit.** GLM was not retried and this candidate is not labelled GLM-reviewed. Model opinions are inputs to testing, not substitutes for execution evidence.

## Final checks and remaining qualification

- Engine/audit suite: **118 passed**.
- Full suite: **1,437 passed, 14 skipped**; 192 files passed and 3 skipped.
- Web and critical-test TypeScript passed; lint: **0 errors, 15 existing warnings**.
- Production compilation passed against an isolated local SQLite database with scans/publication/notifications disabled.
- Final source windows were hash-checked and replayed under the same parser; prior frozen evidence was not overwritten.

Parser hashes changed again, so baseline replay/review and fresh confirmation remain required. Parser recovery must not be announced as a provider policy change. Complete list nesting/ordered numbering, table hierarchy, provider-specific scope/noise approval, independently annotated completeness/change cases, original PDF bytes/language/structure, three actual daily windows, full-document model cost/latency and production-scale PostgreSQL/throughput remain unqualified. Existing small synthetic API results were not rerun or promoted in this cycle. No new monthly cost estimate is inferred from these tests.

See [sanitized evidence](engine-v6-scope-evidence-2026-10-31.json) and [artifact manifest](engine-v6-scope-manifest-2026-10-31.json). Full source bodies and detailed intermediate logs remain in the ignored local `output/engine-scope-2026-10-31/` directory.
