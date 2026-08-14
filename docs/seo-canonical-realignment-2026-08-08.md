# PolicyWatcher SEO canonical realignment – 8 August 2026

## Decision

The only public canonical origin is:

`https://policywatcher.online`

`https://www.policywatcher.online` is a redirect-only alias for HTML pages and
machine-discovery files. Public API routes retain the legacy hostname as a
compatibility exception for already-published clients that reject redirects.

## Live baseline before deployment

The production audit performed on 8 August 2026 at 04:11 UTC found:

- both HTTPS hosts returned `200` instead of consolidating;
- the sitemap exposed 177 URLs on `www`, all returning `200`;
- 21 sitemap pages had no canonical element;
- 103 pages declared a `www` canonical, 51 declared a non-`www` canonical and
  two emitted a relative canonical;
- `robots.txt` advertised the `www` host and sitemap;
- `.well-known/security.txt` declared `www` canonical and policy URLs;
- static sitemap records used request time as `lastModified`, making every
  request look like a site-wide content update;
- default English change URLs used `?lang=en`, while internal links also
  exposed the queryless variant;
- Italian change and Pulse pages pointed canonical to English even though they
  rendered localized content;
- the release packager would remove the newly added untracked SEO runtime files
  from a workspace-snapshot archive.

## Search Console report interpretation

The report supplied on 8 August 2026 listed 25 excluded pages. The categories
do not all represent defects and must be handled separately:

| Search Console reason | Pages | Interpretation and action |
| --- | ---: | --- |
| Alternative page with proper canonical tag | 13 | Potentially valid exclusion for aliases or equivalent variants. The new host redirect, deterministic canonical and clean sitemap remove accidental variants; confirm the sampled URLs after recrawl instead of forcing them into the index. |
| Duplicate page without user-selected canonical | 4 | Actual conflicting signal. Addressed with explicit static and dynamic canonicals, one origin, self-canonical localized pages and reciprocal `hreflang`. |
| Page with redirect | 2 | An exclusion is correct when the old URL must redirect. Sitemap and active internal surfaces now publish only the destination, so redirected aliases should not be submitted for indexing. |
| Excluded by `noindex` tag | 1 | Correct only for a utility surface such as unsubscribe, embed or Office add-in UI. The exact Search Console example should be checked; intentional utility routes remain excluded and public content must not inherit `noindex`. |
| Crawled, currently not indexed | 5 | Not a canonical diagnosis by itself. Technical consistency is now restored, but any URLs still present after recrawl require individual review of uniqueness, evidence depth, internal links and search value. |

The expected technical result is therefore not “25 indexed pages.” Some
exclusions are intentional. Success means that Google receives one consistent
URL for every indexable document and that only useful, canonical URLs remain in
the sitemap.

## Realigned contract

- One immutable origin is defined in `src/lib/siteOrigin.ts`.
- Root metadata uses that origin as `metadataBase`.
- Every literal static sitemap page has explicit canonical metadata.
- Dynamic company, policy, evidence, change, release and Pulse records emit
  deterministic canonical URLs.
- English localized records use a clean queryless URL; Italian records use
  `?lang=it` and are self-canonical with reciprocal `hreflang` plus
  `x-default`.
- Sitemap URLs are generated only from the immutable non-`www` origin.
- Static sitemap entries omit fabricated `lastModified` values; evidence-backed
  dynamic dates remain.
- Published Evidence Packet routes are included in the sitemap.
- `www` HTML, `robots.txt`, sitemap and well-known pages redirect permanently
  to the same path and query on the canonical host.
- `/unsubscribe`, embed and Office add-in utility surfaces remain outside the
  search index.
- Browser-extension source, current documentation, research links and
  `.well-known/security.txt` use the canonical origin.
- Existing API clients on `www` remain operational without a redirect.
- The Hostinger packager now requires and verifies every new SEO runtime file.

## Intentional residual `www` references

The following references are deliberately retained:

- the alias hostname constant used to detect redirect requests;
- redirect and legacy-API regression tests;
- historical audit text documenting the host permission of an earlier
  extension release;
- deployment documentation explaining that `www` is a redirect-only alias.

These references do not generate public canonical URLs.

## Release gates

The deployment candidate must satisfy all of the following:

1. `npm test` passes in full.
2. `npx tsc --noEmit` passes.
3. ESLint passes on all changed runtime and SEO files.
4. `npm run build` completes with the production environment.
5. The Hostinger ZIP contains `siteOrigin.ts`, `proxy.ts`, every metadata
   layout, `sitemap.ts`, `robots.ts` and `.well-known/security.txt`.
6. The extracted ZIP contains no `.env`, database, key, test, cache,
   `node_modules` or `.next` file.
7. The published ZIP matches its SHA-256 sidecar.

## Production acceptance criteria

- `https://policywatcher.online/`, `/robots.txt`, `/sitemap.xml` and
  `/.well-known/security.txt` return `200`.
- The same paths on `https://www.policywatcher.online` return `308` to the
  non-`www` URL.
- HTTP redirects directly to the non-`www` HTTPS origin in one hop.
- Every sitemap URL returns `200`, is indexable and has a matching canonical.
- No sitemap URL redirects or emits `noindex`.
- `/change/<id>` and `/change/<id>?lang=it` expose reciprocal localized links
  and self-canonical metadata.
- Search Console receives only `https://policywatcher.online/sitemap.xml`.
