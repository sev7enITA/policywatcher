/**
 * Admin Policies Management API
 *
 * POST   /api/admin/policies - Add a policy to a company (admin only)
 * PATCH  /api/admin/policies - Configure an optional official retrieval URL
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

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json() as { id?: unknown; retrievalUrl?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const retrievalUrl = typeof body.retrievalUrl === 'string' ? body.retrievalUrl.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Policy id is required.' }, { status: 400 });
    }

    if (retrievalUrl) {
      let parsed: URL;
      try {
        parsed = new URL(retrievalUrl);
      } catch {
        return NextResponse.json({ error: 'Retrieval URL must be a valid absolute URL.' }, { status: 400 });
      }
      const hostname = parsed.hostname.toLowerCase();
      const privateHost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')
        || /^(127\.|10\.|192\.168\.|169\.254\.)/.test(hostname)
        || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
        || hostname === '::1';
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || privateHost) {
        return NextResponse.json({ error: 'Retrieval URL must be a public credential-free HTTP(S) URL.' }, { status: 400 });
      }
    }

    const existing = await db.policy.findUnique({
      where: { id },
      include: {
        company: { select: { name: true } },
        snapshots: { where: { publicEvidence: true }, take: 1, select: { id: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Policy not found.' }, { status: 404 });
    }

    const checkedAt = new Date();
    const nextStatus = existing.snapshots.length > 0 ? 'Needs Review' : 'Configured';
    const policy = await db.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id },
        data: { retrievalUrl: retrievalUrl || null, dataStatus: nextStatus },
      });
      await tx.policyCheckLog.create({
        data: {
          policyId: id,
          status: nextStatus,
          checkedAt,
          source: 'source_remediation',
          reason: retrievalUrl ? 'official_retrieval_url_configured_pending_scan' : 'retrieval_url_cleared_pending_scan',
          reasonCode: 'configuration',
          finalUrl: retrievalUrl || existing.url,
        },
      });
      await tx.adminReviewLog.create({
        data: {
          actorRole: session.role || 'admin',
          action: retrievalUrl ? 'retrieval_url_configured' : 'retrieval_url_cleared',
          targetType: 'policy',
          targetId: id,
          targetLabel: `${existing.company.name} / ${existing.name} / ${existing.jurisdiction}`,
          oldValue: existing.retrievalUrl,
          newValue: retrievalUrl || null,
          note: 'Canonical public URL retained; source must pass a new scan before the retrieval configuration is accepted as current evidence.',
        },
      });
      return updated;
    });

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    console.error('[Admin Policies] PATCH error:', error);
    return NextResponse.json({ error: 'Unable to update retrieval URL.' }, { status: 500 });
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
