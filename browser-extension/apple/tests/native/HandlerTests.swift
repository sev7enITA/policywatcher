import XCTest
import SafariServices
@testable import PolicyWatcherNative

final class SpyContext: NSExtensionContext {
    var supplied: [Any] = []
    var reads = 0
    var completions = 0
    var returned: [Any]?
    override var inputItems: [Any] { reads += 1; return supplied }
    override func completeRequest(returningItems items: [Any]?, completionHandler: (@Sendable (Bool) -> Void)? = nil) {
        completions += 1
        returned = items
    }
}

final class HandlerTests: XCTestCase {
    func assertIgnored(_ payload: Any?, file: StaticString = #filePath, line: UInt = #line) throws {
        let context = SpyContext()
        if let payload {
            let item = NSExtensionItem()
            item.userInfo = [SFExtensionMessageKey: payload]
            context.supplied = [item]
        }
        SafariWebExtensionHandler().beginRequest(with: context)
        XCTAssertEqual(context.completions, 1, file: file, line: line)
        XCTAssertEqual(context.returned?.count, 0, file: file, line: line)
        XCTAssertEqual(context.reads, 0, file: file, line: line)
    }
    func testJsonDictionaryIsNotReadOrEchoed() throws {
        let data = Data("{\"rawText\":\"SYNTHETIC_PRIVATE_SENTINEL\",\"nested\":{\"token\":\"SYNTHETIC_ONLY\"}}".utf8)
        try assertIgnored(try JSONSerialization.jsonObject(with: data))
    }
    func testEmptyContextCompletesOnce() throws { try assertIgnored(nil) }
    func testStringMessageIsNotReadOrEchoed() throws { try assertIgnored("SYNTHETIC_PRIVATE_SENTINEL") }
    func testArrayMessageIsNotReadOrEchoed() throws { try assertIgnored(["SYNTHETIC_PRIVATE_SENTINEL", 1]) }
}
