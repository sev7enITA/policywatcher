/** Parse an HTTP request body without turning malformed JSON into a 500. */
export async function readJsonObject(
  request: { json(): Promise<unknown> }
): Promise<Record<string, unknown> | null> {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export type BoundedJsonObjectResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'body_too_large' | 'invalid_json' };

/**
 * Read and parse a JSON object while enforcing the byte limit during streaming.
 * The declared Content-Length is only an early rejection hint; the observed
 * bytes remain authoritative because clients can omit or forge that header.
 */
export async function readBoundedJsonObject(
  request: {
    headers: { get(name: string): string | null };
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number,
): Promise<BoundedJsonObjectResult> {
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: 'body_too_large' };
  }

  if (!request.body) return { ok: false, reason: 'invalid_json' };

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let observedBytes = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      observedBytes += value.byteLength;
      if (observedBytes > maxBytes) {
        await reader.cancel('request_body_too_large').catch(() => undefined);
        return { ok: false, reason: 'body_too_large' };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return { ok: false, reason: 'invalid_json' };
  } finally {
    reader.releaseLock();
  }

  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, reason: 'invalid_json' };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
}
