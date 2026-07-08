import { db } from '@/lib/db';
import { buildLeaderboard } from '@/lib/leaderboard';

/**
 * Builds the public Evidence Signals Board from persisted source evidence.
 *
 * Public change rows are filtered here. Suspended policies are still loaded so
 * the board can show source-attention pressure without exposing their content.
 */
export async function getLeaderboardSnapshot() {
  const companies = await db.company.findMany({
    include: {
      policies: {
        include: {
          snapshots: {
            select: {
              publicEvidence: true,
            },
          },
          changes: {
            where: {
              publicEvidence: true,
            },
            select: {
              id: true,
              overallScore: true,
              overallRisk: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          checkLogs: {
            select: {
              source: true,
              status: true,
              textHash: true,
              checkedAt: true,
              archiveTimestamp: true,
            },
            orderBy: {
              checkedAt: 'desc',
            },
            take: 8,
          },
        },
        orderBy: [
          { jurisdiction: 'asc' },
          { name: 'asc' },
        ],
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return buildLeaderboard(companies);
}
