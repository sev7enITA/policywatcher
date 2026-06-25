/**
 * @module kpi-justifications
 *
 * Static, human-curated bilingual (EN/IT) justification strings for every
 * company × KPI combination displayed in the PolicyWatcher KPI scorecard.
 *
 * Screening Date: 2026-06-20
 * Coverage: 16 companies × 15 KPIs × 2 languages = 480 justification strings.
 *
 * These justifications are NOT AI-generated at runtime; they are reviewed
 * and frozen at each screening date to ensure factual accuracy and
 * editorial consistency across the dataset.
 */

/** ISO date of the most recent manual KPI screening round. */
export const SCREENING_DATE = '2026-06-20';

/** A single bilingual justification string (English + Italian). */
type JustificationEntry = { en: string; it: string };

/**
 * Master lookup table: `justifications[companySlug][kpiKey]` → `{ en, it }`.
 * Each company section contains one entry per KPI ID.
 */
const justifications: Record<string, Record<string, JustificationEntry>> = {

  // ===========================================================================
  // GOOGLE
  // ===========================================================================
  google: {
    kpiDataCollection: {
      en: 'Google collects data across Search, Gmail, YouTube, Maps, and Android, building comprehensive ad profiles per its Privacy Policy.',
      it: 'Google raccoglie dati da Search, Gmail, YouTube, Maps e Android, creando profili pubblicitari completi secondo la sua Privacy Policy.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with ad partners, subsidiaries, and upon government requests as disclosed in Google\'s Privacy Policy.',
      it: 'I dati sono condivisi con partner pubblicitari, filiali e su richiesta governativa, come indicato nella Privacy Policy di Google.',
    },
    kpiDataRetention: {
      en: 'No global deletion timeline exists: activity controls vary by service and retention periods are not uniformly defined.',
      it: 'Non esiste un termine globale di cancellazione: i controlli attività variano per servizio e i periodi di conservazione non sono uniformi.',
    },
    kpiRightToDeletion: {
      en: 'Google Takeout allows data export and deletion, but some data is retained for legal and business purposes.',
      it: 'Google Takeout consente esportazione e cancellazione, ma alcuni dati vengono conservati per motivi legali e commerciali.',
    },
    kpiCrossBorderTransfer: {
      en: 'Google operates global infrastructure where data moves freely across jurisdictions without user-selectable residency.',
      it: 'Google opera su infrastruttura globale dove i dati circolano liberamente tra giurisdizioni senza residenza selezionabile.',
    },
    kpiAiTrainingOptOut: {
      en: 'Gemini activity can be paused via settings, but publicly available web data may still be used for AI training.',
      it: 'L\'attività di Gemini può essere sospesa nelle impostazioni, ma i dati web pubblici possono comunque essere usati per l\'addestramento AI.',
    },
    kpiAiOutputOwnership: {
      en: 'Gemini TOS grants Google a license to use prompts and outputs for service improvement purposes.',
      it: 'I TOS di Gemini concedono a Google una licenza per usare prompt e output ai fini del miglioramento del servizio.',
    },
    kpiAlgoTransparency: {
      en: 'Transparency reports provide some algorithmic details, but Search ranking and ad auction algorithms remain opaque.',
      it: 'I report di trasparenza forniscono alcuni dettagli algoritmici, ma il ranking di Search e le aste pubblicitarie restano opachi.',
    },
    kpiAutomatedDecision: {
      en: 'Ad targeting is disclosed in Ad Settings, but the full logic behind personalization and ranking is not published.',
      it: 'Il targeting pubblicitario è indicato in Impostazioni annunci, ma la logica completa di personalizzazione non è pubblicata.',
    },
    kpiAiBiasFairness: {
      en: 'Google AI Principles are published, but third-party auditing of consumer AI products remains limited.',
      it: 'I Principi AI di Google sono pubblicati, ma l\'audit indipendente dei prodotti AI consumer resta limitato.',
    },
    kpiConsentMechanism: {
      en: 'Data collection is enabled by default across services: users must navigate privacy settings to opt out.',
      it: 'La raccolta dati è attiva di default su tutti i servizi: l\'utente deve navigare le impostazioni privacy per disattivarla.',
    },
    kpiRegulatoryCompliance: {
      en: 'Google offers GDPR DPAs, maintains EU representative, and has initiated EU AI Act compliance preparations.',
      it: 'Google offre DPA GDPR, mantiene un rappresentante UE e ha avviato i preparativi per la conformità all\'EU AI Act.',
    },
    kpiBreachNotification: {
      en: 'Google follows GDPR Article 33 requirements, notifying supervisory authorities within 72 hours of a breach.',
      it: 'Google segue i requisiti dell\'art. 33 GDPR, notificando le autorità di controllo entro 72 ore dalla violazione.',
    },
    kpiIndependentAudit: {
      en: 'Google Cloud holds SOC2 and ISO 27001 certifications, but consumer products lack independent privacy audits.',
      it: 'Google Cloud possiede certificazioni SOC2 e ISO 27001, ma i prodotti consumer mancano di audit privacy indipendenti.',
    },
    kpiContentModeration: {
      en: 'YouTube publishes transparency reports on moderation, but AI-based content moderation shows documented inconsistencies.',
      it: 'YouTube pubblica report di trasparenza sulla moderazione, ma la moderazione AI mostra incongruenze documentate.',
    },
  },

  // ===========================================================================
  // ANTHROPIC
  // ===========================================================================
  anthropic: {
    kpiDataCollection: {
      en: 'Anthropic collects only data necessary for API and Claude usage, with no cross-platform behavioral tracking.',
      it: 'Anthropic raccoglie solo i dati necessari per l\'uso dell\'API e di Claude, senza tracciamento comportamentale cross-platform.',
    },
    kpiThirdPartySharing: {
      en: 'Anthropic does not sell or share user data with third parties for advertising, per its Privacy Policy.',
      it: 'Anthropic non vende né condivide dati utente con terze parti a fini pubblicitari, secondo la sua Privacy Policy.',
    },
    kpiDataRetention: {
      en: 'Conversation data is retained for 90 days for safety monitoring, then automatically deleted per policy.',
      it: 'I dati delle conversazioni sono conservati per 90 giorni per monitoraggio sicurezza, poi cancellati automaticamente.',
    },
    kpiRightToDeletion: {
      en: 'Users can request full data deletion through Anthropic\'s privacy portal, with no exceptions beyond legal requirements.',
      it: 'Gli utenti possono richiedere la cancellazione completa tramite il portale privacy di Anthropic, senza eccezioni oltre gli obblighi di legge.',
    },
    kpiCrossBorderTransfer: {
      en: 'Processing occurs in the US, with Standard Contractual Clauses provided for EU data transfers.',
      it: 'Il trattamento avviene negli USA, con Clausole Contrattuali Standard fornite per i trasferimenti dati dall\'UE.',
    },
    kpiAiTrainingOptOut: {
      en: 'API data is not used for model training by default. A clear opt-out is available for Claude consumer usage.',
      it: 'I dati API non sono usati per l\'addestramento per impostazione predefinita. È disponibile un chiaro opt-out per Claude consumer.',
    },
    kpiAiOutputOwnership: {
      en: 'Per Anthropic\'s TOS, all outputs generated by users belong entirely to the user.',
      it: 'Secondo i TOS di Anthropic, tutti gli output generati dagli utenti appartengono interamente all\'utente.',
    },
    kpiAlgoTransparency: {
      en: 'Constitutional AI methodology is publicly documented in peer-reviewed research papers.',
      it: 'La metodologia Constitutional AI è documentata pubblicamente in articoli di ricerca peer-reviewed.',
    },
    kpiAutomatedDecision: {
      en: 'Safety filtering decisions and content refusal criteria are documented in Anthropic\'s usage policy.',
      it: 'Le decisioni di filtraggio di sicurezza e i criteri di rifiuto contenuti sono documentati nella policy d\'uso di Anthropic.',
    },
    kpiAiBiasFairness: {
      en: 'Anthropic maintains a dedicated safety team, publishes bias evaluations, and documents RLHF methodology.',
      it: 'Anthropic ha un team di sicurezza dedicato, pubblica valutazioni sui bias e documenta la metodologia RLHF.',
    },
    kpiConsentMechanism: {
      en: 'Consent flows are explicit, with no hidden data usage. Users are clearly informed before data processing.',
      it: 'I flussi di consenso sono espliciti, senza utilizzo nascosto dei dati. Gli utenti sono informati prima del trattamento.',
    },
    kpiRegulatoryCompliance: {
      en: 'Anthropic proactively engages with EU regulators and has made voluntary safety commitments to the White House.',
      it: 'Anthropic collabora proattivamente con i regolatori UE e ha assunto impegni volontari di sicurezza con la Casa Bianca.',
    },
    kpiBreachNotification: {
      en: 'Anthropic\'s security incident response policy commits to notifying affected parties within 24 hours.',
      it: 'La policy di risposta agli incidenti di Anthropic prevede la notifica alle parti interessate entro 24 ore.',
    },
    kpiIndependentAudit: {
      en: 'Third-party red teaming is conducted regularly, but full ISO 27001 certification has not yet been achieved.',
      it: 'Il red teaming di terze parti è condotto regolarmente, ma la certificazione ISO 27001 completa non è ancora stata ottenuta.',
    },
    kpiContentModeration: {
      en: 'Usage policies are publicly available and enforcement actions are documented with clear appeal processes.',
      it: 'Le policy d\'uso sono pubblicamente disponibili e le azioni di enforcement sono documentate con processi di appello chiari.',
    },
  },

  // ===========================================================================
  // MICROSOFT
  // ===========================================================================
  microsoft: {
    kpiDataCollection: {
      en: 'Microsoft collects telemetry from Windows, Office 365, LinkedIn, Bing, and Copilot, spanning consumer and enterprise.',
      it: 'Microsoft raccoglie telemetria da Windows, Office 365, LinkedIn, Bing e Copilot, coprendo consumer e enterprise.',
    },
    kpiThirdPartySharing: {
      en: 'LinkedIn data is shared with advertisers, and the Microsoft Advertising network distributes data to ad partners.',
      it: 'I dati di LinkedIn sono condivisi con inserzionisti e il network Microsoft Advertising distribuisce dati ai partner pubblicitari.',
    },
    kpiDataRetention: {
      en: 'Retention policies vary by service, with some data retained for extended periods without a unified schedule.',
      it: 'Le policy di conservazione variano per servizio, con alcuni dati conservati per periodi estesi senza un calendario unificato.',
    },
    kpiRightToDeletion: {
      en: 'Microsoft\'s privacy dashboard provides deletion tools for personal data, supporting GDPR rights fulfillment.',
      it: 'La dashboard privacy di Microsoft fornisce strumenti di cancellazione dei dati personali, supportando i diritti GDPR.',
    },
    kpiCrossBorderTransfer: {
      en: 'The EU Data Boundary program ensures EU customer data is processed and stored within EU data centers.',
      it: 'Il programma EU Data Boundary garantisce che i dati dei clienti UE siano trattati e archiviati nei data center UE.',
    },
    kpiAiTrainingOptOut: {
      en: 'Copilot enterprise data is excluded from training, but consumer Bing data may be used for model improvement.',
      it: 'I dati enterprise di Copilot sono esclusi dall\'addestramento, ma i dati consumer di Bing possono essere usati per migliorare i modelli.',
    },
    kpiAiOutputOwnership: {
      en: 'Copilot TOS grants Microsoft usage rights over interaction data for service improvement purposes.',
      it: 'I TOS di Copilot concedono a Microsoft diritti d\'uso sui dati di interazione ai fini del miglioramento del servizio.',
    },
    kpiAlgoTransparency: {
      en: 'AI transparency notes are published for key products, but Copilot\'s internal model architecture remains proprietary.',
      it: 'Le note di trasparenza AI sono pubblicate per i prodotti chiave, ma l\'architettura interna di Copilot resta proprietaria.',
    },
    kpiAutomatedDecision: {
      en: 'Microsoft publishes Responsible AI Impact Assessments documenting automated decision-making practices.',
      it: 'Microsoft pubblica Responsible AI Impact Assessments che documentano le pratiche decisionali automatizzate.',
    },
    kpiAiBiasFairness: {
      en: 'The Office of Responsible AI publishes fairness guidelines and the HAX toolkit for bias detection.',
      it: 'L\'Office of Responsible AI pubblica linee guida sull\'equità e il toolkit HAX per il rilevamento dei bias.',
    },
    kpiConsentMechanism: {
      en: 'Windows data collection is enabled by default during setup: users must adjust diagnostic data settings afterward.',
      it: 'La raccolta dati di Windows è attiva per default durante l\'installazione: l\'utente deve modificare le impostazioni diagnostiche.',
    },
    kpiRegulatoryCompliance: {
      en: 'Microsoft holds ISO 27001, SOC2, and has initiated early compliance with both GDPR and the EU AI Act.',
      it: 'Microsoft possiede ISO 27001, SOC2 e ha avviato la conformità anticipata sia al GDPR che all\'EU AI Act.',
    },
    kpiBreachNotification: {
      en: 'Microsoft maintains an established breach notification framework compliant with GDPR Article 33 timelines.',
      it: 'Microsoft mantiene un framework di notifica violazioni conforme ai tempi dell\'art. 33 GDPR.',
    },
    kpiIndependentAudit: {
      en: 'Microsoft holds ISO 27001 and SOC2 Type II certifications with regular third-party audits across services.',
      it: 'Microsoft possiede certificazioni ISO 27001 e SOC2 Type II con audit regolari di terze parti su tutti i servizi.',
    },
    kpiContentModeration: {
      en: 'Bing and LinkedIn have moderation systems, but AI-generated content review shows documented inconsistencies.',
      it: 'Bing e LinkedIn hanno sistemi di moderazione, ma la revisione dei contenuti generati da AI mostra incongruenze documentate.',
    },
  },

  // ===========================================================================
  // META
  // ===========================================================================
  meta: {
    kpiDataCollection: {
      en: 'Meta tracks users across Facebook, Instagram, WhatsApp, and Threads, enabling cross-platform behavioral profiling.',
      it: 'Meta traccia gli utenti su Facebook, Instagram, WhatsApp e Threads, consentendo profilazione comportamentale cross-platform.',
    },
    kpiThirdPartySharing: {
      en: 'Meta Pixel and Conversions API share user data with an extensive ecosystem of advertising partners.',
      it: 'Meta Pixel e Conversions API condividono dati utente con un vasto ecosistema di partner pubblicitari.',
    },
    kpiDataRetention: {
      en: 'No clear global deletion timeline exists: account data persists after deactivation without defined expiration.',
      it: 'Non esiste un termine globale di cancellazione chiaro: i dati dell\'account persistono dopo la disattivazione senza scadenza definita.',
    },
    kpiRightToDeletion: {
      en: 'Deletion requests require 90-day processing, and some data categories are retained for legal and operational reasons.',
      it: 'Le richieste di cancellazione richiedono 90 giorni di elaborazione e alcune categorie di dati sono conservate per motivi legali.',
    },
    kpiCrossBorderTransfer: {
      en: 'Data moves globally across Meta\'s infrastructure, with repeated EU DPA enforcement actions over transfer practices.',
      it: 'I dati circolano globalmente nell\'infrastruttura Meta, con ripetute azioni sanzionatorie delle DPA UE sui trasferimenti.',
    },
    kpiAiTrainingOptOut: {
      en: 'Public posts are used for LLaMA training. EU opt-out was blocked until 2025 regulatory intervention mandated it.',
      it: 'I post pubblici sono usati per l\'addestramento di LLaMA. L\'opt-out UE è stato bloccato fino all\'intervento regolatorio del 2025.',
    },
    kpiAiOutputOwnership: {
      en: 'Meta AI outputs are subject to Meta\'s broad content license, which grants the company extensive usage rights.',
      it: 'Gli output di Meta AI sono soggetti all\'ampia licenza sui contenuti di Meta, che concede all\'azienda ampi diritti d\'uso.',
    },
    kpiAlgoTransparency: {
      en: 'Feed algorithm details are not published despite DSA requirements, leaving recommendation logic undisclosed.',
      it: 'I dettagli dell\'algoritmo del feed non sono pubblicati nonostante i requisiti DSA, lasciando la logica di raccomandazione non divulgata.',
    },
    kpiAutomatedDecision: {
      en: 'Ad targeting logic and content ranking mechanisms are not disclosed to users or regulators in detail.',
      it: 'La logica di targeting pubblicitario e i meccanismi di ranking dei contenuti non sono divulgati in dettaglio.',
    },
    kpiAiBiasFairness: {
      en: 'Meta\'s Responsible AI team was disbanded in 2023, leaving minimal public commitments on bias mitigation.',
      it: 'Il team Responsible AI di Meta è stato sciolto nel 2023, lasciando impegni pubblici minimi sulla mitigazione dei bias.',
    },
    kpiConsentMechanism: {
      en: 'Data collection is embedded in service usage, with consent bundled into Terms of Service acceptance.',
      it: 'La raccolta dati è integrata nell\'uso del servizio, con il consenso incorporato nell\'accettazione dei Termini di Servizio.',
    },
    kpiRegulatoryCompliance: {
      en: 'Meta has received multiple GDPR fines and faces ongoing DPC investigations across EU jurisdictions.',
      it: 'Meta ha ricevuto molteplici sanzioni GDPR e affronta indagini DPC in corso in diverse giurisdizioni UE.',
    },
    kpiBreachNotification: {
      en: 'Meta follows GDPR-mandated 72-hour notification, though historical delays in breach disclosure have been documented.',
      it: 'Meta segue la notifica GDPR entro 72 ore, sebbene siano stati documentati ritardi storici nella divulgazione delle violazioni.',
    },
    kpiIndependentAudit: {
      en: 'No independent privacy audit program exists. Meta operates under a prior FTC consent decree.',
      it: 'Non esiste un programma di audit privacy indipendente. Meta opera sotto un precedente consent decree della FTC.',
    },
    kpiContentModeration: {
      en: 'The Oversight Board has limited scope, and content moderation enforcement is documented as inconsistent.',
      it: 'L\'Oversight Board ha un ambito limitato e l\'applicazione della moderazione dei contenuti è documentata come incoerente.',
    },
  },

  // ===========================================================================
  // STRIPE
  // ===========================================================================
  stripe: {
    kpiDataCollection: {
      en: 'Stripe collects transaction data, business verification info, and fraud detection signals necessary for payment processing.',
      it: 'Stripe raccoglie dati transazionali, informazioni di verifica aziendale e segnali di rilevamento frodi per l\'elaborazione pagamenti.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with payment networks and financial regulators as required, with no advertising-based sharing.',
      it: 'I dati sono condivisi con reti di pagamento e regolatori finanziari come richiesto, senza condivisione a fini pubblicitari.',
    },
    kpiDataRetention: {
      en: 'Retention periods are defined and aligned with financial regulatory requirements for transaction records.',
      it: 'I periodi di conservazione sono definiti e allineati ai requisiti normativi finanziari per i registri delle transazioni.',
    },
    kpiRightToDeletion: {
      en: 'GDPR/CCPA deletion processes are documented, with financial record retention exceptions clearly disclosed.',
      it: 'I processi di cancellazione GDPR/CCPA sono documentati, con eccezioni per la conservazione finanziaria chiaramente indicate.',
    },
    kpiCrossBorderTransfer: {
      en: 'Stripe provides SCCs and data localization options for EU/UK customers to restrict cross-border transfers.',
      it: 'Stripe fornisce SCC e opzioni di localizzazione dati per i clienti UE/UK per limitare i trasferimenti transfrontalieri.',
    },
    kpiAiTrainingOptOut: {
      en: 'Stripe Radar uses transaction data for fraud detection ML as a core service function, with no opt-out available.',
      it: 'Stripe Radar usa dati transazionali per il ML antifrode come funzione core del servizio, senza possibilità di opt-out.',
    },
    kpiAiOutputOwnership: {
      en: 'Merchants retain full ownership of transaction outputs and processed payment data per Stripe\'s service agreement.',
      it: 'I merchant mantengono la piena proprietà degli output transazionali e dei dati di pagamento secondo l\'accordo di servizio Stripe.',
    },
    kpiAlgoTransparency: {
      en: 'Radar fraud scoring methodology is partially documented in developer resources, but full logic is proprietary.',
      it: 'La metodologia di scoring antifrode di Radar è parzialmente documentata nelle risorse sviluppatori, ma la logica completa è proprietaria.',
    },
    kpiAutomatedDecision: {
      en: 'Automated fraud blocking is disclosed to merchants, with appeal mechanisms available for disputed decisions.',
      it: 'Il blocco antifrode automatizzato è comunicato ai merchant, con meccanismi di appello per le decisioni contestate.',
    },
    kpiAiBiasFairness: {
      en: 'Fair lending commitments exist, but public bias auditing of fraud detection models remains limited.',
      it: 'Esistono impegni per il credito equo, ma l\'audit pubblico sui bias dei modelli antifrode resta limitato.',
    },
    kpiConsentMechanism: {
      en: 'Data processing is required for payment services under contractual necessity, with opt-out limited to marketing.',
      it: 'Il trattamento dati è necessario per i servizi di pagamento per necessità contrattuale, con opt-out limitato al marketing.',
    },
    kpiRegulatoryCompliance: {
      en: 'Stripe holds PCI DSS Level 1 certification, provides GDPR DPAs, and complies with PSD2 requirements.',
      it: 'Stripe possiede la certificazione PCI DSS Livello 1, fornisce DPA GDPR e rispetta i requisiti PSD2.',
    },
    kpiBreachNotification: {
      en: 'Financial sector rapid notification requirements mandate breach disclosure within 24 hours.',
      it: 'I requisiti di notifica rapida del settore finanziario impongono la divulgazione delle violazioni entro 24 ore.',
    },
    kpiIndependentAudit: {
      en: 'Stripe maintains PCI DSS, SOC1, SOC2, and ISO 27001 certifications through regular independent audits.',
      it: 'Stripe mantiene certificazioni PCI DSS, SOC1, SOC2 e ISO 27001 tramite audit indipendenti regolari.',
    },
    kpiContentModeration: {
      en: 'Acceptable use policies are enforced for merchants, but content review of merchant offerings is limited.',
      it: 'Le policy di uso accettabile sono applicate ai merchant, ma la revisione dei contenuti delle offerte è limitata.',
    },
  },

  // ===========================================================================
  // PAYPAL
  // ===========================================================================
  paypal: {
    kpiDataCollection: {
      en: 'PayPal collects transaction data, device information, and browsing activity on PayPal properties for fraud prevention.',
      it: 'PayPal raccoglie dati transazionali, informazioni dispositivo e attività di navigazione sulle proprietà PayPal per la prevenzione frodi.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with payment processors, and the Honey acquisition expanded behavioral data use beyond payments.',
      it: 'I dati sono condivisi con processori di pagamento e l\'acquisizione di Honey ha esteso l\'uso dei dati comportamentali.',
    },
    kpiDataRetention: {
      en: 'Financial records are retained per regulatory requirements, with some data stored beyond minimum mandated periods.',
      it: 'I registri finanziari sono conservati per requisiti normativi, con alcuni dati archiviati oltre i periodi minimi obbligatori.',
    },
    kpiRightToDeletion: {
      en: 'Account closure is available, but financial transaction records must be retained per anti-money laundering laws.',
      it: 'La chiusura dell\'account è disponibile, ma i registri delle transazioni devono essere conservati per le leggi antiriciclaggio.',
    },
    kpiCrossBorderTransfer: {
      en: 'PayPal uses approved Binding Corporate Rules and operates EU data centers to control cross-border transfers.',
      it: 'PayPal utilizza Binding Corporate Rules approvate e opera data center UE per controllare i trasferimenti transfrontalieri.',
    },
    kpiAiTrainingOptOut: {
      en: 'Fraud detection ML relies on transaction pattern analysis as a core service, with no user opt-out mechanism.',
      it: 'Il ML antifrode si basa sull\'analisi dei pattern transazionali come servizio core, senza meccanismo di opt-out per l\'utente.',
    },
    kpiAiOutputOwnership: {
      en: 'Transaction data ownership is clearly assigned to the user per PayPal\'s service agreement.',
      it: 'La proprietà dei dati transazionali è chiaramente assegnata all\'utente secondo l\'accordo di servizio PayPal.',
    },
    kpiAlgoTransparency: {
      en: 'Fraud detection basics are documented in help articles, but the full scoring logic remains proprietary.',
      it: 'Le basi del rilevamento frodi sono documentate negli articoli di supporto, ma la logica di scoring completa resta proprietaria.',
    },
    kpiAutomatedDecision: {
      en: 'Account limitation decisions are automated. An appeal process exists but is documented as slow in resolution.',
      it: 'Le decisioni di limitazione account sono automatizzate. Esiste un processo di appello, ma documentato come lento nella risoluzione.',
    },
    kpiAiBiasFairness: {
      en: 'A non-discrimination policy exists, but public bias reporting on automated financial decisions is limited.',
      it: 'Esiste una policy di non discriminazione, ma il reporting pubblico sui bias nelle decisioni finanziarie automatizzate è limitato.',
    },
    kpiConsentMechanism: {
      en: 'Default data sharing with partners is enabled: users can adjust preferences in account privacy settings.',
      it: 'La condivisione dati con i partner è attiva per default: gli utenti possono modificare le preferenze nelle impostazioni privacy.',
    },
    kpiRegulatoryCompliance: {
      en: 'PayPal maintains PCI DSS, GDPR, PSD2, and state money transmitter licenses across jurisdictions.',
      it: 'PayPal mantiene PCI DSS, GDPR, PSD2 e licenze di trasmissione denaro statali in diverse giurisdizioni.',
    },
    kpiBreachNotification: {
      en: 'PayPal follows financial sector notification requirements aligned with GDPR 72-hour timelines.',
      it: 'PayPal segue i requisiti di notifica del settore finanziario allineati ai tempi di 72 ore del GDPR.',
    },
    kpiIndependentAudit: {
      en: 'PCI DSS and SOC2 certifications are maintained, but consumer-facing privacy audits are not independently conducted.',
      it: 'Le certificazioni PCI DSS e SOC2 sono mantenute, ma gli audit privacy consumer non sono condotti in modo indipendente.',
    },
    kpiContentModeration: {
      en: 'Acceptable use policies are enforced, but seller content review processes are inconsistently applied.',
      it: 'Le policy di uso accettabile sono applicate, ma i processi di revisione dei contenuti dei venditori sono incoerenti.',
    },
  },

  // ===========================================================================
  // REVOLUT
  // ===========================================================================
  revolut: {
    kpiDataCollection: {
      en: 'Revolut collects banking data, KYC verification documents, device info, and location data for regulatory compliance.',
      it: 'Revolut raccoglie dati bancari, documenti di verifica KYC, info dispositivo e dati di localizzazione per conformità normativa.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with banking partners and as required by FCA and ECB regulations, not for advertising.',
      it: 'I dati sono condivisi con partner bancari e come richiesto dai regolamenti FCA e BCE, non per finalità pubblicitarie.',
    },
    kpiDataRetention: {
      en: 'KYC and transaction data are retained for 5 to 7 years per AML/CTF regulatory requirements.',
      it: 'I dati KYC e transazionali sono conservati da 5 a 7 anni per i requisiti normativi AML/CTF.',
    },
    kpiRightToDeletion: {
      en: 'GDPR deletion is available for non-regulated data. Financial records are exempt per AML regulations.',
      it: 'La cancellazione GDPR è disponibile per i dati non regolamentati. I registri finanziari sono esenti per normativa AML.',
    },
    kpiCrossBorderTransfer: {
      en: 'UK and EU operations process data within their respective jurisdictions under local regulatory oversight.',
      it: 'Le operazioni UK e UE trattano i dati nelle rispettive giurisdizioni sotto la supervisione normativa locale.',
    },
    kpiAiTrainingOptOut: {
      en: 'Some ML-powered features are optional, but core fraud detection models cannot be opted out of by users.',
      it: 'Alcune funzionalità basate su ML sono opzionali, ma i modelli antifrode core non possono essere disattivati dall\'utente.',
    },
    kpiAiOutputOwnership: {
      en: 'Financial data and analysis outputs belong to the account holder per Revolut\'s terms of service.',
      it: 'I dati finanziari e gli output di analisi appartengono al titolare del conto secondo i termini di servizio di Revolut.',
    },
    kpiAlgoTransparency: {
      en: 'Credit scoring methodology is partially disclosed, and AI-powered features include user-facing explanations.',
      it: 'La metodologia di credit scoring è parzialmente divulgata e le funzionalità AI includono spiegazioni per l\'utente.',
    },
    kpiAutomatedDecision: {
      en: 'Automated spending insights are disclosed to users. Lending decisions are partially automated with review options.',
      it: 'Gli insight di spesa automatizzati sono comunicati agli utenti. Le decisioni di credito sono parzialmente automatizzate con revisione.',
    },
    kpiAiBiasFairness: {
      en: 'Fair lending obligations are met, but public reporting on bias in automated financial assessments is limited.',
      it: 'Gli obblighi di prestito equo sono rispettati, ma il reporting pubblico sui bias nelle valutazioni finanziarie automatizzate è limitato.',
    },
    kpiConsentMechanism: {
      en: 'GDPR-compliant consent is required for marketing and optional features, with clear per-feature toggles.',
      it: 'Il consenso conforme al GDPR è richiesto per marketing e funzionalità opzionali, con toggle chiari per funzionalità.',
    },
    kpiRegulatoryCompliance: {
      en: 'Revolut holds FCA, ECB, and Lithuanian banking licenses, maintaining GDPR compliance across jurisdictions.',
      it: 'Revolut possiede licenze bancarie FCA, BCE e lituana, mantenendo la conformità GDPR in tutte le giurisdizioni.',
    },
    kpiBreachNotification: {
      en: 'FCA and ECB rapid notification requirements mandate financial institutions to report breaches within 24 hours.',
      it: 'I requisiti di notifica rapida FCA e BCE impongono agli istituti finanziari di segnalare le violazioni entro 24 ore.',
    },
    kpiIndependentAudit: {
      en: 'Big Four external auditors and banking regulatory examinations provide independent oversight.',
      it: 'Revisori esterni delle Big Four ed esami regolamentari bancari forniscono supervisione indipendente.',
    },
    kpiContentModeration: {
      en: 'Acceptable use policies are clear, with merchant category restrictions publicly documented.',
      it: 'Le policy di uso accettabile sono chiare, con restrizioni per categorie merchant documentate pubblicamente.',
    },
  },

  // ===========================================================================
  // WISE
  // ===========================================================================
  wise: {
    kpiDataCollection: {
      en: 'Wise collects only transaction and KYC data necessary for the service, with no behavioral tracking beyond transfers.',
      it: 'Wise raccoglie solo dati transazionali e KYC necessari al servizio, senza tracciamento comportamentale oltre i trasferimenti.',
    },
    kpiThirdPartySharing: {
      en: 'Data sharing is limited to correspondent banks and regulatory bodies as legally required.',
      it: 'La condivisione dati è limitata alle banche corrispondenti e agli enti regolatori come legalmente richiesto.',
    },
    kpiDataRetention: {
      en: 'A clear retention schedule is published, aligned with AML requirements at 5 years for transaction records.',
      it: 'Un calendario di conservazione chiaro è pubblicato, allineato ai requisiti AML di 5 anni per i registri transazionali.',
    },
    kpiRightToDeletion: {
      en: 'GDPR-compliant deletion is available, with financial record retention requirements clearly explained to users.',
      it: 'La cancellazione conforme al GDPR è disponibile, con i requisiti di conservazione finanziaria chiaramente spiegati agli utenti.',
    },
    kpiCrossBorderTransfer: {
      en: 'Multi-jurisdictional licensing ensures data stays within regulatory boundaries of each operating country.',
      it: 'Le licenze multi-giurisdizionali garantiscono che i dati restino entro i confini normativi di ciascun paese operativo.',
    },
    kpiAiTrainingOptOut: {
      en: 'Fraud detection ML is core to the money transfer service, and no user opt-out mechanism is provided.',
      it: 'Il ML antifrode è fondamentale per il servizio di trasferimento denaro e non è previsto un meccanismo di opt-out.',
    },
    kpiAiOutputOwnership: {
      en: 'Transaction data ownership is fully retained by the user per Wise\'s terms of service.',
      it: 'La proprietà dei dati transazionali è interamente mantenuta dall\'utente secondo i termini di servizio di Wise.',
    },
    kpiAlgoTransparency: {
      en: 'Exchange rate calculations are fully transparent, but fraud detection scoring algorithms are proprietary.',
      it: 'I calcoli dei tassi di cambio sono completamente trasparenti, ma gli algoritmi di scoring antifrode sono proprietari.',
    },
    kpiAutomatedDecision: {
      en: 'Automated compliance checks are disclosed in the help center, with manual review available on request.',
      it: 'I controlli di conformità automatizzati sono indicati nel centro assistenza, con revisione manuale disponibile su richiesta.',
    },
    kpiAiBiasFairness: {
      en: 'Equal access commitments are stated, but public documentation on algorithmic bias testing is limited.',
      it: 'Sono dichiarati impegni di accesso equo, ma la documentazione pubblica sui test di bias algoritmico è limitata.',
    },
    kpiConsentMechanism: {
      en: 'Clear consent is required for each service feature, and marketing communications require explicit opt-in.',
      it: 'Il consenso esplicito è richiesto per ogni funzionalità del servizio e le comunicazioni marketing richiedono opt-in esplicito.',
    },
    kpiRegulatoryCompliance: {
      en: 'Wise maintains FCA, FinCEN, and MAS licenses, ensuring multi-jurisdiction regulatory compliance.',
      it: 'Wise mantiene licenze FCA, FinCEN e MAS, garantendo conformità normativa multi-giurisdizionale.',
    },
    kpiBreachNotification: {
      en: 'Breach notification aligns with GDPR and financial sector requirements, targeting 72-hour disclosure.',
      it: 'La notifica delle violazioni è allineata ai requisiti GDPR e del settore finanziario, con obiettivo di divulgazione in 72 ore.',
    },
    kpiIndependentAudit: {
      en: 'Financial audits are conducted by independent firms, with some regulatory examinations, but not fully ISO-certified.',
      it: 'Gli audit finanziari sono condotti da società indipendenti, con alcuni esami regolamentari, ma senza certificazione ISO completa.',
    },
    kpiContentModeration: {
      en: 'Prohibited activities are clearly listed, and enforcement actions are applied consistently across users.',
      it: 'Le attività vietate sono chiaramente elencate e le azioni di enforcement sono applicate in modo coerente tra gli utenti.',
    },
  },

  // ===========================================================================
  // KLARNA
  // ===========================================================================
  klarna: {
    kpiDataCollection: {
      en: 'Klarna collects purchase history, credit assessment data, and browsing activity within the Klarna app.',
      it: 'Klarna raccoglie cronologia acquisti, dati di valutazione creditizia e attività di navigazione nell\'app Klarna.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with merchant partners and credit bureaus as required for payment and credit assessments.',
      it: 'I dati sono condivisi con partner merchant e agenzie di credito come richiesto per pagamenti e valutazioni creditizie.',
    },
    kpiDataRetention: {
      en: 'Retention schedules are documented and aligned with financial regulatory requirements for credit records.',
      it: 'I calendari di conservazione sono documentati e allineati ai requisiti normativi finanziari per i registri di credito.',
    },
    kpiRightToDeletion: {
      en: 'GDPR deletion is available for non-regulated data. Credit records are subject to regulatory retention periods.',
      it: 'La cancellazione GDPR è disponibile per dati non regolamentati. I registri creditizi sono soggetti a periodi di conservazione normativi.',
    },
    kpiCrossBorderTransfer: {
      en: 'EU-based processing is standard, with SCCs provided for any transfers outside the European Economic Area.',
      it: 'Il trattamento basato nell\'UE è standard, con SCC fornite per qualsiasi trasferimento fuori dallo Spazio Economico Europeo.',
    },
    kpiAiTrainingOptOut: {
      en: 'AI shopping features use purchase data by default, and no clear user opt-out mechanism is available.',
      it: 'Le funzionalità AI per lo shopping usano i dati di acquisto per default, senza un chiaro meccanismo di opt-out disponibile.',
    },
    kpiAiOutputOwnership: {
      en: 'Purchase data and AI-generated shopping recommendations belong to the user per Klarna\'s terms.',
      it: 'I dati di acquisto e le raccomandazioni AI per lo shopping appartengono all\'utente secondo i termini di Klarna.',
    },
    kpiAlgoTransparency: {
      en: 'Credit decision factors are partially disclosed to applicants, but the AI shopping assistant\'s logic is proprietary.',
      it: 'I fattori delle decisioni di credito sono parzialmente divulgati ai richiedenti, ma la logica dell\'assistente AI shopping è proprietaria.',
    },
    kpiAutomatedDecision: {
      en: 'Credit decisions are automated with some factor disclosure, and an appeal process is available to applicants.',
      it: 'Le decisioni di credito sono automatizzate con divulgazione parziale dei fattori, e un processo di appello è disponibile.',
    },
    kpiAiBiasFairness: {
      en: 'Fair lending obligations are met, but public auditing of AI shopping assistant bias is not available.',
      it: 'Gli obblighi di prestito equo sono rispettati, ma l\'audit pubblico sui bias dell\'assistente AI shopping non è disponibile.',
    },
    kpiConsentMechanism: {
      en: 'Some AI-powered features are enabled by default, with users required to opt out in app settings.',
      it: 'Alcune funzionalità basate su AI sono attive per default, e gli utenti devono disattivarle nelle impostazioni dell\'app.',
    },
    kpiRegulatoryCompliance: {
      en: 'Klarna holds a Swedish FSA banking license and complies with GDPR, PSD2, and consumer credit regulations.',
      it: 'Klarna possiede una licenza bancaria della FSA svedese e rispetta GDPR, PSD2 e normative sul credito al consumo.',
    },
    kpiBreachNotification: {
      en: 'Notification follows GDPR and financial sector requirements, targeting disclosure within 72 hours.',
      it: 'La notifica segue i requisiti GDPR e del settore finanziario, con obiettivo di divulgazione entro 72 ore.',
    },
    kpiIndependentAudit: {
      en: 'Big Four financial audits and regulatory examinations are conducted, but AI-specific auditing remains limited.',
      it: 'Audit finanziari delle Big Four ed esami regolamentari sono condotti, ma l\'auditing specifico per l\'AI resta limitato.',
    },
    kpiContentModeration: {
      en: 'Merchant acceptance policies are enforced, but AI-generated content recommendations vary in quality controls.',
      it: 'Le policy di accettazione merchant sono applicate, ma le raccomandazioni di contenuto AI variano nei controlli di qualità.',
    },
  },

  // ===========================================================================
  // PLAID
  // ===========================================================================
  plaid: {
    kpiDataCollection: {
      en: 'Plaid collects bank account credentials, transaction history, and financial institution data for app connectivity.',
      it: 'Plaid raccoglie credenziali bancarie, cronologia transazioni e dati degli istituti finanziari per la connettività delle app.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with connected apps as authorized by the user, with data minimization efforts documented.',
      it: 'I dati sono condivisi con le app collegate come autorizzato dall\'utente, con sforzi di minimizzazione dati documentati.',
    },
    kpiDataRetention: {
      en: 'Retention periods are defined per data type, and data is deleted when app connections are revoked.',
      it: 'I periodi di conservazione sono definiti per tipo di dato e i dati vengono cancellati quando le connessioni app sono revocate.',
    },
    kpiRightToDeletion: {
      en: 'A portal for revoking app connections exists, but historical transaction data deletion may be incomplete.',
      it: 'Esiste un portale per revocare le connessioni app, ma la cancellazione dei dati storici delle transazioni può essere incompleta.',
    },
    kpiCrossBorderTransfer: {
      en: 'Operations are primarily US and EU based, with data processing contained within respective jurisdictions.',
      it: 'Le operazioni sono principalmente basate in USA e UE, con trattamento dati contenuto nelle rispettive giurisdizioni.',
    },
    kpiAiTrainingOptOut: {
      en: 'Transaction categorization ML is core to Plaid\'s service, with no user opt-out mechanism available.',
      it: 'Il ML per la categorizzazione delle transazioni è core del servizio Plaid, senza meccanismo di opt-out disponibile.',
    },
    kpiAiOutputOwnership: {
      en: 'Financial data ownership is retained by the account holder per Plaid\'s developer and user agreements.',
      it: 'La proprietà dei dati finanziari è mantenuta dal titolare del conto secondo gli accordi sviluppatori e utenti di Plaid.',
    },
    kpiAlgoTransparency: {
      en: 'The data access model is documented for developers, but transaction categorization algorithms are proprietary.',
      it: 'Il modello di accesso ai dati è documentato per gli sviluppatori, ma gli algoritmi di categorizzazione sono proprietari.',
    },
    kpiAutomatedDecision: {
      en: 'Automated bank account verification is disclosed in documentation, with manual review available on request.',
      it: 'La verifica automatizzata dei conti bancari è indicata nella documentazione, con revisione manuale disponibile su richiesta.',
    },
    kpiAiBiasFairness: {
      en: 'Fair access commitments are stated, but public documentation on bias in financial data processing is limited.',
      it: 'Sono dichiarati impegni di accesso equo, ma la documentazione pubblica sui bias nel trattamento dati finanziari è limitata.',
    },
    kpiConsentMechanism: {
      en: 'Users must individually authorize each app connection through Plaid Link, ensuring per-connection consent.',
      it: 'Gli utenti devono autorizzare individualmente ogni connessione app tramite Plaid Link, garantendo il consenso per connessione.',
    },
    kpiRegulatoryCompliance: {
      en: 'CFPB engagement is ongoing, GDPR compliance is evolving, and a 2022 FTC settlement addressed past practices.',
      it: 'L\'impegno con il CFPB è in corso, la conformità GDPR è in evoluzione, e un accordo FTC 2022 ha affrontato pratiche passate.',
    },
    kpiBreachNotification: {
      en: 'Breach notification processes are aligned with applicable regulations, targeting 72-hour disclosure.',
      it: 'I processi di notifica delle violazioni sono allineati alle normative applicabili, con obiettivo di divulgazione in 72 ore.',
    },
    kpiIndependentAudit: {
      en: 'SOC2 certification is maintained, but a comprehensive public privacy audit has not been published.',
      it: 'La certificazione SOC2 è mantenuta, ma un audit privacy pubblico completo non è stato pubblicato.',
    },
    kpiContentModeration: {
      en: 'Developer policies are enforced for app integrations, but app ecosystem oversight remains limited.',
      it: 'Le policy per sviluppatori sono applicate per le integrazioni app, ma la supervisione dell\'ecosistema app resta limitata.',
    },
  },

  // ===========================================================================
  // OPENAI
  // ===========================================================================
  openai: {
    kpiDataCollection: {
      en: 'OpenAI collects prompts, usage data, account info, and ChatGPT browsing data for service operation and safety.',
      it: 'OpenAI raccoglie prompt, dati d\'uso, info account e dati di navigazione ChatGPT per il funzionamento del servizio e la sicurezza.',
    },
    kpiThirdPartySharing: {
      en: 'No advertising-based sharing occurs. Plugin and GPT developers may receive limited interaction data.',
      it: 'Non avviene condivisione a fini pubblicitari. Gli sviluppatori di plugin e GPT possono ricevere dati di interazione limitati.',
    },
    kpiDataRetention: {
      en: 'ChatGPT Plus/Team data is not used for training. Abuse monitoring retains data for 30 days per policy.',
      it: 'I dati di ChatGPT Plus/Team non sono usati per l\'addestramento. Il monitoraggio abusi conserva i dati per 30 giorni.',
    },
    kpiRightToDeletion: {
      en: 'Account deletion is available, and conversation history can be deleted through user settings at any time.',
      it: 'La cancellazione dell\'account è disponibile e la cronologia delle conversazioni può essere eliminata dalle impostazioni.',
    },
    kpiCrossBorderTransfer: {
      en: 'Processing is US-based, with DPAs and Standard Contractual Clauses available for EU data transfers.',
      it: 'Il trattamento è basato negli USA, con DPA e Clausole Contrattuali Standard disponibili per i trasferimenti dati dall\'UE.',
    },
    kpiAiTrainingOptOut: {
      en: 'API data is excluded from training by default. ChatGPT users can disable training via a settings toggle.',
      it: 'I dati API sono esclusi dall\'addestramento per default. Gli utenti ChatGPT possono disabilitarlo tramite un toggle nelle impostazioni.',
    },
    kpiAiOutputOwnership: {
      en: 'Per OpenAI\'s TOS, users own all outputs generated through both the API and ChatGPT services.',
      it: 'Secondo i TOS di OpenAI, gli utenti possiedono tutti gli output generati tramite l\'API e i servizi ChatGPT.',
    },
    kpiAlgoTransparency: {
      en: 'Model cards are published for major releases, but training data composition and model weights are not disclosed.',
      it: 'Le model card sono pubblicate per i rilasci principali, ma la composizione dei dati di training e i pesi non sono divulgati.',
    },
    kpiAutomatedDecision: {
      en: 'Content filtering decisions and safety system behavior are documented in published system cards.',
      it: 'Le decisioni di filtraggio contenuti e il comportamento del sistema di sicurezza sono documentati nelle system card pubblicate.',
    },
    kpiAiBiasFairness: {
      en: 'OpenAI conducts red teaming, external audits, and runs a bias bounty program with public safety publications.',
      it: 'OpenAI conduce red teaming, audit esterni e gestisce un programma bug bounty sui bias con pubblicazioni sulla sicurezza.',
    },
    kpiConsentMechanism: {
      en: 'Clear data usage settings and a training opt-out toggle provide explicit consent controls for users.',
      it: 'Impostazioni chiare sull\'uso dei dati e un toggle di opt-out dall\'addestramento forniscono controlli di consenso espliciti.',
    },
    kpiRegulatoryCompliance: {
      en: 'EU regulatory engagement is ongoing, but comprehensive certification across frameworks has not yet been achieved.',
      it: 'L\'impegno normativo UE è in corso, ma la certificazione completa attraverso i framework non è ancora stata raggiunta.',
    },
    kpiBreachNotification: {
      en: 'Security incident response procedures are documented, targeting notification within 72 hours of discovery.',
      it: 'Le procedure di risposta agli incidenti di sicurezza sono documentate, con obiettivo di notifica entro 72 ore dalla scoperta.',
    },
    kpiIndependentAudit: {
      en: 'External red teaming and SSAE-18/SOC2 for enterprise are in place, but full ISO certification is pending.',
      it: 'Red teaming esterno e SSAE-18/SOC2 per enterprise sono attivi, ma la certificazione ISO completa è in corso.',
    },
    kpiContentModeration: {
      en: 'Usage policies are public, the moderation system is documented, and a content appeal process is available.',
      it: 'Le policy d\'uso sono pubbliche, il sistema di moderazione è documentato e un processo di appello sui contenuti è disponibile.',
    },
  },

  // ===========================================================================
  // AMAZON
  // ===========================================================================
  amazon: {
    kpiDataCollection: {
      en: 'Amazon collects purchase history, Alexa recordings, Ring/Blink video, browsing data, and Kindle reading habits.',
      it: 'Amazon raccoglie cronologia acquisti, registrazioni Alexa, video Ring/Blink, dati di navigazione e abitudini di lettura Kindle.',
    },
    kpiThirdPartySharing: {
      en: 'Data flows to the Amazon Ads network, third-party sellers, AWS services, and law enforcement partnerships.',
      it: 'I dati fluiscono verso Amazon Ads, venditori terzi, servizi AWS e partnership con le forze dell\'ordine.',
    },
    kpiDataRetention: {
      en: 'Purchase history is retained indefinitely. Alexa recordings are adjustable but default to long-term storage.',
      it: 'La cronologia acquisti è conservata indefinitamente. Le registrazioni Alexa sono regolabili ma salvate a lungo termine per default.',
    },
    kpiRightToDeletion: {
      en: 'Some data is deletable via account settings, but purchase and financial records are retained per policy.',
      it: 'Alcuni dati sono cancellabili dalle impostazioni account, ma i registri di acquisto e finanziari sono conservati per policy.',
    },
    kpiCrossBorderTransfer: {
      en: 'Global AWS infrastructure enables data flows across regions without user-selectable data residency for retail.',
      it: 'L\'infrastruttura globale AWS consente flussi di dati tra regioni senza residenza dati selezionabile per il retail.',
    },
    kpiAiTrainingOptOut: {
      en: 'Alexa voice training opt-out is available in settings, but product recommendation ML is non-optional.',
      it: 'L\'opt-out dall\'addestramento vocale Alexa è disponibile nelle impostazioni, ma il ML per le raccomandazioni prodotto non è opzionale.',
    },
    kpiAiOutputOwnership: {
      en: 'Alexa responses and Bedrock AI outputs are subject to Amazon\'s usage terms, creating shared ownership.',
      it: 'Le risposte Alexa e gli output AI di Bedrock sono soggetti ai termini d\'uso di Amazon, creando proprietà condivisa.',
    },
    kpiAlgoTransparency: {
      en: 'Recommendation system basics are disclosed, but the A9 product ranking algorithm remains proprietary.',
      it: 'Le basi del sistema di raccomandazione sono divulgate, ma l\'algoritmo di ranking prodotti A9 resta proprietario.',
    },
    kpiAutomatedDecision: {
      en: 'Automated pricing and seller account decisions occur, with limited disclosure of the underlying logic.',
      it: 'Decisioni automatizzate su prezzi e account venditori avvengono, con divulgazione limitata della logica sottostante.',
    },
    kpiAiBiasFairness: {
      en: 'AWS publishes AI fairness tools, but Rekognition facial recognition bias controversies remain unresolved.',
      it: 'AWS pubblica strumenti di equità AI, ma le controversie sui bias nel riconoscimento facciale Rekognition restano irrisolte.',
    },
    kpiConsentMechanism: {
      en: 'Purchasing implies consent to data processing per Amazon\'s conditions. Granular settings are available separately.',
      it: 'L\'acquisto implica il consenso al trattamento dati per le condizioni Amazon. Impostazioni granulari sono disponibili separatamente.',
    },
    kpiRegulatoryCompliance: {
      en: 'AWS holds extensive certifications. Amazon retail maintains GDPR compliance and FTC regulatory engagement.',
      it: 'AWS possiede certificazioni estese. Amazon retail mantiene conformità GDPR e impegno normativo con la FTC.',
    },
    kpiBreachNotification: {
      en: 'GDPR-compliant 72-hour process is followed, though historical delays in Ring breach disclosure were documented.',
      it: 'Viene seguito il processo GDPR di 72 ore, sebbene siano stati documentati ritardi storici nella divulgazione delle violazioni Ring.',
    },
    kpiIndependentAudit: {
      en: 'AWS holds SOC2 and ISO certifications, but consumer retail privacy is not independently audited.',
      it: 'AWS possiede certificazioni SOC2 e ISO, ma la privacy del retail consumer non è sottoposta a audit indipendente.',
    },
    kpiContentModeration: {
      en: 'Product review moderation exists, but the fake review problem persists as documented by consumer watchdogs.',
      it: 'La moderazione delle recensioni esiste, ma il problema delle recensioni false persiste come documentato dalle associazioni consumatori.',
    },
  },

  // ===========================================================================
  // APPLE
  // ===========================================================================
  apple: {
    kpiDataCollection: {
      en: 'Apple prioritizes on-device processing, uses differential privacy, and does not rely on an ad-based revenue model.',
      it: 'Apple privilegia l\'elaborazione on-device, usa la privacy differenziale e non si basa su un modello di ricavi pubblicitari.',
    },
    kpiThirdPartySharing: {
      en: 'No user data is sold or shared for advertising. App Tracking Transparency blocks third-party tracking by default.',
      it: 'Nessun dato utente è venduto o condiviso per pubblicità. App Tracking Transparency blocca il tracciamento terzi per default.',
    },
    kpiDataRetention: {
      en: 'Clear retention schedules are published. iCloud data is deletable, and Siri data is anonymized after processing.',
      it: 'Calendari di conservazione chiari sono pubblicati. I dati iCloud sono cancellabili e i dati Siri sono anonimizzati dopo il trattamento.',
    },
    kpiRightToDeletion: {
      en: 'Apple ID deletion permanently removes all associated data across services without residual retention.',
      it: 'La cancellazione dell\'Apple ID rimuove permanentemente tutti i dati associati su tutti i servizi senza conservazione residua.',
    },
    kpiCrossBorderTransfer: {
      en: 'Data residency options are available, and Private Cloud Compute processes data locally when possible.',
      it: 'Opzioni di residenza dati sono disponibili e Private Cloud Compute elabora i dati localmente quando possibile.',
    },
    kpiAiTrainingOptOut: {
      en: 'Apple Intelligence processes on-device by default, and Apple confirms no user data is used for model training.',
      it: 'Apple Intelligence elabora on-device per default, e Apple conferma che nessun dato utente è usato per l\'addestramento dei modelli.',
    },
    kpiAiOutputOwnership: {
      en: 'Users fully own all Apple Intelligence outputs, with no company claims on generated content.',
      it: 'Gli utenti possiedono completamente tutti gli output di Apple Intelligence, senza rivendicazioni aziendali sui contenuti generati.',
    },
    kpiAlgoTransparency: {
      en: 'Private Cloud Compute architecture is publicly auditable, and Apple Intelligence documentation is published.',
      it: 'L\'architettura Private Cloud Compute è pubblicamente verificabile e la documentazione di Apple Intelligence è pubblicata.',
    },
    kpiAutomatedDecision: {
      en: 'Siri suggestions and Apple Intelligence decisions include user-facing explanations of their reasoning.',
      it: 'I suggerimenti Siri e le decisioni di Apple Intelligence includono spiegazioni rivolte all\'utente sul ragionamento.',
    },
    kpiAiBiasFairness: {
      en: 'Apple publishes ML Research papers and conducts documented bias testing for Apple Intelligence features.',
      it: 'Apple pubblica articoli di ML Research e conduce test documentati sui bias per le funzionalità di Apple Intelligence.',
    },
    kpiConsentMechanism: {
      en: 'ATT requires per-app opt-in for tracking. AI features are individually toggleable in device settings.',
      it: 'ATT richiede opt-in per-app per il tracciamento. Le funzionalità AI sono attivabili singolarmente nelle impostazioni dispositivo.',
    },
    kpiRegulatoryCompliance: {
      en: 'Apple demonstrates GDPR leadership, EU DMA compliance, and has made voluntary AI safety commitments.',
      it: 'Apple dimostra leadership nel GDPR, conformità al DMA UE e ha assunto impegni volontari per la sicurezza AI.',
    },
    kpiBreachNotification: {
      en: 'Apple maintains a proactive security disclosure program and a rapid response team targeting 24-hour notification.',
      it: 'Apple mantiene un programma proattivo di divulgazione sicurezza e un team di risposta rapida con obiettivo di notifica in 24 ore.',
    },
    kpiIndependentAudit: {
      en: 'Independent PCC audits, ISO 27001 for services, and SOC2 certifications are maintained.',
      it: 'Audit indipendenti PCC, ISO 27001 per i servizi e certificazioni SOC2 sono mantenuti.',
    },
    kpiContentModeration: {
      en: 'App Store review guidelines are public, with a documented appeal process for rejected submissions.',
      it: 'Le linee guida di revisione dell\'App Store sono pubbliche, con un processo di appello documentato per le submission rifiutate.',
    },
  },

  // ===========================================================================
  // TIKTOK
  // ===========================================================================
  tiktok: {
    kpiDataCollection: {
      en: 'TikTok collects behavioral data, keystroke patterns, biometric identifiers, and device fingerprints per its privacy policy.',
      it: 'TikTok raccoglie dati comportamentali, pattern di digitazione, identificatori biometrici e fingerprint dispositivo secondo la sua privacy policy.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with ByteDance subsidiaries and ad partners. Project Clover\'s scope remains limited in practice.',
      it: 'I dati sono condivisi con le filiali ByteDance e partner pubblicitari. L\'ambito di Project Clover resta limitato nella pratica.',
    },
    kpiDataRetention: {
      en: 'No clear global deletion timeline is published, and data is retained across ByteDance entities without defined limits.',
      it: 'Non è pubblicato un termine globale di cancellazione chiaro, e i dati sono conservati tra le entità ByteDance senza limiti definiti.',
    },
    kpiRightToDeletion: {
      en: 'Account deletion is available, but data already shared with ByteDance entities may not be fully removed.',
      it: 'La cancellazione dell\'account è disponibile, ma i dati già condivisi con le entità ByteDance potrebbero non essere completamente rimossi.',
    },
    kpiCrossBorderTransfer: {
      en: 'Despite Project Clover, data remains accessible by ByteDance globally, as documented by regulatory investigations.',
      it: 'Nonostante Project Clover, i dati restano accessibili da ByteDance globalmente, come documentato da indagini regolatorie.',
    },
    kpiAiTrainingOptOut: {
      en: 'All public content is used for recommendation AI training, with no opt-out mechanism provided to users.',
      it: 'Tutti i contenuti pubblici sono usati per l\'addestramento dell\'AI di raccomandazione, senza meccanismo di opt-out per gli utenti.',
    },
    kpiAiOutputOwnership: {
      en: 'TOS contains a broad content license granting TikTok extensive usage rights over all user-generated content.',
      it: 'I TOS contengono un\'ampia licenza sui contenuti che concede a TikTok ampi diritti d\'uso su tutti i contenuti generati dagli utenti.',
    },
    kpiAlgoTransparency: {
      en: 'Recommendation algorithm details are not published despite obligations under DSA Article 40.',
      it: 'I dettagli dell\'algoritmo di raccomandazione non sono pubblicati nonostante gli obblighi dell\'art. 40 del DSA.',
    },
    kpiAutomatedDecision: {
      en: 'Content recommendation and shadow-banning logic are undisclosed, with no public documentation available.',
      it: 'La logica di raccomandazione contenuti e shadow-banning non è divulgata, senza documentazione pubblica disponibile.',
    },
    kpiAiBiasFairness: {
      en: 'No public bias audit program exists, and algorithmic discrimination concerns have been raised by independent researchers.',
      it: 'Non esiste un programma pubblico di audit sui bias, e preoccupazioni sulla discriminazione algoritmica sono state sollevate da ricercatori.',
    },
    kpiConsentMechanism: {
      en: 'Consent is bundled with account creation. Granular opt-out options for data processing are limited.',
      it: 'Il consenso è incorporato nella creazione dell\'account. Le opzioni di opt-out granulari per il trattamento dati sono limitate.',
    },
    kpiRegulatoryCompliance: {
      en: 'EU DSA compliance is contested, with multiple DPA investigations ongoing across member states.',
      it: 'La conformità al DSA UE è contestata, con molteplici indagini DPA in corso in diversi stati membri.',
    },
    kpiBreachNotification: {
      en: 'No public breach notification framework or SLA is documented in TikTok\'s published policies.',
      it: 'Nessun framework di notifica delle violazioni o SLA è documentato nelle policy pubblicate di TikTok.',
    },
    kpiIndependentAudit: {
      en: 'Project Clover audits are limited in scope, and no comprehensive independent privacy audit has been conducted.',
      it: 'Gli audit di Project Clover hanno ambito limitato e non è stato condotto un audit privacy indipendente completo.',
    },
    kpiContentModeration: {
      en: 'Moderation guidelines are partially published, but enforcement is inconsistent with variable government takedown compliance.',
      it: 'Le linee guida di moderazione sono parzialmente pubblicate, ma l\'applicazione è incoerente con conformità variabile ai takedown governativi.',
    },
  },

  // ===========================================================================
  // ZOOM
  // ===========================================================================
  zoom: {
    kpiDataCollection: {
      en: 'Zoom collects meeting metadata, recordings when enabled, device info, and AI Companion interaction data.',
      it: 'Zoom raccoglie metadati delle riunioni, registrazioni se abilitate, info dispositivo e dati di interazione dell\'AI Companion.',
    },
    kpiThirdPartySharing: {
      en: 'No advertising-based data sharing occurs. Third-party AI integrations require explicit user consent.',
      it: 'Non avviene condivisione dati a fini pubblicitari. Le integrazioni AI di terze parti richiedono il consenso esplicito dell\'utente.',
    },
    kpiDataRetention: {
      en: 'Recording retention is configurable by the user. Meeting metadata is retained per Zoom\'s published schedule.',
      it: 'La conservazione delle registrazioni è configurabile dall\'utente. I metadati delle riunioni sono conservati secondo il calendario di Zoom.',
    },
    kpiRightToDeletion: {
      en: 'Account and data deletion is available, with enterprise admin controls for organizational data management.',
      it: 'La cancellazione di account e dati è disponibile, con controlli admin enterprise per la gestione dei dati organizzativi.',
    },
    kpiCrossBorderTransfer: {
      en: 'Data center selection and geo-fencing options are available for enterprise customers to control data residency.',
      it: 'La selezione del data center e le opzioni di geo-fencing sono disponibili per i clienti enterprise per controllare la residenza dati.',
    },
    kpiAiTrainingOptOut: {
      en: 'AI Companion opt-out is available per meeting, and enterprise admins can toggle it off organization-wide.',
      it: 'L\'opt-out dall\'AI Companion è disponibile per riunione, e gli admin enterprise possono disattivarlo a livello organizzativo.',
    },
    kpiAiOutputOwnership: {
      en: 'Meeting content and AI-generated summaries belong to the account holder per Zoom\'s updated terms.',
      it: 'I contenuti delle riunioni e i riassunti generati dall\'AI appartengono al titolare dell\'account secondo i termini aggiornati di Zoom.',
    },
    kpiAlgoTransparency: {
      en: 'AI Companion features are documented in support articles, but the internal ML models remain proprietary.',
      it: 'Le funzionalità dell\'AI Companion sono documentate negli articoli di supporto, ma i modelli ML interni restano proprietari.',
    },
    kpiAutomatedDecision: {
      en: 'AI meeting summaries are disclosed to participants. The attention tracking feature was discontinued after backlash.',
      it: 'I riassunti AI delle riunioni sono comunicati ai partecipanti. La funzione di tracciamento attenzione è stata dismessa dopo le critiche.',
    },
    kpiAiBiasFairness: {
      en: 'Accessibility commitments are published, but public bias auditing of AI Companion features is not available.',
      it: 'Gli impegni di accessibilità sono pubblicati, ma l\'audit pubblico sui bias delle funzionalità AI Companion non è disponibile.',
    },
    kpiConsentMechanism: {
      en: 'AI features are enabled by default in some tiers, but per-meeting opt-out is available for participants.',
      it: 'Le funzionalità AI sono attive per default in alcuni piani, ma l\'opt-out per riunione è disponibile per i partecipanti.',
    },
    kpiRegulatoryCompliance: {
      en: 'Zoom maintains GDPR DPAs, HIPAA BAAs, and FedRAMP authorization following its post-2020 security overhaul.',
      it: 'Zoom mantiene DPA GDPR, BAA HIPAA e autorizzazione FedRAMP dopo la revisione della sicurezza post-2020.',
    },
    kpiBreachNotification: {
      en: 'Improved security disclosure practices were implemented after 2020 incidents, targeting 72-hour notification.',
      it: 'Pratiche di divulgazione sicurezza migliorate sono state implementate dopo gli incidenti del 2020, con obiettivo di notifica in 72 ore.',
    },
    kpiIndependentAudit: {
      en: 'SOC2 Type II, ISO 27001, and regular third-party security assessments are maintained.',
      it: 'SOC2 Type II, ISO 27001 e valutazioni di sicurezza regolari di terze parti sono mantenuti.',
    },
    kpiContentModeration: {
      en: 'Acceptable use policies are clear, and meeting disruption prevention tools are documented and available.',
      it: 'Le policy di uso accettabile sono chiare e gli strumenti di prevenzione delle interruzioni nelle riunioni sono documentati.',
    },
  },

  // ===========================================================================
  // X / TWITTER
  // ===========================================================================
  'x-twitter': {
    kpiDataCollection: {
      en: 'X collects tweets, DM metadata, browsing history, location, device data, and biometric identifiers per its privacy policy.',
      it: 'X raccoglie tweet, metadati DM, cronologia navigazione, posizione, dati dispositivo e identificatori biometrici secondo la privacy policy.',
    },
    kpiThirdPartySharing: {
      en: 'Data is shared with xAI Corp for Grok training, advertising partners, and through data licensing to third parties.',
      it: 'I dati sono condivisi con xAI Corp per l\'addestramento di Grok, partner pubblicitari e tramite licenze dati a terze parti.',
    },
    kpiDataRetention: {
      en: 'No clear deletion timeline is published, and data is retained across xAI Corp entities without defined limits.',
      it: 'Non è pubblicato un termine di cancellazione chiaro, e i dati sono conservati tra le entità xAI Corp senza limiti definiti.',
    },
    kpiRightToDeletion: {
      en: 'Account deactivation is possible, but user data is retained for xAI training purposes per updated terms.',
      it: 'La disattivazione dell\'account è possibile, ma i dati utente sono conservati per l\'addestramento xAI secondo i termini aggiornati.',
    },
    kpiCrossBorderTransfer: {
      en: 'Global data flow continues, with EU data protection concerns unresolved following the Twitter acquisition.',
      it: 'Il flusso globale di dati continua, con preoccupazioni UE sulla protezione dati irrisolte dopo l\'acquisizione di Twitter.',
    },
    kpiAiTrainingOptOut: {
      en: 'All public posts train Grok AI by default. The opt-out mechanism is buried in settings with limited effectiveness.',
      it: 'Tutti i post pubblici addestrano Grok AI per default. Il meccanismo di opt-out è nascosto nelle impostazioni con efficacia limitata.',
    },
    kpiAiOutputOwnership: {
      en: 'An expanded content license grants xAI rights to use all user content for AI-derived products and services.',
      it: 'Un\'ampia licenza sui contenuti concede a xAI diritti d\'uso su tutti i contenuti utente per prodotti e servizi derivati dall\'AI.',
    },
    kpiAlgoTransparency: {
      en: 'The recommendation algorithm was briefly open-sourced then re-closed. Grok training data remains undisclosed.',
      it: 'L\'algoritmo di raccomandazione è stato brevemente reso open-source poi richiuso. I dati di addestramento di Grok restano non divulgati.',
    },
    kpiAutomatedDecision: {
      en: 'Community Notes offers partial transparency, but shadow-banning and reach-limiting mechanisms are undisclosed.',
      it: 'Community Notes offre trasparenza parziale, ma i meccanismi di shadow-banning e limitazione della portata non sono divulgati.',
    },
    kpiAiBiasFairness: {
      en: 'The AI ethics team was eliminated post-acquisition, leaving no public bias commitments or audit programs.',
      it: 'Il team di etica AI è stato eliminato dopo l\'acquisizione, senza impegni pubblici sui bias né programmi di audit.',
    },
    kpiConsentMechanism: {
      en: 'TOS acceptance implies consent to AI training. The opt-out is deeply buried in privacy and safety settings.',
      it: 'L\'accettazione dei TOS implica il consenso all\'addestramento AI. L\'opt-out è profondamente nascosto nelle impostazioni privacy.',
    },
    kpiRegulatoryCompliance: {
      en: 'DSA compliance is challenged, EU DPA investigations are active, and compliance staff has been significantly reduced.',
      it: 'La conformità DSA è contestata, le indagini DPA UE sono attive e il personale di conformità è stato significativamente ridotto.',
    },
    kpiBreachNotification: {
      en: 'Post-acquisition security team reductions leave no clearly documented breach notification SLA.',
      it: 'Le riduzioni del team di sicurezza post-acquisizione non lasciano SLA di notifica delle violazioni chiaramente documentati.',
    },
    kpiIndependentAudit: {
      en: 'FTC consent decree compliance is questioned, and no independent privacy audit program is in place.',
      it: 'La conformità al consent decree FTC è messa in discussione, e nessun programma di audit privacy indipendente è attivo.',
    },
    kpiContentModeration: {
      en: 'Moderation staff was reduced, enforcement is inconsistent, and government takedown compliance varies by jurisdiction.',
      it: 'Il personale di moderazione è stato ridotto, l\'applicazione è incoerente e la conformità ai takedown governativi varia per giurisdizione.',
    },
  },
};

// =============================================================================
// Lookup function with fallback
// =============================================================================

/**
 * Returns a localized justification string for a given company and KPI.
 * Falls back to a default message if the combination is not found.
 */
export function getJustification(
  companySlug: string,
  kpiKey: string,
  lang: 'en' | 'it'
): string {
  const companyData = justifications[companySlug];
  if (!companyData) {
    return lang === 'en'
      ? `No justification available for company: ${companySlug}.`
      : `Nessuna giustificazione disponibile per l'azienda: ${companySlug}.`;
  }

  const kpiData = companyData[kpiKey];
  if (!kpiData) {
    return lang === 'en'
      ? `No justification available for KPI: ${kpiKey}.`
      : `Nessuna giustificazione disponibile per il KPI: ${kpiKey}.`;
  }

  return kpiData[lang];
}
