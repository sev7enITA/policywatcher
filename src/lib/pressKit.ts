import {
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_RELEASE_CHANNEL_LABEL,
  POLICYWATCHER_RELEASE_DATE,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION,
  POLICYWATCHER_VERSION_DISPLAY,
} from './release';
import pressAssetManifest from '../../public/press-kit/asset-manifest.json';
import pressPackageManifest from '../../public/press-kit/package-manifest.json';

export type PressKitLocale = 'en' | 'it';
export type PressKitLocalized = Record<PressKitLocale, string>;

export interface PressKitFact {
  id: string;
  value: string;
  label: PressKitLocalized;
  scope: PressKitLocalized;
  sourceHref: string;
  sourceLabel: PressKitLocalized;
  asOf: string;
  verifiedAt: string;
  reviewCadence: PressKitLocalized;
  recordStatus: 'current' | 'superseded' | 'corrected' | 'withdrawn';
  permalink: string;
}

export interface PressKitClaim {
  id: string;
  claim: PressKitLocalized;
  status: PressKitLocalized;
  type: 'inventory' | 'method' | 'evidence' | 'code' | 'freshness' | 'coverage';
  proofHref: string;
  proofLabel: PressKitLocalized;
  boundary: PressKitLocalized;
  asOf: string;
  verifiedAt: string;
  reviewCadence: PressKitLocalized;
  recordStatus: 'current' | 'superseded' | 'corrected' | 'withdrawn';
  permalink: string;
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
  creditLine: string;
  rightsUrl: string;
  metadataStandard: 'IPTC Photo Metadata 2025.1' | 'document-manifest';
}

export interface PressKitPackage {
  id: string;
  locale: PressKitLocale;
  filename: string;
  href: string;
  bytes: number;
  sha256: string;
  generatedAt: string;
  version: string;
  title: PressKitLocalized;
  contents: PressKitLocalized[];
  boundary: PressKitLocalized;
}

export interface PressKitRelease {
  slug: string;
  version: string;
  displayVersion: string;
  datePublished: string;
  dateModified: string;
  status: 'current' | 'archived';
  category: 'product' | 'methodology' | 'distribution';
  title: PressKitLocalized;
  summary: PressKitLocalized;
  changes: PressKitLocalized[];
  boundaries: PressKitLocalized[];
  evidenceLinks: Array<{ href: string; label: PressKitLocalized }>;
}

export interface PressKitDataSnapshot {
  id: string;
  title: PressKitLocalized;
  description: PressKitLocalized;
  asOf: string;
  generatedAt: string;
  methodologyHref: string;
  citation: PressKitLocalized;
  boundary: PressKitLocalized;
  files: Array<{ format: 'PNG' | 'SVG' | 'CSV' | 'JSON'; href: string; mediaType: string }>;
}

export interface PressKitContactRoute {
  id: 'press' | 'fact-checking' | 'interview' | 'speaking';
  title: PressKitLocalized;
  description: PressKitLocalized;
  href: PressKitLocalized;
  requestedContext: PressKitLocalized;
}

export interface PressKitGlossaryEntry {
  id: string;
  term: string;
  definition: PressKitLocalized;
  boundary?: PressKitLocalized;
}

export interface PressKitRegistryEvent {
  id: string;
  occurredAt: string;
  type: 'clarification' | 'correction' | 'release' | 'methodology';
  title: PressKitLocalized;
  detail: PressKitLocalized;
  affectedHref: string;
}

export const PRESS_KIT_RELEASE_DATE = POLICYWATCHER_RELEASE_DATE;
export const PRESS_KIT_CANONICAL_URL = 'https://policywatcher.online/press-kit' as const;
export const POLICYWATCHER_CANONICAL_ORIGIN = 'https://policywatcher.online' as const;
export const PRESS_KIT_JSON_URL = `${PRESS_KIT_CANONICAL_URL}/press-kit.json` as const;
export const PRESS_KIT_REPOSITORY_URL = 'https://github.com/sev7enITA/policywatcher' as const;
export const PRESS_KIT_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/' as const;
export const PRESS_KIT_ARTICLE_50_URL = 'https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-transparency-obligations-providers-deployers-certain-ai-systems' as const;

export const pressKitFacts: PressKitFact[] = [
  {
    id: 'monitored-companies',
    value: '16',
    label: { en: 'configured monitored companies', it: 'aziende monitorate configurate' },
    scope: { en: 'Configured monitored inventory. It excludes the WAZE admin-onboarding fixture and is not exhaustive market coverage.', it: 'Inventario monitorato configurato. Esclude la fixture WAZE per l onboarding amministrativo e non e copertura esaustiva del mercato.' },
    sourceHref: '/',
    sourceLabel: { en: 'Evidence Console', it: 'Console evidenze' },
    asOf: PRESS_KIT_RELEASE_DATE,
    verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each web release', it: 'Ogni release web' },
    recordStatus: 'current',
    permalink: '/press-kit#fact-monitored-companies',
  },
  {
    id: 'configured-sectors',
    value: '6',
    label: { en: 'configured sectors', it: 'settori configurati' },
    scope: { en: 'Sector labels organize the monitored inventory.', it: 'Le etichette di settore organizzano l inventario monitorato.' },
    sourceHref: '/', sourceLabel: { en: 'Evidence Console', it: 'Console evidenze' }, asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each web release', it: 'Ogni release web' }, recordStatus: 'current', permalink: '/press-kit#fact-configured-sectors',
  },
  {
    id: 'canonical-kpis',
    value: '15',
    label: { en: 'canonical KPIs', it: 'KPI canonici' },
    scope: { en: 'Privacy, AI governance and ethics; unavailable assessments display Not assessed.', it: 'Privacy, governance AI ed etica; le valutazioni non disponibili mostrano Non valutato.' },
    sourceHref: '/feature-atlas', sourceLabel: { en: 'Feature Atlas', it: 'Atlante funzionalita' }, asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'When the KPI framework changes', it: 'Quando cambia il framework KPI' }, recordStatus: 'current', permalink: '/press-kit#fact-canonical-kpis',
  },
  {
    id: 'editorial-languages',
    value: 'EN / IT',
    label: { en: 'editorial languages', it: 'lingue editoriali' },
    scope: { en: 'The press kit and selected guidance pages support English and Italian.', it: 'Il press kit e alcune pagine guida supportano inglese e italiano.' },
    sourceHref: '/press-kit', sourceLabel: { en: 'Press Kit', it: 'Press Kit' }, asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each public-language release', it: 'Ogni release linguistica pubblica' }, recordStatus: 'current', permalink: '/press-kit#fact-editorial-languages',
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
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each evidence-gate release', it: 'Ogni release del gate evidenze' }, recordStatus: 'current', permalink: '/press-kit#claim-public-evidence-gate',
  },
  {
    id: 'configured-inventory',
    claim: { en: 'The configured monitored inventory covers 16 companies across 6 sectors and excludes the WAZE admin-onboarding fixture.', it: 'L inventario monitorato configurato comprende 16 aziende in 6 settori ed esclude la fixture WAZE per l onboarding amministrativo.' },
    status: { en: 'Configured inventory', it: 'Inventario configurato' },
    type: 'inventory',
    proofHref: '/',
    proofLabel: { en: 'Evidence Console', it: 'Console evidenze' },
    boundary: { en: 'This is not exhaustive public or market coverage, and source availability can change.', it: 'Non e copertura pubblica o di mercato esaustiva e la disponibilita delle fonti puo cambiare.' },
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each web release', it: 'Ogni release web' }, recordStatus: 'current', permalink: '/press-kit#claim-configured-inventory',
  },
  {
    id: 'canonical-kpis',
    claim: { en: 'One framework defines 15 canonical KPIs across privacy, AI governance and ethics.', it: 'Un framework definisce 15 KPI canonici tra privacy, governance AI ed etica.' },
    status: { en: 'Documented method', it: 'Metodo documentato' },
    type: 'method',
    proofHref: '/feature-atlas',
    proofLabel: { en: 'Feature Atlas', it: 'Atlante funzionalita' },
    boundary: { en: 'Normalized values support comparison only; unavailable assessments have no numerical value and the result is not a compliance score.', it: 'I valori normalizzati servono solo al confronto; le valutazioni non disponibili non hanno valore numerico e il risultato non e un punteggio di conformita.' },
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'When the KPI framework changes', it: 'Quando cambia il framework KPI' }, recordStatus: 'current', permalink: '/press-kit#claim-canonical-kpis',
  },
  {
    id: 'public-code',
    claim: { en: 'The repository and release notes are public and reusable under CC BY 4.0.', it: 'Repository e note di release sono pubblici e riutilizzabili con licenza CC BY 4.0.' },
    status: { en: 'Public repository', it: 'Repository pubblico' },
    type: 'code',
    proofHref: PRESS_KIT_REPOSITORY_URL,
    proofLabel: { en: 'GitHub repository', it: 'Repository GitHub' },
    boundary: { en: 'This describes repository access and license terms; no OSI certification is claimed.', it: 'Descrive accesso e licenza del repository; non viene dichiarata alcuna certificazione OSI.' },
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each licensing change', it: 'A ogni modifica di licenza' }, recordStatus: 'current', permalink: '/press-kit#claim-public-code',
  },
  {
    id: 'source-timestamps',
    claim: { en: 'Evidence views preserve source-specific screening and snapshot timestamps.', it: 'Le viste evidenza mantengono timestamp specifici di screening e snapshot.' },
    status: { en: 'Dataset-derived', it: 'Derivato dal dataset' },
    type: 'freshness',
    proofHref: '/timeline',
    proofLabel: { en: 'Policy timeline', it: 'Timeline policy' },
    boundary: { en: 'Release metadata is dated 30 July 2026; update intervals depend on source retrieval and review.', it: 'I metadata di release sono datati 30 luglio 2026; gli intervalli di aggiornamento dipendono dal recupero e dalla revisione delle fonti.' },
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'Each source-screening release', it: 'Ogni release di screening fonti' }, recordStatus: 'current', permalink: '/press-kit#claim-source-timestamps',
  },
  {
    id: 'external-coverage',
    claim: { en: 'Public articles and professional posts have discussed PolicyWatcher.', it: 'Articoli pubblici e post professionali hanno discusso PolicyWatcher.' },
    status: { en: 'External signal', it: 'Segnale esterno' },
    type: 'coverage',
    proofHref: '/press',
    proofLabel: { en: 'Coverage wall', it: 'Rassegna pubblica' },
    boundary: { en: 'Mentions are references, not endorsements, certifications or independent audits.', it: 'Le menzioni sono riferimenti, non endorsement, certificazioni o audit indipendenti.' },
    asOf: PRESS_KIT_RELEASE_DATE, verifiedAt: PRESS_KIT_RELEASE_DATE,
    reviewCadence: { en: 'When the coverage registry changes', it: 'Quando cambia il registro copertura' }, recordStatus: 'current', permalink: '/press-kit#claim-external-coverage',
  },
];

