# Engine 6.0 Preview online deployment, 1 November 2026

The separate [private Preview](https://staging.policywatcher.online/admin/engine) is online as **6.0.0-preview.1**. Hostinger reported **Completed / Current** for deployment `01a1992e-99e7-712f-bbfc-3bf04cb30890`. The main public website remains **5.2.0**. Preview requires administrator authentication and keeps observations private, with publication and subscriber notifications disabled.

## Executed on the actual hosting

**47 of 47 checks passed** between 22:19:52 and 22:20:52 UTC. The checks covered anonymous page/API/RSC/prefetch restrictions, authenticated access, the live worker identity, dedicated database health, actual remote configuration and archive declaration, and rejection of stable scans, scheduler calls and unrelated mutations.

One Apple comparison selected four policies. Privacy Policy returned HTTP 200 through direct retrieval and was eligible under its bounded source contract. The two extractors used the same response: Preview produced 28,124 characters and Stable 2,089. Outcome: `confirmation_pending`. The other three policies remained held with `source_contract_missing`, with no fabricated captures. No AI analysis, official baseline update, public change or notification was performed. Full-row digests of policy, baseline, history, source-contract, subscriber and outbox state remained unchanged.

The run lasted 50.638 seconds including observed worker leadership handover. This is not a network-fetch latency figure. No service restart was imposed by the verifier. A successful handover in one run does not establish continuous availability on managed hosting.

The real browser verified administrator sign-in, the active worker, the hydrated Preview/Compare selector, Apple scope selection and the completed saved run. The saved comparison report rendered correctly in the browser, including one different result and three unavailable comparisons. Browser JSON export is not yet verified: the download attempt timed out while the Mac was locked. The authenticated report API was verified separately.

## Identity and retained failures

- Source: `34c188c0d54ec24d61469ca1683dec8988252c6f`; integrated into main through [PR #37](https://github.com/sev7enITA/policywatcher/pull/37).
- Archive SHA-256: `c887cd49959f38ab4137c235349c1f2e5785fed97848a4a42daf4410ef24bf26`.
- Implementation: `d9d5dde4f1c8d22c03c80ae200bc3e44734ef6a430c7e7bd037719ee30614e88`.
- The first deployment failed before migrations when Hostinger wrapped Next configuration. Its log remains retained. The narrow compatibility correction is documented in the [build report](engine-v6-hosted-build-remediation-2026-11-01.md).
- The first remote verifier encountered a 30-second timeout on an anonymous GET before any scan. A follow-up returned the expected private 307 response in 576 ms. The failed attempt was kept; the subsequent 47-check run required no retry. The verifier permits one logged retry only for timed-out reads, never for login or enqueue.

Local evidence remains distinct: 1,565 automated tests passed with 14 skipped; candidate 2 had 44 local HTTP/worker checks; candidate 3 had 22 checks against the generated standalone server. GLM and Gemini reviews are opinions retained in the earlier reports, not the source of the hosted verification result.

## Remaining qualification

Only one of 113 configured policies has a bounded source contract in this Preview. Complete source coverage, the 48-hour multi-day interval, continuous managed-worker availability and 500 distinct live daily sources remain unqualified. The 12-source frozen daily cohort still has two counted dates and 20.771248 actual hours. The Preview shares the hosting account and has logical database separation, not independent infrastructure isolation.

A later content-only public diary promotion may temporarily use staging. It must restore this exact Preview artifact/configuration and verify the saved run afterwards; its database and earlier evidence must remain intact. Never promote this Preview artifact to the main public domain.

The [machine-readable receipt](engine-v6-hosted-deployment-2026-11-01.json) records artifact hashes and the verification scope.
