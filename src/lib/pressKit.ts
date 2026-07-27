import {
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_RELEASE_CHANNEL_LABEL,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION,
  POLICYWATCHER_VERSION_DISPLAY,
} from './release';

export type PressKitLocale = 'en' | 'it';
export type PressKitLocalized = Record<PressKitLocale, string>;

export interface PressKitFact {
  value: string;
  label: PressKitLocalized;
  scope: PressKitLocalized;
}

export interface PressKitClaim {
  id: string;
  claim: PressKitLocalized;
  status: PressKitLocalized;
  type: 'inventory' | 'method' | 'evidence' | 'code' | 'freshness' | 'coverage';
  proofHref: string;
  proofLabel: PressKitLocalized;
  boundary: PressKitLocalized;
}

export interface PressKitAsset {
  id: string;
  filename: string;
  href: string;
  mediaType: string;
  dimensions: string | null;
  bytes?: number;
  sha256: string;
  contentCredentials: 'not-attached';
  title: PressKitLocalized;
  caption: PressKitLocalized;
  alt: PressKitLocalized;
  usageBoundary: PressKitLocalized;
}

export const PRESS_KIT_RELEASE_DATE = '2026-07-27' as const;
export const PRESS_KIT_CANONICAL_URL = 'https://policywatcher.online/press-kit' as const;
export const PRESS_KIT_JSON_URL = `${PRESS_KIT_CANONICAL_URL}/press-kit.json` as const;
export const PRESS_KIT_REPOSITORY_URL = 'https://github.com/sev7enITA/policywatcher' as const;
export const PRESS_KIT_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/' as const;
export const PRESS_KIT_ARTICLE_50_URL = 'https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-transparency-obligations-providers-deployers-certain-ai-systems' as const;

export const pressKitFacts: PressKitFact[] = [
  {
    value: '16',
    label: { en: 'configured companies', it: 'aziende configurate' },
    scope: { en: 'Configured inventory, not exhaustive market coverage.', it: 'Inventario configurato, non copertura esaustiva del mercato.' },
  },
  {
    value: '6',
    label: { en: 'configured sectors', it: 'settori configurati' },
    scope: { en: 'Sector labels organize the monitored inventory.', it: 'Le etichette di settore organizzano l inventario monitorato.' },
  },
  {
    value: '15',
    label: { en: 'canonical KPIs', it: 'KPI canonici' },
    scope: { en: 'Privacy, AI governance and ethics; unavailable assessments display Not assessed.', it: 'Privacy, governance AI ed etica; le valutazioni non disponibili mostrano Non valutato.' },
  },
  {
    value: 'EN / IT',
    label: { en: 'editorial languages', it: 'lingue editoriali' },
    scope: { en: 'The press kit and selected guidance pages support English and Italian.', it: 'Il press kit e alcune pagine guida supportano inglese e italiano.' },
  },
];

