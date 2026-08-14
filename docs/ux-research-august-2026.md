# PolicyWatcher UI/UX research - August 2026

Date: 7 August 2026
Release target: `3.9.0-beta.41`
Scope: public dashboard, global platform context, motion, navigation hierarchy and sitemap communication.

## Executive decision

The release does not add another autonomous recommendation layer. It adds a small, user-controlled experience layer on top of the existing workspace composer: `Focus`, `Balanced` and `Explore`, plus an explicit motion preference. The evidence, source-quality gates and publication rules remain unchanged.

The core UX principle is progressive disclosure with visible user agency. PolicyWatcher is now large enough that showing the complete feature inventory on the first screen creates navigation cost. Beta 41 therefore puts one bounded workflow and one deterministic next action before promotional or secondary modules, while Atlas remains the complete map.

## Observed external evidence

These points come from current, authoritative design-system and standards documentation. They are not measurements of PolicyWatcher.

- WCAG 2.2 adds requirements covering focus not obscured, minimum target size, consistent help and redundant entry. These matter directly to a dense dashboard with persistent navigation and repeated controls. Source: [W3C - What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
- W3C's supplemental focus guidance recommends keeping the current task and relevant information visually clear, especially when a user changes context. Source: [W3C - Help Users Focus](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/).
- Interaction to Next Paint remains a Core Web Vital; a good experience is at or below 200 ms at the 75th percentile. This release therefore avoids a new network round trip or heavyweight personalization runtime. Source: [web.dev - Interaction to Next Paint](https://web.dev/articles/inp).
- GOV.UK dashboard guidance says dashboards should provide a high-level view and use hierarchy to prevent users from feeling overwhelmed; it also notes that dashboards often fail to highlight the main finding. Source: [GOV.UK Design System - Dashboards](https://brand.design-system.service.gov.uk/data/dashboards/).
- USWDS warns that simultaneous horizontal and vertical navigation can confuse users and recommends simplifying navigation when both appear. PolicyWatcher's response is to keep global navigation and move the exhaustive product catalog to Atlas instead of introducing another permanent side navigation. Source: [USWDS - Side navigation](https://designsystem.digital.gov/components/side-navigation/).
- The Carbon AI label pattern makes the provenance of an AI-influenced element inspectable. Beta 41 applies the same transparency principle to personalization, but explicitly labels the new behavior as deterministic and non-AI. Source: [Carbon - AI label](https://carbondesignsystem.com/components/ai-label/usage/).
- User motion preferences should be respected, and non-essential motion triggered by interaction must be suppressible. Sources: [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion), [W3C - Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html).

## PolicyWatcher inference and product response

The following decisions are PolicyWatcher design inferences from the evidence above and from a visual audit of the existing dashboard at 1440 × 1000 and 390 × 844. They are not external benchmarks or measured outcome claims.

| Design pressure | Beta 41 response | Product boundary |
| --- | --- | --- |
| The platform has multiple navigation and control layers | Keep the existing shell; make `Today · Continue · Explore` the primary workflow and keep the full catalog in Atlas | No route or expert capability is removed |
| Different sessions require different information density | Add `Focus`, `Balanced` and `Explore` as explicit, browser-local modes | The system does not infer identity, ability, intent or jurisdiction |
| Personalization can be opaque | Add `Why this interface?` with the exact inputs and an explicit non-AI statement | The explanation describes deterministic presentation only |
| Persistent UI can obscure content or focus | Add a keyboard skip link, stronger focus treatments and scroll clearance for fixed navigation | Formal WCAG conformance is not claimed |
| Motion can create discomfort or unnecessary work | Add a visible `System / Reduced` motion control and respect system preferences | The control affects presentation, not evidence processing |
| A large platform needs a communicable information model | Generate an exact ER sitemap from the route source and pair it with an editorial infographic | The poster is explanatory; Mermaid/JSON remain the exact route record |

## Killer features selected for August 2026

1. **User-controlled complexity.** A person can reduce or expand the visible dashboard without changing their workspace or data.
2. **One deterministic next step.** The active workspace maps to a disclosed route; no black-box ranking or generative recommendation is used.
3. **Explainable adaptation.** The interface exposes the selected workspace, evidence depth, region and local-storage boundary.
4. **Motion sovereignty.** Reduced motion is a first-class in-product setting rather than an implicit implementation detail.
5. **Source-generated information architecture.** The sitemap diagram is generated from `src/app/sitemap.ts`, validated against seven domains and four dynamic route families.

## Acceptance criteria

- The three experience presets are keyboard-operable, use pressed-state semantics and have touch targets of at least 44 CSS px.
- The chosen experience and motion settings survive a reload in the same browser and fail closed to `Balanced / System` when storage is invalid.
- `Focus` removes secondary dashboard lanes and promotional content without hiding the primary workflow or recommended next action.
- `Reduced` suppresses non-essential CSS animation and requests reduced Framer Motion behavior.
- The dashboard can be reached with a skip link and fixed navigation does not cover the focused workflow heading.
- The generated sitemap artefacts report 33 literal static routes, seven editorial domains and four dynamic route families.
- Desktop and mobile rendered QA pass without horizontal overflow, broken controls or console errors attributable to Beta 41.

## Measurement plan

Beta 41 ships controls and testable behavior, not claimed user outcomes. After deployment, evaluate only with privacy-bounded, aggregate measurements such as mode activation, successful recommended-action navigation, return-to-balanced rate and task completion in moderated sessions. Do not treat activation as satisfaction, adoption or accessibility conformance.
