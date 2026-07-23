# Stability Audit - Release 3.6.5

**Date:** 2026-07-21
**Base:** `v3.6.4` / merge `0aea020e7a0182c55dad9a2650ddc976ab2995e1`

## Scope

Release 3.6.5 converts the post-release review findings into guarded invariants instead of isolated condition changes. It covers source-onboarding lifecycle state, mobile orientation cleanup, narrow-viewport containment, and release metadata consistency.

## Closed findings

- Active onboarding stages are exported once and include `Held`; configured-policy and approved-candidate checks remain independent duplicate guards.
- Batch status is summarized once for both import and workflow refresh. Empty batches are `Active`, all-failed batches are `Failed`, mixed failures are `Partial`, and non-failed terminal batches are `Completed`.
- Orientation events schedule one deferred viewport evaluation, replace pending evaluations, and cancel outstanding work during unmount.
- Ticker and market-pulse containers isolate animated-track overflow locally while preserving the dashboard's intentional nested horizontal scrollers, sticky positioning, and root scrolling behavior.
- Package and current UI/export release labels consume `src/lib/release.ts` instead of repeating version strings.

## Regression evidence

- Held-stage query membership is asserted at the Prisma request boundary.
- Empty, all-failed, partial, held, and completed batch summaries are covered.
- Deferred orientation evaluation is tested for coalescing and cleanup cancellation.
- Current release surfaces are checked against the package version.
- Mobile verification at 390 px confirms `scrollWidth === clientWidth === 390` and rejects attempted document-level horizontal scrolling.

## Release boundary

No schema or evidence migration is required. Production data is not modified by the release package itself; existing Hostinger migration deployment remains idempotent.
