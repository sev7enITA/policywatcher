export type TermsLanguage = 'en' | 'it';

export const TERMS_STORAGE_KEY = 'policywatcher_terms_accepted_v2' as const;
export const TERMS_ACCEPTANCE_TTL_DAYS = 90 as const;
export const TERMS_LAST_UPDATED = '26 July 2026' as const;

export const TERMS_OF_USE = {
  en: {
    title: 'Terms of Use',
    boundaryTitle: 'Use boundaries',
    intro: 'PolicyWatcher is an evidence-inspection tool. These boundaries explain what its public data, scores and AI-assisted analysis can and cannot establish.',
    boundaries: [
      'PolicyWatcher maps evidence and changes in public policy texts; it is not a legal, regulatory, or compliance certification.',
      'Assessments are indicative outputs from automated AI-assisted analysis of publicly available policy material and local dataset metadata.',
      'Outputs can contain omissions, source access gaps, interpretive errors, or delayed updates, especially when provider pages block automated retrieval.',
      'Risk scores and summaries are inspection aids. Decisions should be checked against provider sources and qualified professional advice.',
      'The author and platform are not responsible for decisions, actions, or omissions based solely on dashboard output.',
    ],
    evidenceTitle: 'Responsible interpretation',
    evidenceBody: 'Use source links, retrieval status, evidence dates, Dataset QA context and stated limitations together. A missing assessment is not a low-risk result, and a textual attention signal is not a legal finding.',
    consentTitle: 'Local acknowledgement',
    consentBody: `The dashboard stores the acknowledgement timestamp only in this browser for ${TERMS_ACCEPTANCE_TTL_DAYS} days. It contains no account or email identifier.`,
    renew: 'Renew dashboard acknowledgement',
    renewed: 'The saved acknowledgement was cleared. The dashboard will ask you to review the use boundaries again.',
    language: 'Italiano',
    back: 'Back to the evidence console',
  },
  it: {
    title: 'Termini di Utilizzo',
    boundaryTitle: 'Confini d’uso',
    intro: 'PolicyWatcher è uno strumento di ispezione delle evidenze. Questi confini spiegano cosa i dati pubblici, i punteggi e le analisi AI-assisted possono e non possono dimostrare.',
    boundaries: [
      'PolicyWatcher mappa evidenze e cambiamenti nei testi di policy pubblici; non è una certificazione legale, regolatoria o di compliance.',
      'Le valutazioni sono output indicativi da analisi automatizzata assistita da AI su materiale pubblico e metadata del dataset locale.',
      'Gli output possono contenere omissioni, gap di accesso alle fonti, errori interpretativi o ritardi di aggiornamento, specie quando i provider bloccano il recupero automatico.',
      'Punteggi di rischio e sintesi sono strumenti di ispezione. Le decisioni vanno verificate sulle fonti provider e con consulenza qualificata.',
      'Autore e piattaforma non sono responsabili per decisioni, azioni od omissioni basate esclusivamente sull’output della dashboard.',
    ],
    evidenceTitle: 'Interpretazione responsabile',
    evidenceBody: 'Usa insieme link alle fonti, stato del recupero, date delle evidenze, contesto Dataset QA e limitazioni dichiarate. Una valutazione assente non è un risultato a basso rischio e un segnale testuale non è una conclusione legale.',
    consentTitle: 'Presa visione locale',
    consentBody: `La dashboard salva la data della presa visione solo in questo browser per ${TERMS_ACCEPTANCE_TTL_DAYS} giorni. Non contiene account o identificativi email.`,
    renew: 'Rinnova la presa visione della dashboard',
    renewed: 'La presa visione salvata è stata rimossa. La dashboard chiederà di rivedere nuovamente i confini d’uso.',
    language: 'English',
    back: 'Torna alla console evidenze',
  },
} as const;
