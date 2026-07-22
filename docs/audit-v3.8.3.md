# Release 3.8.3 - Extension-First Evidence Review

Date: 2026-07-22

## User problem

A copied plain-text notification can retain words such as `qui` or `here`, but
cannot contain the hidden `href` behind those words or a rendered button. The
previous intake did not make this technical boundary prominent enough and
could look as if organization recognition depended on a specific example.

## Controls added

- Present the browser extension as the recommended desktop path because it can
  inspect visible text and actual anchors in the opened page after an explicit
  user gesture.
- Keep paste as the primary mobile fallback and state that hidden URLs cannot
  be reconstructed from plain text.
- Use general organization-signature patterns and neutral UI placeholders; no
  company allowlist is involved.
- Prefer anchors inside the selected or opened notification context and avoid
  unrelated webmail navigation/footer links.
- Remove URL query, fragment and credentials and reject opaque redirectors
  rather than transmitting tokens or guessing a destination.
- Render store install actions only when a credential-free HTTPS destination on
  the matching official Chrome, Edge or Apple host is configured. Safari
  signing and App Store publication remain external gates.

## Privacy boundary

Raw notification text stays in the page or browser tab. Only the confirmed
organization/domain, one cleaned starting URL when safely available, policy
categories and dates may cross the service-worker allowlist. The extension adds
no mailbox API, clipboard permission, persistent content script, analytics,
telemetry, advertising or remote executable code.

## Production acceptance

1. On desktop, `/what-changed` recommends the extension and links to
   `/browser-extension`; on mobile, paste is the only primary card.
2. The paste CTA focuses and centers the textarea, while preserving the
   `#paste-notice` fallback.
3. Plain text containing only `qui` or `here` produces no source URL.
4. An extension scan selects a direct policy anchor from the message context,
   strips query/fragment/credentials and ignores unrelated webmail links.
5. Opaque tokenized redirects produce no source URL.
6. Store buttons appear only when the matching `NEXT_PUBLIC_*_EXTENSION_URL`
   value is configured with a valid HTTPS URL.
7. A submitted inquiry contains no raw body, subject, email address, token or
   content fingerprint.

Independent desktop/mobile frontend evaluation passed after revisions to the
mobile hierarchy, textarea focus, hero density and 44 px touch targets.
