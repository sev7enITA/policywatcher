# Independent iOS follow-up and main header review, 22 November 2026

Reviewed iOS commits e1b4a3c and ed0db376 and main PublicHeader at 4fd791e. No P0/P1 correctness or security defect found. Runtime/source approval remains valid, with one reproducible editorial integration gate pending.

## Integration gate

The combined tracked repository run passes 82 of 83 tests. The existing release test rejects U+2014 in eight newly tracked Apple submission files. Replace these editorial characters without changing the gate, rerun, and refresh the review-kit checksum if packaged. The exact output is in the reconciliation checkout at output/audit-20261122/backoffice/followup/main-header-tests.log. The locale/navigation assertions themselves pass.

## Independently executed checks

Four native-handler XCTest cases passed on macOS with OS networking denied. The first invocation failed because Swift tried to nest its own sandbox; the retained retry uses --disable-sandbox for Swift while keeping the outer OS network denial. Six tests passed against the actual packaged worker with stubbed browser/fetch boundaries. Draft metadata EN/IT length and identity checks, Python syntax and diff whitespace checks passed. Seven source hashes and the saved screenshot hash match the committed receipt.

The saved screenshot was independently inspected: the initial English containing-app onboarding is visible with preview, wrapper and shared-runtime identities. It is not a Safari extension screenshot. The smoke script requires visible onboarding headings and a live owned process, creates only a new dedicated simulator and shuts it down; previous blank-frame and OCR timeout evidence remain preserved. This reviewer did not rerun simulator installation/launch or use the shared Mac GUI.

## Publication boundary

The kit consistently says unsigned developer preview, not uploaded, not App Store/TestFlight available. Source API compatibility, macOS handler execution, stubbed VM behavior and native-container rendering remain separate. Real Safari enablement, permissions, injection and network submission; iPad/physical/minimum-OS testing; accessibility; publisher identity, signing, privacy approval and Apple review remain open. Publisher drafts correctly avoid a blanket Data Not Collected assertion.

## Main PublicHeader adaptation

The reviewed main version retains the richer grouped directory and existing accessibility/close behavior. Its primary links, grouped links, brand and workspace link use the same allowlisted publicNavigationPath helper reviewed on e99bde6. Route lists are static; no dynamic untrusted navigation is introduced. The relevant tested source files are byte-identical between main4fd791e and the reconciliation checkout used for the 83-test run. No new blocker found in the adaptation.

Public-safe wording: an unsigned Safari iOS developer candidate now compiles, and its initial English containing-app onboarding was observed in one iPhone simulator; Safari, devices, signing and Apple review are next. No deployment or external submission was performed by this reviewer.


Integration follow-up: the eight editorial em dashes were replaced without runtime/test changes. The combined ten-suite offline run then passed83/83; see main-frontend-integration-tests.log. The initial82/83 remains in the independent review receipt. Review-kit checksums must be updated for the editorial changes before publication.
