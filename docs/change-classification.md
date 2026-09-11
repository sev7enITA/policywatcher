# Classification of archived policy revisions

Classifier version: **1.0**. This is an automatic evidence check, not an adjudication of legal significance.

The same server-side classifier supplies the dashboard, timeline, policy detail, change permalink, manual-scan response and subscriber email selection. It compares immutable public snapshot texts. It never classifies from the AI summary, overall risk score, hash mismatch alone or the stored display diff.

| Machine kind | Public label | Rule | Subscriber updates |
| --- | --- | --- | --- |
| `unchanged` | Unchanged content | Both original texts are identical | Suppressed |
| `editorial` | Editorial revision | Only whitespace, NFC composition or typographic quotation marks differ | Suppressed |
| `substantive` | Potentially substantive | An exact AI-selected quote associated with a recognized KPI intersects an actual edit and is absent from the other normalized version | Included, with verification caveat |
| `needs_review` | Needs verification | Missing/private evidence, unmatched quotes, limits, broad replacement, or unverified meaning | Included, explicitly unverified |

Normalization preserves case, numbers, negations, punctuation, word boundaries, URLs and dates. Email-address masking, navigation changes and other possible extraction artifacts are **not automatically suppressed**: their benign nature cannot be established from appearance alone. A quote that also occurs unchanged in the other version cannot establish a substantive signal. Quotes longer than 240 characters, unknown KPIs, unmatched sides and invented passages are rejected rather than repaired.

The `impact` field remains `not_assessed`. Policy risk is a separate assessment. Neither a potential substantive signal nor the current risk score establishes the direction or size of an impact caused by this revision.

## Evidence and history

No schema migration, retrospective AI calls, record deletion or rewriting of historical analyses is required. Classifications are derived when read, so existing records receive the same treatment as new ones. Each result includes classifier version, SHA-256 hashes computed from the compared texts, snapshot version numbers and up to four exact before/after excerpts. UTF-16 offsets refer to the original text; highlights distinguish edited text from unchanged context. An anchored clause is shown first when available. Excerpts are partial and the full archived diff remains available.

The archive count and pagination still include every eligible public record, including initial records without a comparable predecessor. List endpoints do not return the full snapshot relations. Private snapshot relations and their raw comparison diff are withheld from policy-detail responses. Existing public-data eligibility gates remain in force.

## Operational limits

- Maximum 500,000 UTF-16 code units per text; word diff limited to 80 ms and 4,000 edits. Limit failures remain unverified. Expensive comparisons are bounded and a 64-entry process cache stores only compact results.
- At least 65% relative text-length similarity is required for the potential substantive category. Larger replacement requires review even if an AI quote matches.
- At most three stored risk-reason quotes are considered. Historical records without adequate anchored evidence often remain unverified. This version does not add a reviewer approval workflow or run a new semantic model over the archive.
- Subscriber instant, weekly and monthly emails use this classification and link to the exact change when its ID is available. Unknown legacy inputs remain eligible for review. An empty digest does not claim that no significant changes occurred.
- Existing versioned machine event feeds, webhooks, PDF evidence packets and third-party integration contracts remain archival representations; this release does not change their schemas or suppress their events. The classification is available in the public dashboard/timeline/detail JSON and web views.

## Offline validation

`npx tsx scripts/evaluate-change-classification.ts public-snapshot-sample.json report.json`

The input is a prior public export containing `source`, `capturedAt`, `records` (change IDs), and `policies` with snapshot/change relations. The command makes no API, AI, database or email calls. It checks record coverage and exact excerpt offsets.

The 2026-09-11 sample contained 53 public records across 28 policies: 3 potentially substantive, 1 editorial, 0 identical and 49 requiring verification. This distribution is a conservative classification result, **not** a measured semantic-accuracy or false-positive rate. Examples checked against the original diffs: Microsoft age-group sharing (potentially substantive), OpenAI straight/curly apostrophe (editorial), PayPal masked contact addresses (unverified), and records without predecessor snapshots (unverified).

Automated tests cover all categories, altered amounts and negations, static/fabricated AI quotes, private and cross-policy pairs, exact excerpt offsets, bounded inputs, cache isolation, API pagination and mocked email delivery. Browser verification covers the public sample in English/Italian at widths 320, 390, 768 and 1280.
