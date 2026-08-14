# PolicyWatcher 3.9.0 Beta 41 - release audit

Date: 7 August 2026
Release: `3.9.0-beta.41` - Adaptive Experience

## Shipped scope

- Browser-local `Focus`, `Balanced` and `Explore` dashboard presentation presets.
- Visible `System / Reduced` motion preference using both Framer Motion and CSS reduction paths.
- Deterministic, workspace-specific next-action card and inspectable `Why this interface?` disclosure.
- Keyboard skip link, fixed-navigation scroll clearance, visible focus and 44 px control targets.
- Primary workflow placed before the browser-extension promotion.
- Source-generated ER sitemap in Mermaid, JSON and Markdown, with a presentation infographic in PNG and optimized WebP.
- Dated UX research note and a timed release-presentation script.

## Evidence and boundaries

- Experience preferences are stored only in the current browser under a versioned key.
- Invalid stored state is rejected and defaults to `Balanced / System`.
- Presets change hierarchy and visibility only; they do not modify public data, risk scores, source quality or publication eligibility.
- Recommended actions are fixed mappings by declared workspace, not generated or ranked by AI.
- The infographic is an editorial explanation. `docs/sitemap-er-2026-08-07.mmd` and `.json` are the exact generated architecture records.
- Accessibility changes are implementation evidence, not a formal WCAG conformance claim.

## Verification gates

- `npm run assets:sitemap-er`
- `npm run present:ux`
- `npm run lint`
- `npm test`
- `npm run build`
- Browser-rendered desktop and mobile QA with the baseline and implementation compared side by side.
- Hostinger archive inventory, extraction, manifest consistency and SHA-256 verification.

## Deployment notes

No database migration is required. The release is deployable with the existing Node/Next.js process. Static assets are shipped under `public/infographics`; browser-local preferences require no server-side state or analytics endpoint.
