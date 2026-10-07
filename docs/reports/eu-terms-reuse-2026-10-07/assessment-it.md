# Portale UE e Open Terms Archive: riuso per PolicyWatcher

Nota: questo documento descrive la verifica iniziale. La successiva implementazione locale e i suoi limiti sono registrati nel [runbook del pilota](../../evidence-assurance-pilot.md).

Verifica del 7 ottobre 2026. Valutazione documentale e tecnica; non costituisce un parere legale sul singolo documento. Nessuna importazione nel database applicativo, modifica al motore o pubblicazione in produzione è stata eseguita per questa verifica.

## Decisione proposta

Integrare la raccolta della Commissione come fonte esterna tracciata per discovery, confronti storici e controllo dell'estrazione. Implementare nel codice PolicyWatcher il trattamento separato degli aggiornamenti del parser. Valutare il riuso diretto del software soltanto dopo aver definito il perimetro delle licenze copyleft.

Il database UE dichiara una licenza di riuso: non occorre considerarlo inutilizzabile. Questa licenza non dimostra, da sola, che ogni diritto sui testi delle aziende sia stato trasferito. La decisione di ripubblicare integralmente un testo richiede una base identificata per quel contenuto.

## Cosa è stato verificato

Il riferimento è il [Digital Services Terms and Conditions Database](https://code.europa.eu/dsa/terms-and-conditions-database), annunciato dalla Commissione [il 1 dicembre 2023](https://digital-strategy.ec.europa.eu/en/news/commission-launches-new-database-track-digital-services-terms-and-conditions). È distinto dal DSA Transparency Database delle decisioni di moderazione. Il numero di 790 documenti nell'annuncio del 2023 non descrive automaticamente l'inventario attuale della raccolta VLOP/VLOSE.

L'API pubblica GitLab di code.europa.eu ha consentito di leggere inventario, README, LICENSE, NOTICE, dichiarazioni e metadati della cronologia. Alcune pagine hanno restituito errori al lettore web; i file sono stati verificati direttamente tramite l'API ufficiale, senza autenticazione.

| Repository | HEAD osservata | Evidenza |
|---|---|---|
| vlop-vlose-declarations | `8fc00675b9df507322a47c84772840b06f046901` | Regole di acquisizione, tassonomia e tag; ultimo commit 2 ottobre 2026 |
| vlop-vlose-versions | `0dbd93e5c9b3af461ae31afb9d6b73760b6270c3` | 491 file documentali sotto 33 cartelle di servizi, esclusi README e LICENSE; ultimo commit 6 ottobre |
| vlop-vlose-snapshots | `63a42a5117180af2313c828adce7999b9e1fb82e` | Archivio delle acquisizioni grezze; ultimo commit 6 ottobre |
| website | `8982f1cfa0c494fcc9323ba9fc83ba599a9314f6` | Sorgenti del sito e licenza dichiarata |

Conteggio effettuato sull'albero corrente con paginazione completa: non è il numero di aziende giuridiche, né di revisioni storiche, né di documenti acquisiti con successo nell'ultima scansione. Una cartella presente non certifica la designazione DSA del servizio. Le raccolte `sandbox` sono escluse. La raccolta `contrib` richiede una valutazione separata.

Campione: la dichiarazione OpenAI contiene sette documenti, inclusi termini e privacy UE; quella Google contiene anche un documento composito formato da quattro URL. La cronologia di Google Privacy Policy espone commit del 3 e 2 ottobre e del 27 maggio 2026. Sono date di registrazione nell'archivio: non attestano da sole l'entrata in vigore o la sostanzialità delle modifiche.

Il README delle dichiarazioni descrive una raccolta orientata all'Europa e alla lingua inglese, con copertura best effort e tag sperimentali. Non risolve automaticamente il bisogno di tutte le lingue, giurisdizioni o aziende di PolicyWatcher. [README della raccolta](https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-declarations/-/blob/8fc00675b9df507322a47c84772840b06f046901/README.md).

## Matrice del riuso

| Elemento | Condizione verificata | Impiego consigliato |
|---|---|---|
| Database delle versioni | README e LICENSE dichiarano CC BY 4.0, salvo indicazioni diverse | Catalogo e storico con attribuzione, collegamento, modifiche indicate e controllo dei diritti sui contenuti |
| Database degli snapshot | Stessa dichiarazione CC BY 4.0 | Riproducibilità dell'estrazione, subordinata alla base di riuso del testo; HTML importato da trattare come contenuto non fidato |
| Dichiarazioni, filtri e codice della raccolta UE | LICENSE AGPL v3; NOTICE contempla v3 o successiva e componenti di altra provenienza | Copia/adattamento possibile rispettando licenza, avvisi e obblighi applicabili al sorgente |
| Motore Open Terms Archive | EUPL 1.2 verificata nell'upstream | Possibile servizio dedicato o componente, con conservazione degli avvisi e valutazione del copyleft |
| Repository del sito UE | README e LICENSE dichiarano CC BY 4.0 | Riuso selettivo dopo verifica delle singole risorse; nessuna autorizzazione implicita a marchi, loghi o identità istituzionale |
| Idee di prodotto e architettura | Idee e principi del software distinti dalla sua espressione protetta | Implementazione autonoma di timeline, confronto, filtri, revisione e tracciabilità |

Fonti specifiche: [licenza versioni](https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-versions/-/blob/0dbd93e5c9b3af461ae31afb9d6b73760b6270c3/README.md), [licenza snapshot](https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-snapshots/-/blob/63a42a5117180af2313c828adce7999b9e1fb82e/README.md), [LICENSE dichiarazioni](https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-declarations/-/blob/8fc00675b9df507322a47c84772840b06f046901/LICENSE), [NOTICE](https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-declarations/-/blob/8fc00675b9df507322a47c84772840b06f046901/NOTICE), [EUPL del motore](https://github.com/OpenTermsArchive/engine/blob/main/LICENSE), [sito UE](https://code.europa.eu/dsa/terms-and-conditions-database/website/-/blob/8982f1cfa0c494fcc9323ba9fc83ba599a9314f6/README.md), [Direttiva 2009/24, art. 1](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32009L0024).

CC BY ammette anche impieghi commerciali e non impone di pubblicare il codice dell'applicazione. Occorre attribuire i materiali condivisi, conservare gli avvisi applicabili, indicare le modifiche e non restringere i diritti concessi sul materiale riutilizzato. La licenza disciplina anche i diritti sui database che il concedente può autorizzare. Non concede diritti altrui o un endorsement. [Testo CC BY 4.0, sezioni 2–4](https://creativecommons.org/licenses/by/4.0/legalcode.en).

La sezione 13 AGPL contiene obblighi specifici per una versione modificata accessibile via rete. EUPL comprende la comunicazione delle funzionalità e prevede obblighi di sorgente e copyleft. Un processo separato via HTTP è una buona separazione architetturale, ma non costituisce automaticamente un'esenzione legale. Perimetro dell'opera derivata e compatibilità vanno verificati sulla concreta integrazione. La sola lettura di dati via API non equivale all'incorporazione del codice del server.

Nel checkout PolicyWatcher esaminato il file LICENSE dichiara CC BY 4.0. Non è sufficiente estendere quella dichiarazione a codice AGPL/EUPL copiato: occorrono avvisi, perimetri e distribuzione coerenti con le licenze dei componenti. Non propongo una relicenza automatica dell'intero progetto.

### Confine dei testi delle aziende

La Commissione limita la propria politica ai diritti che può concedere e segnala possibili autorizzazioni aggiuntive per opere di terzi. Perciò la licenza del database è una base documentata per il suo riuso, non una prova generale di libera ripubblicazione di ogni policy aziendale. [Legal notice della Commissione](https://commission.europa.eu/legal-notice_en), [Decisione 2011/833/UE](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32011D0833).

Proposta operativa: registrare separatamente `collectionLicense`, `contentRightsBasis`, `attribution` e `publicationPermission`. Dove il diritto di riproduzione integrale resta incerto, mostrare inizialmente metadati e collegamenti all'archivio; sottoporre conservazione, estratti e ripubblicazione alla verifica appropriata. Anche un estratto non è automaticamente lecito soltanto perché breve.

Per text and data mining l'articolo 4 della Direttiva 2019/790 richiede accesso lecito e considera la riserva dei diritti; le copie possono essere conservate per il tempo necessario al mining. L'eccezione scientifica dell'articolo 3 ha beneficiari e condizioni specifici. Nessuna delle due va assunta come permesso generale per ripubblicare testi, addestrare modelli o conservare indefinitamente un corpus. La valutazione concreta deve considerare anche il recepimento nazionale. [Direttiva 2019/790](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32019L0790).

## Miglioramenti del motore, in ordine di valore

### 1. Distinguere aggiornamenti del parser e modifiche delle policy

OTA documenta una rielaborazione dello stesso snapshot quando cambiano selettori, filtri, motore o dipendenze, marcata come aggiornamento tecnico. Questo evita che una sezione prima ignorata diventi un falso cambiamento attribuito all'azienda. [Technical upgrades](https://docs.opentermsarchive.org/terms/explanation/technical-upgrades/).

Proposta PolicyWatcher: memorizzare versione del parser, hash della configurazione e dell'input grezzo. Rielaborare il medesimo input prima di confrontare una nuova acquisizione; distinguere `parser_upgrade`, `source_migration`, `historical_import` e `provider_change`. Se manca l'input precedente, dichiarare l'incertezza o avviare una nuova baseline verificata. Un aggiornamento tecnico non deve generare punteggi, notifiche o variazioni KPI. Nel codice e schema v5 esaminati non è emerso un meccanismo completo equivalente; è già presente la gestione della migrazione della fonte.

### 2. Catalogo esterno come coda di discovery

Confrontare perimetri equivalenti: azienda, servizio, documento, lingua, giurisdizione e pubblico destinatario. Le dichiarazioni OTA descrivono URL, selettori, rimozioni, rendering e composizione di più fonti. [Formato delle dichiarazioni](https://docs.opentermsarchive.org/terms/reference/declaration/).

Proposta: creare candidati da revisionare nella coda di onboarding già esistente. Non pubblicare automaticamente ogni file importato. Preservare il titolo originale accanto alla categoria PolicyWatcher; mappare i tipi sconosciuti a revisione. Un documento composito non deve diventare quattro policy conteggiate, né perdere i collegamenti alle sue parti. L'importazione di filtri eseguibili richiede revisione del codice e licenza; non eseguire JavaScript esterno scaricato automaticamente.

### 3. Archivio storico supplementare

Usare cronologia e snapshot UE per ricostruire sequenze realmente disponibili, mostrando archivio, commit, percorso, hash, data della registrazione esterna e data dell'importazione. La data di acquisizione e quella di efficacia restano sconosciute finché non sono supportate da evidenze specifiche.

Architettura proposta: adattatore GitLab con commit fissato, paginazione, checkpoint, limiti di volume, retry con attesa e importazione idempotente. In una prima fase produrre record esterni in staging e riferimenti storici, senza inserirli come controlli live riusciti. Il database UE non deve soddisfare il requisito delle due osservazioni live consecutive né inviare avvisi retroattivi come se fossero novità di oggi.

### 4. Confronto tra estrazioni con revisione delle divergenze

Confrontare testo PolicyWatcher e versione UE solo dopo aver verificato URL, periodo, lingua, perimetro e composizione. Divergenze di sezioni, link, numeri, negazioni e lunghezza aprono un controllo; non provano automaticamente che una delle due estrazioni sia corretta. Per l'identità conservare hash esatti; eventuali hash normalizzati e similarità servono come indizi distinti.

UE e OTA non sono sempre fonti indipendenti: esistono importazioni e componenti comuni. Una copia speculare non vale come seconda conferma. Un archivio istituzionale non certifica l'interpretazione giuridica o la qualità di un riassunto AI.

### 5. Quality assurance misurabile

Creare un campione revisionato, stratificato per tipo e difficoltà. Includere documento invariato con nuovo menu, clausola cambiata, lingua sbagliata, pagina di blocco, sezione omessa, documento composito incompleto, parser aggiornato e archivio obsoleto.

Misurare separatamente: copertura sul catalogo dichiarato; acquisizioni utilizzabili; completezza dell'estrazione sul campione annotato; ritardo di rilevazione; falsi positivi di modifica sostanziale; provenienza completa; citazioni AI effettivamente sostenute dal testo. Pubblicare numeratori, denominatori e limiti. L'accordo con l'archivio UE non è una misura autonoma di accuratezza semantica.

## Funzioni di prodotto trasferibili

| Funzione | Incremento utile per PolicyWatcher |
|---|---|
| Cronologia con collegamenti a commit e snapshot | Evidenza riproducibile e provenienza esterna visibile |
| Catalogo con categorie e ambiti | Copertura confrontabile, distinguendo documenti attesi, trovati, acquisiti e pubblicati |
| Tag tematici | Minori, AI generativa, accesso ai dati e recommender systems come classificazioni editoriali, senza punteggi di conformità impliciti |
| Contributi revisionati | Proposte di URL e correzioni con autore, motivazione, test e approvazione editoriale prima della pubblicazione |
| Feed ed esportazioni | Aggiornamenti per documento o raccolta, con fonte e licenza conservate nell'export |
| Ricerca federata | Discovery in altre raccolte OTA con ambito e licenza verificati singolarmente |

La documentazione OTA descrive API di raccolta, metadati, dataset e feed Atom; la Federation API è presentata come preview. Non è stata verificata l'esistenza di una Collection API pubblica operativa per questa specifica installazione UE: l'interfaccia effettivamente provata è GitLab. Il package della raccolta UE dichiara `@opentermsarchive/engine: ^5.0.2`; ciò non identifica la versione realmente installata e non prova che possieda tutte le funzioni della documentazione OTA corrente. [Collection API](https://docs.opentermsarchive.org/api/collection/), [Federation API](https://docs.opentermsarchive.org/api/federation/).

Filtri per tipo, confronti, evidenze e percorso cittadino esistono già in PolicyWatcher: il guadagno principale è ampliare fonti e riproducibilità. Nella v5 sono documentati selezione locale dei servizi, riassunti con passaggi ancorati, guide ufficiali e gestione personale della revisione. Queste funzioni non vanno ripresentate come nuove eredità dal portale UE.

## Integrazione con l'architettura esaminata

Riferimento locale: checkout v5, commit `085d7fc`, al percorso `/Users/fabriziodegni/Documents/Codex/PolicyWatcher-citizen-20261006`.

- `src/lib/scraper.ts`: acquisizione e validazione; innestare la registrazione del profilo di estrazione senza indebolire i controlli.
- `src/lib/changeConfirmation.ts`: mantenere la conferma consecutiva; gli import storici non devono alimentarla.
- `prisma/schema.prisma`: riusare onboarding e riferimenti storici; valutare un record additivo di provenienza esterna invece di attribuire gli import a scansioni locali.
- `docs/source-reliability.md`: preservare migrazione controllata, distinzione baseline/cambio e freshness degli archivi.
- `docs/document-evidence-model.md`: il modello canonico Entity → Document → Version → Change → Provision è predisposto, ma la documentazione mantiene gate separati per backfill, dual-write e attivazione delle letture. Questa integrazione non giustifica un cambio implicito del modello operativo.

## Primo intervento consigliato e criteri di accettazione

Pilotare discovery e provenienza su Google, OpenAI e Meta, inizialmente per privacy e termini. La disponibilità dei documenti per ciascun abbinamento va verificata; non assumere che il catalogo sia completo.

1. Inventario in sola lettura, commit fissati e manifest delle licenze; nessuna notifica o scrittura nel database di produzione.
2. Proposta di corrispondenze con il catalogo PolicyWatcher, stati espliciti per ambito incerto e diritti da chiarire.
3. Test del trattamento degli aggiornamenti tecnici su fixture controllate.
4. Import storico in staging per i contenuti con base di riuso documentata; revisione di attribuzione e visualizzazione.
5. Eventuale attivazione dopo misurazione dei risultati e confronto dei KPI prima/dopo a parità di perimetro.

Accettazione: ogni import ha origine, commit, hash e stato dei diritti; rieseguire l'import non duplica record; il cambio del parser non genera un cambio aziendale; un archivio vecchio non diventa una verifica corrente; un caso con lingua o giurisdizione diversa resta separato; un testo incompleto viene trattenuto; esportazioni mantengono attribuzioni; indisponibilità dell'upstream non blocca la scansione primaria.

Prima della ripubblicazione sistematica dei testi completi, il punto legale da risolvere è il perimetro dei diritti sui documenti di terzi, mediante verifica specialistica o chiarimento del titolare competente. Discovery, progettazione del parser e tracciabilità possono intanto avanzare nel perimetro sopra descritto.
