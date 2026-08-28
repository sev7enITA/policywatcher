# PolicyWatcher 4.0.0 Beta 3 - AI Discoverability and Citation Readiness - August 2026

Record date: 28 August 2026

Status: source candidate. Staging and production promotion evidence must be
added only after the immutable artifact passes those gates.

PolicyWatcher 4 Beta 3 aligns the public homepage, social metadata, structured
identity and crawler controls around the same server-rendered evidence boundary.

## Highlights

- visible H1, substantive evidence-boundary copy and direct public references;
- Open Graph and Twitter metadata with a generated 1200x630 preview;
- WebSite, Organization, Person, SoftwareApplication and visible FAQ JSON-LD;
- explicit public rules for major search and AI crawlers;
- preserved sitemap, `llms.txt`, public knowledge base and protected-route exclusions;
- Agentic Incident Observatory and operational PolicyWatcher-to-PALO signal exports integrated since Beta 2;
- Hostinger packaging checks that fail closed if the new SEO sources are absent.

## Boundaries

Metadata does not guarantee external indexing, ranking, citation or
recommendation. A crawler-specific live 429 is a hosting, CDN or WAF deployment
finding until verified otherwise. Beta 3 adds no database migration or new
environment variable.

## Upgrade and verification

Deploy one immutable source artifact to staging, run the complete quality and
Hostinger smoke gates, verify `/`, `/api/og/home`, `/robots.txt`, `/sitemap.xml`
and `/llms.txt` with ordinary and crawler user agents, then promote the exact
same checksum to production.

Full audit:
`docs/audit-v4.0.0-beta.3-ai-discoverability.md`
