# PolicyWatcher pubblica Beta 42: un control plane verificabile per modelli AI e impatto delle release

Milano, 15 agosto 2026 - PolicyWatcher ha pubblicato la release `3.9.0-beta.42`, denominata Evidence Release Control Plane. L aggiornamento introduce due wave tecniche e una wave UI/UX che collegano decisioni sui modelli, telemetria, cronologia delle release e materiali stampa a contratti di evidenza versionati e verificabili.

## Cosa cambia

La prima wave aggiunge un registro JSON Schema per nove candidati fra modelli e architetture. Baseline BM25 e Gemini 3.5 Flash-Lite risultano qualificati solo per i rispettivi carichi di lavoro e dataset congelati. Qwen3 e BGE restano in attesa del bake-off. Gemini 3.7 Flash resta bloccato finche non e disponibile e valutabile nel perimetro definito. RAGFlow, LightRAG, Kimi K3 e GraphRAG restano research-only. La promozione automatica e disabilitata e ogni passaggio richiede approvazione umana.

La stessa wave introduce una proiezione di telemetria compatibile con il vocabolario OpenTelemetry GenAI. Il profilo pubblico evita prompt, risposte e contenuto sorgente, mantenendo attributi operativi e di modello utili alla diagnosi.

La seconda wave consolida sei cluster di release, dal 2 al 15 agosto 2026, in un ledger UTC con digest SHA-256 deterministico, validazione CI, endpoint JSON pubblico ed ETag. Ogni record affianca impatto implementativo, metrica osservabile e limite residuo.

La wave UI/UX trasforma lo stesso ledger in un Evidence Pulse accessibile: una vista compatta in homepage, una storia interattiva e una infografica bilingue per la stampa. La selezione usa controlli semantici, rispetta `prefers-reduced-motion` e applica la View Transition API del browser solo come miglioramento progressivo.

## I rilasci nella finestra di 14 giorni

- Beta 37: navigazione delle risorse e diagnostica retrieval.
- Beta 38: distribuzione stampa tramite Git con pacchetti vincolati al commit e checksum.
- Beta 39: release gestite del renderer VPS con limiti, firma, smoke test e stato di rollback.
- Beta 40: workspace globale per evidenze civiche con catalogo di 79 organizzazioni in 24 paesi.
- Beta 41: controlli adattivi di presentazione e movimento senza alterare evidenze o gate.
- Beta 42: registro EvalOps, telemetria AI, ledger delle release ed Evidence Pulse.

## Materiali disponibili

- Storia interattiva: `https://policywatcher.online/pulse/two-week-release-impact`
- Ledger JSON: `https://policywatcher.online/api/v1/release-evidence`
- Infografica stampa in italiano: `https://policywatcher.online/press-kit/policywatcher-release-evidence-pulse-it-2026-08-15.png`
- Infografica stampa in inglese: `https://policywatcher.online/press-kit/policywatcher-release-evidence-pulse-en-2026-08-15.png`
- Manifest con dimensioni e SHA-256: `https://policywatcher.online/press-kit/asset-manifest.json`
- Press Kit: `https://policywatcher.online/press-kit`

## Limiti dichiarati

Il ledger documenta implementazioni, non adozione, impatto di mercato, conformita legale o accessibilita certificata. La qualificazione dei modelli vale soltanto per il golden set e i gate indicati. SHA-256 stabilisce coerenza dei byte, non autorialita o verita semantica. Lo sfondo decorativo dell infografica e stato generato con AI sotto direzione artistica PolicyWatcher; testo, numeri e composizione finale sono prodotti deterministicamente dal ledger. Le Content Credentials non sono allegate e questa condizione e registrata nei metadata.

## Informazioni su PolicyWatcher

PolicyWatcher e un progetto civic-tech indipendente che rende ispezionabili fonti pubbliche, cambiamenti osservati, stato delle evidenze e limiti analitici. Non e consulenza legale, certificazione di conformita o copertura esaustiva del mercato.

Contatti stampa e fact-checking: `info@policywatcher.online`
