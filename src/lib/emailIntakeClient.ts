import {
  POLICY_INQUIRY_MAX_LOCAL_INPUT_BYTES,
  parsePolicyInquiryLocally,
  type LocalPolicyInquiryClues,
} from './policyInquiryClient';

export const LOCAL_EMAIL_MAX_FILE_BYTES = 256 * 1024;

const MAX_MIME_DEPTH = 6;
const MAX_MIME_PARTS = 32;

type BodyFormat = 'plain' | 'html';

interface ExtractedBody {
  format: BodyFormat;
  text: string;
}

interface MimeContext {
  parts: number;
  ignoredAttachments: number;
}

export interface LocalEmailIntakeResult {
  visibleText: string;
  clues: LocalPolicyInquiryClues;
  ignoredAttachments: number;
  bodyFormat: BodyFormat;
}

function splitEntity(raw: string): { headerBlock: string; body: string } {
  const separator = raw.search(/\r?\n\r?\n/);
  if (separator < 0) return { headerBlock: raw, body: '' };
  const separatorLength = raw.slice(separator).startsWith('\r\n\r\n') ? 4 : 2;
  return {
    headerBlock: raw.slice(0, separator),
    body: raw.slice(separator + separatorLength),
  };
}

function decodeBase64(value: string): Uint8Array {
  const compact = value.replace(/\s+/g, '');
  if (!compact || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
    throw new Error('INVALID_EMAIL_FILE');
  }
  try {
    const binary = atob(compact);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error('INVALID_EMAIL_FILE');
  }
}

function decodeQuotedPrintable(value: string): Uint8Array {
  const unfolded = value.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let index = 0; index < unfolded.length; index += 1) {
    if (unfolded[index] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(unfolded.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }
    const code = unfolded.charCodeAt(index);
    if (code <= 0xff) bytes.push(code);
    else bytes.push(...new TextEncoder().encode(unfolded[index]));
  }
  return Uint8Array.from(bytes);
}

