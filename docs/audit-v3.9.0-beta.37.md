# PolicyWatcher 3.9.0 Beta 37 audit

Date: 2 August 2026

## Delivered resource navigation

- Replaced the single long Resources column with four intent-based groups: Explore, Product, Build and Media.
- Preserved all 17 original resource destinations, the external PALO boundary and the full and compact footer variants.
- Kept Privacy, Terms, Security and email directly visible in a separate utility row.
- Added English and Italian labels, a balanced desktop grid, a two-column tablet layout and native mobile disclosures.
- Retained visible keyboard focus, reduced-motion support and minimum mobile interaction targets.

## Delivered retrieval diagnostics

- Added a bounded SHA-256 acquisition fingerprint to protected scan progress and detail records.
- Added explicit `network` and `deduplicated` acquisition modes and visible `[cached/deduplicated]` progress wording.
- Removed recognized campaign query parameters while preserving semantic selectors, fragments and region-specific paths.
- Added log-safe URL labels that omit credentials, query values and fragments.
- Confirmed that the configured Revolut EU and UK records use different official regional paths and must remain separate acquisitions.

## Delivered renderer 1.2 coherence

- Removed the stale hard-coded Chrome 126/macOS User-Agent default.
- Uses the User-Agent native to the Chromium version bundled by Playwright unless an operator intentionally configures an override.
- Rejects multiline, control-character or oversized overrides.
- Adds authenticated readiness fields for the Chromium major version and User-Agent mode.
- Provides a separate traceable VPS release-package workflow.

## Verification

- Focused footer tests preserve the complete destination model, bilingual groups, native mobile disclosures and compact behavior.
- Independent desktop and mobile visual evaluation passed; the only non-blocking small-text refinement was incorporated.
- Focused acquisition tests cover tracking-parameter removal, semantic URL separation and operational-log redaction.
- Renderer Node tests cover browser-default behavior, bounded overrides and the existing egress, authentication and log-redaction controls.
- TypeScript, lint, 121 application test files with 657 tests, six renderer tests and the production build with 155 generated routes passed.
- The press-kit generator produced 60 integrity-listed assets and two localized packages aligned to the Beta 37 current-product release.

## Residual boundary

The footer grouping has not yet been validated by measured public navigation research. Acquisition fingerprints explain reuse but do not prove source identity, availability or exhaustive resource savings. Renderer 1.2 does not install stealth plugins, bypass CAPTCHA or evade Cloudflare, AWS WAF or other source controls. Official APIs, permitted feed endpoints, explicit subresource allowlists and archive fallbacks remain the supported recovery paths.
