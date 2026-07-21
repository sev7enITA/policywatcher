import { describe, expect, it, vi } from 'vitest';
import { resolveBulkOnboardingCandidate } from '../sourceOnboardingCandidate';

const input = {
  companyId: 'company-1',
  companyName: 'Example',
  name: 'Privacy Policy',
  type: 'privacy',
  url: 'https://example.com/privacy',
  jurisdiction: 'Global',
  batchId: 'batch-1',
  rowNumber: 2,
  actorRole: 'admin',
};

function clientFor(existing: Record<string, unknown> | null) {
  const updated = { id: 'candidate-1', status: 'Proposed' };
  return {
    policyDiscoveryCandidate: {
      findUnique: vi.fn().mockResolvedValue(existing),
      create: vi.fn().mockResolvedValue(updated),
      update: vi.fn().mockResolvedValue(updated),
    },
    adminReviewLog: { create: vi.fn().mockResolvedValue({ id: 'log-1' }) },
  };
}

describe('bulk onboarding candidate reconciliation', () => {
  it('reuses an automatically discovered Proposed candidate', async () => {
    const client = clientFor({
      id: 'candidate-1',
      status: 'Proposed',
      reviewedAt: null,
      reviewedByRole: null,
      createdPolicyId: null,
      sourceOnboardingItems: [],
    });

    await resolveBulkOnboardingCandidate(client as never, input);

    expect(client.policyDiscoveryCandidate.create).not.toHaveBeenCalled();
    expect(client.policyDiscoveryCandidate.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'candidate-1' },
      data: expect.objectContaining({ status: 'Proposed', retrievalSource: 'operator-supplied' }),
    }));
    expect(client.adminReviewLog.create).not.toHaveBeenCalled();
  });

  it('reopens a Rejected candidate with an explicit audit record', async () => {
    const client = clientFor({
      id: 'candidate-1',
      status: 'Rejected',
      reviewedAt: new Date(),
      reviewedByRole: 'admin',
      createdPolicyId: null,
      sourceOnboardingItems: [],
    });

    await resolveBulkOnboardingCandidate(client as never, input);

    expect(client.policyDiscoveryCandidate.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'Proposed',
        reviewedAt: null,
        reviewedByRole: null,
      }),
    }));
    expect(client.adminReviewLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'policy_discovery_reopened_by_bulk_onboarding',
        oldValue: 'Rejected',
        newValue: 'Proposed',
      }),
    });
  });

  it('does not duplicate an active workflow or an approved candidate', async () => {
    const active = clientFor({
      id: 'candidate-1',
      status: 'Proposed',
      sourceOnboardingItems: [{ id: 'item-1' }],
    });
    await expect(resolveBulkOnboardingCandidate(active as never, input))
      .rejects.toThrow('active onboarding workflow');

    const approved = clientFor({
      id: 'candidate-1',
      status: 'Approved',
      sourceOnboardingItems: [],
    });
    await expect(resolveBulkOnboardingCandidate(approved as never, input))
      .rejects.toThrow('already approved');
  });
});
