# PolicyWatcher Beta 27  -  immutable campaign claims sheet

Release: `3.9.0-beta.27` - Admin Operational Readiness
As of: `2026-08-01`
Canonical registry: https://policywatcher.online/press-kit#claim-registry
SHA-256 of JSON snapshot: `a56d6bb506861d75add6e73d3e9885e30731acda991826a88905e549678ff4d0`

This file is a campaign freeze derived from the public Claim Registry. Later corrections require a new version; do not silently rewrite a distributed snapshot.

## Approved facts

| ID | Value | English label | Scope boundary | Proof |
|---|---:|---|---|---|
| monitored-companies | 16 | configured monitored companies | Configured monitored inventory. It excludes the WAZE admin-onboarding fixture and is not exhaustive market coverage. | / |
| configured-sectors | 6 | configured sectors | Sector labels organize the monitored inventory. | / |
| canonical-kpis | 15 | canonical KPIs | Privacy, AI governance and ethics; unavailable assessments display Not assessed. | /feature-atlas |
| editorial-languages | EN / IT | editorial languages | The press kit and selected guidance pages support English and Italian. | /press-kit |

## Approved claims and mandatory boundaries

| ID | Approved wording | Mandatory boundary | Proof |
|---|---|---|---|
| public-evidence-gate | Published analytical records are filtered by the public evidence gate. | A gate reduces unsupported publication; it does not prove source completeness or legal authority. | /methodology/confidence |
| configured-inventory | The configured monitored inventory covers 16 companies across 6 sectors and excludes the WAZE admin-onboarding fixture. | This is not exhaustive public or market coverage, and source availability can change. | / |
| canonical-kpis | One framework defines 15 canonical KPIs across privacy, AI governance and ethics. | Normalized values support comparison only; unavailable assessments have no numerical value and the result is not a compliance score. | /feature-atlas |
| public-code | The repository and release notes are public and reusable under CC BY 4.0. | This describes repository access and license terms; no OSI certification is claimed. | https://github.com/sev7enITA/policywatcher |
| source-timestamps | Evidence views preserve source-specific screening and snapshot timestamps. | Release metadata is dated 1 August 2026; update intervals depend on source retrieval and review. | /timeline |
| external-coverage | Public articles and professional posts have discussed PolicyWatcher. | Mentions are references, not endorsements, certifications or independent audits. | /press |

## Prohibited transformations

- Do not replace configured scope with global, complete or exhaustive coverage.
- Do not convert unavailable, excluded, not scanned or Not assessed into zero, clear or healthy.
- Do not convert an implemented control into measured performance, adoption, compliance, certification or independent validation.
- Do not describe repository access under CC BY 4.0 as OSI certification.
- Do not describe external coverage as endorsement.
- Do not describe a checksum as proof of semantic truth, authorship provenance or institutional approval.
