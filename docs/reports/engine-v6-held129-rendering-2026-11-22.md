# Engine 6 - the 129 remaining scopes and selective rendering, 22 November 2026

**Fresh HTTP observation: 129/129 original scopes processed, zero new extractions. Source completeness and 500 fully verified policy completions per day remain unqualified.** This report preserves failed and suspended outcomes. The public stable scanner and the hosted private r3 are separate deployments.

## Exact source set and HTTP results

The [129-source catalogue](engine-v6-held129-rendering-2026-11-22/catalogue-129.json) derives from the original 133-source follow-up by excluding only the four scopes whose extraction completed on 21 November. Those four remain unqualified for independent completeness; they have not become approved baselines. No replacement URL, language or document type was adopted.

The isolated Hostinger process ran on source `c96b4f08fc93e6a35acb1acda30122f894f53a39`, Node 24.22.3, with a 384 MiB heap cap, three workers, one request per origin, 1.5-second pacing and origin backoff after 429/503. It started at **06:27:38.309 UTC** and saved its report at **06:31:49.069 UTC**, a duration of **250.760 seconds**. It used a new output directory and SQLite database; models, publication and notifications were disabled. This is acquisition/extraction, not the hosted supervised worker or the full analysis/publication pipeline.

| Measure | Observed result |
|---|---:|
| Original remaining scopes / HTTP endpoints / origins | 129 / 129 / 69 |
| Completed endpoint records | 129 |
| Direct/HTTP2 chain attempts | 228 |
| Accepted HTTP responses | 27 |
| Completed extractions | 0 |
| Transport rejection | 98 |
| Extraction size hold | 24 |
| Origin-backoff hold | 4 |
| Block / soft404 hold | 3 |
| Saved response bodies verified against receipts | 161 / 161 |

The 27 accepted responses overlap the 24 size holds and three block/soft404 holds; they are not additional successful policy completions. These state counts match the preceding follow-up, but changing live responses do not prove identical underlying causes. [Full HTTP report](engine-v6-held129-rendering-2026-11-22/static-report.json), [context](engine-v6-held129-rendering-2026-11-22/static-context.json), [body integrity](engine-v6-held129-rendering-2026-11-22/static-body-integrity.json).

## Evidence epochs and retained failures

The local `remote133/bodies` directory contained the 16 November baseline. Reusing its filenames with the 21 November report would have joined different captures: only 47 of 165 referenced hashes matched that older directory, 110 differed and eight filenames were absent. The actual 21 November files were recovered separately from the isolated host directory: **165/165 hashes match**. The fresh 22 November files are in a third directory: **161/161 match**. The four-body count difference is exactly the four previously extracted scopes excluded from this campaign. [Epoch reconciliation](engine-v6-held129-rendering-2026-11-22/body-epoch-denominators.json).

The first SSH setup timed out, and the first process invocation failed before retrieval because its output parent directory was absent. Both errors remain saved locally. During the actual run the SSH output connection reset after 43 logged records. A separate read-only check found all 129 saved receipts, the final report and no running probe. The complete saved output was then downloaded and verified; no URLs were rerun to replace a failure. The initial archive extraction guard also rejected the top-level directory before extraction; the corrected guard admitted only the expected directory and regular files.

## Independent triage and rendering boundaries

The [per-source matrix](engine-v6-held129-rendering-2026-11-22/triage-held129-matrix.csv) preserves all 129 cases and historical categories. Triage of the exact 21 November bodies identified seven conditional priorities and nine secondary dynamic-page hypotheses. Eight other extraction holds require source identity, format, fragment or migration review before treating rendering as a remedy. These are hypotheses, not recovered sources.

The Chrome Privacy Notice response explicitly declares that notice retired. Forbes contains substantial static privacy text but lacks the configured fragment; removing the fragment would widen the scope. Apple, Amazon Ads and Kraken demonstrate source-identity or path-review needs. ASUS and BankID expose HTML refreshes and language/document migration evidence. A browser reaching another page does not approve that page as the requested policy.

Before any renderer call, independent review found two Binance HTTP 202 bodies carrying an active AWS WAF challenge. The provisional shell heuristic would have selected them; they were excluded and the corrected guard passed 25 offline tests. An Amazon UK form posting to validateCaptcha was also excluded; Amazon Ads and Kraken path drift were held before execution. Passive script references and active challenges must remain distinct. The current remote renderer reports version 1.2.0, Chromium 149 and capacity three; the follow-up uses at most one request at a time and does not upgrade the service. A renderer failure can stop the campaign; no restart or repeated challenge attempt is authorized by this protocol.

