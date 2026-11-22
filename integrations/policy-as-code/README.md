# PolicyAsCode observation-only adapter (MVP 0.1.0)

This generic adapter exchanges PolicyWatcher insights as data and imports them into a separate **draft** sidecar. It does not evaluate Rego, approve a business policy, run generated code, access PostgreSQL or alter Excel-generated artifacts. No proprietary model or corporate dataset is included.

`insight-ir.schema.json` is JSON Schema 2020-12. `insight-ir.mjs` is a dependency-free runtime for its restricted vocabulary plus cross-field integrity checks. Unknown fields, duplicate JSON keys (including escaped equivalents), prototype keys, excessive size/depth, contradictory hashes/spans, private visibility, approval and execution flags are rejected. All quality fields retain explicit unqualified/not_verified states. Historical records may have empty evidence arrays; an empty array proves nothing. Source text is not bundled: the consumer can check quote hashes and linkage, but cannot independently locate a quote without acquiring the exact capture.

The `contentDigest` is SHA-256 over UTF-8 sorted-key JSON of every field except contentDigest. This restricted encoding is **not claimed to conform to RFC8785**. UTF-16 code-unit offsets are end-exclusive, as in JavaScript String.slice. Text hashes refer to the exact retained normalized text, not original HTTP bytes. Hashes and actor labels are unsigned local integrity metadata, not proof of origin, authentication, semantic truth or source completeness. The caller must obtain the payload through a separately trusted channel. The MVP never makes a compliance or allow/deny decision.

## Offline demonstration

Run from the repository root:

```sh
node --test integrations/policy-as-code/*.test.mjs
node --input-type=module -e "import {syntheticInsight} from './integrations/policy-as-code/fixture.mjs'; console.log(JSON.stringify(syntheticInsight(),null,2))" > /tmp/pw-insight-demo.json
mkdir -m 700 /Users/Shared/pw-policy-drafts
node integrations/policy-as-code/import-draft.mjs \
  --input /tmp/pw-insight-demo.json \
  --draft-root /Users/Shared/pw-policy-drafts \
  --tenant demo --project policy-review --actor local-reviewer
```

Choose an existing private directory owned by the importing service/user. Every supplied root ancestor must be a real directory, not a symlink; on macOS use a path under `/private/tmp` rather than `/tmp` if making a temporary root. Tenant and project are explicit **trusted caller context**, never model output or payload fields. They partition storage; this CLI is not a multi-user authentication service. Run under the intended OS identity and separately restrict root access. Mode checks require a 0700 directory and 0600 files. Network filesystems or hostile processes with the same OS ownership are outside this local-store guarantee: Node's portable filesystem API does not offer directory-descriptor-relative writes that protect against a malicious concurrent ancestor rename. Do not expose this CLI directly as an unauthenticated web endpoint.

New drafts are committed atomically without replacing an existing file. Repeating the same insight ID/revision/digest returns the original receipt without modifying its actor/time. A different digest at the same ID/revision is a conflict. Different revisions coexist; no draft is automatically activated or treated as latest. Existing receipts and embedded payloads are validated before an idempotent success. A local actor label records the importing context, not a verified identity. Revocation, signatures, remote delivery, runtime enforcement and cross-project authorization services remain outside this MVP.

For the private PolicyAsCode project, use this directory as a standalone sidecar located **outside** `model/`, `data/`, `build/`, `policies/` and the runtime database. Reviewed promotion into the enterprise model requires a later adapter and a separate approved workflow. Importing a file does not attach it to a live project or modify generated authoritative data.
