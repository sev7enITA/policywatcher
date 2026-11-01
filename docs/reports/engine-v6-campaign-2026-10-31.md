# Engine 6: campagna di qualificazione

Avviata il 31 ottobre 2026. La priorità resta affidabilità e copertura. Il servizio pubblico rimane 5.2.0; nessuna attivazione del motore sperimentale o pubblicazione di cambiamenti reali.

## Risultati eseguiti

| Prova | Risultato | Limite |
| --- | --- | --- |
| Suite completa dopo correzione recupero | 1.455 superati, 14 esclusi; 193 file superati, 3 esclusi | Non misura accuratezza sulle fonti reali |
| TypeScript applicazione e test critici | Superati | Verifica statica |
| Lint web | 0 errori, 15 warning preesistenti | Non è un audit dinamico |
| Catalogo autenticato, sola lettura | 113 policy, 109 URL di recupero, 104 endpoint HTTP, 24 origini | Il catalogo pubblico restituisce 109 policy, non 113 |
| Acquisizione completa del catalogo | 107 tentativi, 101/104 endpoint recuperati, 105/109 ambiti estratti, 91,16 s | Mac locale, 3 worker, nessun modello o renderer; non 500 fonti distinte |
| Latenza endpoint | p50 650 ms, p95 2.340 ms | Include retry dell'endpoint; non include attesa in coda o inferenza |
| Controlli strutturali delle estrazioni | 79/105 ambiti con questioni irrisolte; 8 con lingua assente | Nessuna approvazione di completezza, neppure per i 26 senza segnalazioni |
| Prima finestra della coorte congelata | 12/12 catture nuove; 1 data conteggiata, 31 ottobre | PDF senza lingua verificata nel risultato automatico; non è una campagna su più giorni |
| Recupero massivo dopo la correzione | 500 lease scaduti iniettati; 4 processi; 250 riaccodati e 250 terminali; 829 ms | Fault injection sul Mac, non attesa naturale e non misura VPS |

I quattro ambiti bloccati nel recupero/estrazione sono Meta AI Terms (HTTP 200 ma estrazione fuori dai limiti), Stripe US Privacy e SSA (redirect verso `en-it`, correttamente respinto come cambio di ambito), X Rules (403 con entrambi i trasporti). Non sono stati modificati gli URL di produzione per far passare la prova.

Le 79 estrazioni segnalate richiedono una classificazione delle parti della pagina: contenuto di policy, interfaccia, contenuto irrisolto e contenuto non disponibile. I motivi includono controlli interattivi, rimozioni non revisionate, confini ambigui, metadati di intestazione, disclosure e dialoghi. Questi esiti sono sospensioni di validazione, non 79 documenti necessariamente incompleti.

Il seguito con il renderer VPS configurato, dopo mezzanotte del 1 novembre, ha recuperato Meta AI Terms (14.790 caratteri, inglese, nessuna deviazione URL). Le due fonti Stripe hanno restituito testi tedeschi con deviazione di ambito; X ha restituito ancora 403 e una pagina di blocco. Queste quattro richieste non costituiscono una seconda finestra completa della coorte. Il [registro per fonte](engine-v6-source-review-ledger-2026-10-31.json) conserva 109 ambiti: 108 sospesi e uno non disponibile, nessun contratto approvato.

## Carico con attese, interruzione e ripresa

Il test su `c12c60a` ha usato 500 baseline sintetiche in modalità publish, esclusivamente nel DB locale dedicato, quattro processi, latenze iniettate di 800 ms/4 s, 5% di prime risposte 429 simulate e un vero SIGKILL con scadenza naturale del lease. Ha superato il limite di 12 minuti del runner: 960 task su 1.000 risultavano completati, con 479 controlli/anchor registrati. L'esito originale resta **non superato** e non è stato sovrascritto.

I backoff per origine sono stati rispettati. La continuazione esplicita sullo stesso DB, con il commit `7c9f3f0`, ha terminato in altri 179,26 secondi: 1.000 task conclusi, 500 esiti `unchanged`, 500 controlli univoci, zero prenotazioni residue, zero modifiche, nuovi snapshot, revisioni o notifiche. Sono circa 16,98 minuti complessivi includendo l'intervento fra le due fasi, non un benchmark ininterrotto del commit finale.

Durante la verifica è stato corretto anche il contatore del runner: `lastSuccessfulCheckDate` aveva un default corrente nel fixture e poteva far apparire verificate policy non ancora elaborate. Il fixture ora inizializza quella data all'epoca; la ripresa verifica invece esplicitamente gli esiti `unchanged`, i controlli univoci e gli anchor. Il contatore difettoso del primo report rimane visibile ma non è utilizzato come prova di completamento.

