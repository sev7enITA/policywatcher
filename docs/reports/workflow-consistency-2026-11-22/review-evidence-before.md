# Independent operator/evidence workflow review

**Reviewed revision:** `946fc9d526dc60cc6ca2af8422db09d361180155` (cumulative PR #84 against `origin/main`).
**Verdict:** REQUEST CHANGES. **Confidence:** HIGH for the base-URL finding; MEDIUM for operational/documentation observations.

## Findings

| Priority | Finding | Location at reviewed revision |
|---|---|---|
| P1 | Link census ignores the HTML document base, allowing changed link targets to pass the publication gate | `src/lib/engine/acquisition.ts:329` |
| P2 | The stated 2 MB aggregate attachment acquisition budget is actually a retained-bytes limit; more files continue downloading after it is exceeded | `src/lib/engine/acquisition.ts:349-356`, methodology:147 |
| P2 | Rebaseline action remains available/accepted for artifacts that cannot satisfy the new publication coverage gate | `src/lib/engine/pipeline.ts:398`, admin page:204 |

### P1: resolve against the effective document base

`new URL(href, sourceUrl)` does not implement HTML `<base href>`. The offline proof in `reproduce-base-publication.ts` uses a separately authored synthetic V2 reference, a non-attachment reference link and otherwise identical HTML/text. Changing only the base from `https://example.org/` to `https://cdn.example.net/legal/` changes the actual destination of `href="reference"` to a different origin, yet both captures return `eligible=true`, `linkState=matched`, `coverage=matched_reviewed_reference` and `publicationCoverageSatisfied=true`. Thus the unchanged-parent branch can accept changed effective destinations; the current attachment-only publication hold does not cover this zero-attachment case. The direct-link proof also shows the engine would associate a declared attachment with the wrong same-origin URL.

Recommended repair: resolve one active document-wide base before enumerating scoped anchors; no base means the requested document URL. Prefer a hard hold and no attachment requests for multiple/invalid/non-HTTP/credentialed bases. Resolve fragment-only hrefs against the effective base, while selecting the initial requested fragment in the loaded document itself. Retain the current changed-base negative proof and a valid-base positive control.

Cheerio detail verified offline: template contents are selected by global `base[href]`, `main`, and `[id]` selectors, but their nodes belong to a detached root and `.parents('template')` is empty. Filtering only on a template ancestor is insufficient. Active HTML base candidates should have an actual HTML-document ancestor (and HTML namespace); scope roots, IDs and anchors should exclude detached/inert template content. Duplicate nested main/article anchors should remain deduplicated. Cover base-in-template, active+inert duplicate IDs, relative base, changed/cross-origin base, multiple base, credentials/non-HTTP, and fragment href cases.

### P2: make the budget denominator explicit

This observation is from source inspection, not a measured network trial. Four declared 1 MB files can each be requested and retained in the per-run promise map. The running total is checked after each result arrives; files 3 and 4 are then rejected from `body.attachments`, but the loop continues. The retained artifact respects 2 MB; total decoded acquisition/cache can reach 4 MB. The request count and each file are bounded, so this is not unbounded allocation. Stop issuing requests when the retained budget is exhausted, and label 2 MB as a retained-entity budget unless the transport is given the remaining cumulative read budget. Distinguish encoded transfer bytes, decoded bytes and retained bytes in diagrams.

### P2: rebaseline action should align with publication eligibility

`requestConfirmedRebaseline` tests `assessCapture(...).eligible`, while the new baseline/publication paths require `publicationCoverageSatisfied`. A stale or older parser-upgrade review carrying a legacy or block-only reference can therefore transition to `rebaseline_requested` and set `sourceMigrationPending`, only to be held by the worker's stronger V2 gate. The admin button also ignores the displayed missing coverage/attachment publication hold. No publication bypass is claimed: downstream guards still refuse. Align action readiness/wording with those guards, or explicitly present this as a preparatory request that may remain blocked until the contract is repaired. This is an operational consistency observation; no DB mutation was executed for this audit.

## Verified invariants and explicit limits

- V2 parser binds exact scope/language, digest, full group counts, granular element mapping and link/attachment declarations; publication requires a matched detailed inventory and zero expected attachments.
- Reference authenticity/independence remain reviewer attestations. Overall source completeness is explicitly false, not inferred from matching.
- Offline authoring reads bounded regular files from a single no-follow descriptor, checks stable descriptor metadata and declared digests, emits a non-overwriting review draft and makes no network/approval call.
- API requires an admin role and returns private/no-store responses. Contract save records a hash/audit and supersedes pending observations; refusal audits omit private rationale and fail closed if storage fails.
- Manual change/baseline approval recomputes artifact coverage and cannot waive missing units or attachment publication holds. Rebaseline only requests future confirmation; it does not write a snapshot.
- Attachment checks distinguish original entity bytes from extracted representation, require exact identity/links/raw digest/text coverage and preserve original PDF bytes. Main 304 reuse is disabled when attachments are expected. Cross-origin attachments stay held; transport redirects are refused before their targets are contacted.
- Clause units are reviewed paragraph/list blocks and row units are structural table blocks. No legal-semantic recall or complete-source/500-per-day qualification was established here.

## Executed evidence

Both base-resolution scripts ran with `sandbox-exec` under the existing OS-denied TCP/IP profile. They perform no policy, hosting or model requests. Raw positive/negative output is in `base-publication-reproduction.jsonl`. No application source, Git state, database or service was modified. This review did not repeat the full application suite or hosted UI/browser tests. Other findings above are source inspection and are labeled accordingly.

## Additional unqualified diagnostics

Child HTTP failures currently collapse to `attachment_capture_failed`/`attachment_response_not_complete`; bounded HTTP status, transport proof and Retry-After are not retained or propagated into the parent's origin backoff. Thus a parent 200 with an attachment 429 can still issue other bounded child requests and be reported as a generic child failure. The four-request bound remains, and publication stays held. This is a residual diagnostic/rate-limit limitation from inspection, not an executed source-load result or an additional proven publication bypass.
