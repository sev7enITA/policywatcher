# Engine 6: first daily observation of the frozen table-escaping candidate

On 2 November 2026, **12 of 12 configured sources returned HTTP 200 and completed extraction in one live acquisition window**. This is **day 1 of 3**, with **0 hours of within-cohort temporal span**. No completeness, 500-source capacity or production qualification is granted.

## Identity and execution

- Frozen code: `050af196bb48a26d86f3bfb0857365e88e238d8a`.
- Cohort: `engine-daily-cohort-20261101-table-escaping`.
- Manifest: `395db5778b5fab8d15d2add676547547d27422fcedc5c991f26057beeacf0e38`.
- Implementation: `a7895b12d7f505e9d7df0cb7804608aabddc6f15c6266dc6f029326b8ee14489`.
- Window: `2026-11-02T20-03-07-722Z`, started 20:03:07.722 UTC, completed 20:03:43.009 UTC (21:03 Europe/Rome).
- 12 direct acquisitions, 12 attempts, 0 retries, 0 HTTP 304 responses, 0 reported source-drift results. Elapsed wall time: **35.287 seconds** on the local Mac.
- The preflight checked all 12 previous-cohort observations: the minimum elapsed gap was **24.5546 hours**, exceeding the required 20 hours. Frozen source and manifest remained unchanged.
- Acquisition ran with an isolated database target and publication/notifications disabled. No model inference, renderer, archival fallback or production scan was performed.

[Machine-readable receipt and per-source hashes](engine-v6-daily-2026-11-02.json) retain observation times, transport/cache metadata, extracted sizes and qualification flags. Raw source bodies and private configuration stay outside Git.

## Observed source diagnostics

| Source | HTTP | Extracted characters | Language metadata | Headings |
| --- | ---: | ---: | --- | ---: |
| aws-service-terms | 200 | 301,235 | en-US | 111 |
| aws-dpa-pdf | 200 | 29,403 | unverified | 0 |
| openai-service-terms | 200 | 17,149 | en-US | 18 |
| stripe-restricted | 200 | 25,505 | en-IT | 59 |
| stripe-privacy-it | 200 | 94,175 | it-IT | 32 |
| google-privacy-en | 200 | 91,188 | en | 122 |
| google-privacy-it | 200 | 106,965 | it | 122 |
| microsoft-services | 200 | 121,815 | en | 37 |
| apple-privacy | 200 | 28,124 | en-US | 14 |
| anthropic-terms | 200 | 36,241 | en | 17 |
| meta-privacy | 200 | 54,855 | en | 11 |
| tiktok-eea-terms | 200 | 28,650 | en | 10 |

These are transport and extraction diagnostics, not reviewed completeness approvals. The AWS PDF still has no verified language metadata or extracted headings. Its persisted body is a decoded representation rather than the original PDF file. The observed AWS PDF response carried `Age: 62392`; OpenAI carried `Age: 720`. A newly executed HTTP request does not prove that a CDN response was freshly regenerated at the origin. These limits remain visible rather than being converted into successful source-contract checks.

## Temporal boundaries and next work

Only completed live windows on distinct Europe/Rome dates count. Each source needs at least 20 elapsed hours between counted observations and at least 48 hours from its first to last observation, across at least three dates. The next all-source 20-hour threshold is **3 November 16:03:41.409 UTC**. To safely clear 48 hours without counting a premature final window, start the third window no earlier than **4 November 20:03:43.009 UTC (21:03:43 Europe/Rome)**. A scheduled 21:00 start on that date would be too early; the automation must respect the actual timestamps.

The previous parser cohort retains its two dates (31 October and 1 November) and 20.77-hour span. Those observations are not combined with this cohort. Offline replay and hosted smoke/deployment checks add no days. This checkpoint is also distinct from the private hosted implementation and the product 5.5 source on main.

Independent source annotation and the realistic 500-source live campaign remain outstanding. The 12-source timings above cannot be extrapolated into a qualified service capacity, model-cost estimate or completeness score. Existing Gemini/GLM reviews remain opinions about their recorded candidates; no new model review is claimed here.

## Public delivery boundary

This report and the accompanying diary text describe new experimental evidence. Any website publication uses the stable product 5.5 line, staging verification and the same immutable archive in production, followed by restoration and verification of the exact private Preview and its database. Publication state is recorded separately from the successful capture.
