import UIKit
import WebKit

/// A local onboarding screen. Policy evidence and requests stay in the Safari extension.
final class ViewController: UIViewController, WKNavigationDelegate {
    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        view = webView
        guard let page = Bundle.main.url(forResource: "Main", withExtension: "html"),
              let resources = Bundle.main.resourceURL else { return }
        webView.loadFileURL(page, allowingReadAccessTo: resources)
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.isFileURL { decisionHandler(.allow); return }
        // Never turn this container into a web browser or accept arbitrary app links.
        if action.navigationType == .linkActivated,
           url.scheme == "https", url.host == "policywatcher.online",
           url.user == nil, url.password == nil, url.port == nil {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }
}
