# PolicyWatcher v3.5.1 Architecture & Workflow Diagrams

Status: Confidence maintenance release
Purpose: reusable diagrams for documentation, presentations, audits, and third-party technical review.

These diagrams describe what PolicyWatcher does today. They use a certification boundary: the platform maps source-backed policy evidence, retrieval quality, changes, risk signals, and governance metadata.

## Diagram Inventory

1. System context
2. Runtime deployment topology
3. Policy ingestion cascade
4. Evidence gate and public exposure model
5. Seeded re-baseline versus real change workflow
6. Dataset QA lifecycle
7. Admin control plane
8. VPS operations lifecycle
9. Data model ERD
10. Security and trust boundaries
11. KPI assessment lifecycle
12. Source remediation workflow

---

## 1. System Context

Use this diagram to explain PolicyWatcher in one slide: who interacts with the platform, which services are involved, and where evidence enters the system.

```mermaid
flowchart LR
  publicUsers["Public users<br/>Dashboard, timeline, signals board, share pages"]
  adminUsers["Admin / auditor<br/>Admin panel, Cron Manager, QA, VPS Services"]
  subscribers["Subscribers<br/>Email alerts and digests"]

  app["PolicyWatcher Next.js app<br/>Hostinger runtime"]
  db[("Production SQLite DB<br/>outside extracted app root")]
  renderer["Renderer VPS<br/>render.policywatcher.online<br/>Playwright DOM retrieval"]
  ops["VPS Operations Agent<br/>ops.policywatcher.online<br/>backup, smoke, update, rollback"]
  gemini["Google Gemini API<br/>AI-assisted policy analysis"]
  mail["Email delivery<br/>alerts, digests, admin suspension notices"]

  sources["Official policy sources<br/>provider legal pages"]
  wayback["Wayback Machine<br/>archive recovery"]
  commoncrawl["Common Crawl<br/>archive recovery"]

  publicUsers --> app
  adminUsers --> app
  subscribers <-->|subscribe / notify| app

  app <--> db
  app -->|direct fetch / HTTP2| sources
  app -->|POST /render| renderer
  app -->|HMAC admin ops| ops
  app -->|structured analysis| gemini
  app --> mail
  app --> wayback
  app --> commoncrawl

  renderer --> sources
  ops --> renderer
```

---

## 2. Runtime Deployment Topology

Use this diagram for infrastructure discussions. The key point is separation: Hostinger serves the product and APIs, while the VPS only provides controlled companion services.

```mermaid
flowchart TB
  subgraph Hostinger["Hostinger shared Node.js deployment"]
    next["Next.js 16 app<br/>public routes + admin routes + API routes"]
    middleware["Middleware<br/>security headers, auth routing"]
    sqlite[("SQLite production.db<br/>/policywatcher-data/production.db")]
    env["Hostinger environment variables<br/>DATABASE_URL, API_SECRET, SESSION_HMAC_SECRET,<br/>GEMINI_API_KEY, RENDERER_URL, RENDERER_SECRET,<br/>VPS_AGENT_URL, VPS_AGENT_SECRET"]
    next --> middleware
    next <--> sqlite
    next --> env
  end

  subgraph VPS["VPS 187.124.184.225"]
    nginx["nginx + TLS"]
    rendererSvc["policywatcher-renderer.service<br/>node --preserve-symlinks-main current/server.mjs"]
    agentSvc["policywatcher-vps-agent.service<br/>agent.mjs"]
    current["/opt/policywatcher-renderer/current<br/>symlink to versions/3.5.1-*"]
    versions["/opt/policywatcher-renderer/versions"]
    packages["/opt/policywatcher-renderer/packages"]
    backups["/opt/policywatcher-renderer/backups"]

    nginx --> rendererSvc
    nginx --> agentSvc
    rendererSvc --> current
    current --> versions
    agentSvc --> current
    agentSvc --> packages
    agentSvc --> backups
  end

  next -->|HTTPS bearer render call| nginx
  next -->|HTTPS HMAC operation call| nginx
```