export const pressKitClaims: PressKitClaim[] = [
  {
    id: 'public-evidence-gate',
    claim: { en: 'Published analytical records are filtered by the public evidence gate.', it: 'I record analitici pubblicati sono filtrati dal gate delle evidenze pubbliche.' },
    status: { en: 'Implemented control', it: 'Controllo implementato' },
    type: 'evidence',
    proofHref: '/methodology/confidence',
    proofLabel: { en: 'Methodology', it: 'Metodologia' },
    boundary: { en: 'A gate reduces unsupported publication; it does not prove source completeness or legal authority.', it: 'Il gate riduce pubblicazioni non supportate; non prova completezza o autorita legale della fonte.' },
  },
  {
    id: 'configured-inventory',
    claim: { en: 'The configured inventory covers 16 companies across 6 sectors.', it: 'L inventario configurato comprende 16 aziende in 6 settori.' },
    status: { en: 'Configured inventory', it: 'Inventario configurato' },
    type: 'inventory',
    proofHref: '/',
    proofLabel: { en: 'Evidence Console', it: 'Console evidenze' },
    boundary: { en: 'This is not exhaustive public or market coverage, and source availability can change.', it: 'Non e copertura pubblica o di mercato esaustiva e la disponibilita delle fonti puo cambiare.' },
  },
  {
    id: 'canonical-kpis',
    claim: { en: 'One framework defines 15 canonical KPIs across privacy, AI governance and ethics.', it: 'Un framework definisce 15 KPI canonici tra privacy, governance AI ed etica.' },
    status: { en: 'Documented method', it: 'Metodo documentato' },
    type: 'method',
    proofHref: '/feature-atlas',
    proofLabel: { en: 'Feature Atlas', it: 'Atlante funzionalita' },
    boundary: { en: 'Normalized values support comparison only; unavailable assessments have no numerical value and the result is not a compliance score.', it: 'I valori normalizzati servono solo al confronto; le valutazioni non disponibili non hanno valore numerico e il risultato non e un punteggio di conformita.' },
  },
  {
    id: 'public-code',
    claim: { en: 'The repository and release notes are public and reusable under CC BY 4.0.', it: 'Repository e note di release sono pubblici e riutilizzabili con licenza CC BY 4.0.' },
    status: { en: 'Public repository', it: 'Repository pubblico' },
    type: 'code',
    proofHref: PRESS_KIT_REPOSITORY_URL,
    proofLabel: { en: 'GitHub repository', it: 'Repository GitHub' },
    boundary: { en: 'This describes repository access and license terms; no OSI certification is claimed.', it: 'Descrive accesso e licenza del repository; non viene dichiarata alcuna certificazione OSI.' },
  },
  {
    id: 'source-timestamps',
    claim: { en: 'Evidence views preserve source-specific screening and snapshot timestamps.', it: 'Le viste evidenza mantengono timestamp specifici di screening e snapshot.' },
    status: { en: 'Dataset-derived', it: 'Derivato dal dataset' },
    type: 'freshness',
    proofHref: '/timeline',
    proofLabel: { en: 'Policy timeline', it: 'Timeline policy' },
    boundary: { en: 'Release metadata is dated 27 July 2026; update intervals depend on source retrieval and review.', it: 'I metadata di release sono datati 27 luglio 2026; gli intervalli di aggiornamento dipendono dal recupero e dalla revisione delle fonti.' },
  },
  {
    id: 'external-coverage',
    claim: { en: 'Public articles and professional posts have discussed PolicyWatcher.', it: 'Articoli pubblici e post professionali hanno discusso PolicyWatcher.' },
    status: { en: 'External signal', it: 'Segnale esterno' },
    type: 'coverage',
    proofHref: '/press',
    proofLabel: { en: 'Coverage wall', it: 'Rassegna pubblica' },
    boundary: { en: 'Mentions are references, not endorsements, certifications or independent audits.', it: 'Le menzioni sono riferimenti, non endorsement, certificazioni o audit indipendenti.' },
  },
];

