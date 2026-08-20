import type { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { verifyDocumentEvidenceActivation } from '../documentEvidenceReconciliation';

function activationClient(options: { canonicalBaselines?: number } = {}) {
  const canonicalBaselines = options.canonicalBaselines ?? 2;
  const count = (value: number) => vi.fn().mockResolvedValue(value);
  return {
    company: { count: count(2) },
    policy: { count: count(4) },
    policySnapshot: {
      count: vi.fn().mockImplementation((args?: unknown) => Promise.resolve(args ? 2 : 5)),
    },
    policyChange: { count: count(3) },
    entity: { count: count(2) },
    document: { count: count(4) },
    version: { count: count(5) },
    change: {
      count: vi.fn().mockImplementation((args?: { where?: { kind?: string } }) => {
        if (!args) return Promise.resolve(5);
        if (args.where?.kind === 'baseline') return Promise.resolve(canonicalBaselines);
        return Promise.resolve(3);
      }),
    },
    provision: { count: count(18) },
  };
}

describe('document evidence activation gate', () => {
  it('accepts a complete aggregate bridge without loading graph records or policy text', async () => {
    const client = activationClient();
    const report = await verifyDocumentEvidenceActivation(client as unknown as Prisma.TransactionClient);

    expect(report).toMatchObject({
      mode: 'aggregate-bridge-check',
      status: 'reconciled',
      legacy: { companies: 2, policies: 4, snapshots: 5, changes: 3 },
      expected: { entities: 2, documents: 4, versions: 5, changes: 5, provisions: 18 },
      errorCount: 0,
      warningCount: 0,
    });
    expect(JSON.stringify(client)).not.toContain('findMany');
  });

  it('blocks one missing baseline bridge with one bounded aggregate issue', async () => {
    const report = await verifyDocumentEvidenceActivation(
      activationClient({ canonicalBaselines: 1 }) as unknown as Prisma.TransactionClient,
    );

    expect(report.status).toBe('blocked');
    expect(report.errorCount).toBe(1);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'canonical_bridge_count_mismatch',
        detail: 'Expected 2 bridged baseline_change records, found 1.',
      }),
    ]);
  });
});