Backup SQLite e riapertura di un ripristino del DB sintetico sono riusciti: 45 tabelle, 1.000 task, digest logico dei dati identico e controllo di integrità `ok`. Questo non qualifica il ripristino operativo in produzione.

## Revisione indipendente e difetto corretto

GLM-5.3 Max ha ripreso correttamente il lavoro in ZCode. Ha revisionato il protocollo di carico e poi il recupero dopo interruzione. La misura iniziale di 500 lease, 1.885 ms senza errori di lock, non confermava un problema prestazionale a questa scala sul Mac. Ha invece trovato un caso reale: crash dopo il commit dell'ultimo task e prima dell'aggiornamento della scansione. Al riavvio, senza altri lease scaduti, il run poteva rimanere `running` o `queued`.

Due test riproducevano il difetto. Il commit `867d3ce` esegue ora due aggiornamenti con predicati sullo stato corrente dei task, recuperando anche i run orfani e preservando quelli attivi o annullati. Rimuove inoltre le riconciliazioni ripetute per ogni lease. Entrambi i test passano; il benchmark massivo resta coerente. Il confronto 1.885/829 ms è una singola coppia di misure locali, non una stima generalizzabile di accelerazione.

Gemini 4 Argon Alta ha revisionato il protocollo delle fonti e delle finestre temporali. Non disponeva di accesso HTTP diretto nel contesto della revisione: questa impossibilità è registrata, non sostituita con conoscenze a memoria. Gli è stata poi fornita una cattura del contenuto principale di Google Privacy IT dal browser, indipendente dal parser PolicyWatcher e priva dell'intestazione dell'account.

Le cinque ancore proposte da Gemini hanno conteggi verificati di 1, 1, 2, 1 e 7, conservati nell'estrazione. Due conteggi strutturali del modello erano errati: 122 intestazioni proposte contro 121 osservate e 227 link contro 308. Sono stati corretti nell'evidenza; non sono diventati aspettative del parser. La riga terminale compare una volta nel testo principale del browser e due nell'estrazione estesa: resta da classificare. Definizioni nascoste e rinvii esterni rimangono da verificare. La fonte resta `held`.

## Osservazioni nei giorni successivi

Coorte: `output/engine-daily-cohort-20261031`, inizializzata su `5101cb9`. Il manifest congela il corpus di 12 fonti e l'identità dei componenti di acquisizione/estrazione e del relativo runner. Non pretende di congelare ogni componente del motore: le prove di persistenza hanno revisioni separate.

Il conteggio richiede date Europe/Rome distinte, almeno 20 ore per fonte tra finestre e almeno 48 ore dalla prima all'ultima. Il primo rilievo è del 31 ottobre alle 23:42 circa. Con il seguito giornaliero delle 21:00, tre date possono ancora avere uno span inferiore a 48 ore: il criterio non viene abbreviato per ottenere un esito positivo. Replay, 304 e retry non forniscono giorni mancanti. Cambiamenti al codice di acquisizione o al corpus richiedono una nuova coorte live.

Automazione attiva: `policywatcher-engine-6-osservazioni-giornaliere`, ore 21:00 Europe/Rome, nella chat corrente. Richiede l'ambiente locale disponibile; aggiorna Git e sito per nuove evidenze verificate. Non attiva Engine 6. Nessun risultato futuro è attestato.

## Prove e limiti ancora aperti

Restano la revisione fonte per fonte dei contratti e delle esclusioni, la chiusura dei casi strutturali, i giorni realmente successivi, il percorso renderer e la capacità sull'infrastruttura destinata al motore. Il catalogo dispone di 113 policy configurate: un carico da 500 record sintetici non viene chiamato 500 fonti reali. Modelli, storage, backup/ripristino e variazioni di carico sulla VPS richiedono misure proprie.

Le catture sono artefatti di documento decodificato: per i PDF la pipeline attuale conserva una rappresentazione convertita, non necessariamente il PDF binario originale. La prova indipendente AWS conserva anche il PDF originale e una lettura `pdftotext -layout`; non modifica retroattivamente la prima finestra.

Sul [PDF originale AWS](https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf), 10 pagine, la sequenza di 4.519 token di parola coincide interamente tra Poppler e l'estrazione Engine 6. Il confronto ignora esplicitamente punteggiatura, maiuscole e spazi; non attesta equivalenza di layout o dei documenti incorporati. Le cinque ancore della successiva proposta Gemini hanno conteggi 1/1/1/1/4 verificati in entrambe le letture. La richiesta PDF è partita con Argon Alta selezionato, ma al completamento l'interfaccia segnalava esaurimento quota e passaggio a Flash-Lite: l'identità del modello di questa specifica risposta resta non confermata. Le precedenti revisioni metodologiche e l'annotazione Google sono registrate separatamente.

