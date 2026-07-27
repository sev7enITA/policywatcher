# PolicyWatcher 3.9.0 Beta 6 release audit

- Release: `3.9.0-beta.6`
- Date: 27 July 2026
- Scope: Evidence Newsroom and reusable press data

## Implemented surfaces

- `/press-kit`: task-oriented access to localized packages, dated claims, releases, data and contact routes.
- `/press-kit/releases`: versioned release archive.
- `/press-kit/releases/[slug]`: release records with `NewsArticle` structured data.
- `/press-kit/data`: reusable PNG, SVG, CSV and JSON configured-scope snapshot.
- `/press-kit/reference`, `/press-kit/corrections`, `/press-kit/glossary`: provenance, clarification/correction and terminology registers.
- `/press-kit/feed.xml` and `/press-kit/feed.json`: RSS and JSON Feed distribution.
- `/press-kit/press-kit.json`: expanded machine-readable newsroom payload.
- `/schemas/[schema]/v1`: public JSON Schema documents for the published press contracts.

## Editorial package

The release generator produces English and Italian ZIP packages. Each contains
a localized PDF and plain-text fact sheet, owned media, data snapshot files,
asset and metadata manifests, editorial usage terms and a README. Package and
file integrity are recorded using SHA-256.

## Data and claim boundaries

- The monitored inventory count is 16 companies across six sectors and excludes the WAZE admin-onboarding fixture.
- `Not assessed` has no numerical value and is not converted to zero.
- Dated snapshot files do not remain current after later source or release changes.
- Checksums establish file integrity only.
- IPTC/XMP fields record supplied editorial metadata but do not prove semantic truth.
- Content Credentials are not attached.
- No native vector logo master is supplied; the downloadable wordmarks are raster files.
- The public registry begins on 27 July 2026 and does not assert exhaustive earlier correction history.

## Verification evidence

- Two consecutive press-package generations produced identical hashes for every file in `public/press-kit`.
- The asset and package manifests reconcile with file sizes and SHA-256 values; supplied PNG/JPEG files contain the expected XMP accessibility and rights fields.
- The full Vitest suite passed: 349 tests across 58 files.
- TypeScript validation completed without errors.
- ESLint completed without application errors; it reported one warning in an unrelated untracked temporary script.
- The Next.js production build completed and generated 82 routes, including the newsroom feeds and five JSON Schema paths.
- Independent UI evaluation returned `PASS`; desktop and 390-pixel mobile route checks reported no horizontal overflow.
- The Hostinger artifact must be generated after the matching source commit so its release manifest records the committed revision.
