# Scelta del motore: proposta, 1 novembre 2026

Stato: proposta per discussione, non implementata e non attivata sul sito.

## Raccomandazione

Offrire due canali agli amministratori e ai partecipanti al collaudo: **Stabile, attualmente in produzione** come predefinito e **Engine 6 Preview, sperimentale** come scelta esplicita. La parola stabile identifica il canale operativo, non certifica completezza o assenza di errori. Il lettore pubblico continua a ricevere il risultato ufficiale senza dover scegliere un'infrastruttura.

La scelta della preview produce inizialmente un rapporto separato, senza modificare baseline, storico pubblico o notifiche. Un'opzione amministrativa **Confronta i motori** permette di leggere differenze ed evidenze affiancate. Non si introduce una scelta arbitraria del modello linguistico: motore di scansione e modello di analisi sono decisioni distinte.

## Perché è utile e quando non lo è

Il doppio canale consente un passaggio graduale e reversibile, riscontri sul catalogo reale e verifica dei miglioramenti senza interrompere il servizio. Non ha senso presentare le due versioni come equivalenti o chiedere al lettore di stabilire quale risposta sia vera. Due risultati discordanti richiedono confronto con il documento originale e annotazioni verificate; il motore stabile non è una ground truth.

Costi, carico sugli editori, code e lavoro di revisione aumentano se ogni richiesta esegue entrambi i motori. La modalità di confronto va limitata a una coorte esplicita, con budget e pacing condivisi per origine, senza ridurre Retry-After. Una quota separata di risorse deve impedire alla preview di ritardare il servizio stabile.

## Comportamento proposto

| Modalità | Risultato | Effetti ufficiali nella fase iniziale |
| --- | --- | --- |
| Stabile, predefinita | Scansione operativa corrente | Solo attraverso i controlli di pubblicazione esistenti |
| Engine 6 Preview | Rapporto sperimentale chiaramente identificato | Nessuna modifica a baseline, storico pubblico o notifiche |
| Confronto, opzione per amministratori | Due rapporti collegati e differenze motivate | Il solo canale stabile resta autorevole per il servizio |

Ogni esecuzione deve conservare canale, versione del motore e del parser, configurazione/modelli risolti, ambito della fonte, baseline iniziale e identificativo di confronto. La scelta resta immutabile durante il run. Un eventuale ripiego sullo stabile deve essere esplicito e registrato come nuova esecuzione; non deve apparire come successo della preview.

Per confrontare parser e analisi si riutilizza la medesima cattura originale immutabile. Per confrontare l'acquisizione servono invece tentativi live distinti, con tempi, trasporti, lingua e ambito documentati: il replay di una cattura non misura il recupero Internet. Le prove temporali restano nella coorte già congelata, senza modificarne retroattivamente l'identità.

## Stato verificato nel codice corrente

`src/lib/engine/store.ts` distingue già i run `observe` e `publish`; `src/app/api/admin/engine/route.ts` protegge la pubblicazione con un flag e richiede autorizzazione amministrativa. `src/lib/engine/pipeline.ts` impedisce alle osservazioni di seguire il percorso di pubblicazione. Non esistono ancora un selettore unificato stabile/preview e un confronto appaiato pronto per utenti pubblici.

L'osservazione non equivale a isolamento infrastrutturale: i task della preview leggono ancora le policy e la baseline correnti, usano prenotazioni per policy e scrivono i propri stati di esecuzione. Servono quindi isolamento dei risultati, limiti di risorse e verifiche di non interferenza con lo scanner operativo prima della convivenza in produzione. Nell'immediato la preview resta nell'ambiente isolato.

## Condizioni prima di estendere l'accesso

- Qualifica fonte per fonte, osservazioni su giorni realmente successivi e prova di capacità sull'infrastruttura destinata al servizio.
- Zero modifiche ufficiali o notifiche provenienti dalle esecuzioni preview; autorizzazione verificata sul server.
- Confronti riproducibili, attribuzione di errori e costi per versione, controllo delle code e ritorno al canale stabile.
- Per qualsiasi successiva pubblicazione da Engine 6, mantenimento degli stessi requisiti di prova e revisione dei casi dubbi o ad alto impatto. La scelta dell'utente non riduce questi requisiti.

Il precedente tecnico è la valutazione graduale di una nuova versione e il confronto con traffico/casi reali descritti nel [Google SRE Workbook, Canarying Releases](https://sre.google/workbook/canarying-releases/). L'applicazione a PolicyWatcher sopra è una proposta specifica, non una qualifica già ottenuta.
