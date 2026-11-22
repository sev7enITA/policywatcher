# Independent renderer source review, 22 November 2026

**Verdict: APPROVE** for the bounded admission and failed-browser-launch recovery fixes in runtime commit `3276336aedff3923a21cbf642e1f303ea53efd8b`. **Confidence: high within the tested source/control scope.** This is not deployment approval, a real Chromium workload qualification, or an independent security assessment.

The review inspected the actual HTTP handler, body reader, DNS deadlines, default rendering cleanup, shared browser promise, service configuration, Node tests, caller boundaries and the real commit diff. The author checkout later advanced to documentation-only commit `f6b2d7a3572075ca4295c51d7bfd93d32c67762b`; the reviewed server and tests remained unchanged. The server's SHA256 is recorded in [the receipt](renderer-independent-review-2026-11-22/receipt.json). No author-branch source was edited.

## Findings

No new P0 or P1 defect was demonstrated in the admission or failed-launch recovery changes. The two reproduced reliability defects have local source fixes and relevant regression controls. The retained baseline failures remain failures; a later successful attempt does not erase the first 503.

| Control | Source assessment | Executed evidence |
| --- | --- | --- |
| Authentication | Only exact GET `/healthz` is public. Every other route authenticates before route selection or admission. Dependency overrides are function parameters, not HTTP input. | Protected/unknown routes and secret-overlap checks pass. |
| Atomic admission | `active++` occurs synchronously before body/DNS awaits, after auth, route and draining checks. Only its enclosing `finally` decrements the counter. | At capacity one a second request gets 429 with Retry-After. Body, validation and render failure cases return to zero without observed negative counts. |
| Body and disconnect handling | The reader settles once and removes its listeners/timer. Partial-body aborts reject; valid-body response closure signals cancellation. | Stalled body408, oversized body413, partial-body disconnect and navigation cancellation pass. |
| Cleanup ownership | Default `renderPage` awaits `context.close()` before its promise settles; the HTTP reservation remains held until then. | Two independent default-render probes delay context closure, inspect active1 and a second-request429, then release cleanup and inspect active0. One covers a successful render and one covers a client abort during navigation. |
| DNS cancellation boundary | A disconnected request may retain admission while DNS validation settles, but the later result cannot start a render when the response is destroyed. A validation deadline prevents indefinite HTTP waiting in that stage. | Independent default-validator probe disconnects while DNS is pending; no context is created after releasing the lookup gate. Existing deadline test also passes. |
| Browser recovery | Failed pending launch is cleared only if still current. Concurrent waiters share it; old disconnected callbacks cannot clear a newer launch. Closing an unstarted getter does not launch Chromium. | Initial readiness remains503; a new readiness request retries and returns200. Concurrent/stale-callback and close-without-launch checks pass. |

## Executed tests and reproducibility

**28 existing/candidate Node checks passed** across renderer unit tests, real loopback HTTP tests and the five Agent helpers. They were run with operating-system network access denied except loopback bind/inbound/outbound. [Node result](renderer-independent-review-2026-11-22/node-28-tests-loopback.log).

**Three separate independent lifecycle probes passed** using the actual HTTP handler and actual default `renderPage`/default URL validator. Only DNS and the Chromium module boundary were replaced by controlled objects; actual HTML acquisition and browser resource behavior are not thereby verified. These probes add evidence about the application lifecycle, rather than replacing `render` with an injected cancellation implementation. [Probe source](renderer-independent-review-2026-11-22/resource-lifecycle.test.mjs), [result](renderer-independent-review-2026-11-22/resource-lifecycle.log).

From an integrated source tree containing Renderer1.2.1 and installed dependencies:

```sh
sandbox-exec -p '(version 1)(allow default)(deny network*)(allow network-bind (local ip "localhost:*"))(allow network-inbound (local ip "localhost:*"))(allow network-outbound (remote ip "localhost:*"))' node --test renderer/server.test.mjs renderer/http.test.mjs vps-agent/agent.test.mjs
sandbox-exec -p '(version 1)(allow default)(deny network*)(allow network-bind (local ip "localhost:*"))(allow network-inbound (local ip "localhost:*"))(allow network-outbound (remote ip "localhost:*"))' node --test docs/reports/renderer-independent-review-2026-11-22/resource-lifecycle.test.mjs
```

The independent probe requires Node22.15+ for module hooks. To inspect a different local checkout, set `POLICYWATCHER_RENDERER_REVIEW_SOURCE` to its absolute `renderer/server.mjs` path. The initial sandbox profile using literal127.0.0.1 was rejected before execution because macOS requires `localhost` in that filter; the successful runs use the supported loopback-only profile. No network boundary was opened beyond loopback.

## Residual limits and recommendation

The render `TOTAL_TIMEOUT_MS` timer is installed only **after `context.newPage()` resolves**. It is not a single end-to-end deadline for browser launch, `newContext`, `newPage`, context closure, body ingestion or initial DNS. Body and DNS have their separate bounded waits. A stalled browser-protocol creation/close operation can therefore retain admission; the source review does not establish application deadlines or recovery for every such RPC. This is a pre-existing residual boundary rather than a new P1 finding introduced by the patch. Avoid advertising an end-to-end hard deadline. A separate measured browser-lifecycle candidate can add appropriate bounds/quarantine/recovery without releasing capacity while live resources remain.

The independent mocks do not execute page.route subresource interception, Chromium socket behavior, real-world DNS, source extraction, semantic verification, capacity under sustained load, or500 daily successful policy completions. The counter now measures authenticated admission, including body/DNS/cleanup waits; it is not a live-context metric. The Agent helper checks do not prove signed upload, real npm lifecycle, systemd restart or rollback.

Recommend retaining the source fix and its baseline failure evidence, then qualifying a real Chromium instance in an isolated staging service with explicit deadline/resource observations and upgrade/rollback checks before any promotion. Candidate1.2.1 remains separate from observed live1.2.0, public stable5.5, private r3 and every frozen Engine6 cohort. No remote service or configuration was contacted or changed in this independent review.
