# UI/UX: quicker access to policy evidence

Builds on the published UI/UX P0 release (76d8fdc). This patch improves discovery and interpretation of existing public evidence without changing publication gates, assessments, database schema, or delivery settings.

- Quick search puts companies before actions and searches individual policy names, types and jurisdictions. Selecting a policy opens that exact record. The palette uses the shared native modal, a labelled 44px close button, combobox keyboard navigation, focus restoration and reduced-motion styles.
- Policy detail groups retrieval telemetry in a keyboard-accessible Source verification disclosure. The source URL remains available above the analysis. Version selectors are native buttons; tab labels wrap without splitting words.
- Company cards call the record date Latest published analysis; baseline-only cards say No published changes.
- Timeline distinguishes filtered zero results from an empty published archive and offers Clear all filters. Counts identify total matching/published changes and company/jurisdiction counts in loaded results. Search explains the three-character minimum, caps input at the API's 200-character limit, debounces requests and rejects obsolete responses. Mobile filters scroll away to keep results visible.

Validation: 1073 tests in 166 files passed; scoped ESLint and TypeScript passed; optimized production build passed. Browser checks cover 320/390/768/1280px, exact policy selection, EN/IT palette labels, keyboard controls, modal handoff and focus restoration, disclosure, pagination, delayed responses, empty/error/retry states and mobile result occlusion. Separate staging verification and live production verification are required for publication.

Evidence and deployment records are kept outside the release payload in docs/reports/ui-ux-evidence-access-2026-09-10 in the operator workspace.