---

## 3. Policy Ingestion Cascade

Use this diagram to explain how a single policy source is fetched. Each step records diagnostics, reason, HTTP status where available, and escalation path.

```mermaid
flowchart TD
  start["Policy selected for scan<br/>Cron Manager, API scrape, or scheduled cron"]
  direct["1. Hostinger direct fetch<br/>socket-pinned HTTP client, SSRF guard"]
  validateDirect{"Substantive policy text?<br/>host/path coherent?<br/>not over-cap partial?"}
  h2["2. Hostinger HTTP/2 fetch<br/>socket-pinned HTTP/2, SSRF guard"]
  validateH2{"Valid source evidence?"}
  rendered["3. VPS renderer<br/>Playwright DOM retrieval"]
  validateRendered{"Valid rendered evidence?"}
  wayback["4. Wayback archive<br/>freshness guarded"]
  validateWayback{"Usable archive evidence?"}
  cc["5. Common Crawl archive<br/>WARC recovery"]
  validateCC{"Usable archive evidence?"}
  accepted["Accepted evidence<br/>text, hash, source, final URL, length, timestamp"]
  suspended["Temporarily suspended<br/>Partial, Needs Review, Unavailable, or Invalid"]
  log["PolicyCheckLog<br/>strategy outcomes + diagnostics"]
  notify["Admin suspension email<br/>when source anomaly requires review"]

  start --> direct --> validateDirect
  validateDirect -->|yes| accepted
  validateDirect -->|no: reason recorded| h2 --> validateH2
  validateH2 -->|yes| accepted
  validateH2 -->|no: reason recorded| rendered --> validateRendered
  validateRendered -->|yes| accepted
  validateRendered -->|no: reason recorded| wayback --> validateWayback
  validateWayback -->|yes| accepted
  validateWayback -->|no: stale, aborted, unavailable| cc --> validateCC
  validateCC -->|yes| accepted
  validateCC -->|no| suspended

  direct -. diagnostics .-> log
  h2 -. diagnostics .-> log
  rendered -. diagnostics .-> log
  wayback -. diagnostics .-> log
  cc -. diagnostics .-> log
  suspended --> log
  suspended --> notify
```

---

## 4. Evidence Gate And Public Exposure Model

Use this diagram for trust discussions. Public routes do not simply read "anything in the database"; they read source-gated evidence.

```mermaid
flowchart TD
  policy["Policy record"]
  seeded{"ingestionMethod = Seeded?"}
  status{"dataStatus"}
  snapshot{"publicEvidence snapshot?"}
  change{"publicEvidence change?"}
  publicApi["Public APIs<br/>companies, changes, trends, matrix, leaderboard"]
  publicUi["Public UI<br/>dashboard, timeline, share, embed, reports"]
  adminOnly["Admin-only inspection<br/>database, QA, review log, source suspensions"]
  blocked["Not publicly exposed<br/>shown as pending or suspended"]

  policy --> seeded
  seeded -->|yes| blocked
  seeded -->|no| status
  status -->|Partial, Needs Review, Unavailable, Configured| blocked
  status -->|Available, Reviewed| snapshot
  snapshot -->|no| blocked
  snapshot -->|yes| change
  change -->|yes| publicApi --> publicUi
  change -->|no: baseline only| publicApi

  blocked --> adminOnly
```

---

## 5. Seeded Re-Baseline Versus Real Change

Use this diagram to explain the red-team hardening decision: first real evidence replaces seed data, but does not create a fake market event.

