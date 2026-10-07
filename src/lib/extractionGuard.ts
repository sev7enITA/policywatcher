import { buildAcquisitionKey } from './sourceReliability';
import { db } from './db';
import { validateContent, type ScrapeResult } from './scraper';
import { extractionGuardEnabled, extractionProfileHash, sha256 } from './extractionProfile';
import { dualWriteCanonicalPolicyGraph } from './documentEvidenceSync';

const LIVE = new Set(['direct', 'http2', 'rendered']);
type PolicyInput = { id: string; currentHash: string; retrievalUrl?: string | null; url: string };
export type ExtractionDecision = { proceed: boolean; reason: string; profileHash?: string };

/** Guard both scheduled and manual scans. Imported archives never enter this path as live evidence. */
export async function guardExtraction(policy: PolicyInput, result: ScrapeResult): Promise<ExtractionDecision> {
  if (!extractionGuardEnabled()) return { proceed: true, reason: 'guard_disabled' };
  const url = policy.retrievalUrl || policy.url;
  const profileHash = extractionProfileHash(url);
  const hold = async (reason: string) => {
    await db.policyCheckLog.create({ data: {
      policyId: policy.id, status: 'Needs Review', reason, reasonCode: reason,
      source: result.source, textHash: result.hash, textLength: result.text.length,
      finalUrl: result.finalUrl, archiveTimestamp: result.archiveTimestamp ? new Date(result.archiveTimestamp) : null,
    } });
    return { proceed: false, reason, profileHash };
  };
  if (result.status !== 'ok' || result.partial) return hold('extraction_input_incomplete');
  if (!LIVE.has(result.source)) return hold('external_capture_not_live_confirmation');
  const evidence = result.extraction;
  if (!evidence || evidence.profileHash !== profileHash || buildAcquisitionKey(evidence.sourceUrl) !== buildAcquisitionKey(url)
      || (evidence.input !== null && sha256(evidence.input) !== evidence.inputHash)) {
    return hold('extraction_provenance_missing');
  }
  const anchor = await db.extractionBaseline.findUnique({ where: { policyId: policy.id } });
  if (result.hash === policy.currentHash) {
    await db.extractionBaseline.upsert({
      where: { policyId: policy.id },
      create: { policyId: policy.id, baselineHash: result.hash, ...evidence, capturedAt: new Date() },
      update: { baselineHash: result.hash, ...evidence, capturedAt: new Date() },
    });
    return { proceed: true, reason: 'baseline_input_anchored', profileHash };
  }
  if (!anchor || anchor.baselineHash !== policy.currentHash || buildAcquisitionKey(anchor.sourceUrl) !== buildAcquisitionKey(url)) {
    return hold('extraction_baseline_missing');
  }
  if (anchor.profileHash === profileHash) return { proceed: true, reason: 'same_extraction_profile', profileHash };
  if (anchor.input === null || sha256(anchor.input) !== anchor.inputHash) return hold('extraction_replay_unavailable');
  const replay = await validateContent(anchor.input, url);
  if (!replay.ok || replay.partial) return hold('extraction_replay_incomplete');

  // Even when the site also changed, first establish an equivalent old baseline.
  // Subsequent live observations must restart consecutive confirmation.
  await db.$transaction(async tx => {
    const current = await tx.policy.findUniqueOrThrow({ where: { id: policy.id } });
    if (current.currentHash !== anchor.baselineHash) throw new Error('extraction_baseline_concurrent_change');
    if (replay.hash !== current.currentHash) {
      const latest = await tx.policySnapshot.findFirst({ where: { policyId: policy.id }, orderBy: { version: 'desc' } });
      if (!latest?.publicEvidence) throw new Error('extraction_baseline_not_public');
      await tx.policySnapshot.create({ data: {
        policyId: policy.id, version: latest.version + 1, text: replay.text, hash: replay.hash,
        publicEvidence: true, createdAt: anchor.capturedAt,
      } });
      await tx.policy.update({ where: { id: policy.id }, data: { currentText: replay.text, currentHash: replay.hash } });
      await dualWriteCanonicalPolicyGraph(tx, policy.id);
    }
    await tx.extractionBaseline.update({ where: { policyId: policy.id }, data: { profileHash, baselineHash: replay.hash } });
    await tx.policyCheckLog.create({ data: {
      policyId: policy.id, status: 'Needs Review', source: result.source, textHash: result.hash,
      textLength: result.text.length, reason: 'parser_upgrade', reasonCode: 'parser_upgrade', finalUrl: result.finalUrl,
    } });
    await tx.adminReviewLog.create({ data: {
      actorRole: 'system', action: 'parser_upgrade', targetType: 'policy', targetId: policy.id,
      oldValue: anchor.profileHash, newValue: profileHash,
      note: 'Re-extracted the stored baseline input. No provider change, AI analysis or alert created.',
      metadataJson: JSON.stringify({ inputHash: anchor.inputHash, oldHash: anchor.baselineHash, replayHash: replay.hash, capturedHash: result.hash }),
    } });
  });
  return { proceed: false, reason: 'parser_upgrade', profileHash };
}

/** Persist only an input that corresponds exactly to a committed baseline. */
export async function anchorCommittedExtraction(policyId: string, result: ScrapeResult) {
  if (!extractionGuardEnabled() || !result.extraction || result.partial || !LIVE.has(result.source)) return;
  const current = await db.policy.findUnique({ where: { id: policyId } });
  if (current?.currentHash !== result.hash) return;
  await db.extractionBaseline.upsert({
    where: { policyId }, create: { policyId, baselineHash: result.hash, ...result.extraction, capturedAt: new Date() },
    update: { baselineHash: result.hash, ...result.extraction, capturedAt: new Date() },
  });
}
