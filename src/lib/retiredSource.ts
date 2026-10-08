import { buildAcquisitionKey } from './sourceReliability';
export function canResolveRetiredSource(issue: { retrievalKey: string; lastDetectedAt: Date; affectedPolicyIdsJson: string }, policies: Array<{ id: string; url: string; retrievalUrl: string | null; lastSuccessfulCheckDate: Date | null; dataStatus: string }>): boolean {
  let ids: unknown;
  try { ids = JSON.parse(issue.affectedPolicyIdsJson); } catch { return false; }
  if (!Array.isArray(ids) || !ids.length || !ids.every(id => typeof id === 'string')) return false;
  return ids.every(id => {
    const p = policies.find(policy => policy.id === id);
    return p && ['Available', 'Reviewed'].includes(p.dataStatus)
      && buildAcquisitionKey(p.retrievalUrl || p.url) !== issue.retrievalKey
      && p.lastSuccessfulCheckDate && p.lastSuccessfulCheckDate > issue.lastDetectedAt;
  });
}
