# PolicyWatcher 3.9.0 Beta 40 audit

Date: 6 August 2026

Release: PolicyWatcher Civico

## Scope

Beta 40 adds an Italian-language public-evidence workspace for a controlled pilot with Italian consumer associations. The release includes:

- `/associazioni`, with source-first theme triage and explicit empty or unavailable states;
- a bounded browser-local watchlist and browser-local review states;
- deterministic Markdown digest generation;
- handoff to existing Evidence Collections using public change identifiers;
- public discovery through header, footer, dashboard ribbon, command palette, sitemap, `llms.txt` and Site Atlas;
- release representation in Roadmap, Release Impact, Feature Atlas, Press Kit, Pulse, changelog and the bilingual How To guide.

## Evidence and privacy boundary

- The workspace receives only records admitted by the existing public-data and public-evidence gates.
- Seeded, private, suspended, unavailable and otherwise ineligible records are not promoted as civic evidence.
- Watchlist title, selected themes and review states are stored only in the current browser.
- Shared Evidence Collections contain bounded public change identifiers, not the local title or review state.
- The workspace does not create association accounts, store complaints, collect consumer or member identities, send drafts, publish decisions or make legal or compliance findings.
- Theme classification and generated summaries remain review aids. Material use requires the linked primary source and qualified professional assessment.

## Release resources

The following surfaces are aligned to `3.9.0-beta.40`:

- centralized release metadata and package versions;
- `CHANGELOG.md`, `README.md` and `HOSTINGER-DEPLOY.md`;
- native dashboard user guide and 10-step bilingual How To tour;
- dynamic sitemap, `llms.txt`, public navigation and both atlases;
- Roadmap and release KPI/KRI impact mapping;
- Press Kit current-release registry, live fact sheets and Editorial Pulse release record;
- Hostinger package required-source and required-entry gates.
- The package builder no longer requires ignored Next.js-generated `next-env.d.ts`; Next.js recreates it during the managed build.

## Validation gate

The release source passed:

- 128 Vitest files and 689 tests;
- ESLint with zero errors and zero warnings;
- the optimized Next.js production build, including TypeScript checking and generation of all 158 static paths;
- visual evaluation at 1440, 1024, 768 and 360 px for the association workspace;
- focused release, Press Kit, sitemap/discovery, UI-contract and public-evidence tests.

The Hostinger ZIP is built from a clean committed worktree, checked for required entries and forbidden paths, extracted for metadata parity, and accompanied by a SHA-256 checksum and embedded `release-manifest.json`.

## Deployment verification

1. Deploy the Hostinger source ZIP with Node.js 22 using `npm ci`, `npm run build` and `npm start`.
2. Confirm the startup database-readiness gate completes before Next.js accepts traffic.
3. Open `/associazioni` in English and Italian.
4. Confirm only eligible published records appear and that empty or unavailable data is described explicitly.
5. Add and remove a record, change its local review state, create the Markdown digest and open the Evidence Collection handoff.
6. Confirm a primary source link opens and that the workspace does not request an account or consumer identity.
7. Verify `/sitemap.xml`, `/llms.txt`, `/atlas`, `/feature-atlas`, `/roadmap` and `/press-kit/releases` expose the Beta 40 path and metadata.

## Residual risks

- Browser-local state can be cleared, become stale or remain on a shared device.
- Theme matching and summaries can be incomplete or imprecise.
- Public coverage depends on configured sources, successful retrieval, review and publication gates.
- A successful build and package verification do not establish production availability, legal accuracy, user adoption or accessibility certification.
