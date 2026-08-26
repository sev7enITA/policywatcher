# PolicyWatcher → PALO public-change handoff

Status: versioned production contract; no runtime dependency between the platforms.

PolicyWatcher can export an already-public, evidence-gated change as the canonical PALO `palo-policywatcher-signal` v1 contract. PALO remains the contract owner and the accountable governance system. PolicyWatcher remains the evidence and public-change observer. Neither platform requires the other to start, build, serve its core product or preserve its own records.

## Discovery and download

Every event in `GET /api/v1/change-events` includes an additive `links.paloSignal` URL. The URL resolves to:

```text
GET /api/v1/integrations/palo/signal?changeId=<public-change-uuid>&lang=en|it
```

PALO can also run an optional bounded pull cycle over:

```text
GET /api/v1/integrations/palo/signals?cursor=<opaque>&limit=25&lang=en|it
```

This no-store endpoint starts from the oldest currently public signal and exposes a complete active snapshot through bounded forward pages. A consumer may classify a previously accepted signal as withdrawn only after every page validates successfully. A partial, rate-limited or unavailable traversal never proves revocation. The batch transport is optional: PALO retains its last validated local registry and its core governance paths remain available when PolicyWatcher is unreachable.

The endpoint returns HTTP 404 unless the requested change still passes the PolicyWatcher public-evidence gate. Successful and error responses use `Cache-Control: no-store`, so withdrawing public evidence is not masked by a CDN stale window. A successful response is downloadable JSON with:

- `format=palo-policywatcher-signal` and `schemaVersion=1.0.0`;
- the canonical PALO schema URL;
- stable identity and PolicyWatcher public links;
- `authority.status=non-authoritative-monitoring-signal`;
- an explicit Measure/Prove human-review handoff;
- PolicyWatcher screening retained as contextual extension data, never promoted to a PALO risk, applicability or gate decision.

The PALO Assessment Path imports the downloaded file locally. Import performs no request to PolicyWatcher and preserves unknown additive fields. This creates a recoverable handoff: the file remains usable when either site is unavailable.

## Trust boundary

The combined loop is:

1. PolicyWatcher observes and publishes a public-evidence-gated change.
2. PolicyWatcher emits a non-authoritative PALO-compatible monitoring signal.
3. PALO validates the PALO-owned contract and reopens Measure/Prove for accountable review.
4. PALO alone owns applicability, risk, controls and gate decisions.

An exported signal is not legal advice, certification, a compliance verdict or proof that a vendor acted because of an external incident.
