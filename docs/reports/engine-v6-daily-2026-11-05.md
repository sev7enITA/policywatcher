# Engine 6: bounded temporal target met, 5 November 2026

The frozen 12-source cohort has **three accepted live dates: 2, 4 and 5 November**, with a minimum per-source span of **71.894495 hours**. The 5 November window recovered **12/12 sources through direct HTTP 200 in 39.631 seconds**, with twelve attempts and no retry, fallback or 304. The minimum gap from the previous accepted source observation is **23.886620 hours**. This completes only the bounded temporal acquisition gate. It does not qualify source completeness, real 500-source capacity or production operation.

## Frozen identity and preserved history

Candidate `050af196bb48a26d86f3bfb0857365e88e238d8a` and manifest `395db5778b5fab8d15d2add676547547d27422fcedc5c991f26057beeacf0e38` stayed unchanged. Implementation `a7895b12d7f505e9d7df0cb7804608aabddc6f15c6266dc6f029326b8ee14489`. Window `2026-11-05T19-56-49-697Z` ran from 19:56:49.697 to 19:57:29.328 UTC, or 20:56 to 20:57 Europe/Rome. Live status verified implementation and artifact integrity before and after capture. No unsealed windows remain.

The four attempted windows remain intact:

| Date | Sources | Seconds | Counted |
| --- | --- | --- | --- |
| 2 November | 12/12 | 35.287 | Yes |
| 3 November | 11/12; Meta direct and HTTP/2 timeout | 162.566 | No |
| 4 November | 12/12 | 46.168 | Yes |
| 5 November | 12/12 | 39.631 | Yes |

The failed 3 November attempt is not erased by later recovery. Three successes in four scheduled attempts are not a statistical reliability estimate or a weekly-variability test. The previous-parser cohort remains separate and incomplete. No observation is attributed to main or the private hosted artifact.

## Bounded source comparison

Eleven extracted-text hashes match both 2 and 4 November. AWS Service Terms differs again: **52 additional characters relative to 4 November**. Inspection of the retained snapshots identifies the displayed update date, sections 1.24, 50.1, 50.10, 50.13 and heading 50.17. Amazon Quick references become AWS Quick; sections 50.10 and 50.13 add AWS assistant Free Tier references. These are observed text differences, not a legal interpretation, completeness approval or public change notification. The prior section-83 change remains in the history. Exact local diff and its digest are retained in the JSON receipt.

The AWS PDF still has unverified language and zero extracted headings. Its retained body is a decoded representation, not original PDF bytes. `Age: 71856` is recorded; HTTP 200 does not establish origin freshness. Parser warnings remain in the probe log.

## Measurements and remaining qualification

The window retained **6,794,849 decoded body bytes** and **935,699 extracted characters**. Median per-source processing duration: **1,759 ms**. Nearest-rank p95: **4,744 ms**, from only twelve local Mac sources. Total duration includes pacing. This is not a 500-source VPS benchmark; peak memory, storage growth/restore and model costs were not measured here. No model inference or fresh Gemini/GLM review was performed.

Remaining gates are explicit: occurrence-aware source completeness and critical-clause annotation; original PDF preservation, language and structure; origin freshness; false change and unsupported-claim evaluation; realistic distinct-source workload and hosting contention; backup/restore and retention; independent security review. No source is approved from HTTP success or matching hashes. Publication and notifications remain disabled; no hosted scan, public baseline or production engine activation occurred.

## Completion and delivery

Daily captures for this bounded three-date gate stop here. A future temporal campaign needs a new explicit question, duration and acceptance protocol. The next work is qualification of the residual gates, not collecting more green days without a purpose.

The cumulative bilingual diary replaces the unshipped 4 November diary candidate while preserving its artifact and checks. It is prepared on stable product **5.5.0**, separately from the frozen candidate. Git integration, wiki publication, staging validation and production deployment have distinct receipts; this execution report alone does not claim website delivery. See the [machine-readable evidence](engine-v6-daily-2026-11-05.json).
