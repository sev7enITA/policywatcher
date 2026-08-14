import { describe, expect, it } from 'vitest';
import {
  MAX_RENDERER_PACKAGE_BYTES,
  inferRendererVersionFromFilename,
  isValidRendererPackageFilename,
  isValidRendererPackageSha256,
  isValidRendererVersion,
} from '../vpsPackageContract';

describe('VPS renderer package contract', () => {
  it('accepts bounded release metadata and supported package names', () => {
    expect(isValidRendererVersion('1.2.0')).toBe(true);
    expect(isValidRendererPackageSha256('a'.repeat(64))).toBe(true);
    expect(isValidRendererPackageFilename('PolicyWatcher-renderer-1.2.0-vps-2026-08-02.zip')).toBe(true);
    expect(MAX_RENDERER_PACKAGE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('rejects traversal, unsupported types and malformed checksums', () => {
    expect(isValidRendererPackageFilename('../renderer.zip')).toBe(false);
    expect(isValidRendererPackageFilename('renderer-1.2.0.tar.gz')).toBe(false);
    expect(isValidRendererPackageFilename('renderer.exe')).toBe(false);
    expect(isValidRendererPackageFilename('.renderer.zip')).toBe(false);
    expect(isValidRendererPackageSha256('a'.repeat(63))).toBe(false);
    expect(isValidRendererVersion('../../renderer')).toBe(false);
  });

  it('infers only a valid renderer release version from the canonical filename', () => {
    expect(inferRendererVersionFromFilename('PolicyWatcher-renderer-1.2.0-vps-2026-08-02.zip')).toBe('1.2.0');
    expect(inferRendererVersionFromFilename('renderer-1.2.0.zip')).toBeNull();
  });
});
