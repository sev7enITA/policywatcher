# Reviewed Applicability Graph evolution

Status: exploratory architecture candidate. No product version, delivery date or production commitment is assigned.

Last reviewed: 22 August 2026.

## Problem

PolicyWatcher v4 can preserve and expose what a monitored source said through the evidence chain:

`Entity -> Document -> Version -> Change -> Provision`

The `jurisdiction` attached to a Document expresses the monitored source or market scope. It does not establish that a provision is legally applicable to a specific company, legal subject, service, audience or event in that jurisdiction. Company attributes alone do not establish applicability either.

Applicability is contextual and time-dependent. A review may need to consider the exact legal subject, its relationship to a group or brand, the service or product, where and how it operates, territorial or regulatory nexus, audience or customer class, thresholds, exemptions and the relevant effective period. Those facts may be sourced from different records and may change independently.

The proposed evolution is therefore not “automatic legal applicability.” It is a provenance-rich graph and review workflow for expressing bounded, inspectable applicability assertions.

## Current foundation

The deployed public release remains `4.0.0-beta.2`. Its evidence model supplies the source-bound lineage on which this candidate could build.

The local workspace additionally implements:

- versioned entity taxonomy for primary sector, capabilities and evidence-backed regulatory roles;
- separate `draft -> reviewed -> published` classification and provision workflows, with distinct reviewer and publisher provenance and immutable published records;
- a 17-dimension Full-V4 readiness contract;
- a semantic evidence predicate requiring an exact captured-Version excerpt, SHA-256, canonical Version locator and rationale for positive, conditional or unclear assessments;
- a human-only reviewed-absence decision;
- a tested public taxonomy contract.

These additions are not yet production-active. The online `/api/v1/taxonomy` endpoint currently returns 404. Local reconciliation 1.2.0 completed with zero errors and zero warnings, but the 330 provision slots comprise 317 `not_assessed` records and 13 KPI-derived draft signals. Zero are semantically decision-ready or published. Strict source/data gates remain open for Apple, Revolut and TikTok.

The applicability candidate must not weaken these fail-closed states or reinterpret taxonomy classifications as applicability findings.

## Proposed typed model

The existing portfolio `Entity` remains a first-class publisher or monitored-company anchor. It should not be silently treated as the exact legal subject to which a provision applies.

Proposed types:

| Type | Purpose | Required provenance |
| --- | --- | --- |
| `PortfolioEntity` | Existing monitored entity and publisher anchor | Existing entity identity and source records |
| `LegalEntity` | Exact incorporated, registered or otherwise legally relevant subject | Authoritative identifier, legal name, jurisdiction and source |
| `CorporateGroup` | Parent/subsidiary or control context | Relationship source and validity period |
| `Brand` | Customer-facing brand that may differ from the legal subject | Ownership/operator source and validity period |
| `Service` | Product, service, feature or business line potentially governed by a provision | Operator, scope and source |
| `MarketOperation` | Evidence that a legal entity or service operates in a market | Market, mode, source and validity period |
| `Jurisdiction` | Typed territorial or regulatory domain | Stable code, authority level and version |
| `Audience` | User, customer, worker, developer or other affected class | Controlled term and evidence when assertion-specific |
| `ApplicabilityPredicate` | A sourced condition such as nexus, threshold, exemption or effective-time rule | Predicate type, operands, source, rationale and temporal validity |
| `ApplicabilityAssertion` | Reviewable result joining provision and operational context | Full assertion contract below |

Illustrative typed relationships include:

- `PortfolioEntity RESOLVES_TO LegalEntity`;
- `LegalEntity PART_OF CorporateGroup`;
- `Brand OPERATED_BY LegalEntity`;
- `LegalEntity OFFERS Service`;
- `Service HAS_MARKET_OPERATION MarketOperation`;
- `MarketOperation HAS_NEXUS Jurisdiction`;
- `Service SERVES Audience`;
- `Provision REQUIRES ApplicabilityPredicate`;
- `ApplicabilityAssertion EVALUATES` the complete provision, subject, service, jurisdiction, audience and time tuple.

Every relationship needs a stable identity, source, provenance, validity interval and review state. Conflicting relationships must coexist as explicit evidence conflicts until reviewed; last-write-wins resolution is not acceptable.

## ApplicabilityAssertion contract

An assertion is scoped to a complete tuple:

`Provision + LegalEntity + Service + Jurisdiction + Audience + ValidityPeriod`

Proposed minimum fields:

| Field | Contract |
| --- | --- |
| `id` | Stable, non-semantic assertion identifier |
| `taxonomyVersion` | Version of controlled entity, relationship and predicate vocabulary |
| `provisionId` | Exact evidence-backed Provision |
| `legalEntityId` | Exact reviewed legal subject; never inferred from brand text alone |
| `serviceId` | Service or product in scope |
| `jurisdictionId` | Jurisdiction being assessed, distinct from Document market scope |
| `audienceId` | Affected audience or customer class |
| `validFrom` / `validTo` | Time interval covered by the assertion |
| `outcome` | `applies`, `may_apply`, `does_not_apply` or `unknown` |
| `predicateIds` | Reviewed nexus, threshold, exemption and temporal conditions used |
| `evidenceRefs` | Exact source, Version locator, excerpt/hash where appropriate, and relationship evidence |
| `rationale` | Human-readable explanation linking evidence and predicates to the outcome |
| `provenance` | Actor/tool identity, creation time and complete decision history |
| `reviewStatus` | Fail-closed lifecycle state such as `draft`, `reviewed`, `published`, `superseded` or `withdrawn` |
| `reviewerId` | Accountable human reviewer for a reviewed outcome |
| `publisherId` | Separate accountable actor for publication |
| `reviewedAt` / `publishedAt` | Server-recorded decision timestamps |

