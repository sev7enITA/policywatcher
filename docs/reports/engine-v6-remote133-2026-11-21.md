# Follow-up of 133 target-account holds, 21 November 2026

The [fixed baseline](engine-v6-remote133-2026-11-21/baseline-cases.json) accounts for the 133 unsuccessful scopes from the original target-account trial. The same addresses form the [follow-up corpus](engine-v6-remote133-2026-11-21/catalogue.json). Source addresses have not been substituted to improve results. The previous 367 extraction successes are outside this subset.

## Reproduced transport limitation

The HTTP/2 fallback rejected every 3xx response. This could exhaust a valid source after direct transport failed even when the redirect remained on the same reviewed host. The candidate follows relative and same-coherent-host HTTPS redirects, resolves and pins DNS at each hop, limits the chain to six requests and uses one overall transport deadline. Cross-host drift, downgrade, credentials and private destinations remain rejected. The final URL is available to the existing language/path-drift controls. Redirect-to-home fixtures retain the caller's scope hold.

Eighty focused scraper, fallback and transport tests pass with operating-system network access denied. The new regression suite fails against the parent implementation. It covers relative redirects, loops, credential/downgrade/cross-host rejection, DNS rebinding to a private address, an exhausted chain deadline, rate limiting and final-path drift. TypeScript checking passed.

## Source evidence and limits

All 172 archived attempt bodies were retrieved from the private target-account QA directory and verified against their stored hashes. Among the 27 accepted-HTTP but rejected-extraction scopes, archived documents show shopping interstitials, a withdrawn Chrome notice, missing fragment targets, empty/script-driven bodies and insufficient document text. They remain held pending authoritative identity or rendered-source review. Provider assets, HTTP200 and large HTML byte counts alone do not establish a complete policy.

The [case-level categories and test summary](engine-v6-remote133-2026-11-21/summary.json) distinguish source access, redirect identity, incomplete static content and transport problems. These mechanisms do not assign general responsibility to publishers.

## New target-account observation

The [execution context](engine-v6-remote133-2026-11-21/context.json) binds the candidate and frozen 133-scope input by SHA-256. The bounded SSH QA process uses the existing Node24 runtime, a private sibling directory, an isolated database URL, a 384MiB heap limit and lower process priority. Three workers preserve per-origin pacing and hold after rate limiting. It invokes acquisition/extraction without models or source approval. No production database or deployed engine is modified.

The initial launch attempts were rejected before source requests because of invalid source-revision input, an expired runtime-dependency symlink and an existing empty output directory. Their logs were preserved. The corrected launch uses the verified parent revision and current read-only runtime dependency. Original artifacts and previous trial reports remain retained.

The [completed follow-up report](engine-v6-remote133-2026-11-21/followup-report.json) accounts for all 133 endpoints in 261.515 seconds, with 233 transport-chain attempts. Thirty-one endpoints returned accepted HTTP200, but only four source scopes completed extraction. The remaining 129 comprise 98 transport rejections, 24 extraction-size holds, four origin-backoff holds and three block/soft404 holds.

New extraction successes were TikTok's declared EEA privacy URL and three Mailjet sources (sending policy, privacy policy and terms). Changed live responses and network conditions can explain these successes. They are not attributed causally to the redirect fix. Same-host redirect behavior is established by deterministic tests. All four remain subject to source completeness and contract review.

The [case-by-case follow-up](engine-v6-remote133-2026-11-21/case-results.json) joins every baseline case to the new result. Neither the earlier367 successes nor these four are combined into a new contemporaneous500-policy score.

## HTTP2 cleanup finding

After the report completed, the first follow-up QA process retained open HTTP2 sessions. Its immutable report was verified before the isolated process was terminated with SIGTERM (exit143). The reported261.515seconds covers acquisition/extraction, excluding that cleanup failure.

The final candidate destroys its single-use HTTP2 client after the completed response is decoded, instead of waiting indefinitely for a graceful peer close. A regression assertion requires destruction after a redirect and successful response. The [target-account cleanup receipt](engine-v6-remote133-2026-11-21/cleanup-receipt.json) records a separate, bounded HTTP2 request to Google's public privacy source. It returned200 and exited naturally with code0 in0.358seconds. This verifies the final cleanup behavior on one request. The133-scope results remain attributed to the earlier candidate in their context.

## Delivery state

Code and evidence are submitted through PR76. The bilingual diary source is prepared for publication. A browser integration failure points to an older Browser service version which is no longer installed. The newer client could not connect, including after a fresh session. No public deployment or hosted private-engine change was attempted. The wiki and Git delivery state must be checked independently from the website.
