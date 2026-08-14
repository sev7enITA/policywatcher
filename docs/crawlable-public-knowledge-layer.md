# Crawlable Public Knowledge Layer

Status: delivered in `3.9.0-beta.26`.

## Purpose

The Crawlable Public Knowledge Layer provides a direct textual route into PolicyWatcher public evidence. Its core content, canonical links, publication state and provenance are rendered on the server and included in the initial HTML response.

This layer complements the interactive dashboard. It does not replace the dashboard, expose protected operations or weaken the existing public-evidence gates.

## Public routes

| Route | Content | Rendering |
|---|---|---|
| `/` | Compact public Knowledge snapshot followed by the interactive workspace boundary | Server-rendered snapshot plus hydrated dashboard |
| `/knowledge` | Public inventory, company index, policy index, recent published changes and reference surfaces | Server rendered |
| `/knowledge/companies/[slug]` | One monitored company and its evidence-gated public policies and changes | Server rendered |
| `/knowledge/companies/[slug]/policies/[id]` | One public policy record, source metadata, published baseline fingerprints and linked changes | Server rendered |
| `/robots.txt` | Public crawler rules and protected-route exclusions | Generated metadata response |
| `/llms.txt` | Concise public scope, machine endpoints, evidence boundary and citation guidance | Plain-text response |
| `/sitemap.xml` | Static public routes plus evidence-gated company, policy and change URLs | Dynamic generated sitemap |

## Publication boundary

Knowledge queries reuse the canonical helpers in `src/lib/publicDataGate.ts`:

- `publicPolicyWhere`;
- `publicChangeWhere`;
- `publicSnapshotWhere`.

The Knowledge Layer does not define a parallel or weaker eligibility rule.

Public policy records require a non-seeded ingestion method, an admitted data status and at least one snapshot marked `publicEvidence`. Public changes and snapshots must satisfy their corresponding public gates. Company records exist only when at least one related policy independently passes the policy gate.

Invalid policy identifiers are rejected before database access. A missing, mismatched or withheld company/policy entity returns HTTP 404.

## Exposed fields

The public view models select only the fields needed for the visible reference pages:

- company identity, slug, industry and safe official website URL;
- policy identity, type, jurisdiction and safe official source URL;
- data status, ingestion method and check/retrieval timestamps;
- public snapshot version, fingerprint and publication timestamp;
- published change identity, publication/observation timestamps, screening label and public summary;
- derived public inventory counts.

The layer does not select or expose:

- raw policy or snapshot text;
- raw diffs;
- check logs or retrieval attempts;
- raw failure causes;
- remediation or admin notes;
- credentials, session data or database diagnostics;
- configured, seeded, withheld or unverified records.

Official URLs are parsed and limited to HTTP or HTTPS before rendering. Source-derived strings are rendered through React text interpolation.

## Empty and unavailable states

The public pages distinguish:

- `available`: at least one policy passes the publication gate;
- `empty`: the query succeeds but no policy passes the gate;
- temporarily unavailable: the public database query fails.

An empty or unavailable state is not presented as a positive quality result. Runtime errors are logged server-side, while public copy omits connection strings, filesystem paths, SQL, migration state and storage details.

## Home and Terms acknowledgement

The home route is a Server Component. `HomeKnowledgeSnapshot` is a real server-rendered sibling of the interactive `DashboardClient`, not a slot serialized only into the React Flight payload.

The document contains one public `main` landmark. The interactive workspace uses a labelled region. Before acknowledgement, `TermsGate` renders as an inline section below the public snapshot and does not render the workspace controls. This keeps the public reference layer visible and prevents hidden dashboard controls from entering the focus order.

## Structured data

Structured data is emitted only when the related public record is available:

- Knowledge index: `CollectionPage`, `Dataset` and `ItemList`;
- company record: `WebPage` and the monitored `Organization`;
- policy record: `WebPage` and `DigitalDocument`.

JSON-LD is serialized with `<` escaped to `\u003c`. Counts, descriptions, timestamps, source links and citations used in structured data are also visible on the page. Structured data describes an evidence-gated inventory; it does not state legal compliance, exhaustive coverage, source certification or search-engine ranking.

## Crawler discovery

`robots.txt` allows public pages for general crawlers, OAI-SearchBot and PerplexityBot while retaining the same exclusions for protected admin, cron, mutation and private API paths.

`llms.txt` identifies canonical public sections, read-only machine endpoints, the evidence boundary and citation guidance. It is guidance only and does not guarantee retrieval, indexing, ranking or citation by an external service.

The sitemap includes:

- `/knowledge`;
- one company URL for each company with a public policy;
- one policy URL for each public policy;
- existing public change, editorial and static routes.

Dynamic company and policy timestamps come from the related public records instead of the sitemap request time.

## Verification

The implementation is covered by regression checks for:

- reuse of public policy, change and snapshot gates;
- absence of private/operational fields from public selections;
- UUID validation before policy queries;
- 404 behavior for invalid and withheld entities;
- safe URL schemes and safe JSON-LD serialization;
- explicit empty and unavailable states;
- raw server-rendered home markup and entity links;
- protected-route crawler exclusions;
- sitemap and public navigation discovery;
- visible citation parity.

The completed verification included:

- 536 passing tests across 96 test files;
- TypeScript validation;
- production build;
- lint with zero errors and one unrelated pre-existing warning in an untracked temporary script;
- raw HTML inspection for home, hub and entity pages;
- JavaScript-disabled checks at desktop and 320 px;
- hydrated keyboard/focus checks for the inline Terms gate;
- HTTP 404 checks for invalid and non-public entities;
- no horizontal overflow at 320 px.

These checks validate the implemented behavior. They do not establish an indexing, ranking, citation, traffic or coverage outcome.
