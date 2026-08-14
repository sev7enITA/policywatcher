import { createHash } from 'crypto';
import {
  MAX_RENDERER_PACKAGE_BYTES,
  isValidRendererPackageFilename,
  isValidRendererPackageSha256,
  isValidRendererVersion,
} from './vpsPackageContract';

export interface RendererPackageUploadInput {
  version?: unknown;
  filename?: unknown;
  sha256?: unknown;
  contentBase64?: unknown;
}

export type RendererPackageUploadValidation =
  | { ok: true; version: string; filename: string; sha256: string; contentBase64: string; bytes: number }
  | { ok: false; error: string };

export function validateRendererPackageUpload(
  input: RendererPackageUploadInput,
): RendererPackageUploadValidation {
  if (!isValidRendererVersion(input.version)) return { ok: false, error: 'Invalid Renderer package version.' };
  if (!isValidRendererPackageFilename(input.filename)) return { ok: false, error: 'Invalid Renderer package filename.' };
  if (!isValidRendererPackageSha256(input.sha256)) return { ok: false, error: 'Invalid Renderer package SHA256.' };
  if (typeof input.contentBase64 !== 'string' || input.contentBase64.length === 0) {
    return { ok: false, error: 'Renderer package content is required.' };
  }
  if (input.contentBase64.length > Math.ceil(MAX_RENDERER_PACKAGE_BYTES / 3) * 4 + 4) {
    return { ok: false, error: 'Renderer package exceeds the 5 MiB limit.' };
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.contentBase64)) {
    return { ok: false, error: 'Renderer package encoding is invalid.' };
  }

  const content = Buffer.from(input.contentBase64, 'base64');
  if (content.length === 0 || content.length > MAX_RENDERER_PACKAGE_BYTES) {
    return { ok: false, error: 'Renderer package is empty or exceeds the 5 MiB limit.' };
  }
  if (content.toString('base64') !== input.contentBase64) {
    return { ok: false, error: 'Renderer package encoding is not canonical.' };
  }
  const actualSha256 = createHash('sha256').update(content).digest('hex');
  if (actualSha256 !== input.sha256.toLowerCase()) {
    return { ok: false, error: 'Renderer package checksum does not match the uploaded bytes.' };
  }

  return {
    ok: true,
    version: input.version,
    filename: input.filename,
    sha256: actualSha256,
    contentBase64: input.contentBase64,
    bytes: content.length,
  };
}
