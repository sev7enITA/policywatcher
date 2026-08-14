import { describe, expect, it } from 'vitest';
import {
  KPI_ALLOWED_VALUES,
  NOT_ASSESSED_KPI_VALUE,
  getKpiConcernLevel,
  getMoreConcerningKpiValue,
  isAssessedKpiValue,
} from '../metricsCatalog';

describe('KPI metric catalog', () => {
  it('derives the accepted vocabulary in concern order', () => {
    expect(KPI_ALLOWED_VALUES.kpiDataCollection).toEqual([
      'Minimal',
      'Moderate',
      'Extensive',
    ]);
    expect(KPI_ALLOWED_VALUES.kpiBreachNotification).toEqual([
      'Within 24h',
      'Within 72h',
      'Unspecified',
    ]);
  });

  it('uses field-specific concern semantics for the same display value', () => {
    expect(getKpiConcernLevel('kpiRightToDeletion', 'Partial')).toBe('moderate');
    expect(getKpiConcernLevel('kpiRegulatoryCompliance', 'Partial')).toBe('moderate');
    expect(getKpiConcernLevel('kpiDataRetention', 'Defined')).toBe('lower');
    expect(getKpiConcernLevel('kpiAiBiasFairness', 'Absent')).toBe('higher');
  });

  it('keeps missing assessment distinct from a low-concern result', () => {
    expect(isAssessedKpiValue(NOT_ASSESSED_KPI_VALUE)).toBe(false);
    expect(isAssessedKpiValue('  not assessed ')).toBe(false);
    expect(isAssessedKpiValue(null)).toBe(false);
    expect(getKpiConcernLevel('kpiDataCollection', NOT_ASSESSED_KPI_VALUE)).toBe('pending');
  });

  it('selects the more concerning field value and keeps stable ties', () => {
    expect(
      getMoreConcerningKpiValue('kpiDataCollection', 'Minimal', 'Extensive')
    ).toBe('Extensive');
    expect(
      getMoreConcerningKpiValue('kpiBreachNotification', 'Within 24h', 'Within 72h')
    ).toBe('Within 24h');
    expect(
      getMoreConcerningKpiValue(
        'kpiThirdPartySharing',
        NOT_ASSESSED_KPI_VALUE,
        'Limited'
      )
    ).toBe('Limited');
  });
});
