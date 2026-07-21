import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { getErrorMessage } from '@/lib/safeErrors';
import { prepareSourceOnboardingRows } from '@/lib/sourceOnboarding';
import { resolveBulkOnboardingCandidate } from '@/lib/sourceOnboardingCandidate';

const batchInclude = {
  items: {
    orderBy: { rowNumber: 'asc' as const },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      discoveryCandidate: { select: { id: true, status: true, url: true } },
      policy: {
        select: {
          id: true,
          dataStatus: true,
          ingestionMethod: true,
          currentHash: true,
          lastSuccessfulCheckDate: true,
          _count: { select: { snapshots: true, changes: true } },
        },
      },
    },
  },
} as const;

function itemInput(row: ReturnType<typeof prepareSourceOnboardingRows>['rows'][number]) {
  return {
    rowNumber: row.rowNumber,
    companyName: row.companyName,
    companySlug: row.companySlug,
    industry: row.industry,
    website: row.website,
    policyName: row.policyName,
    policyType: row.policyType,
    policyUrl: row.policyUrl,
    jurisdiction: row.jurisdiction,
  };
}

async function updateBatchCounts(batchId: string) {
  const items = await db.sourceOnboardingItem.findMany({
    where: { batchId },
    select: { stage: true },
  });
  const failedItems = items.filter((item) => item.stage === 'Failed').length;
  const successfulItems = items.length - failedItems;
  await db.sourceOnboardingBatch.update({
    where: { id: batchId },
    data: {
      totalItems: items.length,
      successfulItems,
      failedItems,
      status: failedItems === items.length ? 'Failed' : failedItems > 0 ? 'Partial' : 'Active',
    },
  });
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const requestedBatchId = request.nextUrl.searchParams.get('batchId')?.trim();
  const recentBatches = await db.sourceOnboardingBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      label: true,
      status: true,
      totalItems: true,
      successfulItems: true,
      failedItems: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const batchId = requestedBatchId || recentBatches[0]?.id;
  const batch = batchId
    ? await db.sourceOnboardingBatch.findUnique({ where: { id: batchId }, include: batchInclude })
    : null;

  return NextResponse.json({ batch, recentBatches });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const actorRole = session.role || 'admin';

  const body = await request.json().catch(() => null) as { label?: unknown; text?: unknown } | null;
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 120) : '';
  const text = typeof body?.text === 'string' ? body.text : '';
  const preview = prepareSourceOnboardingRows(text);
  if (preview.errors.length > 0 || preview.rows.length === 0) {
    return NextResponse.json(
      { error: preview.errors[0] || 'At least one onboarding row is required.', preview },
      { status: 400 }
    );
  }

  const batch = await db.sourceOnboardingBatch.create({
    data: {
      label: label || `Source onboarding ${new Date().toISOString().slice(0, 10)}`,
      actorRole,
      totalItems: preview.rows.length,
    },
  });

  for (const row of preview.rows) {
    if (!row.ready) {
      await db.sourceOnboardingItem.create({
        data: {
          batchId: batch.id,
          ...itemInput(row),
          stage: 'Failed',
          error: row.errors.join(' '),
        },
      });
      continue;
    }

    try {
      await db.$transaction(async (tx) => {
        const [companyBySlug, companyByName] = await Promise.all([
          tx.company.findUnique({ where: { slug: row.companySlug } }),
          tx.company.findUnique({ where: { name: row.companyName } }),
        ]);
        if (companyBySlug && companyByName && companyBySlug.id !== companyByName.id) {
          throw new Error('Company name and slug resolve to different existing companies.');
        }
        if (companyBySlug && companyBySlug.name !== row.companyName) {
          throw new Error(`Company slug is already used by ${companyBySlug.name}.`);
        }
        if (companyByName && companyByName.slug !== row.companySlug) {
          throw new Error(`Company name already exists with slug ${companyByName.slug}.`);
        }

        const company = companyBySlug || companyByName || await tx.company.create({
          data: {
            name: row.companyName,
            slug: row.companySlug,
            industry: row.industry,
            website: row.website,
          },
        });

        const existingPolicy = await tx.policy.findUnique({
          where: {
            companyId_type_jurisdiction: {
              companyId: company.id,
              type: row.policyType,
              jurisdiction: row.jurisdiction,
            },
          },
          select: { id: true },
        });
        if (existingPolicy) throw new Error('A policy with this company, type, and jurisdiction already exists.');

        const candidate = await resolveBulkOnboardingCandidate(tx, {
          companyId: company.id,
          companyName: company.name,
          name: row.policyName,
          type: row.policyType,
          url: row.policyUrl,
          jurisdiction: row.jurisdiction,
          batchId: batch.id,
          rowNumber: row.rowNumber,
          actorRole,
        });

        await tx.sourceOnboardingItem.create({
          data: {
            batchId: batch.id,
            ...itemInput(row),
            companyId: company.id,
            discoveryCandidateId: candidate.id,
            stage: 'Proposed',
          },
        });
      });
    } catch (error) {
      await db.sourceOnboardingItem.create({
        data: {
          batchId: batch.id,
          ...itemInput(row),
          stage: 'Failed',
          error: getErrorMessage(error).slice(0, 600),
        },
      });
    }
  }

  await updateBatchCounts(batch.id);
  const savedBatch = await db.sourceOnboardingBatch.findUnique({
    where: { id: batch.id },
    include: batchInclude,
  });
  return NextResponse.json({ batch: savedBatch }, { status: 201 });
}
