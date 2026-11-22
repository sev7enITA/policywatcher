# Source completeness and responsible AI

22 November 2026. **Local implementation candidate, not a hosted qualification.** This methodology accompanies `codex/source-completeness-controls-20261122`. It does not change the identity or qualification evidence of hosted Preview r3, frozen candidate `050af19` or any earlier cohort.

## Four questions, four different controls

| Layer | Question | Bounded evidence | What it does not establish |
|---|---|---|---|
| Download integrity | Which representation was received and retained? | Requested/final source scope, response status, capture time, retained bytes/text and their digests. | An HTTP 200 or matching SHA256 does not show that the source supplied every clause, correct language or current origin content. |
| Extraction coverage | What document content survived processing? | Comparison of all structured blocks with a declared, separately reviewed reference, including repeated occurrences and section paths. | A reference can itself be incomplete. Agreement with it is not universal policy completeness. |
| Transaction atomicity | Was one local publication recorded consistently? | A database transaction can commit the baseline, change and outbox event together, or commit none of them. | Atomicity does not validate acquired text, its interpretation, external service state or actual notification delivery. |
| Interpretation | Do the passages support the proposed meaning? | Exact before/after citations, model/version evidence where recorded, separate verification and human review when needed. | A quotation match, model agreement or reviewer approval is not automatically legal correctness or source completeness. |

```mermaid
flowchart TD
    S[Official document scope and language] --> R[Retain representation and integrity receipt]
    R --> C[Compare extraction with reviewed block inventory]
    C -->|missing / unexpected / scope mismatch / no inventory| H[Private observation and review hold]
    C -->|matches declared reviewed reference| I[Interpretation and evidence verification]
    I -->|uncertain or high impact| H
    I -->|all other gates satisfied| T[Atomic local publication transaction]
    T --> O[Separate outbox delivery and receipt]
```

The diagram describes the candidate boundary. A successful transition at one layer does not bypass the next. Engine 6 public publication and notifications remain separately controlled; this document is not permission to enable them.

## Why the earlier contract was insufficient

The [22 November synthetic audit](../reports/policywatcher-demo-audit-2026-11-22/contract-falsifiers.json) used one complete control and six deliberately incomplete document objects. The earlier contract accepted four incomplete variants: a missing middle clause, one lost repeated occurrence, a missing table row and an emptied section whose heading remained. Missing required-heading and terminal variants were rejected.

This result isolates a contract blind spot. The objects bypass live retrieval and HTML extraction. **Four out of six is not a measured error rate for real policies, providers or the deployed system.** The complete control and the failed counterexamples remain evidence; later fixes must not erase the original result.

Title aliases, required headings, terminal text, length limits and language metadata remain useful identity and plausibility checks. They cannot alone establish that all intervening document content is present.

## Reviewed block inventory

The candidate adds `SourceContract.completenessInventory`. It is an explicit reviewed reference, not an automatically generated certificate. The implementation is in `src/lib/engine/coverage.ts` and its source-contract integration in `src/lib/engine/document.ts`.

### Scope and review evidence

The versioned inventory contains:

- `scope`: exact `sourceUrl`, expected `language` (`en` or `it`) and `referenceVersion`. Query and fragment distinctions remain part of the declared retrieval scope.
- `scopeId`: digest of the restricted sorted-key scope representation. It identifies that scope; it does not authenticate the source.
- `reference`: declared method (`manual_reference`, `publisher_reference` or `independent_capture`), reference URL, file digest, capture/review times and a meaningful review note.
- `units`: every distinct structured block group and its expected occurrence count.
- `inventorySha256`: digest of the inventory body excluding that digest field.

Parsing checks the declared fields and bounds, digests, review ordering and future timestamps. Contract parsing also binds inventory URL and language to the source contract. Invalid or mismatched metadata cannot be silently treated as a configured reference.

The reference method and review note are **attestations supplied by the reviewer**. They do not authenticate reviewer identity or independently prove that the reference was collected independently. `reference.sha256` is a declared file fingerprint: the engine does not retrieve and inspect that reference file simply because its hash is present. Retaining and examining the actual reference remains an operator/review responsibility.

### Every block and every repeated occurrence

The compared group identity is:

```text
(block kind, normalised section path, SHA256(normalised block text))
```

The inventory covers the structured representation's headings, paragraphs, lists and table blocks. Each group carries a positive occurrence count. A repeated clause therefore contributes more than once. A table row or a section's body cannot be omitted merely because the document title and ending still match.

Normalisation uses Unicode **NFC**, preserves case and compatibility characters, collapses whitespace runs and trims surrounding whitespace. It does not use compatibility folding or lowercasing to make changed contractual text appear equal. Digests refer to this declared normalised block representation, distinct from the digest of the entire exact retained extraction.

Matching is a multiset comparison. Missing expected occurrences and unexpected occurrences are both counted. Section paths distinguish equal text in different sections. A separate ordered-sequence digest also compares block order, including reordering within the same section. Its negative control preserves every occurrence while changing the sequence.

