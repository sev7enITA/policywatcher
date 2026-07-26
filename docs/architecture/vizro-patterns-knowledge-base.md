# Vizro patterns knowledge base for PolicyWatcher

## Scope and provenance

This document studies Vizro as an architectural reference. PolicyWatcher does
not depend on, embed, import, or execute Vizro. The independent implementation
remains TypeScript, React, Recharts, Next.js, and Prisma.

The reproducible baseline is Vizro `0.1.59`, commit
[`917d7663856534f14f8927ecebeb6c668f9444f6`](https://github.com/mckinsey/vizro/tree/917d7663856534f14f8927ecebeb6c668f9444f6).
Vizro is Apache-2.0 licensed. This document describes behavior and design
patterns; it does not copy implementation code.

## Source map

| Capability | Vizro sources reviewed | Relevant PolicyWatcher surface |
| --- | --- | --- |
| Model lifecycle | `models/_base.py`, `_dashboard.py`, `_page.py` | `src/lib/dashboardComposer.ts` |
| Identity and hierarchy | `managers/_model_manager.py` | dashboard module IDs and composition |
| Chart configuration | `models/_components/graph.py`, `models/types.py` | `src/components/charts/*` |
| Filters and parameters | `models/_controls/filter.py`, `parameter.py` | dashboard and timeline filter state |
| Actions and cross-filtering | `models/_action/_action.py`, `actions/_set_control.py`, `_actions_utils.py` | React state transitions and chart selection |
| Data loading and cache | `managers/_data_manager.py` | API view models and client fetches |
| Layout | `models/_grid.py`, `_flex.py` | adaptive workspace modules and CSS grid |
| Export | `actions/_export_data.py` | `src/lib/exporters.ts` and executive PDF |
| Themes | `themes/_colors.py`, `_palettes.py`, `_templates.py` | global CSS and chart tokens |
| Client synchronization | `static/js/models/page.js`, `graph.js`, `action.js` | URL state, reset, and interaction guards |

The matching Vizro unit and JavaScript tests are part of the review. Tests are
used to identify behavioral contracts, not translated line-for-line.

## 1. Validated dashboard grammar

### Observed pattern

Vizro models dashboards as a tree of typed objects. A base model assigns an ID
and registers the model. Page validation normalizes paths, checks uniqueness,
discovers descendants, prepares action chains, and only then builds UI objects.
Configuration may be supplied in Python or serialized form.

### Useful contract

- A dashboard is data, not scattered conditional rendering.
- IDs and target references are validated before interaction begins.
- Validation/preparation and rendering are separate phases.
- Extension points are explicit model types.

### Limitation to avoid

Vizro's model manager is process-global and generated IDs are random. That is
convenient for Python authoring but less suitable for stable web deep links,
deterministic tests, and concurrent server rendering.

### PolicyWatcher decision: adapt

Use readonly TypeScript discriminated unions, deterministic IDs, an immutable
registry, and pure validation. Keep the current React rendering until the
grammar has proven useful. Runtime configuration must never resolve arbitrary
functions or imports.

## 2. Components and captured chart calls

### Observed pattern

Vizro `Graph` stores a captured plotting function plus bound arguments. The
`capture` mechanism lets filters and parameters reconstruct a figure using new
data or arguments. Graph models also carry title, header, footer, description,
actions, and explicit trigger/output properties.

### Useful contract

- Separate the visual specification from the rendering library.
- Treat title, explanation, source/footer, and empty state as part of a chart.
- Permit only known parameter changes for a chart.

### Limitation to avoid

Captured callables and import paths are powerful but expand the executable
configuration surface. PolicyWatcher handles public evidence and should not
make serialized configuration executable.

### PolicyWatcher decision: adapt

Use an allowlisted `ChartSpec` and renderer registry. A spec may name fields,
series, domains, formatters, and approved transforms; it may not contain a
closure, module path, or executable source. Recharts remains the renderer.

## 3. Filters, parameters, and URL state

### Observed pattern

Vizro distinguishes filters, which subset data, from parameters, which alter a
figure or dynamic loader argument. Controls declare targets. Selector type and
options may be inferred from data. Controls can be synchronized to URL query
parameters, reset to original values, and placed at page or container scope.

### Useful contract

- Filters and parameters are different state transitions.
- Targets and scope are explicit.
- Defaults, reset, serialization, and value coercion are centralized.
- Shareable URL state is a first-class feature.

### Limitation to avoid

Implicit inference can make a policy dashboard hard to audit. A control should
not silently acquire new options or targets merely because a dataset changed.

### PolicyWatcher decision: adapt

Use explicit bilingual control definitions and canonical URL codecs. Infer
nothing that changes evidence meaning. URL state may contain only allowlisted,
non-sensitive filters. Workspace layout preferences remain browser-local.

## 4. Actions and cross-filtering

### Observed pattern

Vizro actions connect model trigger properties to output properties. The
`set_control` action validates the source capability, target existence, target
type, page scope, and selector cardinality. Graph/table selections can set a
filter or parameter. Guards prevent reset and URL synchronization from causing
unwanted action chains.

### Useful contract

- Interactions are typed edges between known nodes.
- Cross-filtering goes through the same control model as manual input.
- Invalid target/cardinality combinations fail safely.
- Reset and synchronization need loop guards.

### Limitation to avoid

Generic callback chains can become difficult to inspect and can hide implicit
dependencies between components.

### PolicyWatcher decision: adapt

Use a small action union such as `setFilter`, `setParameter`, `reset`,
`selectEvidence`, and `exportView`. Every action records source component,
target control, and payload type. Validate the action graph for missing targets
and cycles. Always provide an equivalent keyboard-accessible control.

## 5. Data manager and cache

### Observed pattern

Vizro wraps static DataFrames and dynamic loader functions behind the same
`load` interface. Dynamic sources can be memoized with per-source timeouts.
Multi-load deduplicates identical source/argument pairs before loading.

### Useful contract

- Consumers should not care whether a source is static or refreshed.
- Query identity must be canonical and deduplicated.
- Freshness and cache policy belong to the source definition.
- Data passed to visual functions should be isolated from mutation.

### Limitation to avoid

A generic application cache does not understand PolicyWatcher roles,
`publicEvidence`, data status, or source-quality gates. A cache hit must never
cross an authorization or publication boundary.

### PolicyWatcher decision: adapt

Define typed data-source view models with query key, freshness, coverage, gate,
and provenance. Apply `publicDataGate` before aggregation and serialization.
Deduplicate only requests with the same visibility context. Do not introduce a
second process reading the production SQLite file.

## 6. Layout validation

### Observed pattern

Vizro's grid uses a matrix of component indices. Validation requires equal row
lengths, consecutive indices, matching component counts, rectangular occupied
areas, and no overlap. The validated matrix becomes CSS grid coordinates.

### Useful contract

- A declarative layout must be validated independently from rendering.
- Empty space and component spanning need explicit rules.
- Invalid layouts should fail before partial UI is produced.

### PolicyWatcher decision: adapt

Prefer named module areas and breakpoint-specific layouts over numeric indices.
Validate known modules, non-overlap, safety-module presence, and a linear mobile
fallback. Introduce this only for new or refactored modules, not as a home-page
rewrite.

## 7. Themes and accessible chart vocabulary

### Observed pattern

Vizro centralizes light/dark Plotly templates and exposes qualitative,
sequential, and diverging palettes. Chart defaults are applied consistently.

### Useful contract

- Semantic, categorical, sequential, and diverging colors are different tools.
- Chart defaults belong in one place.
- A chart vocabulary should guide selection, not just appearance.

### PolicyWatcher decision: adapt

Create PolicyWatcher-owned tokens. Risk colors remain semantic; categorical
series receive a separate accessible palette. Risk and QA meaning must also use
labels, icons, patterns, or position. Every chart gets a textual summary/table,
focus behavior, reduced-motion handling, and source/limitation context.

## 8. Filtered export

### Observed pattern

Vizro export validates target figures and exports the data remaining after
active filters and parameters have been applied.

### Useful contract

The exported dataset must match the user's filtered view.

### PolicyWatcher decision: improve

Export the same authorized view model used by the UI and attach a versioned
manifest: effective filters, generated time, PolicyWatcher release, schema/view
ID, metric units, coverage, data status, gate, language, and limitation keys.
Never re-query a broader dataset during export.

## Native invariants

The independent PolicyWatcher implementation must prove that:

1. IDs are unique and deterministic.
2. All targets exist and are in scope.
3. Action graphs contain no cycle.
4. Only allowlisted renderers, transforms, controls, and actions are accepted.
5. Source QA is visible in every composition.
6. Non-public data is absent from rows, aggregates, counts, charts, and export.
7. Missing evidence stays `pending`, never a synthetic zero.
8. Every chart has bilingual context, provenance, limitations, and a non-color
   representation.
9. URL state contains no sensitive values and round-trips deterministically.
10. The same filtered view model drives screen and export.

## Adoption order

1. Canonical KPI/risk semantics and truthful trend data.
2. Immutable dashboard grammar in compatibility mode.
3. Explicit control state and URL codecs.
4. One typed cross-filter vertical slice.
5. Evidence-first data-source registry.
6. Chart/layout specifications and accessible frames.
7. View-consistent, provenance-rich export.
