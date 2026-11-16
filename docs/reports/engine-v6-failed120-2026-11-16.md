# Assessment of 120 held scopes, 16 November 2026

## Attribution

The original 500-scope live trial retained 120 unsuccessful or held scopes. The [case register](engine-v6-failed120-2026-11-16/cases.json) accounts for every one. Attribution follows observed evidence. A refusal, DNS failure or redirect does not establish fault by a publisher.

| Classification | Cases | Evidence and remaining decision |
| --- | ---: | --- |
| Engine | 13 | Identical accepted bodies now extract after the fixes. Ten false CAPTCHA detections and three container/body-selection failures. |
| Source access or origin backoff | 32 | HTTP403 or origin suspension after a refusal. Includes requests skipped by backoff. |
| Static delivery or source reference | 23 | Empty/script-driven responses, insufficient scoped text, redirect notices or unresolved fragments. Rendering and source-identity review are still due. |
| Source reference | 5 | Four HTTP404 outcomes and the Google Chrome policy URL's actual soft404. |
| Source interstitial | 1 | An Amazon continue-shopping gate contains legal footer links. It remains held. |
| Undetermined | 46 | 35 redirect outcomes, five DNS failures, four connection failures and two HTTP202 pending responses. |

The source/delivery groups describe observed conditions. They do not establish general provider unavailability. The missing-fragment cases retain their original scope. The assessment does not widen them to whole-document sources.

## Changes and controls

The old block detector searched the first 2,000 raw HTML characters. Energia's comment mentioning reCAPTCHA, Evernote's hCaptcha script and LinkedIn's data attribute incorrectly triggered a block. The candidate uses parsed title/heading and visible body-prefix text, strong Cloudflare challenge markers and standalone CAPTCHA widget checks. It retains actual challenge phrases and origin refusals. A padded challenge must still fail.

The selector could choose a 21-character AT&T skip-navigation container or a 27-character Deliveroo cookie-settings link. Candidates below the existing source minimum now yield to the existing body fallback. DistroKid's unstructured body clauses are retained for review. Missing or multiple document roots still produce mandatory holds, even with otherwise matching source contracts. The Amazon shopping gate receives an explicit interstitial hold.

The [fixed-body replay](engine-v6-failed120-2026-11-16/replay-final-summary.json) extracts 393 of the same 500 scopes, recovering thirteen and losing zero of the previous 380 extraction successes. All bodies were checked against their recorded hashes. The [per-scope replay](engine-v6-failed120-2026-11-16/replay.json) records current hold reasons and text hashes. Extraction is one stage of qualification.

Eight regression assertions fail on the parent implementation and pass on the candidate. All 222 focused scraper/engine tests pass with operating-system network access denied. TypeScript checking passes. Public regression fixtures reproduce passive CAPTCHA integrations, short selector errors, a padded challenge, body-only evidence and the mandatory hold. Source pages remain private local artifacts.

## Independent challenge

The [local Qwen review and dispositions](engine-v6-failed120-2026-11-16/review-and-tests.json) distinguish model opinions from executed tests. LM Studio loaded the locally available Qwen3.8 27B Uncensored. The first request timed out. A bounded native-API request then returned a source review. Its advice to accept very short copyright stubs was rejected because the existing source minimum and identity gates still apply.

GLM Max refused the request during peak hours. The Flash alternative requires human security verification. Gemini 4 Argon High produced no usable web review and its dedicated free API returned HTTP429. No approval is attributed to those attempts.

## New live campaign and delivery

The [new candidate context](engine-v6-failed120-2026-11-16/run-context.json) freezes a different implementation identity and retains the original 500-scope catalogue hash. This is a new campaign motivated by code changes. The prior results and all failures remain preserved.

The live campaign uses the existing three-worker, per-origin paced acquisition harness with isolated output, direct/HTTP2 transport, no model calls, no source approval and no publication or notification. A renderer is not configured for this diagnostic. This stage cannot establish source-wide completeness, semantic accuracy, daily reliability or intended-VPS throughput.

Git integration, stable website publication and exact private r3 restoration require their own delivery receipts. Source changes and public diary delivery have separate release identities.