```mermaid
flowchart TD
  scan["Successful evidence fetch"]
  seededCandidate{"Policy is seed-only?<br/>Seeded ingestion and no source-evidence logs,<br/>no public snapshots, no reviewed change history"}
  rebaseline["Re-baseline<br/>replace seeded history with one public baseline snapshot"]
  noChange["No PolicyChange<br/>No AI score<br/>No subscriber alert"]
  compare["Normal comparison<br/>new hash vs current hash"]
  same{"Hash unchanged?"}
  changed{"Hash changed?"}
  ai["Gemini analysis<br/>summary, risk score, KPI fields, region impacts"]
  writeChange["Create publicEvidence PolicySnapshot<br/>Create publicEvidence PolicyChange"]
  notify["Notify subscribers<br/>only for material source-backed changes"]
  suspend["Needs Review<br/>if old baseline is not public evidence"]

  scan --> seededCandidate
  seededCandidate -->|yes| rebaseline --> noChange
  seededCandidate -->|no| compare --> same
  same -->|yes| noChange
  same -->|no| changed
  changed -->|previous baseline public| ai --> writeChange --> notify
  changed -->|previous baseline not public| suspend
```

---

## 6. Dataset QA Lifecycle

Use this diagram to show that dataset quality is not cosmetic. It is an operational control loop.

```mermaid
flowchart LR
  inventory["Company + policy inventory<br/>Configured sources"]
  scan["Scan batch<br/>least-recently checked or targeted slug"]
  evidence["Evidence telemetry<br/>source, HTTP status, final URL, hash, text length"]
  qa["Dataset QA engine<br/>source fit, duplicates, stale evidence,<br/>publicEvidence, KPI coverage, check logs"]
  issues["QA issues<br/>open / reviewed / ignored"]
  review["Admin review action<br/>reasoned decision"]
  remediation["Source remediation<br/>URL fix, suspension, targeted rescan"]
  publish["Public evidence gate<br/>only valid source-backed records"]

  inventory --> scan --> evidence --> qa --> issues
  issues --> review
  review --> remediation
  remediation --> scan
  qa --> publish
```

---

## 7. Admin Control Plane

Use this diagram to explain what the admin area controls and how it supports operations, QA, and auditing.

```mermaid
flowchart TB
  admin["Admin user"]
  auditor["Auditor user<br/>read-oriented role"]
  auth["Admin auth<br/>HMAC-signed HTTP-only session cookie"]
  accessLog["AdminAccessLog<br/>login, failures, logout, invalid session,<br/>config errors, VPS operation events"]

  dashboard["Admin Dashboard<br/>metrics and status"]
  cron["Cron Manager<br/>batch scan, targeted company slug,<br/>live diagnostics"]
  companies["Company Registry<br/>company + policy CRUD"]
  qa["Dataset QA<br/>findings, review, CSV export"]
  db["Database Inspector<br/>health and evidence state"]
  kpi["KPI Audit<br/>assessment coverage and pending states"]
  vps["VPS Services<br/>renderer health, smoke, agent backup/update/rollback"]
  review["Review Log<br/>append-only QA and system actions"]

  admin --> auth
  auditor --> auth
  auth --> accessLog
  auth --> dashboard
  auth --> cron
  auth --> companies
  auth --> qa
  auth --> db
  auth --> kpi
  auth --> vps
  auth --> review

  cron --> qa
  companies --> cron
  qa --> review
  vps --> accessLog
```

---

## 8. VPS Operations Lifecycle

Use this diagram for operational handover. The admin panel never sends shell commands or arbitrary package URLs.

