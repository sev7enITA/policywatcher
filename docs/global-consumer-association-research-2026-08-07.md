# Global consumer and digital-rights association research

Research snapshot: 7 August 2026
Implementation: PolicyWatcher `3.9.0-beta.40`

## Purpose

This note records the source hierarchy, taxonomy, inclusion method and residual limits behind the first global PolicyWatcher Civic directory. It is a research and navigation artifact, not an accreditation exercise, legal-status opinion or ranking of organizations.

The implemented snapshot contains 79 entries across 24 countries. It prioritizes depth for Italy, France and Spain, adds selected European consumer bodies and digital-rights specialists, and adds a representative global layer. The underlying networks are broader than the implemented snapshot.

## Source hierarchy

1. **Government registries and institutional national lists.** These are the primary source for the implemented Italian, French and Spanish consumer lists.
2. **Transparent membership networks.** BEUC, EDRi and Consumers International are used to identify regional and global consumer or digital-rights organizations.
3. **Official organization profiles.** Used for selected digital specialists where the implementation does not claim a government-recognized or network-member status.

Each application record stores the source URL, verification kind and review date. A linked source can later change, so the directory remains a dated snapshot.

## Principal sources

- [MIMIT — national representative actions](https://www.mimit.gov.it/it/?id=2044830&view=article): current Italian list used for ten nationally qualified organizations; the page reports its own last update of 10 April 2026.
- [DGCCRF — national consumer associations](https://www.economie.gouv.fr/dgccrf/les-demarches-et-les-services/demarches-et-services-en-tant-que-consommateur/liste-et-coordonnees-des-associations-nationales): French government directory used for the national consumer snapshot and official websites.
- [Spanish Ministry — consumer and user associations](https://www.dsca.gob.es/es/consumo/asociaciones-personas-consumidoras/listado-asociaciones-consumidores-usuarios): institutional directory used for FUCI, HISPACOOP, ADICAE, UNAE, CECU, OCU, AUC, FACUA, ASUFIN, USFIN and CONSUMES.
- [European Commission — national consumer bodies](https://commission.europa.eu/strategy-and-policy/policies/consumers/consumer-protection-policy/our-partners-consumer-issues/national-consumer-bodies_en): explains the role of national consumer organizations and links national systems in EU countries, Iceland, Norway and the UK.
- [BEUC — member organizations](https://www.beuc.eu/about-beuc/members): as of January 2026, BEUC reports 42 member organizations across 31 countries. The application includes a selected European subset and links the live directory as the verification source.
- [EDRi — network](https://edri.org/about-us/our-network/): EDRi describes a network of 50+ NGOs, experts and advocates defending digital rights across Europe and beyond. The application uses it for selected digital-rights records.
- [Consumers International — members](https://www.consumersinternational.org/members/): global membership entry point. Consumers International separately states that it represents more than 200 consumer bodies worldwide; the application includes only a selected subset.

## Taxonomy

The directory uses eight non-exclusive types. An organization can appear in more than one:

| Type | Intended use |
| --- | --- |
| General consumer protection | Broad contractual, product, service and market advocacy |
| Digital rights | Platform power, online freedoms, automated systems and digital markets |
| Privacy and data | Data protection, surveillance and information rights |
| Financial services | Banking, credit, insurance, payments and financial-user advocacy |
| Communications and media | Telecoms, internet access, media services and communications users |
| Children and families | Family representation, minors and child-facing services |
| Transport and housing | Mobility, tenants, housing and essential local services |
| Food and sustainability | Food markets, safety, consumption and sustainability |

These labels support discovery. They do not define an organization's complete statutory remit and are not a legal classification.

## Geographic model

The platform separates:

- global networks;
- regional networks;
- national organizations;
- six user-selectable macro areas: Global, Europe, North America, Latin America, Asia-Pacific and Africa.

A country view includes the national records, relevant regional networks and global networks. It does not infer subnational coverage. The directory uses one canonical route (`/associazioni#organizzazioni`); filters remain browser state rather than generating thin country pages for search indexing.

## Inclusion and suggestion checks

An entry should have:

- a stable organization name and territory;
- an HTTPS official website or, only where clearly disclosed, a network profile;
- a public government registry, independent network directory or official mission profile;
- at least one supported protection type;
- an explicit review date.

User suggestions must provide an HTTPS official website and an HTTPS independent source. The UI prepares an email draft but does not submit automatically. A suggestion is evidence for review, not a publication event.

## Known limits and maintenance

- The 79-entry snapshot is intentionally non-exhaustive; it should not be described as worldwide completeness.
- Network membership, government recognition, websites and organizational names can change.
- EN and IT are the complete platform interface locales. Selecting France, Spain or another country currently uses the declared English fallback unless Italian is explicitly chosen.
- The directory does not assess response time, legal capacity in a particular dispute, accessibility, funding independence or service quality.
- Before each release, source links should be checked, changed membership labels should be updated and suspended or uncertain records should be removed rather than silently retained.

## Implementation references

- Data contract: `src/lib/civicOrganizations.ts`
- Global context contract: `src/lib/globalContext.ts`
- Directory UI: `src/app/associazioni/CivicDirectory.tsx`
- Shared setting UI: `src/components/GlobalContextControl.tsx`
- Focused tests: `src/lib/__tests__/civicOrganizations.test.ts` and `src/lib/__tests__/globalContext.test.ts`
