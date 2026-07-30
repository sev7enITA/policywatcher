import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import {
  createConfiguredPolicy,
  normalizeConfiguredPolicyInput,
} from '../configuredPolicy';

describe('normalizeConfiguredPolicyInput', () => {
  it('normalizes a valid initial policy source', () => {
    expect(
      normalizeConfiguredPolicyInput({
        name: ' Privacy Policy ',
        type: ' PRIVACY ',
        url: ' https://example.com/privacy ',
        jurisdiction: ' EU ',
      })
    ).toEqual({
      ok: true,
      value: {
        name: 'Privacy Policy',
        type: 'privacy',
        url: 'https://example.com/privacy',
        jurisdiction: 'EU',
      },
    });
  });

  it('defaults the jurisdiction to Global', () => {
    const result = normalizeConfiguredPolicyInput({
      name: 'Terms of Service',
      type: 'terms',
      url: 'https://example.com/terms',
    });

    expect(result).toMatchObject({ ok: true, value: { jurisdiction: 'Global' } });
  });

  it('accepts a separate official retrieval URL without changing the canonical URL', () => {
    expect(normalizeConfiguredPolicyInput({
      name: 'Privacy Policy',
      type: 'privacy',
      url: 'https://example.com/privacy',
      retrievalUrl: ' https://cdn.example.com/privacy.pdf ',
      jurisdiction: 'EU',
    })).toEqual({
      ok: true,
      value: {
        name: 'Privacy Policy',
        type: 'privacy',
        url: 'https://example.com/privacy',
        retrievalUrl: 'https://cdn.example.com/privacy.pdf',
        jurisdiction: 'EU',
      },
    });
    expect(normalizeConfiguredPolicyInput({
      name: 'Privacy Policy',
      type: 'privacy',
      url: 'https://example.com/privacy',
      retrievalUrl: 'https://user:secret@example.com/privacy',
    })).toEqual({
      ok: false,
      error: 'Retrieval URL must be a credential-free HTTP or HTTPS URL.',
    });
  });

  it('rejects missing and non-HTTP policy sources', () => {
    expect(normalizeConfiguredPolicyInput(undefined)).toEqual({
      ok: false,
      error: 'An initial policy source is required.',
    });
    expect(
      normalizeConfiguredPolicyInput({
        name: 'Privacy Policy',
        type: 'privacy',
        url: 'javascript:alert(1)',
      })
    ).toEqual({ ok: false, error: 'Policy URL must use HTTP or HTTPS.' });
  });

  it('creates a pending source that the scan queue treats as never checked', async () => {
    const policyCreate = vi.fn().mockResolvedValue({ id: 'policy-1' });
    const logCreate = vi.fn().mockResolvedValue({ id: 'log-1' });
    const tx = {
      policy: { create: policyCreate },
      policyCheckLog: { create: logCreate },
    };

    await createConfiguredPolicy(tx as never, {
      companyId: 'company-1',
      name: 'Privacy Policy',
      type: 'privacy',
      url: 'https://example.com/privacy',
      jurisdiction: 'Global',
    });

    const policyData = policyCreate.mock.calls[0][0].data;
    expect(policyData.dataStatus).toBe('Configured');
    expect(policyData.lastCheckDate.getTime()).toBe(0);
    expect(policyData.lastSuccessfulCheckDate.getTime()).toBe(0);
    expect(logCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        policyId: 'policy-1',
        status: 'Configured',
        reason: 'admin_policy_created_pending_first_verified_scan',
      }),
    });
  });
});
