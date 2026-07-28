# PolicyWatcher 3.9.0 Beta 12 audit

Date: 28 July 2026

## Scope

Beta 12 adds a local `.eml` file path to the existing What Changed workflow. The release does not connect to Gmail, Outlook or another mailbox, does not register an inbound email address and does not add server-side MIME transport or storage. The existing structured inquiry endpoint and database schema are unchanged.

## Processing contract

The selected file is read through the browser `File` API and decoded by a dependency-free client module. The parser:

- rejects files larger than 256 KB and extracted visible text larger than 20 KB;
- limits MIME nesting to six levels and the entity count to 32;
- decodes RFC 2047 header words, base64 and quoted-printable content;
- prefers `text/plain` inside multipart alternatives and uses reduced inactive text when only HTML is available;
- retains cleaned HTTP(S) policy links found in HTML anchors for local clue extraction;
- excludes `To`, `Cc` and `Bcc` headers, attachments, named MIME parts and active HTML content;
- rejects attachment-only, empty, unsupported and structurally excessive messages.

After local decoding, the established clue parser proposes organization/domain, cleaned URL, policy categories and dates for user review. Only those structured fields can be submitted to `/api/policy-inquiries`. The raw file, visible body, subject, recipient and attachment data are absent from the API contract and persistence model.

## Security and privacy boundaries

- No mailbox permission or persistent browser permission is requested.
- No `.eml` bytes or raw message field are sent to PolicyWatcher.
- No attachment is opened, decoded for display or included in clue extraction.
- HTML is treated as data and reduced to text; it is never mounted as markup.
- Parser limits reduce accidental resource exhaustion but do not establish compatibility with every MIME producer.
- Local extraction is an intake aid, not proof that a provider changed a policy.

## Verification performed

- `npm test`: 64 files and 379 tests passed, including plain text, HTML fallback, multipart alternatives, encoded headers, transfer encodings, attachment exclusion, cleaned links, oversized input and nesting limits.
- `npx tsc --noEmit`: completed without errors and confirmed that the client-only parser adds no server-only dependency.
- `npm run lint`: no application errors; one pre-existing warning remains in an unrelated untracked temporary presentation file under `tmp/`.
- `npm run build`: the production build completed and generated all 93 application pages, including `/what-changed`.
- Playwright desktop and mobile checks: a synthetic `.eml` produced the expected `Contoso · Privacy & Terms` local summary at 1440 px and 390 px, returned HTTP 200, emitted no console or page errors and caused no horizontal body overflow.

## Residual constraints

Mobile mail applications vary in whether they can save or share an `.eml` file to a browser file picker. Users can continue to paste visible text, and the separately versioned browser extension remains available for supported desktop browsers. Direct forwarded-email delivery remains outside this release because it would require an explicit transport, consent, retention, abuse and deletion contract.
