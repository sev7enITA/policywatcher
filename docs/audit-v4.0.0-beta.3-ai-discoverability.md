# PolicyWatcher 4.0.0 Beta 3 AI discoverability audit

Release: `4.0.0-beta.3` - AI Discoverability and Citation Readiness

Audit date: 28 August 2026

Status: source candidate; staging and production verification are recorded separately.

## Decision

The supplied 45% discoverability report identified useful metadata gaps, but
its central claim that the homepage exposed zero words and no headings without
JavaScript did not match the repository or live server-rendered response. The
site already exposed an H1, public knowledge counts, a canonical description,
robots, sitemap and `llms.txt`. No prerendering service is required.

Beta 3 fixes the confirmed gaps and makes the existing evidence boundary easier
for simplistic scanners to recognize. It does not present SEO metadata as proof
of indexing, ranking, citation or recommendation.

## Findings and treatment

| Report claim | Verified state | Treatment |
| --- | --- | --- |
| Blank without JavaScript / zero words | False; the homepage is dynamically server-rendered and its knowledge snapshot is HTML. | Keep SSR, move the primary topic and explanation into a visible non-collapsed introduction and stream dynamic counts below it. |
| Missing H1 | False, but the H1 was visually hidden. | Publish one visible descriptive H1. |
| Missing meta description | False; Next.js metadata already emitted it. | Centralize the title, description and canonical URL with social metadata. |
| No Open Graph or Twitter metadata | Confirmed on the homepage. | Add canonical OG/Twitter cards and a generated 1200x630 image endpoint. |
| No structured data | Confirmed on the homepage, but not site-wide. | Add a conservative WebSite, Organization, Person, SoftwareApplication and FAQPage JSON-LD graph. |
| No FAQ | Confirmed and optional. | Add three visible, useful evidence-boundary answers and mirror only those answers in FAQPage schema. |
| No author/contact signals | False site-wide; About, footer and Press Kit already provide them. | Reuse verified founder, repository and public email identity in the homepage graph. |
| No `noscript` fallback | True but not required for SSR content. | Add a short explanation distinguishing the crawlable evidence summary from the JavaScript workspace. |

## Crawler controls

Production robots rules explicitly allow public routes for major search and AI
crawlers and continue to disallow protected or mutation APIs. Staging remains
fully non-indexable. The sitemap and `llms.txt` contracts are unchanged.

An earlier live probe returned content for `OAI-SearchBot` but HTTP 429 for
`GPTBot`. Repository middleware does not deny ordinary homepage HTML, so a
remaining 429 must be traced through Hostinger, CDN or WAF configuration during
deployment. The source patch alone does not claim that external condition is
fixed.

## Verification contract

Before promotion, the candidate must pass the repository test, lint, TypeScript
and production-build gates; the clean release package must retain the homepage,
SEO constants, OG route and this audit. The extracted artifact must build from
its own contents. Staging and production must then be checked using ordinary and
crawler user agents, with the immutable artifact checksum recorded.
