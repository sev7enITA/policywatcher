import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';

type DiscoveryJobClient = Pick<PrismaClient, 'policyDiscoveryJob'> | Pick<Prisma.TransactionClient, 'policyDiscoveryJob'>;

export interface DiscoveryJobState {
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  candidateCount: number;
  error: string | null;
}

type DiscoveryJobRecord = {
  id: string;
  companyId: string;
  runToken: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  candidateCount: number;
  error: string | null;
};

const DEFAULT_STALE_AFTER_MS = 10 * 60 * 1000;

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

export function serializeDiscoveryJob(job: DiscoveryJobRecord | null): DiscoveryJobState | null {
  if (!job) return null;
  const status = job.status === 'completed' || job.status === 'failed' ? job.status : 'running';
  return {
    status,
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    candidateCount: job.candidateCount,
    error: job.error,
  };
}

export async function readDiscoveryJob(client: DiscoveryJobClient, companyId: string) {
  const job = await client.policyDiscoveryJob.findUnique({ where: { companyId } });
  return serializeDiscoveryJob(job);
}

export async function claimDiscoveryJob(
  client: DiscoveryJobClient,
  companyId: string,
  options: { now?: Date; runToken?: string; staleAfterMs?: number } = {}
): Promise<{ claimed: true; runToken: string; job: DiscoveryJobState } | { claimed: false; job: DiscoveryJobState | null }> {
  const now = options.now ?? new Date();
  const runToken = options.runToken ?? randomUUID();
  const staleBefore = new Date(now.getTime() - (options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS));
  const existing = await client.policyDiscoveryJob.findUnique({ where: { companyId } });

  if (!existing) {
    try {
      const created = await client.policyDiscoveryJob.create({
        data: {
          companyId,
          runToken,
          status: 'running',
          startedAt: now,
          completedAt: null,
          candidateCount: 0,
          error: null,
        },
      });
      return { claimed: true, runToken, job: serializeDiscoveryJob(created)! };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      return {
        claimed: false,
        job: await readDiscoveryJob(client, companyId),
      };
    }
  }

  if (existing.status === 'running' && existing.startedAt >= staleBefore) {
    return { claimed: false, job: serializeDiscoveryJob(existing) };
  }

  const claimed = await client.policyDiscoveryJob.updateMany({
    where: {
      id: existing.id,
      runToken: existing.runToken,
      status: existing.status,
    },
    data: {
      runToken,
      status: 'running',
      startedAt: now,
      completedAt: null,
      candidateCount: 0,
      error: null,
    },
  });
  if (claimed.count !== 1) {
    return {
      claimed: false,
      job: await readDiscoveryJob(client, companyId),
    };
  }

  return {
    claimed: true,
    runToken,
    job: {
      status: 'running',
      startedAt: now.toISOString(),
      completedAt: null,
      candidateCount: 0,
      error: null,
    },
  };
}

export async function completeDiscoveryJob(
  client: DiscoveryJobClient,
  companyId: string,
  runToken: string,
  candidateCount: number,
  completedAt = new Date()
) {
  return client.policyDiscoveryJob.updateMany({
    where: { companyId, runToken, status: 'running' },
    data: { status: 'completed', completedAt, candidateCount, error: null },
  });
}

export async function failDiscoveryJob(
  client: DiscoveryJobClient,
  companyId: string,
  runToken: string,
  error: string,
  completedAt = new Date()
) {
  return client.policyDiscoveryJob.updateMany({
    where: { companyId, runToken, status: 'running' },
    data: {
      status: 'failed',
      completedAt,
      candidateCount: 0,
      error: error.slice(0, 2_000),
    },
  });
}
