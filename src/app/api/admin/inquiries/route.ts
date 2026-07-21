import { after, NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { publicChangeWhere } from '@/lib/publicDataGate';
import { createCompanyAndStartDiscovery, normalizeCompanySlug } from '@/lib/companyOnboardingService';
import { readJsonObject } from '@/lib/requestBody';

const ACTIONS = new Set(['link_company', 'approve_new_company', 'reject', 'duplicate', 'resolve_change']);

function text(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const status = new URL(request.url).searchParams.get('status');
    const inquiries = await db.policyInquiry.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
    const companyIds = [...new Set(inquiries.map((item) => item.matchedCompanyId).filter(Boolean))] as string[];
    const changeIds = [...new Set(inquiries.map((item) => item.resolvedChangeId).filter(Boolean))] as string[];
    const [companies, changes, companyOptions, statusGroups] = await Promise.all([
      db.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true, slug: true } }),
      db.policyChange.findMany({
        where: publicChangeWhere({ id: { in: changeIds } }) as never,
        select: { id: true, createdAt: true, policy: { select: { name: true, company: { select: { name: true } } } } },
      }),
      db.company.findMany({ select: { id: true, name: true, slug: true, website: true }, orderBy: { name: 'asc' } }),
      db.policyInquiry.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    const changeMap = new Map(changes.map((change) => [change.id, change]));
    return NextResponse.json({
      role: session.role,
      inquiries: inquiries.map((item) => ({
        ...item,
        company: item.matchedCompanyId ? companyMap.get(item.matchedCompanyId) || null : null,
        resolvedChange: item.resolvedChangeId ? changeMap.get(item.resolvedChangeId) || null : null,
      })),
      companyOptions,
      statusCounts: Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all])),
    });
  } catch (error) {
    console.error('[Admin inquiries] GET failed:', error);
    return NextResponse.json({ error: 'Could not load inquiries.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const inquiryId = text(body?.inquiryId, 80);
  const action = text(body?.action, 60);
  const note = text(body?.adminNote, 1000);
  if (!inquiryId || !ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Valid inquiryId and action are required.' }, { status: 400 });
  }

  try {
    const inquiry = await db.policyInquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 });
    if (['Rejected', 'Duplicate', 'Resolved'].includes(inquiry.status) && action !== 'resolve_change') {
      return NextResponse.json({ error: 'This inquiry is already terminal.' }, { status: 409 });
    }

    if (action === 'link_company') {
      const companyId = text(body?.companyId, 80);
      const company = await db.company.findUnique({ where: { id: companyId } });
      if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
      const updated = await db.$transaction(async (tx) => {
        const next = await tx.policyInquiry.update({
          where: { id: inquiry.id },
          data: { status: 'Approved', kind: 'verify_existing', matchedCompanyId: company.id, adminNote: note || null },
        });
        await tx.adminReviewLog.create({ data: {
          actorRole: session.role!, action: 'policy_inquiry_link_company', targetType: 'PolicyInquiry',
          targetId: inquiry.id, targetLabel: inquiry.publicToken, oldValue: inquiry.status, newValue: 'Approved',
          note: note || null, metadataJson: JSON.stringify({ companyId: company.id, companyName: company.name }),
        } });
        return next;
      });
      return NextResponse.json({ success: true, inquiry: updated });
    }

    if (action === 'approve_new_company') {
      const name = text(body?.companyName, 160);
      const website = text(body?.website, 2000);
      const industry = text(body?.industry, 120);
      if (!name || !website || !industry) {
        return NextResponse.json({ error: 'Canonical company name, website and industry are required.' }, { status: 400 });
      }
      const result = await createCompanyAndStartDiscovery(
        { name, slug: normalizeCompanySlug(name), website, industry },
        (task) => after(task)
      );
      const updated = await db.$transaction(async (tx) => {
        const next = await tx.policyInquiry.update({
          where: { id: inquiry.id },
          data: { status: 'Onboarding', matchedCompanyId: result.company.id, adminNote: note || null },
        });
        await tx.adminReviewLog.create({ data: {
          actorRole: session.role!, action: 'policy_inquiry_approve_new_company', targetType: 'PolicyInquiry',
          targetId: inquiry.id, targetLabel: inquiry.publicToken, oldValue: inquiry.status, newValue: 'Onboarding',
          note: note || null, metadataJson: JSON.stringify({ companyId: result.company.id, companyName: result.company.name, discoveryStarted: Boolean(result.discovery) }),
        } });
        return next;
      });
      return NextResponse.json({ success: true, inquiry: updated, company: result.company, discovery: result.discovery, discoveryError: result.discoveryError });
    }

    if (action === 'resolve_change') {
      const changeId = text(body?.changeId, 80);
      const change = await db.policyChange.findFirst({
        where: publicChangeWhere({ id: changeId }) as never,
        select: { id: true, policyId: true, policy: { select: { companyId: true } } },
      });
      if (!change) return NextResponse.json({ error: 'A public verified change is required.' }, { status: 400 });
      const now = new Date();
      const updated = await db.$transaction(async (tx) => {
        const next = await tx.policyInquiry.update({
          where: { id: inquiry.id },
          data: {
            status: 'Resolved', resolvedAt: now, resolvedChangeId: change.id,
            matchedCompanyId: change.policy.companyId, matchedPolicyId: change.policyId, adminNote: note || null,
          },
        });
        await tx.adminReviewLog.create({ data: {
          actorRole: session.role!, action: 'policy_inquiry_resolve_change', targetType: 'PolicyInquiry',
          targetId: inquiry.id, targetLabel: inquiry.publicToken, oldValue: inquiry.status, newValue: 'Resolved',
          note: note || null, policyChangeId: change.id,
        } });
        return next;
      });
      return NextResponse.json({ success: true, inquiry: updated });
    }

    const nextStatus = action === 'reject' ? 'Rejected' : 'Duplicate';
    const updated = await db.$transaction(async (tx) => {
      const next = await tx.policyInquiry.update({
        where: { id: inquiry.id },
        data: { status: nextStatus, adminNote: note || null, resolvedAt: new Date() },
      });
      await tx.adminReviewLog.create({ data: {
        actorRole: session.role!, action: `policy_inquiry_${action}`, targetType: 'PolicyInquiry',
        targetId: inquiry.id, targetLabel: inquiry.publicToken, oldValue: inquiry.status, newValue: nextStatus,
        note: note || null,
      } });
      return next;
    });
    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_WEBSITE') {
      return NextResponse.json({ error: 'Website must be a valid http(s) URL.' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'COMPANY_EXISTS') {
      return NextResponse.json({ error: 'Company already exists; link it instead.' }, { status: 409 });
    }
    console.error('[Admin inquiries] PATCH failed:', error);
    return NextResponse.json({ error: 'The transition could not be completed.' }, { status: 500 });
  }
}
