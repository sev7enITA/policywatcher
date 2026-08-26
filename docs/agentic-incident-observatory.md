# Agentic Incident Observatory and Vendor Response Monitor

Status: production-ready code path, external adapter disabled by default, no external deployment performed.

## Architecture

PolicyWatcher owns the normalized contract at `/schemas/agentic-incident-signal/v1`. External trackers are optional providers behind the versioned registry in `src/lib/externalIncidentProviders.ts`. Rogue AI Tracker is the first adapter, not a platform dependency or an authoritative PolicyWatcher source.

The processing boundary is:

1. retrieve a bounded provider response server-side;
2. validate the provider envelope and every selected metadata field;
3. discard narrative content (`summary`, `details`, `whyItMatters`, attribution-review rationale, justifications and full text);
4. deduplicate by provider external ID;
5. generate a stable PolicyWatcher ID from `providerId + externalId`;
6. attach retrieval time, mapping version and SHA-256 digests;
7. propose entity associations only from exact canonical company-name phrases found in public PolicyWatcher company records;
8. keep provider review and PolicyWatcher local review separate;
9. retrieve possible later policy changes only through PolicyWatcher public-evidence gates.

No provider-native capability score is a PolicyWatcher policy-risk score. A later public change is a temporal association, not a causal attribution. An unavailable provider or database surface never means that no incidents or vendor responses exist.

## Runtime configuration

The Rogue AI Tracker adapter is explicit opt-in:

```dotenv
POLICYWATCHER_ROGUE_AI_TRACKER_ENABLED=true
```

If absent or false, the API reports `retrieval.state=disabled`, `count=null` and an empty signal array. This is an unavailable-data state, not a zero-incident result.

Hardening controls:

- fixed HTTPS endpoint and redirects rejected;
- six-second abort timeout;
- two-MiB response cap enforced from both `Content-Length` and streamed bytes;
- maximum 500 input rows;
- maximum 50 deterministic company-association candidates per signal;
- maximum eight incident-linked company queries per Vendor Response Monitor request, with explicit truncation counts;
- bounded strings, strict timestamps, HTTPS source URLs and 0–10 integer provider scores;
- duplicate and invalid rows excluded and counted;
- 15-minute validated in-memory cache;
- stale fallback limited to 24 hours, after which data becomes unavailable;
- no raw provider response, attribution-review rationale, narrative full text or justifications are stored or returned.
- successful, disabled and error responses use `Cache-Control: no-store`, so CDN/browser stale-while-revalidate windows cannot preserve a provider disablement or a withdrawn public response;

The current provider payload includes records without a claimed event date. They are normalized with `occurredAt=null`, `dateBasis=provider-published-date-only` and the aggregate warning `missing_occurred_at`; they remain discoverable but are excluded from Vendor Response Monitor timelines because a temporal relationship cannot be calculated safely.

The internal 15-minute provider cache is an availability optimization, not durable evidence. Disabling the adapter bypasses it immediately. A provider-side record removal can remain in that internal validated snapshot until the next provider refresh, but it is never extended by a browser or CDN cache. A production operator may add a separately reviewed durable snapshot provider later without changing the canonical signal contract.

## Public surfaces

- `GET /api/v1/agentic-incidents`
- `GET /api/v1/agent/agentic-incident-brief`
- `GET /api/v1/agent/openapi.json`
- `GET /schemas/agentic-incident-signal/v1`
- `/observatory/agentic-incidents`

Agent briefs aggregate every bounded company timeline for an incident and expose coverage as `queried X/Y; truncated N`. The Observatory renders the same global state, message and counts even when the provider is disabled, matching is unavailable or every count is zero.

Public feed query parameters:

- `provider=rogue-ai-tracker`
- `companySlug=<canonical-slug>`
- `capability=<provider-capability-id>`
- `limit=1..50`
- `vendorResponses=candidate|none`

Entity associations remain `unreviewed` until a future authenticated review workflow accepts or rejects them. The current public monitor intentionally displays them as candidates. PolicyWatcher does not publish “vendor involved” or “vendor responded” claims from these mappings.

## Provider onboarding contract

A new tracker implements `ExternalIncidentProvider`, declares `dataPolicy=metadata-only` and returns `AgenticIncidentProviderResult`. It must preserve these invariants:

- PolicyWatcher-owned stable IDs;
- separate external and local review states;
- explicit retrieval state (`live`, `stale-cache`, `unavailable`, `disabled`);
- `count=null` when unavailable or disabled;
- provenance with `retrievedAt`, mapping version and digest;
- the three required boundaries: temporal association is not causation, external score is not policy risk, unavailable provider is not no incidents.

## Release gate

Before enabling an adapter in production:

1. confirm data reuse and linking terms with the provider;
2. run unit tests, typecheck and the production build;
3. exercise disabled, timeout, oversized, invalid-schema and stale-cache paths;
4. review sample entity candidates for false positives;
5. verify that every linked PolicyWatcher change is still public-evidence-gated;
6. enable the environment flag in staging first and monitor provider schema rejection counts.
