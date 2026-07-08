import { describe, expect, it } from 'vitest';
import { buildLeaderboard, type LeaderboardCompanyInput } from '../leaderboard';

const now = new Date('2026-07-06T10:00:00.000Z');

function company(overrides: Partial<LeaderboardCompanyInput>): LeaderboardCompanyInput {
  return {
    id: overrides.id || 'company-1',
    name: overrides.name || 'Example',
    slug: overrides.slug || 'example',
    industry: overrides.industry || 'Tech',
    website: overrides.website || 'https://example.com',
    policies: overrides.policies || [],
  };
}

describe('buildLeaderboard', () => {
  it('does not treat seeded inventory as public verified evidence', () => {
    const snapshot = buildLeaderboard([
      company({
        policies: [
          {
            id: 'policy-1',
            name: 'Privacy Policy',
            type: 'privacy',
            jurisdiction: 'Global',
            dataStatus: 'Available',
            ingestionMethod: 'Seeded',
            lastSuccessfulCheckDate: now,
            snapshots: [{ publicEvidence: true }],
            checkLogs: [{ source: 'seeded', textHash: null, checkedAt: now }],
            changes: [],
          },
        ],
      }),
    ], now);

    expect(snapshot.rows[0].verifiedPolicyCount).toBe(0);
    expect(snapshot.rows[0].suspendedPolicyCount).toBe(1);
    expect(snapshot.rows[0].tier).toBe('Suspended');
    expect(snapshot.summary.verifiedPolicyCount).toBe(0);
  });

  it('caps the evidence index below absolute certainty', () => {
    const snapshot = buildLeaderboard([
      company({
        policies: [
          {
            id: 'policy-1',
            name: 'Privacy Policy',
            type: 'privacy',
            jurisdiction: 'Global',
            dataStatus: 'Available',
            ingestionMethod: 'Direct scrape',
            lastSuccessfulCheckDate: now,
            snapshots: [{ publicEvidence: true }],
            checkLogs: [{ source: 'direct', textHash: 'abc', checkedAt: now }],
            changes: [{ id: 'change-1', overallScore: 8, overallRisk: 'High', createdAt: now }],
          },
          {
            id: 'policy-2',
            name: 'Terms',
            type: 'terms',
            jurisdiction: 'Global',
            dataStatus: 'Reviewed',
            ingestionMethod: 'Rendered scrape',
            lastSuccessfulCheckDate: now,
            snapshots: [{ publicEvidence: true }],
            checkLogs: [{ source: 'rendered', textHash: 'def', checkedAt: now }],
            changes: [],
          },
        ],
      }),
    ], now);

    expect(snapshot.rows[0].evidenceIndex).toBe(99);
    expect(snapshot.methodology.indexFormula.join(' ')).toContain('capped at 99');
  });

  it('keeps suspended sources in the attention board instead of the movement board', () => {
    const snapshot = buildLeaderboard([
      company({
        name: 'Needs Review Corp',
        slug: 'needs-review',
        policies: [
          {
            id: 'policy-1',
            name: 'Privacy Policy',
            type: 'privacy',
            jurisdiction: 'EU',
            dataStatus: 'Needs Review',
            ingestionMethod: 'None',
            snapshots: [],
            checkLogs: [{ source: 'none', status: 'Unavailable', checkedAt: now }],
            changes: [],
          },
        ],
      }),
    ], now);

    expect(snapshot.boards.attention).toHaveLength(1);
    expect(snapshot.boards.movement).toHaveLength(0);
    expect(snapshot.boards.attention[0].name).toBe('Needs Review Corp');
  });

  it('orders movement rows by public change count and signal', () => {
    const snapshot = buildLeaderboard([
      company({
        id: 'a',
        name: 'Alpha',
        slug: 'alpha',
        policies: [
          {
            id: 'alpha-policy',
            name: 'Privacy',
            type: 'privacy',
            jurisdiction: 'Global',
            dataStatus: 'Available',
            ingestionMethod: 'Direct scrape',
            snapshots: [{ publicEvidence: true }],
            checkLogs: [{ source: 'direct', textHash: 'alpha-hash', checkedAt: now }],
            changes: [{ id: 'alpha-change', overallScore: 6, overallRisk: 'Medium', createdAt: now }],
          },
        ],
      }),
      company({
        id: 'b',
        name: 'Beta',
        slug: 'beta',
        policies: [
          {
            id: 'beta-policy',
            name: 'Privacy',
            type: 'privacy',
            jurisdiction: 'Global',
            dataStatus: 'Available',
            ingestionMethod: 'Rendered scrape',
            snapshots: [{ publicEvidence: true }],
            checkLogs: [{ source: 'rendered', textHash: 'beta-hash', checkedAt: now }],
            changes: [
              { id: 'beta-change-1', overallScore: 4, overallRisk: 'Medium', createdAt: now },
              { id: 'beta-change-2', overallScore: 7, overallRisk: 'High', createdAt: now },
            ],
          },
        ],
      }),
    ], now);

    expect(snapshot.boards.movement[0].name).toBe('Beta');
    expect(snapshot.boards.movement[0].publicChangeCount).toBe(2);
    expect(snapshot.summary.rendererBackedPolicyCount).toBe(1);
  });
});
