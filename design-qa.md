# Design QA

Date: 7 August 2026

## Scope

- Beta 41 Focus, Balanced and Explore experience controls.
- Deterministic next-action hierarchy, interface explanation and reduced-motion override.
- ER sitemap infographic placement on the public Infographics page.
- Dashboard workflow hierarchy: Today, Continue, Explore.
- Aggregated Source QA priority and progressive source/catalog disclosures.
- Global PolicyWatcher Civico directory by country, macro-region and association type.
- Platform-wide country, region and language context shared with the dashboard.
- Compact crawlable-knowledge disclosure and responsive behavior.

## Visual sources

- `artifacts/qa/ui-ux-beta41-audit-2026-08-07/00-before-contact-sheet.png`
- `artifacts/qa/ui-ux-beta41-audit-2026-08-07/01-dashboard-before-desktop.png`
- `artifacts/qa/ui-ux-beta41-audit-2026-08-07/03-dashboard-before-mobile.png`
- `artifacts/qa/dashboard-workflow-audit-2026-08-06/03-dashboard-top.png`
- `artifacts/qa/dashboard-workflow-audit-2026-08-06/05-civic-current.png`
- Figma audit board: `https://www.figma.com/design/tSIKeByrdJ8MM57m1UlJNF`

## Implementation captures

- `artifacts/qa/dashboard-workflow-implementation-2026-08-06/dashboard-workflow-focused-desktop.png`
- `artifacts/qa/dashboard-workflow-implementation-2026-08-06/dashboard-workflow-mobile.png`
- `artifacts/qa/dashboard-workflow-implementation-2026-08-06/civic-global-hero-desktop.png`
- `artifacts/qa/dashboard-workflow-implementation-2026-08-06/civic-global-context-desktop.png`
- `artifacts/qa/dashboard-workflow-implementation-2026-08-06/civic-global-context-mobile.png`
- `artifacts/qa/civic-global-directory-desktop-2026-08-07.png`
- `artifacts/qa/civic-global-directory-mobile-2026-08-07.png`
- `artifacts/qa/global-context-mobile-2026-08-07.png`
- `artifacts/qa/civic-reference-vs-global-directory-mobile-2026-08-07.png`

## Comparison findings

- The implementation preserves the existing typography, paper/grid surfaces, teal/indigo/rust palette, line weights and compact console controls.
- The former 50-source ledger no longer dominates the first operational viewport; a single QA item carries the decision signal and the detailed ledger remains available on demand.
- Today is visibly limited to the highest-value actions, while Continue and Explore form distinct, scan-friendly lanes.
- The crawlable knowledge block remains server-rendered but is compact by default, preventing it from consuming the first mobile screen.
- The Civico hero retains the source composition and information density while making the global scope explicit.
- The new directory introduces a clear hierarchy between national organizations and the European or global networks that also apply to the selected country.
- Territory, association-type and search controls align in three desktop columns and stack without horizontal overflow on the 390-pixel viewport.
- The compact global-context trigger remains legible in the public header and dashboard navigation; its modal fits the 390-pixel viewport without horizontal clipping.
- The implementation/reference comparison confirms continuity of typography, border rhythm, teal accents and information density while introducing the directory as a distinct module.
- Focusable controls retain visible focus treatment and minimum 44-pixel interactive height.
- No P0, P1 or P2 visual defects remain in the compared desktop and mobile states.

## Functional checks

- Country, macro-region, association type and text search update the directory results and live summary.
- France plus digital-rights filtering returns the expected national entries followed by applicable European and global networks.
- The global France/Italian context propagates to the dashboard (`FR · France`, Italian interface, EU dashboard region) and the civic radar.
- The suggestion form rejects incomplete or non-HTTPS submissions and only prepares a user-controlled email; no external message is sent automatically.
- Navigation, Today actions, Continue anchors and Explore destinations expose real routes.
- Source detail and full catalog remain keyboard-operable native disclosures.
- Empty public-evidence states remain explicit and no national coverage is inferred.
- Browser console inspection returned no errors or warnings in the verified Civic and dashboard states.

## Beta 41 verification status

- Static verification passed: lint, 705 focused/full tests, TypeScript production compilation and 159-page Next.js generation.
- Preference codec tests passed for valid, invalid and default state plus Focus, Balanced and Explore presentation mappings.
- The sitemap generator validated 33 literal static routes, seven domains and four dynamic route families.
- The presentation script validated all timed cues and required ER sitemap assets.
- A fresh browser-rendered desktop/mobile comparison could not be completed after the local in-app tabs became unavailable and the browser connection rejected reloading the local address. No alternate browser was used.
- Because the Product Design QA contract requires an implementation screenshot compared side by side with the reference, Beta 41 visual sign-off remains blocked even though build and automated checks pass.

## Final result

blocked
