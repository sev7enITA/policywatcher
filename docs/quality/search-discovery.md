# Public search and agent discovery

The HTML knowledge, change, evidence and guide pages are the intended search landing pages. Evidence-packet downloads (JSON/PDF) and parameterized evidence-collection exports (JSON/CSV/Markdown/handoff) return `X-Robots-Tag: noindex`. This excludes those exports from search results without blocking HTTP retrieval, CORS access or agent use. The public API discovery documents and feeds remain available. Do not add a broad `/api` robots block.

Noindex is an intentional exclusion policy for downloads, not a replacement for canonicalizing equivalent HTML pages. Keep localized HTML self-canonical and preserve reciprocal language alternates. Do not remove a real language variant simply because a search result does not show it.

## Release checks

- Run the public SEO smoke command against the candidate origin: `npm run seo:smoke -- --base-url <origin> --output <local-report.json>`. Use `--expect-noindex` for the configured staging target. The script performs read-only requests.
- Check successful JSON/PDF evidence packets and every collection format: body and content type remain usable; X-Robots-Tag is noindex; existing cache and CORS behavior is preserved. Check a withheld/missing record still returns 404.
- Check the corresponding HTML evidence page is still indexable in production. Staging intentionally remains noindex.
- Verify HTTP and www redirects, canonical URLs, initial HTML, language alternates and source dates. Do not submit arbitrary generated filter/export URLs as sitemap pages.

## Search Console review

Export indexing examples locally and classify by HTML family, download format, hostname, language and other query parameters. Keep account exports out of the public repository. A count of excluded URLs includes expected redirects, alternatives and downloads; it is not an error count.

For important HTML pages with unexpected canonical selection, inspect the declared and Google-selected URLs, last crawl and actual content before changing redirects or tags. Distinguish historical validation failures from current deployment state. Check 404s against internal links; do not redirect unrelated deleted content to the homepage.

For content decisions, segment query/page/country/device and compare equivalent 28-day windows. A user seeking an official document may prefer the provider. Titles and introductions should identify PolicyWatcher as an independent source history/comparison service. Do not infer a title defect from aggregate CTR alone.

## Repeatable AI/search observation

Use `search-discovery-template.csv` as a local observation register. Suggested queries:

- PolicyWatcher policy changes
- How can I check what changed in a privacy notice?
- Wise acceptable use policy source and version history
- AWS Data Processing Addendum official source
- Anthropic acceptable use policy changes

Record the engine, language, date, exact cited URL and observed retrieval date. Compare factual claims with the dated public record. Mark missing evidence as unavailable. Do not assume a crawler visit proves indexing, indexing proves citation, or a citation proves a user visit. Google AI-feature impressions describe that report's scope, not visibility in unrelated assistants.

Use supported recrawl/refresh mechanisms only after a changed page is live and verified. A submitted request is not confirmation of indexing. `llms.txt`, schema and permissive robots are discovery aids, not citation guarantees. Never change security controls or allow private routes to increase crawler access.

## Performance and accessibility

Record Lighthouse/device/network settings and repeat comparable runs on home, notice and policy record. Keep local lab results separate from field Core Web Vitals. A missing field sample is not a pass. Check 320/390px, zoom, keyboard, visible focus, menu closure and form announcements. Use synthetic notices and a disposable local database for submission tests.

References: [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).