Budgets are bounded: at most 512 KiB for the serialised inventory and 10,000 total units/occurrences, with limits on paths, strings, structure and nesting. Unsupported keys, accessors and unsafe object shapes are not review evidence.

### Read the receipt with its denominator

`CoverageReceipt` separates:

| Field | Meaning |
|---|---|
| `state` | `not_configured`, `mismatch` or `matched_reviewed_reference`. |
| `expectedUnits`, `observedUnits` | Total expected occurrences versus observed structured blocks. |
| `expectedGroups`, `observedGroups` | Distinct kind/section/text groups, a different denominator from occurrence totals. |
| `missingUnits`, `unexpectedUnits` | Occurrence deficits and surpluses, not a percentage of legal correctness. |
| `scopeId`, `inventorySha256` | Exact declared reference context used for this assessment. |
| `reasons` | Explicit missing-reference, invalid-reference, scope/language mismatch or unit mismatch reasons. |

`matched_reviewed_reference` means agreement with that declared reviewed reference under this representation and normalisation. It must not be displayed as “the entire legal policy is complete.” A reference containing the same extraction defect could still agree with the candidate. Documents not loaded by the browser, external attachments, omitted clauses in the reference and an incorrectly defined scope remain possible blind spots.

## Publication and observation have different requirements

Legacy contracts without an inventory can still support bounded private acquisition and diagnostics. Their old heuristics may pass, but completeness remains unknown. The candidate publication check requires an eligible assessment **and** `matched_reviewed_reference`; missing, invalid, unexpected or mismatched inventory must hold publication.

This is a candidate gate, not a statement that hosted r3 has already gained it. Publication controls must cover baseline establishment, unchanged verification, changed candidates and resumed/cached paths consistently. The final implementation report must record which paths were actually tested and which remain open.

An authentic policy change can legitimately break the old inventory. That is a reason for a fresh source review, not a reason to rebuild the expected inventory from the new candidate and approve it automatically. Reference changes need a new version, retained supporting evidence, updated review context and a fresh assessment. The old reference and failed result remain available for comparison.

## Operator procedure

1. Define the document's exact official scope, language, expected attachments and retrieval representation before assessing completeness.
2. Retain an independent/manual/publisher reference and review the actual content against the official source. Confirm middle sections, repetitions, table rows, attachments and ending, not only the first and last passages.
3. Record reference method, version, digest, times and review note. Do not use a generated inventory as proof that this independent review occurred.
4. Compare the candidate's complete structured-block multiset. Inspect missing and unexpected occurrences, scope/language failures and any extraction warnings.
5. Keep uncertain cases private and held. If the policy genuinely changed, prepare and review a fresh reference; preserve the old result.
6. Assess interpretations separately against exact retained passages. Only the complete publication workflow may decide whether its remaining gates are satisfied.

The final verification receipt must identify implementation hash, fixture/reference versions, actual commands, positive and deliberately incomplete controls, and any retained failures. The delivery run passed 1,801 application tests offline, with 14 skipped. The detailed verification report separates the source-coverage, transport, workflow, administrative, locale and browser scopes. Offline counterexamples do not replace live source qualification or a realistic 500-policy/day worker campaign.

## Responsible AI in this workflow

The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) is voluntary guidance for considering AI risks and trustworthiness across design, use and evaluation. Here it informs the separation of controls and explicit evidence limits; it does not certify PolicyWatcher.

