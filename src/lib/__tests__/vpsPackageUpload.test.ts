import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { validateRendererPackageUpload } from '../vpsPackageUpload';

function upload(overrides: Record<string, unknown> = {}) {
  const content = Buffer.from('renderer-package');
  return {
    version: '1.2.0',
    filename: 'PolicyWatcher-renderer-1.2.0-vps-2026-08-02.zip',
    sha256: createHash('sha256').update(content).digest('hex'),
    contentBase64: content.toString('base64'),
    ...overrides,
  };
}

describe('Renderer package upload validation', () => {
  it('returns normalized metadata without echoing decoded bytes', () => {
    expect(validateRendererPackageUpload(upload())).toMatchObject({
      ok: true,
      version: '1.2.0',
      bytes: Buffer.byteLength('renderer-package'),
    });
  });

  it('rejects a checksum mismatch and malformed base64', () => {
    expect(validateRendererPackageUpload(upload({ sha256: '0'.repeat(64) }))).toMatchObject({
      ok: false,
      error: expect.stringContaining('checksum'),
    });
    expect(validateRendererPackageUpload(upload({ contentBase64: 'not base64' }))).toMatchObject({
      ok: false,
      error: expect.stringContaining('encoding'),
    });
  });
});
