# PolicyWatcher market scan and implementation scope

Observed 17 November 2026. These are public product signals and consumer-advocacy findings, not validated demand from PolicyWatcher users. No market share, revenue, conversion uplift or customer adoption is inferred.

| Source | Observed positioning/capability | Inference for PolicyWatcher |
| --- | --- | --- |
| [Visualping AI](https://visualping.io/blog/visualping-ai) | Consolidated reports across selected monitors, relevance filtering and inspectable changes. | A bounded briefing should reduce separate-record review effort and preserve why an entry appears. Value remains a hypothesis. |
| [OneTrust TrustWeek announcement, 30 September 2026](https://www.onetrust.com/news/onetrust-unveils-platform-and-product-innovations-to-govern-ai-at-enterprise-scale/) | Context, vendor relationships, workflows and evidence behind decisions; several announced capabilities explicitly remain previews or future availability. | Enterprises need a route from evidence to an accountable review. A local role/date checklist is a limited first step, not an enterprise collaboration platform. |
| [Consumers International, 22 September 2026](https://www.consumersinternational.org/news-resources/news/releases/consumers-international-launches-global-campaign-to-reimagine-privacy-in-the-ai-era/) | Calls for understandable choices, accountability, portability and reducing the burden on consumers. | Favor readable reasons, direct sources and local control over opaque risk scores. Do not frame individual action as sufficient protection. |
| [ToS;DR](https://tosdr.org/en) | Community explanations and service-level grades; examples cover AI training, sharing and retention. | Explain actual source evidence and separate a topic mention from an assessment. Do not infer superiority over established community reviews. |
| [Open Terms Archive Contrib](https://opentermsarchive.org/en/collections/contrib/) | Tracked terms, public history and reusable datasets. | Reusable, dated evidence is infrastructure; the added value here is a bounded review workflow. |

This quick scan uses official pages only. No paid SEO/traffic tooling or independent customer interviews were available. Competitor statements are vendor claims, not third-party verification. Source dates and claimed availability differ.

## Priorities and gap against the existing product

Existing source already implements local service following and citizen choices (`shared/citizen.ts`), published evidence collections, machine-readable handoffs and notice intake. Those are not presented as new features.

1. **Individuals: a topic-focused briefing.** Filter the downloaded public window by chosen services and AI training, retention/deletion, sharing/subprocessors, international transfers, consent/choices and prices/renewal. Show the exact matching term and whether it appears in an excerpt or a generated summary. No match does not imply no policy change or no risk.
2. **Business reviewers: local review planning.** Keep a responsible role, user-selected review date and status against an exact public change. A newer publication reopens the old review; stale or unavailable catalog metadata cannot validate a completed review. No team synchronization, verified assignment, deadline inference or external ticket creation is claimed.
3. **Both audiences: evidence-preserving export.** Download a dated briefing with source retrieval dates, before/after excerpts, public record links and partial-window context. Local role/status/date fields are excluded by default and require explicit inclusion. Calendar export creates all-day user reminders, without alarms, invitations or automatic subscription.

## Deferred work with material product value

A real multi-user workspace with server authorization, assignment history, notifications, identity and tenant separation; vendor use-case/plan applicability reviewed against contracts; verified opt-out guidance; accurate effective-date extraction; complete source coverage and operational semantic verification. These need separate designs and qualification. This tranche does not activate Engine 6 or inherit qualification from r3/r4 tests.

## Model involvement

Requested: Gemini 4 High through Antigravity, GLM 5.3 and LM Studio. Actual evidence and dispositions are recorded in the delivery report. Neither an unanswered request nor model source review is counted as an executed test. Product runtime does not call these models.
