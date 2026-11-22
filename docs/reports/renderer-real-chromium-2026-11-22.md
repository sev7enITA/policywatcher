# Real local Chromium follow-up, 22 November 2026

The installed Playwright browser was already present, so no download or installation was needed. A headless, isolated run exercised the real Renderer1.2.1 handler, DNS validation, Chromium launch and page rendering on this Mac. No source or immutable package was changed.

Authenticated readiness returned200 and identified browser major149, capacity1, one target domain and no cross-site subresource allowlist. A partially submitted body occupied the single reservation. A second real HTTP render request received429 with Retry-After5, before any second render. Completing the first body produced one intended external top-level render of IANA's https://example.com: outer200, source200, final URL https://example.com/, HTML2373 UTF-8 bytes containing Example Domain. Final readiness showed active0. Total observed fixture time was about3.7seconds; this is not a benchmark.

The actual main-module SIGTERM path closed its shared browser and server, and the child process exited0. The only instrumentation was replacing the listener binding with127.0.0.1 and an ephemeral port, then using that actual address for the local requests. The unmodified startup log still prints its configured PORT8787, which is not the instrumented fixture's listening port. No real policy source, PolicyWatcher inquiry, model, database, remote VPS, user browser profile or shared GUI was used.

This is one Mac browser/service functional smoke with one non-policy external test source and a local admission check. Browser major149 on this Mac does not qualify the separate VPS Chromium149 installation, its allocation, systemd supervision, upgrades, performance, source completeness or500 daily policies. It does not test CAPTCHA handling or bypass any source restriction.

Artifact SHA256 remains ca3a96c560b6f3300e4e46fc43541e30e0087443731e3e9b500915be2ab53095. The source and package retain runtime commit3276336; this follow-up is output-only. Raw receipt, exact fixture, process log and checksum follow-up are retained beside this report.


## Evidence and reproduction

[Observed statuses](renderer-real-chromium-2026-11-22/receipt.json), [process/package follow-up](renderer-real-chromium-2026-11-22/followup.json), [exact original fixture](renderer-real-chromium-2026-11-22/fixture.mjs), [process log](renderer-real-chromium-2026-11-22/run.log). This manual probe needs an already installed Playwright browser and makes an external non-policy test request; it is separate from the offline suites.

The exact fixture saves its result before invoking the real SIGTERM handler. That production handler exits0, so **process exit0 alone must not be used as the probe verdict**: require receipt.status=passed_real_local_browser_and_admission, readiness200, concurrent429, external outer/source200 and final active0. A failed assertion in this original fixture can otherwise be followed by successful shutdown. The recorded successful run satisfies all those independent fields. The controlled startup log prints configured8787, while the real fixture listener is an observed ephemeral loopback port.

For a fresh reproduction, use a separate scratch working directory, symlink only the reviewed renderer folder, create output/renderer-1.2.1/real-chromium there, then execute the exact fixture and validate its JSON fields. Preserve existing receipts; do not overwrite them. No real VPS or source-policy request is needed or authorized by this fixture.
