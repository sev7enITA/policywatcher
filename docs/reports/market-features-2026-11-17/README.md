# Policy Briefing implementation and release boundary

17 November 2026. **Local candidate implemented and tested; not deployed or published.** Requested Gemini 4 High through Antigravity and GLM 5.3 reviews remain incomplete. There is no Engine 6 activation or full 500-policy/day claim.

## Market and resulting behavior

The [market scan](market-and-scope.md) maps official vendor/consumer signals to a limited feature tranche, distinguishes existing citizen/collection functions and identifies future work. Demand and measurable customer benefit remain hypotheses.

The new bilingual `/briefing` route filters the existing public citizen feed locally, exposes exact topic-match reasons, binds local review roles/statuses/dates to exact public changes, reopens superseded reviews and exports dated evidence briefings or user calendar reminders. Export controls are reachable from short in-page links even with long record lists. It is available from the public navigation and homepage in this source candidate.

Selections and reviews remain in memory until explicit device save. Invalid stored data is preserved for download; the page will not overwrite it silently. Local role/status/date fields are omitted from default briefing exports. Calendar export requires explicit inclusion and an open review with a chosen date; it adds no invitations or alarms. There is no team synchronization, automatic notification, legal applicability inference or runtime model API.

## Executed verification

- Full suite: **1,656 passed, 14 skipped**, 205 passed test files and 3 skipped files. TypeScript, scoped ESLint and diff checks pass. The [machine-readable receipt](verification.json) distinguishes browser successes from unavailable checks.
- Actual local Next.js frontend and citizen-feed API exercised against an isolated, clearly labelled synthetic database: two companies, 28 changes. Browser checks covered private export omission, native calendar date selection and actual `.ics` download, topic no-match wording, 28/28 unique records after pagination, saved role/status persistence, and retained 28 records with unavailable source/review state after a controlled local API failure. The temporary table rename used to cause that failure was restored immediately.
- Live public feed read independently without authentication or mutation: 18 companies and 25 changes in its first page. A local proxy experiment did not hydrate the frontend and is retained as a failed harness attempt, not evidence of live-data UI success.
- Default desktop screenshots have no horizontal overflow at 1,280 pixels. EN/IT navigation was checked in the browser. The attempted mobile viewport override timed out and stayed at 1,280 pixels; no mobile/tablet visual pass is claimed. The evaluator's browser was also unavailable; its PASS is limited to inspected desktop screenshots and source.
- LM Studio produced actual Qwen3.8-27B design, bounded source and CSS-text reviews. The first larger source review timed out. Findings were adjudicated, not adopted wholesale. Finite timestamp guards, edit-clock synchronization, state-safe rapid field merging and clear download access were added. Models did not execute the tests.

## Runtime compatibility repair and retained failures

The first local Turbopack attempt could not resolve dependencies through the existing out-of-root `node_modules` symlink. Webpack exposed a preexisting combined runtime guard that pulled Node-only worker dependencies into Edge compilation. `src/instrumentation.ts` now uses the literal Node runtime branch recommended by the installed Next.js guide, preserving the hosted-preview/build/stable flags. Its instrumentation regression passes, and `/briefing` compiles and serves locally.

The initial full suite retained 12 failures: a stale implementation manifest after that guard change, consequent experimental-channel rejections, and punctuation that Next dev regenerated in AGENTS.md. The manifest was regenerated without weakening its check. Only the tool-generated AGENTS punctuation change was reverted to the pre-session version. The subsequent full suite passed with the totals above. A browser check also caught an omitted language-route registration; `/briefing?lang=it` now renders an Italian document as well as Italian controls, with two language-contract regressions added. The new source implementation hash is recorded; it does not inherit deployed r3 identity or qualification.

`npm audit --omit=dev` reports one existing moderate Next.js advisory, [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h), against installed 16.4.3, with 16.4.6 offered as a fix. Exploitability in this application has not been demonstrated. Shared dependencies were not upgraded during this feature tranche. This remains a release consideration.

## Requested model review state and post

The [model receipt](model-review-receipt.json) records actual results and dispositions. Antigravity desktop control was unavailable. GLM 5.3 was selected and the request submitted, but a human security verification blocked a usable verdict. No alternative is represented as either requested review. Human handoff requests remain pending.

The [English LinkedIn draft](linkedin-en.txt) describes a development build and its limits. It is not published and does not invite users to try an undeployed production route. Existing changelog/newsroom synchronization fixes from the preceding request are preserved in the same branch.

## Still required before a public release announcement

Complete the requested Gemini 4 High through Antigravity and GLM 5.3 reviews, finish mobile/tablet visual and device interaction checks, resolve the dependency advisory as appropriate, build the exact delivery artifact, apply existing staging/promotion gates and verify deployment. Shared multi-user review, tenant access control and actual vendor/plan applicability require separate work.
