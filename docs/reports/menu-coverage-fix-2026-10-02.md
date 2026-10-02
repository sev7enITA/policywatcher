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
- Existing scope/context tests: 18 passed. Production build and TypeScript passed. Targeted ESLint: no errors, one existing internal navigation warning.
- Browser fixture inside a transformed fixed toolbar: modal bounds are x355/y20/570×520 at 1280×560 and x0/y60/390×540 at 390×600; footer remains in the viewport. Tab wraps to Close; Escape closes and restores focus to the trigger. The temporary fixture was removed before packaging.
- Deployment verification is recorded separately after staging and promotion.
