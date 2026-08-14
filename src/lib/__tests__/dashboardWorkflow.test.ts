import { describe, expect, it } from 'vitest';
import { buildDashboardTodayItems, DASHBOARD_WORKFLOW_SCHEMA } from '../dashboardWorkflow';

describe('dashboard workflow hierarchy', () => {
  it('caps Oggi at three actions and collapses source failures into one QA action', () => {
    const items = buildDashboardTodayItems({
      lang: 'it',
      suspendedSources: 50,
      changes: [
        { id: 'low', createdAt: '2026-08-06T08:00:00.000Z', overallRisk: 'Low', overallScore: 2, company: 'Low Co', policy: 'Terms' },
        { id: 'high', createdAt: '2026-08-05T08:00:00.000Z', overallRisk: 'High', overallScore: 9, company: 'High Co', policy: 'Privacy' },
        { id: 'medium', createdAt: '2026-08-06T09:00:00.000Z', overallRisk: 'Medium', overallScore: 6, company: 'Medium Co', policy: 'AI' },
      ],
    });

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ schema: DASHBOARD_WORKFLOW_SCHEMA, kind: 'source-qa' });
    expect(items[0].description).toContain('50 sorgenti');
    expect(items.filter((item) => item.kind === 'source-qa')).toHaveLength(1);
    expect(items[1].title).toContain('High Co');
    expect(items[2].kind).toBe('civic');
  });

  it('uses two ranked changes when QA has no suspended sources', () => {
    const items = buildDashboardTodayItems({
      lang: 'en',
      suspendedSources: 0,
      changes: [
        { id: 'older-high', createdAt: '2026-08-04T08:00:00.000Z', overallRisk: 'High', overallScore: 8, company: 'A', policy: 'Privacy' },
        { id: 'newer-high', createdAt: '2026-08-06T08:00:00.000Z', overallRisk: 'High', overallScore: 8, company: 'B', policy: 'Terms' },
        { id: 'medium', createdAt: '2026-08-06T09:00:00.000Z', overallRisk: 'Medium', overallScore: 7, company: 'C', policy: 'AI' },
      ],
    });

    expect(items.map((item) => item.id)).toEqual(['change-newer-high', 'change-older-high', 'civic-workspace']);
  });

  it('keeps an orientation action when the public change feed is empty', () => {
    const items = buildDashboardTodayItems({ lang: 'it', suspendedSources: 0, changes: [] });
    expect(items.map((item) => item.kind)).toEqual(['orientation', 'civic']);
  });
});
