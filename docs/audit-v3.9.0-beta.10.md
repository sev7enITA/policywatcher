# PolicyWatcher 3.9.0 Beta 10 release audit

- Release: `3.9.0-beta.10`
- Date: 28 July 2026
- Scope: Source Continuity Ledger
- Browser extension: unchanged at `3.8.3-beta.3`

## Delivered behavior

- The public Timeline separates evidence-gated provider policy changes from PolicyWatcher source-retrieval and publication-state transitions.
- A dedicated `/api/source-continuity` endpoint derives a bounded public ledger from recorded `PolicyCheckLog` rows.
- Consecutive checks with the same standardized state are collapsed. A recovery is labelled only when an available or reviewed check follows a withheld state and public snapshot evidence already exists.
- The response exposes standardized state, cause, retrieval channel, timestamp, configured source host and current-transition status.
- The response excludes policy and snapshot text, hashes, diffs, AI analysis, risk and KPI values, raw failure reasons, final URLs, archive metadata and administrative records.
- The Timeline provides keyboard-operable record tabs, search, state filtering, current-transition markers, coverage limits and controlled loading, empty and error states.

## Evidence and interpretation boundary

Source-continuity events describe PolicyWatcher retrieval and publication state. They are not findings about a provider policy, service quality, legality or compliance. Verified and recovered refer only to recorded source retrieval; private policy text remains withheld unless it is separately eligible for a public-evidence route. The public response is capped at 100 policies and the 25 most recent checks per policy and reports when additional records may exist outside the response.

## Verification gates

- Automated suite: 368 tests passed across 62 files.
- TypeScript validation: passed.
- ESLint validation: no application errors; one warning remains in an unrelated untracked temporary deck script.
- Production Next.js 16.2.11 build: passed across 88 generated routes, including `/api/source-continuity`.
- Press package regeneration: 18 assets and two localized packages generated for Beta 10.
- Deployable dependency audit: no advisory reported by `npm audit --omit=dev` at the time of execution. This is a point-in-time tool result, not a security certification.
- Independent UI evaluation: the first pass identified an uncontrolled retry loop after a failed continuity request. The implementation was corrected with an explicit request-state machine and in-flight guard. The second pass succeeded at desktop, tablet and 375 px mobile widths with one activation request, one request per explicit retry, no automatic retries, no horizontal overflow and no console errors.
- Hostinger archive integrity and checksum validation: performed after the release commit.
