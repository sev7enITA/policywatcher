import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { dualWriteCanonicalPolicyGraph } from '@/lib/documentEvidenceSync';

export interface ConfiguredPolicyInput {
  companyId: string;
  name: string;
  type: string;
  url: string;
  retrievalUrl?: string | null;
  jurisdiction: string;
}

export type ConfiguredPolicyValidation =
  | { ok: true; value: Omit<ConfiguredPolicyInput, 'companyId'> }
  | { ok: false; error: string };

function normalizedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeConfiguredPolicyInput(input: unknown): ConfiguredPolicyValidation {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'An initial policy source is required.' };
  }

  const source = input as Record<string, unknown>;
  const name = normalizedString(source.name);
  const type = normalizedString(source.type).toLowerCase();
  const url = normalizedString(source.url);
  const retrievalUrl = normalizedString(source.retrievalUrl);
  const jurisdiction = normalizedString(source.jurisdiction) || 'Global';

  if (!name || !type || !url) {
    return { ok: false, error: 'Policy name, type, and URL are required.' };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, error: 'Policy URL must use HTTP or HTTPS.' };
    }
  } catch {
    return { ok: false, error: 'Policy URL must be a valid absolute URL.' };
  }

  if (retrievalUrl) {
    try {
      const parsed = new URL(retrievalUrl);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
        return { ok: false, error: 'Retrieval URL must be a credential-free HTTP or HTTPS URL.' };
      }
    } catch {
      return { ok: false, error: 'Retrieval URL must be a valid absolute URL.' };
    }
  }

  return {
    ok: true,
    value: { name, type, url, jurisdiction, ...(retrievalUrl ? { retrievalUrl } : {}) },
  };
}

export async function createConfiguredPolicy(
  tx: Prisma.TransactionClient,
  input: ConfiguredPolicyInput
) {
  const initialHash = createHash('sha256').update('').digest('hex');
  const configuredAt = new Date();
  // Policy.lastCheckDate is non-null in the current schema. The epoch is the
  // explicit "never scanned" sentinel, ensuring configured sources are picked
  // before already-checked rows by the least-recently-checked cron queue.
  const neverScannedAt = new Date(0);
  const policy = await tx.policy.create({
    data: {
      ...input,
      currentText: '',
      currentHash: initialHash,
      dataStatus: 'Configured',
      ingestionMethod: 'Seeded',
      lastCheckDate: neverScannedAt,
      lastSuccessfulCheckDate: neverScannedAt,
    },
  });

  await tx.policyCheckLog.create({
    data: {
      policyId: policy.id,
      status: 'Configured',
      checkedAt: configuredAt,
      source: 'seeded',
      reason: 'admin_policy_created_pending_first_verified_scan',
      finalUrl: input.retrievalUrl || input.url,
      textHash: initialHash,
      textLength: 0,
    },
  });

  await dualWriteCanonicalPolicyGraph(tx, policy.id);

  return policy;
}
