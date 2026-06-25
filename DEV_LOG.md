# PolicyWatcher — Diario Sviluppo (per il team)

**Data:** 2026-06-20
**Stack:** Next.js 16.2.9 (App Router, Turbopack) · React 19 · TypeScript · Prisma + SQLite · Google Gemini · @react-pdf/renderer · Recharts · Framer Motion
**Build status:** ✅ TypeScript 0 errori · ✅ Next.js production build passa

---

## 1. Ristrutturazione output AI (user-friendly)

**Problema:** l'output di Gemini era un "wall of text" illeggibile per utenti non legali.

**Soluzione:**

- `src/lib/gemini.ts` — Prompt riscritto per produrre JSON strutturato:
  - `tldrEn/It` (1 frase, max 160 char)
  - `keyPoints[]` (3-5 bullet con sentiment: positive/neutral/negative)
  - `riskReasons[]` (max 3 motivi con `deltaScore`, es. `+2`)
  - Regole di scrittura: niente legalese, frasi brevi, quantitativo.
- `prisma/schema.prisma` — Aggiunte colonne nullable retrocompatibili: `tldrEn`, `tldrIt`, `keyPointsJson`, `riskReasonsJson`.
- `src/types/index.ts` — Aggiunti tipi `RiskReason`, `KeyPoint`.
- `src/app/api/scrape/route.ts` + `src/app/api/cron/check-all/route.ts` — persistono i nuovi campi.
- Mock di fallback aggiornato con i nuovi campi strutturati.

**Nuovi componenti UI** (`src/components/ai/`):

| File | Funzione |
|------|----------|
| `parseAi.ts` | Parser sicuri (mai throw) per i JSON encodati |
| `AISummary.tsx` | TL;DR + bullet sentiment-tagged (sostituisce wall-of-text) |
| `RiskReasons.tsx` | Chip "Perché questo punteggio" con delta (+2) |
| `RemediationSteps.tsx` | Azioni numerate con CTA button |
| `CardRiskReasons.tsx` | Versione compatta (top-2) per le card homepage |

Integrati in `PolicyDetails.tsx` e nelle card di `page.tsx`.

---

## 2. Command Palette (⌘K) + Skeleton loaders

- `src/components/CommandPalette.tsx` — Palette stile Raycast/Linear:
  - Ricerca fuzzy, 3 gruppi (Azioni, Filtri, Navigazione)
  - Navigazione tastiera (↑↓ Enter Esc)
  - Trigger globale **⌘K / Ctrl+K** + bottone con hint nell'header
- `src/components/Skeleton.tsx` — Placeholder animati (shimmer) che sostituiscono lo spinner:
  - `SkeletonStatsGrid`, `SkeletonGrid`, `SkeletonCard`
  - Mimano il layout reale → perceived performance x2

---

## 3. Risk Trend Chart con dati storici reali

- `src/app/api/trends/route.ts` — Aggrega storico risk score per compagnia o industria, con summary (avg/min/max/delta).
- `src/components/charts/RiskTrendPanel.tsx` — Fetcha dati reali + summary + AreaChart.
- Sostituito il chart SVG hardcoded in `PolicyDetails.tsx`.
- Corretti i colori dei chart per tema chiaro (erano hardcodati dark).

---

## 4. Confronto A/B due compagnie

- `src/app/api/compare/route.ts` — Profilo KPI aggregato di 2 compagnie con radar data (15 KPI pesati).
- `src/components/CompareModal.tsx` — Due selettori + badge "VS" + **radar/spider chart** (Recharts) + tabella diff con highlight vincitore.
- Bottone "Compare" nell'header + entry nella Command Palette.

---

## 5. Executive PDF + Share URL pubblico

- `src/pdf/ExecutiveReport.tsx` — Documento A4 brandizzato (@react-pdf/renderer):
  - Score gauge, TL;DR, key points, risk reasons, regional impact, footer con disclaimer.
- `src/app/api/report/[policyId]/route.tsx` — Genera PDF server-side (`runtime: 'nodejs'`), mai inventato (404 se no analysis).
- `src/app/share/[id]/page.tsx` + `share.module.css` — Pagina pubblica read-only con:
  - Open Graph + Twitter metadata per anteprime social
  - Toggle EN/IT via query string
  - Server component (SEO-friendly)
- `PolicyDetails.tsx` — Bottoni **Share** (Web Share API + fallback clipboard) e **PDF Report**.

---

## 6. Bug fix: KPI Matrix non renderizzava

**Causa:** Tutti i 4 modali usavano `require()` condizionale:
```js
const CrossCompanyMatrix = matrixOpen ? require('@/components/...').default : null;
```
Questo pattern rompe il montaggio del corpo tabella su Turbopack/Next 16 (il `useEffect` interno non girava correttamente).

**Fix in `page.tsx`:** convertiti a import statici + guard `{isOpen && (...)}`. Build verde, matrice renderizza 16 aziende + riga consenso.

---

## 7. Terms of Use acceptance gate

