#!/usr/bin/env python3
"""Loopback-only Sentence Transformers adapter for the PolicyWatcher bake-off."""

from __future__ import annotations

import argparse
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

MAX_REQUEST_BYTES = 1_000_000
MAX_TEXTS = 64
MAX_TOTAL_CHARS = 250_000


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--embedding-model", required=True)
    parser.add_argument("--reranker-model")
    parser.add_argument("--device", default="cpu")
    return parser.parse_args()


def require_texts(value: Any) -> list[str]:
    if not isinstance(value, list) or not 1 <= len(value) <= MAX_TEXTS:
        raise ValueError("texts must be a bounded non-empty string array")
    if any(not isinstance(item, str) for item in value):
        raise ValueError("texts must contain strings only")
    if sum(len(item) for item in value) > MAX_TOTAL_CHARS:
        raise ValueError("text payload exceeds the evaluation limit")
    return value


def main() -> None:
    arguments = parse_arguments()

    from sentence_transformers import CrossEncoder, SentenceTransformer

    embedding_model = SentenceTransformer(arguments.embedding_model, device=arguments.device)
    reranker_model = (
        CrossEncoder(arguments.reranker_model, device=arguments.device)
        if arguments.reranker_model
        else None
    )
    inference_lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        server_version = "PolicyWatcherEvaluationAdapter/1"

        def send_json(self, status: int, payload: dict[str, Any]) -> None:
            encoded = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(encoded)

        def do_GET(self) -> None:  # noqa: N802
            if self.path != "/healthz":
                self.send_json(404, {"error": "not_found"})
                return
            self.send_json(200, {
                "status": "ready",
                "embeddingModel": arguments.embedding_model,
                "rerankerModel": arguments.reranker_model,
                "device": arguments.device,
            })

        def do_POST(self) -> None:  # noqa: N802
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
                    raise ValueError("request body exceeds the adapter limit")
                payload = json.loads(self.rfile.read(content_length))
                if not isinstance(payload, dict):
                    raise ValueError("request body must be an object")

                if self.path == "/embed":
                    if payload.get("model") != arguments.embedding_model:
                        raise ValueError("embedding model does not match the configured model")
                    texts = require_texts(payload.get("texts"))
                    with inference_lock:
                        embeddings = embedding_model.encode(
                            texts,
                            normalize_embeddings=True,
                            convert_to_numpy=True,
                            show_progress_bar=False,
                        )
                    self.send_json(200, {"embeddings": embeddings.tolist()})
                    return

                if self.path == "/rerank":
                    if reranker_model is None or payload.get("model") != arguments.reranker_model:
                        raise ValueError("reranker model does not match the configured model")
                    query = payload.get("query")
                    documents = require_texts(payload.get("documents"))
                    if not isinstance(query, str) or len(query) + sum(map(len, documents)) > MAX_TOTAL_CHARS:
                        raise ValueError("query exceeds the evaluation limit")
                    with inference_lock:
                        scores = reranker_model.predict(
                            [(query, document) for document in documents],
                            convert_to_numpy=True,
                            show_progress_bar=False,
                        )
                    flattened = scores.reshape(-1).tolist()
                    ranked = sorted(
                        ({"index": index, "score": float(score)} for index, score in enumerate(flattened)),
                        key=lambda item: (-item["score"], item["index"]),
                    )
                    self.send_json(200, {"results": ranked})
                    return

                self.send_json(404, {"error": "not_found"})
            except (ValueError, TypeError, json.JSONDecodeError):
                self.send_json(400, {"error": "invalid_request"})
            except Exception as error:  # pragma: no cover - runtime model boundary
                self.send_json(500, {"error": type(error).__name__})

        def log_message(self, format: str, *args: Any) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", arguments.port), Handler)
    print(json.dumps({
        "status": "ready",
        "url": f"http://127.0.0.1:{arguments.port}",
        "embeddingModel": arguments.embedding_model,
        "rerankerModel": arguments.reranker_model,
        "device": arguments.device,
    }))
    server.serve_forever()


if __name__ == "__main__":
    main()
