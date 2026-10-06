# Hostinger publication - 2 October 2026

PolicyWatcher **4.0.0-beta.5** is deployed to staging and production. The release implements the shared document-type filter, evidence/KPI denominator consistency and the corresponding methodology, Atlas, release history and changelog updates.

## Release identity

- Application source: `b8bf2e2ee0baa45db604ed62183da01c98f867ff`.
- Pull request: https://github.com/sev7enITA/policywatcher/pull/18 (publication does not imply merge).
- Artifact: `PolicyWatcher-4.0.0-beta.5-hostinger-2026-10-01-document-scope-coherence-r2.zip`.
- SHA-256: `a85898495765da05f3453939e26ace80f5ff7f7c16ae444d4821f294dd8c1e12`.
- Staging deployment: `01a0fa97-3cb0-7074-8db2-237bb8b5a673`.
- Production deployment: `01a0fa9d-9efa-72b3-84af-f8bf3bb39002`.
- Eleven staging release checks passed at `2026-10-02T03:12:21.005Z`; the exact same ZIP was promoted using the existing user authorization to publish the site.
- Hostinger build and restart completed; the public manifest reports Beta 5. Source and dependencies were not changed after staging.

## Verification

The earlier local evidence remains in `../release-coherence-2026-10-01/`: 1,117 tests passed, 1 skipped, production build passed, runtime dependency audit with no known vulnerabilities at that check, lint with no errors and 15 documented warnings. The source commit passed the six GitHub checks.

On the deployed release:

- 72 staging route templates and 427 production URLs returned the expected HTTP responses without detected application-error pages; see `pages-and-sections.md` for individual production routes and headings.
- All 18 protected administrative pages responded successfully with a signed administrator session; database readiness is `ready`.
- SQLite integrity is `ok`, foreign-key violations are zero; 18 companies, 50 policies, 130 snapshots, 79 change records and both existing subscribers are preserved.
- Staging uses a fresh, separately sanitized database with zero subscribers. Production database and environment backups were retained privately before promotion.
- Six scope cases passed on each environment: privacy, privacy+terms, DPA, community, unfiltered all-document mode and rejected unknown types. `all` is a report label: all-document API mode omits the parameter; it is not the literal `documents=all`.
- Browser production checks confirmed privacy-only 26/28 baselines and 225/390 assessed KPIs; privacy+terms 41/45 and 350/615. URL state follows the selection.
- The matrix preserves document scope and displays incomplete type coverage. Stripe/PayPal aggregate comparison was withheld for unequal coverage; selecting terms yields two assessed documents each and enables the bounded KPI comparison.
- Desktop/public-page and 390×844 mobile checks found no horizontal overflow on sampled key pages and the scoped production dashboard. Existing production terms acceptance was preserved. Staging terms were displayed but not accepted on the user's behalf.

## Remaining boundaries

- Source quality is not declared complete: 45/50 policies have public baselines, 35 have public analyses and 375/675 current KPI values are assessed (55.6%). Five unavailable sources remain excluded. Dataset QA reports 5 critical source issues, 93 warnings and 1 informational issue; historical KPI coverage is separately labelled 69.2%. No unknown values were invented or converted to healthy results.
- The protected production verification reports 8 passed checks, 1 attention and 1 external check. The attention concerns the observed hosting response CSP (`upgrade-insecure-requests`), which replaces the application's fuller CSP. This was also observed on the previous production release; HSTS, DENY framing and nosniff remain present. Hostinger header handling still needs remediation; no independent penetration-test result is asserted.
- SMTP host, port and username are configured from Hostinger's mailbox settings (`smtp.hostinger.com`, 465, `alert@policywatcher.online`). TLS 1.3/EHLO succeeds from the server. `SMTP_PASS` remains absent, so authentication and delivery are **not verified**. No messages were sent.
- The browser export action was exercised, but download capture timed out. CSV construction is covered by the existing local tests; the downloaded production file was not inspected.
- VPS/webhook outbound operations, live AI calls and the native Word host were not triggered by this release check.

Raw authenticated reports, screenshots, promotion records and private backup references are retained in the local ignored `artifacts/hostinger-publication-2026-10-02/` directory and adjacent Hostinger release artifacts; credentials and operational private data are not committed.