```mermaid
sequenceDiagram
  participant Admin as Admin panel
  participant App as Hostinger API
  participant Agent as VPS Operations Agent
  participant Renderer as Renderer service
  participant FS as VPS filesystem

  Admin->>App: Request status / backup / update / rollback
  App->>App: Sign HMAC timestamp + nonce + body hash
  App->>Agent: HTTPS request to fixed endpoint
  Agent->>Agent: Verify HMAC, freshness, nonce, role-safe action

  alt status
    Agent->>Renderer: GET local /healthz
    Agent-->>App: renderer current symlink + health + lock state
  else backup
    Agent->>FS: tar current renderer excluding .env and node_modules
    Agent-->>App: backup file metadata
  else verified update
    Agent->>FS: find local package by SHA256 in fixed packages directory
    Agent->>FS: reject unsafe archive paths and .env entries
    Agent->>FS: extract into staging, npm install
    Agent->>FS: switch current symlink atomically
    Agent->>Renderer: restart systemd service
    Agent->>Renderer: fixed smoke test
    Agent-->>App: success or rollback result
  else rollback
    Agent->>FS: switch current to previous version
    Agent->>Renderer: restart + fixed smoke test
    Agent-->>App: rollback result
  end
```

---

## 9. Data Model ERD

Use this diagram for technical audit and onboarding.

```mermaid
erDiagram
  Company ||--o{ Policy : owns
  Policy ||--o{ PolicySnapshot : versions
  Policy ||--o{ PolicyChange : changes
  Policy ||--o{ PolicyCheckLog : check_logs
  PolicySnapshot ||--o{ PolicyChange : old_snapshot
  PolicySnapshot ||--o{ PolicyChange : new_snapshot
  PolicyChange ||--o{ RegionImpact : region_impacts
  PolicyChange ||--o{ AdminReviewLog : review_logs

  Company {
    string id PK
    string name
    string slug
    string industry
    string website
  }

  Policy {
    string id PK
    string companyId FK
    string name
    string type
    string jurisdiction
    string url
    string currentHash
    string dataStatus
    string ingestionMethod
    datetime lastCheckDate
    datetime lastSuccessfulCheckDate
  }

  PolicyCheckLog {
    string id PK
    string policyId FK
    string status
    string source
    int httpStatus
    string reason
    string finalUrl
    string textHash
    int textLength
    datetime archiveTimestamp
  }

  PolicySnapshot {
    string id PK
    string policyId FK
    int version
    string hash
    boolean publicEvidence
  }

  PolicyChange {
    string id PK
    string policyId FK
    string oldSnapshotId FK
    string newSnapshotId FK
    string overallRisk
    int overallScore
    boolean publicEvidence
    string kpiDataCollection
    string kpiThirdPartySharing
    string kpiAiTrainingOptOut
    string kpiContentModeration
  }

  RegionImpact {
    string id PK
    string policyChangeId FK
    string region
    string perspective
    string riskLevel
  }

  AdminReviewLog {
    string id PK
    string actorRole
    string action
    string targetType
    string targetId
    string policyChangeId FK
  }

  AdminAccessLog {
    string id PK
    string event
    string username
    string actorRole
    string ipAddress
    string path
    datetime createdAt
  }

  DatasetQaIssueReview {
    string id PK
    string issueKey
    string status
    string severity
    string area
    string entityType
    string entityId
  }

  Subscriber {
    string id PK
    string email
    string regions
    string industries
    string frequency
    boolean isActive
  }
```

---

## 10. Security And Trust Boundaries

Use this diagram with auditors. It separates public access, admin authority, server-side secrets, renderer capability, and update authority.

```mermaid
flowchart TB
  subgraph PublicBoundary["Public boundary"]
    publicRoutes["Public routes and APIs<br/>read-only, evidence-gated"]
    publicData["Only publicEvidence + source-backed data"]
  end

  subgraph AdminBoundary["Admin boundary"]
    adminRoutes["Admin routes<br/>session cookie, role checks"]
    accessLogs["Access logs<br/>minimized IP, event trail"]
    vpsOps["VPS operation controls<br/>admin only"]
  end

  subgraph ServerSecrets["Server-side secrets"]
    apiSecret["API_SECRET"]
    sessionSecret["SESSION_HMAC_SECRET"]
    rendererSecret["RENDERER_SECRET"]
    agentSecret["VPS_AGENT_SECRET"]
    geminiKey["GEMINI_API_KEY"]
  end

  subgraph RetrievalBoundary["Retrieval boundary"]
    direct["Direct and HTTP2 clients<br/>DNS pinning, private IP block,<br/>redirect and host-drift checks"]
    renderer["VPS renderer<br/>URL validation, request interception,<br/>sanitized errors"]
    archive["Archive recovery<br/>freshness guards and timestamp evidence"]
  end

  publicRoutes --> publicData
  adminRoutes --> accessLogs
  adminRoutes --> vpsOps
  ServerSecrets --> adminRoutes
  ServerSecrets --> RetrievalBoundary
  RetrievalBoundary --> publicData
```

