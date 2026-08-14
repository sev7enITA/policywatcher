import { describe, expect, it } from 'vitest';
import { buildRiskTrendResponse, type RiskTrendChange } from '../riskTrends';

function change(
  createdAt: string,
  overallScore: number,
  snapshotVersion: number,
  policyName: string
): RiskTrendChange {
  return {
    createdAt,
    overallScore,
    overallRisk: overallScore >= 7 ? 'High' : overallScore >= 4 ? 'Medium' : 'Low',
    newSnapshot: { version: snapshotVersion },
    policy: {
      name: policyName,
      company: { name: 'Example Co' },
    },
  };
}

describe('buildRiskTrendResponse', () => {
  it('sorts observations and preserves each source snapshot version', () => {
    const response = buildRiskTrendResponse([
      change('2026-07-03T10:00:00.000Z', 8, 3, 'Terms'),
      change('2026-07-01T10:00:00.000Z', 4, 7, 'Privacy'),
      change('2026-07-02T10:00:00.000Z', 6, 3, 'Privacy'),
    ]);

    expect(response.points.map((point) => point.sequence)).toEqual([1, 2, 3]);
    expect(response.points.map((point) => point.snapshotVersion)).toEqual([7, 3, 3]);
    expect(response.points.map((point) => point.policyName)).toEqual([
      'Privacy',
      'Privacy',
      'Terms',
    ]);
    expect(response.points[0].date).toBe('2026-07-01T10:00:00.000Z');
  });

  it('computes summary statistics on the chronological event stream', () => {
    const response = buildRiskTrendResponse([
      change('2026-07-01T10:00:00.000Z', 3, 1, 'Privacy'),
      change('2026-07-02T10:00:00.000Z', 4, 2, 'Privacy'),
      change('2026-07-03T10:00:00.000Z', 8, 1, 'Terms'),
    ]);

    expect(response.summary).toEqual({
      count: 3,
      avgScore: 5,
      minScore: 3,
      maxScore: 8,
      latestScore: 8,
      firstScore: 3,
      delta: 5,
    });
  });

  it('returns an explicit empty summary', () => {
    expect(buildRiskTrendResponse([])).toEqual({
      points: [],
      summary: {
        count: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        latestScore: 0,
        firstScore: 0,
        delta: 0,
      },
    });
  });
});
