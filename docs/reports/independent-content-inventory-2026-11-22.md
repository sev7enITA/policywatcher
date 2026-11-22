# Independent expected-content inventory: local implementation, 22 November 2026

## Result and scope

The follow-up to PR #83 adds a separately retained reference authoring path and version 2 inventories covering section, clause-block and table-row occurrences, a complete declared link census and required attachments. It is a new local candidate with a new implementation identity, not the hosted Preview or the frozen `050af19` cohort. No hosted scan, deployment, activation or database action was performed.

Version 1 matching remains usable for private observation but cannot publish. Version 2 also requires candidate identity, exact granular bindings and link/attachment evidence. A reference/candidate capture-ID collision holds the result. Structured blocks are rebuilt from frozen text before comparison. Missing units, repeated occurrence deficits, changed links, partial/changed attachments and extraction uncertainty remain hard holds, including for manual approval.

Attachment capture is serial, same-origin and bounded: four files, 1 MB decoded each, 2 MB aggregate and 1 million extracted characters. Exact fresh HTTP 200, media identity, framing, entity-byte hash and independently reviewed text coverage are required. PDF original bytes and extracted inert HTML are different evidence. Redirect targets are never contacted; cross-origin attachments remain held pending dedicated origin accounting. In-run fallbacks do not repeat failed attachment requests. A main-document 304 cannot reuse stale attachment evidence.

The offline CLI checks actual retained reference bytes against declared digests and produces a draft requiring review. It does not approve or authenticate a reference. The tracked synthetic example makes the process reproducible without a network, model, private capture or hosting session.

## Executed local verification

- Full application suite: **1,842 passed, 14 skipped**, 221 files passed and 3 skipped, with OS-denied TCP/IP and scoped Unix IPC for tooling.
- Targeted checks cover granular counts, exact reference binding, changed links with unchanged visible text, missing candidate identity, self-reference IDs, missing/ambiguous attachments, wrong bytes/media/language, incomplete text, uncertain extraction, partial responses and unknown/renderer framing.
- Isolated database/worker regression rejects a version 1 block-only reference before model execution, baseline refresh, public changes or outbox writes.
- Offline authoring checks reject changed reference/attachment bytes and preserve existing drafts. No candidate content is learned during those checks.
- Mutation controls deliberately bypassed the independent publication gate and link-census gate: their selected tests failed. The original source was restored and fingerprint checks passed.
- A fresh isolated private-candidate production build passed before the final attachment-uncertainty/fragment refinements; final build and remote CI are recorded as separate checkpoints below when completed.

Earlier failures are retained under the ignored local evidence directory: object aliases in the new fixture initially failed the strict inventory parser; fixture sections were copied independently rather than relaxing the parser. A full TypeScript attempt encountered stale `.next` types referencing another branch's PolicyAsCode routes; clean isolated build/type checks are the relevant result. Public text edits initially landed in the disposable build copy, then were copied back and the unintended nested copy removed before delivery.

## Local model challenge

Two actual installed local model identities reviewed selected code/design excerpts: Qwen3.8 27B Uncensored and GLM-4 9B Chat. The first Qwen compatible request exhausted its reasoning budget with no final answer; it is retained as an unsuccessful review. A native reasoning-off retry returned a partial answer within the output cap. GLM's compatible response completed. Neither model ran source tests; no GLM 5.3 MAX, Gemini or independent certification is claimed for this follow-up.

Adjudication: retained an explicit decoded-byte/base64 bound; attachment redirects are now refused before following a new target, avoiding an unleased origin transition. Rejected claims that a bounded base64 decode was unbounded allocation, that a public digest comparison required a secrecy timing defense, that per-group exact occurrence binding failed to enforce totals, or that browser CORS secures a server-side fetch. Existing pinned DNS/address validation and per-file decoding limits remain active. Review IDs remain transparently attestations rather than authenticated personal signatures.

## Limits and delivery

Reference origin and independence remain reviewer-attested, not cryptographically authenticated. Clause and row units use reviewed structural boundaries; this is not a measured legal-semantic recall score. Unloaded/non-text content and omissions already present in an independently reviewed reference remain possible. Nested attachment crawling, cross-origin attachment leasing, unsupported media and large attachments remain unqualified. Real-source completeness and 500 successful daily full-pipeline completions are still open.

The prepared stable public 5.6 archive and its previous receipt remain a distinct historical artifact. Any cumulative public package for this new diary must retain the stable scanner and its 35-table/19-migration schema. New engine/admin code is not part of public content delivery. A fresh Preview snapshot, staging verification, exact private r3 restoration and invariant checks remain mandatory before production. No package is called published merely because it exists locally or on Git.


## Private build and publication preparation checkpoint

The final clean isolated private-candidate package build passed, including the generated extraction profile and engine-manifest guards and TypeScript with fresh Next types. Targeted lint and critical-test TypeScript passed. The cumulative follow-up is [PR #84](https://github.com/sev7enITA/policywatcher/pull/84); it includes the unmerged PR #83 candidate and its stronger version 2 gate. Remote CI on the delivery documentation checkpoint is recorded separately from the local code checkpoint.

Full stable public `npm run build` uncovered a stale generated extraction profile after the 5.6 root lockfile metadata change. The earlier direct Next build had bypassed that prebuild guard. Original preparation archives are now held. Stable source `411a415f5e898a83ee9aca9fc979e843125bb18a` regenerates the profile with the guard retained: only the lockfile input digest changes; all seven extraction-source digests are identical. The profile identity changes from `e717f5728a2a0bbd1a078708282e0cf8fec1fc5e126ffeda57c86ee989d8d9c4` to `fcc7f2145af676a4973bcdcba82a6701176cca950b949c2563043733b1d70062`. No extraction flag, source approval, adoption of a baseline or hosted scanner state was changed. Historical evidence must retain its original profile.

The regenerated public ZIP has SHA256 `0cc3e1a430bdbd1b73b6a35f2f3206c776ce393bde49065e2b94359a675e78a6`. Against the previous 5.6 archive, only the EN/IT methodology page, diary page, generated stable extraction-profile metadata and release manifest differ; the other 1,067 files match. No private Engine 6/admin code is included. Fresh stable build and compiled HTTP checks are required before this package can be called ready. This checkpoint does not claim delivery online.
