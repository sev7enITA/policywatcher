# PolicyWatcher: interventi SEO del 23 settembre 2026

## Stato e provenienza

Implementazione completata e verificata localmente su una build di produzione Next.js e un database SQLite sintetico. Il sito online e il database di produzione non sono stati modificati. I numeri di verifica riportati sotto riguardano il candidato locale, non una nuova scansione della produzione dopo il rilascio.

Base: commit `ca6bb395f2a7ecd7d3128d501b8f8dba978e7fcf`, branch `codex/change-classification`, indicato nel rapporto di deployment dell'11 settembre come sorgente della release pubblicata. Branch di lavoro: `codex/seo-visibility-20260923`. Versione applicativa mantenuta a `4.0.0-beta.3`; il candidato è distinguibile mediante commit, etichetta dell'archivio e SHA-256.

La cartella originale conteneva numerose modifiche di altre attività e file non completamente disponibili in locale. Per conservarle, il codice è stato aggiornato in `/Users/fabriziodegni/.codex/worktrees/policywatcher-seo-20260923`. Non applicare la patch alla cieca sul vecchio checkout: deve essere integrata sulla base indicata o tramite un cherry-pick con revisione dei conflitti.

## Modifiche realizzate

| Area dell'audit | Intervento e risultato |
|---|---|
| SEO-02, base corretta | Checkout isolato dalla release pubblicata documentata; preservate le modifiche pendenti nella cartella originale. |
| SEO-03, HTML pubblico | Rimossi i loader globali che lasciavano i contenuti nei segmenti nascosti dello streaming senza JavaScript. Conservato il loader amministrativo. Homepage e Knowledge rendono direttamente contenuti, fonti e stati di indisponibilità. |
| SEO-04, titoli | I cambiamenti e i pacchetti evidenze identificano azienda, policy, giurisdizione, data e versione. Le policy regionali includono la giurisdizione in titolo, descrizione e intestazione. UUID e permalink esistenti conservati. |
| SEO-05, dati strutturati | Rimosso `AggregateRating` dai punteggi AI. Aggiunti breadcrumb visibili con JSON-LD; collegati editore e autore mediante identificatori stabili. La relazione fra scheda derivata e fonte originale usa `isBasedOn`. Profilo GitHub personale distinto dal repository; corretto il collegamento LinkedIn a `fdegni`. |
| SEO-06, coerenza | Descrizioni dei cambiamenti, JSON-LD, sintesi iniziale e riepiloghi Knowledge derivano dalla classificazione del confronto. Le sintesi AI storiche restano leggibili, etichettate come originali e separate dalla descrizione della revisione. La sezione storica usa `data-nosnippet` per limitarne l'estrazione negli snippet compatibili. |
| SEO-07, freschezza | Home, indice e schede policy segnalano acquisizioni più vecchie di sette giorni e date assenti. È una soglia informativa comune, non un giudizio sullo scanner né una garanzia di aggiornamento per fonte. `lastmod` dell'indice usa l'ultimo aggiornamento pertinente dei record pubblici. |
| SEO-08, lingue | Lingua del documento determinata dagli URL supportati. Estensione browser in inglese sul percorso base e italiano su `?lang=it`; metadati e selettore concordano. Un componente senza contenuto mantiene `html.lang` coerente durante la navigazione client. Le preferenze locali dei widget non riscrivono più arbitrariamente la lingua del documento. |
| SEO-09, home | Proposta di valore esplicita, indice pubblico aperto, collegamenti immediati a fonti, guide e metodologia. Accesso diretto al workspace; condizioni d'uso circoscritte al workspace interattivo. |
| SEO-10, contenuti | Quattro guide distinte, ciascuna in EN/IT: informative privacy, policy dei fornitori AI, termini di servizio, accordi sul trattamento dei dati. Contengono metodo di lettura, verifiche, limiti e link alle sole schede pubbliche pertinenti. Assistenza AI dichiarata; nessuna attribuzione fittizia di revisione umana. |
| SEO-11, identità | Grafo Organization/Person anche nella pagina About e collegamenti autore coerenti. Nessuna biografia, qualifica o pubblicazione non verificata è stata aggiunta. |
| SEO-12, anteprime e collegamenti | Metadati Open Graph e Twitter specifici per pagina, immagini di fallback e conservazione delle card dedicate. Guide collegate da home, header, footer, Knowledge e `llms.txt`. |
| SEO-13, URL mancanti | Metadati nel primo `head` per tutti i lettori e rimozione dei confini di caricamento pubblico problematici. Le URL inesistenti campionate restituiscono ora 404 effettivo con `noindex`. |
| SEO-01/16, strumenti | Supporto facoltativo ai token `GOOGLE_SITE_VERIFICATION` e `BING_SITE_VERIFICATION`, documentato in `.env.example`. Nuovo comando ripetibile `npm run seo:smoke`. Non sono stati inseriti tracker di terze parti. |

