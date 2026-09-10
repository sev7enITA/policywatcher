# UI and UX P0 corrections for PolicyWatcher 4.0.0 Beta 3

This patch keeps company cards within narrow mobile viewports, distinguishes
contextual policy risk from the overall score, and makes policy details usable
with keyboard focus throughout loading, error and normal states.

The candidate is based on production Beta 3. The five existing UI files,
package metadata, lockfile and Prisma schema were compared by SHA-256 with the
Hostinger `last-source` deployment and matched before applying the patch.
The deployed source revision was `a2fd809ac2c0fe4d1625b7d3b29f07e33c5544f1`;
the release branch starts from `d1f463fc2bf714e16c0212235a696d684e8c4af2`,
whose intervening changes affect documentation and one existing test only.

## Behavior

- Cards wrap long company and policy names and keep actions reachable from
  320 px upward in normal, compact and focus layouts.
- A card identifies the policy shown and the region/audience for its risk.
  The overall 1-10 score remains separate. Missing context, absent assessments
  and sources needing review have explicit labels. Each alert opens the policy
  that caused it.
- Policy details use a native modal dialog. Focus stays inside the panel and
  returns to its opening control on close. Loading and errors retain the close
  action; retry and stale response handling prevent inaccessible or reopened
  panels.

The source changes are limited to eight UI/helper/test files. Package version,
database schema, dependencies and environment configuration are unchanged.
The unique artifact label and SHA-256 identify this patch within Beta 3.

## Validation

- TypeScript and repository-wide ESLint passed.
- Vitest: 1,073 tests across 166 files passed. The initial full run caught two
  disallowed punctuation characters; after correction, the affected release
  metadata suite passed.
- Optimized production build passed with an isolated local SQLite fixture.
- Chromium tested that build with synthetic data: 18 viewport/layout
  combinations from 320 to 1,440 px, Italian and 200% text, focus cycling and
  restoration, Escape, background shortcut isolation, policy-specific alerts,
  error/retry and closing during loading. No unhandled JavaScript errors.

The browser checks are UI regression evidence, not verification of real
company assessments. Staging verification and production publication are
recorded separately after the immutable artifact is deployed.
