# Release 3.7.2 - Calm Workspace Review

Date: 2026-07-22
Scope: public dashboard first-use onboarding, adaptive workspace persistence, desktop command toolbar, mobile navigation, changelog access and responsive behavior.

## Closed usability risks

1. **Overloaded first impression.** A new visitor now completes a progressive objective, evidence-depth and module-preview flow before entering the full dashboard.
2. **Unbounded toolbar density.** The primary desktop surface exposes no more than three workspace-relevant shortcuts; all registered commands remain available from More.
3. **Hidden release context.** The PolicyWatcher identity and version are interactive and open the changelog. What Changed is an icon immediately before Search.
4. **Crowded mobile controls.** The bottom bar is limited to What Changed, Workspace, AI Chat, Search and More, with safe-area spacing and overflow checks.
5. **Opaque personalization.** The active workspace summarizes objective and evidence depth, can be reopened at any time, and stores its preferences locally in the browser.

## Evidence and privacy boundary

- Source QA remains present in every generated module stack and is not hidden by personalization.
- Workspace preferences and the onboarding-completion marker are stored in `localStorage`; the workflow collects no email address or user identity.
- Valid objective/depth URL presets remain reversible and can open a preconfigured public workspace without forcing the first-use modal.
- Reduced-motion preferences disable non-essential transition behavior, and interactive controls retain keyboard-visible focus.

## Verification record

- Regression coverage validates intent-to-action mapping, onboarding completion, preset behavior and source-level navigation wiring.
- Desktop, tablet and mobile UI evaluation: PASS after mobile preview safe-area refinement.
- Final Playwright checks confirmed three desktop quick actions, five mobile actions, What Changed ordering, interactive release identity, zero document overflow and reduced-motion behavior.
- Full test, lint, TypeScript, dependency-audit, production-build and extracted-package smoke results are recorded in the release handoff.
