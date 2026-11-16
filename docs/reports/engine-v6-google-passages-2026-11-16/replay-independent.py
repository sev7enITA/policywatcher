"""Replay the archived reference offsets and passage hashes using Python 3.10+."""
import gzip
import hashlib
import json
from pathlib import Path
import struct


def pack_tokens(tokens):
    return struct.pack(f">{len(tokens)}I", *tokens)


def first_token_offset(stream, tokens):
    pattern = pack_tokens(tokens)
    byte_offset = stream.find(pattern)
    while byte_offset >= 0 and byte_offset % 4:
        byte_offset = stream.find(pattern, byte_offset + 1)
    return byte_offset // 4 if byte_offset >= 0 else -1


def check(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    directory = Path(__file__).resolve().parent
    raw = (directory / "passages.json.gz").read_bytes()
    manifest = json.loads((directory / "manifest.json").read_bytes())
    check(hashlib.sha256(raw).hexdigest() == manifest["sha256"], "Archive digest mismatch")
    sources = json.loads(gzip.decompress(raw))["sources"]
    counts = []
    for source, expected in zip(sources, manifest["sources"], strict=True):
        bundle = source["bundle"]
        stream = pack_tokens(bundle["stream"])
        matched = 0
        for reference in bundle["references"]:
            tokens = reference["tokens"]
            offset = first_token_offset(stream, tokens)
            words = "".join(bundle["vocabulary"][token] for token in tokens)
            check(offset == reference["offset"], f"Offset mismatch: {reference['locator']}")
            check(hashlib.sha256(words.encode()).hexdigest() == reference["sha256"],
                  f"Passage digest mismatch: {reference['locator']}")
            matched += offset >= 0
        total = len(bundle["references"])
        check((source["id"], total, matched) ==
              (expected["id"], expected["references"], expected["matches"]),
              f"Source count mismatch: {source['id']}")
        counts.append((source["id"], total, matched))
    references = sum(row[1] for row in counts)
    matched = sum(row[2] for row in counts)
    print(json.dumps({
        "method": "Python stdlib; big-endian aligned token search and independent SHA-256 verification",
        "sources": counts, "references": references, "matched": matched, "missing": references - matched,
    }))


if __name__ == "__main__":
    main()
