# ADR: native evidence-first dashboard engine

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision owners:** PolicyWatcher maintainers

## Context

PolicyWatcher already has a product-specific Next.js/React interface, Recharts
visualizations, Prisma-backed APIs, adaptive workspace composition, bilingual
content, publication gates, and evidence QA. Vizro demonstrates useful patterns
for declarative dashboards, controls, actions, data loading, layout validation,
themes, and filtered export.

Adding Vizro would introduce a second Python/Dash/Flask application model and
would not understand PolicyWatcher's publication, provenance, or role
boundaries by default.

## Decision

PolicyWatcher will study Vizro `0.1.59` as a pinned knowledge source and build an
independent native dashboard grammar in TypeScript. Vizro will not be installed,
embedded, imported, or used at runtime.

The native design will use:

- readonly discriminated unions and deterministic IDs;
- immutable, allowlisted registries;
- pure validation before rendering;
- explicit filter/parameter scope and typed actions;
- view models gated before aggregation;
- provenance and Source QA as required output metadata;
- Recharts and existing React components as renderers;
- the same filtered view model for UI and export.

## Consequences

### Positive

- No additional deployment/runtime stack.
- Existing UI, routes, authentication, SEO, and accessibility remain intact.
- Stronger safety than executable dashboard configuration.
- Policy-specific evidence and QA semantics can be enforced centrally.
- Each capability can be introduced and rolled back independently.

### Costs

- PolicyWatcher owns validation, documentation, and tests for the native
  grammar.
- Cross-filter and data-source abstractions must be implemented incrementally.
- Compatibility tests are required while existing pages migrate.

## Guardrails

- No Vizro, Dash, Flask, or Python Plotly dependency in `package.json`, lockfiles,
  deployment artifacts, or production processes.
- No arbitrary function/module resolution from a serialized dashboard spec.
- No generic cache may bypass role, publication, or `publicEvidence` context.
- `sourceQuality` remains pinned and cannot be hidden by a composition.
- Native primitives are introduced first behind existing behavior; a generic
  renderer is not a prerequisite.

## Reference

See [Vizro patterns knowledge base](./vizro-patterns-knowledge-base.md) for the
source analysis and adopt/adapt decisions.