const pressKitAssetDefinitions: PressKitAsset[] = [
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
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
  },
  {
    id: 'wordmark-dark',
    filename: 'policywatcher-wordmark-dark-2400x600.png',
    href: '/press-kit/policywatcher-wordmark-dark-2400x600.png',
    mediaType: 'image/png',
    dimensions: '2400 x 600 px',
    bytes: 0,
    sha256: '',
    contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher dark wordmark', it: 'Wordmark scuro PolicyWatcher' },
    caption: { en: 'Raster wordmark for light editorial backgrounds. No native vector master is supplied.', it: 'Wordmark raster per sfondi editoriali chiari. Non viene fornito un master vettoriale nativo.' },
    alt: { en: 'PolicyWatcher logo and dark wordmark', it: 'Logo PolicyWatcher e wordmark scuro' },
    usageBoundary: { en: 'Use on light backgrounds without altering proportions.', it: 'Usare su sfondi chiari senza alterare le proporzioni.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
  },
  {
    id: 'wordmark-light',
    filename: 'policywatcher-wordmark-light-on-navy-2400x600.png',
    href: '/press-kit/policywatcher-wordmark-light-on-navy-2400x600.png',
    mediaType: 'image/png',
    dimensions: '2400 x 600 px',
    bytes: 0,
    sha256: '',
    contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher light wordmark on navy', it: 'Wordmark chiaro PolicyWatcher su blu navy' },
    caption: { en: 'Raster wordmark supplied on a navy editorial background. No native vector master is supplied.', it: 'Wordmark raster fornito su sfondo editoriale blu navy. Non viene fornito un master vettoriale nativo.' },
    alt: { en: 'PolicyWatcher logo and light wordmark on navy', it: 'Logo PolicyWatcher e wordmark chiaro su blu navy' },
    usageBoundary: { en: 'Use without changing the supplied background or proportions.', it: 'Usare senza cambiare lo sfondo fornito o le proporzioni.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
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
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
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
    creditLine: 'Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
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
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
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
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
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
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
  },
  {
    id: 'fact-sheet',
    filename: 'policywatcher-fact-sheet-2026-07-27.md',
    href: '/press-kit/policywatcher-fact-sheet-2026-07-27.md',
    mediaType: 'text/markdown',
    dimensions: null,
    bytes: 2495,
    sha256: '0e985d29aefe302bfe019fd9b61a90f4f62207a38457f500884a5c3cce7f3b31',
    contentCredentials: 'not-attached',
    title: { en: 'Press fact sheet', it: 'Scheda stampa' },
    caption: { en: 'Bilingual plain-text facts, context and editorial boundaries.', it: 'Fatti bilingui, contesto e limiti editoriali in testo semplice.' },
    alt: { en: 'Markdown press fact sheet download', it: 'Download della scheda stampa Markdown' },
    usageBoundary: { en: 'Verify links and release metadata when quoting after 27 July 2026.', it: 'Verificare link e metadata di release per citazioni successive al 27 luglio 2026.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'document-manifest',
  },
];

const pressAssetManifestByFilename = new Map(
  pressAssetManifest.assets.map((asset) => [asset.filename, asset]),
);

export const pressKitAssets: PressKitAsset[] = pressKitAssetDefinitions.map((asset) => {
  const generated = pressAssetManifestByFilename.get(asset.filename);
  if (!generated) throw new Error(`Press asset is missing from the generated manifest: ${asset.filename}`);
  return { ...asset, bytes: generated.bytes, sha256: generated.sha256 };
});

export const pressKitCycleItems: PressKitLocalized[] = [
  { en: 'Local .eml decoding with bounded MIME parsing, attachment exclusion and browser-only clue extraction.', it: 'Decodifica locale .eml con parsing MIME limitato, esclusione allegati ed estrazione degli indizi solo nel browser.' },
  { en: 'Read-only public integration directory for the curated Observatory registry, with versioned endpoint and source-boundary metadata.', it: 'Catalogo pubblico di integrazione in sola lettura per il registro curato dell Osservatorio, con endpoint versionato e metadati sui limiti delle fonti.' },
  { en: 'Source Continuity Ledger with sanitized suspension, recovery and verification transitions.', it: 'Source Continuity Ledger con transizioni sanificate di sospensione, recupero e verifica.' },
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

const packageCopy: Record<PressKitLocale, Pick<PressKitPackage, 'id' | 'title' | 'contents' | 'boundary'>> = {
  en: {
    id: 'press-package-en',
    title: { en: 'English editorial package', it: 'Pacchetto editoriale inglese' },
    contents: [
      { en: 'English PDF and plain-text fact sheet', it: 'Scheda dati inglese in PDF e testo semplice' },
      { en: 'Owned logos, screenshots and infographic', it: 'Loghi, screenshot e infografica proprietari' },
      { en: 'PNG, SVG, CSV and JSON configured-scope snapshot', it: 'Snapshot del perimetro in PNG, SVG, CSV e JSON' },
      { en: 'Asset manifest, IPTC metadata, credits and usage terms', it: 'Manifest asset, metadati IPTC, crediti e condizioni d uso' },
    ],
    boundary: { en: 'Verify the live Press Kit before later publication. Content Credentials are not attached.', it: 'Verificare il Press Kit live prima di pubblicazioni successive. Le Content Credentials non sono allegate.' },
  },
  it: {
    id: 'press-package-it',
    title: { en: 'Italian editorial package', it: 'Pacchetto editoriale italiano' },
    contents: [
      { en: 'Italian PDF and plain-text fact sheet', it: 'Scheda dati italiana in PDF e testo semplice' },
      { en: 'Owned logos, screenshots and infographic', it: 'Loghi, screenshot e infografica proprietari' },
      { en: 'PNG, SVG, CSV and JSON configured-scope snapshot', it: 'Snapshot del perimetro in PNG, SVG, CSV e JSON' },
      { en: 'Asset manifest, IPTC metadata, credits and usage terms', it: 'Manifest asset, metadati IPTC, crediti e condizioni d uso' },
    ],
    boundary: { en: 'Verify the live Press Kit before later publication. Content Credentials are not attached.', it: 'Verificare il Press Kit live prima di pubblicazioni successive. Le Content Credentials non sono allegate.' },
  },
};

export const pressKitPackages: PressKitPackage[] = pressPackageManifest.packages.map((item) => {
  const locale = item.locale as PressKitLocale;
  return { ...item, locale, ...packageCopy[locale] };
});

export const pressKitReleases: PressKitRelease[] = [
  {
    slug: 'source-reliability-receiver-conformance-3-9-0-beta-21',
    version: POLICYWATCHER_VERSION,
    displayVersion: POLICYWATCHER_VERSION_DISPLAY,
    datePublished: POLICYWATCHER_RELEASE_DATE,
    dateModified: POLICYWATCHER_RELEASE_DATE,
    status: 'current',
    category: 'product',
    title: { en: 'Source Reliability and Receiver Conformance', it: 'Affidabilita delle fonti e conformita receiver' },
    summary: { en: 'Adds traceable source-acquisition operations, exact-evidence baseline repair and a deterministic webhook receiver conformance lab.', it: 'Aggiunge operazioni tracciabili per l acquisizione delle fonti, riparazione delle baseline con evidenza esatta e un laboratorio deterministico di conformita receiver webhook.' },
    changes: [
      { en: 'Scan runs now separate selected policy records, unique retrieval keys, network attempts and deduplicated acquisitions.', it: 'Le scansioni ora distinguono record policy selezionati, chiavi di retrieval uniche, tentativi di rete e acquisizioni deduplicate.' },
      { en: 'A successful first retrieval establishes an exact-hash public baseline without generating a policy change, score or notification.', it: 'Un primo retrieval riuscito stabilisce una baseline pubblica con hash esatto senza generare cambi policy, punteggi o notifiche.' },
      { en: 'Protected admin views expose public-baseline coverage, withheld records, remediation state and recent scan runs with responsive operational guidance.', it: 'Le viste admin protette espongono copertura delle baseline pubbliche, record trattenuti, stato di remediation e scansioni recenti con indicazioni operative responsive.' },
      { en: 'The Receiver Conformance Lab runs eight deterministic expected-versus-actual fixtures locally and exports bounded JSON results.', it: 'Il Receiver Conformance Lab esegue localmente otto fixture deterministiche expected-versus-actual ed esporta risultati JSON circoscritti.' },
    ],
    boundaries: [
      { en: 'Source reliability records PolicyWatcher retrieval and publication state; it does not certify provider authenticity, completeness or continued availability.', it: 'Source Reliability registra lo stato di retrieval e pubblicazione di PolicyWatcher; non certifica autenticita, completezza o disponibilita continuativa del provider.' },
      { en: 'Conformance results establish compatibility with the published fixtures only and do not certify production identity, secret custody, delivery, replay protection or uptime.', it: 'I risultati di conformita stabiliscono compatibilita solo con le fixture pubblicate e non certificano identita di produzione, custodia dei secret, consegna, protezione replay o uptime.' },
    ],
    evidenceLinks: [
      { href: '/developers/webhook-readiness', label: { en: 'Receiver Conformance Lab', it: 'Receiver Conformance Lab' } },
      { href: '/api/v1/webhook-conformance-suite', label: { en: 'Conformance suite contract', it: 'Contratto conformance suite' } },
      { href: '/methodology/confidence', label: { en: 'Evidence and source method', it: 'Metodo evidenze e fonti' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'webhook-verification-readiness-3-9-0-beta-20',
    version: '3.9.0-beta.20',
    displayVersion: '3.9.0 Beta 20',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'product',
    title: { en: 'Webhook Verification Readiness', it: 'Preparazione alla verifica webhook' },
    summary: { en: 'Publishes a browser-local HMAC-SHA256 verification workbench and a versioned receiver kit while keeping outbound delivery outside the available contract.', it: 'Pubblica un workbench locale nel browser per la verifica HMAC-SHA256 e un kit receiver versionato, mantenendo la consegna outbound fuori dal contratto disponibile.' },
    changes: [
      { en: 'The public workbench verifies the exact timestamp and raw-body signing input locally without submitting or persisting entered values.', it: 'Il workbench pubblico verifica localmente l input esatto composto da timestamp e raw body senza inviare o persistere i valori inseriti.' },
      { en: 'The read-only verification-kit endpoint publishes header names, signing format, a deterministic public test vector and Node/Python examples.', it: 'L endpoint read-only del verification kit pubblica nomi degli header, formato di firma, test vector pubblico deterministico ed esempi Node/Python.' },
      { en: 'Strict helpers reject empty secrets, malformed headers, invalid timestamps, stale messages and signature mismatches.', it: 'Gli helper strict rifiutano secret vuoti, header malformati, timestamp non validi, messaggi obsoleti e firme non corrispondenti.' },
      { en: 'The static vector is identified as a historical signature-compatibility fixture with a fixed freshness reference.', it: 'Il vector statico e identificato come fixture storica di compatibilita della firma con riferimento temporale fisso.' },
    ],
    boundaries: [
      { en: 'Passing the static vector establishes compatibility with that fixture only; production receivers must enforce current-time freshness and replay protection.', it: 'Il superamento del vector statico stabilisce compatibilita solo con quella fixture; i receiver di produzione devono applicare freschezza temporale corrente e protezione replay.' },
      { en: 'The release provides no endpoint registration, subscriptions, production secrets, push delivery, retries, key rotation or delivery receipts.', it: 'La release non fornisce registrazione endpoint, sottoscrizioni, secret di produzione, push, retry, rotazione chiavi o ricevute di consegna.' },
    ],
    evidenceLinks: [
      { href: '/developers/webhook-readiness', label: { en: 'Local verification workbench', it: 'Workbench di verifica locale' } },
      { href: '/api/v1/webhook-verification-kit', label: { en: 'Versioned receiver kit', it: 'Receiver kit versionato' } },
      { href: '/schemas/webhook-verification-kit/v1', label: { en: 'Webhook Verification Kit schema', it: 'Schema Webhook Verification Kit' } },
      { href: '/integrations', label: { en: 'Integration Hub', it: 'Integration Hub' } },
    ],
  },
  {
    slug: 'collaboration-delivery-contracts-3-9-0-beta-19',
    version: '3.9.0-beta.19',
    displayVersion: '3.9.0 Beta 19',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'product',
    title: { en: 'Collaboration Delivery Contracts', it: 'Contratti di collaborazione e distribuzione' },
    summary: { en: 'Adds a deterministic review handoff and a bounded public change-event polling feed while keeping third-party creation and outbound delivery outside the public contract.', it: 'Aggiunge un handoff deterministico per la revisione e un feed pubblico circoscritto per il polling degli eventi, mantenendo creazione su sistemi terzi e consegna outbound fuori dal contratto pubblico.' },
    changes: [
      { en: 'Evidence Collections can export vendor-neutral work items with evidence links, digests, review questions and acceptance criteria.', it: 'Evidence Collections puo esportare work item vendor-neutral con link alle evidenze, digest, domande di revisione e criteri di accettazione.' },
      { en: 'A public endpoint returns already-published policy change events with deterministic IDs, localized summaries and an opaque forward cursor.', it: 'Un endpoint pubblico restituisce eventi relativi a cambiamenti gia pubblicati con ID deterministici, sintesi localizzate e cursore forward opaco.' },
      { en: 'Publication time is recorded separately from retrieval time so later approvals and republications remain visible to consumers.', it: 'Il momento di pubblicazione viene registrato separatamente dal retrieval, affinche approvazioni successive e ripubblicazioni restino visibili ai consumer.' },
      { en: 'Both payloads have public JSON Schemas and are registered in the Developer and Integration directories.', it: 'Entrambi i payload dispongono di JSON Schema pubblici e sono registrati nei cataloghi Developers e Integrations.' },
    ],
    boundaries: [
      { en: 'The handoff manifest creates no third-party record, assignment, deadline, access-control state or delivery confirmation.', it: 'Il manifest di handoff non crea record su sistemi terzi, assegnazioni, scadenze, stato di controllo accessi o conferme di consegna.' },
      { en: 'The event feed is polling only and provides no subscriptions, recipients, push delivery, HMAC signatures, retries, replay protection or delivery receipts.', it: 'Il feed eventi funziona solo tramite polling e non fornisce sottoscrizioni, destinatari, push, firme HMAC, retry, protezione replay o ricevute di consegna.' },
    ],
    evidenceLinks: [
      { href: '/collections', label: { en: 'Evidence Collections', it: 'Collezioni di evidenze' } },
      { href: '/developers', label: { en: 'Developer contract', it: 'Contratto sviluppatori' } },
      { href: '/integrations', label: { en: 'Integration Hub', it: 'Integration Hub' } },
      { href: '/schemas/change-event-feed/v1', label: { en: 'Change Event Feed schema', it: 'Schema Change Event Feed' } },
    ],
  },
  {
    slug: 'evidence-workflow-refinements-3-9-0-beta-18',
    version: '3.9.0-beta.18',
    displayVersion: '3.9.0 Beta 18',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'product',
    title: { en: 'Evidence Workflow Refinements', it: 'Affinamenti del flusso evidenze' },
    summary: { en: 'Refines evidence-first hierarchy, mobile collection navigation, progressive disclosure and developer documentation order without changing public-data or browser-local storage boundaries.', it: 'Affina la gerarchia evidence-first, la navigazione mobile delle collezioni, la visualizzazione progressiva dei controlli e l ordine della documentazione sviluppatori senza modificare i limiti dei dati pubblici o dello storage locale al browser.' },
    changes: [
      { en: 'Collections now keeps the public evidence register before the local ledger in visual, DOM and keyboard order.', it: 'Collections ora mantiene il registro delle evidenze pubbliche prima del ledger locale nell ordine visivo, DOM e da tastiera.' },
      { en: 'Mobile Collections uses a compact three-step ribbon and reciprocal register-to-ledger navigation.', it: 'Collections su mobile usa una ribbon compatta in tre passaggi e navigazione reciproca tra registro e ledger.' },
      { en: 'Search, digest, share and export controls are shown only when the current dataset or selection makes them actionable.', it: 'Ricerca, digest, condivisione ed export sono mostrati solo quando dataset o selezione correnti li rendono utilizzabili.' },
      { en: 'Evidence Packets presents available files before provenance guidance, while Developers presents public API v1 before the Enterprise v2 pilot.', it: 'Evidence Packets presenta i file disponibili prima della guida sulla provenienza, mentre Developers presenta l API pubblica v1 prima del pilot Enterprise v2.' },
    ],
    boundaries: [
      { en: 'The release changes workflow presentation and navigation; it does not alter publication gates, evidence schemas or collection persistence.', it: 'La release modifica presentazione e navigazione del flusso; non altera gate di pubblicazione, schemi delle evidenze o persistenza delle collezioni.' },
      { en: 'The empty local dataset did not support a populated visual fixture; selected-state behavior is covered by regression tests.', it: 'Il dataset locale vuoto non ha consentito una fixture visiva popolata; il comportamento dello stato selezionato e coperto da test di regressione.' },
    ],
    evidenceLinks: [
      { href: '/collections', label: { en: 'Evidence Collections', it: 'Collezioni di evidenze' } },
      { href: '/evidence', label: { en: 'Evidence Packets', it: 'Evidence Packets' } },
      { href: '/developers', label: { en: 'Developer contract', it: 'Contratto sviluppatori' } },
      { href: '/integrations', label: { en: 'Integration Hub', it: 'Integration Hub' } },
    ],
  },
  {
    slug: 'shareable-evidence-collections-3-9-0-beta-17',
    version: '3.9.0-beta.17',
    displayVersion: '3.9.0 Beta 17',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'product',
    title: { en: 'Shareable Evidence Collections', it: 'Collezioni di evidenze condivisibili' },
    summary: { en: 'Groups up to 12 published changes into a local review collection and exports a deterministic, citable evidence bundle without creating accounts or storing collaboration notes.', it: 'Raggruppa fino a 12 cambiamenti pubblicati in una collezione di revisione locale ed esporta un bundle di evidenze deterministico e citabile senza creare account o memorizzare note collaborative.' },
    changes: [
      { en: 'Evidence and change pages can add an exact public change ID to a browser-local collection with a 12-record limit.', it: 'Le pagine Evidence e Change possono aggiungere un change ID pubblico esatto a una collezione locale al browser con limite di 12 record.' },
      { en: 'A canonical share link contains only sorted public change IDs; the local title and review status remain on the device.', it: 'Un link di condivisione canonico contiene solo change ID pubblici ordinati; titolo locale e stato di revisione restano sul dispositivo.' },
      { en: 'The public v1 endpoint returns deterministic JSON, Markdown or CSV with collection and per-record digests, citations, review questions and interpretation boundaries.', it: 'L endpoint pubblico v1 restituisce JSON, Markdown o CSV deterministici con digest della collezione e dei singoli record, citazioni, domande di revisione e limiti interpretativi.' },
      { en: 'The Integration Hub and developer documentation now identify the collection contract as an available read-only integration surface.', it: 'L Integration Hub e la documentazione sviluppatori ora identificano il contratto delle collezioni come superficie di integrazione disponibile in sola lettura.' },
    ],
    boundaries: [
      { en: 'Collections are browser-local review aids, not persistent team workspaces: they do not provide accounts, access control, comments, assignments or a shared audit history.', it: 'Le collezioni sono strumenti di revisione locali al browser, non workspace persistenti per team: non forniscono account, controllo accessi, commenti, assegnazioni o cronologia di audit condivisa.' },
      { en: 'The release does not deliver outbound webhooks or direct Jira, Confluence, Microsoft Teams or Slack publishing; those capabilities remain subject to identity, delivery and audit controls.', it: 'La release non distribuisce webhook outbound o pubblicazione diretta verso Jira, Confluence, Microsoft Teams o Slack; tali capacita restano subordinate a controlli di identita, consegna e audit.' },
    ],
    evidenceLinks: [
      { href: '/collections', label: { en: 'Evidence Collections', it: 'Collezioni di evidenze' } },
      { href: '/schemas/evidence-collection/v1', label: { en: 'Collection schema', it: 'Schema collezione' } },
      { href: '/developers', label: { en: 'Developer contract', it: 'Contratto sviluppatori' } },
      { href: '/integrations', label: { en: 'Integration Hub', it: 'Integration Hub' } },
    ],
  },
  {
    slug: 'evidence-governance-packets-3-9-0-beta-16',
    version: '3.9.0-beta.16',
    displayVersion: '3.9.0 Beta 16',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'product',
    title: { en: 'Evidence Governance Packets', it: 'Pacchetti di governance delle evidenze' },
    summary: { en: 'Connects Dataset QA state, snapshot fingerprints, score explanations, advisory governance mapping and exact-change report downloads in one public evidence record.', it: 'Collega stato Dataset QA, impronte snapshot, spiegazioni del punteggio, mapping governance consultivo e report riferiti al cambiamento esatto in un unico record pubblico.' },
    changes: [
      { en: 'A public Evidence Packet is addressed by change ID, preventing a historical permalink from downloading a later policy analysis.', it: 'Un Evidence Packet pubblico e indirizzato tramite change ID, evitando che un permalink storico scarichi un analisi successiva della policy.' },
      { en: 'Stored source passages are displayed only when an exact substring match is verified against the declared public snapshot.', it: 'I passaggi fonte memorizzati sono mostrati solo quando viene verificata una corrispondenza esatta con lo snapshot pubblico dichiarato.' },
      { en: 'Four typed framework references map assessed KPI topics to review questions without producing compliance verdicts.', it: 'Quattro riferimenti tipizzati collegano i temi KPI valutati a domande di revisione senza produrre verdetti di conformita.' },
      { en: 'The exact packet is available as HTML, JSON and PDF with a deterministic content digest and human-review questions.', it: 'Il pacchetto esatto e disponibile in HTML, JSON e PDF con digest deterministico e domande per la revisione umana.' },
    ],
    boundaries: [
      { en: 'Source confidence describes PolicyWatcher retrieval and publication state; it does not certify source authenticity or policy quality.', it: 'La source confidence descrive lo stato di retrieval e pubblicazione di PolicyWatcher; non certifica autenticita della fonte o qualita della policy.' },
      { en: 'Framework mappings indicate review relevance only and are not legal interpretation, conformity assessment or certification.', it: 'I mapping framework indicano solo rilevanza per la revisione e non sono interpretazione legale, valutazione di conformita o certificazione.' },
    ],
    evidenceLinks: [
      { href: '/evidence', label: { en: 'Evidence Packets', it: 'Evidence Packets' } },
      { href: '/timeline', label: { en: 'Source continuity', it: 'Continuita delle fonti' } },
      { href: '/methodology/confidence', label: { en: 'Confidence methodology', it: 'Metodologia di confidence' } },
      { href: '/roadmap', label: { en: 'Updated roadmap', it: 'Roadmap aggiornata' } },
    ],
  },
  {
    slug: 'citable-coverage-registry-3-9-0-beta-15',
    version: '3.9.0-beta.15',
    displayVersion: '3.9.0 Beta 15',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Citable Coverage Registry', it: 'Registro citabile della copertura' },
    summary: { en: 'Turns the existing external-reference wall into a typed public registry with stable IDs, derived counts, reusable citations and JSON/CSV distributions.', it: 'Trasforma la rassegna dei riferimenti esterni in un registro pubblico tipizzato con ID stabili, conteggi derivati, citazioni riutilizzabili e distribuzioni JSON/CSV.' },
    changes: [
      { en: 'Each recorded reference exposes its source, classification, language, month-level date precision, review date and relationship boundary.', it: 'Ogni riferimento registrato espone fonte, classificazione, lingua, data con precisione mensile, data di revisione e limite della relazione.' },
      { en: 'Coverage totals are derived from one typed registry rather than maintained separately in the page.', it: 'I totali della copertura derivano da un unico registro tipizzato invece di essere mantenuti separatamente nella pagina.' },
      { en: 'A bounded public endpoint distributes the registry as JSON or CSV with a published JSON Schema.', it: 'Un endpoint pubblico circoscritto distribuisce il registro in JSON o CSV con uno schema JSON pubblicato.' },
      { en: 'Dataset and ItemList structured data describe the registry and link back to the original external sources.', it: 'I dati strutturati Dataset e ItemList descrivono il registro e rimandano alle fonti esterne originali.' },
    ],
    boundaries: [
      { en: 'Registry inclusion records a public external reference; it does not establish endorsement, certification, independent audit, readership, reach or factual validation.', it: 'L inclusione nel registro documenta un riferimento pubblico esterno; non stabilisce endorsement, certificazione, audit indipendente, lettura, portata o validazione fattuale.' },
      { en: 'Dates use month precision where the current registry does not hold a supported exact publication day.', it: 'Le date usano precisione mensile quando il registro corrente non dispone di un giorno di pubblicazione esatto supportato.' },
    ],
    evidenceLinks: [
      { href: '/press', label: { en: 'Coverage Registry', it: 'Registro copertura' } },
      { href: '/api/press/coverage', label: { en: 'Coverage Registry JSON', it: 'JSON registro copertura' } },
      { href: '/schemas/press-coverage/v1', label: { en: 'Coverage Registry schema', it: 'Schema registro copertura' } },
      { href: '/press-kit', label: { en: 'Evidence Newsroom', it: 'Evidence Newsroom' } },
    ],
  },
  {
    slug: 'press-outreach-operations-3-9-0-beta-14',
    version: '3.9.0-beta.14',
    displayVersion: '3.9.0 Beta 14',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Press Outreach Operations', it: 'Operazioni di contatto stampa' },
    summary: { en: 'Adds a protected, aggregate-only workflow for operating five reviewed editorial campaign cohorts and inspecting bounded outcome signals.', it: 'Aggiunge un flusso protetto e solo aggregato per gestire cinque coorti editoriali revisionate e ispezionare segnali di esito circoscritti.' },
    changes: [
      { en: 'Authenticated administrators can complete a browser-local launch checklist for five versioned Beta 13 distribution cohorts.', it: 'Gli amministratori autenticati possono completare una checklist di lancio locale al browser per cinque coorti di distribuzione Beta 13 versionate.' },
      { en: 'The desk records only allowlisted campaign, pitch, reply, interview, coverage and correction event categories; auditors remain read-only.', it: 'Il desk registra solo categorie ammesse per campagna, pitch, risposta, intervista, copertura e correzione; gli auditor restano in sola lettura.' },
      { en: 'All-time and trailing-30-day summaries report aggregate event counts without conversion rates or recipient histories.', it: 'I riepiloghi complessivi e degli ultimi 30 giorni riportano conteggi aggregati senza tassi di conversione o cronologie dei destinatari.' },
      { en: 'Operational logs mask subscriber addresses, and privacy guidance now distinguishes public cookie-free measurement from the essential admin session cookie.', it: 'I log operativi mascherano gli indirizzi degli iscritti e la guida privacy distingue ora la misurazione pubblica senza cookie dal cookie di sessione essenziale dell area amministrativa.' },
    ],
    boundaries: [
      { en: 'The workflow does not store journalist, outlet, recipient, email, message, note, referrer or delivery-history data.', it: 'Il flusso non memorizza dati su giornalisti, testate, destinatari, email, messaggi, note, referrer o cronologia di consegna.' },
      { en: 'Event counts are operational proxies; they do not establish delivery, readership, publication, adoption, endorsement or conversion.', it: 'I conteggi degli eventi sono proxy operativi; non stabiliscono consegna, lettura, pubblicazione, adozione, approvazione o conversione.' },
    ],
    evidenceLinks: [
      { href: '/press-kit', label: { en: 'Evidence Newsroom', it: 'Evidence Newsroom' } },
      { href: '/pulse', label: { en: 'PolicyWatcher Pulse', it: 'PolicyWatcher Pulse' } },
      { href: '/privacy', label: { en: 'Privacy and measurement boundary', it: 'Limite privacy e misurazione' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'editorial-pulse-distribution-3-9-0-beta-13',
    version: '3.9.0-beta.13',
    displayVersion: '3.9.0 Beta 13',
    datePublished: '2026-07-29',
    dateModified: '2026-07-29',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Editorial Pulse and Distribution', it: 'Editorial Pulse e distribuzione' },
    summary: { en: 'Adds a human-approved story registry, deterministic Story Packs, reusable social assets, citation-bearing embeds and aggregate editorial measurement.', it: 'Aggiunge un registro editoriale approvato da persone, Story Pack deterministici, asset social riutilizzabili, embed con citazione e misurazione editoriale aggregata.' },
    changes: [
      { en: 'Pulse publishes dated verified leads with facts, proof links, boundaries and reusable citations.', it: 'Pulse pubblica lead verificati e datati con fatti, link di prova, limiti e citazioni riutilizzabili.' },
      { en: 'Each lead provides a versioned deterministic ZIP, four social-card formats and an iframe-ready evidence visual.', it: 'Ogni lead fornisce uno ZIP deterministico versionato, quattro formati social e un visual delle evidenze incorporabile.' },
      { en: 'The Data Room now exposes Dataset and DataDownload structured data, while release, Pulse and Data Room pages use specific Open Graph images.', it: 'La Data Room ora espone dati strutturati Dataset e DataDownload, mentre release, Pulse e Data Room usano immagini Open Graph specifiche.' },
      { en: 'Admin reporting counts allowlisted editorial events without persistent visitor identifiers and labels them as events rather than people or conversions.', it: 'Il reporting amministrativo conta eventi editoriali consentiti senza identificatori persistenti e li definisce eventi, non persone o conversioni.' },
    ],
    boundaries: [
      { en: 'Pulse contains a small reviewed registry; it is not an automated newsroom, exhaustive coverage or a claim of independent validation.', it: 'Pulse contiene un piccolo registro revisionato; non e una redazione automatica, una copertura esaustiva o una dichiarazione di validazione indipendente.' },
      { en: 'Deterministic files establish artifact identity, not continued source availability or factual correctness after their as-of date.', it: 'I file deterministici stabiliscono l identita dell artefatto, non la disponibilita continua delle fonti o la correttezza fattuale dopo la data indicata.' },
    ],
    evidenceLinks: [
      { href: '/pulse', label: { en: 'PolicyWatcher Pulse', it: 'PolicyWatcher Pulse' } },
      { href: '/press-kit/data', label: { en: 'Editorial Data Room', it: 'Data Room editoriale' } },
      { href: '/press-kit', label: { en: 'Evidence Newsroom', it: 'Evidence Newsroom' } },
      { href: '/privacy', label: { en: 'Measurement boundary', it: 'Limite della misurazione' } },
    ],
  },
  {
    slug: 'local-mime-evidence-intake-3-9-0-beta-12',
    version: '3.9.0-beta.12',
    displayVersion: '3.9.0 Beta 12',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
    status: 'archived',
    category: 'product',
    title: { en: 'Local MIME Evidence Intake', it: 'Intake locale MIME delle evidenze' },
    summary: { en: 'Adds bounded local .eml decoding to the notification-to-evidence workflow without mailbox access or raw-message transport.', it: 'Aggiunge la decodifica locale e circoscritta dei file .eml al flusso dalla notifica alle evidenze, senza accesso alla casella o trasporto del messaggio grezzo.' },
    changes: [
      { en: 'Saved .eml files can be decoded in browser memory with plain-text preference and a sanitized HTML fallback.', it: 'I file .eml salvati possono essere decodificati nella memoria del browser, preferendo il testo semplice e usando un fallback HTML ripulito.' },
      { en: 'The parser handles bounded MIME nesting, encoded headers, base64 and quoted-printable bodies without adding a runtime dependency.', it: 'Il parser gestisce annidamento MIME limitato, header codificati e corpi base64 o quoted-printable senza aggiungere dipendenze runtime.' },
      { en: 'Attachments and recipient headers are excluded before the existing local clue review begins.', it: 'Allegati e header dei destinatari vengono esclusi prima della revisione locale degli indizi gia esistente.' },
    ],
    boundaries: [
      { en: 'PolicyWatcher does not connect to a mailbox, receive forwarded mail, upload the .eml file or open attachments.', it: 'PolicyWatcher non si collega a una casella, non riceve mail inoltrate, non carica il file .eml e non apre allegati.' },
      { en: 'Unsupported, attachment-only, deeply nested and oversized files fail closed; extracted clues still require user review.', it: 'File non supportati, composti solo da allegati, troppo annidati o troppo grandi falliscono in modo chiuso; gli indizi estratti richiedono comunque revisione utente.' },
    ],
    evidenceLinks: [
      { href: '/what-changed', label: { en: 'Notification evidence intake', it: 'Intake evidenze da notifica' } },
      { href: '/privacy', label: { en: 'Privacy boundary', it: 'Confine privacy' } },
      { href: '/methodology/confidence', label: { en: 'Evidence methodology', it: 'Metodologia evidenze' } },
    ],
  },
  {
    slug: 'evidence-delivery-integration-3-9-0-beta-11',
    version: '3.9.0-beta.11',
    displayVersion: '3.9.0 Beta 11',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
    status: 'archived',
    category: 'product',
    title: { en: 'Evidence Delivery & Integration', it: 'Distribuzione evidenze e integrazione' },
    summary: { en: 'Introduces a small read-only public integration directory for the curated Observatory registry and its evidence boundaries.', it: 'Introduce un piccolo catalogo pubblico di integrazione in sola lettura per il registro curato dell Osservatorio e i suoi limiti di evidenza.' },
    changes: [
      { en: 'A versioned v1 manifest describes available public endpoints, source-gate semantics, cache policy and rate limits.', it: 'Un manifest v1 versionato descrive endpoint pubblici disponibili, semantica dei gate delle fonti, cache e limiti di richiesta.' },
      { en: 'The localized Observatory endpoint returns curated source, signal and event registry metadata with its manual-review context.', it: 'L endpoint localizzato dell Osservatorio restituisce metadati del registro curato di fonti, segnali ed eventi con il relativo contesto di revisione manuale.' },
      { en: 'Builder navigation, command search, the Site Atlas, roadmap and footer now lead to the developer directory.', it: 'La navigazione Builder, la ricerca comandi, il Site Atlas, la roadmap e il footer conducono ora al catalogo per sviluppatori.' },
    ],
    boundaries: [
      { en: 'The public contract is read-only. It does not ingest external feeds, create records, send webhooks or grant administrative access.', it: 'Il contratto pubblico e in sola lettura. Non acquisisce feed esterni, non crea record, non invia webhook e non concede accesso amministrativo.' },
      { en: 'It excludes policy text, hashes, raw failure reasons, private evidence, credentials and administrative logs.', it: 'Esclude testo delle policy, hash, motivazioni grezze di errore, evidenze private, credenziali e log amministrativi.' },
    ],
    evidenceLinks: [
      { href: '/developers', label: { en: 'Developer directory', it: 'Catalogo sviluppatori' } },
      { href: '/observatory', label: { en: 'Public Observatory', it: 'Osservatorio pubblico' } },
      { href: '/methodology/confidence', label: { en: 'Methodology', it: 'Metodologia' } },
    ],
  },
  {
    slug: 'source-continuity-ledger-3-9-0-beta-10',
    version: '3.9.0-beta.10',
    displayVersion: '3.9.0 Beta 10',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
    status: 'archived',
    category: 'product',
    title: { en: 'Source Continuity Ledger', it: 'Registro di continuita delle fonti' },
    summary: { en: 'Separates provider policy changes from sanitized source-retrieval and publication-state transitions in the public Timeline.', it: 'Separa i cambiamenti delle policy provider dalle transizioni sanificate di retrieval e pubblicazione delle fonti nella Timeline pubblica.' },
    changes: [
      { en: 'A dedicated Source continuity view records standardized suspension, verification and recovery transitions.', it: 'Una vista dedicata Source continuity registra transizioni standardizzate di sospensione, verifica e recupero.' },
      { en: 'The bounded public API collapses repeated equivalent checks and reports explicit coverage limits.', it: 'L API pubblica circoscritta comprime controlli equivalenti ripetuti e dichiara limiti di copertura espliciti.' },
      { en: 'Search, state filters, current-transition markers and responsive evidence cards support public inspection.', it: 'Ricerca, filtri di stato, indicatori della transizione corrente e card responsive supportano l ispezione pubblica.' },
    ],
    boundaries: [
      { en: 'Continuity events describe PolicyWatcher retrieval and publication state, not provider policy quality, legality, service performance or compliance.', it: 'Gli eventi di continuita descrivono lo stato di retrieval e pubblicazione di PolicyWatcher, non qualita della policy provider, legalita, prestazioni del servizio o conformita.' },
      { en: 'Policy text, hashes, diffs, AI analysis, raw failure reasons, final URLs and administrative logs remain excluded.', it: 'Testo policy, hash, diff, analisi AI, motivazioni grezze, URL finali e log amministrativi restano esclusi.' },
    ],
    evidenceLinks: [
      { href: '/timeline', label: { en: 'Policy Evidence Timeline', it: 'Timeline delle evidenze policy' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'verified-browser-distribution-3-9-0-beta-9',
    version: '3.9.0-beta.9',
    displayVersion: '3.9.0 Beta 9',
    datePublished: '2026-07-27',
    dateModified: '2026-07-27',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Verified browser-store distribution', it: 'Distribuzione browser verificata' },
    summary: { en: 'Links the public Chrome Web Store listing and reports Chrome, Edge and Safari as independent distribution states.', it: 'Collega la scheda pubblica Chrome Web Store e riporta Chrome, Edge e Safari come stati di distribuzione indipendenti.' },
    changes: [
      { en: 'The Browser Extension page now links directly to the verified Chrome Web Store listing.', it: 'La pagina Browser Extension ora collega direttamente la scheda verificata del Chrome Web Store.' },
      { en: 'Chrome is marked as published; Edge is marked as having no verified official Add-ons listing yet.', it: 'Chrome e indicato come pubblicato; Edge e indicato come privo, al momento, di una scheda ufficiale Add-ons verificata.' },
      { en: 'Safari remains unavailable with signing and review stated as external prerequisites.', it: 'Safari resta non disponibile, con firma e revisione indicate come prerequisiti esterni.' },
    ],
    boundaries: [
      { en: 'Distribution status is verified per store and does not establish adoption, endorsement or extension behavior beyond the listed package.', it: 'Lo stato di distribuzione e verificato per singolo store e non stabilisce adozione, approvazione o comportamento dell estensione oltre il pacchetto indicato.' },
    ],
    evidenceLinks: [
      { href: '/browser-extension', label: { en: 'Browser Extension availability', it: 'Disponibilita Browser Extension' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'assistant-entry-point-consolidation-3-9-0-beta-8',
    version: '3.9.0-beta.8',
    displayVersion: '3.9.0 Beta 8',
    datePublished: '2026-07-27',
    dateModified: '2026-07-27',
    status: 'archived',
    category: 'product',
    title: { en: 'Assistant entry-point consolidation', it: 'Consolidamento accesso assistente' },
    summary: { en: 'Removes the legacy floating chat control and retains assistant access through unified navigation, Workspace Controls and command search.', it: 'Rimuove il controllo chat flottante precedente e mantiene l accesso all assistente tramite navigazione unificata, Workspace Controls e ricerca comandi.' },
    changes: [
      { en: 'One persistent assistant action remains in the unified dashboard navigation.', it: 'Rimane un unica azione persistente per l assistente nella navigazione unificata della dashboard.' },
      { en: 'The labelled AI Chat action remains available inside Workspace Controls.', it: 'L azione AI Chat con etichetta resta disponibile in Workspace Controls.' },
      { en: 'The Command Palette continues to open the same Policy Live Assistant.', it: 'La Command Palette continua ad aprire lo stesso Policy Live Assistant.' },
    ],
    boundaries: [
      { en: 'This release changes assistant discovery only; it does not change generated answers or the chat API.', it: 'Questa release modifica solo l accesso all assistente; non cambia le risposte generate o l API chat.' },
    ],
    evidenceLinks: [
      { href: '/', label: { en: 'Evidence Console', it: 'Console evidenze' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'release-assurance-newsroom-insights-3-9-0-beta-7',
    version: '3.9.0-beta.7',
    displayVersion: '3.9.0 Beta 7',
    datePublished: '2026-07-27',
    dateModified: '2026-07-27',
    status: 'archived',
    category: 'methodology',
    title: { en: 'Release assurance and newsroom insights', it: 'Assurance della release e segnali newsroom' },
    summary: { en: 'Improves mobile newsroom access, records bounded aggregate engagement events and closes scoped release-security findings.', it: 'Migliora l accesso mobile alla newsroom, registra eventi aggregati circoscritti e chiude rilievi di sicurezza della release con perimetro definito.' },
    changes: [
      { en: 'Mobile Fast Facts, a horizontally scrollable action rail with a visible cue, and more readable Claim Registry metadata.', it: 'Fast Facts mobile, barra azioni a scorrimento orizzontale con indicazione visibile e metadata del Claim Registry piu leggibili.' },
      { en: 'Cookie-free aggregate counts for package-download intentions, Data Room views and press-contact intentions.', it: 'Conteggi aggregati senza cookie per intenzioni di download, visite alla Data Room e intenzioni di contatto stampa.' },
      { en: 'Protected all-time and trailing-30-day newsroom counts for admin and auditor roles.', it: 'Conteggi newsroom protetti complessivi e degli ultimi 30 giorni per ruoli admin e auditor.' },
      { en: 'Generic public chat errors, path-free health responses and explicit production operator identities.', it: 'Errori chat pubblici generici, risposte health senza percorsi fisici e identita operative esplicite in produzione.' },
    ],
    boundaries: [
      { en: 'Counts are events, not unique people, verified readership, media coverage or confirmed contact outcomes.', it: 'I conteggi sono eventi, non persone uniche, letture verificate, copertura stampa o contatti confermati.' },
      { en: 'No performance target or conversion rate is stated before sufficient baseline evidence exists.', it: 'Non viene indicato alcun target di performance o tasso di conversione prima di disporre di una base dati sufficiente.' },
    ],
    evidenceLinks: [
      { href: '/press-kit', label: { en: 'Evidence Newsroom', it: 'Evidence Newsroom' } },
      { href: '/privacy', label: { en: 'Measurement fields and privacy boundary', it: 'Campi misurati e limite privacy' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'evidence-newsroom-3-9-0-beta-6',
    version: '3.9.0-beta.6',
    displayVersion: '3.9.0 Beta 6',
    datePublished: '2026-07-27',
    dateModified: '2026-07-27',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Evidence Newsroom and reusable press data', it: 'Evidence Newsroom e dati stampa riutilizzabili' },
    summary: { en: 'Adds versioned press packages, reusable data formats, claim freshness, release feeds and specialized contact routes.', it: 'Aggiunge pacchetti stampa versionati, formati dati riutilizzabili, freschezza dei claim, feed release e contatti specializzati.' },
    changes: [
      { en: 'English and Italian press packages with manifests, rights and checksums.', it: 'Pacchetti stampa inglese e italiano con manifest, diritti e checksum.' },
      { en: 'Stable fact and claim records with dates, review cadence and status.', it: 'Record stabili per fatti e claim con date, cadenza di revisione e stato.' },
      { en: 'NewsArticle release pages, RSS and JSON Feed distribution.', it: 'Pagine release NewsArticle e distribuzione RSS e JSON Feed.' },
      { en: 'Configured-scope snapshot in PNG, SVG, CSV and JSON.', it: 'Snapshot del perimetro configurato in PNG, SVG, CSV e JSON.' },
    ],
    boundaries: [
      { en: 'Press packages are dated snapshots and require live-source verification before later use.', it: 'I pacchetti stampa sono snapshot datati e richiedono verifica sulla fonte live prima di usi successivi.' },
      { en: 'IPTC metadata records supplied provenance fields; Content Credentials are not attached.', it: 'I metadati IPTC registrano i campi di provenienza forniti; le Content Credentials non sono allegate.' },
    ],
    evidenceLinks: [
      { href: '/press-kit', label: { en: 'Evidence Newsroom', it: 'Evidence Newsroom' } },
      { href: '/press-kit/data', label: { en: 'Data room', it: 'Data room' } },
      { href: '/press-kit/corrections', label: { en: 'Registry changes', it: 'Modifiche registro' } },
    ],
  },
  {
    slug: 'press-kit-navigation-3-9-0-beta-5', version: '3.9.0-beta.5', displayVersion: '3.9.0 Beta 5', datePublished: '2026-07-27', dateModified: '2026-07-27', status: 'archived', category: 'distribution',
    title: { en: 'Press Kit navigation discovery', it: 'Accesso al Press Kit dalla navigazione' },
    summary: { en: 'Made the existing Press Kit visible in Workspace Controls, the shared public header and Command Palette.', it: 'Ha reso visibile il Press Kit in Workspace Controls, header pubblico condiviso e Command Palette.' },
    changes: [{ en: 'Added visible links without changing the factual scope of the Press Kit.', it: 'Aggiunti link visibili senza cambiare il perimetro fattuale del Press Kit.' }],
    boundaries: [{ en: 'Navigation availability depends on deployment of the matching web release.', it: 'La disponibilita della navigazione dipende dal deployment della release web corrispondente.' }],
    evidenceLinks: [{ href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } }],
  },
  {
    slug: 'qualified-public-language-3-9-0-beta-4', version: '3.9.0-beta.4', displayVersion: '3.9.0 Beta 4', datePublished: '2026-07-27', dateModified: '2026-07-27', status: 'archived', category: 'methodology',
    title: { en: 'Qualified public claim language', it: 'Linguaggio pubblico qualificato' },
    summary: { en: 'Revised public statements to remove unsupported absolutes and distinguish controls from measured outcomes.', it: 'Ha rivisto le dichiarazioni pubbliche per rimuovere assoluti non supportati e distinguere controlli da risultati misurati.' },
    changes: [{ en: 'Applied stated scope and limitation language across public product surfaces.', it: 'Applicato linguaggio di perimetro e limitazione alle superfici pubbliche del prodotto.' }],
    boundaries: [{ en: 'Qualified wording does not substitute independent verification.', it: 'Il linguaggio qualificato non sostituisce la verifica indipendente.' }],
    evidenceLinks: [{ href: '/methodology/confidence', label: { en: 'Methodology', it: 'Metodologia' } }],
  },
  {
    slug: 'verifiable-press-kit-3-9-0-beta-3', version: '3.9.0-beta.3', displayVersion: '3.9.0 Beta 3', datePublished: '2026-07-27', dateModified: '2026-07-27', status: 'archived', category: 'product',
    title: { en: 'Verifiable bilingual Press Kit', it: 'Press Kit bilingue verificabile' },
    summary: { en: 'Introduced product facts, a claim ledger, owned media, checksums, boilerplates and a machine-readable endpoint.', it: 'Ha introdotto dati prodotto, registro claim, media proprietari, checksum, boilerplate ed endpoint machine-readable.' },
    changes: [{ en: 'Published the initial evidence-oriented Press Kit in English and Italian.', it: 'Pubblicato il primo Press Kit orientato alle evidenze in inglese e italiano.' }],
    boundaries: [{ en: 'Checksums establish file integrity only; external coverage remains separate.', it: 'I checksum stabiliscono solo l integrita dei file; la copertura esterna resta separata.' }],
    evidenceLinks: [{ href: '/press-kit/press-kit.json', label: { en: 'Press Kit JSON', it: 'JSON Press Kit' } }],
  },
];

export const pressKitDataSnapshots: PressKitDataSnapshot[] = [
  {
    id: `configured-scope-${PRESS_KIT_RELEASE_DATE}`,
    title: { en: 'Configured scope snapshot', it: 'Snapshot del perimetro configurato' },
    description: { en: 'Press-ready representation of monitored-company inventory, sectors, canonical KPIs and supported editorial languages.', it: 'Rappresentazione per la stampa di inventario aziende monitorate, settori, KPI canonici e lingue editoriali supportate.' },
    asOf: PRESS_KIT_RELEASE_DATE,
    generatedAt: PRESS_KIT_RELEASE_DATE,
    methodologyHref: '/methodology/confidence',
    citation: { en: `PolicyWatcher configured scope snapshot, ${PRESS_KIT_RELEASE_DATE}, ${PRESS_KIT_CANONICAL_URL}/data (accessed [date]).`, it: `Snapshot del perimetro configurato PolicyWatcher, ${PRESS_KIT_RELEASE_DATE}, ${PRESS_KIT_CANONICAL_URL}/data (consultato il [data]).` },
    boundary: { en: 'Configured product inventory and method; not exhaustive market coverage, legal advice or measured compliance.', it: 'Inventario e metodo configurati; non copertura esaustiva, consulenza legale o conformita misurata.' },
    files: [
      { format: 'PNG', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_RELEASE_DATE}.png`, mediaType: 'image/png' },
      { format: 'SVG', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_RELEASE_DATE}.svg`, mediaType: 'image/svg+xml' },
      { format: 'CSV', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_RELEASE_DATE}.csv`, mediaType: 'text/csv' },
      { format: 'JSON', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_RELEASE_DATE}.json`, mediaType: 'application/json' },
    ],
  },
];

function contactHref(subject: string, body: string) {
  return `mailto:info@policywatcher.online?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const pressKitContactRoutes: PressKitContactRoute[] = [
  { id: 'press', title: { en: 'Press inquiry', it: 'Richiesta stampa' }, description: { en: 'Questions about the project, a release or an editorial asset.', it: 'Domande sul progetto, una release o un asset editoriale.' }, href: { en: contactHref('PolicyWatcher press inquiry', 'Outlet:\nTopic:\nDeadline and time zone:\nQuestion:\n'), it: contactHref('Richiesta stampa PolicyWatcher', 'Testata:\nArgomento:\nScadenza e fuso orario:\nDomanda:\n') }, requestedContext: { en: 'Include outlet, topic, deadline and time zone.', it: 'Includere testata, argomento, scadenza e fuso orario.' } },
  { id: 'fact-checking', title: { en: 'Fact check or correction', it: 'Fact-checking o correzione' }, description: { en: 'Request review of a specific statement, source, date or asset.', it: 'Richiedere la revisione di una dichiarazione, fonte, data o asset specifico.' }, href: { en: contactHref('PolicyWatcher fact-checking request', 'Cited URL:\nStatement or asset:\nRequested verification:\nDeadline and time zone:\n'), it: contactHref('Richiesta fact-checking PolicyWatcher', 'URL citato:\nDichiarazione o asset:\nVerifica richiesta:\nScadenza e fuso orario:\n') }, requestedContext: { en: 'Include the cited URL and exact statement requiring review.', it: 'Includere URL citato e dichiarazione esatta da verificare.' } },
  { id: 'interview', title: { en: 'Interview request', it: 'Richiesta intervista' }, description: { en: 'Request an interview about PolicyWatcher, evidence quality or policy-monitoring methods.', it: 'Richiedere un intervista su PolicyWatcher, qualita delle evidenze o metodi di monitoraggio policy.' }, href: { en: contactHref('PolicyWatcher interview request', 'Outlet or programme:\nTopic:\nFormat:\nProposed date, deadline and time zone:\nLanguage:\n'), it: contactHref('Richiesta intervista PolicyWatcher', 'Testata o programma:\nArgomento:\nFormato:\nData proposta, scadenza e fuso orario:\nLingua:\n') }, requestedContext: { en: 'Include format, language, proposed date and deadline.', it: 'Includere formato, lingua, data proposta e scadenza.' } },
  { id: 'speaking', title: { en: 'Speaking request', it: 'Richiesta intervento' }, description: { en: 'Request participation in a conference, briefing, podcast or panel.', it: 'Richiedere partecipazione a conferenza, briefing, podcast o panel.' }, href: { en: contactHref('PolicyWatcher speaking request', 'Organization and event:\nTopic:\nFormat and duration:\nDate, location or time zone:\nLanguage:\n'), it: contactHref('Richiesta intervento PolicyWatcher', 'Organizzazione ed evento:\nArgomento:\nFormato e durata:\nData, luogo o fuso orario:\nLingua:\n') }, requestedContext: { en: 'Include organization, format, duration, date and language.', it: 'Includere organizzazione, formato, durata, data e lingua.' } },
];

export const pressKitGlossary: PressKitGlossaryEntry[] = [
  { id: 'public-evidence', term: 'publicEvidence', definition: { en: 'A publication flag used by public data routes to withhold records that have not passed the configured evidence gate.', it: 'Flag di pubblicazione usato dalle route pubbliche per trattenere record che non hanno superato il gate evidenze configurato.' }, boundary: { en: 'The flag does not prove source completeness or legal authority.', it: 'Il flag non prova completezza della fonte o autorita legale.' } },
  { id: 'not-assessed', term: 'Not assessed', definition: { en: 'A missing analytical assessment. It has no numerical value and is not converted to zero.', it: 'Una valutazione analitica mancante. Non ha valore numerico e non viene convertita in zero.' } },
  { id: 'source-suspension', term: 'Source suspension', definition: { en: 'A publication state used when the configured source cannot support a current public analytical record.', it: 'Stato di pubblicazione usato quando la fonte configurata non puo supportare un record analitico pubblico corrente.' }, boundary: { en: 'Suspension is not a finding about the provider policy.', it: 'La sospensione non e un giudizio sulla policy del provider.' } },
  { id: 'snapshot', term: 'Snapshot', definition: { en: 'A dated copy or representation of information available at a recorded point in time.', it: 'Copia o rappresentazione datata delle informazioni disponibili in un momento registrato.' }, boundary: { en: 'A snapshot does not remain current after later source changes.', it: 'Uno snapshot non resta corrente dopo modifiche successive della fonte.' } },
  { id: 'evidence-gate', term: 'Evidence gate', definition: { en: 'Configured checks that determine whether a record is eligible for a public data route.', it: 'Controlli configurati che determinano se un record e idoneo a una route dati pubblica.' }, boundary: { en: 'Eligibility is not legal validation or compliance certification.', it: 'L idoneita non e validazione legale o certificazione di conformita.' } },
];

export const pressKitRegistryEvents: PressKitRegistryEvent[] = [
  { id: 'source-reliability-receiver-conformance-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Source Reliability and Receiver Conformance published', it: 'Pubblicate affidabilita delle fonti e conformita receiver' }, detail: { en: 'Scan and retrieval state is now persisted for protected operations, exact source-supported baselines can be repaired safely, and developers can run the complete deterministic receiver fixture set.', it: 'Lo stato di scansioni e retrieval e ora persistito per le operazioni protette, le baseline supportate da evidenza esatta possono essere riparate in sicurezza e gli sviluppatori possono eseguire l insieme completo di fixture receiver deterministiche.' }, affectedHref: '/press-kit/releases/source-reliability-receiver-conformance-3-9-0-beta-21' },
  { id: 'webhook-verification-readiness-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Webhook Verification Readiness published', it: 'Pubblicata la preparazione alla verifica webhook' }, detail: { en: 'A browser-local workbench and versioned public kit now define and test the candidate HMAC-SHA256 receiver contract without enabling outbound delivery.', it: 'Un workbench locale nel browser e un kit pubblico versionato ora definiscono e verificano il contratto receiver HMAC-SHA256 candidato senza abilitare la consegna outbound.' }, affectedHref: '/press-kit/releases/webhook-verification-readiness-3-9-0-beta-20' },
  { id: 'collaboration-delivery-contracts-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Collaboration Delivery Contracts published', it: 'Pubblicati i contratti di collaborazione e distribuzione' }, detail: { en: 'Evidence Collections now provides a deterministic review handoff and the public API provides a bounded forward-polling change-event feed.', it: 'Evidence Collections ora fornisce un handoff deterministico per la revisione e l API pubblica offre un feed eventi circoscritto con polling forward.' }, affectedHref: '/press-kit/releases/collaboration-delivery-contracts-3-9-0-beta-19' },
  { id: 'evidence-workflow-refinements-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Evidence Workflow Refinements published', it: 'Pubblicati gli affinamenti del flusso evidenze' }, detail: { en: 'Collections, Evidence Packets, Developers and Integrations now use an evidence-first hierarchy, actionable-state controls, compact mobile navigation and consistent service-page footers.', it: 'Collections, Evidence Packets, Developers e Integrations ora usano una gerarchia evidence-first, controlli legati allo stato utilizzabile, navigazione mobile compatta e footer coerenti per le pagine di servizio.' }, affectedHref: '/press-kit/releases/evidence-workflow-refinements-3-9-0-beta-18' },
  { id: 'shareable-evidence-collections-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Shareable Evidence Collections published', it: 'Pubblicate le collezioni di evidenze condivisibili' }, detail: { en: 'Up to 12 exact public changes can now be selected locally, shared through an ID-only link and exported as deterministic JSON, Markdown or CSV with provenance and review boundaries.', it: 'Fino a 12 cambiamenti pubblici esatti possono ora essere selezionati localmente, condivisi tramite un link contenente solo ID ed esportati come JSON, Markdown o CSV deterministici con provenienza e limiti di revisione.' }, affectedHref: '/press-kit/releases/shareable-evidence-collections-3-9-0-beta-17' },
  { id: 'evidence-governance-packets-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Evidence Governance Packets published', it: 'Pubblicati i pacchetti di governance delle evidenze' }, detail: { en: 'Public changes can now expose sanitized source-confidence state, exact snapshot fingerprints, verified source passages, advisory framework relevance and change-bound PDF/JSON reports.', it: 'I cambiamenti pubblici possono ora esporre stato source-confidence sanificato, impronte snapshot esatte, passaggi fonte verificati, rilevanza framework consultiva e report PDF/JSON legati al change.' }, affectedHref: '/press-kit/releases/evidence-governance-packets-3-9-0-beta-16' },
  { id: 'citable-coverage-registry-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Citable Coverage Registry published', it: 'Pubblicato il registro citabile della copertura' }, detail: { en: 'External references now use stable IDs, derived totals, explicit relationship boundaries, reusable citations and JSON/CSV distributions.', it: 'I riferimenti esterni ora usano ID stabili, totali derivati, limiti espliciti della relazione, citazioni riutilizzabili e distribuzioni JSON/CSV.' }, affectedHref: '/press-kit/releases/citable-coverage-registry-3-9-0-beta-15' },
  { id: 'press-outreach-operations-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Press Outreach Operations published', it: 'Pubblicate le operazioni di contatto stampa' }, detail: { en: 'The protected Outreach Desk operates five reviewed campaign cohorts and records bounded aggregate outcome events without recipient histories or conversion rates.', it: 'Il Press Outreach Desk protetto gestisce cinque coorti revisionate e registra eventi di esito aggregati e circoscritti senza cronologie dei destinatari o tassi di conversione.' }, affectedHref: '/press-kit/releases/press-outreach-operations-3-9-0-beta-14' },
  { id: 'editorial-pulse-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Editorial Pulse and Distribution published', it: 'Pubblicati Editorial Pulse e distribuzione' }, detail: { en: 'Verified story leads now include deterministic Story Packs, social-card formats, embeds, citations and aggregate reuse-event measurement.', it: 'I lead verificati ora includono Story Pack deterministici, formati social, embed, citazioni e misurazione aggregata degli eventi di riuso.' }, affectedHref: '/press-kit/releases/editorial-pulse-distribution-3-9-0-beta-13' },
  { id: 'local-mime-evidence-intake-release', occurredAt: '2026-07-28', type: 'release', title: { en: 'Local MIME Evidence Intake published', it: 'Pubblicato Intake locale MIME delle evidenze' }, detail: { en: 'The What Changed workflow now decodes bounded .eml files locally while excluding recipients and attachments from extracted clues.', it: 'Il flusso Cosa e cambiato ora decodifica localmente file .eml limitati, escludendo destinatari e allegati dagli indizi estratti.' }, affectedHref: '/press-kit/releases/local-mime-evidence-intake-3-9-0-beta-12' },
  { id: 'evidence-delivery-integration-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Evidence Delivery & Integration published', it: 'Pubblicata Distribuzione evidenze e integrazione' }, detail: { en: 'The public Developer directory now documents a read-only v1 manifest and localized Observatory registry endpoint with their stated source boundaries.', it: 'Il catalogo pubblico per sviluppatori ora documenta un manifest v1 in sola lettura e l endpoint localizzato del registro Osservatorio con i relativi limiti delle fonti.' }, affectedHref: '/press-kit/releases/evidence-delivery-integration-3-9-0-beta-11' },
  { id: 'source-continuity-ledger-release', occurredAt: POLICYWATCHER_RELEASE_DATE, type: 'release', title: { en: 'Source Continuity Ledger published', it: 'Pubblicato il Source Continuity Ledger' }, detail: { en: 'The public Timeline now separates provider policy changes from sanitized retrieval and publication-state transitions.', it: 'La Timeline pubblica ora separa i cambiamenti delle policy provider dalle transizioni sanificate di retrieval e stato di pubblicazione.' }, affectedHref: '/press-kit/releases/source-continuity-ledger-3-9-0-beta-10' },
  { id: 'verified-browser-distribution-release', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'release', title: { en: 'Chrome distribution verified', it: 'Distribuzione Chrome verificata' }, detail: { en: 'The public Browser Extension page now links the verified Chrome Web Store listing and keeps Edge and Safari availability states separate.', it: 'La pagina pubblica Browser Extension ora collega la scheda verificata del Chrome Web Store e mantiene separati gli stati di disponibilita di Edge e Safari.' }, affectedHref: '/press-kit/releases/verified-browser-distribution-3-9-0-beta-9' },
  { id: 'assistant-entry-point-consolidation-release', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'release', title: { en: 'Assistant entry point consolidated', it: 'Accesso all assistente consolidato' }, detail: { en: 'The legacy floating dashboard trigger was removed while unified navigation, Workspace Controls and command search retain access to the same assistant.', it: 'Il precedente trigger flottante della dashboard e stato rimosso, mentre navigazione unificata, Workspace Controls e ricerca comandi mantengono l accesso allo stesso assistente.' }, affectedHref: '/press-kit/releases/assistant-entry-point-consolidation-3-9-0-beta-8' },
  { id: 'newsroom-measurement-release', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'release', title: { en: 'Newsroom measurement and release assurance published', it: 'Pubblicati misurazione newsroom e assurance della release' }, detail: { en: 'The newsroom records allowlisted aggregate events without persistent visitor identifiers and states the interpretation boundary alongside the current release.', it: 'La newsroom registra eventi aggregati ammessi senza identificatori persistenti dei visitatori e indica il limite interpretativo insieme alla release corrente.' }, affectedHref: '/press-kit/releases/release-assurance-newsroom-insights-3-9-0-beta-7' },
  { id: 'inventory-scope-clarification', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'clarification', title: { en: 'Monitored inventory scope clarified', it: 'Perimetro inventario monitorato chiarito' }, detail: { en: 'The 16-company fact now states that the WAZE record is an admin-onboarding fixture and is excluded from the monitored inventory count.', it: 'Il dato di 16 aziende ora specifica che il record WAZE e una fixture di onboarding amministrativo ed e escluso dal conteggio dell inventario monitorato.' }, affectedHref: '/press-kit#fact-monitored-companies' },
  { id: 'asset-rights-and-metadata', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'methodology', title: { en: 'Asset rights and metadata separated', it: 'Diritti e metadati asset separati' }, detail: { en: 'Owned editorial asset terms, IPTC/XMP metadata and the Content Credentials boundary are now recorded separately from repository licensing.', it: 'Condizioni per asset editoriali proprietari, metadati IPTC/XMP e limite delle Content Credentials sono ora registrati separatamente dalla licenza del repository.' }, affectedHref: '/press-kit#media-assets' },
  { id: 'evidence-newsroom-release', occurredAt: PRESS_KIT_RELEASE_DATE, type: 'release', title: { en: 'Evidence Newsroom registry created', it: 'Creato il registro Evidence Newsroom' }, detail: { en: 'The public registry begins with dated release, claim, package, data and correction records. It does not assert exhaustive history before this date.', it: 'Il registro pubblico inizia con record datati per release, claim, pacchetti, dati e correzioni. Non dichiara una cronologia esaustiva precedente a questa data.' }, affectedHref: '/press-kit/releases/evidence-newsroom-3-9-0-beta-6' },
];

export function buildPressKitPayload() {
  return {
    schema: 'https://policywatcher.online/schemas/press-kit/v1',
    schemaVersion: '2.0.0',
    generatedAt: PRESS_KIT_RELEASE_DATE,
    releaseDate: POLICYWATCHER_RELEASE_DATE,
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
      routes: pressKitContactRoutes,
    },
    facts: pressKitFacts,
    claims: pressKitClaims,
    assets: pressKitAssets,
    packages: pressKitPackages,
    releases: pressKitReleases,
    dataSnapshots: pressKitDataSnapshots,
    glossary: pressKitGlossary,
    registryEvents: pressKitRegistryEvents,
    distribution: {
      releases: `${PRESS_KIT_CANONICAL_URL}/releases`,
      rss: `${PRESS_KIT_CANONICAL_URL}/feed.xml`,
      jsonFeed: `${PRESS_KIT_CANONICAL_URL}/feed.json`,
      corrections: `${PRESS_KIT_CANONICAL_URL}/corrections`,
      dataRoom: `${PRESS_KIT_CANONICAL_URL}/data`,
      coverageRegistry: 'https://policywatcher.online/api/press/coverage',
    },
    assetRights: {
      href: `${PRESS_KIT_CANONICAL_URL}/LICENSE-ASSETS.md`,
      repositoryLicenseIsSeparate: true,
      metadataStandard: 'IPTC Photo Metadata 2025.1',
      nativeVectorMasterAvailable: false,
    },
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
