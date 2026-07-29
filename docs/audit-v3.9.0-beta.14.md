# PolicyWatcher 3.9.0 Beta 14 release audit

Date: 29 July 2026
Release: Press Outreach Operations

## Scope

This audit covers the protected Press Outreach Desk, the five versioned Beta 13 distribution cohorts it operates, aggregate editorial measurement, release metadata, privacy wording and application-log minimization.

## Functional controls

- Only authenticated administrators can record outreach operations; auditors remain read-only.
- Public and administrative event writers use separate strict event and target allowlists.
- Requests reject unsupported content types, malformed JSON, excessive payloads and unexpected fields.
- The stored event shape is limited to event type, allowlisted target, locale and server timestamp.
- The workflow has no journalist, outlet, recipient, email, subject, message, note, referrer or delivery-history field.
- The UI reports event counts and does not calculate conversion rates.
- Launch readiness is stored only in the operator's browser and is not presented as certification.

## Security review

The release diff received a complete single-pass security review across 18 changed or new source-like files and five trust surfaces. The canonical scan reported no finding introduced by the reviewed diff. This is a scoped review result, not a statement that the application has no vulnerabilities.

Adversarial API coverage includes unauthorized and auditor writes, unsupported media types, malformed JSON, oversized requests, allowlist rejection and controlled storage-failure responses. Error responses remain generic and do not expose database paths or implementation details.

Application logs now mask subscriber email references. The public privacy notice distinguishes cookie-free public editorial measurement from the essential signed HTTP-only administrator session cookie. It also avoids making an unsupported application-level encryption claim for the live SQLite file.

## Boundaries

- This review does not constitute independent certification, penetration testing or a legal determination.
- No production denial-of-service testing was performed.
- Host-level disk encryption, backups, access logs and retention remain deployment-provider controls and must be verified separately.
- Aggregate event counts do not establish delivery, readership, publication, adoption, endorsement or conversion.

## Verification record

- Focused outreach and security tests: 23 passed across 5 files.
- Full automated suite: 418 passed across 72 files.
- TypeScript check: passed.
- Scoped ESLint check: passed.
- Production build: passed; 111 application pages generated.
- Production dependency audit (`npm audit --omit=dev`): no advisory in the audited production tree.
- Full dependency audit: 9 high-severity advisories in the development-only ESLint/minimatch/brace-expansion toolchain. The suggested automated remediation requires a major-version tooling change and is deferred from this release; these packages are not shipped in the production dependency set.
- Hostinger package inspection and checksum: completed after the release commit; the exact artifact digest is recorded in the release handoff.
- Hostinger deployment correction: the production initializer no longer uses Bash process substitution and therefore does not require `/dev/fd` during `postinstall`.
