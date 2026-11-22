# Independent review of three rendered Meta extractions

Read-only inert parsing of the saved DOM/extraction JSON. No GUI, browser execution, network, database, AI call, source approval or production action. Root's report represents16selected scopes,11renderer API attempts,3HTTP200DOM extractions,8domain_not_allowed rejections and5selected scopes not attempted. Renderer allowlist rejection is not evidence that a source itself refused access.

**Integrity: all three pass independent verification.** Saved DOM SHA256/byte length match the live report; JSON-embedded HTML equals those DOM bytes. Text hashes match report and document hashes; lengths, block counts and every UTF16 block offset/slice match. The extraction JSON file hashes are newly recorded here; no pre-existing external JSON-file hash is implied. All extracted blocks can be found in whitespace-normalized inert DOM after removing serialized list markers, and four checked legal passages per document occur in both DOM and extracted text. That is consistency evidence, not an independent complete-source oracle.

| Source | Extracted chars | Observed identity | English language | Confirmed chrome contamination |
| --- | ---: | --- | --- | --- |
| Facebook ai-terms |14790| Meta AIs Terms of Service, with regional-selector preamble |html/extraction/report en|12blocks,364nonseparator chars, at least2.46% |
| EU_data_transfer_addendum |4168| META EUROPEAN DATA TRANSFER ADDENDUM |html/extraction/report en|12blocks,364nonseparator chars, at least8.73% |
| Facebook policies/live |1993| Facebook Live Policies |html/extraction/report en|12blocks,364nonseparator chars, at least18.26% |

All three include the same11language-picker blocks plus one concatenated Facebook product/account/navigation block. These are observable non-policy additions. The percentages exclude intervening separators and are lower bounds, not a completeness/quality score. No extraction was rewritten. Semantic footer removal alone would not remove the remaining picker/navigation tail; any proposed exclusions require exact DOM/source review and retained evidence.

Specific identity limits: ai-terms explicitly directs UK/Brazil/European users to separate regional terms; its global English text is not automatically a qualified EU/UK document. The EU source's observed title is a transfer addendum incorporated into Data Processing Terms, while the catalogue calls it Data Processor Agreement. Do not announce it as a recovered full DPA or all incorporated terms. Live Policy has plausible substantive rules/examples, but their presence does not prove all current publisher content was captured.

The browser head title is generic Facebook; precise identities come from actual rendered content. No semantic h1/h2/h3/role-heading nodes are present in this inert parse. Each DOM has two role-main roots, one empty and one containing the document/UI. Existing extraction diagnostics retain document_scope_ambiguous, interactive controls and a removed67-character footer. The empty root is a useful candidate for narrowly reviewed scoping; it is not grounds to ignore the hold or invent semantic headings.

**Decision: keep all three held.** They demonstrate that rendering produced substantive candidate text unavailable in the earlier static shells. They do not qualify independent source completeness, reviewed contract identity, jurisdiction, analysis/verifier accuracy, publication or500policies/day. Rendered DOM is not original HTTP/PDF evidence, validators are empty, and origin freshness is unproven. No sum of earlier cohorts, the prior four extractions and these three establishes daily end-to-end capacity.
