import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function versionAtLeast(version: string, minimum: [number, number, number]): boolean {
  const parsed = version.split('.').map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < minimum.length; index += 1) {
    if ((parsed[index] || 0) > minimum[index]) return true;
    if ((parsed[index] || 0) < minimum[index]) return false;
  }
  return true;
}

describe('security-sensitive dependency locks', () => {
  it('keeps sharp outside the image processing advisory affected versions', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      overrides?: Record<string, string>;
    };
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string }>;
    };
    const sharpVersion = lock.packages['node_modules/sharp']?.version || '';

    expect(packageJson.overrides?.sharp).toBe('0.35.5');
    expect(sharpVersion).toBe('0.35.5');
    expect(versionAtLeast(sharpVersion, [0, 35, 4])).toBe(true);

    for (const [path, dependency] of Object.entries(lock.packages)) {
      if (!path.startsWith('node_modules/@img/sharp-') || !dependency.version) continue;
      expect(versionAtLeast(dependency.version, [0, 35, 4]), path).toBe(true);
    }
  });
});
