# Independent workflow consistency review

Reviewed source: `946fc9d526dc60cc6ca2af8422db09d361180155`, cumulative diff against `origin/main` plus surrounding workflow. Read-only audit; no source, Git or hosted state changes.

Verdict: APPROVE WITH P2 FINDINGS for this review's inspected paths. Confidence: medium-high for inspected code/control paths, not a certification of live sources, semantic model accuracy or 500 successful daily policies.

## Findings introduced by this candidate

| Priority | Finding | Exact source |
|---|---|---|
| P2 | HTTP/1 transport-integrity failure proof/status are discarded by the generic acquisition catch. A truncated response becomes `status:0, transport_failed`, losing the new bounded byte/framing evidence. Publication still fails closed. | `src/lib/engine/acquisition.ts:257-259` |
| P2 | Aggregate attachment budget is tested only after fetching, and catch/continue still requests later files after the budget is already exhausted. Four 1 MB files can all be retrieved although only the first two are retained. This is bounded, not an unlimited memory/SSRF finding. | `src/lib/engine/acquisition.ts:349-363` |

### Executed offline diagnostic reproducer

Called `acquire(forceFresh:true, transportStub)` with the checked synthetic source contract. The stub throws `new TransportIntegrityError('response_length_mismatch', proof, 200)`, with `receivedBytes=10`, `declaredContentLength=100`, `framing=incomplete`, `lengthCheck=mismatch`. No source/database access occurs: every transport throws before artifact persistence.

Observed diagnostics:

```json
[{"source":"direct","status":0,"reason":"transport_failed"},{"source":"http2","status":0,"reason":"transport_failed"},{"source":"rendered","status":0,"reason":"transport_failed"}]
```

Suggested correction: preserve the known `TransportIntegrityError`'s bounded token, status and proof, while retaining the generic result for arbitrary exceptions. Do not persist arbitrary provider exception text.

Budget finding is static analysis, not a measured live transfer: stop issuing later attachment requests once the retained/remaining budget is exhausted, or explicitly distinguish bytes retrieved from bytes retained in the documentation and receipt. A before-read network bound would need the remaining budget passed to transport; a post-read `continue` does not supply it.

## Pre-existing operational limits checked separately

- Pause/publication environment flags have no found live setter in the admin API/UI. The UI reports publication status and offers durable run cancellation. Environment flags are process configuration, not a demonstrated shared hot kill switch. A test mutating `process.env` mid-task would show a possible hardening path but does not establish a currently exposed P1 exploit.
- Hosted Preview has an equivalent transactional guard: `fenced()` checks hosted context before/after work and `assertHostedWorkerLease()` checks context plus shared leader-row ownership. That context requires publication and notifications disabled. `cancelRun()` clears running task leases/reservations in a transaction, so later fenced task commits fail. A shared database pause/generation would be needed for global immediate revocation in non-hosted workers; an environment edit in another process cannot change an already running process's inherited environment.
- Terminal failure review payloads retain `checkpoint` but no top-level `observation` (`store.ts:286-290`), whereas the admin GET chooses only `payload.observation.artifactId` (`route.ts:31-37`). Those terminal reviews can retain artifact IDs inside technical provenance while showing no frozen text/coverage in the normal detail view. This is an existing presentation gap, not a publication bypass introduced by this candidate.
- Authenticated actions are role-attributed (`admin`), not individually signed publisher/reviewer identities. The new inventory explicitly labels independence as reviewer-attested and keeps origin/global qualification false; it must not be diagrammed as cryptographic identity verification.

## Verified workflow invariants

1. `enqueueRun` freezes contract/profile/baseline/source/mode inputs in a transaction, reserves one active policy task per policy and deduplicates fetches only within the same run/key context (`store.ts:34-112`). Hosted channels additionally force observe/silent and a limit no greater than 50.
2. Fetch task claims own a durable origin lease; policy commits own token/generation/status/expiry fences. Policy/contract/source/profile CAS checks run before authoritative baseline/snapshot/state changes (`store.ts:144-231`, `pipeline.ts:54-72`). No network call is made inside the fenced transaction.
3. Artifacts are content-addressed and exact JSON byte length/hash are rechecked on read (`store.ts:234-245`). Appending a private artifact before winning a task fence does not itself publish it.
4. The 304 path requires a current keyed cache entry, matching baseline/profile, conservative response validators and no expected attachments. It cannot confirm a changed representation (`acquisition.ts:240-281`, `pipeline.ts:173`).
5. Acquisition rechecks the reviewed contract and V2 scope/count/order/link/attachment evidence from retained text/artifacts. It does not trust a persisted `eligible` flag (`pipeline.ts:147-155`).
6. Version 1 is observation only. V2 publication additionally requires matching detailed inventory and zero expected attachments. Matching attachment evidence remains private until annex change analysis is qualified (`coverage.ts:199-204`).
7. New baselines require two different-run fresh matching captures, spaced by the confirmation interval and within the upper age bound. Transport/reference context must match (`pipeline.ts:215-248`).
8. Changed parents pass claim schema/exact span/full delta coverage checks, separate verifier verdicts and provider-resolved model identity checks. High-impact or uncertain cases hold; model identity separation is a minimum check, not independent correctness proof (`claims.ts:26-113`, `pipeline.ts:323-347`).
9. Baseline establishment, unchanged anchor refresh, final publication, high-impact approval and replay/baseline approval all reach the central publication coverage gate (`pipeline.ts:36-39,123-130,151-164,268-269,345-346,425-426,454-456`). Manual approval does not waive missing evidence or observe mode.
10. Snapshot/current baseline/change/claim-ledger/outbox changes share a database transaction. Initial baseline and explicit baseline replacement do not emit a policy change/notification. A completed task/run may still mean a review hold; completion is not qualification (`pipeline.ts:129-139,268-295,348-359,450-480`).
11. Outbox fanout is idempotent by event key. Delivery rechecks public evidence and subscriber consent/preferences. SMTP acknowledgement is at-least-once with stable Message-ID, not guaranteed exactly-once (`outbox.ts:9-62`).
12. Observe/publish state rows are separate; cancellation preserves artifacts and checkpoints. This review found no new path from an observation-only attachment to public baseline/change/outbox.

## Executed verification

With OS-denied TCP/IP and the existing scoped Unix IPC test profile:

```sh
sandbox-exec -f output/audit-20261122/offline-tsx-ipc.sb \
  node node_modules/vitest/vitest.mjs run \
  src/lib/__tests__/engineV6.test.ts \
  src/lib/__tests__/sourceCoverageWorkflow.test.ts \
  src/lib/__tests__/independentInventory.test.ts \
  src/lib/__tests__/transportIntegrity.test.ts --reporter=dot
```

Result: **225 tests passed in 4 files**, 5.56 seconds. Log: `output/workflow-consistency-20261122/review-offline-tests.log`. SQLite/worker fixtures are isolated; no actual policy, model, browser, hosting or notification operation was performed. No live deployment state or corpus completeness was verified. The reported total is this focused rerun, not additional source/day coverage.

The DOM `<base href>` issue found by another reviewer was not duplicated as an independent finding here. Parent coordinator owns adjudication and any fixes/updated tests. This document describes source946 before those fixes.
