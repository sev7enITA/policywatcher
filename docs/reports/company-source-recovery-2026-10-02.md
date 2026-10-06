# Official source recovery - 2 October 2026

## Scope and findings

The operational pass covers the 18 configured companies, independently, with emphasis on the six dashboard document types and English/global, EU, UK and US sources. It is a reviewed catalogue expansion, not a claim to enumerate every product, country, language or historic version published worldwide.

The initial production catalogue had 50 policies, 130 legacy snapshots and 79 legacy change records. Waze and Coca-Cola had no configured policies. Four Revolut sources and one TikTok source could not be acquired. The old database constraint allowed only one policy per company/type/jurisdiction, incorrectly blocking separate documents in the same category. PDF responses were rejected by the scraper. Apple's AI source pointed to a product landing page; the AWS DPA source pointed to a whitepaper explanation rather than the agreement.

## Changes

- Replace the old uniqueness constraint with company/type/jurisdiction/source URL in both database providers. Preserve rows and reject exact-source duplicates. Update discovery approval, onboarding, initializers and schema readiness.
- Parse bounded text PDFs before the common policy-content gate. HTTP/1.1 and HTTP/2 use the same decoder; compressed responses retain byte limits. Malformed, image-only and oversized PDF documents remain failures.
- Store reviewed official archive pairs in the canonical Document/Version/Change graph with `official_archive_comparison` kind and no legacy policy/change linkage. Actual retrieval timestamps stay in `capturedAt`; publisher effective dates are separate and nullable. This preserves live chronology, current texts, KPI denominators and notifications.
- Add `/historical-comparisons`, with source links, version labels, text hashes, captured text and a diff. Link it from Evidence and Site Atlas. Optional company and document-type scopes filter archive records.

## Local validation

- 1,124 tests passed; one existing test skipped. Tests cover real PDF parsing, invalid and compressed payloads, schema migration row preservation and duplicate protection, and historical capture validation.
- Production build and targeted lint passed. Eight reviewed comparison pairs imported twice into the sanitized local fixture: eight archive comparisons remain; legacy snapshots remain 130 and legacy changes remain 79.
- The eight pairs cover Google privacy and terms, Anthropic privacy, Microsoft Copilot terms, and four Revolut EU/UK privacy/terms documents. The Microsoft archive extraction is scoped to its June 2026 section, not the entire multi-version archive page.

Raw official captures and operational receipts are retained under the ignored local `artifacts/company-scan-2026-10-02/`; a private SQLite backup was created before writes.

## Verified production outcome

Observed on 2 October 2026 at 05:04 UTC. All 18 companies underwent separate discovery and source scans. The catalogue increased from 50 to 113 configured policy records. A final full-catalogue scan checked 113 records / 109 unique acquisition sources: 109 available records, four unavailable records, zero partial records, zero invalid records, zero application errors and zero pending changes. Four shared acquisitions were deduplicated. No new live change event was generated.

- **18/18 companies have public documents**; **109/113 configured documents** have a current public baseline. Privacy scope is **43/45** documents.
- **199 retained legacy snapshots**, of which **191** are exposed through currently available public policies; 193 carry the public-evidence flag, with two additionally hidden by the current source-availability gate. Six remain private. **77 public live change records** remain (79 retained).
- **8 separate official archive comparisons / 16 canonical versions** are public at `/historical-comparisons`. They do not inflate live scan, change or KPI counts.
- **34 policies have a public AI assessment**: 369/1,635 KPI cells are assessed. Privacy-only scope has 236/645 assessed cells. Newly captured baselines deliberately have no fabricated AI assessment or risk score.
- SQLite integrity check passed; foreign-key check returned no violations. All nonempty current/snapshot/canonical-version texts match their SHA-256 hashes. Every available policy has a matching public current snapshot. No duplicate company/type/jurisdiction/URL keys or invalid public-change snapshot references were found.
- Production readiness reports **31/31 tables and 17/17 migrations**, status `ready`. The runtime fallback had materialized the new unique index but left its migration ledger entry missing; exact index columns, uniqueness, absence of the superseded index, migration-file checksum and foreign keys were verified before recording the materialized migration.

| Company | Configured documents | Current public documents |
| --- | ---: | ---: |
| Amazon | 7 | 6 |
| Anthropic | 8 | 8 |
| Apple | 4 | 4 |
| Coca Cola | 5 | 4 |
| Google | 5 | 5 |
| Klarna | 8 | 8 |
| Meta | 4 | 4 |
| Microsoft | 7 | 7 |
| OpenAI | 9 | 9 |
| PayPal | 6 | 6 |
| Plaid | 8 | 8 |
| Revolut | 4 | 4 |
| Stripe | 7 | 7 |
| TikTok | 5 | 4 |
| WAZE | 4 | 4 |
| Wise | 10 | 10 |
| X (Twitter) | 3 | 2 |
| Zoom | 9 | 9 |