export const pressKitAssets: PressKitAsset[] = [
  {
    id: 'logo-mark',
    filename: 'policywatcher-logo-mark-512.png',
    href: '/press-kit/policywatcher-logo-mark-512.png',
    mediaType: 'image/png',
    dimensions: '512 x 512 px',
    bytes: 175921,
    sha256: '4464d0acf68b24878e28481a3b122412b473ad171bd23e73a3cc46e5b8719cf6',
    contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher logo mark', it: 'Marchio PolicyWatcher' },
    caption: { en: 'Owned square logo mark with transparent background.', it: 'Marchio quadrato proprietario con sfondo trasparente.' },
    alt: { en: 'PolicyWatcher shield logo mark', it: 'Marchio a scudo PolicyWatcher' },
    usageBoundary: { en: 'Use without altering proportions or implying endorsement.', it: 'Usare senza alterare le proporzioni o implicare endorsement.' },
  },
  {
    id: 'logo-square',
    filename: 'policywatcher-logo-square-1024.jpg',
    href: '/press-kit/policywatcher-logo-square-1024.jpg',
    mediaType: 'image/jpeg',
    dimensions: '1024 x 1024 px',
    bytes: 281354,
    sha256: '2b6513562a1052c316765222177154a2b57853e6cfe1618b03dc8784360e7469',
    contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher square artwork', it: 'Artwork quadrato PolicyWatcher' },
    caption: { en: 'Owned high-resolution square artwork. No separate transparent wordmark is available.', it: 'Artwork quadrato proprietario ad alta risoluzione. Non e disponibile un wordmark trasparente separato.' },
    alt: { en: 'PolicyWatcher square brand artwork', it: 'Artwork quadrato del brand PolicyWatcher' },
    usageBoundary: { en: 'Crop only with adequate clear space around the central mark.', it: 'Ritagliare solo mantenendo spazio adeguato intorno al marchio centrale.' },
  },
  {
    id: 'founder-portrait',
    filename: 'fabrizio-degni-portrait-200.png',
    href: '/press-kit/fabrizio-degni-portrait-200.png',
    mediaType: 'image/png',
    dimensions: '200 x 200 px',
    bytes: 51245,
    sha256: '8ce325476b5ad588c2f4b6ce45c8676ca964fd1e26aab767e9c3f349595593e6',
    contentCredentials: 'not-attached',
    title: { en: 'Fabrizio Degni portrait', it: 'Ritratto di Fabrizio Degni' },
    caption: { en: 'Owned founder portrait. Resolution is limited to 200 x 200 pixels.', it: 'Ritratto proprietario del fondatore. Risoluzione limitata a 200 x 200 pixel.' },
    alt: { en: 'Portrait of Fabrizio Degni', it: 'Ritratto di Fabrizio Degni' },
    usageBoundary: { en: 'Suitable for small digital placements; do not upscale for print.', it: 'Adatto a piccoli usi digitali; non ingrandire per la stampa.' },
  },
  {
    id: 'two-week-progress',
    filename: 'policywatcher-two-week-progress-2026-07-26.png',
    href: '/press-kit/policywatcher-two-week-progress-2026-07-26.png',
    mediaType: 'image/png',
    dimensions: '866 x 1817 px',
    bytes: 1714205,
    sha256: '62a3bdf85d8e263e72e42212be76cf7341a6785be9d435bcb43b16056ba01a07',
    contentCredentials: 'not-attached',
    title: { en: 'Two-week product progress infographic', it: 'Infografica progressi delle ultime due settimane' },
    caption: { en: 'Owned English infographic summarizing the product development cycle through 26 July 2026.', it: 'Infografica proprietaria in inglese che riassume il ciclo di sviluppo fino al 26 luglio 2026.' },
    alt: { en: 'PolicyWatcher two-week product progress infographic', it: 'Infografica PolicyWatcher sui progressi delle ultime due settimane' },
    usageBoundary: { en: 'Historical product summary; pair with current release metadata.', it: 'Sintesi storica del prodotto; accompagnare con i metadata della release corrente.' },
  },
  {
    id: 'feature-atlas-screenshot',
    filename: 'policywatcher-feature-atlas-2026-07-27.png',
    href: '/press-kit/policywatcher-feature-atlas-2026-07-27.png',
    mediaType: 'image/png',
    dimensions: '1440 x 1000 px',
    bytes: 195953,
    sha256: 'c229635c7bfe119fb5ae6114eeaf29ba36dca1df63abc83b393032e41156eff5',
    contentCredentials: 'not-attached',
    title: { en: 'Feature Intelligence Atlas product screenshot', it: 'Screenshot prodotto Feature Intelligence Atlas' },
    caption: { en: 'Product screenshot of the capability and dependency atlas in 3.9.0 Beta 3, captured on 27 July 2026.', it: 'Screenshot dell atlante di funzionalita e dipendenze in 3.9.0 Beta 3, acquisito il 27 luglio 2026.' },
    alt: { en: 'PolicyWatcher Feature Intelligence Atlas interface', it: 'Interfaccia Feature Intelligence Atlas di PolicyWatcher' },
    usageBoundary: { en: 'UI state captured on 27 July 2026; figures are inventory and qualitative release labels.', it: 'Stato UI catturato il 27 luglio 2026; i dati sono inventario ed etichette qualitative di release.' },
  },
  {
    id: 'release-impact-screenshot',
    filename: 'policywatcher-release-impact-2026-07-27.png',
    href: '/press-kit/policywatcher-release-impact-2026-07-27.png',
    mediaType: 'image/png',
    dimensions: '1440 x 1000 px',
    bytes: 125597,
    sha256: 'f63c3c911f718c2e35f5de0448e10aa987d7f417168f72df1ed13b99683e1234',
    contentCredentials: 'not-attached',
    title: { en: 'Release Impact product screenshot', it: 'Screenshot prodotto Release Impact' },
    caption: { en: 'Product screenshot of the release-outcome and residual-risk map, captured on 27 July 2026.', it: 'Screenshot della mappa di esiti release e rischi residui, acquisito il 27 luglio 2026.' },
    alt: { en: 'PolicyWatcher release impact interface', it: 'Interfaccia Release Impact di PolicyWatcher' },
    usageBoundary: { en: 'Categorical KPI and KRI labels are not measured performance or compliance outcomes.', it: 'Le etichette KPI e KRI categoriche non sono risultati misurati di performance o conformita.' },
  },
  {
    id: 'fact-sheet',
    filename: 'policywatcher-fact-sheet-2026-07-27.md',
    href: '/press-kit/policywatcher-fact-sheet-2026-07-27.md',
    mediaType: 'text/markdown',
    dimensions: null,
    bytes: 2495,
    sha256: 'a2b1aada190354702ac39521f3a8656cd8a5c8b67874317d293aaac244e129c0',
    contentCredentials: 'not-attached',
    title: { en: 'Press fact sheet', it: 'Scheda stampa' },
    caption: { en: 'Bilingual plain-text facts, context and editorial boundaries.', it: 'Fatti bilingui, contesto e limiti editoriali in testo semplice.' },
    alt: { en: 'Markdown press fact sheet download', it: 'Download della scheda stampa Markdown' },
    usageBoundary: { en: 'Verify links and release metadata when quoting after 27 July 2026.', it: 'Verificare link e metadata di release per citazioni successive al 27 luglio 2026.' },
  },
];

