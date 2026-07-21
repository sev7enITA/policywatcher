import { describe, expect, it } from 'vitest';
import {
  canPublishSourceOnboardingItem,
  evaluateSourceOnboardingQa,
  normalizeSourceSlug,
  prepareSourceOnboardingRows,
  summarizeSourceOnboardingBatch,
  summarizeSourceOnboardingPipeline,
  transitionSourceOnboardingStage,
} from '../sourceOnboarding';

const HEADER = 'companyName,companySlug,industry,website,policyName,policyType,policyUrl,jurisdiction';

describe('source onboarding parsing and normalization', () => {
  it('parses CSV, derives a slug, and normalizes values', () => {
    const preview = prepareSourceOnboardingRows([
      HEADER,
      'Acme S.p.A.,,FinTech,https://acme.example,Privacy Policy,PRIVACY,https://acme.example/privacy,global',
    ].join('\n'));

    expect(preview.errors).toEqual([]);
    expect(preview.readyCount).toBe(1);
    expect(preview.rows[0]).toMatchObject({
      companySlug: 'acme-s-p-a',
      policyType: 'privacy',
      jurisdiction: 'Global',
      ready: true,
    });
  });

  it('parses TSV and quoted delimiter fields', () => {
    const preview = prepareSourceOnboardingRows([
      HEADER.replaceAll(',', '\t'),
      'Example Inc.\texample\tTech Giant\thttps://example.com\t"Terms, Global"\tterms\thttps://example.com/terms\tUS',
    ].join('\n'));

    expect(preview.rows[0].policyName).toBe('Terms, Global');
    expect(preview.rows[0].ready).toBe(true);
  });

  it('rejects private URLs and unsupported controlled values', () => {
    const preview = prepareSourceOnboardingRows([
      HEADER,
      'Local Corp,local,Unknown,http://127.0.0.1,Privacy,privacy,http://localhost/privacy,Mars',
    ].join('\n'));

    expect(preview.invalidCount).toBe(1);
    expect(preview.rows[0].errors.join(' ')).toContain('private or local host');
    expect(preview.rows[0].errors.join(' ')).toContain('Industry must be one of');
    expect(preview.rows[0].errors.join(' ')).toContain('Jurisdiction must be one of');
  });

  it('marks duplicate company/type/jurisdiction rows within one input', () => {
    const preview = prepareSourceOnboardingRows([
      HEADER,
      'Acme,acme,FinTech,https://acme.example,Privacy,privacy,https://acme.example/privacy,Global',
      'Acme,acme,FinTech,https://acme.example,Another Privacy,privacy,https://acme.example/privacy-v2,Global',
    ].join('\n'));

    expect(preview.readyCount).toBe(1);
    expect(preview.rows[1]).toMatchObject({ duplicate: true, ready: false });
  });

  it('normalizes Unicode company names into stable slugs', () => {
    expect(normalizeSourceSlug('', 'Crème & Co.')).toBe('creme-co');
  });
});

describe('source onboarding state machine', () => {
  it('permits only accountable stage transitions', () => {
    expect(transitionSourceOnboardingStage('Proposed', 'start-review')).toBe('OfficialReview');
    expect(transitionSourceOnboardingStage('OfficialReview', 'approve-source')).toBe('BaselinePending');
    expect(transitionSourceOnboardingStage('BaselinePending', 'baseline-captured')).toBe('QaReview');
    expect(transitionSourceOnboardingStage('Ready', 'publish')).toBe('Published');
    expect(transitionSourceOnboardingStage('Proposed', 'publish')).toBeNull();
    expect(transitionSourceOnboardingStage('Rejected', 'approve-source')).toBeNull();
  });

  it('attributes terminal outcomes to their stopping stage and reconciles failed imports', () => {
    const summary = summarizeSourceOnboardingPipeline([
      { stage: 'Proposed' },
      { stage: 'Rejected', policyId: null },
      { stage: 'BaselinePending', policyId: 'policy-1' },
      { stage: 'QaReview', policyId: 'policy-2' },
      { stage: 'Rejected', policyId: 'policy-3' },
      { stage: 'Published', policyId: 'policy-4' },
      { stage: 'Failed' },
    ]);

    expect(summary).toMatchObject({
      proposed: 1,
      officialReview: 1,
      rejectedAtReview: 1,
      baseline: 1,
      qa: 1,
      publication: 2,
      rejectedAtPublication: 1,
      failed: 1,
      accounted: 7,
    });
  });

  it('reopens a previously completed batch when held evidence returns to QA review', () => {
    expect(summarizeSourceOnboardingBatch(['Held', 'Published'])).toMatchObject({
      status: 'Completed',
      terminal: true,
    });
    expect(summarizeSourceOnboardingBatch(['QaReview', 'Published'])).toMatchObject({
      status: 'Active',
      terminal: false,
    });
  });

  it('keeps an empty batch active instead of reporting a false all-items failure', () => {
    expect(summarizeSourceOnboardingBatch([])).toEqual({
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0,
      status: 'Active',
      terminal: false,
    });
  });

  it('distinguishes all-failed, partial, and completed terminal batches', () => {
    expect(summarizeSourceOnboardingBatch(['Failed', 'Failed']).status).toBe('Failed');
    expect(summarizeSourceOnboardingBatch(['Failed', 'Proposed']).status).toBe('Partial');
    expect(summarizeSourceOnboardingBatch(['Published', 'Held', 'Rejected']).status).toBe('Completed');
  });
});

describe('source onboarding QA and publication', () => {
  const passingEvidence = {
    policyId: 'policy-1',
    policyUrl: 'https://legal.example.com/privacy',
    ingestionMethod: 'Direct Scrape',
    dataStatus: 'Available',
    currentHash: 'abc123',
    snapshot: { text: 'Official privacy policy evidence.', hash: 'abc123' },
    checkLog: {
      status: 'Available',
      source: 'direct',
      finalUrl: 'https://legal.example.com/privacy/latest',
      textHash: 'abc123',
      textLength: 33,
    },
  };

  it('passes complete source-grade evidence', () => {
    const result = evaluateSourceOnboardingQa(passingEvidence);

    expect(result.status).toBe('Pass');
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it('fails seeded, empty, hash-drifted, or source-drifted evidence', () => {
    const result = evaluateSourceOnboardingQa({
      ...passingEvidence,
      ingestionMethod: 'Seeded',
      currentHash: 'different',
      snapshot: { text: '', hash: 'abc123' },
      checkLog: { ...passingEvidence.checkLog, finalUrl: 'https://unrelated.example.net/privacy' },
    });

    expect(result.status).toBe('Fail');
    expect(result.checks.filter((check) => !check.passed).map((check) => check.id)).toEqual(
      expect.arrayContaining(['non-seeded-ingestion', 'non-empty-evidence', 'hash-consistency', 'source-continuity'])
    );
  });

  it('allows publication only after QA in Ready or Held state', () => {
    expect(canPublishSourceOnboardingItem({ stage: 'Ready', qaStatus: 'Pass' })).toBe(true);
    expect(canPublishSourceOnboardingItem({ stage: 'Held', qaStatus: 'Pass' })).toBe(true);
    expect(canPublishSourceOnboardingItem({ stage: 'QaReview', qaStatus: 'Pass' })).toBe(false);
    expect(canPublishSourceOnboardingItem({ stage: 'Ready', qaStatus: 'Fail' })).toBe(false);
  });
});
