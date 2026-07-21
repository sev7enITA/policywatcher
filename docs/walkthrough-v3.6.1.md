# Walkthrough — PolicyWatcher 3.6.1: Adaptive Workspace Foundation

We have verified and completed the implementation of release **3.6.1**. The changes deliver a highly customized, clean, and goal-oriented experience, fixing the "cheap" generic design and addressing visual clutter.

---

## 1. Accomplished Features

### 1.1 Typography & Visual Cleanups
- **Softer Controls:** Removed the blocky, bold display font (`--font-display`) from all operational buttons, tabs, input labels, and candidate cards on both the `/` and `/roadmap` pages, replacing it with a clean sans font (`--font-sans`).
- **Improved Spacing:** Reduced depth-button heights and adjusted layout padding, focus rings, and active states for a sleek, cohesive feel.

### 1.2 Dashboard Workspace Composer
- **Objective-Based Layout:** Implemented an interactive selection grid on the homepage dashboard `/`. Users can choose:
  - **Intent:** Citizen, GRC / Legal, Research, or Builder.
  - **Evidence Depth:** Snapshot, Operational, or Forensic.
- **Dynamic Module Composition:** Layout modules (Stats Grid, Controls Bar, Suspended Sources, Market Pulse, Cards Grid, API Docs) are dynamically reordered and filtered based on the active intent and depth.
- **Strict Safety Invariant:** Banners for suspended sources and confidence badges on company cards remain visible across all profiles, preventing critical data limitations from being obscured.
- **Local Persistence & Deep Links:** State is initialized from URL search parameters (`?intent=...&depth=...`), falls back to `localStorage` (for persistence across refreshes), and updates the URL dynamically on state change.

### 1.3 Interactive Roadmap Presets
- Redesigned the `/roadmap` route to load the new `RoadmapClient` component.
- The roadmap includes a live interactive diagram of the Adaptive Workspace flows and maps release lanes correctly (marking 3.5.1 as `delivered` and 3.6.1 as `current`).
- Candidates cards now feature deep-link presets (e.g. `/?intent=citizen&depth=forensic`) to allow immediate testing of specific profiles.

### 1.4 Interactive Infographics Page (`/infographics`)
- **Infographic 01 — Adaptive Workspace Matrix:** Fully animated interactive panel illustrating how the dashboard dynamically hides, prioritizes, and configures layout modules for the active role (`Citizen`, `GRC / Legal`, `Research`, `Builder`).
- **Infographic 02 — Sitemap & Section Atlas:** Visual node-edge graph detailing the sitemap structure and page flow boundaries of the platform.
- **Infographic 03 — Safety Invariant:** Diagram showing how custom URL parser sanitation feeds the dashboard layout, while locking down the `Suspended Source Warning` warning banner so it can never be hidden.

---

## 2. Verification & Validation Summary

### 2.1 Automated Compliance
- **Unit Tests:** `npm test` successfully executed all 87 tests in `510ms`.
- **Linter & Types:** `npm run lint` and `npx tsc` completed with zero warnings or errors.
- **Next.js Production Build:** Completed successfully, optimizing 53 static and dynamic page routes (including `/infographics`).

### 2.2 Security Review
- **URL Parameter Sanitization:** Evaluated `normalizeWorkspaceIntent` and `normalizeEvidenceDepth`. These use a strict enum allowlist, neutralizing query-string XSS or injection vulnerabilities.
- **Certification Boundary:** Wording remains strictly evidence-focused (e.g., "evidence signals", "provenance logs"), avoiding absolute wording such as "certification" or "legal compliance".

---

## 3.6.3 follow-up — 2026-07-21

The 3.6.1 profile foundation now powers a true first-use Objective-based Dashboard Composer. When no valid saved profile or deep-link preset exists, the dashboard asks for intent and evidence depth, previews a stack assembled from registered production evidence modules, and applies the selection explicitly. Source QA remains pinned in every composition.

Release 3.6.3 also delivers protected Bulk Source Onboarding at `/admin/source-onboarding`. CSV/TSV candidates move through five persisted stages: proposed source, official-source review, first private baseline, QA gate, and publication decision. Import, approval, and baseline capture remain non-public; QA must pass and an administrator must explicitly publish before evidence can cross the public gate.

The follow-up is covered by the current unit suite, lint, TypeScript, production build, and diff checks rather than the historical counts recorded above.
