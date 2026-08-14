# PolicyWatcher 3.9.0 Beta 8 release audit

- Release: `3.9.0-beta.8`
- Date: 27 July 2026
- Scope: assistant entry-point consolidation
- Browser extension: unchanged at `3.8.3-beta.3`

## Delivered behavior

- The legacy floating blue chat trigger is no longer rendered by the public dashboard.
- One persistent assistant action remains in unified desktop and mobile navigation.
- The labelled `AI Chat` action remains in Workspace Controls.
- The Command Palette continues to expose the assistant action.
- All retained entry points open the existing Policy Live Assistant through the same dashboard state transition.

## Boundary

The release changes assistant discovery and visual hierarchy only. It does not change generated answers, conversational context, Gemini integration, voice behavior or the `/api/chat` contract.

## Verification gates

- Focused assistant-navigation regression tests: passed.
- Automated unit and regression suite: 362 tests passed across 61 files.
- TypeScript validation: passed.
- ESLint validation: no application errors; one warning remains in an unrelated untracked temporary deck script.
- Production Next.js 16.2.11 build: passed.
- Press package regeneration: 18 assets and two localized packages generated for Beta 8.
- Deployable dependency audit: no advisory reported by `npm audit --omit=dev` at the time of execution. This is a point-in-time tool result, not a security certification.
- Independent desktop and mobile UI evaluation: two evaluator sessions did not return a verdict within the bounded release window. The implementation pass separately completed runtime checks at 1440 px and 390 px, confirmed one persistent trigger per viewport and found no horizontal overflow.
- Hostinger archive integrity and checksum validation: performed after the release commit.

Final command results and the Hostinger checksum are recorded after the release commit.
