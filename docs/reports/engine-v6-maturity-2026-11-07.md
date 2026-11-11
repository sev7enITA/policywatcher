# Engine 6 maturity and demonstrated benefits, 7 November 2026

**Assessment: an operational private Preview, with O1 complete and O2 qualification still open. It is not yet a qualified replacement for the stable scanner.** This is a synthesis of the dated observations below, not a new benchmark, formal certification or percentage-complete estimate.

| Benefit | Observed evidence | Practical limit |
| --- | --- | --- |
| Better text coverage in an inspected case | The earlier r2 Apple comparison retained all 81 visible paragraph/list-item occurrences opened in the independent browser reference; the established extractor replay retained 6/81. | One inspected document, a later browser request, no linked annexes/PDFs or human completeness sign-off. It does not qualify the entire catalogue or the different r3 candidate. |
| Explicit holds instead of silently treating processing as verified evidence | The r3 four-policy Apple run completed in 8.027 seconds: one direct HTTP 200 held pending confirmation; three missing-contract holds with no acquisition attempted. | This proves the observed hold behaviour. It is not a measured reduction in false alerts. AI analysis and verifier stages were not reached. |
| Inspectable private operations | r3 deployment, migration and isolation checks passed; saved reports persist, publication and notifications are disabled, and official data remained unchanged in the bounded run. | Operational evidence is separate from the correctness of policy interpretation. |
| Durable claim/evidence model | The ledger schema is integrated and deployed. PostgreSQL CI exercised migration, write, approval, rollback, uniqueness and cascade deletion. | The hosted r3 ledger remains empty. Successful writes on hosted semantic-analysis output and a dedicated ledger browsing UI are still missing. |
| Measurable failure and recovery behaviour | The local fixed 500-endpoint trial accounted for all outcomes: 498 attempted, 383 transport-accepted, 342 text extractions, 584.979 seconds. A separate injected-lease probe settled all 500 synthetic attempts. | Acquisition/extraction on a Mac without the full model/verifier path is not 500 fully processed policies/day on the intended host. Injected expiry is not a long-running natural-failure rehearsal. |
| A bounded temporal baseline | Frozen candidate 050af19 acquired 12/12 sources on three distinct dates across at least 71.894495 hours; the failed fourth scheduled attempt remains retained. | This qualifies only that candidate's bounded acquisition protocol, not r3, source completeness or general reliability. |

## Maturity by layer

- **Private operation:** demonstrated for a bounded run; production shadow operation has not started.
- **Acquisition and extraction:** promising, with a concrete Apple improvement and explicit network/extraction failure accounting. General completeness remains unqualified.
- **Evidence controls:** implemented and partially exercised. Four of six incomplete synthetic documents still satisfy the current boundary contract, showing why headings and length alone cannot establish completeness.
- **Semantic analysis and separate verification:** implemented, but accuracy on an independently reviewed corpus is unqualified. Quoted text can still support an incorrect interpretation.
- **Scale and resilience:** bounded local measurements exist. Full 500-policy/day processing, natural interruption recovery, hosted restore and retention need qualification.
- **Public operation:** Engine 6 automatic publication and notifications remain disabled. The public product keeps the established scanner.

## Next evidence needed

First qualify a reviewed sample end to end: document identity and scope, occurrence-aware completeness (including tables/annexes/PDF originals), true changes and unchanged cases, misleading interpretations with correct quotations, durable hosted ledger writes and review outcomes. Then measure the complete pipeline on a fixed reviewed 500-document catalogue on the intended host, including resource use, delays, failure accounting and recovery. A production-shadow decision follows those gates; automatic publication follows a further explicit release decision.

No numerical accuracy, cost saving, general speedup, reduction in false alerts, source-completeness percentage or search-ranking benefit has been established. Gemini/GLM reviews are advisory input, not executed qualification.

## Sources

- [6 November acquisition, Apple comparison, falsifiers and recovery report](https://github.com/sev7enITA/policywatcher/blob/734729732fe1b494f844406f719ce2005a4c4d6b/docs/reports/engine-v6-qa-2026-11-06.md)
- [r3 O1 closeout and remaining limits](https://github.com/sev7enITA/policywatcher/blob/6d21b2fc1adb1340726805d5018aab58b773b039/docs/reports/engine-v6-preview-r3-o1-closeout-2026-11-07.md)
- [Operationalization stages O0–O4](https://github.com/sev7enITA/policywatcher/blob/ac0ebad/docs/architecture/engine-v6-operationalization.md), with its historical pending-run status superseded by the O1 closeout above.
- [Frozen temporal cohort report](engine-v6-daily-2026-11-05.md)