## Executed rendering follow-up

The eligible set was frozen before execution in a hash-bound plan: **16 selected scopes out of 129**, with fresh body and timestamp checks, an unchanged engine closure and separate harness identity. [Public plan](engine-v6-held129-rendering-2026-11-22/render-plan-public.json) redacts the renderer endpoint but records the exact original plan SHA256 `aa9d1587c1b1fa7bac995be5bb826ef9f2d85bf4318a8ef4b87f81cc2b3cea2c`.

The local orchestration process used the configured remote renderer in series, from **06:57:54.028 to 06:58:25.106 UTC**, **31.078 seconds**. It ended naturally with exit zero. There were **11 API requests**: three HTTP 200 rendered DOMs and eight renderer-level `domain_not_allowed` rejections. Five later scopes on already denied origins were not attempted. Those eight requests did not retrieve their intended origins: this is a configuration limit, not evidence of publisher failure. The service allowlist and configuration were not changed.

| Rendered representation | Parsed characters | Observed language | Identity/path diagnostics |
|---|---:|---|---|
| Meta AI Terms, original Facebook URL | 14,790 | en | No reported host/path/query drift |
| EU Data Transfer Addendum, original Facebook URL | 4,168 | en | No reported host/path/query drift |
| Facebook Live Policies, original en-gb URL | 1,993 | en | No reported host/path/query drift |

All three saved DOM hashes match their receipts. These are browser DOM representations, not original response bytes or an independent complete-source oracle. The configured catalogue did not declare a reviewed expected language for these cases; observed English is not proof of satisfying such a contract. All three extractions remain held. **126 scopes still lack completed extraction; all 129 remain unqualified for independent completeness.** No aggregate 500-policy success rate is inferred. [Full render report](engine-v6-held129-rendering-2026-11-22/render-report.json), [DOM integrity](engine-v6-held129-rendering-2026-11-22/render-body-integrity.json).

### Independent review of the three rendered representations

A separate offline reviewer verified the DOM bytes, embedded HTML, text hashes, block counts and all UTF-16 block offsets for all three extractions. Four legal passages per document occur both in the inert DOM and extracted text. This is internal consistency, not independent source completeness. [Receipt](engine-v6-held129-rendering-2026-11-22/independent-render-receipt.json), [assessment](engine-v6-held129-rendering-2026-11-22/independent-render-assessment.md).

All three contain the same **12 non-policy UI blocks**, including 11 language-picker blocks and one navigation/account block, at least **364 non-separator characters**. This is at least 2.46% of AI Terms, 8.73% of the addendum and 18.26% of Live Policies. These percentages measure observed added UI text; they are not accuracy or completeness scores. Existing extraction diagnostics retain ambiguous document scope and interactive controls. No text was rewritten to conceal contamination.

The configured catalogue names the EU source **Data Processor Agreement**, while the rendered content identifies **Meta European Data Transfer Addendum**. This is not recovery of the full DPA or all incorporated Data Processing Terms. The AI Terms preamble points to separate regional conditions. All three remain held; no region, expected language or source contract was approved.

### Regression evidence

The independent reviewer checked the exact final harness and all 16 selected HTTP bodies, with 25 offline guard tests passing. Root then ran the integrated guard and bilingual/public-page suites with TCP/IP denied by the operating system: 52 tests passed in four files. It approved only this bounded observational run. [Review receipt](engine-v6-held129-rendering-2026-11-22/final-review.json), [guard log](engine-v6-held129-rendering-2026-11-22/guard-tests.log).

A separate negative test replayed the two exact Binance 202 bodies and Amazon UK CAPTCHA-form body under operating-system denial of TCP/IP. The initial heuristic selected all three and the assertions failed (exit 1); the fixed selector held all three and passed (exit 0). The original launcher attempt failed on a TypeScript top-level-await/CJS mismatch before assertions; the corrected async launcher and both final logs are retained. [Before-review failure](engine-v6-held129-rendering-2026-11-22/negative-parent-final.log), [corrected result](engine-v6-held129-rendering-2026-11-22/negative-current-final.log). This fixes the QA selection harness; it does not claim a new deployed scraper or general detection of all possible challenges.

The harness refuses changed engine closure bytes even when the generated manifest is unchanged, changed report/body/plan/harness hashes, duplicate or widened source sets, reversed/future/older-than-24-hour windows, and a different current commit. These guards are provenance controls, not measurements of source completeness. Report-only completeness remains false. Readiness before and after the run is a point observation, not continuous service availability.

## Model review and acceptance limits

