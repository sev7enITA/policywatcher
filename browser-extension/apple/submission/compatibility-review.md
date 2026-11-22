# Safari API review — source compatibility, not runtime qualification

Reviewed against [Apple's current compatibility guidance](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility).

| Used feature | Source observation | Evidence boundary |
| --- | --- | --- |
| Manifest V3 background service worker | Nonpersistent worker; no persistent background-page setting | Packager reports no warning; actual Safari worker start is not observed |
| `chrome.*` namespace | Safari supports the Chrome and Browser namespaces | Namespace support is documented, not an actual browser invocation |
| Async callbacks and promises | Both appear in the packaged client | Apple documents both approaches; integration remains to test |
| `tabs.query({active:true,currentWindow:true})` | Obtains active tab ID following extension action; does not request general tab-history access | Temporary `activeTab` host grant must be exercised in Safari |
| `scripting.executeScript` | Uses only target tab ID and a packaged local function; no unsupported `injectImmediately` option | Source shape is supported; real injection/permission denial remain untested |
| `runtime.getManifest`, `sendMessage`, `onMessage`, `lastError` | Packaged local client/worker messaging | Worker contract exercised in a stubbed Node VM, not Safari |
| Native messaging | Not requested; native handler does not read/echo the dictionary | Four macOS XCTest cases verify handler behavior; no iOS Safari native dispatch tested |
| Host permission | Only canonical PolicyWatcher HTTPS origin | Actual permission prompts/API fetch must be checked |

No identity, cookies, webRequest, contextMenus, windows-creation, session storage, history, downloads or remote-code APIs are requested. The iOS container minimum is 17.0, above the documented Safari MV3 introduction; minimum-OS execution is still untested.

Apple requires enabling an installed extension through Safari's page menu or Settings before running it. That manual OS/browser boundary was not bypassed with undocumented preferences while the primary task owned the Mac UI. See [Apple's running guide](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension). Simulator container launch therefore does not establish an enabled or working Safari extension.