function decodeBytes(bytes: Uint8Array, charset = 'utf-8'): string {
  const normalized = charset.trim().replace(/^['"]|['"]$/g, '').toLowerCase() || 'utf-8';
  try {
    return new TextDecoder(normalized, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}

function decodeBody(body: string, transferEncoding: string, charset: string): string {
  if (transferEncoding === 'base64') return decodeBytes(decodeBase64(body), charset);
  if (transferEncoding === 'quoted-printable') return decodeBytes(decodeQuotedPrintable(body), charset);
  return body;
}

function decodeEncodedWords(value: string): string {
  return value.replace(/=\?([^?\s]+)\?([bBqQ])\?([^?]*)\?=/g, (_, charset: string, encoding: string, encoded: string) => {
    try {
      const bytes = encoding.toLowerCase() === 'b'
        ? decodeBase64(encoded)
        : decodeQuotedPrintable(encoded.replace(/_/g, ' '));
      return decodeBytes(bytes, charset);
    } catch {
      return '';
    }
  });
}

function parseHeaders(block: string): Map<string, string> {
  const headers = new Map<string, string>();
  const unfolded = block.replace(/\r?\n[\t ]+/g, ' ');
  for (const line of unfolded.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = decodeEncodedWords(line.slice(separator + 1).trim()).slice(0, 2_000);
    if (!headers.has(name)) headers.set(name, value);
  }
  return headers;
}

function parseHeaderParameters(value: string): { value: string; parameters: Map<string, string> } {
  const segments = value.split(';');
  const parameters = new Map<string, string>();
  for (const segment of segments.slice(1)) {
    const separator = segment.indexOf('=');
    if (separator <= 0) continue;
    const key = segment.slice(0, separator).trim().toLowerCase();
    const parameterValue = segment.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    parameters.set(key, parameterValue);
  }
  return { value: segments[0].trim().toLowerCase(), parameters };
}

function splitMultipart(body: string, boundary: string): string[] {
  if (!boundary || boundary.length > 200 || /[\r\n]/.test(boundary)) throw new Error('INVALID_EMAIL_FILE');
  const delimiter = `--${boundary}`;
  const closing = `${delimiter}--`;
  const parts: string[] = [];
  let current: string[] | null = null;

  for (const line of body.split(/\r?\n/)) {
    if (line === delimiter || line === closing) {
      if (current) parts.push(current.join('\r\n'));
      current = line === closing ? null : [];
      if (line === closing) break;
      continue;
    }
    if (current) current.push(line);
  }
  return parts;
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_entity, token: string) => {
    if (token[0] !== '#') return named[token.toLowerCase()] || ' ';
    const hexadecimal = token[1]?.toLowerCase() === 'x';
    const point = Number.parseInt(token.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isInteger(point) && point > 0 && point <= 0x10ffff
      ? String.fromCodePoint(point)
      : ' ';
  });
}

function htmlToVisibleText(html: string): string {
  const withoutActiveContent = html
    .replace(/<(script|style|svg|canvas|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ');
  const withLinks = withoutActiveContent.replace(
    /<a\b[^>]*\bhref\s*=\s*(['"])(https?:\/\/[^'"<>\s]+)\1[^>]*>([\s\S]*?)<\/a\s*>/gi,
    (_, _quote: string, href: string, label: string) => `${label} ${href}`,
  );
  return decodeHtmlEntities(
    withLinks
      .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBodies(raw: string, context: MimeContext, depth = 0): ExtractedBody[] {
  if (depth > MAX_MIME_DEPTH) throw new Error('INVALID_EMAIL_FILE');
  context.parts += 1;
  if (context.parts > MAX_MIME_PARTS) throw new Error('INVALID_EMAIL_FILE');

  const { headerBlock, body } = splitEntity(raw);
  const headers = parseHeaders(headerBlock);
  const contentType = parseHeaderParameters(headers.get('content-type') || 'text/plain; charset=utf-8');
  const disposition = parseHeaderParameters(headers.get('content-disposition') || 'inline');
  const hasAttachmentParameter = [...disposition.parameters.keys()]
    .some((key) => key === 'filename' || key.startsWith('filename*'));
  const hasNamedContentParameter = [...contentType.parameters.keys()]
    .some((key) => key === 'name' || key.startsWith('name*'));
  const isAttachment = disposition.value === 'attachment'
    || hasAttachmentParameter
    || hasNamedContentParameter;
  if (isAttachment) {
    context.ignoredAttachments += 1;
    return [];
  }

  if (contentType.value.startsWith('multipart/')) {
    const boundary = contentType.parameters.get('boundary') || '';
    const parts = splitMultipart(body, boundary);
    if (!parts.length) throw new Error('INVALID_EMAIL_FILE');
    const extracted = parts.flatMap((part) => extractBodies(part, context, depth + 1));
    if (contentType.value === 'multipart/alternative') {
      const plain = extracted.find((part) => part.format === 'plain' && part.text.trim());
      const html = extracted.find((part) => part.format === 'html' && part.text.trim());
      return plain ? [plain] : html ? [html] : [];
    }
    return extracted;
  }

  const transferEncoding = (headers.get('content-transfer-encoding') || '8bit').trim().toLowerCase();
  const charset = contentType.parameters.get('charset') || 'utf-8';
  if (contentType.value === 'message/rfc822') {
    return extractBodies(decodeBody(body, transferEncoding, charset), context, depth + 1);
  }
  if (contentType.value !== 'text/plain' && contentType.value !== 'text/html') return [];

  const decoded = decodeBody(body, transferEncoding, charset);
  return [{
    format: contentType.value === 'text/html' ? 'html' : 'plain',
    text: contentType.value === 'text/html' ? htmlToVisibleText(decoded) : decoded.trim(),
  }];
}

function safeHeaderLines(raw: string): string[] {
  const headers = parseHeaders(splitEntity(raw).headerBlock);
  return ['from', 'date', 'subject']
    .map((name) => headers.get(name) ? `${name[0].toUpperCase()}${name.slice(1)}: ${headers.get(name)}` : '')
    .filter(Boolean);
}

export function parseEmailFileLocally(bytes: Uint8Array): LocalEmailIntakeResult {
  if (!bytes.byteLength || bytes.byteLength > LOCAL_EMAIL_MAX_FILE_BYTES) {
    throw new Error('EMAIL_FILE_TOO_LARGE');
  }

  const raw = decodeBytes(bytes);
  const context: MimeContext = { parts: 0, ignoredAttachments: 0 };
  const bodies = extractBodies(raw, context).filter((part) => part.text.trim());
  if (!bodies.length) throw new Error('EMAIL_TEXT_UNAVAILABLE');

  const headerLines = safeHeaderLines(raw);
  const visibleText = [...headerLines, ...bodies.map((part) => part.text)]
    .join('\n\n')
    .trim();
  if (new TextEncoder().encode(visibleText).byteLength > POLICY_INQUIRY_MAX_LOCAL_INPUT_BYTES) {
    throw new Error('EMAIL_TEXT_TOO_LARGE');
  }

  return {
    visibleText,
    clues: parsePolicyInquiryLocally(visibleText),
    ignoredAttachments: context.ignoredAttachments,
    bodyFormat: bodies.some((part) => part.format === 'plain') ? 'plain' : 'html',
  };
}
