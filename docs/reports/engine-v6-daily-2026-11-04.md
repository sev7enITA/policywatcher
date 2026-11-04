# Engine 6: second accepted date, 4 November 2026

The live window recovered **12/12 sources over direct HTTP 200** in **46.168 seconds**, without retries, fallbacks or 304 responses. The frozen cohort now has **2 accepted dates of 3**, on 2 and 4 November. Its minimum per-source span is **48.007058 hours**. The temporal target remains unmet because a third distinct date is still required.

## Identity and execution

- Frozen source `050af196bb48a26d86f3bfb0857365e88e238d8a`, unchanged and clean.
- Manifest `395db5778b5fab8d15d2add676547547d27422fcedc5c991f26057beeacf0e38`.
- Implementation `a7895b12d7f505e9d7df0cb7804608aabddc6f15c6266dc6f029326b8ee14489`.
- Window `2026-11-04T20-03-30-125Z`, from 20:03:30.125 to 20:04:16.293 UTC (21:03 to 21:04 Europe/Rome).
- Capture started 23.419820 hours after the latest attempt in the rejected 3 November window, exceeding the additional conservative 20-hour condition. This interval was calculated after capture from the retained timestamps; it is not a fabricated preflight log.
- Isolated local database target; publication and notifications disabled. No model inference, new Gemini/GLM review, hosted scan or production engine activation.

`status` verified the frozen implementation and preserved artifact hashes before capture. Final assessment accepts the new window and retains the rejected 3 November window with `window_incomplete` and `source_denominator_mismatch`. Its two Meta timeouts and all thirteen attempts remain intact. Today's Meta response completed direct acquisition in 1,498 ms; this recovery does not retroactively count the failed date or establish a root cause.

## Retained-source comparison

Eleven of twelve extracted-text hashes match 2 November. AWS Service Terms retains the same changed text hash observed on 3 November: the update-date and section-83 difference previously recorded persists. All eleven text hashes available from the failed 3 November window recur today; Meta matches its 2 November text. These comparisons concern saved snapshots, not complete upstream documents or equivalence of legal meaning. There is no published policy-change notice or completeness approval.

AWS PDF language remains unverified, with zero extracted headings. The retained payload is a decoded representation, not original PDF bytes. Its response carried `Age: 55411`; HTTP 200 and unchanged text do not establish fresh origin bytes. The original parser log and cache validators are retained.

## Scale and remaining gates

The window retained **6,790,450 decoded body bytes** and **935,647 extracted characters**. Median per-source processing time was **1,844 ms**; nearest-rank p95 was **5,081 ms** for this 12-source sample. Processing time includes extraction, while total elapsed time also includes pacing. These are local Mac observations, not 500-source VPS throughput, peak-resource measurements or model-cost estimates.

Source completeness, real 500-source capacity and production qualification remain false. The previous-parser cohort is separate and still incomplete. The next new date is **5 November**, with the conservative all-source 20-hour threshold at **16:04:14.693 UTC / 17:04:14.693 Europe/Rome**. Run at most one scheduled capture in that new date after checking actual state; do not retry today's completed window. Three accepted dates would establish only a bounded temporal observation, not complete qualification.

## Delivery boundary

The [machine-readable receipt](engine-v6-daily-2026-11-04.json) retains the full window receipt, all attempt metadata, status and comparisons. The bilingual diary update is prepared on the stable **5.5.0** line. Git and wiki publication are separate from website deployment. Any website release must pass staging before production and restore the exact private Preview r2 with its preserved database; the delivery receipt will record the actual outcome.
