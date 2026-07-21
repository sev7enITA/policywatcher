/**
 * Admin Policies Management API
 *
 * POST   /api/admin/policies - Add a policy to a company (admin only)
 * DELETE /api/admin/policies?id=<uuid> - Delete a policy (admin only, cascade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import {
  createConfiguredPolicy,
  normalizeConfiguredPolicyInput,
} from '@/lib/configuredPolicy';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required.' },
        { status: 400 }
      );
    }

    const normalizedPolicy = normalizeConfiguredPolicyInput(body);
    if (!normalizedPolicy.ok) {
      return NextResponse.json({ error: normalizedPolicy.error }, { status: 400 });
    }

    // Verify company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // New admin-added policies start as configured inventory, not public evidence.
    const policy = await db.$transaction(async (tx) => {
      return createConfiguredPolicy(tx, {
        companyId,
        ...normalizedPolicy.value,
      });
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

    let confirmation: { confirmName?: unknown; confirmToken?: unknown } = {};
    try {
      confirmation = await request.json();
    } catch {
      confirmation = {};
    }

    if (
      confirmation.confirmName !== policy.name ||
      confirmation.confirmToken !== 'DELETE_POLICY'
    ) {
      return NextResponse.json(
        {
          error:
            'Destructive confirmation required. Provide confirmName equal to the policy name and confirmToken=DELETE_POLICY.',
        },
        { status: 409 }
      );
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