The complete reviewed source/status inventory is in [the CSV](company-source-recovery-sources-2026-10-02.csv). Scope remains the selected company catalogue and reviewed legal hubs, not every product, jurisdiction, translation or historic version worldwide. A configured source is not proof of successful acquisition.

## Source corrections and unresolved evidence

Seven existing source configurations were repaired: four Revolut PDF retrievals, the complete Apple privacy PDF, the actual Apple Intelligence privacy notice, and the actual AWS DPA PDF. Four old snapshots and two change analyses associated with the misleading/incomplete Apple and AWS sources were quarantined with review logs; no rows were deleted. Their replacements establish baselines without claiming a publisher change.

The renderer allowlist was extended only for `coca-cola.com` and its observed OneTrust/CookieLaw subresources. The US supplemental and consumer-health notices now render successfully. The Cookie Notice still fails the policy-content gate; its linked notice JSON returned a missing-resource response during the independent check. The following sources remain withheld:

- Amazon retail Privacy Notice: direct and HTTP/2 requests return 403; rendering fails to recover sufficient content. AWS documents are separately available and are not substitutes for this notice.
- Coca-Cola Cookie Notice: source does not yield a complete accepted policy document.
- TikTok Community Guidelines: current acquisition yields insufficient content; archive fallback timed out. Search-engine snippets were not imported as snapshots.
- X Rules: acquired in the company-specific pass, then blocked by a CAPTCHA response during the final scan. The recorded snapshot is retained; latest availability prevents current public publication.

Wayback was degraded during the final pass; no archive fallback was accepted as a current source. The eight retrospective comparisons use independently verified publisher-hosted archives. PayPal's three preliminary differences did not reproduce on the final scan and generated no change events.

Other rejected candidates include the Anthropic training-notice redirect to the same Non-User Privacy Policy, duplicate Klarna US terms, a Plaid fragment containing only the Privacy Statement introduction, and an X developer URL that resolves to a landing page. They were not counted as recovered full documents.

## Dataset QA interpretation

The protected Dataset QA endpoint still reports `fail`, score **87.9/100**, with **5 critical flags**, **104 warnings** and **4 informational items**. All five critical flags concern the four unavailable sources (Coca-Cola Cookie Notice additionally has no verified baseline). The warnings comprise 76 historical KPI-coverage flags, 10 URL-hygiene flags, eight source-fit/locale warnings, five coverage flags and five region-impact flags. They have not been dismissed to improve the score. Zero stale policies and zero hash failures were observed. Its 69.2% historical change-KPI coverage has a different denominator from the current dashboard's 369/1,635 cells; it is not a confidence probability. Structural integrity, source availability and completeness of AI assessment must be presented separately.

## Release and page checks

- Application commit: `e58b0c80df6524b918ffd89556b338c7e1680a16`.
- Immutable artifact: `PolicyWatcher-4.0.0-beta.5-hostinger-2026-10-02-official-document-recovery-r1.zip`.
- SHA-256: `16ff130c997bbfc51d2bbe45a6a241df3796b6b1929209759f68f3a1c4ca395b`.
- Staging deployment: `01a0faec-9597-7010-8641-ae74024f2e5d`; production deployment: `01a0faf4-86e1-70b5-acc9-d8ce2dad9ab7`.
- All 11 staging smoke checks passed after the operator-side expected migration count was updated from 16 to 17. The same unchanged artifact passed promotion and was published. The checker/test correction is a follow-up operational commit and does not change the deployed application.
- Controlled staging checks verified PDF acquisition end to end, two distinct same-category Waze sources, exact-source duplicate rejection (409), and all eight archive imports.
- 159 public routes returned HTTP 200 without an application-error heading: core/Atlas sections, company pages, available document pages and all eight archive selections. The two subsequently recovered Coca-Cola document pages were checked separately. These are HTTP/content checks, not a claim of exhaustive pixel-level testing.
- Live browser inspection confirmed the archive source links, real capture/effective dates and text differences, and privacy-only dashboard scope. Browser screenshot capture repeatedly timed out; no screenshot verification is claimed.
- The final global scan receipt is `scan-final-full.json`; the final database audit is `audit-final.json`. API counts and the privacy scope are reconciled in `public-api-reconciliation.json`.

## Presentation route

1. Open the dashboard and select **Privacy only**: explain 43/45 acquired documents and the independent assessment denominator.
2. Open Waze or Coca-Cola from the company inventory to show documents recovered from previously empty companies.
3. Open **Evidence → Historical document comparisons**, then select a Revolut privacy comparison. Show the publisher URLs, effective dates, actual capture timestamps, hashes, full text and added/removed passages.
4. Explain that historical recovery demonstrates comparison; it does not imply PolicyWatcher monitored that publisher on the older effective date. Missing sources and unassessed KPIs remain explicit.
