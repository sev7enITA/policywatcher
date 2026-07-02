import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportToCSV, generatePolicyReport, triggerDownload } from '../exporters';
import type { Company, Policy, PolicyChange } from '@/types';

function makeChange(overrides: Partial<PolicyChange> = {}): PolicyChange {
  return {
    id: 'change-1',
    policyId: 'policy-1',
    oldSnapshotId: null,
    newSnapshotId: 'snapshot-1',
    diff: '+new',
    aiSummaryEn: 'English summary',
    aiSummaryIt: 'Riepilogo italiano',
    overallRisk: 'High',
    overallScore: 8,
    remediationsJson: JSON.stringify([
      {
        titleEn: 'Review source',
        titleIt: 'Rivedere fonte',
        descriptionEn: 'Check primary policy source.',
        descriptionIt: 'Controllare la fonte primaria.',
        actionUrl: 'https://example.com/policy',
        actionTextEn: 'Open source',
        actionTextIt: 'Apri fonte',
      },
    ]),
    aiTrainingOptOut: 'Available',
    aiDataScrapingRestricted: 'Limited',
    aiIpLicensing: 'User Retained',
    aiPromptRetention: 'Defined',
    createdAt: '2026-07-02T00:00:00.000Z',
    regionImpacts: [
      {
        id: 'impact-1',
        region: 'EU',
        perspective: 'Individual',
        impactAnalysisEn: 'EU individual impact',
        impactAnalysisIt: 'Impatto individuale EU',
        riskLevel: 'High',
        complianceNoteEn: 'Check GDPR source.',
        complianceNoteIt: 'Verificare fonte GDPR.',
      },
      {
        id: 'impact-2',
        region: 'US',
        perspective: 'Enterprise',
        impactAnalysisEn: 'US enterprise impact',
        impactAnalysisIt: 'Impatto enterprise US',
        riskLevel: 'Medium',
      },
    ],
    ...overrides,
  };
}

function makePolicy(change: PolicyChange | null = makeChange()): Policy {
  return {
    id: 'policy-1',
    companyId: 'company-1',
    name: 'Privacy Policy',
    type: 'privacy',
    url: 'https://example.com/privacy',
    jurisdiction: 'EU',
    currentText: 'policy text',
    currentHash: 'hash',
    dataStatus: 'Available',
    updatedAt: '2026-07-02T00:00:00.000Z',
    changes: change ? [change] : [],
  };
}

function makeCompany(policy: Policy = makePolicy()): Company {
  return {
    id: 'company-1',
    name: 'ExampleCo',
    slug: 'exampleco',
    logo: '#000',
    industry: 'Tech Giant',
    website: 'https://example.com',
    policies: [policy],
  };
}

function installDownloadDom() {
  const anchor = {
    href: '',
    download: '',
    click: vi.fn(),
  };
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const createElement = vi.fn(() => anchor);
  const createObjectURL = vi.fn(() => 'blob:policywatcher');
  const revokeObjectURL = vi.fn();

  vi.stubGlobal('document', {
    createElement,
    body: {
      appendChild,
      removeChild,
    },
  });
  vi.stubGlobal('URL', {
    createObjectURL,
    revokeObjectURL,
  });

  return { anchor, appendChild, removeChild, createElement, createObjectURL, revokeObjectURL };
}

describe('exporters', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('generates English and Italian policy report data from latest analysis', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'));
    const policy = makePolicy();
    const company = makeCompany(policy);

    const en = generatePolicyReport(policy, company, 'en');
    const it = generatePolicyReport(policy, company, 'it');

    expect(en?.generatedAt).toBe('2026-07-02T12:00:00.000Z');
    expect(en?.analysis.summaryTitle).toBe('Executive Summary');
    expect(en?.analysis.summary).toBe('English summary');
    expect(en?.analysis.aiGovernance).toEqual([
      { label: 'AI Training Opt-Out', value: 'Available' },
      { label: 'AI Data Scraping', value: 'Limited' },
      { label: 'AI IP Licensing', value: 'User Retained' },
      { label: 'Prompt Retention', value: 'Defined' },
    ]);
    expect(en?.regionImpacts[0]).toMatchObject({
      analysis: 'EU individual impact',
      complianceNote: 'Check GDPR source.',
    });
    expect(en?.remediations[0]).toMatchObject({
      title: 'Review source',
      actionText: 'Open source',
    });

    expect(it?.analysis.summaryTitle).toBe('Riepilogo Esecutivo');
    expect(it?.analysis.summary).toBe('Riepilogo italiano');
    expect(it?.regionImpacts[0]).toMatchObject({
      analysis: 'Impatto individuale EU',
      complianceNote: 'Verificare fonte GDPR.',
    });
    expect(it?.remediations[0]).toMatchObject({
      title: 'Rivedere fonte',
      actionText: 'Apri fonte',
    });
  });

  it('returns null when a policy has no analysis and falls back on invalid remediation JSON', () => {
    expect(generatePolicyReport(makePolicy(null), makeCompany(), 'en')).toBeNull();

    const report = generatePolicyReport(
      makePolicy(makeChange({ remediationsJson: '{not-json' })),
      makeCompany(),
      'en'
    );

    expect(report?.remediations).toEqual([]);
  });

  it('triggers a browser download for raw content', () => {
    const dom = installDownloadDom();

    triggerDownload('hello', 'hello.txt', 'text/plain');

    expect(dom.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(dom.anchor.href).toBe('blob:policywatcher');
    expect(dom.anchor.download).toBe('hello.txt');
    expect(dom.appendChild).toHaveBeenCalledWith(dom.anchor);
    expect(dom.anchor.click).toHaveBeenCalledTimes(1);
    expect(dom.removeChild).toHaveBeenCalledWith(dom.anchor);
    expect(dom.revokeObjectURL).toHaveBeenCalledWith('blob:policywatcher');
  });

  it('exports latest policy changes to CSV with regional risk columns', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'));
    const dom = installDownloadDom();

    exportToCSV([makeCompany()], 'audit-export');

    const blob = dom.createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(dom.anchor.download).toBe('audit-export-2026-07-02.csv');
    expect(dom.anchor.click).toHaveBeenCalledTimes(1);
  });

  it('skips policies without changes during CSV export', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'));
    const dom = installDownloadDom();

    exportToCSV([makeCompany(makePolicy(null))], 'empty-export');

    expect(dom.anchor.download).toBe('empty-export-2026-07-02.csv');
    expect(dom.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });
});
