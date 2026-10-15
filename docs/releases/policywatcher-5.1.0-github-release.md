# PolicyWatcher 5.1.0 - Traceable Evidence

Release date: 15 October 2026. Deployment status is recorded separately in the publication receipt.

The extracted old and new documents are supplied in full, with a 500,000-character limit per document and explicit refusal above it. New analyses retain model identity, request reconstruction data, response hashes and snapshot references. This is application SDK lineage, not a provider execution attestation or a semantic-accuracy measurement.

Snapshots freeze source/acquisition metadata. Canonical versions distinguish recurring observations from reusable content; existing public IDs, capture times, effective dates and content references survive replay. Legacy missing provenance remains unknown. Canonical dual-write retains its existing activation gate.

Fragment-scoped extraction rejects missing/incomplete sections without borrowing page content. The existing successful-live-check freshness threshold remains 30 hours. Evidence packet schema 1.1.0 adds bounded analysis and capture lineage while retaining the v1 endpoint and publication gate. Raw model responses are not exported publicly.

## Migration and rollback

Back up the external database before deployment. Migration `20261015160000_dq_lineage_occurrences` adds ContentArtifact, optional snapshot/version metadata, optional PolicyChange provenance, and replaces the document/content-hash uniqueness constraint with a non-unique lookup index. It does not rewrite historical rows. Node and Python fallback initializers implement the same schema.

Keep the previous 5.0.0 artifact and pre-migration database backup together. Rollback after new repeated occurrences have been written requires restoring the pre-migration database with the previous application, so historical application behavior does not reject the new occurrence model. Do not remove current data automatically; make a fresh consistent backup first.

## Scope

This releases the remaining P0 improvements after re-evaluating the older candidate against main revision d99fee2. The broader 20-item competitor backlog, new mobile/extension releases and semantic-quality evaluations remain separate work.
