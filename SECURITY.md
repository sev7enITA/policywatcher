# Security Policy

## Supported Versions

PolicyWatcher is currently maintained on the latest public major release line.
Security fixes are prioritized for the active release and the next Confidence
Release track.

| Release line | Status |
| --- | --- |
| 3.x | Supported |
| 2.x | Public legacy deployment; upgrade recommended |
| 1.x | Unsupported |

## Reporting a Vulnerability

Please report suspected vulnerabilities privately by email:

security@policywatcher.online

Include as much detail as possible:

- affected URL, route, API endpoint, or source file;
- steps to reproduce;
- expected impact;
- screenshots, logs, or proof-of-concept details when safe to share;
- whether the issue appears exploitable in production.

Please do not disclose the issue publicly before it has been triaged.

## Response Targets

These are operational targets, not contractual service-level commitments:

- Initial acknowledgement: within 5 business days.
- Initial triage: within 10 business days.
- Remediation plan for validated high-impact findings: as soon as practical.

## Scope

In scope:

- PolicyWatcher web application routes.
- Public API routes exposed by the application.
- Admin authentication and authorization logic.
- Scraper egress and source-handling controls.
- Dataset QA and evidence telemetry logic.
- Public repository workflows and supply-chain configuration.

Out of scope:

- Denial-of-service testing.
- Social engineering.
- Physical attacks.
- Attacks against third-party services not controlled by PolicyWatcher.
- Automated high-volume scanning of the production site without prior consent.

## Security Evidence Boundary

PolicyWatcher publishes automated quality and security checks as operational
evidence. These checks do not certify that the platform is free from
vulnerabilities and do not constitute legal, regulatory, or compliance
certification.

## Security Warning Assessments

Dependency warning triage, reachability decisions, remediation status, and
verification evidence are recorded in
[docs/security-warning-assessments.md](docs/security-warning-assessments.md).

## Secrets

Do not open public issues or pull requests containing secrets, tokens, database
files, session keys, API keys, or production credentials. If a secret is exposed,
report it privately so it can be rotated.
