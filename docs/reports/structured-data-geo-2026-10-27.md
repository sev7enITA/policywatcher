# Structured data and AI discovery consistency

Audit date: 27 October 2026. Baseline production/source: `7be651e26ebe33e6d45306cb7ba9c2d6f47c3f09`.
The schema corrections were deployed to production on 27 October 2026 at 23:44 Europe/Rome and merged in [PR #33](https://github.com/sev7enITA/policywatcher/pull/33). The deployment and follow-up discovery observations are recorded below.

## Findings and changes

- `/press-kit` used `codeRepository` on `SoftwareApplication`. Schema.org defines this property on `SoftwareSourceCode`; the official validator reproduced one warning. A separate source-code node now links to the application through `targetProduct`.
- The founder's `sameAs` included the project repository on the press kit but the personal GitHub profile on the homepage. Both now use the same personal profiles. The source repository remains attached to the project/source-code entity.
- The application publication date in the press kit changed with each release. It now uses `dateModified`, consistent with the homepage. No undocumented first-publication date is invented.
- About, the guides index and guide-detail routes used an ineffective less-than replacement: the JavaScript string literal evaluated to `<`. All public JSON-LD surfaces now reuse one database-independent serializer. Tests cover nested script-breakout strings, HTML comments, multilingual text and Unicode line separators while preserving JSON round trips.
- Publisher/author stubs now share stable IDs, type, name and canonical URL. The monitored company reference in a policy record reuses the company-page identity. Anonymous inline organizations were valid Schema.org; this change improves consistency, not JSON validity. The earlier guide publisher reference also resolved through its inline author with the same ID; it was not an unresolved reference.
- `llms.txt` links to the existing About, notice-checking and Wise AUP EN/IT pages. No hidden content, bot-specific claims, crawler-policy relaxation, ratings, reviews or offers were added.

## Verification scope

Production baseline: 564 sitemap URLs fetched, 534 with JSON-LD. All JSON parsed. Vocabulary type/property/domain checks against the official Schema.org V30.1 vocabulary found only the press-kit warning above. These checks are not a substitute for complete JSON-LD expansion, Google eligibility, or a manual content audit.

Candidate: 117 sitemap URLs served from a production build with an isolated, explicitly synthetic local database; 87 contain JSON-LD. No vocabulary findings. Existing SEO smoke passed all 117 URLs, checking canonical, language alternates, initial HTML metadata, robots and duplicate titles. A further 154 checks passed for owned-entity references within each document, guide headline/language/modified-date correspondence, visible citation links, visible homepage FAQs and new discovery links.

Official Schema.org Validator: baseline press kit 0 errors/1 warning; corrected candidate snippet 0 errors/0 warnings. Google Rich Results Test was attempted but reported that its reCAPTCHA service was unreachable. No Google Rich Results Test pass is asserted.

Local build passed. The full suite with coverage passed 1,313 tests, with 14 ordinary skips. Lint: 0 errors and 15 pre-existing warnings. The first CI run caught an old source-string assertion that did not include the newly explicit monitored-company ID; that assertion was updated to preserve the intended identity contract. No application behavior was changed to satisfy the old assertion.

GLM-5.3 High independently inspected baseline public source, four live pages and official documentation, and found no blocker in the described fixes. The final diff review and release status are recorded in PR #33. GLM did not run the full crawl or local tests; its review is advisory and separate from execution evidence. Two initial reviewer claims were corrected: there were three affected serializer routes, and the guide publisher reference was already resolvable through its author node.

## Production and discovery verification

Production source revision: `6e2e9d51db83a6c4d964815d8aa1301dae4a9cbf`; merged commit: `d0703d302ab617ae756de3876252f393f2919c11`. Their source trees match. The immutable ZIP SHA-256 is `c95b933c5382fa0fcf03b296feb785dc5c7e5e1c837849f124e67cb74d2d3d78`. The Hostinger production gate passed and created a consistent database backup before startup.

Post-deployment verification passed nine application checks, database readiness and authenticated health, 26 public workflow/export checks, and SEO checks across 564 sitemap URLs. All 534 pages containing JSON-LD parsed and passed the executed vocabulary checks. The graphs on all 81 comparable static pages exactly matched the tested candidate. Twelve principal pages and 245 linked resources passed the scoped launch check. A synthetic known-company notice returned public evidence through the browser; mobile homepage-to-notice navigation passed at 390 pixels without horizontal overflow.

A subsequent initial-HTML navigation crawl reached all 564 sitemap URLs from the homepage, preserving both `lang=en` and `lang=it`. Maximum depth was four links; the main discovery pages were within one or two. Current robots rules permit all sitemap pages for the seven tested search/user-fetcher tokens while keeping operational paths excluded.

Google Search Console reported the homepage indexed. Its live smartphone inspection on 27 October 2026 at 23:55 Europe/Rome reported the URL available to Google and eligible for indexing. The submitted sitemap was successful with 564 discovered URLs and a same-day read. These observations do not imply every sitemap URL is indexed.

The 35 HTTP probes using OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot and Claude-User names returned HTTP 200 and initial-HTML content where applicable. Fourteen Googlebot/Bingbot-name probes from the operator network returned HTTP 403 at Hostinger/LiteSpeed. User-agent strings do not authenticate crawler identity; these probes are not evidence that genuine search crawlers are blocked. The successful Google live inspection is stronger evidence for Google's access. No firewall protection was weakened, and genuine Bingbot-IP access was not independently established.

The discovery-file audit found one unqualified export link in `llms.txt`: `/api/v1/evidence-collections` correctly returns HTTP 400 without a selection. The follow-up changes that link to `/collections` and explains the required `changes` parameter and supported formats. This preserves the API validation boundary instead of turning an invalid request into a successful response. The follow-up deployment receipt belongs in its pull request; the PR #33 receipt above describes the schema release.

## SEO/GEO boundaries

Schema.org vocabulary validity does not imply eligibility for every Google rich result. The software application intentionally lacks fabricated offers and review ratings; its Google software rich-result eligibility is not claimed. Guide first-publication dates remain absent where not documented. FAQ markup matches visible content and is retained as semantics, without promising a retired search appearance.

Google's AI search features require the normal SEO foundations, not special AI markup. Server-rendered content, canonical URLs, reciprocal EN/IT links, consistent entities, dated observations and visible primary sources remain the focus. `llms.txt` is a discovery convention; this work provides no evidence of a ranking or AI-citation uplift. Existing search baselines must be compared with a later, consolidated observation period.

## Primary references

- https://schema.org/codeRepository
- https://schema.org/targetProduct
- https://validator.schema.org/
- https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- https://developers.google.com/search/docs/appearance/structured-data/software-app
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/appearance/ai-features
- https://www.hostinger.com/support/hostinger-cdn-search-engine-crawlers-and-seo/
- https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
- https://developers.openai.com/api/docs/bots
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
