import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { presentShadowEvidence } from '../adaptiveAcquisition/presentation';
import { AdaptiveAcquisitionPanel } from '@/components/admin/AdaptiveAcquisitionPanel';

function summary(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'shadow', attempted: 4, persisted: 2, errors: 1, acquisitionErrors: 1,
    budgetSkipped: 8, outOfScope: 20, noCapture: 0, baselineMismatches: 1,
    unmatchedProductionCaptures: 1, dispositions: { identical: 3, extraction_differs: 1, out_of_scope: 2 },
    ...overrides,
  };
}
function project(overrides: Record<string, unknown> = {}) {
  return presentShadowEvidence({ scrapingShadow: summary(overrides) });
}
function render(metrics: unknown, status = 'completed') {
  return renderToStaticMarkup(createElement(AdaptiveAcquisitionPanel, {
    runs: [{ id: 'synthetic-run', status, startedAt: '2026-10-26T09:00:00Z', completedAt: '2026-10-26T09:05:00Z', metrics }],
  }));
}

describe('adaptive acquisition presentation boundary', () => {
  it.each([undefined, null, {}, { degradedDependencies: [] }])('keeps missing historical data unknown: %j', (metrics) => {
    expect(presentShadowEvidence(metrics)).toMatchObject({ state: 'unrecorded', counts: { attempted: null, persisted: null, errors: null } });
  });
  it.each([[], 4, 'raw error', { scrapingShadow: null }, { scrapingShadow: [] }, { scrapingShadow: {} }, { scrapingShadow: { mode: 'automatic' } }])('fails closed for malformed summaries: %j', (metrics) => {
    expect(presentShadowEvidence(metrics)).toMatchObject({ state: 'invalid', comparisonTotal: null, counts: { persisted: null } });
  });
  it.each(['attempted', 'persisted', 'errors', 'acquisitionErrors', 'outOfScope', 'budgetSkipped', 'noCapture', 'baselineMismatches', 'unmatchedProductionCaptures'])('validates the %s counter', (key) => {
    for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '2', null, undefined]) {
      expect(project({ [key]: value }).state).toBe('invalid');
    }
  });
  it('does not fabricate missing optional historical counters', () => {
    const evidence = presentShadowEvidence({ scrapingShadow: { mode: 'shadow', attempted: 2, persisted: 1, errors: 0 } });
    expect(evidence).toMatchObject({ state: 'shadow', partial: true, comparisonTotal: null, counts: { noCapture: null, acquisitionErrors: null, attempted: 2, errors: 0 } });
  });
  it('accepts the minimal disabled and configuration-error runtime contracts', () => {
    for (const mode of ['disabled', 'configuration_error']) {
      expect(presentShadowEvidence({ scrapingShadow: { mode, attempted: 0, persisted: 0, errors: mode === 'disabled' ? 0 : 1 } }))
        .toMatchObject({ state: mode, partial: false, counts: { acquisitionErrors: null, outOfScope: null }, comparisons: null });
    }
  });
  it('uses comparison counts independently of acquisitions and observations', () => {
    const result = project();
    expect(result).toMatchObject({ state: 'shadow', partial: false, comparisonTotal: 6,
      counts: { attempted: 4, persisted: 2, outOfScope: 20, budgetSkipped: 8 },
      comparisons: { out_of_scope: 2, identical: 3, extraction_differs: 1, both_rejected: 0 } });
  });
  it('accepts zero observations without inventing success or confidence', () => {
    const result = project({ attempted: 0, persisted: 0, errors: 0, acquisitionErrors: 0, baselineMismatches: 0, unmatchedProductionCaptures: 0, dispositions: {} });
    expect(result).toMatchObject({ state: 'shadow', comparisonTotal: 0, counts: { persisted: 0 } });
    expect(result).not.toHaveProperty('confidence');
  });
  it.each([
    { persisted: 5 }, { errors: 5 }, { noCapture: 5 }, { acquisitionErrors: 5 },
    { baselineMismatches: 5 }, { unmatchedProductionCaptures: 5 },
    { noCapture: 1 }, { dispositions: { identical: 7 } }, { dispositions: {} },
    { mode: 'disabled', attempted: 1 }, { mode: 'configuration_error', attempted: 0, persisted: 1 },
  ])('rejects contradictory counters: %j', (overrides) => {
    expect(project(overrides).state).toBe('invalid');
  });
  it.each([null, [], { unknown_outcome: 1 }, { identical: -1 }, { identical: 1.1 }, { identical: NaN }, { identical: '1' }, { identical: Number.MAX_SAFE_INTEGER, out_of_scope: 1 }])('rejects unusable comparison distributions: %j', (dispositions) => {
    expect(project({ dispositions }).state).toBe('invalid');
  });
  it('keeps summary write failures separate from observer errors', () => {
    expect(project({ summaryWriteFailed: true })).toMatchObject({ state: 'shadow', summaryWriteFailed: true, counts: { errors: 1, persisted: 2 } });
    expect(project({ summaryWriteFailed: 'yes' }).state).toBe('invalid');
  });
  it('returns only whitelisted fields and never raw errors, private paths or captured text', () => {
    const result = presentShadowEvidence({ error: 'PRIVATE_METRICS_ERROR', scrapingShadow: summary({
      outputDirectory: '/private/captures', error: 'PRIVATE_OBSERVER_ERROR', text: 'PRIVATE_SOURCE_TEXT',
      config: { secret: 'PRIVATE_CONFIG' },
    }) });
    expect(result.state).toBe('shadow');
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE_|\/private\//);
    expect(Object.keys(result).sort()).toEqual(['comparisonTotal', 'comparisons', 'counts', 'partial', 'state', 'summaryWriteFailed']);
  });
});

