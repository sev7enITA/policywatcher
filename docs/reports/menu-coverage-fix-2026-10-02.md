# Global menu and catalogue audit - 2 October 2026

Read-only production inventory inspection. No policies, snapshots or analyses were deleted or inserted by this fix. Counts describe the configured catalogue, not all documents published by the companies. Public means a policy has at least one snapshot flagged as public evidence; analysis means at least one public change record.

| Company | Configured | Public sources | With public analysis |
|---|---:|---:|---:|
| Amazon | 2 | 2 | 1 |
| Anthropic | 2 | 2 | 0 |
| Apple | 2 | 2 | 1 |
| Coca Cola | 0 | 0 | 0 |
| Google | 4 | 4 | 4 |
| Klarna | 4 | 4 | 3 |
| Meta | 3 | 3 | 3 |
| Microsoft | 4 | 4 | 4 |
| OpenAI | 2 | 2 | 2 |
| PayPal | 4 | 4 | 4 |
| Plaid | 4 | 4 | 4 |
| Revolut | 4 | 4 | 1 |
| Stripe | 5 | 5 | 2 |
| TikTok | 2 | 1 | 1 |
| WAZE | 0 | 0 | 0 |
| Wise | 4 | 4 | 3 |
| X (Twitter) | 2 | 2 | 2 |
| Zoom | 2 | 2 | 1 |

## Findings

- Coca Cola and WAZE are company registry entries with no configured documents.
- Revolut has four configured documents with unavailable sources and no public baseline. TikTok has one further unavailable document. These five sources remain excluded by the public evidence gate.
- Anthropic has terms and acceptable-use documents, but no configured privacy policy. A privacy-only filter therefore correctly leaves it with no documents in scope.
- Amazon, Apple and Stripe have public privacy baselines without public change analyses. Baselines are inspectable evidence, not assessed KPI records.
- No unconfigured document was inferred to be legally absent; the catalogue is incomplete.

## Fix and validation

- Global settings use native showModal top-layer rendering. The transformed floating toolbar no longer defines the modal containing block.
- Card copy distinguishes excluded documents, missing types and unassessed sources; a link exposes the full public company inventory. All-document cards count assessed types against available types, while selected subsets retain the requested denominator. Aggregate calculations are unchanged.
- Full suite: 1,117 passed, one skipped. Existing scope/context tests: 18 passed. Production build and TypeScript passed. Targeted ESLint: no errors, one existing internal navigation warning.
- Browser fixture inside a transformed fixed toolbar: modal bounds are x355/y20/570×520 at 1280×560 and x0/y60/390×540 at 390×600; footer remains in the viewport. Tab wraps to Close; Escape closes and restores focus to the trigger. The temporary fixture was removed before packaging.

## Publication verification

- Application commit: `58e641532afcc9959956f2c71ff17433222b579e`; documentation punctuation correction: `179e54f`. All six GitHub checks passed for the corrected source tree. The documentation-only follow-up did not change the release archive.
- Artifact: `PolicyWatcher-4.0.0-beta.5-hostinger-2026-10-02-global-context-coverage-r1.zip`.
- SHA-256: `cb5b0f7eb607440653eb0959be997629ac05c12c634bebde57cb79f179afeef8`.
- Staging deployment: `01a0fabc-e0ba-73d5-ad43-f56e7fa5c80e`; 11/11 release checks passed at `2026-10-02T03:54:34.299Z`.
- Production deployment: `01a0fac0-b170-7123-a2b4-da95593d872d`; the exact same artifact was promoted through the release gate and Hostinger completed the build, publication and restart.
- Six document-scope cases passed on each environment. 72 staging routes, 427 production URLs and 18 authenticated administrative pages returned the expected responses without detected application-error pages.
- Production browser check: the Global dialog is in the native top layer, from y188 to y825 within a 1013-pixel viewport; previously it extended from y642 to y1278. Keyboard closing works. Staging at 390x600 places the panel between y60 and y600 with the footer between y523 and y600.
- Production Anthropic privacy card shows 0/2 public documents in scope, both excluded by the filter, no public privacy document, and a link to its complete public inventory. Amazon shows 1/2 under privacy, with a published source and no public analysis; All restores both documents and reports 1/2 available types assessed.
- Database integrity remains ok with zero foreign-key violations: 18 companies, 50 policies, 130 snapshots, 79 changes and two subscribers. A private SQLite backup was created before promotion.
- A first staging check hit a transient HTTP 503 during restart; its failed receipt was retained and all checks were rerun successfully after startup. The desktop staging screenshot confirms the rendered menu. Production DOM checks passed, but screenshot capture timed out; viewport-override screenshots were scaled incorrectly, so mobile validation relies on measured DOM bounds and keyboard interaction rather than the saved image.
- Existing boundaries remain: five unavailable sources; current public KPI coverage 375/675 (55.6%), distinct from historical QA coverage 69.2%; the previously observed Hostinger CSP attention item remains. No source inventory expansion, live AI scan or outbound email was performed by this hotfix.

Raw private reports and images: local ignored `artifacts/menu-coverage-fix-2026-10-02/`. Release and promotion receipts remain beside the immutable archive.