GLM 5.3 Max responded in the native ZCode app to the supplied methodology and numbers. It challenged challenge-shell detection, required a predeclared eligible set and warned that serial execution does not fix the cached Chromium launch failure in renderer 1.2.0. These are advisory observations, not tests performed by GLM. The four-body epoch difference was independently reconciled rather than inferred from the model's wording. No new Gemini or LM Studio response is claimed in this campaign.

No campaign-completion flag or HTTP 200 establishes identity, expected language, document completeness, semantic accuracy or delivery capacity. Every extraction remains held until those independent checks are satisfied. The historical 367/500 remote and four later extraction observations cannot be summed with new observations into a claim of 500 successful daily completions. The frozen older temporal cohort remains untouched.

## Offline reproduction

With the repository dependencies already installed, the source-set derivation and guard tests run without a provider, database or policy request:

```sh
./node_modules/.bin/vitest run src/lib/__tests__/engineHeld129.test.ts
```

On this Mac the stronger executed check was `sandbox-exec -f output/audit-20261122/offline-tsx-ipc.sb` before the Vitest command: TCP/IP denied, only the task TSX Unix IPC directory allowed. The public [negative replay helper](engine-v6-held129-rendering-2026-11-22/negative-real-bodies.ts.txt) uses the retained local response bodies; it is not independently reproducible from metadata hashes alone. Those 161 bodies and original archives remain in local output and the isolated QA host, outside Git. The 25 synthetic/source-set guard tests are reproducible from Git alone with installed dependencies. No fixture date counts as a live campaign observation.

## Delivery status

[PR #79](https://github.com/sev7enITA/policywatcher/pull/79) is integrated in main after six successful CI checks. The cumulative stable 5.5 diary archive passed staging with 12 operational checks, 20 EN/IT page checks, 531 source hashes and native visual inspection. **Production has not received this archive. The exact private r3 restoration is still pending.** Browser control repeatedly moved to another task's LinkedIn composer and timed out; coordination was requested. No successful restore submission was observed. A read-only check retained the original private database with 47 application tables, 22 migrations and zero active tasks; the hosted staging release still identifies the stable test artifact. [Current delivery checkpoint](engine-v6-held129-publication-2026-11-22.md).

The remaining sequence is mandatory: finish exact r3 restoration with its private database, verify evidence hashes and saved reports, then promote the same accepted stable ZIP to production. Do not confuse source integration, successful staging or an uploaded archive with a completed public delivery.

## Next work justified by these results

1. Review and register original document identity, format, region and expected language before extending renderer coverage for ASUS, Alibaba, BankID, Crunchyroll, Gofile, Hoyoverse and Instagram. Preserve the denied and unattempted states; no broad allowlist or service change was made in this campaign.
2. Independently compare the three saved Facebook representations with authoritative page structure and required passages, then propose source contracts for human review. Do not approve them solely because text was extracted.
3. Improve diagnostics for missing fragments and explicit HTML refreshes; preserve the original scope rather than silently replacing it. The Forbes offline counterexample remains open.
4. Stage and verify renderer 1.2.1 admission/launch recovery separately before testing concurrency. Serialization did not qualify or upgrade renderer 1.2.0.
5. After those prerequisites, run a newly identified full-pipeline campaign with explicit expected documents, verification decisions and supervised-host metrics. Existing partial acquisition runs do not qualify 500 completed policies per day.


## Post-observation hardening and CI failures retained

The first CI run rejected a documentation em dash and reported two hostname-substring test warnings plus generic network-to-file writes in the research harness. The heading and URL assertions were corrected. Subsequent harness code confines writes to a private quarantine: explicit basename allowlist, regular directories without symlinks, exclusive no-follow0600 inodes, byte caps and read-back SHA256; its dependency is included in the harness fingerprint. Thirty-four offline guard/quarantine tests pass. This later code did not produce the live observations above; their source remains `18606e9`. All six CI checks passed on `8dffd33890c74eec370ecf9b05218bc51f4eaa3b`, including CodeQL, after a final test-only filesystem-race warning was corrected without removing assertions. PR #79 merged as `7bee80a5a8f4aaa349534ea4e5d89a4b51d0b4f4` at 08:21:04 UTC. No alert was dismissed and no CI setting was weakened.


[Combined 129-case ledger](engine-v6-held129-rendering-2026-11-22/case-ledger.csv) joins each original URL to its separate static/render observations and next action; body epochs and the later unexecuted hardening remain explicit. [Six CI checks](engine-v6-held129-rendering-2026-11-22/ci-head-8dffd33.json), [merge receipt](engine-v6-held129-rendering-2026-11-22/pr79-merge.json).
