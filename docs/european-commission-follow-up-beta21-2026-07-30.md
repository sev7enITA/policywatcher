# European Commission follow-up - PolicyWatcher Beta 21

## Recommended subject

Follow-up: PolicyWatcher evidence infrastructure for public policy-change transparency

## Email

Dear [Name / European AI Office team],

I am following up on my previous message regarding PolicyWatcher, the independent civic-technology project for monitoring changes to publicly available terms of service, privacy policies and related provider documents.

Since that message, I have completed PolicyWatcher 3.9.0 Beta 21, with a substantial extension of the platform's evidence, explainability, data-quality and integration controls. I am sharing the update because the European Commission's final Article 50 guidelines emphasise practical, consistent and effective transparency, while also distinguishing legal obligations from the technical measures used to support them.

The current release includes:

- a Source Reliability control plane that separates selected policy records, unique source acquisitions, network attempts, deduplicated retrievals and withheld public records;
- an exact-evidence first-baseline process that does not create a false policy change, AI score or notification;
- structured retrieval failure causes, remediation state and dated historical references that remain excluded from change detection;
- change-bound Evidence Packets with snapshot identifiers, SHA-256 fingerprints, verified source passages, review questions and explicit interpretation limits;
- browser-local Evidence Collections and deterministic JSON, Markdown, CSV and vendor-neutral handoff exports;
- a bounded public change-event feed and versioned JSON Schemas for evidence reuse;
- a browser-local HMAC-SHA256 receiver workbench and an eight-case Receiver Conformance Lab, with no production secret submission or outbound delivery claim;
- updated Dataset QA, explainability, governance mappings, regional heatmaps, radar benchmarks, side-by-side diffs and protected administrative review surfaces;
- a public Claim Registry, methodology, release archive, Press Kit and Data Room designed to make product claims, evidence links, dates and limitations inspectable.

A public operational snapshot collected on 30 July 2026 reports 50 policy records: 45 passed the configured public-evidence gate and five were withheld. The public change inventory contained 35 records. These are point-in-time operational counts. They are not presented as legal findings, compliance measurements, semantic-accuracy results or exhaustive market coverage.

I have also revised the accompanying systems paper, "PolicyWatcher: An Evidence-Preserving Pipeline for Monitoring Terms-of-Service and Privacy-Policy Changes on Consumer Technology Platforms." The paper now documents the Source Reliability data model, evidence-gated baseline repair, citable evidence contracts, integration boundaries, the current operational snapshot and a proposed protocol for longitudinal and expert-annotated evaluation.

Relevant material:

- Platform: https://policywatcher.online
- Methodology: https://policywatcher.online/methodology/confidence
- Trust and Quality: https://policywatcher.online/trust
- Evidence Packets: https://policywatcher.online/evidence
- Developers and public contracts: https://policywatcher.online/developers
- Receiver Conformance Lab: https://policywatcher.online/developers/webhook-readiness
- Press Kit and Claim Registry: https://policywatcher.online/press-kit
- Public repository: https://github.com/sev7enITA/policywatcher

PolicyWatcher does not provide legal advice, certify compliance, assess conformity with the AI Act, or represent the views of the European Commission. My objective is narrower: to make public policy-change monitoring more traceable, reviewable and reusable while keeping unsupported records outside public analytical routes.

If this work is relevant to the Commission's transparency, civic-technology or AI-governance activities, I would welcome technical feedback or a short exchange with the appropriate team. I would also be pleased to provide the updated paper, a concise technical walkthrough or a reproducible demonstration based only on public evidence.

Kind regards,

Fabrizio Degni
PolicyWatcher Project
info@policywatcher.online
https://policywatcher.online

## Attachments

1. PolicyWatcher systems paper - 30 July 2026 revision.
2. Optional one-page Beta 21 release fact sheet from the public Press Kit.

## Evidence note for the sender

The Article 50 context is based on the European Commission's final guidelines published on 20 July 2026, which state that the relevant transparency obligations apply from 2 August 2026:

https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems

Keep the message in the original email thread, attach only the final paper and fact sheet, and send one follow-up only. Do not describe PolicyWatcher as Commission-approved, compliant, certified, audited by the Commission or representative of Commission policy.
