import { PrismaClient } from '@prisma/client';
import { normalizeDataStatus } from '../src/lib/policyConfidence';

const prisma = new PrismaClient();

async function main() {
  const policies = await prisma.policy.findMany({
    include: {
      checkLogs: {
        select: { id: true },
        take: 1,
      },
    },
  });

  let created = 0;

  for (const policy of policies) {
    if (policy.checkLogs.length > 0) continue;

    const checkedAt = policy.lastCheckDate || policy.updatedAt || new Date();
    const status = normalizeDataStatus(policy.dataStatus, 'Available');

    await prisma.policyCheckLog.create({
      data: {
        policyId: policy.id,
        status,
        checkedAt,
        source: policy.ingestionMethod?.toLowerCase().includes('seed') ? 'seeded' : 'backfill',
        reason: 'Backfilled from existing policy metadata',
        finalUrl: policy.url,
        textHash: policy.currentHash || null,
        textLength: policy.currentText?.length || null,
      },
    });
    created++;
  }

  console.log(`Policy check-log backfill complete. Created ${created} rows.`);
}

main()
  .catch((error) => {
    console.error('Policy check-log backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
