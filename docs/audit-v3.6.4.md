# GitHub Auditor Remediation — Release 3.6.4

Date: 2026-07-21

Release 3.6.4 closes the six findings raised against the 3.6.3 Guided Evidence Workflows pull request.

| Finding | Remediation | Regression evidence |
|---|---|---|
| Discovery jobs stored in `globalThis` | Added `PolicyDiscoveryJob` persistence, atomic run-token claims, stale-run recovery, and guarded completion/failure updates. | `policyDiscoveryJobs.test.ts`, `auditRegressionWiring.test.ts` |
| Unhandled discovery JSON parsing | Both discovery mutation handlers use `readJsonObject` and return controlled validation responses. | `requestBody.test.ts` |
| Batch not refreshed after publication QA failure | Item rollback, append-only review event, and batch reconciliation now run in one database transaction. | `sourceOnboarding.test.ts`, `auditRegressionWiring.test.ts` |
| Existing candidates rejected by bulk intake | Proposed candidates are reused; rejected candidates are reopened only with a review-log event; approved and active candidates remain protected. | `sourceOnboardingCandidate.test.ts` |
| Continuous device-motion listener | Removed hardware motion listening; viewport, pointer, and orientation context remain. | `mobileContext.test.ts` |
| Countdown based on elapsed milliseconds | Countdown now compares UTC calendar days. | `observatory.test.ts` |

Migration `20260721120000_policy_discovery_job` adds operational job metadata only. It does not change policy text, snapshots, changes, risk analysis, or public-evidence flags.
