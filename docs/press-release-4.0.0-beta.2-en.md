# PolicyWatcher 4 Beta 2 is live: an operating model connecting changes, versions and provisions

## Press release

**Milan, 20 August 2026** — PolicyWatcher has completed the production
deployment of version `4.0.0-beta.2`. The public manifest now reports the new
release, while the website continues to provide access to policy monitoring,
public sources and the applicable publication limitations.

Version 4 does not change the purpose of the project: to observe changes in
digital policies and make them inspectable. It changes the model used to
identify, connect and reuse the evidence. In 3.x, the observed change was the
primary operational record. In version 4, the chain supporting that change is
an explicit and durable structure:

`Entity → Document → Version → Change → Provision`

This model distinguishes the monitored entity, the source document, the
captured version, the observed delta and the provision to which the analysis
refers. Stable public identifiers are separated from internal UUIDs, allowing
them to remain consistent across renaming, URL changes and future storage
changes.

## What this means for different users

The operating-model change has distinct implications for four main groups:

- **product owners:** public references and contracts can remain stable while
  the internal implementation evolves;
- **governance and legal teams:** an assessment can be traced to the document
  version, observed change and relevant provision without turning a
  classification into a legal conclusion;
- **research and editorial teams:** the same evidence can be reviewed, cited
  and reused across multiple surfaces while retaining its provenance;
- **engineering teams and integration partners:** APIs, evidence packets and
  verification flows can rely on durable identifiers and shared operational
  status.

The initial provision taxonomy covers AI training, data sharing, retention,
arbitration, content licensing and liability. The taxonomy organises observed
language; it does not determine legal validity, applicability or compliance.

## One database-derived operational status

Version 4 publishes a single authoritative publication-readiness contract,
derived from the database and shared by the Admin area, the internal
competitive analysis and the public API.

The snapshot verified on 20 August 2026 reports:

- 50 configured records;
- 50 retrieved records;
- 50 baseline-verified records;
- 44 public records;
- 28 analysed records;
- latest successful capture: 19 August 2026 at 07:55:20 UTC;
- 15 companies currently exposed by the public endpoint.

These values describe the operational status measured from the database. They
do not indicate exhaustive coverage, legal quality, compliance or future
availability. The metric remains live and is not frozen into static graphic
materials.

Public contract:
`https://policywatcher.online/api/v1/publication-readiness`

## Verified hardening and deployment

Beta 2 applies the principal corrections arising from the independent
assessments received for the v4 branch. The changes include:

- trusted client identity with fail-closed behaviour in managed environments;
- separate secrets for the API, Admin sessions and Investor sessions;
- global revocation of administrative sessions;
- explicit input limits for acquisition and AI operations;
- a durable, renewable lease for full scans;
- double opt-in for new and reactivated subscriptions;
- encrypted exports extended to all 31 application tables;
- minimal public liveness separated from protected operational health;
- a distinction between an acquisition error and the absence of publishable
  evidence.

The final artefact passed all 11 staging checks and was promoted to production
with the same checksum. A database backup was created before the migrations.
The post-deployment audit found 31 of 31 tables, 16 of 16 migrations, SQLite
integrity `ok`, WAL journal mode and a five-second busy timeout. The source
suite contains 1,034 tests, all passing alongside TypeScript, lint and the
Next.js build.

Hostinger proxy behaviour was verified in both staging and production:
client-supplied forwarding headers are not accepted as trusted identity unless
the proxy overwrites them.

## A new visual guide to the operating-model change

PolicyWatcher has also prepared a new English-language infographic separating
the primary message from the technical reference. The first section explains
the move from change records to durable evidence and its practical meaning for
product owners, governance, research and integrations. Architecture, Git and
release status, integration surfaces, and the relationship between Admin,
competitive analysis and the API are collected in a secondary technical
reference.

The editorial background was generated with AI and is disclosed as such;
text, figures, diagrams and information hierarchy are composed
deterministically. The infographic makes no claims of superiority and does not
replace the live metric.

Asset planned for availability after promotion of the new package:
`https://policywatcher.online/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`

## Proposed statement

> “Version 4 does not change what PolicyWatcher observes; it changes how the
> evidence of a change is preserved and made reusable. The result is a more
> explicit path from source to version, delta and provision, while keeping
> observed data separate from assessments and system limitations.”

— **Fabrizio Degni, founder of PolicyWatcher**
*Proposed statement, subject to approval before external distribution.*

## Limitations and next gates

SQLite remains the current production database. PostgreSQL, object storage,
activation of canonical dual-write, transition to canonical reads, workspaces,
accounts, billing and multi-tenancy remain separate gates and are not presented
as active capabilities.

The post-deployment audit also retains an attention item concerning the Content
Security Policy returned by the Hostinger layer: HSTS, `nosniff` and
`X-Frame-Options: DENY` are present, while the complete CSP generated by the
application requires further alignment with the hosting layer. Independent
dynamic testing remains, by definition, an external activity and is not
self-certified by the application.

Application deployment and repository formalisation are maintained as separate
evidence. The website serves `4.0.0-beta.2`, and the corresponding source is
available under the immutable Git tag `v4.0.0-beta.2`.

## Availability and references

- Public website: `https://policywatcher.online`
- Release manifest: `https://policywatcher.online/api/v1/manifest`
- Source tag: `https://github.com/sev7enITA/policywatcher/tree/v4.0.0-beta.2`
- Publication readiness: `https://policywatcher.online/api/v1/publication-readiness`
- Liveness: `https://policywatcher.online/api/live`
- Infographic: available after the next deployment of the revised asset

## About PolicyWatcher

PolicyWatcher is an independent civic-tech project that makes public policy
sources, observed changes, evidence status and analytical limitations
inspectable. It is not legal advice or a compliance certification.

Press and fact-checking enquiries: `info@policywatcher.online`

---

### Internal publication note

The text is ready for editorial review. Before distribution:

1. approve or remove the attributed statement;
2. promote the new infographic and verify its checksum;
3. verify the public source-tag link;
4. recheck the live publication-readiness snapshot on the publication date;
5. remove this internal note from the media copy.
