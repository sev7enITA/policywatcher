import type { ChangeFeed } from './changeEvent';

const ids = [
  '5a20e7d0-39bd-4c21-8a60-7165a8c7d1aa',
  '8cbdf7f5-8d32-4bf3-b0d2-0d0bcdaf4267',
  '02c7cab3-18fb-40c0-a204-37e1fc6cf5f8',
] as const;

export function demoFeed(locale: 'it' | 'en'): ChangeFeed {
  const content: readonly (readonly [string, string, string])[] = locale === 'it'
    ? [
        ['Acme Cloud', 'Termini del servizio cloud', 'Aggiornata la sezione sulla portabilità dei dati e sulle finestre di esportazione.'],
        ['NordPay', 'Informativa privacy consumatori', 'Chiariti i tempi di conservazione per i controlli antifrode e i canali di opposizione.'],
        ['Orbit Social', 'Standard della community', 'Rivisti i criteri pubblicati per moderazione e ricorso sui contenuti sintetici.'],
      ]
    : [
        ['Acme Cloud', 'Cloud service terms', 'The published data portability section and export windows were updated.'],
        ['NordPay', 'Consumer privacy notice', 'Retention windows for fraud checks and objection channels were clarified.'],
        ['Orbit Social', 'Community standards', 'Published moderation and appeal criteria for synthetic content were revised.'],
      ];
  const risks = ['High', 'Medium', 'Low'] as const;
  const scores = [86, 58, 24];
  return {
    schemaVersion: '1.0.0',
    mode: 'forward-polling',
    locale,
    boundary: locale === 'it'
      ? 'Dati dimostrativi locali: non rappresentano pubblicazioni correnti.'
      : 'Local demonstration data: these are not current publications.',
    events: ids.map((changeId, index) => ({
      eventId: `demo_${index + 1}`,
      occurredAt: new Date(Date.UTC(2026, 7, 18 - index, 10 + index, 20)).toISOString(),
      changeId,
      company: { id: `company_${index + 1}`, name: content[index]![0], slug: `demo-company-${index + 1}`, industry: index === 0 ? 'Cloud' : index === 1 ? 'Payments' : 'Social media' },
      policy: { id: `policy_${index + 1}`, name: content[index]![1], type: 'Public policy', jurisdiction: index === 1 ? 'EU' : 'Global' },
      screening: {
        overallRisk: risks[index]!,
        overallScore: scores[index]!,
        summary: content[index]![2],
        boundary: locale === 'it' ? 'Screening assistito da AI per revisione umana; non è un parere legale.' : 'AI-assisted screening for human review; not a legal opinion.',
      },
      links: {
        change: `https://policywatcher.online/change/${changeId}`,
        evidence: `https://policywatcher.online/evidence/${changeId}`,
        evidenceJson: `https://policywatcher.online/api/evidence-packet/${changeId}?format=json`,
      },
    })),
  };
}