describe('read-only adaptive evidence rendering', () => {
  it('keeps a failed scan separate from persisted shadow observations', () => {
    const html = render({ scrapingShadow: summary() }, 'failed');
    expect(html).toContain('Scan failed');
    expect(html).toContain('Shadow observation');
    expect(html).toContain('6 comparisons');
    expect(html).toContain('across 2 persisted observations');
    expect(html).toContain('Baseline retained');
    expect(html).toContain('No automatic promotion');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('%');
  });
  it('does not display a configuration error as an observer failure or zero acquisition errors', () => {
    const html = render({ scrapingShadow: { mode: 'configuration_error', attempted: 0, persisted: 0, errors: 1 } });
    expect(html).toContain('Configuration unavailable');
    expect(html).not.toContain('Observer errors');
    expect(html).not.toContain('Baseline acquisition errors');
  });
  it('explains absent historical data and empty run history', () => {
    expect(render(null)).toContain('No recorded shadow summary');
    expect(renderToStaticMarkup(createElement(AdaptiveAcquisitionPanel, { runs: [] }))).toContain('No scan runs are available');
  });
  it('explains zero observations and the separate summary-write failure', () => {
    const html = render({ scrapingShadow: summary({ attempted: 0, persisted: 0, errors: 0, acquisitionErrors: 0, baselineMismatches: 0, unmatchedProductionCaptures: 0, dispositions: {}, summaryWriteFailed: true }) });
    expect(html).toContain('No observations were attempted');
    expect(html).toContain('does not validate any candidate recipe');
    expect(html).toContain('Private summary not saved');
  });
  it('does not echo private values, unknown statuses or invalid dates into the panel', () => {
    const html = renderToStaticMarkup(createElement(AdaptiveAcquisitionPanel, { runs: [{
      id: 'safe-id', startedAt: 'PRIVATE_DATE', completedAt: 'PRIVATE_DATE', status: 'PRIVATE_STATUS',
      metrics: { scrapingShadow: { mode: 'PRIVATE_MODE', error: 'PRIVATE_ERROR' } },
    }] }));
    expect(html).not.toContain('PRIVATE_');
    expect(html).toContain('Not recorded');
    expect(html).toContain('Scan status unavailable');
  });
});
