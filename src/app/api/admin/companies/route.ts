/**
 * Admin Companies Management API
 *
 * GET    /api/admin/companies - List all companies with policy counts
 * POST   /api/admin/companies - Create a new company (admin only)
 * DELETE /api/admin/companies?id=<uuid> - Delete a company (admin only, cascade)
 */

import { after, NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import {
  createCompanyAndStartDiscovery,
} from '@/lib/companyOnboardingService';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companies = await db.company.findMany({
      include: {
        policies: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            jurisdiction: true,
            currentHash: true,
            dataStatus: true,
            ingestionMethod: true,
            lastCheckDate: true,
            lastSuccessfulCheckDate: true,
            updatedAt: true,
            snapshots: {
              where: { publicEvidence: true },
              take: 1,
              select: { id: true },
            },
            _count: { select: { changes: true, snapshots: true } },
          },
        },
        _count: { select: { policies: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ companies, role: session.role });
  } catch (error) {
    console.error('[Admin Companies] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, industry, website, logo } = body;

    if (!name || !slug || !industry || !website) {
      return NextResponse.json(
        { error: 'name, slug, industry, and website are required.' },
        { status: 400 }
      );
    }

    const result = await createCompanyAndStartDiscovery(
      { name, slug, industry, website, logo },
      (task) => after(task)
    );
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_WEBSITE') {
      return NextResponse.json({ error: 'website must be a valid http(s) URL.' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'COMPANY_EXISTS') {
      return NextResponse.json({ error: 'A company with this name or slug already exists.' }, { status: 409 });
    }
    console.error('[Admin Companies] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  try {
    const company = await db.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let confirmation: { confirmName?: unknown; confirmToken?: unknown } = {};
    try {
      confirmation = await request.json();
    } catch {
      confirmation = {};
    }

    if (
      confirmation.confirmName !== company.name ||
      confirmation.confirmToken !== 'DELETE_COMPANY'
    ) {
      return NextResponse.json(
        {
          error:
            'Destructive confirmation required. Provide confirmName equal to the company name and confirmToken=DELETE_COMPANY.',
        },
        { status: 409 }
      );
    }

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await db.company.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: company.name });
  } catch (error) {
    console.error('[Admin Companies] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
