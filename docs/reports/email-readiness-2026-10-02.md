# Email readiness — 2 October 2026

## Observed production configuration

- Hostinger lists `alert@policywatcher.online`, `info@policywatcher.online` and
  `privacy@policywatcher.online` as active mailboxes, each with one active forwarder.
- The application's SMTP username is `alert@policywatcher.online`; host
  `smtp.hostinger.com` and port `465` match the mailbox's connection settings.
- The production environment has no SMTP password. The mailbox connection page
  requires the existing mailbox password and does not reveal it.
- Public MX records point to Hostinger. SPF includes `_spf.mail.hostinger.com`;
  DMARC publishes `p=quarantine`. DKIM signing and actual message delivery have
  not been verified in this check.
- A connection probe from the production host negotiated TLS 1.3 with a valid
  certificate. This proves network/TLS reachability, not SMTP authentication.
  No email was sent.

## Code correction

The subscription endpoint now checks SMTP configuration before querying or
storing an address. Missing or invalid configuration returns HTTP 503 with a
localized service-unavailable message and a Retry-After header. The accepted
request copy no longer claims that a message was delivered or sent.

For recipient-specific delivery failures, the response remains the same as for
an existing subscription, avoiding disclosure of subscriber membership. Failed
new requests stay inactive and require confirmation. Delivery failures produce
operator diagnostics without logging an address or confirmation token.

Validation: 15 focused tests passed, including missing/invalid SMTP, rejected
delivery, generic existing-address responses and confirmation behavior. Targeted
ESLint, TypeScript and the local production build passed using the local fixture
database. These are code checks, not delivery receipts or a production deployment.

## Remaining operational steps

1. Store the existing password for `alert@policywatcher.online` as `SMTP_PASS`
   in the production website's protected environment settings. Never commit it,
   paste it into chat, or configure production mail credentials in staging.
2. Run the authentication-only `scripts/verify-smtp.ts` probe with the production
   environment. A successful result still does not prove inbox delivery.
3. Deploy the corrected code through the documented staging/promotion process.
4. With an explicitly authorized test recipient, verify confirmation delivery,
   explicit confirmation, alert eligibility and unsubscribe. Inspect received
   authentication headers to verify SPF/DKIM/DMARC.
5. Review the two legacy active records without recorded confirmation before
   sending alerts. Do not invent consent evidence or automatically confirm them.

Subscriber administration, persistent delivery status, consent-version evidence,
retention and erasure handling remain separate unfinished application work.
Mailbox existence does not establish that the privacy-request handling process
is operational. The report does not assert GDPR compliance.
