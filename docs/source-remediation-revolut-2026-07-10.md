# Revolut Source Remediation - 2026-07-10

PolicyWatcher detected four Revolut sources as unavailable during the July 10, 2026 Cron Manager scan:

- Revolut / Privacy Policy / EU
- Revolut / Privacy Policy / UK
- Revolut / Terms of Use / EU
- Revolut / Terms of Use / UK

## Finding

The configured sources are official Revolut pages, but automated retrieval did not produce evidence-grade policy text. The retrieval cascade attempted direct HTTP, explicit HTTP/2, VPS-rendered browser retrieval, Wayback, and Common Crawl. The live strategies returned provider access protection or unusable text, while archive strategies did not provide a fresh usable baseline.

This is not treated as a renderer failure. The VPS renderer improves coverage for script-rendered pages, but it is not a bypass layer for provider anti-bot or WAF challenges.

## Remediation Applied

The source remediation scripts and Hostinger inventory now split Revolut records by market:

| Record | Source |
| --- | --- |
| Revolut Privacy Policy / EU | `https://www.revolut.com/en-LT/legal/privacy/` |
| Revolut Privacy Policy / UK | `https://www.revolut.com/legal/privacy/` |
| Revolut Terms of Use / EU | `https://www.revolut.com/en-LT/legal/terms/` |
| Revolut Terms of Use / UK | `https://www.revolut.com/legal/terms/` |

These mappings are remediation candidates, not automatic publication approval. If the provider challenge persists, the records remain suspended.

## Publication Rule

PolicyWatcher must not expose public risk scores, KPI values, timeline events, AI summaries, reports, or change analysis for these records until one of the following is true:

- a live retrieval strategy returns complete, usable policy text;
- an official PDF or CDN-hosted document is verified and stored as source evidence;
- an administrator performs a traced review and records the source decision.

Challenge pages, placeholders, stale archive snapshots, and too-short bodies are not accepted as public evidence.

## Operator Notes

After deploying release 3.6.3, run the Hostinger-safe remediation script:

```bash
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
cd /home/u847874844/domains/policywatcher.online/nodejs
export DATABASE_URL="file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db"
node scripts/hostinger-remediate-sources.mjs --dry-run
node scripts/hostinger-remediate-sources.mjs
```

Then run a targeted Cron Manager scan with company slug `revolut`. If Revolut remains blocked, keep the sources suspended and use Dataset QA / Review Log to track the decision.
