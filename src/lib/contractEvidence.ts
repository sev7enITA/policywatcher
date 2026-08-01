export const CONTRACT_SELECTION_MAX_CHARACTERS = 12_000;

export const CONTRACT_EVIDENCE_TOPICS = [
  { id: 'privacy', label: 'Privacy and personal data', pattern: /\b(privacy|personal data|personal information|data subject|gdpr|dati personali|privacy)\b/gi },
  { id: 'ai', label: 'Artificial intelligence', pattern: /\b(artificial intelligence|generative ai|machine learning|automated decision|ai system|intelligenza artificiale|sistema di ia)\b/gi },
  { id: 'security', label: 'Information security', pattern: /\b(information security|cybersecurity|security incident|data breach|encryption|sicurezza informatica|violazione dei dati)\b/gi },
  { id: 'data-transfer', label: 'International data transfer', pattern: /\b(international transfer|cross-border transfer|standard contractual clauses|sccs?|trasferimento internazionale|clausole contrattuali standard)\b/gi },
  { id: 'retention', label: 'Retention and deletion', pattern: /\b(retention|delete|deletion|erase|erasure|conservazione|cancellazione)\b/gi },
  { id: 'subprocessors', label: 'Subprocessors and third parties', pattern: /\b(subprocessor|sub-processor|third party|service provider|subresponsabile|terza parte|fornitore)\b/gi },
  { id: 'audit', label: 'Audit and evidence rights', pattern: /\b(audit|inspection|records|evidence|verification|ispezione|registri|verifica)\b/gi },
  { id: 'liability', label: 'Liability and indemnity', pattern: /\b(liability|indemnity|limitation of liability|damages|responsabilit[aà]|indennizzo|risarcimento)\b/gi },
  { id: 'termination', label: 'Termination and suspension', pattern: /\b(termination|terminate|suspension|suspend|recesso|risoluzione|sospensione)\b/gi },
  { id: 'confidentiality', label: 'Confidentiality', pattern: /\b(confidential|confidentiality|non-disclosure|nda|riservat|confidenzial)\w*/gi },
  { id: 'intellectual-property', label: 'Intellectual property', pattern: /\b(intellectual property|copyright|license grant|ownership|propriet[aà] intellettuale|diritto d.autore|licenza)\b/gi },
  { id: 'governing-law', label: 'Governing law and disputes', pattern: /\b(governing law|jurisdiction|arbitration|dispute|legge applicabile|foro competente|arbitrato|controversia)\b/gi },
] as const;

export type ContractEvidenceTopicId = (typeof CONTRACT_EVIDENCE_TOPICS)[number]['id'];

export interface ContractEvidenceDerivation {
  characterCount: number;
  truncated: boolean;
  topics: { id: ContractEvidenceTopicId; label: string; matches: number }[];
  query: string;
}

export function deriveContractEvidenceQuery(rawSelection: string): ContractEvidenceDerivation {
  const normalized = rawSelection.replace(/\s+/g, ' ').trim();
  const truncated = normalized.length > CONTRACT_SELECTION_MAX_CHARACTERS;
  const localSelection = normalized.slice(0, CONTRACT_SELECTION_MAX_CHARACTERS);
  const topics = CONTRACT_EVIDENCE_TOPICS.flatMap((topic) => {
    const matches = localSelection.match(topic.pattern)?.length || 0;
    return matches ? [{ id: topic.id, label: topic.label, matches }] : [];
  }).sort((left, right) => right.matches - left.matches || left.label.localeCompare(right.label)).slice(0, 6);

  return {
    characterCount: normalized.length,
    truncated,
    topics,
    query: topics.map((topic) => topic.label).join(', '),
  };
}

export function getContractTopicLabel(id: ContractEvidenceTopicId) {
  return CONTRACT_EVIDENCE_TOPICS.find((topic) => topic.id === id)?.label || '';
}