export const pressKitCycleItems: PressKitLocalized[] = [
  { en: 'Adaptive, composable dashboard contracts with reversible workspace state.', it: 'Contratti dashboard adattivi e componibili con stato workspace reversibile.' },
  { en: 'Canonical deep links and coordinated evidence drill-down from region cells and benchmark KPIs.', it: 'Deep link canonici e drill-down coordinato da celle regionali e KPI benchmark.' },
  { en: 'RegionHeatMap and radar views with displayed-value fallbacks, missing states and limitations.', it: 'RegionHeatMap e viste radar con valori visualizzati, stati mancanti e limiti.' },
  { en: 'Public guidance, release impact and policy-change timeline separated by purpose and freshness semantics.', it: 'Guide pubbliche, impatto release e timeline dei cambi policy separati per scopo e freschezza.' },
  { en: `Browser extension ${POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION}: ${POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.en}.`, it: `Estensione browser ${POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION}: ${POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.it}.` },
];

export const pressKitBoilerplates = {
  short: {
    en: 'PolicyWatcher is a public-interest policy evidence project that monitors a configured inventory of public policy sources and keeps source status, observed changes and analytical limitations visible.',
    it: 'PolicyWatcher e un progetto di interesse pubblico sulle evidenze policy che monitora un inventario configurato di fonti pubbliche e rende visibili stato delle fonti, cambiamenti osservati e limiti analitici.',
  },
  long: {
    en: 'PolicyWatcher is an independent civic-tech project created by Fabrizio Degni. It monitors a configured inventory of public policy sources for 16 companies across 6 sectors and organizes analysis through 15 canonical KPIs spanning privacy, AI governance and ethics. Public data routes apply the configured evidence gate, preserve source-specific timestamps and show Not assessed when an assessment is unavailable. The public repository is reusable under CC BY 4.0. PolicyWatcher is not legal advice, a compliance certification or exhaustive coverage; update intervals depend on source retrieval and review.',
    it: 'PolicyWatcher e un progetto civic-tech indipendente creato da Fabrizio Degni. Monitora un inventario configurato di fonti policy pubbliche per 16 aziende in 6 settori e organizza l analisi attraverso 15 KPI canonici tra privacy, governance AI ed etica. Le route pubbliche applicano il gate configurato, mantengono timestamp specifici delle fonti e mostrano Non valutato quando una valutazione non e disponibile. Il repository pubblico e riutilizzabile con licenza CC BY 4.0. PolicyWatcher non e consulenza legale, certificazione di conformita, copertura esaustiva o monitoraggio in tempo reale.',
  },
} as const;

export function buildPressKitPayload() {
  return {
    schema: 'https://policywatcher.online/schemas/press-kit/v1',
    schemaVersion: '1.0.0',
    generatedAt: PRESS_KIT_RELEASE_DATE,
    releaseDate: PRESS_KIT_RELEASE_DATE,
    canonicalUrl: PRESS_KIT_CANONICAL_URL,
    product: {
      name: 'PolicyWatcher',
      version: POLICYWATCHER_VERSION,
      displayVersion: POLICYWATCHER_VERSION_DISPLAY,
      releaseName: POLICYWATCHER_RELEASE_NAME,
      channel: POLICYWATCHER_RELEASE_CHANNEL_LABEL,
      applicationCategory: 'Civic technology and policy evidence',
      repository: PRESS_KIT_REPOSITORY_URL,
      license: 'CC BY 4.0',
      licenseUrl: PRESS_KIT_LICENSE_URL,
    },
    browserExtension: {
      version: POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
      status: POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
      separateReleaseTrack: true,
    },
    contact: {
      name: 'Fabrizio Degni',
      email: 'info@policywatcher.online',
      linkedin: 'https://linkedin.com/in/fabriziodegni',
      github: PRESS_KIT_REPOSITORY_URL,
    },
    facts: pressKitFacts,
    claims: pressKitClaims,
    assets: pressKitAssets,
    integrityBoundary: {
      contentCredentials: 'not-attached',
      statement: 'SHA-256 checksums establish downloaded-file integrity only; they do not establish semantic truth, authorship provenance or editorial endorsement.',
    },
    boundaries: [
      'Not legal advice or a compliance certification.',
      'Configured inventory is not exhaustive public or market coverage.',
      'Evidence timestamps and update intervals are source-specific.',
      'AI-assisted interpretation can be incomplete or incorrect.',
      'External coverage is not endorsement, certification or independent audit.',
    ],
  } as const;
}
