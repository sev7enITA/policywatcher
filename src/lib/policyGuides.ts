import type { PublicLanguage } from './seo';

export interface GuideCopy {
  title: string;
  description: string;
  introduction: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  checklist: string[];
}
export interface PolicyGuide {
  slug: string;
  updatedAt: string;
  policyTypes: string[];
  companySlugs?: string[];
  copy: Record<PublicLanguage, GuideCopy>;
}

/** These are reading guides, not claims about an individual provider or legal advice. */
export const policyGuides: PolicyGuide[] = [
  {
    slug: 'privacy-policy-changes', updatedAt: '2026-09-23', policyTypes: ['privacy'],
    copy: {
      en: {
        title: 'How to track and compare privacy policy changes',
        description: 'Compare privacy notice versions, identify changes to collection, sharing and retention, and cite dated source records with PolicyWatcher.',
        introduction: 'A privacy notice can change while its URL stays the same. A useful comparison connects two recorded versions of the same document, their retrieval dates and the official source. A notification alone cannot establish what changed.',
        sections: [
          { heading: 'Start with the right notice and region', paragraphs: ['Open the company record and select the privacy policy for the relevant product and jurisdiction. A consumer notice, a business service notice and a regional supplement can describe different contexts. Comparing them as successive versions would create misleading differences.', 'Check the original source link before reading the analysis. The date a document was retrieved is an observation date; it is not necessarily the date the provider published the text or made it effective. Keep each available date attached to its own meaning.'] },
          { heading: 'Read changes in their surrounding context', paragraphs: ['Review changes to the categories of information collected, purposes of use, recipients, retention descriptions and user controls. Read definitions and nearby exceptions as well as the highlighted passage. A sentence moved to another section may appear as a deletion and an addition without changing its meaning.', 'PolicyWatcher distinguishes text observations from substantive interpretation. A baseline is a captured version, not proof of a change. A record marked “Needs verification” is not a confirmed change to rights or obligations; an older automated summary should not settle the question.'] },
          { heading: 'Keep a reproducible citation', paragraphs: ['Link the policy record, the dated change and its evidence packet, together with the official provider URL. Note the region and recorded version so another reader can identify the comparison. An AI risk label is a screening aid, not a consumer review or compliance rating.', 'A recent retrieval of one source does not establish that every monitored source is current. If the date is old, the source is unavailable or one version is missing, state that limitation explicitly. Use the correction channel for a mismatched source or interpretation.'] },
        ],
        checklist: ['Match provider, product and jurisdiction.', 'Compare two public versions of the same policy.', 'Separate retrieval, publication and effective dates.', 'Verify the passage and retain its source link.'],
      },
      it: {
        title: 'Come monitorare e confrontare le modifiche alle informative privacy',
        description: 'Confronta versioni delle informative privacy, raccolta, condivisione e conservazione dei dati, con fonti e date verificabili in PolicyWatcher.',
        introduction: 'Un’informativa privacy può cambiare mantenendo lo stesso URL. Un confronto utile collega due versioni registrate dello stesso documento, le rispettive date di acquisizione e la fonte ufficiale. La sola notifica non dimostra cosa sia cambiato.',
        sections: [
          { heading: 'Scegli informativa e area geografica corrette', paragraphs: ['Apri la scheda dell’azienda e seleziona l’informativa relativa al prodotto e alla giurisdizione di interesse. Informative per consumatori, servizi aziendali e integrazioni regionali possono descrivere contesti diversi. Confrontarle come versioni successive produrrebbe differenze fuorvianti.', 'Controlla il link alla fonte originale prima dell’analisi. La data di acquisizione indica quando il documento è stato osservato: non coincide necessariamente con la pubblicazione o l’entrata in vigore. Mantieni distinta la funzione di ogni data disponibile.'] },
          { heading: 'Leggi le differenze nel loro contesto', paragraphs: ['Esamina le modifiche a categorie di dati, finalità, destinatari, tempi di conservazione e controlli disponibili. Leggi anche definizioni ed eccezioni vicine al passaggio evidenziato. Una frase spostata può apparire come rimozione e aggiunta senza cambiare significato.', 'PolicyWatcher separa l’osservazione del testo dall’interpretazione sostanziale. Una baseline è una versione acquisita, non la prova di una modifica. La classificazione “Da verificare” non conferma cambiamenti a diritti od obblighi; una sintesi automatica precedente non risolve il dubbio.'] },
          { heading: 'Conserva una citazione riproducibile', paragraphs: ['Collega scheda della policy, modifica datata, pacchetto di evidenze e URL ufficiale del fornitore. Specifica area geografica e versione per rendere identificabile il confronto. Il rischio stimato dall’AI è un supporto alla lettura, non una recensione o un giudizio di conformità.', 'Un’acquisizione recente non prova che tutte le fonti monitorate siano aggiornate. Se la data è remota, la fonte non è raggiungibile o manca una versione, rendi esplicito il limite. Segnala fonti non corrispondenti o interpretazioni errate tramite il canale di correzione.'] },
        ],
        checklist: ['Verifica fornitore, prodotto e giurisdizione.', 'Confronta due versioni pubbliche della stessa policy.', 'Distingui acquisizione, pubblicazione ed efficacia.', 'Controlla il passaggio e conserva il link alla fonte.'],
      },
    },
  },
  {
    slug: 'ai-provider-policy-updates', updatedAt: '2026-09-23', policyTypes: [], companySlugs: ['openai', 'anthropic', 'google', 'microsoft', 'meta', 'deepseek', 'mistral', 'xai'],
    copy: {
      en: {
        title: 'How to follow AI provider policy updates',
        description: 'Read AI provider policy updates across consumer, API and business services. Check product scope, training language and evidence before drawing conclusions.',
        introduction: 'An AI provider may publish separate privacy notices, service terms, usage rules and business agreements. An update to one document should not automatically be attributed to every product or account type.',
        sections: [
          { heading: 'Map the service before comparing the text', paragraphs: ['Identify whether you are examining a consumer application, an API or a business service. Record the document title, region and official URL. Brand identity alone is not enough to establish that two policy pages cover the same service.', 'Use the company index to find the public policy records available for that provider. The list reflects captured and published evidence, not a guarantee of complete coverage of all AI products. A missing record means the evidence is unavailable here.'] },
          { heading: 'Separate training, retention and permitted use', paragraphs: ['When a passage mentions model improvement, read which data it covers, the applicable service and any controls or exceptions described in the source. Do not transfer a statement about one account type to another without evidence.', 'Training use, storage duration, account settings and permitted-use restrictions answer different questions. Compare each relevant passage with its previous public version. An AI-generated summary can help locate a question, but it cannot replace the provider’s wording or establish the behavior of an individual account.'] },
          { heading: 'Report what the record supports', paragraphs: ['A text difference is an observation; its practical effect may require further verification. Preserve a “Needs verification” classification where the record cannot support a definite interpretation. Do not turn a risk score into a rating of the provider or its model.', 'For a shareable finding, link the change record and evidence packet, identify the product and region, and include the retrieval date. Consult the official provider documentation for current settings. PolicyWatcher records public documents and cannot inspect private account configuration or contract terms.'] },
        ],
        checklist: ['Identify consumer, API or business scope.', 'Keep training and retention questions separate.', 'Check exceptions and settings against the source.', 'Cite the dated record without extending its scope.'],
      },
      it: {
        title: 'Come seguire gli aggiornamenti delle policy dei fornitori AI',
        description: 'Leggi gli aggiornamenti delle policy AI distinguendo servizi consumer, API e business, uso per addestramento, ambito ed evidenze disponibili.',
        introduction: 'Un fornitore AI può pubblicare informative privacy, termini, regole d’uso e accordi aziendali distinti. La modifica di un documento non si applica automaticamente a tutti i prodotti o tipi di account.',
        sections: [
          { heading: 'Identifica il servizio prima del confronto', paragraphs: ['Stabilisci se stai esaminando un’applicazione consumer, un’API o un servizio aziendale. Registra titolo del documento, area geografica e URL ufficiale. Il nome del marchio non basta a dimostrare che due pagine descrivano lo stesso servizio.', 'Nell’indice aziendale trovi le policy con evidenze pubbliche disponibili. L’elenco rappresenta quanto acquisito e pubblicato, non una copertura completa di tutti i prodotti AI. L’assenza di una scheda indica che qui non è disponibile la relativa evidenza.'] },
          { heading: 'Distingui addestramento, conservazione e usi consentiti', paragraphs: ['Se un passaggio menziona il miglioramento dei modelli, verifica dati interessati, servizio e controlli o eccezioni descritti nella fonte. Non estendere a un altro tipo di account un’affermazione priva di riscontro.', 'Uso per addestramento, durata della conservazione, impostazioni e limitazioni d’uso rispondono a domande diverse. Confronta ogni passaggio con la precedente versione pubblica. Una sintesi AI aiuta a individuare un tema, ma non sostituisce il testo del fornitore né dimostra come sia configurato un singolo account.'] },
          { heading: 'Riporta soltanto ciò che le evidenze sostengono', paragraphs: ['Una differenza testuale è un’osservazione; il suo effetto pratico può richiedere una verifica ulteriore. Mantieni la classificazione “Da verificare” quando il documento non consente una conclusione certa. Non trasformare un punteggio di rischio in una valutazione del fornitore o del modello.', 'Per condividere un risultato, collega modifica e pacchetto di evidenze, identifica prodotto e giurisdizione e indica la data di acquisizione. Consulta la documentazione ufficiale per le impostazioni attuali. PolicyWatcher osserva documenti pubblici e non verifica configurazioni private o contratti individuali.'] },
        ],
        checklist: ['Identifica l’ambito consumer, API o business.', 'Separa addestramento e conservazione.', 'Verifica eccezioni e impostazioni nella fonte.', 'Cita il documento datato senza ampliarne la portata.'],
      },
    },
  },
  {
    slug: 'terms-of-service-monitoring', updatedAt: '2026-09-23', policyTypes: ['terms', 'tos', 'acceptable'],
    copy: {
      en: {
        title: 'How to monitor terms of service changes',
        description: 'Compare terms of service versions, distinguish editorial edits from substantive changes, and keep a dated record of the relevant source.',
        introduction: 'An updated terms page can contain a new clause, a revised definition or only a formatting change. Monitoring works best when the document identity and the limits of the comparison remain visible.',
        sections: [
          { heading: 'Build a comparison you can identify', paragraphs: ['Choose the terms for the same service, audience and jurisdiction. Open the policy record and check whether there is a published baseline and a later public version. One captured document is a starting point, not evidence that a particular clause was added.', 'Record the source URL and both version dates. A provider’s stated effective date, if available, has a different meaning from the date PolicyWatcher retrieved the page. A notification may also point to a help article rather than the terms themselves.'] },
          { heading: 'Review clauses with their dependencies', paragraphs: ['Look at the passages covering access, permitted use, service changes, suspension, fees, cancellation and dispute procedures when those topics appear in the document. Follow references to definitions or incorporated documents instead of interpreting a sentence in isolation.', 'Moved paragraphs, navigation changes and extraction differences can produce visible additions and removals. Check the recorded classification and the two source versions before calling an edit substantive. “Needs verification” means the available comparison does not settle that interpretation.'] },
          { heading: 'Turn monitoring into a traceable review', paragraphs: ['Keep the change permalink and evidence packet with a short note explaining which passage needs review. Attribute the wording to the provider and the screening interpretation to PolicyWatcher. Avoid presenting automated risk labels as an assessment of enforceability.', 'The public archive does not establish what an individual accepted, which contract applies to a private account or whether a particular clause is legally valid. For those questions, the applicable documents and professional assessment may be needed. Source monitoring provides a dated starting point.'] },
        ],
        checklist: ['Match the document and its audience.', 'Check both versions and the observation dates.', 'Read definitions and referenced documents.', 'Retain evidence for any interpretation.'],
      },
      it: {
        title: 'Come monitorare le modifiche ai termini di servizio',
        description: 'Confronta versioni dei termini di servizio, distingui revisioni editoriali e modifiche sostanziali e conserva fonti e date del confronto.',
        introduction: 'Una pagina di termini aggiornata può contenere una nuova clausola, una definizione rivista oppure una semplice modifica grafica. Il monitoraggio è utile quando identità del documento e limiti del confronto restano visibili.',
        sections: [
          { heading: 'Costruisci un confronto identificabile', paragraphs: ['Scegli termini relativi allo stesso servizio, pubblico e giurisdizione. Nella scheda della policy verifica la presenza di una baseline pubblicata e di una versione pubblica successiva. Un solo documento acquisito è un punto di partenza, non la prova che una clausola sia stata aggiunta.', 'Annota URL della fonte e date delle due versioni. L’eventuale data di efficacia dichiarata dal fornitore ha un significato diverso dalla data di acquisizione in PolicyWatcher. Una notifica può inoltre rimandare a un articolo di assistenza anziché ai termini.'] },
          { heading: 'Leggi le clausole insieme ai loro riferimenti', paragraphs: ['Esamina i passaggi su accesso, usi consentiti, variazioni del servizio, sospensione, costi, cancellazione e controversie quando presenti nel documento. Segui i rimandi a definizioni e documenti richiamati senza interpretare una frase isolata.', 'Spostamenti di paragrafi, navigazione e differenze di estrazione possono produrre aggiunte e rimozioni visibili. Controlla classificazione e due versioni prima di definire sostanziale una revisione. “Da verificare” indica che il confronto disponibile non risolve l’interpretazione.'] },
          { heading: 'Rendi la revisione tracciabile', paragraphs: ['Conserva il permalink della modifica e il pacchetto di evidenze insieme a una nota sul passaggio da approfondire. Attribuisci il testo al fornitore e l’interpretazione automatica a PolicyWatcher. I livelli di rischio non costituiscono un giudizio sull’efficacia giuridica delle clausole.', 'L’archivio pubblico non dimostra cosa abbia accettato una persona, quale contratto si applichi al suo account o se una clausola sia valida. Queste domande possono richiedere documenti applicabili e valutazione professionale. Il monitoraggio offre una base documentale datata.'] },
        ],
        checklist: ['Verifica documento e destinatari.', 'Controlla entrambe le versioni e le date di osservazione.', 'Leggi definizioni e documenti richiamati.', 'Conserva le evidenze di ogni interpretazione.'],
      },
    },
  },
  {
    slug: 'data-processing-agreement-monitoring', updatedAt: '2026-09-23', policyTypes: ['dpa', 'data_processing', 'data processing'],
    copy: {
      en: {
        title: 'How to monitor data processing agreement updates',
        description: 'Track public DPA versions and linked processing documents, with attention to scope, subprocessors, locations and evidence limitations.',
        introduction: 'A public data processing agreement is one part of a provider’s documentation. Reading an update requires checking the service it covers and any annexes or linked lists, while keeping public evidence separate from an organization’s signed agreement.',
        sections: [
          { heading: 'Establish which document is being observed', paragraphs: ['Start with the policy record, its official source and the provider identity. Check the agreement title, product scope and jurisdiction. A public template may differ from an executed agreement, an order form or a negotiated amendment.', 'Locate the two recorded versions and their retrieval dates. A baseline confirms that a version was captured; it does not establish that the provider changed a commitment. If only one public version is available, a comparison cannot be reconstructed from that record alone.'] },
          { heading: 'Follow annexes and linked registers', paragraphs: ['Read changes to the description of processing, documented instructions, security references, deletion or return procedures and assistance provisions where these are included. Check whether an apparent change comes from an annex or a separate document.', 'Subprocessor lists and location registers may have their own URLs and update cycles. Their content should not be assumed to be part of a captured DPA unless the evidence supports that connection. A provider’s general region statement does not prove the active location of an individual deployment or backup.'] },
          { heading: 'Preserve the boundary of the evidence', paragraphs: ['Use the public change permalink and evidence packet to document what was observed and when. Keep automated screening separate from the provider’s statements. Uncertain text or missing comparison material should remain explicitly uncertain.', 'PolicyWatcher’s public records do not certify compliance, complete a transfer assessment or verify the agreement signed by a specific customer. A practical review can use these records to identify questions, then check the applicable contract and current provider sources. Report source mismatches through the correction channel.'] },
        ],
        checklist: ['Identify the public template and its service scope.', 'Compare available versions with their capture dates.', 'Check annexes and separate subprocessor sources.', 'Distinguish public documentation from signed commitments.'],
      },
      it: {
        title: 'Come monitorare gli aggiornamenti degli accordi sul trattamento dei dati',
        description: 'Segui le versioni pubbliche dei DPA e dei documenti collegati, verificando ambito, subfornitori, localizzazioni e limiti delle evidenze.',
        introduction: 'Un accordo pubblico sul trattamento dei dati è una parte della documentazione del fornitore. Per leggerne gli aggiornamenti occorre verificare servizi interessati, allegati ed elenchi collegati, distinguendo le fonti pubbliche dal contratto firmato da una specifica organizzazione.',
        sections: [
          { heading: 'Identifica il documento osservato', paragraphs: ['Parti dalla scheda della policy, dalla fonte ufficiale e dall’identità del fornitore. Controlla titolo dell’accordo, prodotti e giurisdizione. Un modello pubblico può differire da un accordo sottoscritto, un ordine o una modifica negoziata.', 'Individua le due versioni registrate e le date di acquisizione. La baseline conferma che una versione è stata acquisita; non dimostra una modifica agli impegni del fornitore. Con una sola versione pubblica non è possibile ricostruire il confronto dalla scheda.'] },
          { heading: 'Segui allegati ed elenchi collegati', paragraphs: ['Leggi le variazioni alla descrizione del trattamento, alle istruzioni documentate, ai riferimenti di sicurezza, alle procedure di restituzione o cancellazione e all’assistenza, quando presenti. Controlla se la differenza riguardi un allegato o un documento autonomo.', 'Gli elenchi dei subfornitori e delle localizzazioni possono avere URL e cicli di aggiornamento propri. Non considerarli parte del DPA acquisito senza un collegamento sostenuto dalle evidenze. Una dichiarazione generale sulle regioni non dimostra la localizzazione attiva di una singola installazione o dei suoi backup.'] },
          { heading: 'Mantieni esplicito il limite delle evidenze', paragraphs: ['Usa permalink della modifica e pacchetto di evidenze per documentare cosa sia stato osservato e quando. Separa la lettura automatica dalle dichiarazioni del fornitore. Testi ambigui o materiali mancanti devono restare segnalati come incerti.', 'Le schede pubbliche di PolicyWatcher non certificano conformità, non completano valutazioni sui trasferimenti e non verificano accordi sottoscritti da un cliente. Possono aiutare a identificare le domande da approfondire nel contratto applicabile e nelle fonti attuali. Segnala eventuali fonti non corrispondenti tramite il canale di correzione.'] },
        ],
        checklist: ['Identifica modello pubblico e servizi coperti.', 'Confronta le versioni con le date di acquisizione.', 'Controlla allegati e fonti autonome sui subfornitori.', 'Distingui documentazione pubblica e impegni sottoscritti.'],
      },
    },
  },
];

export function getPolicyGuide(slug: string): PolicyGuide | undefined {
  return policyGuides.find((guide) => guide.slug === slug);
}
export function guideMatchesPolicy(guide: PolicyGuide, policy: { type: string; name: string; company: { slug: string } }): boolean {
  if (guide.companySlugs) return guide.companySlugs.includes(policy.company.slug);
  const subject = `${policy.type} ${policy.name}`.toLowerCase();
  return guide.policyTypes.some((type) => subject.includes(type));
}
