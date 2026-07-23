# PolicyWatcher 3.8.3 Beta 4: Regional Retrieval Hardening

Date: 2026-07-23

## Scope

Beta 4 changes only the web retrieval path. It improves local extraction from
pasted notification text and discovery of regional policy sources. The browser
extension remains at 3.8.3 Beta 3 with the same permissions, privacy boundary
and store package. No inquiry automatically creates a company or starts source
discovery; human approval remains mandatory.

## Retrieval changes

- Brand sender domains can be inferred from visible email addresses after
  common personal-email providers are excluded. A valid From header remains
  authoritative.
- European numeric and ISO effective dates are accepted only when they form a
  valid calendar date.
- Policy jurisdictions can be inferred from ccTLDs, locale path segments,
  locale query parameters and hreflang metadata.
- Locale regions are authoritative, preventing French Canadian, Brazilian
  Portuguese and Mexican Spanish variants from being classified as EU.
- Explicit uppercase EU, UK and US labels are accepted without treating the
  lowercase English pronoun in "contact us" as United States evidence.
- Locale-aware probes and review caps remain bounded and all candidates still
  pass content verification before entering the human review queue.
- The Hostinger startup bridge uses the Next.js 16 options API and validates the
  assigned port before applying migrations and accepting traffic.

## Known limits

- A pasted message cannot recover hidden hyperlink destinations that are absent
  from visible text.
- Renderer-specific SPA coverage requires valid renderer credentials and was
  not exercised by the unit suite.
- Jurisdiction remains intentionally grouped into EU, UK, US and Global; no
  country-level database model was added.

## Release gates

The candidate must pass the complete Vitest suite, TypeScript, ESLint,
high-severity dependency audit, production build, clean Hostinger packaging,
archive-content checks and an extracted-package build before deployment.
The extracted package must additionally complete database initialization and
serve the application on the exact `PORT` supplied by the hosting environment.
