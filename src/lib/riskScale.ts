/** Shared numeric scale used by analysis, stored labels and Dataset QA. */
export function riskFromScore(score: number): 'Low' | 'Medium' | 'High' {
  if (!Number.isFinite(score) || score < 1 || score > 10) throw new Error('Risk score must be between 1 and 10.');
  return score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low';
}
