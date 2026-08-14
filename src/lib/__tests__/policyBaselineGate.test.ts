import { describe, expect, it, vi } from 'vitest';
import { establishVerifiedPolicyBaseline } from '../policyBaseline';

describe('verified public baseline gate', () => {
  it('promotes a matching non-public snapshot after a successful source retrieval', async () => {
    const matchingSnapshot = {
      id: 'snapshot-1',
      policyId: 'policy-1',
      version: 2,
      text: 'verified policy text',
      hash: 'verified-hash',
      publicEvidence: false,
      createdAt: new Date('2026-07-20T00:00:00Z'),
    };
    const promotedSnapshot = { ...matchingSnapshot, publicEvidence: true };
    const updatedPolicy = { id: 'policy-1', currentHash: 'verified-hash', dataStatus: 'Available' };
    const tx = {
      sourceOnboardingItem: { findFirst: vi.fn().mockResolvedValue(null), updateMany: vi.fn() },
      policySnapshot: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(matchingSnapshot),
        update: vi.fn().mockResolvedValue(promotedSnapshot),
        create: vi.fn(),
      },
      policy: { update: vi.fn().mockResolvedValue(updatedPolicy) },
      policyCheckLog: { create: vi.fn().mockResolvedValue({ id: 'log-1' }) },
      adminReviewLog: { create: vi.fn().mockResolvedValue({ id: 'review-1' }) },
    };

    const result = await establishVerifiedPolicyBaseline(tx as never, {
      policyId: 'policy-1',
      text: 'verified policy text',
      hash: 'verified-hash',
      checkedAt: new Date('2026-07-30T00:00:00Z'),
      ingestionMethod: 'Direct Scrape',
      source: 'direct',
      httpStatus: 200,
      finalUrl: 'https://example.com/privacy',
    });

    expect(result).toMatchObject({ publicEvidence: true, promotedExistingSnapshot: true });
    expect(tx.policySnapshot.update).toHaveBeenCalledWith({
      where: { id: 'snapshot-1' },
      data: { publicEvidence: true },
    });
    expect(tx.policyCheckLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'Available',
        reason: 'verified_public_baseline_established',
        reasonCode: 'verified',
      }),
    }));
  });

  it('keeps onboarding baselines private pending explicit QA', async () => {
    const tx = {
      sourceOnboardingItem: {
        findFirst: vi.fn().mockResolvedValue({ id: 'item-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      policySnapshot: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ version: 2 }),
        create: vi.fn().mockResolvedValue({ id: 'snapshot-3', publicEvidence: false }),
      },
      policy: { update: vi.fn().mockResolvedValue({ id: 'policy-1', dataStatus: 'Needs Review' }) },
      policyCheckLog: { create: vi.fn().mockResolvedValue({ id: 'log-1' }) },
      adminReviewLog: { create: vi.fn().mockResolvedValue({ id: 'review-1' }) },
    };

    const result = await establishVerifiedPolicyBaseline(tx as never, {
      policyId: 'policy-1',
      text: 'verified policy text',
      hash: 'new-hash',
      checkedAt: new Date('2026-07-30T00:00:00Z'),
      ingestionMethod: 'VPS Renderer',
      source: 'rendered',
      finalUrl: 'https://example.com/privacy',
    });

    expect(result.publicEvidence).toBe(false);
    expect(tx.policySnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ publicEvidence: false }),
    });
    expect(tx.policy.update).toHaveBeenCalledWith({
      where: { id: 'policy-1' },
      data: expect.objectContaining({ dataStatus: 'Needs Review' }),
    });
  });
});
