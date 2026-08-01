export const ADMIN_GUIDE_ROUTES = [
  '/admin',
  '/admin/cron',
  '/admin/source-reliability',
  '/admin/webhook-delivery',
  '/admin/vps-services',
  '/admin/database',
  '/admin/kpi-audit',
  '/admin/dataset-quality',
  '/admin/outreach',
  '/admin/review-log',
  '/admin/access-logs',
  '/admin/companies',
  '/admin/source-onboarding',
  '/admin/explainability',
] as const;

export type AdminGuideRoute = (typeof ADMIN_GUIDE_ROUTES)[number];

export interface AdminGuide {
  title: string;
  purpose: string;
  steps: readonly string[];
  keyTerms: readonly { term: string; definition: string }[];
  commonMistake: string;
}

export const ADMIN_GUIDES: Record<AdminGuideRoute, AdminGuide> = {
  '/admin': {
    title: 'Dashboard',
    purpose: 'Use the operating overview to triage current operational evidence, dataset readiness, coverage and recent activity. This page summarizes operations; it does not run scans.',
    steps: [
      'Confirm the role boundary in the heading: Admin receives operational triage routes; Auditor receives read-only verification routes and no hidden Admin-only destination or mutation form.',
      'Start with the Operational Action Center: read severity, cause, timestamp, affected count, availability and impact before following its single responsible-console action; treat unavailable metrics as unknown and an empty queue as a bounded window rather than a health certification.',
      'Scan the four live module cards using their distinct count units, refresh their protected endpoints independently, then follow the single action on any attention, critical or unavailable card.',
      'Read the Publication Readiness Funnel from Configured through Retrieved, Baseline verified, Public and Analysed using the shared denominator; use exclusions to locate records that have not reached a stage and follow its responsible-console action.',
      'Use the compact Press, System and Environment summaries only as routing evidence; open Press Outreach or Database for detail. Use Dashboard Measurement only to establish a bounded initial baseline: inspect status, eligible sample and trailing window before reading a displayed value; current priority counts are checked snapshots rather than event telemetry.',
    ],
    keyTerms: [
      { term: 'Operational priority', definition: 'A deterministic routing record derived from currently available persisted evidence.' },
      { term: 'Metric unavailable', definition: 'The application could not establish the value; it must not be interpreted as zero or healthy.' },
      { term: 'Live module check', definition: 'A bounded status normalized from one protected operational endpoint with its own timestamp, availability, count unit and responsible action.' },
      { term: 'Not enabled', definition: 'An optional service is intentionally absent; this is neutral and must not be counted as an incident or treated as measured availability.' },
      { term: 'Publication readiness stage', definition: 'A policy-level persisted evidence condition measured against the complete configured policy inventory.' },
      { term: 'Excluded', definition: 'Configured policy records that have not reached the measured stage; exclusion does not by itself identify an error.' },
      { term: 'Coverage', definition: 'How much of the configured company and policy inventory has usable evidence.' },
      { term: 'Ingestion', definition: 'The process that retrieves, validates and stores policy text.' },
      { term: 'Dashboard summary', definition: 'A compact route-level overview; detailed recovery and configuration evidence belongs to Database.' },
      { term: 'Role presentation', definition: 'A display-only mapping of action language and visible destination; protected endpoints remain the authority for authorization.' },
      { term: 'Measurement baseline', definition: 'A minimum eligible sample required before the dashboard displays an event-derived average or percentage; it is not a target.' },
      { term: 'Per-visit identifier', definition: 'A random browser-session value used only to deduplicate allowlisted dashboard events without storing an account or user identity.' },
    ],
    commonMistake: 'Do not infer permission from a visible link or hidden control. Do not combine unlike counts, interpret an unavailable metric as zero, treat a pending baseline as performance, or read an empty priority queue as a health certification.',
  },
  '/admin/cron': {
    title: 'Cron Manager',
    purpose: 'Discover policy sources for new companies and run scheduled or manual monitoring scans for approved policy documents.',
    steps: [
      'Select All companies or one company card as the scan target.',
      'Set the maximum number of policy documents to process in this run.',
      'For a company with no policies, discover sources and review every candidate inline.',
      'Approve at least one source, then run the first monitoring scan.',
      'Follow scan status, live logs and retrieval evidence for the result.',
    ],
    keyTerms: [
      { term: 'Maximum policies', definition: 'A document cap for one run. It never represents a number of companies.' },
      { term: 'Discovery', definition: 'The five-level search for likely official policy sources.' },
      { term: 'First scan', definition: 'The first approved capture that establishes a monitored baseline.' },
    ],
    commonMistake: 'Do not treat a discovered URL as monitored evidence until an administrator approves it and the first scan succeeds.',
  },
  '/admin/source-reliability': {
    title: 'Source Reliability',
    purpose: 'Inspect unique retrievals, evidence-gate coverage, dependency health, historical-reference boundaries and recurring source remediation work.',
    steps: [
      'Compare policy-record and unique-retrieval counts to identify shared acquisition keys.',
      'Review recent scan runs for unavailable unique sources and degraded dependencies.',
      'Open remediation items only after repeated failures establish a stable source problem.',
      'Verify a regional URL, official mirror or PDF before changing the configured retrieval source.',
      'Resolve an item only after a subsequent verified retrieval or documented source decision.',
    ],
    keyTerms: [
      { term: 'Acquisition key', definition: 'The normalized retrieval endpoint used to avoid duplicate network work while retaining separate policy records.' },
      { term: 'Historical reference', definition: 'Dated archive metadata that remains ineligible for current change detection.' },
      { term: 'Remediation issue', definition: 'A durable operational item created after recurring retrieval failures.' },
    ],
    commonMistake: 'Do not replace an official source with an unverified mirror or treat stale archive evidence as a current policy baseline.',
  },
  '/admin/webhook-delivery': {
    title: 'Webhook Delivery',
    purpose: 'Inspect deployment-configured destinations, persistent outbox state and bounded signed-delivery attempts. Administrators can run one cycle or reschedule an eligible terminal failure; auditors have read-only access.',
    steps: [
      'Confirm that the configured destination origin and activation time match the controlled receiver.',
      'Run one bounded cycle only after receiver ownership, secret custody and expected event handling have been reviewed.',
      'Inspect HTTP outcome, structured error code, attempt count and next-attempt time without inferring receiver processing from a 2xx response.',
      'Correct the receiver or deployment configuration before rescheduling an eligible terminal failure.',
      'Retain polling as an independent recovery path when the receiving workflow requires stronger continuity controls.',
    ],
    keyTerms: [
      { term: 'Outbox', definition: 'A persistent record that tracks one public event for one configured destination.' },
      { term: 'Attempt', definition: 'One signed HTTPS request and its sanitized local outcome.' },
      { term: 'Bounded retry', definition: 'The fixed maximum of six attempts with capped delays; it is not a delivery guarantee.' },
    ],
    commonMistake: 'Do not treat Delivered as proof that the receiving system processed the event; it records only an accepted HTTP 2xx response.',
  },
  '/admin/vps-services': {
    title: 'VPS Services',
    purpose: 'Check and configure the remote browser renderer and operations agent used when ordinary retrieval cannot capture a source.',
    steps: [
      'Review configuration readiness and current service health.',
      'Confirm that direct retrieval remains the first path and VPS rendering is a fallback.',
      'Run the smoke test after configuration or deployment changes.',
      'Inspect diagnostics before trusting a renderer response.',
    ],
    keyTerms: [
      { term: 'Direct fetch', definition: 'Retrieval performed by the main application without a remote browser.' },
      { term: 'VPS renderer', definition: 'A remote browser service used for JavaScript-heavy or protected pages.' },
      { term: 'Smoke test', definition: 'A small end-to-end check that confirms the service is reachable and usable.' },
    ],
    commonMistake: 'A successful connection is not verified policy evidence, and a failed renderer must never be recorded as verified evidence.',
  },
  '/admin/database': {
    title: 'Database',
    purpose: 'Inspect database readiness, configuration presence, recovery tools and the evidence inventory: integrity, schema, migrations, companies, policies, snapshots and detected changes.',
    steps: [
      'Review the readiness panel before interpreting inventory counts; confirm that integrity passed, all expected tables are present and the migration ledger is current.',
      'Review the six presence-only environment checks without interpreting SET as validated or healthy configuration.',
      'Administrators can create or locally verify encrypted backups in Database Recovery; Auditors receive read-only evidence with no mutation controls.',
      'Locate a company and inspect its monitored policies, then open source links to compare stored evidence with the official document.',
      'Review snapshot and change counts, then use Companies or a review workflow when a source needs correction.',
    ],
    keyTerms: [
      { term: 'Snapshot', definition: 'A stored version of policy text captured at a point in time.' },
      { term: 'Change', definition: 'A validated difference between successive policy snapshots.' },
      { term: 'Source', definition: 'The official URL from which policy evidence is retrieved.' },
      { term: 'Readiness', definition: 'A read-only check of SQLite integrity, expected tables, migration records and file access.' },
      { term: 'Environment presence', definition: 'Whether one allowlisted deployment variable exists; no secret value or validity result is exposed.' },
      { term: 'Recovery', definition: 'Administrator-only encrypted export and local summary verification; verification does not restore records.' },
    ],
    commonMistake: 'Do not interpret an unavailable check as an empty database, treat configured variables as proof of health, or apply a reset. Preserve the production file.',
  },
  '/admin/kpi-audit': {
    title: 'KPI Audit',
    purpose: 'Inspect scored policy changes and the evidence-based justification behind each KPI assessment.',
    steps: [
      'Filter by company, policy, category or review state.',
      'Open a scored change and read the cited policy evidence.',
      'Compare the justification with the captured before-and-after text.',
      'Record the appropriate human review decision.',
    ],
    keyTerms: [
      { term: 'KPI', definition: 'A structured score derived from captured policy evidence.' },
      { term: 'Justification', definition: 'The explanation connecting source text to a score.' },
      { term: 'Captured text', definition: 'The validated content available to the scoring process.' },
    ],
    commonMistake: 'Do not assess a score without checking the captured text; incomplete evidence can limit or distort KPI results.',
  },
  '/admin/dataset-quality': {
    title: 'Dataset QA',
    purpose: 'Assess dataset completeness, freshness and quality gates before evidence is considered ready for use.',
    steps: [
      'Read the current quality seal and its scope.',
      'Open failure buckets to identify missing, stale or invalid evidence.',
      'Apply the suggested remediation in the relevant operational page.',
      'Re-check the dataset after remediation and confirm the gate outcome.',
    ],
    keyTerms: [
      { term: 'Quality seal', definition: 'A summary of whether defined dataset checks currently pass.' },
      { term: 'Failure bucket', definition: 'A group of records failing the same quality condition.' },
      { term: 'Freshness', definition: 'Whether evidence was checked recently enough for its monitoring policy.' },
    ],
    commonMistake: 'Do not treat the seal as permanent; it reflects the dataset and quality checks at the time of evaluation.',
  },
  '/admin/outreach': {
    title: 'Press Outreach',
    purpose: 'Run a release outreach workflow with reviewed campaign copy, browser-local readiness checks and privacy-minimized aggregate event counts.',
    steps: [
      'Verify every current public asset and complete the browser-local launch checklist.',
      'Select the fixed campaign cohort and copy its reviewed title, pitch and allowlisted landing URL.',
      'Record one aggregate operation only after it occurs; do not enter recipient or outlet details.',
      'Read reuse, driver, outcome and correction signals separately for all time and the trailing 30 days.',
      'Follow up at most once when appropriate and keep editorial decisions outside PolicyWatcher.',
    ],
    keyTerms: [
      { term: 'Campaign cohort', definition: 'A fixed public-safe distribution category with reviewed copy, locale and landing route.' },
      { term: 'Qualified reuse event', definition: 'A Story Pack action, citation copy or embed-code copy; it is a proxy rather than confirmed publication.' },
      { term: 'Aggregate operation', definition: 'A timestamped event type, campaign ID and locale without recipient-level data.' },
    ],
    commonMistake: 'Do not interpret campaign landings, pitches or replies as unique people, delivery confirmations, editorial decisions or a conversion rate.',
  },
  '/admin/review-log': {
    title: 'Review Log',
    purpose: 'Consult the immutable ledger of human approvals, rejections and other accountable evidence decisions.',
    steps: [
      'Filter by action, target, reviewer or date.',
      'Open an entry to inspect the recorded before-and-after decision state.',
      'Trace the target back to the relevant company, policy or evidence.',
      'Use the ledger during audit and accountability reviews.',
    ],
    keyTerms: [
      { term: 'Review decision', definition: 'An explicit human approval or rejection recorded by the application.' },
      { term: 'Actor', definition: 'The authenticated role responsible for the action.' },
      { term: 'Immutable ledger', definition: 'An append-only history intended to preserve accountability.' },
    ],
    commonMistake: 'Do not use the log as an editing screen; correct evidence through the original review workflow so a new decision is recorded.',
  },
  '/admin/access-logs': {
    title: 'Access Log',
    purpose: 'Review authentication events and administrator activity for operational security and suspicious access patterns.',
    steps: [
      'Filter recent events by outcome, actor or action.',
      'Investigate repeated failures, unusual timing or unexpected admin activity.',
      'Correlate suspicious events with deployment and account changes.',
      'Escalate confirmed concerns through the appropriate security process.',
    ],
    keyTerms: [
      { term: 'Authentication event', definition: 'A recorded login, logout or session validation outcome.' },
      { term: 'Admin activity', definition: 'A security-relevant action performed in the administration area.' },
      { term: 'Suspicious pattern', definition: 'Activity whose frequency, origin or timing merits investigation.' },
    ],
    commonMistake: 'Do not use this log to investigate policy changes; policy evidence and review decisions are recorded elsewhere.',
  },
  '/admin/companies': {
    title: 'Companies',
    purpose: 'Manage the company registry, run automatic policy discovery, approve candidates and use manual policy entry only as a fallback.',
    steps: [
      'Create a company with its official website and registry details.',
      'Let automatic discovery inspect official pages, legal hubs and sitemaps.',
      'Review and approve or reject every candidate source.',
      'Use manual policy entry only when an official source cannot be discovered.',
      'Move to Cron Manager to establish and monitor the approved baseline.',
    ],
    keyTerms: [
      { term: 'Registry', definition: 'The list of companies and approved policy sources managed by PolicyWatcher.' },
      { term: 'Candidate', definition: 'A discovered source awaiting a human decision.' },
      { term: 'Manual fallback', definition: 'Administrator entry of a verified official source when discovery cannot find it.' },
    ],
    commonMistake: 'Do not manually add every policy before allowing discovery to search; manual entry is the controlled fallback.',
  },
  '/admin/source-onboarding': {
    title: 'Source Onboarding',
    purpose: 'Import multiple operator-supplied companies and policy URLs while preserving a durable, accountable path from proposed source to public evidence.',
    steps: [
      'Paste CSV or TSV rows and preview every normalization, duplicate, and validation result before committing.',
      'Commit the batch, then start and complete official-source review for each proposed candidate.',
      'Approve valid sources and run a targeted first baseline; the capture remains private.',
      'Run the scoped QA gate after the baseline reaches QA Review.',
      'Publish, hold, or reject only after reviewing the QA result and source continuity.',
    ],
    keyTerms: [
      { term: 'Proposed source', definition: 'An operator-supplied URL stored as a candidate, not as public evidence.' },
      { term: 'Private baseline', definition: 'A verified first capture held behind publicEvidence until QA and an explicit decision.' },
      { term: 'Publication decision', definition: 'The accountable admin action that publishes, holds, or rejects QA-reviewed evidence.' },
    ],
    commonMistake: 'Importing or approving a URL does not publish evidence; the private baseline must pass QA and receive an explicit publication decision.',
  },
  '/admin/explainability': {
    title: 'Explainability',
    purpose: 'Trace how captured policy evidence is transformed into changes, KPI assessments and published claims.',
    steps: [
      'Select a company, policy or evidence record to trace.',
      'Follow the provenance from source retrieval through stored snapshots.',
      'Read the reasoning that connects evidence to KPIs or claims.',
      'Check limitations, confidence and unavailable context before relying on the result.',
    ],
    keyTerms: [
      { term: 'Provenance', definition: 'The traceable origin and processing history of a piece of evidence.' },
      { term: 'Claim', definition: 'A conclusion presented by the application and supported by captured evidence.' },
      { term: 'Limitation', definition: 'A known boundary in source availability, capture quality or interpretation.' },
    ],
    commonMistake: 'Do not read a KPI or claim without its provenance and limitations; explainability provides the necessary context.',
  },
};

export function getAdminGuide(pathname: string): AdminGuide | null {
  const matchingRoute = [...ADMIN_GUIDE_ROUTES]
    .sort((a, b) => b.length - a.length)
    .find((route) => route === '/admin' ? pathname === route : pathname.startsWith(route));
  return matchingRoute ? ADMIN_GUIDES[matchingRoute] : null;
}