---

## 11. KPI Assessment Lifecycle

Use this diagram to explain why a source-verified baseline can still show KPI assessment pending.

```mermaid
flowchart TD
  baseline["Verified source baseline<br/>publicEvidence snapshot"]
  change{"Source-backed change detected?"}
  pending["KPI assessment pending<br/>baseline is valid, but no public PolicyChange analysis exists"]
  gemini["Gemini structured analysis<br/>risk, summary, 15 KPI fields, region impacts"]
  normalize["KPI normalization<br/>closed allowed values only"]
  save["PolicyChange persisted<br/>publicEvidence true"]
  publicMatrix["Public KPI Matrix<br/>shows only source-backed KPI assessments"]
  adminAudit["Admin KPI Audit<br/>shows pending coverage for QA"]

  baseline --> change
  change -->|no| pending --> adminAudit
  change -->|yes| gemini --> normalize --> save
  save --> publicMatrix
  save --> adminAudit
```

Planned extension: a dedicated `PolicyBaselineAssessment` model can assess verified baselines without inventing a `PolicyChange`. This would populate the KPI matrix from current source evidence while preserving the timeline as change-only.

---

## 12. Source Remediation Workflow

Use this diagram when explaining how problematic sources such as blocked, broad, localized, duplicated, or stale URLs are handled.

```mermaid
flowchart LR
  finding["QA finding or scan anomaly"]
  classify{"Issue type"}
  blocked["Blocked / short / 403<br/>try better official URL or suspend"]
  broad["Broad legal hub<br/>segment by anchor or focused page"]
  localized["Localized policy page<br/>prefer global English or market-specific page"]
  duplicate["Duplicate URL across jurisdictions<br/>differentiate source or justify mapping"]
  stale["Archive stale or missing timestamp<br/>do not publish as current evidence"]

  remediate["Source remediation script or admin edit<br/>dry-run where possible"]
  reset["Reset status to Configured / Needs Review<br/>write source_url_remediation check log"]
  targeted["Targeted scan by company slug"]
  gate{"Valid evidence?"}
  publish["Available + publicEvidence baseline/change"]
  suspend["Temporarily suspended<br/>visible as source anomaly, not as public fact"]

  finding --> classify
  classify --> blocked
  classify --> broad
  classify --> localized
  classify --> duplicate
  classify --> stale

  blocked --> remediate
  broad --> remediate
  localized --> remediate
  duplicate --> remediate
  stale --> remediate

  remediate --> reset --> targeted --> gate
  gate -->|yes| publish
  gate -->|no| suspend
```

---

## Presentation Reading Path

For a short executive presentation, use this order:

1. System Context
2. Runtime Deployment Topology
3. Policy Ingestion Cascade
4. Evidence Gate And Public Exposure Model
5. Dataset QA Lifecycle
6. Admin Control Plane
7. VPS Operations Lifecycle
8. Security And Trust Boundaries

For a technical audit, use this order:

1. Runtime Deployment Topology
2. Security And Trust Boundaries
3. Policy Ingestion Cascade
4. Seeded Re-Baseline Versus Real Change
5. Data Model ERD
6. Dataset QA Lifecycle
7. VPS Operations Lifecycle
8. KPI Assessment Lifecycle
