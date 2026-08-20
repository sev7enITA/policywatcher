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
import { buildAcquisitionKey } from '@/lib/sourceReliability';
import {
  deleteCanonicalDocumentForLegacyPolicy,
  dualWriteCanonicalPolicyGraph,
} from '@/lib/documentEvidenceSync';

function validatePublicSourceUrl(value: string, label: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `${label} must be a valid absolute URL.`;
  }
  const hostname = parsed.hostname.toLowerCase();
  const privateHost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')
    || /^(127\.|10\.|192\.168\.|169\.254\.)/.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    || hostname === '::1';
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || privateHost) {
    return `${label} must be a public credential-free HTTP(S) URL.`;
  }
  return null;
}

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
    const body = await request.json() as { id?: unknown; url?: unknown; retrievalUrl?: unknown; note?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const hasCanonicalUrl = Object.prototype.hasOwnProperty.call(body, 'url');
    const hasRetrievalUrl = Object.prototype.hasOwnProperty.call(body, 'retrievalUrl');
    const canonicalUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const retrievalUrl = typeof body.retrievalUrl === 'string' ? body.retrievalUrl.trim() : '';
    const operatorNote = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
    if (!id) {
      return NextResponse.json({ error: 'Policy id is required.' }, { status: 400 });
    }
    if (!hasCanonicalUrl && !hasRetrievalUrl) {
      return NextResponse.json({ error: 'Provide url and/or retrievalUrl.' }, { status: 400 });
    }

    if (hasCanonicalUrl && !canonicalUrl) {
      return NextResponse.json({ error: 'Canonical URL cannot be empty.' }, { status: 400 });
    }
    const canonicalError = hasCanonicalUrl ? validatePublicSourceUrl(canonicalUrl, 'Canonical URL') : null;
    if (canonicalError) return NextResponse.json({ error: canonicalError }, { status: 400 });
    const retrievalError = hasRetrievalUrl && retrievalUrl
      ? validatePublicSourceUrl(retrievalUrl, 'Retrieval URL')
      : null;
    if (retrievalError) {
      return NextResponse.json({ error: retrievalError }, { status: 400 });
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
    const nextCanonicalUrl = hasCanonicalUrl ? canonicalUrl : existing.url;
    const nextRetrievalUrl = hasRetrievalUrl ? retrievalUrl || null : existing.retrievalUrl;
    const canonicalChanged = nextCanonicalUrl !== existing.url;
    const retrievalChanged = nextRetrievalUrl !== existing.retrievalUrl;
    if (!canonicalChanged && !retrievalChanged) {
      return NextResponse.json({
        success: true,
        changed: false,
        requiresRebaseline: existing.sourceMigrationPending,
        policy: existing,
      });
    }

    const previousAcquisitionUrl = existing.retrievalUrl || existing.url;
    const nextAcquisitionUrl = nextRetrievalUrl || nextCanonicalUrl;
    const acquisitionChanged = buildAcquisitionKey(previousAcquisitionUrl) !== buildAcquisitionKey(nextAcquisitionUrl);
    const hasPublicBaseline = existing.snapshots.length > 0;
    const requiresRebaseline = existing.sourceMigrationPending || (hasPublicBaseline && acquisitionChanged);
    const nextStatus = hasPublicBaseline ? 'Needs Review' : 'Configured';
    const reason = acquisitionChanged
      ? (hasPublicBaseline ? 'source_migration_pending_rebaseline' : 'source_configured_pending_first_baseline')
      : 'canonical_citation_updated_pending_scan';
    const policy = await db.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id },
        data: {
          url: nextCanonicalUrl,
          retrievalUrl: nextRetrievalUrl,
          dataStatus: nextStatus,
          sourceMigrationPending: requiresRebaseline,
          sourceMigrationRequestedAt: requiresRebaseline
            ? existing.sourceMigrationRequestedAt || checkedAt
            : null,
        },
      });
      await tx.policyCheckLog.create({
        data: {
          policyId: id,
          status: nextStatus,
          checkedAt,
          source: 'source_remediation',
          reason,
          reasonCode: 'configuration',
          finalUrl: nextAcquisitionUrl,
        },
      });
      await tx.adminReviewLog.create({
        data: {
          actorRole: session.role || 'admin',
          action: acquisitionChanged ? 'policy_source_migration_requested' : 'policy_canonical_url_updated',
          targetType: 'policy',
          targetId: id,
          targetLabel: `${existing.company.name} / ${existing.name} / ${existing.jurisdiction}`,
          oldValue: JSON.stringify({ url: existing.url, retrievalUrl: existing.retrievalUrl }),
          newValue: JSON.stringify({ url: nextCanonicalUrl, retrievalUrl: nextRetrievalUrl }),
          note: operatorNote || (acquisitionChanged
            ? 'The acquisition source changed. Its first verified capture will establish a new comparison baseline without creating a provider change event.'
            : 'The public canonical citation changed while the acquisition endpoint remained stable; a new scan is required.'),
        },
      });
      await dualWriteCanonicalPolicyGraph(tx, id);
      return updated;
    });

    return NextResponse.json({ success: true, changed: true, requiresRebaseline, acquisitionChanged, policy });
  } catch (error) {
    console.error('[Admin Policies] PATCH error:', error);
    return NextResponse.json({ error: 'Unable to update source configuration.' }, { status: 500 });
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

    await db.$transaction(async (tx) => {
      await deleteCanonicalDocumentForLegacyPolicy(tx, id);
      await tx.policy.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      deleted: `${policy.company.name} / ${policy.name}`,
    });
  } catch (error) {
    console.error('[Admin Policies] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
