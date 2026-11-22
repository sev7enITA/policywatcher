# Independent post-fix workflow review

Source: `0b0c515350d9b60f81baf2e926e92c874e563ad5`; reviewed diff from the original `946fc9d526dc60cc6ca2af8422db09d361180155`. Original review and log remain unchanged in `review-code.md` and `review-offline-tests.log`.

**Verdict: APPROVE for the reviewed fix set. Confidence: medium-high.** No new P0/P1 or consistency regression found in these changes. This is a separate Codex sub-agent code review and offline execution, not a live-source or third-party certification.

## Findings adjudicated

| Original issue | Post-fix assessment |
|---|---|
| Lost HTTP/1 failure proof/status | Resolved. Acquisition recognizes `TransportIntegrityError`, preserves bounded HTTP status and whitelisted code, and creates a fresh proof object containing only bounded counters/enums. Arbitrary exception text and extra properties are omitted. Root and child integrity errors use this path. |
| Attachment aggregate overrun/extra requests | Resolved for decoded entity bytes. One reservation object spans root fallback attempts. A URL gets at most one request promise; reservation occurs before requesting. Successful smaller results refund unused allowance, failures retain their full allowance, and no new request starts once exhausted. The remaining allowance reaches the actual decoder. This is not a 2 MB encoded-wire guarantee. |
| DOM base URI / inert nodes | Corrected. Link resolution uses the received document URL and one safe active HTML base; ambiguous/unsafe bases create an unmatchable hold marker. Inert template roots/IDs/anchors/base and non-HTML SVG base nodes do not change the census. Exact fragment and URL/occurrence checks remain. |
| Rebaseline coherence | Resolved. A rebaseline request now requires the same central publication eligibility as baseline/unchanged/approval/commit. It cannot mark migration pending for an inventory that cannot satisfy publication, including attachment-bearing contracts. CAS/current-context validation and two-fresh-capture requirements remain in place. |
| Terminal review evidence display | Resolved. The private GET uses the top-level observation when present, otherwise the checkpoint observation. Frozen text/coverage are visible without returning raw HTML; unauthorized access still returns before reading the artifact. Child error details are explicitly returned to the authenticated admin. |

## Independent executed verification

OS-enforced TCP/IP denial with scoped Unix IPC for the existing local test harness:

```sh
sandbox-exec -f output/audit-20261122/offline-tsx-ipc.sb \
  node node_modules/vitest/vitest.mjs run \
  src/lib/__tests__/engineV6.test.ts \
  src/lib/__tests__/sourceCoverageWorkflow.test.ts \
  src/lib/__tests__/independentInventory.test.ts \
  src/lib/__tests__/transportIntegrity.test.ts \
  src/lib/__tests__/sourceCoverageAdmin.test.ts \
  src/lib/__tests__/engineAuditRegression.test.ts \
  src/lib/__tests__/scraperFallbackSmoke.test.ts \
  src/lib/__tests__/hostedWorker.test.ts --reporter=dot
```

**274 tests passed in eight files, 4.97 seconds.** Evidence: `review-postfix-offline-tests.log`. The new tests exercise proof/status retention and private-canary exclusion, base URI mutation with unchanged visible text, inert markup, actual remaining decoder allowance, aggregate reservation, rebaseline refusal and terminal evidence/authentication. Existing suites also exercised transaction/CAS/fencing, origin controls, archive/fallback restrictions and hosted leadership. No real policy, external model, hosting deployment or subscriber notification was used. The source checkpoint stayed at `0b0c515` with no tracked working-tree edits during this rerun.

The coordinator's five negative mutation controls were reviewed as reported evidence, not independently re-executed by this sub-agent. The independent test rerun above is separate and must not be added to the full application total as new cases or qualification days.

## Residual limits, unchanged or explicit

- Child HTTP 429/503 and `Retry-After` are **not qualified** as origin-wide scheduling/backoff. `acquireEngineAttachment` rejects non-200 via a generic failure; it does not return the response retry metadata. A child request is not repeated during the same acquisition because its promise and reservation are retained, but root fallbacks may continue and the origin scheduler does not receive a child-specific retry deadline. This remains a measured-design/test gap; do not draw a qualified child-backoff arrow.
- The aggregate allowance concerns decoded entity bytes. Encoded network responses retain the transport's separate network/body bound, and failed reads may consume wire bytes before decoding fails. Avoid labelling the reservation as a strict total network-download cap.
- Pause/publication environment flags remain process configuration, with no found live admin setter. Run cancellation supplies durable in-flight fencing; hosted Preview independently checks context/leadership at transactional boundaries. No new hot-kill-switch or demonstrated P1 bypass is claimed.
- Matching references remain reviewer-attested. Attachment-bearing policies remain observation-only because annex-only semantic change analysis and publication events are unqualified. Real-source completeness and 500 successful daily full-pipeline policies are unqualified.
- These fixes leave atomic publication and CAS structures intact; no schema/outbox/SMTP contract change was introduced. Initial baseline and explicit baseline adoption still do not create a provider-change event automatically, and SMTP remains at-least-once rather than exactly-once.

No code or Git mutation was performed by this review. Only these ignored review notes/logs were written.