Evidenze strutturate: [registro](engine-v6-campaign-evidence-2026-10-31.json) e [manifest SHA-256](engine-v6-campaign-manifest-2026-10-31.json). I log, le risposte integrali dei modelli, le catture e i database di prova restano sotto `output/`, esclusi da Git. Nessuna credenziale è inclusa nei report versionati.

## Diario pubblico e seguito

Il [diario pubblico bilingue](https://policywatcher.online/engine-6-preview?lang=it) è stato aggiornato il 1 novembre alle 00:05:35 Europe/Rome, conservando i diagrammi di architettura, flusso decisionale ed entità/relazioni. La [ricevuta di pubblicazione](engine-v6-publication-2026-11-01.json) identifica l'archivio `d818faea3276f5f296b5faaf8d8aff868681f4658c906e956a07a16c8943fc58` e il commit del sito `6140faa`. Il confronto con il rilascio precedente modifica esclusivamente la pagina del diario, oltre al manifest rigenerato nell'archivio. Runtime e schema pubblici restano 5.2.0; Engine 6 non è incluso nel deployment.

Staging ha superato 11 controlli di rilascio e 10 controlli di pagina/diagrammi. In produzione, 11 controlli di pagina/diagrammi sono superati; health e integrità del DB sono `ok`, con 35 tabelle e 19 migrazioni. La verifica amministrativa registra 9 controlli superati e uno esterno: il test dinamico indipendente di sicurezza non è stato eseguito, perciò il suo stato complessivo resta correttamente `attention`. Il backup online precedente al rilascio è stato riletto con `quick_check=ok`: 18 aziende, 113 policy, 120 modifiche e 244 snapshot. Questa verifica non prova un ripristino operativo di produzione.

I branch `codex/engine-v6-local` e `codex/engine6-preview-announcement` sono stati inviati al repository remoto; `main` è invariato. La rilettura finale della coorte conferma una sola finestra accettata e componenti di acquisizione ancora corrispondenti al manifest congelato. L'ultima risposta GLM richiesta dopo la correzione resta da leggere perché il Mac si è bloccato; le revisioni precedenti già lette e la correzione verificata sono documentate sopra. Il seguito delle 21:00 prosegue completezza, osservazioni temporali e scala mantenendo distinti i tre criteri di qualificazione.

## Seguito del 1 novembre, 13:31 Europe/Rome

ZCode è nuovamente accessibile. La risposta GLM-5.3 Max già completata il 31 ottobre alle 23:50 è stata letta: giudica corretta la correzione `867d3ce`, dopo lettura del diff e dei due test, senza eseguire test propri. Il parere riguarda il recupero dei run e non approva Engine 6 per produzione. Restano note non bloccanti sul doppio percorso di riconciliazione, sul timestamp di chiusura attribuito dallo sweep, sulla necessità di worker attivi e su ulteriori casi misti/concorrenziali. L'estratto originale è conservato sotto `output/engine-selector-20261101/glm-final-review-ui.txt`; la precedente ricevuta di pubblicazione resta una fotografia corretta dello stato noto al momento del rilascio.

È stata valutata anche la richiesta di scegliere fra stabile e sperimentale: la [proposta di canali](../architecture/engine-channel-selection-proposal.md) raccomanda stabile predefinito, preview con risultati separati e confronto amministrativo. È una proposta non implementata; non cambia la configurazione pubblica né la coorte di acquisizione congelata.

## Seguito del 1 novembre, 20:29 Europe/Rome

La seconda finestra reale è accettata: 12 fonti, due date, intervallo minimo 20,7712 ore e identità di acquisizione ancora corrispondente al manifest congelato. I 12 testi estratti sono invariati; 10 payload decodificati differiscono. Completezza, lingua del PDF, almeno tre date e 48 ore complessive, e capacità reale restano da qualificare. Non sono stati creati cambiamenti o notifiche pubblici.

Il selettore Stable/Preview e il confronto dei due estrattori sulla stessa cattura sono ora implementati nel solo ambiente locale isolato. Il [rapporto dei canali](engine-v6-channels-2026-11-01.md) documenta 1.469 test superati, il percorso browser e le revisioni GLM/Gemini. L'aggiornamento successivo del diario pubblico è preparato ma attende lo sblocco del Mac: il deployment delle 00:05 rimane l'ultimo pubblicato.
