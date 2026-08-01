# PolicyWatcher public API v1

## Purpose

The `v1` integration directory is a small, read-only surface for public evidence metadata, the curated Observatory registry, deterministic multi-change evidence collections, public receiver fixtures and flattened agent evidence briefs. It is intentionally separate from protected operations, policy-ingestion workflows, raw snapshot text and administrative records.

For the complete integration decision guide and readiness matrix, see [`integrations.md`](integrations.md). Enterprise tenant-bound use cases belong to the separate [API v2 pilot](azure/enterprise-api-v2.md).

## Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/manifest` | `GET` | Current integration directory: exposed public sources, parameter allowlists, evidence boundaries, cache and rate policy. |
| `/api/v1/observatory?lang=en` | `GET` | Curated local registry of sources, signals and events. Accepts `en` or `it`. |
| `/api/v1/evidence-collections?changes={uuid,...}&format=json` | `GET` | Deterministic bundle for 1 to 12 exact published changes. Accepts `json`, `markdown`, `csv` or `handoff`. |
| `/api/v1/change-events?limit=25&lang=en` | `GET` | Forward-only polling feed for already-published policy change events. Accepts `cursor`, `limit` and `lang`. |
| `/api/v1/agent/openapi.json` | `GET` | OpenAPI 3.0 contract for the three-operation Agent Evidence Gateway. |
| `/api/v1/agent/capabilities` | `GET` | Current agent contract, compatibility targets and interpretation boundary. |
| `/api/v1/agent/change-brief?topic=privacy&limit=3` | `GET` | Flattened source-linked brief over published policy-change evidence. |
| `/api/v1/agent/observatory-brief?topic=AI&limit=3` | `GET` | Flattened source-linked brief over the manually curated Observatory registry. |
| `/api/v1/webhook-verification-kit` | `GET` | Versioned candidate receiver contract, public test-only vector and Node/Python verification examples. |
| `/api/v1/webhook-conformance-suite` | `GET` | Eight deterministic positive and negative receiver fixtures with expected decision codes. |

All endpoints support read-only browser access with no credentials and send `Access-Control-Allow-Origin: *` without accepting cookies or credentials. The manifest, Observatory, Webhook Verification Kit and Receiver Conformance Suite use 60 request-per-minute reference-route buckets. Evidence Collections, Change Events and the Agent Evidence Gateway each use a separate 30 request-per-minute bucket. Agent requests do not log the client IP. Collections uses a 300-second browser cache and a 3,600-second shared-cache window; Change Events and agent briefs use short public caching; the versioned receiver resources use a 3,600-second browser cache and an 86,400-second shared-cache window.

The Agent Evidence Gateway accepts an allowlisted subset of `companySlug`, `region`, `risk`, `topic`, `lang` and `limit`, with a maximum of five returned records. It does not accept a prompt transcript, document body, contract clause or arbitrary metadata. `answerContext` and `citations` are strings rather than arrays so the same contract can be used by Microsoft 365 Copilot declarative-agent actions, Vertex AI Agent Builder OpenAPI tools and Amazon Quick connectors. A zero-result response explicitly means only that the bounded query found no matching public evidence.

The collection route accepts exactly one comma-separated `changes` parameter and, optionally, exactly one `format` parameter. UUIDs are normalized, deduplicated and sorted. If any selected change is missing, withheld or not public, the route returns one generic unavailable response and does not disclose a partial collection.

`format=handoff` returns `application/vnd.policywatcher.evidence-handoff+json`. The payload contains deterministic work-item IDs, titles, evidence links, packet and snapshot digests, review questions and acceptance criteria. It deliberately omits assignees, due dates, access control, delivery state and vendor-specific record identifiers. An authorized person or controlled integration must decide whether and how to create records in a receiving system.

The change-event route returns the latest bounded public window when no cursor is supplied. Consumers store `nextCursor` and pass it unchanged on later requests to receive events published after that exact publication timestamp and change ID. The publication timestamp records the local evidence-gate transition; it is distinct from source retrieval time. Events are returned in chronological order, carry deterministic `pwe_` identifiers and link to the exact Change and Evidence Packet. A change that is withheld and later republished receives a new event identifier. Consumers must deduplicate by `eventId`, respect `hasMore`, and treat `initialWindowTruncated` as notice that the first response is not a complete historical archive.

`/developers/event-continuity` provides a browser-local workbench for this polling contract. It can inspect a current window, save a strict bounded checkpoint, import or export that checkpoint, and explicitly resume with its opaque cursor. The local report identifies observable duplicates, chronological regressions, overlap and initial-window truncation. A clean report cannot establish exhaustive monitoring, delivery, or the absence of records outside the returned public window. The checkpoint schema is published at `/schemas/event-continuity-checkpoint/v1`.

The Webhook Verification Kit defines a candidate `v1` signature as HMAC-SHA256 over `{unix_timestamp}.{raw_request_body}` and includes one public test-only secret. The static vector is a signature-compatibility fixture: evaluate its freshness with the clock fixed at the vector timestamp. Do not disable timestamp freshness in a production receiver. Production receivers must use non-public secrets, constant-time comparison, timestamp tolerance, replay storage, controlled key rotation and bounded operational logging. The public kit does not create subscriptions or accept endpoint URLs. A separate Beta 23 pilot can deliver the same public event envelope only to destinations configured by deployment operators.

The Receiver Conformance Suite extends the canonical vector into eight fixtures: one expected acceptance and seven expected rejections covering empty secret, invalid timestamp, stale timestamp, unsupported signature version, noncanonical digest encoding, raw-body mutation and digest mutation. Consumers compare their receiver decision with each published `expectedCode`. A complete pass establishes compatibility with those exact fixtures only. It does not test network delivery, endpoint control, secret custody, retry behavior, replay storage, service availability or security outside the exercised paths.

## Data boundaries

- Public evidence records remain subject to the same publication gates used by PolicyWatcher public views.
- Observatory data is a curated local registry with a visible review timestamp. It is not an automatically ingested external news feed.
- The v1 surface omits raw policy text, raw retrieval failures, final redirect URLs, source-private records, credentials and administrative logs. A collection may repeat public snapshot fingerprints, sanitized score explanations and advisory governance mappings already exposed by the selected public Evidence Packets.
- Existing public routes listed in the manifest retain their current paths during the beta. The manifest is the versioned directory; it does not represent a promise of write access or an availability commitment.
- A handoff manifest is a portable review aid. Its `ready-for-human-triage` state is not an assignment, approval, legal conclusion or confirmation that a receiving system created a record.
- The event feed is a polling contract only. `nextCursor` records polling position; it is not a delivery receipt, acknowledgment, secret or authorization token.
- An Event Feed Continuity checkpoint is stored in the user browser or exported file only. PolicyWatcher does not persist it as a server-side workspace or replay ledger.
- The webhook test secret is intentionally public and must never be used outside the deterministic compatibility vector.
- A conformance result contains fixture decisions only and must not be represented as production-readiness or security certification.
- Agent briefs are deterministic formatting over public evidence or curated registry records. They are not legal advice, model-generated conclusions, exhaustive coverage or contract approval.

## Relationship to v2 and the roadmap

API v2 and the Power Platform custom connector are available for a controlled Microsoft Entra test-tenant pilot. They do not replace v1 or make its anonymous endpoints authenticated.

Configured outbound delivery is available as a controlled Beta 23 pilot with HMAC signing, a persistent outbox and bounded retries. Public subscriptions, tenant identity, self-service access control, endpoint challenge verification, automatic signing-key rotation and service-level commitments remain planned. Persistent team workspaces also remain outside v1.
