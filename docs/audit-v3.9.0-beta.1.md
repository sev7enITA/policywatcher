# PolicyWatcher 3.9.0 Beta 1 release audit

- Release: `3.9.0-beta.1`
- Name: Native Dashboard Intelligence
- Date: 2026-07-26
- Deployment target: Hostinger Next.js source application
- Database migration: none

## Release decision

This beta is a material architecture and user-facing dashboard release. It is
eligible for controlled Hostinger deployment after the repository gates and
extracted-package checks pass. It does not change the publication boundary,
administrator roles, browser-extension permissions, retrieval cascade, or
production database schema.

## Functional scope

The release adds a native TypeScript dashboard engine around the existing
Next.js, React, Recharts and Prisma application:

- immutable, validated dashboard module specifications;
- canonical workspace state for URL and browser persistence;
- typed actions and a validated acyclic action graph;
- deterministic wide, compact and single-column mobile layouts;
- an evidence-first registry for public dashboard data sources;
- one filtered view model shared by rendering and CSV export;
- a canonical 15-field KPI catalog used by normalization, audit and matrix APIs;
- truthful risk trends with real originating snapshot versions;
- centralized chart tokens and an allowlisted accessible chart contract;
- export manifests containing view, filter, coverage, source, gate, limitation
  and release provenance.

## Evidence and safety boundary

The dashboard abstractions cannot bypass `publicEvidence` filtering, source
suspension or Dataset QA warnings. Source QA remains required in every workspace
composition. Missing KPI assessment remains `Not assessed` and is not converted
to a low-risk score. Dashboard configuration is code-owned and allowlisted; it
does not resolve arbitrary functions or modules from serialized input.

Vizro `0.1.59` at commit
`917d7663856534f14f8927ecebeb6c668f9444f6` was inspected as a pinned knowledge
source. No Vizro, Dash, Flask, Plotly or Python runtime dependency was added.
The release also raises the PostCSS override to `8.5.23`. The production audit
then reports zero vulnerabilities. The full dependency audit still reports the
brace-expansion denial-of-service advisory through the upstream ESLint plugin
tree. That code is development-only, receives repository-owned glob patterns,
is excluded from the Hostinger archive runtime, and cannot process public
application input. The exception remains explicit until the Next-compatible
plugins adopt the fixed major; a forced downgrade or incompatible global
override is not accepted as remediation.

## Public release surfaces

The homepage release map, in-app changelog, Showcase, Roadmap, Trust & Quality,
Confidence Methodology, About page, README and changelog describe the new
contracts and their limitations. The notification evidence desk remains
functionally unchanged because it is not a release-notes surface.

## Verification gate

The release candidate must pass before packaging:

1. all Vitest suites;
2. TypeScript validation without emit;
3. ESLint with zero errors;
4. Next.js production build;
5. `git diff --check`;
6. high-severity production dependency audit;
7. clean tracked Git state after commit;
8. Hostinger package traversal, secret, runtime, database and symlink checks;
9. extracted artifact release-metadata parity;
10. SHA-256 checksum generation.

The generated archive intentionally excludes databases, environment secrets,
Git metadata, build output, dependencies, tests and temporary artifacts. The
release manifest records the exact source commit used for packaging.

## Deployment notes

No Prisma migration is required. Deploy using the existing Hostinger procedure
in `HOSTINGER-DEPLOY.md`; preserve production environment variables and the
SQLite database, install locked dependencies, build, and start through
`npm start`. The `server.js` readiness bridge remains the required startup path.

This is a beta release. A production smoke test should confirm the homepage,
trend API, KPI matrix API, CSV export, public methodology pages and protected
admin login after deployment.
