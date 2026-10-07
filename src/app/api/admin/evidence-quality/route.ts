import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { readBoundedJsonObject } from '@/lib/requestBody';
import { compareExtractions, reviewEvidenceHash } from '@/lib/evidenceQuality';
import { getReviewedQualityMetrics } from '@/lib/evidenceQualityData';
import { sha256 } from '@/lib/extractionProfile';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (request.nextUrl.searchParams.get('metricsOnly') === '1') return NextResponse.json({ metrics: await getReviewedQualityMetrics() }, { headers });
  const changeId = request.nextUrl.searchParams.get('changeId');
  if (changeId) {
    const change = await db.policyChange.findUnique({ where: { id: changeId }, include: { oldSnapshot: true, newSnapshot: true, policy: true } });
    if (!change) return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    return NextResponse.json({ change, evidenceHash: reviewEvidenceHash(change) }, { headers });
  }
  const [metrics, references, reviews, changes, held, policies] = await Promise.all([
    getReviewedQualityMetrics(),
    db.externalDocumentReference.findMany({ orderBy: { recordedAt: 'desc' }, take: 100 }),
    db.evidenceQualityReview.findMany({ orderBy: { updatedAt: 'desc' }, take: 50 }),
    db.policyChange.findMany({ orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, createdAt: true, policy: { select: { name: true, company: { select: { name: true } } } } } }),
    db.policyCheckLog.findMany({ where: { reasonCode: { in: ['extraction_baseline_missing', 'extraction_replay_unavailable', 'extraction_replay_incomplete', 'parser_upgrade'] } },
      orderBy: { checkedAt: 'desc' }, take: 50, select: { policyId: true, reason: true, checkedAt: true, policy: { select: { currentHash: true, name: true } } } }),
    db.policy.findMany({ orderBy: { name: 'asc' }, take: 1000, select: { id: true, name: true, jurisdiction: true, company: { select: { name: true } } } }),
  ]);
  return NextResponse.json({ role: session.role, metrics, references, reviews, changes, held, policies,
    limits: { references: 100, reviews: 50, changes: 50, held: 50 },
    referenceScope: 'Metadata-only pilot, up to three revisions per document. No live confirmation, no completeness claim.' }, { headers });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await readBoundedJsonObject(request, 64 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.reason }, { status: 400 });
  const b = body.value;
  const invalid = () => NextResponse.json({ error: 'Invalid review, evidence changed, or missing scope/rights acknowledgement.' }, { status: 400 });
  if (b.action === 'baseline_review') {
    if (typeof b.policyId !== 'string' || typeof b.expectedHash !== 'string'
      || typeof b.note !== 'string' || b.note.trim().length < 10 || b.note.length > 2000) return invalid();
    const policy = await db.policy.findUnique({ where: { id: b.policyId }, include: { checkLogs: { orderBy: { checkedAt: 'desc' }, take: 1 } } });
    if (!policy || policy.currentHash !== b.expectedHash || !['extraction_baseline_missing', 'extraction_replay_unavailable', 'extraction_replay_incomplete'].includes(policy.checkLogs[0]?.reason || '')) return invalid();
    await db.$transaction(async tx => {
      const updated = await tx.policy.updateMany({ where: { id: policy.id, currentHash: b.expectedHash as string },
        data: { sourceMigrationPending: true, sourceMigrationRequestedAt: new Date() } });
      if (updated.count !== 1) throw new Error('Baseline changed during review');
      await tx.adminReviewLog.create({ data: { actorRole: session.role!, action: 'extraction_baseline_review', targetType: 'policy',
        targetId: policy.id, oldValue: policy.currentHash, note: (b.note as string).trim() } });
    });
    return NextResponse.json({ saved: true, next: 'Next successful live scan establishes a baseline without a provider change.' }, { headers });
  }
  if (b.action === 'reference_review') {
    if (typeof b.id !== 'string' || !['mapped', 'rejected'].includes(String(b.status))
      || typeof b.note !== 'string' || b.note.trim().length < 10 || b.note.length > 2000) return invalid();
    const reference = await db.externalDocumentReference.findUnique({ where: { id: b.id } });
    if (!reference) return invalid();
    const policy = typeof b.policyId === 'string' ? await db.policy.findUnique({ where: { id: b.policyId }, include: { company: true } }) : null;
    if (b.status === 'mapped' && (!policy || b.scopeConfirmed !== true
      || policy.type !== reference.suggestedType
      || !policy.company.name.toLowerCase().includes(reference.service.toLowerCase())
      || (reference.jurisdiction !== 'unconfirmed' && policy.jurisdiction !== reference.jurisdiction))) return invalid();
    const reviewedPolicyId = b.status === 'mapped' ? policy!.id : null;
    await db.$transaction([
      db.externalDocumentReference.update({ where: { id: b.id }, data: {
        status: String(b.status), policyId: reviewedPolicyId, reviewNote: b.note.trim(), reviewedAt: new Date(),
      } }),
      db.adminReviewLog.create({ data: { actorRole: session.role, action: 'external_reference_review', targetType: 'external_reference',
        targetId: b.id, note: b.note.trim(), newValue: String(b.status), metadataJson: JSON.stringify({ policyId: reviewedPolicyId }) } }),
    ]);
    return NextResponse.json({ saved: true }, { headers });
  }
  if (typeof b.changeId !== 'string') return invalid();
  const change = await db.policyChange.findUnique({ where: { id: b.changeId }, include: { oldSnapshot: true, newSnapshot: true } });
  if (!change || reviewEvidenceHash(change) !== b.evidenceHash) return invalid();
  if (b.action === 'compare') {
    if (typeof b.externalText !== 'string' || !b.externalText.trim() || b.externalText.length > 40_000
      || typeof b.rightsBasis !== 'string' || b.rightsBasis.trim().length < 10 || b.rightsBasis.length > 1000) return invalid();
    return NextResponse.json(compareExtractions(change.newSnapshot?.text || '', b.externalText, b.scopeConfirmed === true), { headers });
  }
  if (!['substantive_change', 'ai_citation'].includes(String(b.metric)) || !['pass', 'fail', 'unassessed'].includes(String(b.verdict))
    || typeof b.note !== 'string' || b.note.trim().length < 10 || b.note.length > 2000) return invalid();
  const claim = typeof b.claim === 'string' ? b.claim.trim() : '';
  const quote = typeof b.quote === 'string' ? b.quote.trim() : '';
  if (claim.length > 4000 || quote.length > 4000) return invalid();
  if (b.metric === 'ai_citation' && (!claim || ![change.aiSummaryEn, change.aiSummaryIt].some(s => s.includes(claim))
    || (quote && ![change.oldSnapshot?.text, change.newSnapshot?.text].some(s => s?.includes(quote)))
    || (b.verdict === 'pass' && !quote))) return invalid();
  const row = { changeId: change.id, metric: String(b.metric), verdict: String(b.verdict), evidenceHash: reviewEvidenceHash(change),
    claim: b.metric === 'ai_citation' ? claim : '', quote: b.metric === 'ai_citation' ? quote : '', note: b.note.trim(), reviewedBy: session.role };
  const subjectKey = sha256(JSON.stringify([row.changeId, row.metric, row.claim]));
  await db.$transaction([
    db.evidenceQualityReview.upsert({ where: { subjectKey }, create: { ...row, subjectKey }, update: row }),
    db.adminReviewLog.create({ data: { actorRole: session.role, action: 'evidence_quality_review', targetType: 'change',
      targetId: change.id, policyChangeId: change.id, note: row.note, newValue: row.verdict,
      metadataJson: JSON.stringify({ subjectKey, metric: row.metric, evidenceHash: row.evidenceHash }) } }),
  ]);
  return NextResponse.json({ saved: true, metrics: await getReviewedQualityMetrics() }, { headers });
}