- `src/components/TermsGate.tsx` + `.module.css` — Blocca l'accesso alla piattaforma finché l'utente non accetta:
  - Checkbox + pulsante "Accetta & Continua"
  - Disclaimer alpha completo EN/IT
  - Persistenza in `localStorage` (chiave versionata `policywatcher_terms_accepted_v1`)
  - Toggle lingua integrato
  - La dashboard non viene montata finché non si accetta

---

## 8. Blindatura scraping (doppio sistema di checking)

**File:** `src/lib/scraper.ts` (riscritto da zero)

**Problema:** il dataset era inaffidabile (fetch singolo, niente validazione, poteva salvare pagine 404/captcha/maintenance come policy reali).

**Doppio checking:**
- **Layer 1 (transport):** timeout 20s, 3 tentativi con backoff esponenziale, rotazione User-Agent, gestione redirect.
- **Layer 2 (content):** rileva captcha Cloudflare, maintenance, paywall, consent-wall, **soft-404**, lunghezza minima (400 char), massimo 200k char.

**Regola d'oro: il sistema NON inventa MAI.** Ritorna `ScrapeResult` tipizzato:
- `ok` → store text + SHA-256 hash
- `unavailable` → "Temporaneamente NON DISPONIBILE, visita il sito ufficiale"
- `invalid` → link permanentemente morto (404/410)

**Caller aggiornati:**
- `scrape/route.ts` — restituisce `{ unavailable: true, message, officialUrl }` con HTTP 503/422.
- `cron/check-all/route.ts` — registra `status: 'unavailable'|'invalid'` nel detail, NON crea snapshot, NON lancia AI. Summary finale conta onestamente `unavailable` e `invalid`.
- Hash unificato a **SHA-256** ovunque (prima era MD5 in scrape, SHA-256 in cron).

---

## 9. Disclaimer ALPHA collassabile

In `CrossCompanyMatrix.tsx`: il disclaimer lungo è ora **collassabile** (espanso di default) con:
- Header cliccabile per espandere/comprimere (icona chevron)
- Bottone "Ho letto, chiudi" che lo comprime
- Stili dedicati in `CrossCompanyMatrix.module.css` (`.disclaimerToggle`, `.disclaimerBody`, `.disclaimerAck`)

---

## File modificati/creati — indice completo

### File nuovi
```
src/components/ai/parseAi.ts
src/components/ai/AISummary.tsx + .module.css
src/components/ai/RiskReasons.tsx + .module.css
src/components/ai/RemediationSteps.tsx + .module.css
src/components/ai/CardRiskReasons.tsx + .module.css
src/components/CommandPalette.tsx + .module.css
src/components/Skeleton.tsx + .module.css
src/components/CompareModal.tsx + .module.css
src/components/TermsGate.tsx + .module.css
src/components/charts/RiskTrendPanel.tsx
src/pdf/ExecutiveReport.tsx
src/app/api/trends/route.ts
src/app/api/compare/route.ts
src/app/api/report/[policyId]/route.tsx
src/app/share/[id]/page.tsx + share.module.css
```

### File modificati
```
src/lib/gemini.ts (prompt + tipi + mock)
src/lib/scraper.ts (riscritto, doppio checking)
src/types/index.ts (RiskReason, KeyPoint, campi PolicyChange)
prisma/schema.prisma (4 colonne nullable su PolicyChange)
src/app/api/scrape/route.ts (ScrapeResult + fallback unavailable)
src/app/api/cron/check-all/route.ts (ScrapeResult + conteggi onesti)
src/app/page.tsx (TermsGate, CommandPalette, CompareModal, Skeleton, CardRiskReasons, import statici modali)
src/components/PolicyDetails.tsx (AISummary, RiskReasons, RemediationSteps, RiskTrendPanel, Share/PDF buttons)
src/components/PolicyDetails.module.css (.shareRow, .shareBtn)
src/components/charts/RiskTrendChart.tsx (colori tema chiaro)
src/components/charts/RiskProfileChart.tsx (colori tema chiaro)
src/components/CrossCompanyMatrix.tsx (disclaimer collassabile)
src/components/CrossCompanyMatrix.module.css (stili disclaimer collassabile)
next.config.ts (output: 'standalone' per Hostinger)
```

---

## Note per il deployment

- **Migrazione DB obbligatoria:** `npx prisma db push` (aggiunge le 4 colonne nullable).
- **Chiavi/secret:** configurare su Hostinger `GEMINI_API_KEY`, `API_SECRET`, `DATABASE_URL`, `SMTP_*` (NON nello zip).
- **Cron job esterno:** configurare un cron che chiami `POST /api/cron/check-all` con header `Authorization: Bearer <API_SECRET>` (frequenza suggerita: ogni 6-12h).

## Fix di sicurezza ancora PENDING (raccomandate al team)
1. Ruotare `GEMINI_API_KEY` (è stata esposta) + generare `API_SECRET` forte (32+ char).
2. Rimuovere leak del prefisso chiave da `/api/health`.
3. Disabilitare/limitare `/api/seed` in produzione.
4. Aggiungere rate limiting su `/api/subscribe`, `/api/chat`.
5. Valutare migrazione SQLite → Postgres/MySQL per persistenza su Hostinger.
