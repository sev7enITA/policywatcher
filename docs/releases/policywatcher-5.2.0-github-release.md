# PolicyWatcher 5.2.0 - Adaptive Acquisition Evidence

26 October 2026. Source release with optional, disabled-by-default shadow observation.

The new acquisition evidence loop makes extraction experiments inspectable. It preserves the operational baseline, compares candidate recipes against frozen inputs and keeps candidate lessons outside operational use until independent evidence supports a reviewed decision.

## Included

- Allowlisted shadow observation with a per-scan budget, at most three recipes and no candidate-triggered second acquisition.
- Private captures, immutable receipts, reproducible replay, train/holdout and independent-label gates.
- Explicit locale/region drift rejection and separate live, partial and historical acquisition dimensions.
- Read-only Source Reliability UI for scan outcome, saved observations, baseline/observer errors, summary-write failures, exclusions and recipe comparisons.
- Synchronized EN/IT release record, changelog, roadmap, Feature Atlas, Release Impact, discovery text and current press assets.

- Security maintenance: Next.js / matching lint configuration 16.4.3, Nodemailer 10.1.4 and patched resolved Undici.

## Limits

Shadow requires private operator configuration and remains disabled by default. This release does not activate a production experiment, promote recipes automatically, train a model or establish calibrated confidence. Provisional labels cannot validate their own lessons. Raw captures and private failures are excluded from public output.

The local pilot on eight public sources was a functional observation, not an accuracy benchmark or a statistically established improvement. Broader independent labels and prospective validation remain planned. Existing source-quality, publication and change-confirmation gates remain authoritative.

See [the replay and shadow protocol](https://github.com/sev7enITA/policywatcher/blob/v5.2.0/evals/scraping/README.md), [the public roadmap](https://policywatcher.online/roadmap) and [the release record](https://policywatcher.online/press-kit/releases/adaptive-acquisition-evidence-5-2-0). Production publication is recorded separately in the release verification report.
