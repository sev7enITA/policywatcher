/**
 * Admin Policies Management API
 *
 * POST   /api/admin/policies - Add a policy to a company (admin only)
 * DELETE /api/admin/policies?id=<uuid> - Delete a policy (admin only, cascade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { companyId, name, type, url, jurisdiction } = body;

    if (!companyId || !name || !type || !url) {
      return NextResponse.json(
        { error: 'companyId, name, type, and url are required.' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Create policy with empty initial text and hash
    const initialHash = createHash('sha256').update('').digest('hex');
    const policy = await db.policy.create({
      data: {
        companyId,
        name,
        type,
        url,
        jurisdiction: jurisdiction || 'Global',
        currentText: '',
        currentHash: initialHash,
      },
    });

    return NextResponse.json({ success: true, policy }, { status: 201 });
  } catch (error) {
    console.error('[Admin Policies] POST error:', error);
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
    const policy = await db.policy.findUnique({
      where: { id },
      include: { company: { select: { name: true } } },
    });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    await db.policy.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      deleted: `${policy.company.name} / ${policy.name}`,
    });
  } catch (error) {
    console.error('[Admin Policies] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
