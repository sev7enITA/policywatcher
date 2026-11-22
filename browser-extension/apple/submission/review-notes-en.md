# Apple/TestFlight review notes  -  draft

**Not submitted.** Version 0.1.0 (1), app `online.policywatcher.safari`, extension `online.policywatcher.safari.Extension`. Source runtime 3.8.3.3. No app account, subscription or in-app purchase is required. Publisher contact details, Apple team and final bundle ownership must be supplied by the publisher before upload; none are invented here.

This is a Safari extension contained in an iOS onboarding app. Launch the app, then open Settings and search for Safari. Open Extensions, select PolicyWatcher and enable it. Alternatively, use Safari's More/Page menu > Extensions. Grant only the access requested for the public page you choose to inspect. The local app explains its preview state in English and Italian.

Use the included synthetic notice fixture; never inspect a personal inbox, confidential email or real customer document for review. In Safari, invoke PolicyWatcher, read the disclosure and choose Continue. Inspect selected text/the visible notice or choose manual entry. Before a request is sent, review the organization, sender domain, official source URL, selected categories and dates. Raw notice text is not part of the request. Temporary page access is invoked by the user's action; there is no persistent all-sites content script or inbox API.

The reviewed network destination is `https://policywatcher.online/api/policy-inquiries`. Sending a confirmed inquiry is the primary product operation and may create a human-review record; it is not an automatic new-source approval or scan. The publisher must approve the review/test destination and fixture before external testing. This audit did not send any production inquiry.

Results distinguish published comparisons, a monitored organization without a published comparison, ambiguous/conflicting clues and human-review queues. Offline, rate-limit and storage-unavailable errors are explicit. Coverage is configured and incomplete. No result is legal advice, compliance certification or a guarantee of complete change detection.

The extension does not select Engine 6. The public website runs stable 5.5.0; Engine 6 Preview is a distinct authenticated administrator environment with private results. Administrator access is outside this submission and is not required to review this client.

Before submission, replace these draft notes with the actual tested sequence and attach the final signing/QA receipt. At present, the container launches in an isolated iPhone simulator, but Safari enablement, injection, permission handling and end-to-end live queries remain unqualified. Do not submit this as a completed production app until those gates pass. Use TestFlight for the beta; App Store production review is a later gate.
