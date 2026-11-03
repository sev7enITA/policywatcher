# Engine 6: failed daily window retained, 3 November 2026

The live window recovered **11 of 12 sources** and was correctly **excluded from the daily counter**. Meta timed out on direct retrieval and HTTP/2 fallback. The frozen cohort remains at **1 accepted date of 3**, with zero accepted within-cohort span hours. A successful process exit did not turn a missing source into a valid day.

## Identity and execution

- Frozen source: `050af196bb48a26d86f3bfb0857365e88e238d8a`, unchanged and clean.
- Manifest: `395db5778b5fab8d15d2add676547547d27422fcedc5c991f26057beeacf0e38`.
- Implementation: `a7895b12d7f505e9d7df0cb7804608aabddc6f15c6266dc6f029326b8ee14489`.
- Window: `2026-11-03T20-35-49-777Z`; 20:35:49.777 to 20:38:32.343 UTC, or 21:35 to 21:38 Europe/Rome.
- Preflight minimum time since the previous accepted source observation: **24.5353 hours**.
- **13 transport attempts**, comprising 12 direct attempts and one HTTP/2 fallback; no HTTP 304. Total wall time: **162.566 seconds** on the local Mac.
- Eleven HTTP 200 responses completed extraction. Meta direct retrieval aborted after 20,016 ms; its HTTP/2 fallback returned `h2_timeout` after 20,061 ms. No additional campaign capture was retried.
- Isolated database target, publication and notifications disabled, no model inference or production scan.

The runner's `results.completed=12` counts processed source rows. Its raw `window.complete=true` and process exit 0 indicate that processing finished, not that all sources succeeded. The final status rejects the window with `window_incomplete` and `source_denominator_mismatch`. The original fields, failures and all source attempts are preserved in the [machine-readable receipt](engine-v6-daily-2026-11-03.json). No frozen code or manifest was changed to obtain a different result.

## Bounded source comparison

Of the eleven comparable extractions, **ten text hashes match the 2 November snapshot**. AWS Service Terms differs by **342 extracted characters**. Meta is unavailable for comparison; it is not classified as unchanged.

Inspection of the two saved AWS snapshots localized the difference to the displayed update date and section 83. That section now uses an AWS Support heading, includes a paragraph about exploratory support work in non-production environments with a reference to section 110, and nests and renumbers the existing Managed Services paragraphs. The exact local diff is retained with digest `ce9c7fa547895d4ce0bec393bb389ff81afd0ed45ed1e1dd4d946c573af6cf14`.

This is a comparison of retained source snapshots, not a completeness approval, legal interpretation or published policy-change notice. No fresh Gemini/GLM review, model validation or second post-change confirmation is claimed. [Official source](https://aws.amazon.com/serviceterms/).

The AWS PDF still has unverified language and no extracted headings. Its retained payload is a decoded representation, not original PDF bytes. Its response carried `Age: 62893`; HTTP 200 is not proof of origin freshness. The PDF parser also logged font warnings, which remain in the original probe log.

## Scale and remaining qualification

The window retained 4,655,753 decoded body bytes and 880,792 extracted characters. The median per-source processing duration was 7,615.5 ms; Meta is included as a failed source in that duration denominator. These are measurements of twelve configured sources on a Mac, not a 500-source VPS throughput or model-cost benchmark. Source completeness, real 500-source capacity and production qualification all remain false.

The 3 November failure adds **zero valid days**. If the next window succeeds on 4 November, it will be the second accepted date. The third valid date cannot occur before **5 November**, and must still satisfy at least 20 elapsed hours per source since the preceding accepted observation and 48 hours overall. No date is simulated, no failed window is overwritten, and no retry supplies an extra day. The previous parser cohort remains separate.

## Public delivery boundary

The diary update is prepared on the stable product **5.5.0** line. Publication must use staging and the same verified immutable archive in production, with the exact private Preview restored and its monitored table hashes verified. Git integration or a prepared archive alone is not website publication; the delivery receipt is separate.
