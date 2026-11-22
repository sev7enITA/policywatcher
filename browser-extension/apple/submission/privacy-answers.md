# App Privacy answers — publisher review draft / Bozza da revisionare

These are code-based proposed answers, **not submitted declarations**. Apple requires the publisher to account for server/partner processing as well as the client. The current source stores structured inquiry records; a blanket “Data Not Collected” answer is not supported. Transient processing and retained records are different. [Apple's current definitions](https://developer.apple.com/app-store/app-privacy-details/) distinguish off-device retention and require declaration even where data is used only for functionality.

| App Store question/data | Proposed answer and evidence | Remaining verification |
| --- | --- | --- |
| Does this client collect data off-device? | **Yes for confirmed structured inquiries**, when records are retained by the public service. `service-worker.js` posts an eight-key dictionary; the public API normalizes and can persist `PolicyInquiry` records. | Publisher confirms deployed server behavior/retention, alert-mail providers and operational logs. |
| Other User Content | **Declare for App Functionality**: organization/service clues, policy categories and dates supplied/confirmed by the user. | Do not claim the optional-disclosure exemption: this is a primary feature. Review accidental free-text personal data in manual fields. |
| Browsing History / source URLs | A cleaned official source URL can be transmitted and retained. Conservatively include the relevant source-URL category for functionality; it is not continuous browsing-history collection. | Publisher confirms final Apple categorization. Do not equate lack of `history` permission with no off-device URL handling. |
| Emails or Text Messages | Raw bodies, recipients, subjects, addresses and attachments are not fields in the structured request. Notice text may be processed **locally** to derive clues. | Explain local handling in the public privacy notice and permission disclosure; do not use this to hide the confirmed fields above. |
| Identifiers / IP and security logs | No extension account/device ID, cookie credential or analytics identifier is sent by client code. Server infrastructure may see IP/security metadata. | Verify access-log retention and any correlation with inquiries before declaring unlinked data or excluding a data type. Random inquiry references are operational references, not an advertising identifier. |
| Data linked to identity | No user account is required, and no email/user ID field exists in the inquiry schema. | **Pending server/log review**, not an unconditional “No”: retained IP or other operational links can change the answer. |
| Tracking | **No in reviewed client code**: no ad SDK, cross-company identifier, tracking permission, data broker or marketing profiling flow. | Publisher confirms all server/partner uses match this. |
| Analytics | No client telemetry/analytics SDK or inquiry-history storage. | Public website analytics after an external browser navigation is a separate surface that the publisher must describe accurately. |
| Sensitive/health/financial/location/contact/photos/audio data | Not requested or intentionally transmitted by this extension. | Do not use sensitive notices; free-text fields are not a general-purpose DLP guarantee. |
| Advertising, sale or creditworthiness uses | None in the reviewed flow. | Publisher confirms operational practices. |

The native app is a local informational container. Its WKWebView is non-persistent, there is no JavaScript message bridge and only explicit canonical HTTPS link clicks open the external browser. No native-messaging permission exists. The native handler completes with no returned items and does not read, echo or log incoming dictionaries. Four native-handler tests execute on macOS; this is not proof of iOS Safari message dispatch.

No third-party native SDK or required-reason API use was identified in this small native container. The generator does not invent an empty privacy declaration or App Store label. Verify the final Xcode privacy report, linked SDKs and Apple's current requirements after signing.

## Italiano

Le risposte sono proposte basate sul codice e richiedono conferma del publisher su backend, conservazione, log e provider delle notifiche. Gli indizi strutturati confermati possono essere conservati: **non selezionare indiscriminatamente “nessun dato raccolto”**. La mancanza di un permesso cronologia non esclude il trattamento di un URL di fonte. Il testo grezzo è elaborato localmente; i campi confermati inviabili devono essere dichiarati separatamente. L'assenza di un account non dimostra automaticamente l'assenza di collegamenti tramite log IP.
