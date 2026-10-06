/** One document taxonomy and scope contract shared by UI, APIs and exports. */
export const DOCUMENT_TYPES = ['privacy', 'terms', 'ai', 'dpa', 'aup', 'community'] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { en: string; it: string }> = {
  privacy: { en: 'Privacy policies', it: 'Informative privacy' },
  terms: { en: 'Terms of service', it: 'Termini di servizio' },
  ai: { en: 'AI terms', it: 'Termini AI' },
  dpa: { en: 'Data processing agreements', it: 'Accordi trattamento dati' },
  aup: { en: 'Acceptable use policies', it: 'Uso accettabile' },
  community: { en: 'Community guidelines', it: 'Linee guida community' },
};
export function isDocumentTypes(value: unknown): value is DocumentType[] {
  return Array.isArray(value) && value.length > 0 && value.length <= DOCUMENT_TYPES.length &&
    value.every(v => DOCUMENT_TYPES.includes(v as DocumentType)) && new Set(value).size === value.length;
}
export function canonicalDocumentTypes(types: readonly DocumentType[] = DOCUMENT_TYPES): DocumentType[] {
  return DOCUMENT_TYPES.filter(type => types.includes(type));
}
export function documentTypesQuery(types?: readonly DocumentType[]): string {
  return canonicalDocumentTypes(types).join(',');
}
/** Invalid explicit scopes fail closed; absence retains the complete inventory. */
export function parseDocumentTypes(value: string | null): DocumentType[] | null {
  if (value === null) return [...DOCUMENT_TYPES];
  const parts = value.split(',');
  return isDocumentTypes(parts) ? canonicalDocumentTypes(parts) : null;
}
export function documentTypeWhere(types: readonly DocumentType[]) {
  return types.length === DOCUMENT_TYPES.length ? {} : { type: { in: [...types] } };
}
export function matchesDocumentType(type: string, types: readonly DocumentType[] = DOCUMENT_TYPES) {
  return types.length === DOCUMENT_TYPES.length || types.includes(type as DocumentType);
}
export function documentScopeLabel(types: readonly DocumentType[] = DOCUMENT_TYPES, lang: 'en' | 'it' = 'en') {
  return types.length === DOCUMENT_TYPES.length ? (lang === 'it' ? 'Tutti i documenti' : 'All documents') :
    canonicalDocumentTypes(types).map(type => DOCUMENT_TYPE_LABELS[type][lang]).join(' + ');
}
type ScoredPolicy = { type: string; changes: readonly { overallScore: number }[] };
/** Average within type, then across types. A company with more URLs gets no extra weight. */
export function typeBalancedScore(policies: readonly ScoredPolicy[]): number | null {
  const groups = new Map<string, number[]>();
  for (const policy of policies) {
    const score = policy.changes[0]?.overallScore;
    if (!Number.isFinite(score) || score < 1 || score > 10) continue;
    groups.set(policy.type, [...(groups.get(policy.type) || []), score]);
  }
  const means = [...groups.values()].map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);
  return means.length ? means.reduce((a, b) => a + b, 0) / means.length : null;
}
export function documentCoverage(policies: readonly ScoredPolicy[], types: readonly DocumentType[] = DOCUMENT_TYPES) {
  const availableTypes = canonicalDocumentTypes(types).filter(type => policies.some(p => p.type === type));
  const assessedTypes = availableTypes.filter(type => policies.some(p => p.type === type &&
    Number.isFinite(p.changes[0]?.overallScore) && p.changes[0].overallScore >= 1 && p.changes[0].overallScore <= 10));
  return { requestedTypes: canonicalDocumentTypes(types), availableTypes, assessedTypes,
    missingTypes: canonicalDocumentTypes(types).filter(type => !availableTypes.includes(type)),
    unassessedTypes: availableTypes.filter(type => !assessedTypes.includes(type)),
    complete: assessedTypes.length === types.length };
}
