/**
 * Admin Companies Management API
 *
 * GET    /api/admin/companies - List all companies with policy counts
 * POST   /api/admin/companies - Create a new company (admin only)
 * DELETE /api/admin/companies?id=<uuid> - Delete a company (admin only, cascade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';

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
            updatedAt: true,
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

    // Check for duplicates
    const existing = await db.company.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Company with name "${name}" or slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const company = await db.company.create({
      data: { name, slug, industry, website, logo: logo || null },
    });

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error) {
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

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await db.company.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: company.name });
  } catch (error) {
    console.error('[Admin Companies] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