The [OECD AI Principles](https://www.oecd.org/en/topics/ai-principles.html) call for understandable capability/limitation information, human oversight, traceability and accountability appropriate to context. In this workflow that means a reviewer can inspect source/reference versions, question an interpretation, withhold publication and retain corrections. This is a design mapping, not an assertion of full compliance or OECD endorsement.

Public transparency must preserve privacy: disclose the method, dates, denominators, failed tests and limits without exposing private captures, credentials, reviewer metadata or customer context. Model output remains an interpretation. Missing evidence remains unknown; it is not converted into zero risk, a cleared control or a legal violation. Human review needs the source evidence and power to stop or correct the workflow, not merely an approval button.

## Sintesi italiana

Integrità del download, copertura dell'estrazione, atomicità della transazione e interpretazione sono controlli diversi. L'hash consente di confrontare una rappresentazione conservata; non dimostra che la fonte abbia fornito tutte le clausole. Una transazione tutto-o-niente protegge la coerenza dei salvataggi, non il significato dei dati o la consegna delle notifiche.

Il candidato confronta tutti i blocchi strutturati con un inventario revisionato, legato a fonte e lingua. Tipo, percorso della sezione, hash del testo e occorrenze consentono di rilevare omissioni interne e ripetizioni perse. La corrispondenza vale soltanto rispetto al riferimento dichiarato: se il riferimento è incompleto, l'accordo non produce completezza indipendente. Una modifica autentica richiede un nuovo riferimento revisionato; un inventario assente può servire all'osservazione privata, non autorizzare la pubblicazione del candidato.

I quattro controesempi incompleti accettati su sei descrivono il limite del vecchio controllo in una prova sintetica mirata, non il tasso di errore delle fonti reali. Le verifiche del nuovo candidato, i modelli interrogati e la qualifica delle 500 policy al giorno devono essere riportati con prove e perimetri distinti. Nessuna certificazione o conformità legale è dedotta dai riferimenti NIST e OCSE.

The candidate also binds an ordered sequence fingerprint, so a reordering cannot pass merely by retaining the same multiset. Receipts explicitly keep `referenceOriginVerified=false` and `sourceCompletenessQualified=false`, including for matches. The reference file itself and its origin are not authenticated by the inventory metadata.

## Independent expected-content inventory, version 2

The follow-up candidate requires version 2 for publication. Version 1 block inventories remain readable for private observation, with no automatic publication or manual waiver. Version 2 adds a complete occurrence-bound map of section, clause and table-row units, a declared link census and a manifest of expected attachments. Each granular element must bind exactly one existing base group and its exact count; no group may be omitted or counted twice.

A clause unit is a reviewed paragraph or list block in the declared representation. A table-row unit is a structured table block, including any retained header/formatting row. This is an explicit structural denominator, not automated identification of every legal obligation or table-cell meaning. The existing full multiset and ordered-sequence checks still apply. Structure is recomputed from frozen text before comparison, so a supplied block array cannot mask omissions.

The link census binds exact resolved document-scope HTTP(S), mailto and tel URLs and occurrence counts, including links classified as attachments, references or navigation. Added or changed destinations hold the candidate even if visible text is identical. Fragment-scoped policies count links only inside one exact matching fragment; an ambiguous fragment holds the result. Link classification and attachment scope require independent human review. Script behavior, unloaded resources and an incomplete reference remain possible blind spots.

### Authoring from separate reference files

`scripts/prepare-independent-inventory.ts` reads retained reference files offline, checks actual bytes against declared digests and writes a new draft without overwriting an earlier one. It accepts no candidate-response input parameter, performs no network request and cannot approve a source or publish anything. Use a separate capture/manual transcription or publisher document whose scope and segmentation were actually reviewed; renaming the candidate file does not make it independent.

A reproducible synthetic example is in `docs/architecture/independent-inventory-example/`. From the repository root:

```sh
node node_modules/tsx/dist/cli.mjs scripts/prepare-independent-inventory.ts \
  --spec docs/architecture/independent-inventory-example/spec.json \
  --out /tmp/policywatcher-inventory-demo-draft.json
```

The destination must not already exist. Inspect the actual references and proposed `contract` before manually saving it in the authenticated administrator interface. The demo is authored synthetic material and must never be counted as a real source qualification. A reference capture ID equal to the candidate ID, or missing candidate identity, holds the assessment. Capture/review IDs and the procedure remain attestations; they do not authenticate a publisher or a person's identity. The saved contract is bound to the authenticated administrative operation and retained contract hash, not a publisher signature.

### Attachments are separate acquired evidence

A required attachment needs the exact declared link count, one fresh original-origin HTTP 200 capture, exact final URL/media type, complete transport framing, original decoded entity-byte digest and matching separately reviewed text inventory. Original PDF bytes remain distinct from generated inert HTML. A PDF signature alone never establishes complete extraction; extraction uncertainty also holds the candidate. Reference-origin verification and overall source-completeness qualification remain false, including for matches.

The candidate performs at most four serial same-origin attachment requests, each bounded to 1 MB decoded, with at most 2 MB of original bytes and 1 million extracted characters per parent capture. Pinned outbound validation and the existing origin lease apply. Redirects are refused before contacting their targets. Cross-origin attachments require future dedicated acquisition/lease support and remain held. Unsupported media, oversized files, unavailable bodies and uncertain extraction also hold. No recursive attachment crawling is implemented; fallbacks reuse an in-run request promise instead of repeatedly fetching a failed attachment. Parent 304 reuse is disabled when attachments are expected.

Administrator receipts show separate expected/missing section, clause and row occurrences, link deficits/surpluses and each attachment outcome. Neither a high count nor human approval can waive a missing gate. Responsible-AI transparency requires preserving the denominator, traceability, uncertainty and failed attempts while keeping private source bytes outside public reports.


### Publication scope for attachment-bearing policies

The current analyst/verifier compares parent-document changes. Attachment coverage is acquired and checked separately, but attachment-only semantic change analysis and publication events are not qualified. Therefore any version 2 contract with expected attachments remains **observation-only**, even when its full declared inventory matches. The public baseline/unchanged/approval paths retain this hard gate. A new annex reference must not make an annex-only amendment disappear behind an unchanged parent hash. Future publication support must compare retained previous/current attachment sets and claims before this hold can be removed.
