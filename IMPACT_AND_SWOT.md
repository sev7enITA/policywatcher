# PolicyWatcher — Valutazione d'Impatto & Analisi SWOT
**Per presentazione pubblica · Giugno 2026**

---

## PARTE 1 — VALUTAZIONE D'IMPATTO

### 1.1 Impatto sociale e per i cittadini

PolicyWatcher traduce documenti legali opachi (Privacy Policy, Terms of Service, AI Terms) in **informazione comprensibile e azionabile** per cittadini, professionisti e PMI.

| Dimensione | Impatto |
|---|---|
| **Educazione digitale** | Chiunque può capire, in 30 secondi, cosa cambia nella privacy policy di Google, Stripe o OpenAI — senza dover leggere 40 pagine di legalese. |
| **Tutela del consumatore** | I "risk reasons" spiegano *perché* un cambiamento è problematico (es. "nuova clausola biometrica"), non solo *se* lo è. |
| **Accessibilità linguistica** | Bilingue EN/IT nativo. Per l'audience EU (specialmente Italia) questo abbassa drasticamente la barriera all'informazione legale tech. |
| **Trasparenza AI** | Il rischio non è una scatola nera: ogni punteggio è spiegato con 3 motivi concreti e l'impatto regionale (EU/US/Global × Individuo/Enterprise). |

### 1.2 Impatto economico

| Stakeholder | Valore |
|---|---|
| **PMI e startup** | Posono valutare in minuti il rischio compliance di un fornitore SaaS prima di integrarlo, riducendo il rischio di sanzioni GDPR (fino a 4% fatturato). |
| **DPO / Legal team** | Risparmio di ore di lettura manuale. Il report PDF executive è pronto per la documentazione interna. |
| **Procurement** | Il confronto A/B permette di decidere tra due fornitori (es. Stripe vs PayPal) sulla base di dati oggettivi. |
| **Ricaduta indiretta** | La piattaforma spinge le aziende monitorate a maggiore trasparenza, sapendo che le loro modifiche sono osservate pubblicamente. |

### 1.3 Impatto istituzionale (per UE)

PolicyWatcher è uno **strumento di civic tech** allineato agli obiettivi delle recenti normative:

- **EU AI Act** — supporta l'obbligo di trasparenza delle pratiche AI (Art. 52-53).
- **GDPR** — favorisce l'esercizio dei diritti (Art. 13-14 informativa).
- **DSA** — alimenta la rendicontazione pubblica sugli algoritmi (Art. 40).
- **Data Act (imminente)** — prepara il terreno per la portabilità e trasparenza dei dati.

**Posizionamento ideale:** "Infrastruttura civile di osservazione indipendente delle policy Big Tech" — complementare (non sostitutiva) al lavoro dei Data Protection Authority.

---

## PARTE 2 — ANALISI SWOT

### 🟢 STRENGTHS (Punti di forza)

1. **Architettura tecnica solida e moderna**
   - Stack enterprise: Next.js 16 + React 19 + Prisma + Gemini.
   - 12.000 righe di codice TypeScript tipizzato, 22 componenti, 15 route API.
   - Build di produzione verde, zero errori TypeScript.

2. **Integrità dei dati garantita**
   - Scraper blindato con doppio checking: **non inventa mai**. Se una pagina non è disponibile, lo segnala onestamente ("Temporaneamente NON DISPONIBILE, visita il sito ufficiale").
   - Backfill completato: 53/53 analisi hanno formato strutturato (TL;DR + key points + risk reasons).

3. **AI trasparente e spiegabile**
   - Ogni risk score è motivato, non è una black box.
   - Output bilingue EN/IT di qualità, pensato per non-legal.

4. **Tutela legale completa**
   - TermsGate obbligatorio (l'utente deve accettare i termini prima dell'uso).
   - Disclaimer alpha collassabile in ogni vista.
   - Disclaimer nel footer di ogni PDF e share page.

5. **Feature enterprise-grade**
   - Confronto A/B con radar chart, KPI matrix cross-company (15 KPI × 16 aziende), report PDF brandizzato, share pubblica con SEO.
   - Rate limiting attivo su tutte le route esposte (previene abusi).

6. **Indipendenza e credibilità**
   - Piattaforma indipendente, non legata a Big Tech.
   - Giustificazioni KPI curate manualmente (480 stringhe bilingui).

### 🟠 WEAKNESSES (Punti deboli)

1. **Dipendenza da un singolo provider AI (Google Gemini)**
   - Se Gemini cambia API/prezzi/modello, tutta l'analisi si ferma.
   - *Mitigazione:* interfaccia `analyzePolicyChange` già astratta, facile aggiungere OpenAI/Anthropic.

2. **Database SQLite in produzione**
   - Non adatto a multi-instance o scale orizzontale. Perdita dati potenziale su Hostinger a ogni redeploy.
   - *Mitigazione:* schema Prisma pronto per Postgres, basta cambiare `DATABASE_URL`.

3. **Copertura limitata a 16 aziende**
   - Per una presentazione "di riferimento" a livello UE, idealmente servirebbe 50-100 aziende.
   - *Mitigazione:* architettura già pronta per aggiungerne facilmente via seed.

4. **Non è un parere legale**
   - Per natura non può sostituire un consulto legale. Il disclaimer lo chiarisce, ma potrebbe deludere utenti che cercano certezza.

