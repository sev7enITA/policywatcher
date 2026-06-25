/**
 * PolicyWatcher - Single Policy Detail API
 *
 * @route GET /api/policies/[id]
 *
 * Returns the full detail of a single policy identified by its UUID,
 * including the parent company, all snapshots (newest first), and all
 * recorded changes with their region impacts and diff snapshots.
 *
 * @auth    None (public endpoint).
 * @rateLimit 60 requests / minute per IP.
 *
 * @returns {Policy} The complete policy object with nested relations, or 404.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Fetches a single policy by its dynamic `[id]` route parameter.
 *
 * Eagerly loads the parent company, all version snapshots, and the full
 * change history (with old/new snapshot refs and region impacts) so the
 * PolicyDetails slide-over can render everything in one request.
 *
 * @param request - The incoming Next.js request.
 * @param params  - Route params promise containing `{ id: string }`.
 * @returns JSON policy object, 404 if not found, or 500 on error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const { id } = await params;

    const policy = await db.policy.findUnique({
      where: { id },
      include: {
        company: true,
        snapshots: {
          orderBy: {
            version: 'desc',
          },
        },
        changes: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            oldSnapshot: true,
            newSnapshot: true,
            regionImpacts: true,
          },
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy non trovata.' },
        { status: 404 }
      );
    }

    // Fetch all sibling policies (same company) so the UI can show
    // the full inventory of monitored documents for this company.
    const siblingPolicies = await db.policy.findMany({
      where: { companyId: policy.companyId },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        jurisdiction: true,
        currentHash: true,
        updatedAt: true,
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, createdAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ...policy, siblingPolicies });
  } catch (error) {
    console.error('Error fetching policy details:', error);
    return NextResponse.json(
      { error: 'Errore interno durante il recupero della policy.' },
      { status: 500 }
    );
  }
}
