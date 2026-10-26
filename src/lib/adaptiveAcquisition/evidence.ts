import { createHash } from 'node:crypto';

export const MAX_CAPTURE_BYTES = 5_000_000;
export type CaptureTransport = 'direct' | 'http2' | 'rendered' | 'wayback' | 'commoncrawl';
export type CaptureBodyKind = 'response_html' | 'rendered_dom' | 'decoded_document_html';
export interface CaptureInput {
  requestedUrl: string;
  finalUrl: string;
  transport: CaptureTransport;
  httpStatus: number;
  transportOk: boolean;
  capturedAt: string;
  archiveTimestamp?: string;
  html: string;
  /** Decoded document input can contain PDF-derived inert HTML, not original wire bytes. */
  bodyKind?: CaptureBodyKind;
}
export interface RawCapture extends CaptureInput {
  schemaVersion: 1;
  bodyKind: CaptureBodyKind;
  htmlSha256: string;
  captureId: string;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter((key) => object[key] !== undefined).sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
  }
  if (value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error('non_json_evidence');
  }
  return JSON.stringify(value);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
export function digest(value: unknown): string { return sha256(canonicalJson(value)); }

export function createCapture(input: CaptureInput): RawCapture {
  if (typeof input.html !== 'string' || Buffer.byteLength(input.html, 'utf8') > MAX_CAPTURE_BYTES) {
    throw new Error('capture_body_limit');
  }
  for (const value of [input.requestedUrl, input.finalUrl]) {
    const url = new URL(value);
    if (!['http:', 'https:', 'commoncrawl:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('invalid_capture_url');
    }
  }
  if (!Number.isFinite(Date.parse(input.capturedAt)) || !Number.isInteger(input.httpStatus)
    || input.httpStatus < 0 || input.httpStatus > 599 || typeof input.transportOk !== 'boolean'
    || !['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'].includes(input.transport)
    || (input.bodyKind !== undefined && !['response_html', 'rendered_dom', 'decoded_document_html'].includes(input.bodyKind))) {
    throw new Error('invalid_capture_metadata');
  }
  const body = {
    schemaVersion: 1 as const, requestedUrl: input.requestedUrl, finalUrl: input.finalUrl,
    transport: input.transport, httpStatus: input.httpStatus, transportOk: input.transportOk,
    capturedAt: input.capturedAt, ...(input.archiveTimestamp ? { archiveTimestamp: input.archiveTimestamp } : {}),
    bodyKind: input.bodyKind ?? (input.transport === 'rendered' ? 'rendered_dom' as const : 'response_html' as const),
    html: input.html, htmlSha256: sha256(input.html),
  };
  return { ...body, captureId: digest(body) };
}

export function verifyCapture(capture: RawCapture): void {
  const rebuilt = createCapture(capture);
  if (canonicalJson(rebuilt) !== canonicalJson(capture)) throw new Error('capture_integrity_mismatch');
}
