import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type InquiryCreateArgs = Parameters<PrismaClient['policyInquiry']['create']>[0];
type InquiryRecord = Awaited<ReturnType<PrismaClient['policyInquiry']['create']>>;
type InquiryStore = Pick<PrismaClient, 'policyInquiry'>;
const MAX_WRITE_ATTEMPTS = 3;

function isActiveDedupeConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.includes('activeDedupeKey')
    : String(target || '').includes('activeDedupeKey');
}

function isTransientSqliteWriteContention(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  return ['P1008', 'P2034'].includes(String(value.code || ''))
    || /database is locked|sqlite_busy|operation timed out/i.test(String(value.message || ''));
}

function retryDelay(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
}

export async function createOrReuseActiveInquiry(
  store: InquiryStore,
  args: InquiryCreateArgs,
): Promise<{ inquiry: InquiryRecord; created: boolean }> {
  const activeDedupeKey = args.data.activeDedupeKey;
  if (typeof activeDedupeKey !== 'string' || !activeDedupeKey) {
    throw new Error('ACTIVE_DEDUPE_KEY_REQUIRED');
  }

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    try {
      return { inquiry: await store.policyInquiry.create(args), created: true };
    } catch (error) {
      if (isActiveDedupeConflict(error)) {
        const existing = await store.policyInquiry.findUnique({ where: { activeDedupeKey } });
        if (!existing) throw error;
        return { inquiry: existing, created: false };
      }
      if (!isTransientSqliteWriteContention(error) || attempt === MAX_WRITE_ATTEMPTS - 1) throw error;
      await retryDelay(attempt);
    }
  }

  throw new Error('POLICY_INQUIRY_WRITE_RETRIES_EXHAUSTED');
}