5. **Costo API in scaling**
   - Ogni scan+analisi costa chiamate Gemini. Senza budget cap, il costo può crescere con gli utenti.
   - *Mitigazione:* rate limiting implementato + budget configurabile su Google Cloud.

6. **Assenza di autenticazione utenti**
   - Watchlist personalizzata e storico richiederebbero login. Ora è esperienza anonima.

### 🔵 OPPORTUNITIES (Opportunità)

1. **Timing normativo perfetto**
   - EU AI Act entra in applicazione 2026-2027. C'è fame istituzionale di strumenti di monitoraggio indipendenti.
   - DSA sta già producendo i primi casi di enforcement.

2. **Finanziamento UE disponibile**
   - Bandi Digital Europe, Horizon Europe (cluster "Culture, Creativity and Inclusive Society"), CEF Digital.
   - PolicyWatcher si posiziona come "civic tech per trasparenza algoritmica" — perfettamente in scope.

3. **Partnership accademiche**
   - Università/data journalism (es. Linkiesta, Il Sole 24 Ore, OW2) potrebbero usare i dati.
   - L'API pubblica (da finalizzare) apre a integrazioni di ricerca.

4. **Estensione a nuovi settori**
   - Modello replicabile: HealthTech, EdTech, GovTech. Il dataset può espandersi facilmente.

5. **Community open source**
   - Rilasciare in open source aumenterebbe credibilità e contributi esterni, allineandosi ai valori EU.

6. **Diventare standard de facto**
   - Essendo tra i primi in EU su questo spazio specifico (AI policy monitoring bilingue), c'è spazio per stabilire lo standard.

### 🔴 THREATS (Minacce)

1. **Contenzioso legale da aziende monitorate**
   - Un'azienda malcontenta delle valutazioni potrebbe contestare il punteggio (risk di diffamazione/sponsorizzazione).
   - *Mitigazione:* disclaimer solido, dati giustificati, possibilità di "right of reply".

2. **Cambiamenti tecnici anti-scraping**
   - Big Tech possono intensificare bot protection (Cloudflare, CAPTCHA) rendendo lo scraping più difficile.
   - *Mitigazione:* scraper già robusto con retry + User-Agent rotation + fallback onesto.

3. **Affidabilità AI e allucinazioni**
   - Gemini può produrre valutazioni inaccurate che danneggiano reputazioni.
   - *Mitigazione:* temperature 0.1, prompt strutturato, fallback a "Not specified" quando incerto, disclaimer chiaro.

4. **Costo API non sostenibile**
   - Se la piattaforma diventa virale, il costo Gemini può esplodere.
   - *Mitigazione:* rate limiting attivo, caching possibile, budget cap configurabile.

5. **Competizione**
   - TermsFeed, iubenda, OneTrust operano nello spazio compliance, ma non offrono monitoring attivo bilingue. Finora nessun diretto competitor EU con questo posizionamento — ma la finestra è temporale.

6. **Changed terms in monitored companies**
   - Le aziende potrebbero smettere di pubblicare policy pubbliche (es. paywall, login-wall), riducendo la base dati.
   - *Mitigazione:* storico snapshot preserva le versioni passate.

---

## PARTE 3 — MATRICE STRATEGICA

| Strategia | Descrizione |
|---|---|
| **SO (Strengths + Opportunities)** | Capitalizzare il timing normativo UE presentandosi come "infrastructure civica di monitoraggio policy". Candidarsi a bandi Digital Europe. |
| **WO (Weaknesses + Opportunities)** | Risolvere il limite del DB SQLite migrando a Postgres PRIMA di scalare. Espandere a 50+ aziende per giustificare il claim "piattaforma di riferimento". |
| **ST (Strengths + Threats)** | Usare la tutela legale (disclaimer, TermsGate) e l'integrità tecnica (scraper onesto, AI spiegata) come scudo contro contenziosi e criticism. |
| **WT (Weaknesses + Threats)** | Diversificare provider AI per non dipendere solo da Google. Aggiungere un budget cap rigido per evitare shock di costo. |

---

## PARTE 4 — RACCOMANDAZIONI PER LA PRESENTAZIONE

1. **Posizionamento:** "PolicyWatcher Alpha — la prima piattaforma EU bilingue di regulatory intelligence su Big Tech e FinTech, basata su AI trasparente."

2. **Demo flow consigliato:**
   1. Apertura homepage → TermsGate (mostra tutela legale)
   2. Dashboard 16 aziende + KPI Matrix (mostra copertura)
   3. Apri Stripe/Google → TL;DR + risk reasons (mostra qualità AI)
   3. Compare A/B Stripe vs PayPal (mostra feature unique)
   4. Genera PDF executive (mostra output professionale)
   5. Share URL pubblica (mostra viralità)

3. **Messaging chiave per istituzioni UE:**
   - "Trasparenza algoritmica per tutti, non solo per esperti legali."
   - "Complementare al lavoro dei DPA, non sostitutivo."
   - "Open ai contributi: la metodologia è pubblica e migliorabile."

4. **Cosa NON promettere in demo:**
   - Che sostituisce un parere legale.
   - Che le valutazioni sono 100% accurate (sono AI-assisted, non definitive).
   - Che le 16 aziende sono esaustive (sono un campione rappresentativo).

---

*Documento preparato sulla base di verifica tecnica diretta del codice (53 PolicyChange verificati, build TypeScript verde, rate limiting implementato).*
