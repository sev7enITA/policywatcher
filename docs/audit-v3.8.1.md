# Release 3.8.1 — Mobile Inquiry Reliability Review

Date: 2026-07-22
Scope: public `/what-changed` mobile flow, browser-local company extraction, persistence receipts, administrator queue visibility, operator email and Hostinger schema startup.

## Lateral product audit

The previous flow put three numbered stages, five category controls, two dates, an optional URL, a portfolio diagram and a four-step privacy explainer in the critical path. On a phone this converted a simple paste action into a long form. A realistic BlaBlaCar plain-text copy also exposed a parsing defect: `Cosa cambia per te:` could be selected as the company.

Release 3.8.1 changes the primary journey to:

1. paste the visible notification text;
2. see a browser-local company and policy summary;
3. verify with one action.

Only an unrecognized company produces a required correction. Categories, dates and URL are optional and collapsed. Privacy and portfolio scope remain available through a separate disclosure.

## Red-team findings and controls

### False success on unavailable storage

- Prior risk: the storage-unavailable receipt reused the queued eyebrow, creating the impression that an administrator had received a ticket.
- Control: storage failure now renders `Request not registered` / `Richiesta non registrata`, a retry action and confirmation that the raw text was not transmitted. It never shows a reference.

### Invisible operator handoff

- Prior risk: a successful inquiry existed only in `/admin/inquiries`, with no visible queue count and no email alert.
- Control: the admin navigation displays the number of open non-terminal inquiries. A newly persisted inquiry schedules a best-effort SMTP alert using the existing operational recipient chain.
- Canonical source: `/admin/inquiries` remains authoritative. Email is a convenience and does not affect successful persistence.

### Personal-data leakage through operator email

- Control: the email function accepts only the public reference, minimized company/domain clue, policy categories, dates and request kind. It has no raw message, subject, sender, recipient, address, excerpt or fingerprint parameter.
- The public API continues to reject unknown keys and never sends pasted content to AI, fetchers, storage or logs.

### Parser manipulation and misleading identity

- Control: body-signature and update-verb patterns identify likely organization names before line fallback; headings ending in punctuation and generic `what changes` / `cosa cambia` labels are rejected.
- Company/URL conflicts still stop for explicit correction instead of silently preferring the URL owner.

### Duplicate and publication risk

- The database-enforced active dedupe key remains authoritative under concurrency.
- Submitted URLs remain clues and are not fetched before administrator approval.
- Unknown companies still pass official-source review, first baseline and QA before publication. A baseline does not prove a historical change.

## Hostinger rollout invariant

The source archive does not contain SQLite files, environment secrets, `.next`, `node_modules` or Git metadata. Production must use an absolute `DATABASE_URL` outside the extracted release directory. Both `npm start` and direct `server.js` startup run `scripts/hostinger-init-db.sh`, which applies or reconciles `20260721150000_policy_inquiry` before serving requests.

After deployment:

1. confirm the initializer completed against the intended absolute SQLite path;
2. sign in and open `/admin/inquiries`;
3. submit one controlled non-personal test notice;
4. verify that the UI returns a reference and the open-inquiry count increments;
5. when SMTP is configured, verify delivery to `ADMIN_ALERT_EMAIL` without raw notification content;
6. resolve or mark the controlled test ticket as duplicate and confirm the count clears.

If the database is unavailable, no ticket and no email are created. The user is told to retry rather than being shown a false accepted state.
