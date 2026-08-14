# Release 3.8.2 - Inquiry Handoff Reliability Review

Date: 2026-07-22

## Incident reproduced

A real MioDottore plain-text notice began with `Gentile utente` and ended with
`Il Team MioDottore`. Release 3.8.1 selected the greeting through its generic
line fallback because the signature parser required `Team di` or `Team of`.
The same notice mentioned optional `IA` functionality, but the Italian acronym
was not classified as an AI policy signal.

The production receipt also reported that the inquiry was not registered. The
public UI behaved correctly by refusing to claim success, but the live runtime
had bypassed or failed the database readiness step and therefore could not
persist the administrator ticket.

## Controls added

- Recognize `Il Team Brand`, `Team Brand`, `Il team di Brand` and `The Brand Team` signatures.
- Reject greetings, recipient labels and generic support terms during automatic organization inference.
- Recognize contextual Italian `IA` phrases without treating the preposition `ai` as artificial intelligence.
- Pin the standard production command to `node server.js`; the bridge runs the idempotent SQLite initializer and fails closed before starting Next.js when the schema is unavailable.
- Retry transient SQLite lock/time-out contention with a small bounded backoff before surfacing an unavailable receipt.
- Declare `npm start` and `server.js` in the Hostinger release manifest.

## Production acceptance

After extracting the source package, configure an absolute writable
`DATABASE_URL`, install dependencies and start with `npm start` or `server.js`.
Do not configure `next start` directly. The startup log must end with
`Database schema is ready` and include a `policyInquiries` count.

Then submit a controlled non-personal notice and confirm all of the following:

1. the local summary identifies `MioDottore`, not `Gentile utente`;
2. Privacy, Cookie and IA are detected;
3. the response contains an `inq_` reference rather than a storage error;
4. the ticket appears in `/admin/inquiries` and increments the navigation count;
5. when SMTP is configured, the operational alert reaches the configured administrator without raw message content.
