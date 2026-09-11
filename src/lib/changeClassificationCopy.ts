import type { ChangeClassification, ChangeClassificationReason, ChangeKind } from './changeClassificationTypes';

export const CHANGE_KIND_LABELS: Record<'en' | 'it', Record<ChangeKind, string>> = {
  en: { substantive: 'Potentially substantive', editorial: 'Editorial revision', unchanged: 'Unchanged content', needs_review: 'Needs verification' },
  it: { substantive: 'Possibile modifica sostanziale', editorial: 'Revisione editoriale', unchanged: 'Contenuto invariato', needs_review: 'Da verificare' },
};

const REASONS: Record<'en' | 'it', Record<ChangeClassificationReason, string>> = {
  en: {
    identical_text: 'The two archived texts are identical. This record does not establish a content change.',
    presentation_only: 'Only spacing, Unicode composition or typographic quotation marks differ. The original versions remain available.',
    changed_clause_anchor: 'An AI-selected clause is present in a changed passage and absent from the other version after presentation normalization. Its substantive effect still requires verification.',
    missing_public_pair: 'Two public snapshots of the same policy are required to establish what changed. The available record is insufficient.',
    comparison_limit: 'The comparison exceeds the automatic processing limit. Review the original versions before interpreting this update.',
    unverified_meaning: 'Text differences are confirmed, but the available evidence does not establish their substantive effect. This can include extraction or presentation differences.',
  },
  it: {
    identical_text: 'I due testi archiviati sono identici. Questo record non dimostra una modifica del contenuto.',
    presentation_only: 'Cambiano soltanto spaziatura, composizione Unicode o virgolette tipografiche. Le versioni originali restano disponibili.',
    changed_clause_anchor: 'Una clausola selezionata dall’AI compare in un passaggio modificato ed è assente nell’altra versione dopo la normalizzazione tipografica. Il suo effetto sostanziale richiede ancora verifica.',
    missing_public_pair: 'Servono due snapshot pubblici della stessa policy per stabilire cosa è cambiato. Il record disponibile non è sufficiente.',
    comparison_limit: 'Il confronto supera il limite di elaborazione automatica. Esamina le versioni originali prima di interpretare questo aggiornamento.',
    unverified_meaning: 'Le differenze testuali sono confermate, ma le evidenze disponibili non ne dimostrano l’effetto sostanziale. Possono includere differenze di estrazione o presentazione.',
  },
};

export function changeClassificationDescription(classification: ChangeClassification | null | undefined, lang: 'en' | 'it'): string {
  return REASONS[lang][classification?.reason ?? 'missing_public_pair'];
}
