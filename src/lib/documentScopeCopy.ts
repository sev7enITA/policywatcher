/** Shared public explanation, used by both methodology surfaces. */
export const DOCUMENT_SCOPE_METHODOLOGY = {
  en: {
    title: 'Document scope and comparable assessments',
    intro: 'Choose privacy policies, terms of service, AI terms, data processing agreements, acceptable use policies or community guidelines. The same multi-selection applies to every company in the dashboard.',
    bullets: [
      'Document type selects the evidence used for analysis; it is separate from KPI groups such as Privacy, AI Governance and Ethics. Region and audience contextualize impact and do not certify which jurisdiction governs a document.',
      'Scope is applied before risk filtering, pagination and aggregation. It follows evidence coverage, suspended sources, policy-change history, KPI matrix, company comparison, assistant context, CSV exports and shared links.',
      'A public baseline is not an assessment. Missing document types, baseline-only records and unknown KPI values remain unassessed. Type coverage counts types with a scored public analysis; it does not mean every KPI is assessed.',
      'Overall risk uses the declared 1–10 scale: 1–3 Low, 4–6 Medium and 7–10 High. Means are calculated within each document type, then across types, then with equal weight per company. More document URLs do not give a company greater weight.',
      'For a selected subset of document types, the dashboard mean and industry benchmark include only companies with an assessment for every requested type. Their denominator is explicit. All-document mode is an overview with variable coverage, not a like-for-like ranking.',
      'KPI cells show the most concerning known value within the selected documents. Individual-type views keep privacy and terms distinguishable. The aggregate comparison radar requires complete type coverage; matrix consensus excludes incomplete type coverage and unassessed KPI values.',
      'KPI coverage equals canonical assessed values divided by 15 times the current public policies in scope. It measures availability, not the probability of correctness. Live and archive retrieval, unavailable checks and pending confirmation are shown separately.',
      'The assistant uses only scoped public documents and discloses how many fit its bounded context. CSV includes document type, unassessed baselines, view identity and per-company coverage. Filtering does not change stored evidence, subscriptions or administrative scans.',
    ],
  },
  it: {
    title: 'Tipi di documento e confronti omogenei',
    intro: 'Seleziona informative privacy, termini di servizio, termini AI, accordi sul trattamento dei dati, uso accettabile o linee guida della community. La stessa selezione multipla si applica a tutte le aziende della dashboard.',
    bullets: [
      'Il tipo di documento seleziona le evidenze da valutare; è distinto dai gruppi KPI Privacy, AI Governance ed Etica. Regione e pubblico contestualizzano gli impatti e non certificano la giurisdizione applicabile al documento.',
      'La selezione precede filtro di rischio, paginazione e aggregazione. Si applica a copertura delle evidenze, fonti sospese, cronologia delle modifiche, matrice KPI, confronto, contesto dell’assistente, CSV e link condivisi.',
      'Una baseline pubblica non equivale a una valutazione. Tipi mancanti, record con sola baseline e valori KPI sconosciuti restano non valutati. La copertura dei tipi conta le analisi pubbliche con punteggio, non la completezza di tutti i KPI.',
      'Il rischio segue la scala dichiarata 1–10: 1–3 basso, 4–6 medio e 7–10 alto. Si calcola la media entro ciascun tipo, poi tra tipi e infine con uguale peso per azienda. Un numero maggiore di URL non aumenta il peso dell’azienda.',
      'Se sono selezionati alcuni tipi, la media della dashboard e il benchmark di settore includono solo aziende con una valutazione per ogni tipo richiesto, indicando il denominatore. Tutti i documenti offre una panoramica a copertura variabile, non una classifica omogenea.',
      'Le celle KPI mostrano il valore noto più preoccupante nei documenti selezionati. Le viste per tipo distinguono privacy e termini. Il radar aggregato richiede copertura completa dei tipi; il consenso della matrice esclude coperture incomplete e KPI non valutati.',
      'La copertura KPI è il numero di valori canonici valutati diviso per 15 volte le policy pubbliche attuali nella selezione. Misura la disponibilità, non la probabilità di correttezza. Recupero live o da archivio, controlli indisponibili e conferme in attesa restano distinti.',
      'L’assistente usa solo documenti pubblici selezionati e dichiara quanti entrano nel contesto limitato. Il CSV conserva tipo, baseline non valutate, identità della vista e copertura per azienda. Il filtro non modifica evidenze salvate, iscrizioni o scansioni amministrative.',
    ],
  },
} as const;
