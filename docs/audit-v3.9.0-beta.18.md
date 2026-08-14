# PolicyWatcher 3.9.0 Beta 18 release audit

Date: 2026-07-29

## Release scope

Beta 18 refines the public evidence workflow across Collections, Evidence Packets, Developers and Integrations. It does not change the publication gate, evidence schemas, collection storage boundary or API write capabilities introduced in earlier releases.

## Implemented changes

- Collections uses one register-first DOM and visual order at every breakpoint.
- Mobile Collections presents a compact three-step workflow and reciprocal navigation between the register and ledger.
- Empty and zero-selection states omit controls that cannot perform an action and provide links to evidence and methodology guidance.
- Evidence Packets presents the available register before the explanatory provenance stages.
- Developer documentation presents public API v1 before the Enterprise API v2 pilot and states separate standard and collection rate limits.
- Developers and Integrations use the compact service footer.
- Programmatically focused mobile collection regions use a visible focus outline.

## Verification

- Independent UI/UX evaluation: PASS after correction of the programmatic-focus indicator.
- Responsive inspection: 320, 375 and 768 pixel widths without horizontal document overflow.
- Automated tests: 444 passed.
- TypeScript: passed.
- Scoped ESLint: passed.
- Next.js production build: passed.
- Release archive verification: required files, version consistency, traversal checks, forbidden runtime/database checks and SHA-256 generation are enforced by `scripts/package-release.sh`.

## Known verification limit

The local development database contained no public evidence records. The selected and populated collection states were therefore verified through code review and regression tests rather than a populated visual fixture.

## Interpretation boundary

These changes improve navigation, hierarchy and control availability. They do not establish measured task-completion improvements, accessibility certification, legal compliance, source completeness or production adoption.
