# Independent evidence/operator re-review

## Core correction checkpoint

Reviewed diff `946fc9d526dc60cc6ca2af8422db09d361180155..0b0c515350d9b60f81baf2e926e92c874e563ad5` read-only. The preserved original publication reproduction now behaves correctly: valid base remains eligible/publishable, while a changed effective base gives link mismatch, ineligible observation and false publication gate. Output: `base-publication-postfix-0b0c515.jsonl`.

Active document-wide bases and anchors now exclude detached/inert template contents. Ambiguous/unsafe bases hold without fetching attachments. Relative and fragment hrefs use the effective base; initial requested fragment scope is selected in the loaded document. Actual response final URL is retained as document location for relative resolution.

The per-acquire decoded reservation is shared across parent fallbacks, reserved before requests, refunded for successful smaller bodies and retained on failures where consumption is unknown. The transport receives the remaining allowance. This is a decoded output reservation, not an encoded wire-transfer cap. Rebaseline now uses central publication coverage eligibility before state changes, and the UI follows that readiness.

## Independent execution

47 tests passed under OS-denied TCP/IP in an output-only copy of the source test file with three additional probes:

1. Four 400 KB successful reads use allowances `[1000000,1000000,1000000,800000]` and all four attachments match, demonstrating actual refunds.
2. Two failed reads reserve 2 MB; no other children are requested, including during parent fallbacks. The bounded child integrity proof/status is retained.
3. A response final URL with a trailing slash changes a relative href resolution; inconsistent expected destination holds and no child fetch occurs.

Source: `postfix-extra.test.ts`; log: `postfix-extra-0b0c515.log`. No application files or Git state were edited. The parent-reported full suite and mutations were not repeated as part of this re-review.

## UI/API closure checkpoint

At `0b0c515` a P2 remained: terminal evidence loaded from checkpoint observation was visible, but the header still read only top-level payload observation. That finding was communicated and fixed in `3eabf9d8b420efb13debfcd8b6e378e81a2c4c61`.

I reviewed that final diff read-only and executed all seven `sourceCoverageAdmin.test.ts` tests offline; all passed (`postfix-admin-3eabf9d.log`). GET now exposes the effective observation as a separate DTO field while retaining the original historical payload. The UI declares `ReviewObservation`, uses that effective DTO with a legacy top-level payload fallback, and renders recorded time/source/HTTP status from it. The terminal test asserts those actual checkpoint values and no raw HTML disclosure; authorization/no-store checks remain.

## Final verdict

**APPROVE the reviewed fix set. Confidence: HIGH for deterministic counterexamples, budgets and API tests; MEDIUM for complete browser UX, not exercised here. No remaining demonstrated P0/P1/P2 in this fix set.** The original P1 base bug, budget inconsistency, rebaseline readiness mismatch and terminal header inconsistency are resolved in the reviewed revisions.

Residual qualification boundaries are unchanged: no authenticated publisher/reference independence, no legal-semantic recall score, attachment-bearing policies remain observation-only, generic non-integrity child HTTP/Retry-After behavior is not source-load qualified, no hosted UI/health or 500-policy/day result. No model, hosting, real policy endpoint or publication call was performed.
