# Engine 6 source-contract and extraction review

A source contract asserts a reviewed document identity and completeness boundary. It is not a way to approve missing evidence. Engine 6 remains experimental and disabled in production.

## Resolve an extraction hold

1. Open the frozen original source payload and compare it with the extracted document. Record the official retrieval URL, language, title, required sections and terminal passage. For PDFs, the current transport payload may already be decoder output; do not treat it as a complete archival PDF.
2. Determine whether the held node is substantive policy content, document metadata, or unrelated user-interface content. Legal dates, version identifiers, headings, exceptions, footnotes and opt-out terms are not ordinary interface noise. If substantive content was lost, fix the source adapter or acquisition method; do not exclude the node.
3. For a genuinely unrelated UI node, draft an exact exclusion from a saved HTML payload:

   ```sh
   npx tsx scripts/engine-reviewed-exclusion.ts \
     output/engine-qualification-2026-10-31/capture-1/google-privacy-en-direct.body.txt \
     '#WIZ-footer'
   ```

   This read-only command prints the selected text preview, selector and SHA-256 of the parsed, serialized element. It does not write a contract. The draft has an empty `reviewNote`, which the API rejects until a reviewer supplies a substantive explanation.
4. Add the reviewed rule to the contract's optional `reviewedExclusions` JSON field in the private Engine administration page. Selecting a policy loads its current contract and preserves its other expectations. Each rule contains `selector`, `htmlSha256`, `purpose: "non_document_ui"` and `reviewNote`. Saving a contract is an authenticated, audited administrative action. No source contract in the public production database was changed during this qualification.
5. Refresh the held review and acquire again. The rule must match exactly one node with exactly the reviewed serialized HTML. An altered, missing, duplicated or invalid selection remains held; it does not become a broad exception. Main/document containers and individual headings cannot be excluded through this path. A complete UI element with `role="dialog"` may contain headings only when `dialogHeadings` explicitly lists all of them in order and the entire element still matches its exact hash. This is an acknowledgement of that specific dialog, not permission to remove document sections. Original HTML remains in the capture artifact, with a separate receipt for each applied exclusion.
6. Inspect the complete extraction again. A successful exclusion resolves only that particular extraction issue. Identity, language, coverage, baseline compatibility, two fresh observations, exact claim spans, independent verification and impact review remain separate requirements. The candidate and conditional representation are bound to the reviewed contract.

At most 20 exclusion rules are allowed. Complex recursive selector forms are rejected. Ordinary control attributes may still produce conservative holds, including JavaScript-only controls: resolve them with a provider adapter or an exact reviewed UI exclusion. Do not broaden thresholds merely to increase the apparent coverage percentage.

## Baseline and parser changes

Changing extraction rules or a contract does not silently rewrite the public baseline. A changed extraction profile requires replay of retained source evidence and the existing baseline-review route. If a reviewed UI node differs between the old frozen payload and the new one, the replay remains ineligible and the review is labelled `parser_upgrade_rebaseline_required`. Inspect both captures and, when justified, use **Request a newly confirmed baseline** with an explicit rationale. The authenticated transaction retains the previous baseline and snapshots, records an audit decision, clears any earlier candidate and schedules two new complete captures. It does not publish a change, adopt a snapshot or notify subscribers at the click. Only the two fresh, matching, contract-eligible observations can establish the replacement baseline, without asserting a provider change. Active work must first be cancelled or finish. A rule for one hash is never authorization to remove an unseen node from another capture. This replacement can absorb a genuine provider change between the old and new baseline without creating a change alert. Use it only after explicitly reviewing the loss of comparability; retain both captures for a separate human comparison. It must not be used as a convenient way to clear an ordinary policy-change review. In this preview the request has no dedicated withdrawal action; publication/pause controls and run cancellation can stop work, but do not clear the recorded migration request. Review evidence expires after two days and must be refreshed when stale.

## Qualification boundaries

The 500-record/four-process crash probe tests scheduling, lease recovery and local SQLite persistence with synthetic sources. It does not test 500 Internet fetches, paid model runtime, remote renderer behavior or production throughput. Source onboarding, real-corpus annotation and three daily observation windows remain required before activation.

## Continued adversarial qualification (31 October)

Short hidden text within a document and nonempty document dialogs now hold regardless of length: a short negation can reverse a clause. Loose inline text in an explicit main/article/role-main boundary is preserved in complete runs and DOM order, including captions and native disclosure summaries. The capture records `retainedUnstructuredRuns`; this does not identify every UI fragment or establish completeness. Review the new extraction, including any newly retained language selectors or other UI. The profile change uses the existing baseline-review path; it must not be announced as a provider change.

Pages with no explicit document boundary hold with `document_scope_unverified`; multiple disconnected boundaries hold with `document_scope_ambiguous`. A reviewed provider adapter is needed to establish the correct scope. A missing paragraph is not resolved by lowering the contract minimum. `scripts/engine-extraction-replay.ts <saved-capture-directory> <new-output-directory>` supplies a bounded, offline inclusion diagnostic with payload integrity checks; both directories and DATABASE_URL must be isolated under `output/`. Its normalized text-node audit is heuristic and explicitly does not prove completeness.

Real analysis now requires explicit `POLICYWATCHER_ENGINE_ANALYST_MODEL` and `POLICYWATCHER_ENGINE_VERIFIER_MODEL`. The pair must be distinct before inference, and provider-resolved response identities must remain present and distinct before publication or human approval. A requested alias is stored separately and never substituted for a missing resolved identity. Different models can still make correlated errors. Model-list presence is insufficient: the previous verifier returned HTTP 404 in the actual test despite being listed.

The bounded `scripts/engine-claims-probe.ts <new-output-directory>` exercises six authored synthetic cases and three deliberately false interpretations using explicitly configured models. No database, publication or delivery is involved. The successful Flash 3.8 / Argon run is a candidate evaluation, not automatic promotion or measured production accuracy. On the tested Mac, `--no-network-family-autoselection` was used after an observed Node network timeout; this is an environment-specific diagnostic, not a proven fix for every source or a remote runtime change. See the continued adversarial report for successes, failures, costs and review availability.
