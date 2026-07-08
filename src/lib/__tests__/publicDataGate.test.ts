import { afterEach, describe, expect, it, vi } from 'vitest';
import { allowSeededPublicData, publicChangeWhere, publicPolicyWhere } from '../publicDataGate';

describe('publicDataGate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('never allows seeded public data in production even if the env flag is set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_SEEDED_PUBLIC_DATA', 'true');

    expect(allowSeededPublicData()).toBe(false);
    expect(publicChangeWhere({ id: 'change-1' })).toMatchObject({
      id: 'change-1',
      publicEvidence: true,
      policy: {
        ingestionMethod: { not: 'Seeded' },
      },
    });
    expect(publicPolicyWhere({ id: 'policy-1' })).toMatchObject({
      id: 'policy-1',
      snapshots: { some: { publicEvidence: true } },
    });
  });

  it('allows the seeded override only outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ALLOW_SEEDED_PUBLIC_DATA', 'true');

    expect(allowSeededPublicData()).toBe(true);
    expect(publicChangeWhere({ id: 'change-1' })).toEqual({ id: 'change-1' });
  });
});