`unknown` is a valid, informative outcome. Missing evidence must not be converted into `does_not_apply`. `does_not_apply` requires affirmative reviewed evidence for the relevant scope and time, just as reviewed absence in the current provision model is human-only.

A published assertion is still a bounded, reviewed platform record. Publication does not transform it into legal truth, proof of enforceability or certification.

## Reasoning and review boundary

AI may:

- propose candidate legal-entity or service relationships;
- extract possible jurisdiction, audience, threshold, exemption and effective-time conditions;
- retrieve candidate supporting passages;
- draft a rationale that cites the supplied evidence;
- flag missing, conflicting, stale or low-confidence inputs.

AI may not:

- approve identity resolution;
- mark reviewed absence;
- select or publish `applies` or `does_not_apply` without accountable human review;
- bypass source-quality, semantic-evidence or conflict gates;
- turn document jurisdiction into a legal-applicability conclusion;
- issue legal advice, an enforceability finding or a compliance verdict.

Machine contributions must remain labelled and reproducible. Reviewer and publisher identities must be separate provenance fields, and published records must be immutable. A changed fact, relationship, predicate or rationale creates a new version or superseding assertion.

## Staged gates

### Gate 0 — Evidence foundation

- Preserve `Entity -> Document -> Version -> Change -> Provision` identity and lineage.
- Complete controlled Full-V4 production migrations, remediation, reconciliation, endpoint smoke and strict source QA independently of this research candidate.
- Do not use current KPI-derived draft signals as clause evidence.

### Gate 1 — Legal-subject resolution

- Define stable identifiers for legal entities, groups, brands and services.
- Require authoritative sources, validity periods and review states for identity links.
- Demonstrate conflict, merger, rename and brand/operator-change handling.

### Gate 2 — Typed operational relationships

- Add market operation, nexus, audience and service relationships with temporal validity.
- Validate referential integrity and graph traversal boundaries.
- Prevent a portfolio entity or document market label from silently standing in for a legal subject or nexus.

### Gate 3 — Applicability predicates

- Version controlled vocabularies for nexus, threshold, exemption and effective-time predicates.
- Require source, rationale and review provenance for every predicate used by an assertion.
- Fail to `unknown` when a required predicate is missing, stale or conflicted.

### Gate 4 — Human-reviewed assertions

- Implement draft, review, publication, supersession and withdrawal controls.
- Enforce accountable reviewer and publisher separation.
- Demonstrate that automated actors cannot promote or publish legal conclusions.
- Expose the complete evidence and reasoning trace to the reviewer before decision.

### Gate 5 — Bounded public or integration contract

- Publish only assertions that pass identity, relationship, predicate, evidence and human-review gates.
- Return claim boundaries and timestamps with every assertion.
- Support temporal queries and supersession without rewriting historical decisions.
- Complete legal/product review of terminology before any public applicability surface is described as available.

## Non-goals

This evolution does not aim to:

- replace qualified legal analysis;
- determine enforceability, liability or regulatory compliance;
- certify a company, service, policy or transaction;
- infer applicability from country, domain, brand, corporate group or sector alone;
- claim exhaustive knowledge of corporate structures, services or market operations;
- allow autonomous publication of legal conclusions;
- assign a promised release number or delivery date before research and acceptance gates pass.

## Acceptance evidence

The candidate is ready to leave research status only when evidence demonstrates all of the following:

1. A documented, versioned schema distinguishes portfolio entities, exact legal subjects, groups, brands, services, market operations, jurisdictions, audiences and predicates.
2. Referential-integrity and temporal tests cover changes in operators, ownership, services, markets and effective periods.
3. Every assertion resolves to an exact Provision and complete contextual tuple with inspectable source and rationale provenance.
4. Missing or conflicting required inputs deterministically produce `unknown` or a blocked review state.
5. `does_not_apply` and other high-impact outcomes cannot be generated from absence of evidence.
6. Authorization tests prove that AI and other automated actors cannot review or publish an assertion.
7. Immutable audit history records candidate generation, human review, publication, supersession and withdrawal.
8. Independent domain reviewers can reproduce a sample decision from the displayed evidence and identify its limitations.
9. Public/API contract tests preserve the explicit legal-advice, enforceability and compliance boundaries.
10. Release and communication review confirms that the platform describes reviewed, evidence-backed assertions rather than autonomous legal truth.

## Related local evidence

- `docs/document-evidence-model.md`
- `docs/full-v4-taxonomy-contract.md`
- `docs/reports/policywatcher-taxonomy-semantic-gate-closure-2026-08-21.md`
- `src/lib/fullV4Readiness.ts`
- `src/lib/provisionEvidence.ts`
- `src/lib/taxonomyPublicContract.ts`

