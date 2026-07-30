# Source Reliability Operations

PolicyWatcher separates the public canonical policy URL from an optional official retrieval URL, deduplicates shared acquisitions inside a scan, and keeps comparison and publication decisions policy-specific.

## Evidence boundaries

- A successful retrieval is not a provider change by itself.
- The first exact source-verified snapshot becomes the baseline without creating a `PolicyChange`, AI score, alert, or subscriber notification.
- Source-onboarding records awaiting QA remain private.
- Stale archive candidates can be retained as historical continuity references, but are never eligible for baseline creation or change detection.
- Provider challenge pages, empty shells and invalid or incomplete text are not public evidence.

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
- `SourceRemediationIssue` groups repeated failures by retrieval key and moves to `Open` after the configured consecutive-failure threshold.
- `HistoricalSourceReference` documents an older archive candidate separately from change evidence.

Do not resolve a remediation issue merely because an alternate page is reachable. Confirm that it is an official policy source, configure it as an optional retrieval URL when appropriate, and run a new scan so the evidence gate can evaluate the content.
