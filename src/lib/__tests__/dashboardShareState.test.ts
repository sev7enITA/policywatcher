import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_SHARE_SCHEMA,
  DEFAULT_DASHBOARD_SHARE_STATE,
  decodeDashboardShareQuery,
  encodeDashboardShareQuery,
} from '../dashboardShareState';

describe('dashboard share state', () => {
  it('round-trips a configured evidence view through a canonical query', () => {
    const state = {
      ...DEFAULT_DASHBOARD_SHARE_STATE,
      industry: 'AI Provider',
      risk: 'High' as const,
      region: 'Global' as const,
      perspective: 'Enterprise' as const,
      dateRange: '30d' as const,
      search: 'model training',
      sortBy: 'date-desc' as const,
      lang: 'it' as const,
    };

    const query = encodeDashboardShareQuery('intent=research&depth=operational', state);
    expect(query).toBe(
      'audience=Enterprise&depth=operational&dv=1&industry=AI+Provider&intent=research&lang=it&q=model+training&range=30d&region=Global&risk=High&sort=date-desc',
    );

    const decoded = decodeDashboardShareQuery(query);
    expect(decoded.hasDashboardParams).toBe(true);
    expect(decoded.issues).toEqual([]);
    expect(decoded.state).toEqual(state);
  });

  it('omits defaults and preserves unrelated route state', () => {
    expect(
      encodeDashboardShareQuery(
        'intent=citizen&depth=snapshot&dv=9&risk=High',
        { ...DEFAULT_DASHBOARD_SHARE_STATE },
      ),
    ).toBe('depth=snapshot&intent=citizen');
  });

  it('keeps valid fields and fails invalid values closed to defaults', () => {
    const decoded = decodeDashboardShareQuery(
      `dv=${DASHBOARD_SHARE_SCHEMA}&risk=Critical&region=US&audience=Board&q=${'x'.repeat(201)}&sort=random`,
    );

    expect(decoded.state.region).toBe('US');
    expect(decoded.state.risk).toBe(DEFAULT_DASHBOARD_SHARE_STATE.risk);
    expect(decoded.state.perspective).toBe(DEFAULT_DASHBOARD_SHARE_STATE.perspective);
    expect(decoded.state.search).toBe('');
    expect(decoded.state.sortBy).toBe(DEFAULT_DASHBOARD_SHARE_STATE.sortBy);
    expect(decoded.issues).toHaveLength(4);
  });

  it('recognizes a share link even when it contains only the schema marker', () => {
    expect(decodeDashboardShareQuery('dv=1').hasDashboardParams).toBe(true);
  });
});
