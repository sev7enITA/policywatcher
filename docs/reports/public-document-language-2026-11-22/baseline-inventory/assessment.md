# Source route inventory and coherence review - 22 November 2026

Read-only snapshot of root main at `30a5effd20470ddebe32b8ef6d7d04681d300f99`. Source SHA256 values are in summary.json. No browser, GUI, HTTP, database, deployment or runtime mutation was performed. The generator is retained in this output directory and uses the installed TypeScript parser; the shared public-language function is evaluated offline from its actual source.

## Inventory

- **90 templates: 80 pages and10 layouts.** Public57pages+9layouts (the root layout also wraps protected pages); admin21pages+1layout; investor2pages. Admin login and investor-access are entry surfaces, not proof that their child data is public.
- **64 server-component defaults and26 client-component boundaries**, including layouts. A client directive does not mean browser-only rendering. All descendants inherit root layout `await connection()` and `headers()`. Eighteen templates declare force-dynamic; change and embed/change declare revalidation60/120seconds. These declarations are not an observed final build-cache verdict.
- **94 route handlers separately enumerated:88 under /api and6 machine/schema documents outside /api.** The CSV records exported HTTP methods, explicit runtime/cache options and direct auth markers. Missing direct markers never imply absence of authentication: helpers and proxy must be audited independently.

Use templates-all.csv plus audience-specific public/admin/investor CSVs, and api-and-machine-routes.csv. Dynamic templates stand for many possible records; no record population, CRUD path, authorization role matrix or browser interaction was exercised by this inventory.

## Four newly reconciled EN/IT pages

`/atlas`, `/feature-atlas`, `/roadmap`, `/what-changed` all have server wrappers awaiting URL language, localized metadata/alternates, a client child with localized copy, and explicit EN/IT sitemap mappings dated2026-11-22. The shared publicRequestLanguage function returns en/it as requested for all four. Proxy document-language headers and persistent DocumentLanguage use that same function. All four are in PublicHeader; Atlas is itself the route-directory view and has no separate self entry in publicSections, which is not automatically a missing link defect.

This is **source reconciliation**, not eight browser renders or an observed generated sitemap. The four-pages-en-it-sitemap.csv records every comparison.

## Concrete review leads

The shortlist contains three **source-level language mismatches outside those four pages**: `/press`, `/press/cases/[slug]`, `/briefing/comparison/[id]` select Italian content from query.lang, while shared publicRequestLanguage returns English for each corresponding path. Proxy and DocumentLanguage inherit that English result. The case page has local main lang, and comparison is noindex, so impact and remediation differ. These need narrowly scoped regression tests and real supported-record checks; no source fix was made here.

The16-company/480-note phrase in admin explainability describes an optional static editorial corpus, explicitly disabled publicly; it must not be replaced with the current monitoring-company count without counting that corpus. Admin engine qualification copy can distinguish the completed bounded three-date observation from broader unresolved time/completeness/capacity gates. Shared extension release constants still assert Edge publication while the current page now qualifies it historically; exact current Edge availability remains separately unverified. Safari store-unavailable remains accurate for unsigned developer artifacts.

5.2.0 in delivered roadmap/release taxonomy is historical and should remain. Product5.5.0 release date2November is independent from notebook updates and iOS wrapper0.1.0(1), so replacing every date/version would corrupt provenance. The885 literal references in consistency-references.csv are search leads across app source and selected shared release/feature/press data, **not885 defects**. Each has source line/hash and a context hint; historical/current determination requires reading the surrounding record.

Six static public templates lack a direct static sitemap entry. The associations alias redirects, subscription-management pages are noindex, and Office taskpane is noindex. Discovery/indexing intent for historical-comparisons and observatory/agentic-incidents deserves explicit review, without adding token/private/embed surfaces indiscriminately.

## Limits

Source inventory does not establish live source completeness, semantic accuracy, successful500-policy/day pipeline capacity, availability of AppStore/TestFlight, VPS health, browser compatibility, accessibility or all administrative CRUD operations. Existing runtime/model/deployment evidence must be referenced separately. API helpers, route proxy, imported rendering components and dynamic records require their own targeted checks; no blanket QA pass is asserted.
