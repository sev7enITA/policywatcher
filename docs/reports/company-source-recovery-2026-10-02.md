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

Production publication and final company-by-company results will be appended after verification. Raw official captures and operational receipts are retained under the ignored local `artifacts/company-scan-2026-10-02/`; a private SQLite backup was created before writes.
