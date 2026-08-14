# PolicyWatcher Beta 21 paper audit

Audit date: 30 July 2026
Scope: the English systems paper, dated public operational snapshot, editable
DOCX, publication PDF and minimal arXiv source package.

## Publication position

The manuscript is framed as a systems paper with a point-in-time operational
evaluation. It does not present the release as a legal-analysis benchmark, an
AI Act conformity assessment, an exhaustive market study or an adoption study.
The main contribution is the evidence lifecycle: retrieval, validation,
immutable snapshots, public-data gating, explicit withholding and bounded reuse.

## Beta 21 additions covered in the manuscript

- Source Reliability control plane with normalized retrieval keys, shared
  acquisition accounting, structured failure causes, remediation state and
  historical references excluded from change detection.
- Exact-evidence first-baseline and dry-run-first repair controls.
- Side-by-side diffs, source-anchored explanations, regional heatmaps and radar
  benchmarks with explicit interpretation boundaries.
- Evidence Packets, browser-local Collections, deterministic handoff exports,
  versioned public read contracts and forward-only change-event polling.
- Receiver verification and an eight-case browser-local conformance lab without
  a production delivery or certification claim.
- Current public, protected governance, Press Kit, Data Room, Claim Registry,
  Chrome extension and documentation surfaces.
- EU AI Act Article 50 context and the European Commission guidelines published
  on 20 July 2026, while explicitly excluding any conformity claim.

## Operational evidence

The production snapshot was collected at `2026-07-30T10:06:57Z` from four
unauthenticated public JSON endpoints. It reports:

| Measure | Production | Seeded control |
| --- | ---: | ---: |
| Policy records | 50 | 50 |
| Public-evidence records | 45 | 0 |
| Suspended or withheld records | 5 | 50 |
| Public company records | 15 | 0 |
| Public change-record inventory | 35 | 0 |

The leaderboard reports 18 company rows while `/api/companies` returns 15
public records. Because those endpoints use different inclusion rules, the paper
reports the raw counts and does not calculate a provider-level coverage rate.
Retrieval-path fields and public change records are inventory data, not repeated
success rates or independently adjudicated legal events.

## Validation performed

- TeX compiled in isolation with Tectonic to a 20-page Letter PDF.
- No TeX overfull boxes, build errors, embedded JavaScript or encryption.
- Every page of the publication PDF was rendered to PNG and visually inspected.
- The editable DOCX rendered to 21 pages and every page was visually inspected.
- DOCX accessibility audit: zero high-severity and zero medium-severity findings;
  eight low-severity raw-URL notices remain in references and identity fields.
- The paper reports the release evidence already established for Beta 21: 485
  automated tests across 89 files, a 130-route production build, static checks,
  read-only inventory validation and dry-run baseline repair.

## Scientific limits retained

A peer-reviewed comparative evaluation still requires a frozen provider corpus,
a pre-registered repeated-scan window, independently labelled changes and
non-changes, blinded expert review, agreement measures, precision/recall and
time-to-detection analysis. The current 35 public change records must not be
described as 35 independently verified legal amendments.

## Final artifacts

- `PolicyWatcher-Systems-Paper-Beta21-2026-07-30.pdf`
- `PolicyWatcher-Systems-Paper-Beta21-2026-07-30.docx`
- `policywatcher-arxiv.tex`
- `data/operational-snapshot-2026-07-30.json`
- `output/arxiv/policywatcher-arxiv-beta21-source.zip`
