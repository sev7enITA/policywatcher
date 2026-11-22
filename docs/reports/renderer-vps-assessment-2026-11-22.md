# Renderer and VPS companion assessment, 22 November 2026

Two P1 reliability defects were reproduced in the renderer source and corrected in a **local Renderer 1.2.1 candidate**, runtime commit `3276336aedff3923a21cbf642e1f303ea53efd8b`. No remote service, account configuration or deployment was changed. Remote incident occurrence is unknown; these reproductions do not establish an operational incident.

## Infrastructure observations must remain separate

1. The earlier bounded SSH probe observed a Hostinger shared CloudLinux account. Host-wide CPU/RAM totals are not an allocation or capacity measurement for the separate renderer VPS.
2. The earlier authenticated renderer readiness response reported HTTP200, renderer1.2.0, Chromium149 and configured capacity3. This establishes point-in-time browser/configuration readiness, not sustained load, source correctness or uninterrupted supervision. No remote endpoint was contacted during this companion phase.
3. The historical v3.5.1 architecture names `187.124.184.225`, `render.policywatcher.online` and `ops.policywatcher.online`. These are documentation metadata, not current SSH credentials or proof of a reachable/allocated VPS. No connection was attempted, no account identity guessed, and current systemd state, allocation, disk budget and billing were not established.
4. Earlier application configuration checks found no Operations Agent integration. This does not prove that no Agent exists elsewhere; managed upgrade controls cannot be presented as currently connected without independent confirmation.

## Reproduced findings and candidate changes

| ID | Priority | Before | Local candidate |
|---|---|---|---|
| R1 | P1 | The capacity check precedes body/DNS awaits; active increments afterward. Two concurrent requests pass at capacity1. | Reserve synchronously after auth/routing and release once in finally. A second request gets429 and Retry-After5. |
| R2 | P1 | A rejected Chromium launch promise remains cached. Subsequent readiness requests503 without a new launch. | Reset only the still-current failed promise; preserve the initial503 and allow a later request to retry. Stale disconnected events cannot clear a newer browser. |

The admission fix covers body parsing/size failures, invalid/denied targets, DNS exceptions/deadlines, render failure and client cancellation. New body and DNS deadlines default to10seconds, each bounded to1-30seconds in environment configuration. Stalled bodies receive408; oversized bodies413, both with connection closure. The counter is owned by the server and only its finally block decrements it. Client abort/response close signals cancellation; a created render context is closed, and the slot is released after the render unwinds. DNS work may finish after a timeout, but its later result cannot launch a render from the timed-out request. Chromium launch/page operations retain their own browser-library/page deadlines; this patch does not establish a hard deadline for every operating-system resource failure.

Capacity now includes authenticated requests reading their body or validating DNS, not just browser contexts. The readiness active field is admission pressure, not a measured concurrency or throughput benchmark. No automatic in-request retry hides a failed launch, and concurrent waiters share one pending launch. A separate persistent-failure cooldown was not added; any launch-storm hardening should be measured under an isolated fault workload.

## Executed verification

The unchanged companions first passed12 existing Node checks with all network access denied. The candidate passes28 Node checks: seven pre-existing renderer tests, five Agent helper tests and16 new HTTP/recovery cases. The new HTTP tests use real local TCP requests; DNS, browser launch and HTML output are controlled dependencies. No real policy source, Chromium workload or remote update was exercised. These Node results are separate from Vitest, acquisition and model-review totals.

The source-level negative-control fixture loads the actual recorded parent source with only HTTP binding, DNS and Chromium replaced at module boundaries. Both parent runs exit1: admission shows active2/capacity1 and two200 responses; browser recovery shows two503 responses from one failed launch attempt. The same fixture on the candidate exits0: active1 with200/429, and an initial503 followed by200 from two launch attempts. Original observations and failing logs are preserved, rather than replaced by the corrected results. Scoped ESLint, syntax and whitespace checks pass.

New checks cover invalid/missing JSON fields, denied target, DNS throw/deadline, render failure, oversized/stalled body, partial-body disconnect, render cancellation, unauthorized/unknown routes, concurrent launch failures, recovery, obsolete disconnected callbacks and shutdown without a spurious launch. Slot observations remain nonnegative and return to zero. The private Browser/Agent APIs exposed for dependency-controlled testing do not accept dependency overrides over HTTP.