La sitemap contiene entrambe le traduzioni delle guide, dell'estensione, dei cambiamenti e degli articoli Pulse con riferimenti linguistici reciproci. Il numero delle URL aumenta per le traduzioni reali e le nuove guide, non per combinazioni arbitrarie di keyword e filtri.

## Verifiche

- TypeScript applicativo e test critici: superati.
- Suite completa: **1.119 test superati in 169 file**.
- ESLint web: superato; controllo sintattico dello script di packaging e `git diff --check` superati.
- Build di produzione Next.js 16.2.11: completata.
- Browser Chromium: **55 verifiche**, con/senza JavaScript, desktop e larghezza mobile di 390 px; nessun errore di pagina o idratazione rilevato. Inclusi cambi di lingua tramite navigazione client e ritorno a una pagina inglese.
- Sitemap del database di prova: **106/106 pagine con HTTP 200**, titolo, descrizione, canonical nel `head` e anteprima social; nessun `noindex` improprio, JSON-LD non parsabile, rating AI come recensione o esposizione della fixture privata.
- **57 immagini social** verificate: HTTP 200 e tipo immagine.
- Sei URL inesistenti, verificate sia con sia senza JavaScript: HTTP 404 e `noindex`.
- Nessuna collisione di titoli fra record distinti nel campione. Il titolo del medesimo documento può coincidere nelle due lingue quando il suo nome originale non viene tradotto; i canonical e le descrizioni rimangono distinti.

Il database sintetico contiene due policy omonime in giurisdizioni diverse, due modifiche con sintesi AI storiche volutamente incoerenti e una policy privata che deve restare esclusa. Non sono stati copiati dati o segreti di produzione. Queste prove non attestano l'indicizzazione in Google né sostituiscono i dati Core Web Vitals degli utenti reali.

## Rilascio e controllo successivo

1. Usare il pacchetto tracciabile creato con `scripts/package-release.sh`, che verifica ora anche guide, helper SEO e componenti nuovi. L'archivio non contiene database, `.env` di lavoro o dipendenze installate.
2. Pubblicare lo stesso archivio nell'applicazione staging separata e completare lo smoke test Hostinger previsto dal progetto. Verificare che staging rimanga escluso dall'indice.
3. Eseguire `npm run seo:smoke -- --base-url https://staging.policywatcher.online --expect-noindex --output seo-staging.json`.
4. Seguire la promozione già prevista in `docs/hostinger-staging-promotion.md`: verifica staging valida e approvazione umana esplicita prima della produzione. Non creare una dichiarazione di approvazione o un rapporto staging sintetico.
5. Dopo la pubblicazione, eseguire `npm run seo:smoke -- --base-url https://policywatcher.online --output seo-production.json`; ripetere i controlli no-JavaScript e delle traduzioni su record reali.
6. In Search Console/Bing verificare la sitemap e ispezionare home, una guida per lingua, azienda, policy, cambiamento ed evidenza. Valutare canonical selezionato e HTML renderizzato dal motore.

La scelta di fornire metadati completi nel primo HTML e attendere i dati pubblici può aumentare il tempo prima del primo byte quando il database è lento. Le query condivise fra pagina e metadati sono memoizzate per richiesta, senza allentare i controlli di pubblicazione. Misurare TTFB e Core Web Vitals sul deployment reale prima di introdurre ulteriori cache.

## Attività esterne ancora da completare

- **Misurazione:** dati autenticati Search Console/Bing e baseline per pagina, query, paese, dispositivo e brand/non-brand. I token opzionali non equivalgono alla verifica avvenuta delle proprietà.
- **Scanner:** verificare operatività, pianificazione ed esiti delle acquisizioni su produzione. L'avviso di freschezza rende visibile il limite, non lo risolve operativamente; nessuna data è stata artificiosamente aggiornata.
- **Contenuti originali:** approfondimenti fondati su modifiche effettivamente documentate, con firma e revisione reali; eventuali pubblicazioni e profili accademici dell'autore vanno verificati prima dell'inserimento.
- **Reputazione e distribuzione:** verifica dell'eventuale segnalazione reputazionale, valutazione delle testate proposte e citazioni editoriali pertinenti. Nessuna email, richiesta di rettifica o campagna di link è stata inviata.
- **Risultati:** confrontare finestre omogenee di 28 giorni per impression/clic non di brand, URL eleggibili indicizzate e azioni utili. Non attribuire a questi interventi un incremento di ranking o citazioni AI prima di misurarlo.

## Riferimenti tecnici

La configurazione dei metadati segue la documentazione [Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata). Le modifiche al rendering perseguono accessibilità del contenuto iniziale e coerenza delle rappresentazioni, senza sostenere che Google non esegua JavaScript: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

Il punteggio AI non è un insieme di recensioni: [Google, review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet). `llms.txt` resta una guida alle fonti; non viene presentato come un fattore di ranking: [Google, funzionalità AI e siti](https://developers.google.com/search/docs/appearance/ai-features).
