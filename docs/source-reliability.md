# Source Reliability Operations

PolicyWatcher separates the public canonical policy URL from an optional official retrieval URL, deduplicates shared acquisitions inside a scan, and keeps comparison and publication decisions policy-specific.

## Evidence boundaries

- A successful retrieval is not a provider change by itself.
- The first exact source-verified snapshot becomes the baseline without creating a `PolicyChange`, AI score, alert, or subscriber notification.
- Source-onboarding records awaiting QA remain private.
- Stale archive candidates can be retained as historical continuity references, but are never eligible for baseline creation or change detection.
- Provider challenge pages, empty shells and invalid or incomplete text are not public evidence.
- A changed acquisition key enters a controlled source migration. Its first verified capture establishes a replacement baseline without creating a provider-authored change, score, alert or notification.

## Hostinger deployment sequence

Run commands from the deployed Node application directory, where `package.json`, `server.js` and `scripts/` are present. The deployment `postinstall` step initializes the additive SQLite schema before the application starts.

1. Inspect the inventory without changing the database:

   ```bash
   npm run qa:source-inventory > source-inventory.json
   ```

2. Preview the legacy public-baseline repair:

   ```bash
   npm run db:repair-public-baselines
   ```

3. If the preview lists only exact-hash records supported by successful source check logs, apply it:

   ```bash
   npm run db:repair-public-baselines -- --apply
   ```

4. Run a full source scan from Cron Manager. The scan creates a `ScanRun`, performs one network acquisition for each normalized retrieval key, fans the result out to the affected policy records and records structured retrieval causes.

5. Verify the Source Reliability admin page and the public home. Policies that still lack verified public evidence remain withheld and should be handled through the remediation queue.

For the 17 August 2026 catalog correction, run `npx tsx scripts/migrate-urls.ts --dry-run --source-integrity-2026-08-17`, review the Wise, TikTok and Klarna rows, then run `npx tsx scripts/migrate-urls.ts --source-integrity-2026-08-17`. The migration marks existing public baselines as pending only when the effective acquisition key changes.

## Safe repair criteria

The repair script is dry-run by default. A record is eligible only when all of these conditions hold:

- no public snapshot currently exists;
- the current policy hash matches a successful direct, HTTP/2, rendered, Wayback or Common Crawl check log;
- an existing snapshot has that exact hash;
- no source-onboarding record is awaiting baseline or QA review.

The script writes an administrative review-log entry when that table is available. It does not fabricate source text, accept a stale archive, or create a change event.

## Operational interpretation

- `policyRecords` counts configured policy/jurisdiction records.
- `uniqueRetrievalKeys` counts normalized acquisitions required for the selected inventory.
- `networkRetrievals` counts actual scraper cascade executions.
- `deduplicatedRetrievals` counts policy acquisitions served from the scan-local shared result.
- `retrievalKeyId` is a 12-character SHA-256 fingerprint for correlating progress and protected detail records without printing the raw key into logs.
- `acquisitionMode` reports `network` for the first acquisition and `deduplicated` when a policy reuses that scan-local result.
- `SourceRemediationIssue` groups repeated failures by retrieval key and moves to `Open` after the configured consecutive-failure threshold.
- `HistoricalSourceReference` documents an older archive candidate separately from change evidence.
- `not_in_archive` means Common Crawl has no exact capture for the requested endpoint; it does not mean the live policy is gone.
- `http_202_pending` and `h2_202_pending` identify accepted-but-not-ready or challenge responses and are never treated as evidence.
- `sourceMigrationPending` suppresses ordinary change confirmation until the new endpoint has produced one verified replacement baseline.
- Archive recovery always has a freshness floor. During source migration the floor is `sourceMigrationRequestedAt`; otherwise it is the last successful check. Older captures remain historical references and cannot become current baselines.
- Hostinger maintenance scripts write SQLite `DATETIME` values as epoch milliseconds, matching Prisma. `scripts/hostinger-normalize-sqlite-datetimes.mjs` audits legacy text dates by default and converts them only with `--apply`.
- When a controlled migration replaces an acquisition key, its obsolete remediation row is resolved as superseded; an unverified replacement remains visible in the separate baseline queue until a fresh capture passes.

Do not resolve a remediation issue merely because an alternate page is reachable. Confirm that it is an official policy source, configure it as an optional retrieval URL when appropriate, and run a new scan so the evidence gate can evaluate the content.

Acquisition-key normalization removes recognized campaign parameters such as
`utm_*`, `gclid` and `fbclid`, but preserves semantic query selectors,
fragments and regional paths. Consequently, the Revolut EU path
`/legal/privacy` and UK path `/en-GB/legal/privacy` intentionally remain two
retrievals. URL labels in logs exclude credentials, query values and fragments.
