type PublicAnalysisLocale = 'en' | 'it';

export const PUBLIC_ANALYSIS_DISCLAIMER: Record<PublicAnalysisLocale, string> = {
  en: 'PolicyWatcher presents AI-assisted evidence mapping of publicly available policy texts as of each recorded screening date. It is not legal advice, a compliance certification, a binding judgment, or a definitive assessment of corporate conduct. Evidence and interpretations may be incomplete, inaccurate, or superseded. Verify the linked provider sources and consult qualified legal counsel before making decisions.',
  it: 'PolicyWatcher presenta una mappatura delle evidenze assistita da AI su testi di policy pubblicamente disponibili alla data registrata per ogni analisi. Non costituisce parere legale, certificazione di conformita, giudizio vincolante o valutazione definitiva della condotta aziendale. Evidenze e interpretazioni possono essere incomplete, inesatte o superate. Verificare le fonti provider collegate e consultare un consulente legale qualificato prima di prendere decisioni.',
};

export const PUBLIC_ANALYSIS_DISCLAIMER_COMPACT: Record<PublicAnalysisLocale, string> = {
  en: 'AI-assisted evidence mapping of public policy texts, not legal advice or a compliance certification. Verify provider sources and consult qualified legal counsel.',
  it: 'Mappatura assistita da AI di evidenze tratte da policy pubbliche, non parere legale o certificazione di conformita. Verificare le fonti provider e consultare un consulente legale qualificato.',
};
