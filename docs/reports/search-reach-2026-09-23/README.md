# PolicyWatcher: pubblicazione e visibilità nella ricerca

Le modifiche sono pubblicate su **policywatcher.online**, dopo la verifica dello stesso archivio sullo staging. Questa relazione distingue i risultati tecnici dalle richieste ancora in elaborazione presso i motori.

## Contenuti pubblicati

| Dossier | Collegamenti |
| --- | --- |
| Meta e raccolta automatizzata nei termini Facebook | [Italiano](https://policywatcher.online/guides/meta-automated-data-collection-terms?lang=it) / [English](https://policywatcher.online/guides/meta-automated-data-collection-terms) |
| AWS Data Processing Addendum: identità della fonte e baseline | [Italiano](https://policywatcher.online/guides/aws-data-processing-addendum-dpa?lang=it) / [English](https://policywatcher.online/guides/aws-data-processing-addendum-dpa) |
| Anthropic Usage Policy / Acceptable Use Policy | [Italiano](https://policywatcher.online/guides/anthropic-acceptable-use-policy?lang=it) / [English](https://policywatcher.online/guides/anthropic-acceptable-use-policy) |

I dossier rispondono alle opportunità emerse dalle query effettive, collegando fonti ufficiali, date e schede pubbliche. Sono raggiungibili dall'indice Guide, dalla sitemap e dalle policy e revisioni pertinenti. Le due lingue hanno canonical e hreflang coerenti, metadati social e Article con citazioni.

Per Meta è documentata la sequenza V3/V4/V5: il testo del 23 settembre torna all'hash precedente alla revisione di luglio. Questa osservazione non dimostra una modifica giuridica né una sua revoca. Per AWS è chiarito che la fonte monitorata è la pagina del whitepaper che rimanda al DPA. AWS e Anthropic avevano una sola baseline pubblica al momento della verifica. I testi dichiarano l'assistenza AI e non attribuiscono una revisione umana inesistente.

## Interventi tecnici

- Redirect permanente in un solo passaggio da `www` e `?lang=en` agli URL canonici delle pagine localizzate. I parametri pertinenti restano conservati; API, selettore italiano e richieste POST mantengono il proprio comportamento.
- Collegamenti contestuali fra guide, schede delle policy, revisioni e pacchetti di evidenze.
- Landmark principale, gerarchia delle intestazioni e contrasto della pagina revisione corretti. Navigazione desktop disposta su due righe per evitare sovrapposizioni.
- Verifica della proprietà Bing pubblicata e completata; file pubblico IndexNow e comando di invio selettivo, con controllo preventivo di canonical, stato HTTP e indicizzabilità.
- Link Markdown in `llms.txt`: utili ai consumatori del documento, senza attribuire loro un effetto sul ranking Google.

## Verifiche dopo la pubblicazione

| Controllo | Esito |
| --- | --- |
| Test applicativi | 1.120 superati in 169 file |
| TypeScript e test critici | Superati |
| Lint web e mobile | Superato |
| Build locale di produzione | Superata |
| Sitemap su database locale sintetico | 112 pagine, nessun errore |
| Sitemap staging, esclusa dall'indice | 103 pagine, nessun errore |
| Sitemap produzione | **348 pagine, nessun errore** |
| Database dopo il rilascio | Integrità valida; 31 tabelle e 16 migrazioni |
| Identità del sorgente remoto | Commit e hash del file delle guide corrispondenti al pacchetto locale |

Il nuovo [test PageSpeed mobile della revisione Meta](https://pagespeed.web.dev/analysis/https-policywatcher-online-change-6851aafc-7813-4bf9-aef3-794dc09cba9f/ymuv0hw6i8?form_factor=mobile), eseguito alle 19:39 CEST del 23 settembre, riporta **99 Performance, 100 Accessibility, 100 Best Practices e 100 SEO**. Accessibilità passa da 92 a 100; il controllo Agentic Browsing passa da 2/3 a 3/3. LCP 2,0 s, FCP 1,2 s, TBT 10 ms, CLS 0. È una misura di laboratorio: CrUX non dispone di dati sufficienti sugli utenti reali.

La verifica operativa generale conserva il precedente avviso sugli header CSP della risposta HTTP attraverso il provider. I controlli SEO e database sono superati; il report non presenta quell'avviso preesistente come risolto né attesta un penetration test indipendente.

## Freschezza delle fonti

La scansione completa del 23 settembre è terminata: **50 schede, 46 fonti distinte, 42 recuperate**. Di queste, 40 sono recuperi diretti e due tramite archivio. Quattro fonti restano non disponibili: privacy e termini Revolut, informativa Amazon e linee guida TikTok. Sei schede attendono conferma del testo prima di consolidare ulteriori variazioni.

Sono stati aggiunti otto snapshot e otto confronti tramite i controlli esistenti: 112 snapshot e 61 revisioni totali, con 18 aziende e 50 policy. Questi conteggi sono rimasti invariati durante la pubblicazione. Il timeout HTTP del provider non ha interrotto il lavoro: la conclusione è stata verificata nel registro persistente e la scansione non è stata duplicata. Backup SQLite coerenti eseguiti prima della scansione e prima della pubblicazione; nessuna email o digest inviato.

**La periodicità automatica non è ancora attivata.** Nel pannello di questa applicazione Node non compare la voce Cron Jobs, anche cercandola, e il comando `crontab` non è disponibile via SSH. La scansione manuale ha funzionato; non sarebbe corretto descrivere il pianificatore come ripristinato. Occorre un pianificatore supportato dal provider che richiami l'endpoint autenticato, con credenziali custodite sul server e senza invio automatico del digest.

## Motori di ricerca e reputazione

La proprietà Bing è stata verificata con il token dell'account esistente. La sitemap è stata accettata ed è inizialmente in elaborazione. IndexNow ha ricevuto **11 URL aggiornati**, risposta HTTP 202 alle 17:38 UTC: una ricevuta in attesa di elaborazione, non una prova di indicizzazione. Il pannello Bing AI Performance è accessibile; la prima vista della proprietà appena verificata mostra zero e “No data available”. Non rappresenta una misura completa delle citazioni nelle risposte AI.

Google ha accettato cinque richieste di indicizzazione (guida privacy italiana, revisione Meta e i tre nuovi dossier inglesi), registrate in [external-actions.json](external-actions.json). L'accettazione inserisce l'URL nella coda prioritaria, senza garantire pubblicazione o posizione. La sitemap è stata inviata, ma Search Console ha inizialmente segnalato “Impossibile leggere la Sitemap”. XML, accessibilità HTTP e direttive robots risultano corretti nei controlli effettuati; la sitemap aggiornata è stata reinviata dopo la pubblicazione e Google ha confermato “Sitemap inviata”. Il successivo recupero ed elaborazione restano da verificare.

Su [ScamAdviser](https://www.scamadviser.com/check-website/policywatcher.online) è stato richiesto **Update Score**. La nuova scansione ha portato il punteggio visualizzato da 9 a **55**, con etichetta “Caution Recommended”; i precedenti avvisi IPQS non compaiono più fra i segnali negativi della pagina aggiornata. Rimangono i riferimenti a traffico contenuto e giovane età del dominio. Questo risultato non certifica la sicurezza del sito e non è un indicatore del ranking Google. Non sono state acquistate verifiche, recensioni o citazioni.

## Rilascio riproducibile

- Sorgente pubblicato: `1549136489f1fe5e0b8420b33c951bcf007d1038`.
- Archivio: `PolicyWatcher-4.0.0-beta.3-hostinger-2026-09-23-search-reach-r1.zip`.
- SHA-256: `43ceef7cbba37281b06fb5450b0f289eb9c64fab7f55d0bb8abd3e6918401eb7`.
- Staging: `01a0cf50-b66e-73ba-bac0-da6eefbddfe8`.
- Produzione: `01a0cf56-7053-71f3-b8a6-0950a2e09471`.
- Verifica staging associata all'archivio: `2026-09-23T17:32:03.501Z`.
- [PR di riferimento](https://github.com/sev7enITA/policywatcher/pull/17).

I prossimi risultati da misurare sono consolidamento dei canonical, pagine indicizzate, clic e CTR delle query pertinenti, visite ai dossier e citazioni attribuibili. Non sono disponibili risultati di traffico successivi al rilascio sufficienti per attribuire un incremento a queste modifiche.
