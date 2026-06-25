/**
 * PolicyWatcher - Companies List API
 *
 * @route GET /api/companies
 *
 * Returns every monitored company together with its policies and the most
 * recent policy change (including region impacts). This is the primary data
 * source for the dashboard grid.
 *
 * @auth    None (public endpoint).
 * @rateLimit 60 requests / minute per IP.
 *
 * @returns {Company[]} Array of company objects with nested policies and latest changes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Retrieves all companies with their policies and the latest change per policy.
 *
 * The query eagerly loads one level of changes (most recent first) with their
 * region impacts so the client can render risk badges without extra requests.
 *
 * @param request - The incoming Next.js request.
 * @returns JSON array of companies, or a 500 error.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const companies = await db.company.findMany({
      include: {
        policies: {
          include: {
            changes: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                regionImpacts: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Errore interno durante il recupero delle compagnie.' },
      { status: 500 }
    );
  }
}
