export interface RiskTrendChange {
  createdAt: Date | string;
  overallScore: number;
  overallRisk: string;
  newSnapshot: { version: number };
  policy: {
    name: string;
    company: { name: string };
  };
}

/**
 * One observed policy change. `sequence` is the chart position, while
 * `snapshotVersion` is the real version from the policy's own history.
 */
export interface RiskTrendPoint {
  date: string;
  score: number;
  companyName: string;
  policyName: string;
  sequence: number;
  snapshotVersion: number;
  risk: string;
}

export interface RiskTrendSummary {
  count: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  latestScore: number;
  firstScore: number;
  /** Positive means the risk score worsened between first and latest event. */
  delta: number;
}

export interface RiskTrendResponse {
  points: RiskTrendPoint[];
  summary: RiskTrendSummary;
}

function timestamp(value: Date | string): number {
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : 0;
}

function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : String(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Builds a deterministic, provenance-preserving event timeline. */
export function buildRiskTrendResponse(changes: readonly RiskTrendChange[]): RiskTrendResponse {
  const orderedChanges = [...changes].sort(
    (left, right) => timestamp(left.createdAt) - timestamp(right.createdAt)
  );

  const points = orderedChanges.map((change, index): RiskTrendPoint => ({
    date: toIso(change.createdAt),
    score: change.overallScore,
    companyName: change.policy.company.name,
    policyName: change.policy.name,
    sequence: index + 1,
    snapshotVersion: change.newSnapshot.version,
    risk: change.overallRisk,
  }));

  const scores = points.map((point) => point.score);
  if (scores.length === 0) {
    return {
      points,
      summary: {
        count: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        latestScore: 0,
        firstScore: 0,
        delta: 0,
      },
    };
  }

  const firstScore = scores[0];
  const latestScore = scores[scores.length - 1];
  return {
    points,
    summary: {
      count: scores.length,
      avgScore: roundToOneDecimal(scores.reduce((total, score) => total + score, 0) / scores.length),
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      latestScore,
      firstScore,
      delta: roundToOneDecimal(latestScore - firstScore),
    },
  };
}