[Machine-readable receipt](renderer-vps-assessment-2026-11-22/receipt.json), [final Node results](renderer-vps-assessment-2026-11-22/tests-final.log), [parent admission](renderer-vps-assessment-2026-11-22/parent-admission.json), [candidate admission](renderer-vps-assessment-2026-11-22/fixed-admission.json), [parent recovery](renderer-vps-assessment-2026-11-22/parent-recovery.json), [candidate recovery](renderer-vps-assessment-2026-11-22/fixed-recovery.json).

## Remaining P2 and qualification limits

- **A1, subprocess deadlines:** Agent runCommand caps captured output and uses shell:false, but has no execution timeout/termination for npm, archive commands or systemctl. A stalled child can retain its in-process operation lock. This is a source-reviewed risk, not an exercised failure or an observed remote outage. Add bounded subprocess deadlines and fault/rollback recovery tests in a separate Agent candidate.
- **A2, health versus usable output:** Agent waits for renderer healthz after restart, then its fixed smoke accepts an outer successful response with HTML length greater than100. It does not require the rendered source status to be2xx or establish expected policy content. Treat this as infrastructure smoke, not policy QA. Qualify authenticated readyz and a stable fixture/status expectation before relying on it for promotion.
- **R3, browser network boundary:** HTTPS, registrable-domain allowlists, private address checks, credential rejection, coherent final host and a separate cross-site subresource allowlist are present. Chromium owns its sockets, so these are request-boundary checks, not DNS pinning. Current page.route alone does not certify popup, service-worker or WebSocket egress. Source context options do not explicitly block service workers. Qualify those channels and apply network-level egress controls before making comprehensive SSRF claims. No escape was attempted against a live service.
- **R4, logs:** the explicit target formatter strips query and fragment, but the error path also writes an arbitrary exception message prefix. That text can itself contain a URL. Prefer stable error codes or a dedicated URL-aware sanitizer; no real credential leak was observed or asserted.

## Operations Agent control review

The Agent is a separate0.2.1 service. Non-health routes verify a timestamped HMAC over method, exact request path, nonce and raw-body hash; accepted nonces are kept in memory within a bounded time window. The route list is fixed. Uploads use bounded strict base64, checksum equality, a fixed packages directory, ZIP entry/declared-size/type limits and traversal/env/symlink checks. Updates check package/lock/release metadata, run npm ci, switch a current symlink, restart the fixed service, smoke and attempt rollback. Logs are response-capped and backups exclude env files/node_modules with count retention.

This is source/control review plus five helper tests, not an executed Agent installation, authenticated HTTP/anti-replay integration campaign, signed upload, real npm lifecycle, systemd restart, backup restoration or rollback. The process lock and nonce cache are in-memory; restart/crash recovery must be qualified separately. There is no direct shell-command endpoint, but an approved package lifecycle runs as the service user, so package review/provenance and narrow systemd privileges remain necessary. SHA256 transport integrity alone does not establish trusted authorship.

## Reproduction and promotion gates

With installed dependencies, no internet access is needed:

```sh
sandbox-exec -p '(version 1) (allow default) (deny network*) (allow network-bind (local ip "localhost:*")) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*"))' node --test renderer/server.test.mjs renderer/http.test.mjs vps-agent/agent.test.mjs
```

The committed developer-only fixture requires Node22.15+ for module hooks and forces its own listener to loopback. Run it from the repository root:

```sh
node renderer/fixtures/http-source-regression.mjs
node renderer/fixtures/http-source-regression.mjs --recovery
POLICYWATCHER_RENDERER_SOURCE_REF=4fd791e19b1b1ca68f6ec57d7d84ee1c829f17b4 node renderer/fixtures/http-source-regression.mjs
POLICYWATCHER_RENDERER_SOURCE_REF=4fd791e19b1b1ca68f6ec57d7d84ee1c829f17b4 node renderer/fixtures/http-source-regression.mjs --recovery
```

Apply the same loopback-only sandbox profile if enforcing the boundary externally. The two parent commands deliberately exit1 and retain their JSON observations; candidate commands exit0. Fixture sources are not included in the packaged runtime.

A local-only ZIP was created from clean runtime commit3276336 and passed archive/version checks. Its exact checksum is in the receipt. It has not been uploaded, released on GitHub or deployed to the renderer. Before promotion: independent diff review, real Chromium isolated staging, concurrency/deadline/resource observations, authenticated readiness, service upgrade and rollback rehearsal and explicit final release approval. This candidate changes no stable product scanner, private r3 environment or frozen qualification cohort. Source completeness, semantic accuracy and500 successful daily full-pipeline completions remain unqualified.
