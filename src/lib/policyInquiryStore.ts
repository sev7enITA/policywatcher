import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type InquiryCreateArgs = Parameters<PrismaClient['policyInquiry']['create']>[0];
type InquiryRecord = Awaited<ReturnType<PrismaClient['policyInquiry']['create']>>;
type InquiryStore = Pick<PrismaClient, 'policyInquiry'>;

function isActiveDedupeConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.includes('activeDedupeKey')
    : String(target || '').includes('activeDedupeKey');
}

export async function createOrReuseActiveInquiry(
  store: InquiryStore,
  args: InquiryCreateArgs,
): Promise<{ inquiry: InquiryRecord; created: boolean }> {
  const activeDedupeKey = args.data.activeDedupeKey;
  if (typeof activeDedupeKey !== 'string' || !activeDedupeKey) {
    throw new Error('ACTIVE_DEDUPE_KEY_REQUIRED');
  }

  try {
    return { inquiry: await store.policyInquiry.create(args), created: true };
  } catch (error) {
    if (!isActiveDedupeConflict(error)) throw error;
    const existing = await store.policyInquiry.findUnique({ where: { activeDedupeKey } });
    if (!existing) throw error;
    return { inquiry: existing, created: false };
  }
}
