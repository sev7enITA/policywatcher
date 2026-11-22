import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { log, approval, findReview } = vi.hoisted(() => ({ log: vi.fn().mockResolvedValue({}), approval: vi.fn(), findReview: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { adminReviewLog: { create: log }, engineReview: { findUnique: findReview } } }));
vi.mock('@/lib/adminAuth', () => ({ getSession: vi.fn(() => ({ valid: true, role: 'admin' })) }));
vi.mock('@/lib/engine/store', () => ({ engineEnabled: () => true, enqueueRun: vi.fn(), cancelRun: vi.fn(), stateKey: vi.fn(), readArtifact: vi.fn() }));
vi.mock('@/lib/engine/pipeline', () => ({ approveReview: approval, closeReview: vi.fn(), requestConfirmedRebaseline: vi.fn() }));
vi.mock('@/lib/hostedPreview', () => ({ isHostedPreview: () => false, assertHostedPreviewContext: vi.fn() }));
vi.mock('@/lib/engine/hostedWorker', () => ({ getHostedWorkerStatus: vi.fn() }));
vi.mock('@/lib/scanChannels', () => ({ channelImplementationHash: vi.fn(), scanChannelCapabilities: vi.fn() }));
import { GET, POST } from '@/app/api/admin/engine/route';
import { getSession } from '@/lib/adminAuth';
import { readArtifact } from '@/lib/engine/store';
import { structureDocument } from '@/lib/engine/document';
const id = '11111111-1111-4111-8111-111111111111';
const request = (body: unknown) => new NextRequest('https://example.org/api/admin/engine', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
describe('administrative coverage refusal accountability', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '1'); vi.mocked(getSession).mockReturnValue({ valid: true, role: 'admin' }); });
  it('records a bounded failed approval without leaking the reviewer rationale', async () => {
    approval.mockRejectedValue(new Error('source_coverage_not_qualified'));
    const response = await POST(request({ action: 'approve', reviewId: id, note: 'PRIVATE_REVIEWER_RATIONALE_CANARY' }));
    expect(response.status).toBe(409);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(log).toHaveBeenCalledExactlyOnceWith({ data: { actorRole: 'admin', action: 'engine_evidence_approval_denied', targetType: 'engineReview', targetId: id,
      note: 'Approval refused by a hard evidence gate.', metadataJson: JSON.stringify({ reason: 'source_coverage_not_qualified' }) } });
    expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE_REVIEWER_RATIONALE_CANARY');
  });
  it('does not turn audit-storage failure into approval or expose its raw exception', async () => {
    approval.mockRejectedValue(new Error('source_coverage_not_qualified'));
    log.mockRejectedValueOnce(new Error('PRIVATE_STORAGE_ERROR_CANARY'));
    const response = await POST(request({ action: 'approve', reviewId: id, note: 'A synthetic attempt to waive the coverage evidence gate.' }));
    expect(response.status).toBe(409);
    const result = await response.json();
    expect(result.auditRecorded).toBe(false);
    expect(JSON.stringify(result)).not.toContain('PRIVATE_STORAGE_ERROR_CANARY');
  });
  it('rejects unauthorized requests before approval or audit mutation', async () => {
    vi.mocked(getSession).mockReturnValue({ valid: false });
    expect((await POST(request({ action: 'approve', reviewId: id, note: 'Synthetic rationale.' }))).status).toBe(403);
    expect(log).not.toHaveBeenCalled(); expect(approval).not.toHaveBeenCalled();
  });
  it('rejects an oversized inventory request before touching approval or storage', async () => {
    expect((await POST(request({ action: 'contract', inventory: 'x'.repeat(512 * 1024) }))).status).toBe(400);
    expect(log).not.toHaveBeenCalled(); expect(approval).not.toHaveBeenCalled();
  });
});


describe('terminal review evidence visibility', () => {
  const text = 'This frozen policy capture remains available after a terminal worker failure; processing failure never deletes its evidence.';
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSession).mockReturnValue({ valid: true, role: 'admin' });
    vi.mocked(readArtifact).mockResolvedValue({ html: 'PRIVATE_RAW_HTML_CANARY', document: structureDocument(text), captureId: 'frozen-capture', language: 'en' }); });
  it('loads evidence retained only inside the terminal checkpoint without exposing raw HTML', async () => {
    findReview.mockResolvedValue({ id, payloadJson: JSON.stringify({ input: { sourceUrl: 'https://example.org/terms', contract: null },
      checkpoint: { observation: { artifactId: 'retained-capture' } } }) });
    const response = await GET(new NextRequest('https://example.org/api/admin/engine?reviewId=' + id));
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toContain('no-store');
    expect(readArtifact).toHaveBeenCalledWith('retained-capture');
    const body = await response.json(); expect(body.document.text).toBe(text); expect(body.coverageAssessment.eligible).toBe(false);
    expect(JSON.stringify(body)).not.toContain('PRIVATE_RAW_HTML_CANARY');
  });
  it('keeps an explicit current observation ahead of a historical checkpoint pointer', async () => {
    findReview.mockResolvedValue({ id, payloadJson: JSON.stringify({ observation: { artifactId: 'current-capture' },
      checkpoint: { observation: { artifactId: 'older-capture' } } }) });
    const response = await GET(new NextRequest('https://example.org/api/admin/engine?reviewId=' + id));
    expect(response.status).toBe(200); expect(readArtifact).toHaveBeenCalledExactlyOnceWith('current-capture');
  });
  it('does not read terminal evidence for an unauthorized visitor', async () => {
    vi.mocked(getSession).mockReturnValue({ valid: false });
    expect((await GET(new NextRequest('https://example.org/api/admin/engine?reviewId=' + id))).status).toBe(403);
    expect(readArtifact).not.toHaveBeenCalled(); expect(findReview).not.toHaveBeenCalled();
  });
});
