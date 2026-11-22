// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "PolicyWatcherNative",
    platforms: [.macOS(.v13)],
    products: [.library(name: "PolicyWatcherNative", targets: ["PolicyWatcherNative"])],
    targets: [
        .target(name: "PolicyWatcherNative", path: "native", exclude: ["ViewController.swift"]),
        .testTarget(name: "PolicyWatcherNativeTests", dependencies: ["PolicyWatcherNative"], path: "tests/native"),
    ]
)
