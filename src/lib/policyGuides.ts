import type { PublicLanguage } from './seo';

export interface GuideCopy {
  title: string;
  description: string;
  introduction: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  checklist: string[];
  sources?: Array<{ label: string; href: string }>;
}
export interface PolicyGuide {
  slug: string;
  updatedAt: string;
  policyTypes: string[];
  companySlugs?: string[];
  policyIds?: string[];
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
{
  "slug": "meta-automated-data-collection-terms",
  "updatedAt": "2026-09-23",
  "policyTypes": [],
  "policyIds": [
    "959fc5a0-6e35-4088-811d-fbdd905e46e4"
  ],
  "copy": {
    "en": {
      "title": "Meta automated data collection: a dated comparison of Facebook terms",
      "description": "Find the automated-collection wording in recorded Facebook terms, compare dated versions and distinguish the terms record from Meta’s separate collection terms.",
      "introduction": "The Facebook Terms of Service record contains language about automated access and data collection. In PolicyWatcher’s July 2026 captures, one version also names the Automated Data Collection Terms. This case study identifies that textual difference and the limits of the comparison.",
      "sections": [
        {
          "heading": "What the recorded versions show",
          "paragraphs": [
            "Version 3 was captured on 10 July 2026 and version 4 on 28 July 2026, both in UTC. The recorded passage in version 3 refers to prior permission for automated access or collection. Version 4 adds an explicit reference to the separately named Automated Data Collection Terms in the corresponding passage. This is an observation about these two stored texts.",
            "A further capture on 23 September 2026 produced version 5 with the same SHA-256 as versions 1 and 3. That return to an earlier captured text is a reason to investigate delivery, locale and extraction differences before interpreting a change in Meta’s position. It does not establish that a legal change was introduced or reversed."
          ]
        },
        {
          "heading": "Which document answers the search query?",
          "paragraphs": [
            "The evidence record is for Facebook Terms of Service, with the recorded jurisdiction marked Global. A reference inside those terms does not mean PolicyWatcher has independently captured every version of the separate Automated Data Collection Terms. Use the official document and its linked terms to establish the applicable scope.",
            "Searching for a distinctive phrase can surface a dated revision ahead of a provider’s current document. Start with the current provider source for current wording, then use the archive to investigate what PolicyWatcher observed. A retrieval date is not a publication or effective date."
          ]
        },
        {
          "heading": "How to reproduce this comparison",
          "paragraphs": [
            "Open the policy record and identify versions 3, 4 and 5 by their dates and hashes. Open the linked July revision and its evidence packet. Locate the automated-access passage in the before/after material, then read nearby definitions and exceptions. Retain the version identifiers with any citation.",
            "The revision remains an automatically classified record; this article does not upgrade it to a human-verified substantive change. A permission requirement appearing in a captured passage is not advice about the legality of a particular collection activity."
          ]
        }
      ],
      "checklist": [
        "Identify Facebook terms separately from collection-specific terms.",
        "Cite V3 and V4 as dated observations.",
        "Include the V5 return to the earlier hash.",
        "Keep the verification status attached to any interpretation."
      ],
      "sources": [
        {
          "label": "Facebook Terms of Service - official source",
          "href": "https://www.facebook.com/legal/terms"
        },
        {
          "label": "Policy record, dates and baseline hashes",
          "href": "/knowledge/companies/meta/policies/959fc5a0-6e35-4088-811d-fbdd905e46e4"
        },
        {
          "label": "July revision: V3 to V4",
          "href": "/change/6851aafc-7813-4bf9-aef3-794dc09cba9f"
        },
        {
          "label": "Evidence packet for the July revision",
          "href": "/evidence/6851aafc-7813-4bf9-aef3-794dc09cba9f"
        }
      ]
    },
    "it": {
      "title": "Meta e raccolta automatizzata: confronto datato dei termini Facebook",
      "description": "Individua il riferimento alla raccolta automatizzata nei termini Facebook, confronta versioni datate e distingui il documento dai termini specifici di Meta.",
      "introduction": "La scheda dei termini di servizio Facebook contiene un passaggio su accesso e raccolta automatizzata dei dati. Nelle acquisizioni di luglio 2026 una versione menziona anche gli Automated Data Collection Terms. Questo caso documenta la differenza testuale e i limiti del confronto.",
      "sections": [
        {
          "heading": "Cosa mostrano le versioni registrate",
          "paragraphs": [
            "La versione 3 è stata acquisita il 10 luglio 2026 e la versione 4 il 28 luglio 2026, in UTC. Nel passaggio registrato, la versione 3 richiama il permesso preventivo per accesso o raccolta automatizzata. La versione 4 aggiunge un riferimento esplicito agli Automated Data Collection Terms nello stesso passaggio. L’osservazione riguarda questi due testi conservati.",
            "L’acquisizione del 23 settembre 2026 ha prodotto la versione 5, con lo stesso SHA-256 delle versioni 1 e 3. Il ritorno a un testo già acquisito richiede di approfondire differenze di erogazione, lingua ed estrazione prima di interpretare la posizione di Meta. Non dimostra l’introduzione o la revoca di una modifica giuridica."
          ]
        },
        {
          "heading": "Quale documento risponde alla ricerca?",
          "paragraphs": [
            "La scheda riguarda i termini di servizio Facebook, con giurisdizione registrata come Global. Un riferimento interno non dimostra che PolicyWatcher abbia acquisito separatamente tutte le versioni degli Automated Data Collection Terms. Per identificarne l’ambito consulta documento ufficiale e rimandi.",
            "Una ricerca per frase può far emergere una revisione storica prima del documento attuale del fornitore. Parti dalla fonte ufficiale per il testo corrente e usa l’archivio per ricostruire l’osservazione. La data di acquisizione non coincide con pubblicazione o efficacia."
          ]
        },
        {
          "heading": "Come riprodurre il confronto",
          "paragraphs": [
            "Apri la scheda della policy e individua le versioni 3, 4 e 5 tramite date e hash. Consulta revisione di luglio e pacchetto di evidenze. Cerca il passaggio sull’accesso automatizzato nel confronto, leggendo definizioni ed eccezioni vicine. Mantieni gli identificativi di versione nella citazione.",
            "Il record conserva la classificazione automatica; questo articolo non lo trasforma in una modifica sostanziale verificata da una persona. La presenza di un requisito di autorizzazione nel testo acquisito non costituisce un parere sulla liceità di una specifica attività di raccolta."
          ]
        }
      ],
      "checklist": [
        "Distingui termini Facebook e termini specifici di raccolta.",
        "Cita V3 e V4 come osservazioni datate.",
        "Includi il ritorno della V5 all’hash precedente.",
        "Mantieni lo stato di verifica insieme all’interpretazione."
      ],
      "sources": [
        {
          "label": "Termini di servizio Facebook - fonte ufficiale",
          "href": "https://www.facebook.com/legal/terms"
        },
        {
          "label": "Scheda, date e hash delle baseline",
          "href": "/knowledge/companies/meta/policies/959fc5a0-6e35-4088-811d-fbdd905e46e4"
        },
        {
          "label": "Revisione di luglio: da V3 a V4",
          "href": "/change/6851aafc-7813-4bf9-aef3-794dc09cba9f?lang=it"
        },
        {
          "label": "Evidenze della revisione di luglio",
          "href": "/evidence/6851aafc-7813-4bf9-aef3-794dc09cba9f"
        }
      ]
    }
  }
},
{
  "slug": "aws-data-processing-addendum-dpa",
  "updatedAt": "2026-09-23",
  "policyTypes": [],
  "policyIds": [
    "c26029b3-e270-443d-b93c-18ef3688295a"
  ],
  "copy": {
    "en": {
      "title": "AWS Data Processing Addendum: find the DPA and track its source",
      "description": "Locate AWS’s DPA from official documentation and understand which AWS source PolicyWatcher records, its baseline and the limits of change monitoring.",
      "introduction": "The AWS Data Processing Addendum record in PolicyWatcher monitors an AWS documentation page about the DPA. That page links to the agreement. Distinguishing the explanatory page from the agreement is the first step in a useful comparison.",
      "sections": [
        {
          "heading": "Source identity comes before change interpretation",
          "paragraphs": [
            "The recorded URL belongs to the Navigating GDPR Compliance on AWS whitepaper. Its title is AWS Data Processing Addendum (DPA). The official page links separately to the DPA, AWS Service Terms and supplementary material. A change in the whitepaper is not by itself a change in the linked agreement.",
            "For the agreement itself, follow the DPA link from that official AWS page. For PolicyWatcher’s observation history, use the source record below. Keep the document URL beside every note so a later reader can tell which source was actually reviewed."
          ]
        },
        {
          "heading": "What this archive can currently establish",
          "paragraphs": [
            "At the 23 September 2026 review, the public record had one published baseline: version 1, captured on 6 July 2026. Repeated successful retrievals do not create new baseline versions when the stored text remains unchanged. The live record lists subsequent checks separately.",
            "One published baseline cannot support a before/after claim about a DPA amendment. A missing change record means no later comparison is published for this source; it is not proof that every linked AWS agreement remained unchanged."
          ]
        },
        {
          "heading": "Build a review trail that survives a source update",
          "paragraphs": [
            "Record the page title, exact URL, capture date and baseline hash. If your question concerns a clause in the agreement, retain the actual agreement version and the relevant annex separately. Do not treat a marketing or explanatory page as a signed customer agreement.",
            "When a later public version becomes available, compare the same source and its surrounding context. Use the policy record’s timestamps to distinguish a recent retrieval from a new document version. Questions about an individual deployment or signed commitments require their own evidence."
          ]
        }
      ],
      "checklist": [
        "Open the official AWS documentation and its DPA link.",
        "Record whether the source is explanatory material or the agreement.",
        "Require two versions before asserting a change.",
        "Keep customer-specific contractual questions separate."
      ],
      "sources": [
        {
          "label": "AWS documentation: DPA and official agreement links",
          "href": "https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html"
        },
        {
          "label": "AWS source record and published baseline",
          "href": "/knowledge/companies/amazon/policies/c26029b3-e270-443d-b93c-18ef3688295a"
        },
        {
          "label": "General DPA monitoring method",
          "href": "/guides/data-processing-agreement-monitoring"
        }
      ]
    },
    "it": {
      "title": "AWS Data Processing Addendum: trovare il DPA e seguirne la fonte",
      "description": "Trova il DPA nella documentazione ufficiale AWS e identifica fonte monitorata, baseline pubblicata e limiti del confronto in PolicyWatcher.",
      "introduction": "La scheda AWS Data Processing Addendum di PolicyWatcher monitora una pagina della documentazione AWS dedicata al DPA. La pagina rimanda all’accordo. Distinguere la spiegazione dall’accordo è il primo passo per un confronto utile.",
      "sections": [
        {
          "heading": "Identifica la fonte prima di interpretare una modifica",
          "paragraphs": [
            "L’URL registrato appartiene al whitepaper Navigating GDPR Compliance on AWS e ha titolo AWS Data Processing Addendum (DPA). La pagina ufficiale collega separatamente DPA, AWS Service Terms e materiale supplementare. Una modifica al whitepaper non dimostra una modifica all’accordo collegato.",
            "Per leggere l’accordo, segui il link al DPA dalla pagina ufficiale AWS. Per lo storico delle osservazioni consulta invece la scheda qui collegata. Conserva l’URL accanto alle note, così sarà chiaro quale documento è stato effettivamente esaminato."
          ]
        },
        {
          "heading": "Cosa consente di stabilire questo archivio",
          "paragraphs": [
            "Alla verifica del 23 settembre 2026, la scheda pubblica conteneva una sola baseline: versione 1, acquisita il 6 luglio 2026. Le acquisizioni riuscite non creano nuove versioni quando il testo conservato resta invariato. La scheda distingue le date dei controlli successivi.",
            "Una sola baseline non supporta un’affermazione prima/dopo su una revisione del DPA. L’assenza di una modifica pubblicata indica che manca un confronto successivo per questa fonte; non prova che tutti gli accordi AWS collegati siano rimasti invariati."
          ]
        },
        {
          "heading": "Costruisci una traccia di verifica utilizzabile",
          "paragraphs": [
            "Conserva titolo, URL esatto, data di acquisizione e hash della baseline. Se la domanda riguarda una clausola dell’accordo, conserva separatamente la versione dell’accordo e l’allegato pertinente. Non equiparare una pagina esplicativa a un contratto sottoscritto.",
            "Quando sarà disponibile una versione successiva, confronta la stessa fonte nel suo contesto. Usa le date per distinguere un’acquisizione recente da una nuova versione. Installazioni e impegni contrattuali individuali richiedono evidenze specifiche."
          ]
        }
      ],
      "checklist": [
        "Apri la documentazione AWS e il link ufficiale al DPA.",
        "Distingui spiegazione e accordo.",
        "Richiedi due versioni per affermare una modifica.",
        "Separa le questioni contrattuali del singolo cliente."
      ],
      "sources": [
        {
          "label": "Documentazione AWS: DPA e collegamenti agli accordi",
          "href": "https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html"
        },
        {
          "label": "Scheda della fonte e baseline pubblicata",
          "href": "/knowledge/companies/amazon/policies/c26029b3-e270-443d-b93c-18ef3688295a"
        },
        {
          "label": "Metodo generale di monitoraggio dei DPA",
          "href": "/guides/data-processing-agreement-monitoring?lang=it"
        }
      ]
    }
  }
},
{
  "slug": "anthropic-acceptable-use-policy",
  "updatedAt": "2026-09-23",
  "policyTypes": [],
  "policyIds": [
    "54ee97fb-bc87-41ff-837d-2a06184e99a5"
  ],
  "copy": {
    "en": {
      "title": "Anthropic Acceptable Use Policy: source, scope and version history",
      "description": "Find Anthropic’s Usage Policy, also called its AUP, and check the public baseline, dates and evidence needed to investigate an update.",
      "introduction": "Anthropic calls the document at its /legal/aup address the Usage Policy and also refers to it as the Acceptable Use Policy or AUP. PolicyWatcher’s record uses the Acceptable Use Policy name. These labels point to the same monitored source.",
      "sections": [
        {
          "heading": "Start with the official Usage Policy",
          "paragraphs": [
            "The official page checked on 23 September 2026 displays an effective date of 15 September 2025 and a link to a previous version. It organizes its content into general standards, requirements for higher-risk uses and additional use-case guidance. Use those headings to locate the relevant context in the source.",
            "The displayed effective date describes the provider’s document. PolicyWatcher’s capture and retrieval dates describe observations. Different dates are not automatically evidence of a policy update."
          ]
        },
        {
          "heading": "Read the archive without inventing a change",
          "paragraphs": [
            "At the 23 September 2026 review, this record had one published baseline: version 1, captured on 6 July 2026. The source record provides its hash and subsequent retrieval dates. It does not offer a published pair of local versions from which to infer a new restriction.",
            "To investigate a claimed update, first identify the two relevant documents and their dates. The provider’s previous-version link can help locate historical material, but it is not automatically a second PolicyWatcher baseline. Any comparison using it needs to identify that separate source."
          ]
        },
        {
          "heading": "Keep use rules separate from data-handling questions",
          "paragraphs": [
            "A search for Anthropic policy can mean usage restrictions, service terms, privacy or a business agreement. Name the specific document before describing a finding. This case study addresses the Usage Policy source; it does not establish account-specific training, retention or contractual settings.",
            "For a reproducible note, cite the official URL and dated public record, identify the section you checked and state whether two versions were available. A source baseline is useful evidence of a capture even when no new change can be concluded."
          ]
        }
      ],
      "checklist": [
        "Match Usage Policy and AUP to the same official source.",
        "Distinguish the effective date from capture dates.",
        "Check the actual version pair behind an update claim.",
        "Name the document instead of generalizing to all Anthropic policies."
      ],
      "sources": [
        {
          "label": "Anthropic Usage Policy - official source",
          "href": "https://www.anthropic.com/legal/aup"
        },
        {
          "label": "AUP public record and baseline hash",
          "href": "/knowledge/companies/anthropic/policies/54ee97fb-bc87-41ff-837d-2a06184e99a5"
        },
        {
          "label": "How to follow AI provider policy updates",
          "href": "/guides/ai-provider-policy-updates"
        }
      ]
    },
    "it": {
      "title": "Anthropic Acceptable Use Policy: fonte, ambito e storico",
      "description": "Trova la Usage Policy di Anthropic, chiamata anche AUP, e verifica baseline pubblica, date ed evidenze necessarie per esaminare un aggiornamento.",
      "introduction": "Anthropic intitola Usage Policy il documento all’indirizzo /legal/aup e lo indica anche come Acceptable Use Policy o AUP. La scheda di PolicyWatcher usa il nome Acceptable Use Policy: le etichette identificano la stessa fonte monitorata.",
      "sections": [
        {
          "heading": "Parti dalla Usage Policy ufficiale",
          "paragraphs": [
            "La pagina ufficiale controllata il 23 settembre 2026 indica efficacia dal 15 settembre 2025 e collega una versione precedente. I contenuti distinguono standard generali, requisiti per usi a rischio maggiore e indicazioni per ulteriori casi d’uso. Usa queste sezioni per individuare il contesto pertinente nella fonte.",
            "La data di efficacia riguarda il documento del fornitore. Le date di acquisizione e controllo di PolicyWatcher riguardano le osservazioni. Date diverse non dimostrano automaticamente un aggiornamento della policy."
          ]
        },
        {
          "heading": "Leggi lo storico senza presumere una modifica",
          "paragraphs": [
            "Alla verifica del 23 settembre 2026, la scheda conteneva una sola baseline pubblica: versione 1, acquisita il 6 luglio 2026. La scheda espone hash e acquisizioni successive, ma non una coppia di versioni locali pubblicate da cui dedurre una nuova restrizione.",
            "Per esaminare un presunto aggiornamento identifica prima i due documenti e le rispettive date. Il link del fornitore alla versione precedente può aiutare a reperire materiale storico, ma non crea automaticamente una seconda baseline PolicyWatcher. Un confronto che lo utilizza deve dichiarare la fonte separata."
          ]
        },
        {
          "heading": "Separa regole d’uso e trattamento dei dati",
          "paragraphs": [
            "Una ricerca sulle policy Anthropic può riguardare regole d’uso, termini, privacy o accordi aziendali. Nomina il documento prima di descrivere un risultato. Questo caso riguarda la Usage Policy e non dimostra impostazioni individuali di addestramento, conservazione o contratto.",
            "Per una nota riproducibile cita URL ufficiale e scheda datata, identifica la sezione letta e indica se erano disponibili due versioni. Una baseline documenta un’acquisizione anche quando non consente di concludere che vi sia una novità."
          ]
        }
      ],
      "checklist": [
        "Riconduci Usage Policy e AUP alla stessa fonte.",
        "Distingui efficacia e acquisizione.",
        "Verifica la coppia di versioni dietro ogni presunta novità.",
        "Nomina il documento senza generalizzare a tutte le policy Anthropic."
      ],
      "sources": [
        {
          "label": "Usage Policy Anthropic - fonte ufficiale",
          "href": "https://www.anthropic.com/legal/aup"
        },
        {
          "label": "Scheda AUP e hash della baseline",
          "href": "/knowledge/companies/anthropic/policies/54ee97fb-bc87-41ff-837d-2a06184e99a5"
        },
        {
          "label": "Seguire gli aggiornamenti delle policy AI",
          "href": "/guides/ai-provider-policy-updates?lang=it"
        }
      ]
    }
  }
},
];

export function getPolicyGuide(slug: string): PolicyGuide | undefined {
  return policyGuides.find((guide) => guide.slug === slug);
}
export function guideMatchesPolicy(guide: PolicyGuide, policy: { id?: string; type: string; name: string; company: { slug: string } }): boolean {
  if (guide.policyIds) return Boolean(policy.id && guide.policyIds.includes(policy.id));
  if (guide.companySlugs) return guide.companySlugs.includes(policy.company.slug);
  const subject = `${policy.type} ${policy.name}`.toLowerCase();
  return guide.policyTypes.some((type) => subject.includes(type));
}
