export const MAX_RENDERER_PACKAGE_BYTES = 5 * 1024 * 1024;
export const MAX_RENDERER_PACKAGE_REQUEST_BYTES = 7 * 1024 * 1024;

export const RENDERER_PACKAGE_EXTENSIONS = ['.zip'] as const;

export function isValidRendererVersion(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9A-Za-z._-]{1,64}$/.test(value);
}

export function isValidRendererPackageSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value);
}

export function isValidRendererPackageFilename(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 5 || value.length > 180) return false;
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]+$/.test(value)) return false;
  return RENDERER_PACKAGE_EXTENSIONS.some((extension) => value.endsWith(extension));
}

export function inferRendererVersionFromFilename(filename: string): string | null {
  const match = /^PolicyWatcher-renderer-(.+?)-vps(?:-|\.)/.exec(filename);
  const version = match?.[1] || null;
  return version && isValidRendererVersion(version) ? version : null;
}

export function formatRendererPackageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
