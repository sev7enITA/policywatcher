# Presentation script - PolicyWatcher 3.9.0 Beta 41 Adaptive Experience

Duration: about 7 minutes
Audience: associations, policy teams, partners and product stakeholders
Demo routes: `/`, `/associazioni`, `/infographics`, `/atlas`

## 00:00 - The change in one sentence

**Say:** “PolicyWatcher is becoming global and broad, but the first screen should still answer one question: what can I do next? Beta 41 adds an experience control that lets each person choose the amount of interface they need, without changing a single source, score or evidence gate.”

**Show:** the dashboard with the `Balanced` preset and the `Today · Continue · Explore` workflow visible before the browser-extension promotion.

## 00:45 - Before and after

**Say:** “Beta 40 globalized Civic, added the country and region context, expanded the directory to 79 organizations across 24 countries and published the Edge extension status. Beta 41 makes that larger platform easier to operate.”

| Dimension | Through Beta 40 | Beta 41 impact |
| --- | --- | --- |
| Global context | Region, country and language preference | Preserved and exposed inside the interface explanation |
| Civic | Global source-backed directory and suggestions | Remains a direct domain, not buried inside a generic catalog |
| Dashboard | Bounded `Today · Continue · Explore` workflow | User-controlled `Focus · Balanced · Explore` density |
| Next step | Workspace links across modules | One deterministic next action shown as a first-class card |
| Motion | System and component behavior | Visible `System / Reduced` override |
| Architecture | Route-level sitemap and Atlas | Generated ER model plus editorial infographic |

**Boundary:** these are shipped product changes. They do not establish adoption, task-time improvement, legal compliance or accessibility certification.

## 01:45 - Focus mode: one decision at a time

**Do:** choose `Focus`.

**Say:** “Focus does not create a smaller product. It temporarily reduces the visible dashboard to the current decision path. Secondary lanes and promotion leave the screen; the primary workflow and evidence boundary remain.”

**Point out:** the mode is browser-local. Refresh the page to show persistence if useful.

## 02:40 - Balanced and Explore: agency instead of hidden adaptation

**Do:** switch to `Balanced`, then `Explore`.

**Say:** “Balanced follows the selected workspace. Explore increases density and shows the secondary modules already allowed by that workspace. We do not infer a user's expertise or quietly re-rank the evidence.”

**Open:** `Why this interface?`

**Say:** “The explanation shows the actual inputs: workspace, evidence depth, region and local display preference. It explicitly says that this is deterministic and not an AI judgment.”

## 03:45 - Motion and accessibility

**Do:** activate `Motion: reduced`, then move through the controls with the keyboard.

**Say:** “The preference requests reduced Framer Motion behavior and suppresses non-essential CSS animation. Beta 41 also adds a skip link, visible focus, fixed-navigation clearance and large control targets. These are concrete accessibility improvements; they are not a claim of formal conformance.”

## 04:45 - Global remains global

**Do:** open `/associazioni`, change country or region, and show the source/suggestion boundary.

**Say:** “The experience layer sits above the whole product. The global region, country and language context still affects the public shell, dashboard defaults and Civic discovery. Civic remains source-first: users can filter verified entries and propose another organization through a reviewable email draft, never an automatic publication.”

## 05:40 - The ER sitemap infographic

**Do:** open `/infographics` and show `PolicyWatcher Experience Map`.

**Say:** “The platform is now described through seven domains: Monitor, Evidence, Civic, Trust & Method, Build & Integrate, Communicate and Understand. The editorial poster is for presentation; the exact Mermaid and JSON records are generated from the sitemap source and validate 33 literal static routes plus four dynamic route families.”

**Do:** follow the link to `/atlas` to show the complete catalog.

## 06:35 - Close and invitation

**Say:** “The key idea is simple: global coverage can grow without forcing every capability into every session. Beta 41 gives people control over hierarchy, makes adaptation inspectable and keeps the evidence model unchanged. The next validation step is a moderated pilot with associations and policy teams, measuring task completion rather than feature exposure.”

### Q&A guardrails

- “Is this AI personalization?” - No. The mappings are deterministic and defined in source code.
- “Does Focus hide evidence?” - It hides secondary presentation modules, not the evidence or publication gates.
- “Is the organization directory complete?” - No. It is dated and non-exhaustive; suggestions require review.
- “Does this meet WCAG?” - The release implements specific accessibility improvements, but it does not claim formal conformance.
- “Are the route counts live?” - They are generated at build preparation time from `src/app/sitemap.ts`; run `npm run assets:sitemap-er` to refresh and validate them.
