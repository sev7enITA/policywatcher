import { describe, expect, it } from 'vitest';
import {
  ASSOCIATION_VERTICAL_BOUNDARY,
  buildAssociationDigestMarkdown,
  buildAssociationRadarItems,
  classifyAssociationThemes,
  getAssociationAttention,
  getAssociationSourceStage,
  matchesAssociationContext,
  summarizeAssociationRadar,
  type AssociationEvidenceInput,
} from '../associationVertical';

function evidence(overrides: Partial<AssociationEvidenceInput> = {}): AssociationEvidenceInput {
  return {
    id: '8a94ce6b-4415-4d62-83d2-e87a4040ae62',
    createdAt: '2026-08-05T10:00:00.000Z',
    overallRisk: 'Medium',
    overallScore: 6,
    summary: 'The privacy policy adds data processing for generative AI model training.',
    sourceState: 'verified-retrieval',
    policy: {
      id: 'policy-1',
      name: 'Privacy Policy',
      type: 'privacy',
      jurisdiction: 'EU',
      dataStatus: 'Available',
      company: {
        name: 'Example Service',
        slug: 'example-service',
        industry: 'Technology',
      },
    },
    ...overrides,
  };
}

describe('consumer-association vertical', () => {
  it('classifies civic themes deterministically and falls back to transparency', () => {
    expect(classifyAssociationThemes(evidence())).toEqual([
      'privacy-dati',
      'intelligenza-artificiale',
    ]);

    expect(classifyAssociationThemes(evidence({
      summary: 'A short public statement changed.',
      policy: {
        ...evidence().policy,
        name: 'Public statement',
        type: 'notice',
      },
    }))).toEqual(['trasparenza']);
  });

  it('never promotes an unverified retrieval to the priority signal', () => {
    expect(getAssociationSourceStage('verified-retrieval')).toBe('fonte-verificata');
    expect(getAssociationSourceStage('review-required')).toBe('revisione-richiesta');
    expect(getAssociationSourceStage('unknown')).toBe('stato-non-registrato');
    expect(getAssociationAttention('High', 'review-required')).toBe('da-valutare');
    expect(getAssociationAttention('High', 'verified-retrieval')).toBe('prioritaria');
  });

  it('builds evidence links, bounded questions and priority-first ordering', () => {
    const lowerPriority = evidence({
      id: '1af02c98-d563-4cf8-8148-b5342af3f138',
      createdAt: '2026-08-06T10:00:00.000Z',
      overallRisk: 'Low',
      summary: null,
    });
    const items = buildAssociationRadarItems([lowerPriority, evidence({ overallRisk: 'High' })]);

    expect(items).toHaveLength(2);
    expect(items[0].attention).toBe('prioritaria');
    expect(items[0].evidenceHref).toContain(items[0].id);
    expect(items[0].changeHref).toContain('lang=it');
    expect(items[0].citizenQuestions.length).toBeGreaterThan(0);
    expect(items[0].citizenQuestions.length).toBeLessThanOrEqual(3);
    expect(items[1].summary).toContain('Sintesi non disponibile');
    expect(items[0].sourceBoundary).toBe(ASSOCIATION_VERTICAL_BOUNDARY);
  });

  it('summarizes only the received public catalog', () => {
    const items = buildAssociationRadarItems([
      evidence({ overallRisk: 'High' }),
      evidence({
        id: '1af02c98-d563-4cf8-8148-b5342af3f138',
        sourceState: 'review-required',
        policy: {
          ...evidence().policy,
          company: { ...evidence().policy.company, name: 'Second Service', slug: 'second-service' },
        },
      }),
    ]);

    expect(summarizeAssociationRadar(items)).toMatchObject({
      records: 2,
      companies: 2,
      verifiedSources: 1,
      reviewRequired: 1,
      priorityItems: 1,
    });
  });

  it('exports a review digest without turning local state into a publication claim', () => {
    const [item] = buildAssociationRadarItems([evidence()]);
    const digest = buildAssociationDigestMarkdown(
      [item],
      { [item.id]: 'pronto-per-pubblicazione' },
      new Date('2026-08-06T12:00:00.000Z'),
      { country: 'it', regulatoryArea: 'privacy-data', organizationType: 'privacy' },
    );

    expect(digest).toContain('# PolicyWatcher Civico - digest di revisione');
    expect(digest).toContain('Pronte per pubblicazione locale: 1');
    expect(digest).toContain('https://policywatcher.online/evidence/');
    expect(digest).toContain(ASSOCIATION_VERTICAL_BOUNDARY);
    expect(digest).toContain('Paese di lavoro: Italia');
    expect(digest).toContain('Area normativa: Privacy e dati');
    expect(digest).toContain('Tipo di associazione: Privacy e protezione dati');
    expect(digest).not.toContain('certifica la conformita');
  });

  it('builds an English radar and digest without Italian fallback copy', () => {
    const [item] = buildAssociationRadarItems([evidence({ summary: null })], 'en');
    const digest = buildAssociationDigestMarkdown(
      [item],
      { [item.id]: 'in-revisione' },
      new Date('2026-08-06T12:00:00.000Z'),
      { country: 'us', regulatoryArea: 'privacy-data', organizationType: 'digital-rights' },
      'en',
    );

    expect(item.summary).toContain('Summary unavailable');
    expect(item.changeHref).toContain('lang=en');
    expect(item.citizenQuestions.join(' ')).toContain('data categories');
    expect(digest).toContain('# PolicyWatcher Civic - review digest');
    expect(digest).toContain('Working country: United States');
    expect(digest).toContain('Regulatory area: Privacy and data');
    expect(digest).toContain('Organization type: Digital rights');
    expect(digest).not.toContain('Sintesi non disponibile');
  });

  it('applies country and association contexts without inventing national coverage', () => {
    const [euItem] = buildAssociationRadarItems([evidence()]);
    const [globalPrivacyItem] = buildAssociationRadarItems([evidence({
      id: '1af02c98-d563-4cf8-8148-b5342af3f138',
      policy: { ...evidence().policy, jurisdiction: 'Global' },
    })]);
    const [globalGeneralItem] = buildAssociationRadarItems([evidence({
      id: '2bf13d09-e674-4cf8-8148-b5342af3f139',
      summary: 'A short public statement changed.',
      policy: { ...evidence().policy, name: 'Public statement', type: 'notice', jurisdiction: 'Global' },
    })]);

    expect(matchesAssociationContext(euItem, {
      country: 'it',
      regulatoryArea: 'privacy-data',
      organizationType: 'privacy',
    })).toBe(true);
    expect(matchesAssociationContext(euItem, {
      country: 'us',
      regulatoryArea: 'all',
      organizationType: 'all',
    })).toBe(false);
    expect(matchesAssociationContext(globalPrivacyItem, {
      country: 'gb',
      regulatoryArea: 'privacy-data',
      organizationType: 'digital-rights',
    })).toBe(true);
    expect(matchesAssociationContext(globalGeneralItem, {
      country: 'ca',
      regulatoryArea: 'minors-online',
      organizationType: 'children',
    })).toBe(false);
  });
});
