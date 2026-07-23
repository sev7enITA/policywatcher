# PolicyWatcher 3.8.3 Beta 2 — Security and Release Review

Date: 2026-07-23

## Scope

Beta 2 closes the four CodeQL findings reported against Beta 1, adds an API integration boundary, executes the extension in a real Chromium profile and updates the store status language. It does not claim store approval or stable readiness.

## CodeQL closure

1. Sender labels are derived from visible text, email syntax is removed separately and angle brackets are normalized as individual characters. The extension continues to render extracted values only through form values and `textContent`.
2. The forwarded-header rejection expression groups the start-anchored header branch explicitly, removing ambiguous alternation precedence.
3. Two source-contract assertions use regular-expression literals rather than template-looking string literals.

Behavioral regressions cover hostile sender labels, removal of email addresses and rejection of forwarded-message headers. Remote CodeQL must be green before the Beta 2 release is considered complete.

## Integration evidence

- The inquiry route test applies every repository SQL migration to a disposable SQLite database.
- It invokes the actual `POST /api/policy-inquiries` handler, persists an unknown-company request through Prisma and verifies URL minimization.
- It submits a forbidden `rawText` key and proves that the handler returns `400` without adding a database row.
- Next.js `after()` and SMTP delivery are isolated because they are platform/external side effects; the test asserts that the post-persistence scheduling boundary is reached.

## Browser evidence

`npm run extension:smoke` launches Playwright Chromium with only the PolicyWatcher extension enabled. It resolves the real Manifest V3 service worker, opens the `chrome-extension://` popup and verifies the disclosure, persistent Beta label, capture step, manual review and local privacy boundary. The command writes a JSON receipt and synthetic screenshot when `POLICYWATCHER_EVIDENCE_DIR` is configured.

## Dependency response

The release updates Next.js to 16.2.11 after the registry began reporting high-severity advisories against versions below 16.2.11. A zero-high dependency audit is a release gate.

## Residual gates

- Chrome Web Store and Edge Add-ons submission require authenticated publisher accounts and a restricted tester audience.
- Safari requires Apple Developer signing, bundle identifiers, an App Store Connect record and TestFlight review.
- Automated smoke evidence is not a substitute for the limited-tester observation cycle described in `docs/beta-evidence-cycle-v3.8.3.md`.
- Stable promotion remains blocked until one complete evidence cycle meets its exit criteria.
