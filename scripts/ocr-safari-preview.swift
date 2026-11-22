import Foundation
import Vision

// Local diagnostic OCR of the test simulator image; no GUI, remote model or upload.
guard CommandLine.arguments.count == 2 else { exit(2) }
let request = VNRecognizeTextRequest()
request.recognitionLevel = .fast
request.usesCPUOnly = true
request.usesLanguageCorrection = false
request.recognitionLanguages = ["en-US"]
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]), options: [:])
do {
    try handler.perform([request])
    let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
    let data = try JSONSerialization.data(withJSONObject: ["lines": lines], options: [.sortedKeys])
    print(String(decoding: data, as: UTF8.self))
} catch { fputs("Local screenshot OCR failed\n", stderr); exit(1) }
