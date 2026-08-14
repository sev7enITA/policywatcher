# PolicyWatcher 3.9.0 Beta 3 release audit

- Release: `3.9.0-beta.3`
- Date: 27 July 2026
- Product release: Native Dashboard Intelligence
- Browser extension: `3.8.3-beta.3`, beta package ready; store submission planned

## Delivered public surface

This release adds `/press-kit` as a bilingual editorial briefing room. English is the default language and Italian is available through a local page toggle. The surface separates owned product material from external mentions on `/press`.

The Press Kit provides:

- a bounded facts panel for the configured inventory, canonical KPI catalogue and current release;
- a six-entry Claim Ledger mapping claims to evidence and limitations;
- reporting topics, short and long boilerplates, citation guidance, founder details and contact routes;
- individually downloadable owned assets with SHA-256 integrity values and an explicit `contentCredentials: "not-attached"` boundary;
- valid JSON-LD and a stable `/press-kit/press-kit.json` endpoint;
- direct links to methodology, Trust & Quality, the Feature Intelligence Atlas and the separate Press Wall.

## Claim boundaries

PolicyWatcher monitors a configured portfolio of 16 companies across six sectors and exposes 15 canonical KPI definitions. These are inventory statements, not proof of exhaustive market coverage. `Not assessed` is not treated as zero. AI-assisted outputs are attention signals, not legal advice, compliance findings or performance measurements.

The 2 August 2026 Article 50 reference is sourced to the European Commission and is included as editorial context. It does not prove that PolicyWatcher assesses, certifies or predicts organizational compliance.

Checksums provide file-integrity evidence only. No C2PA or Content Credentials metadata is claimed for the current owned asset set.

## Release-surface alignment

Version metadata, changelog, README, release-impact map, Feature Intelligence Atlas, in-app changelog and release-package source inventory are aligned to `3.9.0-beta.3`. The browser extension remains independently versioned and is not represented as store-published.

## Validation gate

The release requires targeted unit tests, TypeScript validation, linting and responsive browser QA at desktop, tablet and mobile sizes. Product screenshots and final Press Kit QA captures are generated from the current build, then checksummed in the owned-asset manifest.
