# PolicyWatcher 4.0.0 Beta 3 - AI Discoverability and Citation Readiness - August 2026

Record date: 28 August 2026

Status: deployed to staging and production from one immutable, staging-attested
artifact.

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

## Deployment record

- Merged source revision: `a2fd809ac2c0fe4d1625b7d3b29f07e33c5544f1`
- Artifact SHA-256: `6e561c32e68378d260db6acbe3341875b47b85c3c1d697f7cb329a588e2b0265`
- Staging gate: `11/11` checks passed on 28 August 2026
- Production backup: completed before promotion
- Production deployment: `Completed` and `Current` at 11:24 local time on
  28 August 2026
- Live identity: homepage and `/api/v1/manifest` report `4.0.0-beta.3`
- Live evidence: SSR SEO markers, 1200x630 OG image, explicit crawler rules,
  247 sitemap URLs, `llms.txt`, database readiness and 15 public companies
  verified
- Open infrastructure item: Hostinger returns HTTP 429 only for `GPTBot/1.0`;
  all other tested search and AI crawlers return HTTP 200. A Hostinger support
  escalation was submitted with the reproduction timestamp and HCDN request ID.
