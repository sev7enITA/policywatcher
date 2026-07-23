# PolicyWatcher 3.8.3 - Limited Beta Evidence Cycle

## Status

- Channel: `v3.8.3-beta.3`
- Cycle: `01`
- Started: 2026-07-23
- State: **technical evidence started; limited-store activation pending publisher access/review**
- Stable promotion: **blocked**

The automated Chromium receipt is the first technical artifact for this cycle. It does not by itself complete the real-user Beta cycle.

## Restricted audience

- Chrome: private or unlisted trusted-tester distribution.
- Edge: the narrowest hidden or controlled audience available in Partner Center.
- Safari: internal or external TestFlight group after signing and Beta App Review where required.
- Target: 5–15 invited testers using synthetic or non-confidential notices only.

## Privacy-safe evidence to collect

For every session, retain only:

- Beta version and browser family/version;
- outcome category (`matched`, `monitored_no_verified_change`, `queued`, `ambiguous`, `conflict`, `offline`, `error`);
- whether organization, policy categories and a direct policy URL required correction;
- elapsed step and completion state;
- defect category and severity;
- tester consent to the Beta terms.

Never collect raw notification text, subject, email address, recipient, attachments, screenshot of a real inbox, authentication data or private policy-link tokens. Feedback screenshots must use synthetic content.

## Cycle exit criteria

One cycle is complete only when all conditions hold:

1. at least seven calendar days of availability;
2. at least five invited testers and twenty completed synthetic/non-confidential checks across at least Chrome and Edge;
3. at least one signed Safari TestFlight validation, or an explicit documented Safari external-blocker decision;
4. no open P0/P1 security, privacy, data-loss or false-success finding;
5. at least 95% of sessions complete without an unexplained runtime failure;
6. every stored inquiry receipt corresponds to an item visible in the admin queue;
7. privacy review confirms that no prohibited raw content entered logs, storage, alerts or feedback;
8. CodeQL, tests, extension smoke, lint, TypeScript, build and high-severity audit remain green on the candidate revision.

## Decision record

At cycle close, record tester count, browser matrix, session totals, outcome counts, defects, privacy incidents, unresolved limitations and the explicit decision: continue Beta, issue another Beta, or promote to stable. Do not promote automatically.
