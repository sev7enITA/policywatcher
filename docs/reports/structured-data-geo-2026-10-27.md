# Structured data and AI discovery consistency

Audit date: 27 October 2026. Baseline production/source: `7be651e26ebe33e6d45306cb7ba9c2d6f47c3f09`.
This report describes a verified candidate, not a production deployment receipt.

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
