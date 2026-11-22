# Pareri esterni e adjudicazione

Perimetro: codice pubblico fornito ai revisori e prove offline locali. Le risposte grezze, incluse quelle parziali o errate, restano in `output/workflow-consistency-20261122/`. Le ricevute pubblicate riportano modello, provider, token, esito del limite di output e costo delle singole generazioni; non contengono credenziali o identificativi dell’account.

| Osservazione del modello | Verifica sul codice / decisione |
|---|---|
| La prima cattura può avere più di 48 ore e rendere falso il gate di freschezza. | Non dimostrato come bypass: la conferma ha una finestra distinta di un’ora-sette giorni; il controllo delle 48 ore riguarda l’osservazione attuale usata nel commit. Le finestre restano esplicite nei diagrammi, senza chiamarle qualifica temporale della coorte. |
| Il replay dovrebbe usare soltanto il vecchio parser. | Respinto: lo scopo è confrontare una trasformazione proposta dal parser attuale con l’originale conservato. Richiede revisione; non sostituisce automaticamente la fonte storica. |
| Un redirect di allegato passa il confronto esatto del final URL. | Respinto: il trasporto rifiuta i redirect prima di contattare il target e il collector controlla di nuovo URL/status/media. |
| La seconda valutazione perde gli allegati del corpo. | Respinto: `assessCapture` ricava prove e link dal corpo conservato in entrambe le chiamate. Gli stessi casi di acquisizione/rivalutazione sono coperti dai test. |
| `TransportProof` può essere il client HTTP con riferimenti circolari. | Respinto: il tipo e i costruttori contengono fatti limitati, non il client. Il nuovo mapping degli errori copia solo proprietà ammesse. |
| La mappa delle richieste fallite blocca per sempre futuri run. | Respinto: la mappa appartiene a una singola chiamata di acquisizione. Il riuso evita richieste ripetute nei fallback del medesimo run; una nuova acquisizione ha una nuova mappa. |
| Il 304 precede o salta i controlli di idoneità. | Respinto anche dal controllo successivo del modello: osservazione e artefatto vengono ricontrollati prima del percorso invariato. Il nuovo profilo/contratto cambia la chiave cache; allegati attesi escludono il riuso. |
| `validateOutboundUrl` permette credenziali o schemi non HTTP. | Respinto: la funzione li rifiuta esplicitamente. Il riesame focalizzato non ne aveva ricevuto l’intera definizione, quindi non poteva affermare il contrario. |
| CNAME o SNI cambiano l’URL effettivo come un redirect. | Non dimostrato: risoluzione dell’indirizzo e identità dell’URL sono piani distinti. Il trasporto mantiene pin dell’indirizzo, host/SNI e verifica TLS; nessun test o bypass effettivo è stato prodotto dal modello. |
| Una richiesta fallita deve liberare sempre tutta la riserva. | Non adottato: è una scelta conservativa esplicita. Il consumo decodificato di una lettura fallita è incerto; tenere la riserva limita il lavoro aggiuntivo. I successi piccoli rimborsano la differenza. Disponibilità e budget di rete restano limiti separati. |
| L’hash dell’artefatto dovrebbe coincidere con l’hash del documento. | Respinto: il primo identifica il JSON conservato, il secondo il testo. `readArtifact` verifica i byte JSON; la valutazione ricostruisce la struttura dal testo e il CAS controlla il contesto della baseline. |
| Gli allegati corrispondenti dovrebbero consentire pubblicazione e le osservazioni non dovrebbero fallire. | Respinto: copertura e diritto a pubblicare sono controlli diversi. L’analisi delle modifiche dei soli allegati è non qualificata; una modalità privata non rende completa una prova mancante. |
| Orologi wall-clock non affidabili possono alterare le scadenze. | Limite operativo preesistente, non nuovo bypass dimostrato. Il codice usa anche token/generazioni e ownership nella transazione. Non è stato eseguito uno stress di clock/riavvii reali e nessuna garanzia monotona è disegnata. |

I cinque riscontri corretti sono stati riprodotti o verificati nel flusso reale del codice dagli agenti dedicati e dal coordinatore; non sono dedotti dal numero di risposte dei modelli. Le controprove negative, le riesecuzioni indipendenti e la build sono evidenze diverse dai pareri.
