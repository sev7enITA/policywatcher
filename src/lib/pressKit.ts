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
import { POLICYWATCHER_CANONICAL_ORIGIN } from './siteOrigin';

export { POLICYWATCHER_CANONICAL_ORIGIN } from './siteOrigin';

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
  distribution: 'github-repository';
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
  category: 'product' | 'methodology' | 'distribution' | 'confidence';
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
export const PRESS_KIT_DATA_SNAPSHOT_DATE = '2026-08-02' as const;
export const PRESS_KIT_CANONICAL_URL = `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit` as const;
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
    boundary: { en: 'Release metadata is dated 6 August 2026; update intervals depend on source retrieval and review.', it: 'I metadata di release sono datati 6 agosto 2026; gli intervalli di aggiornamento dipendono dal recupero e dalla revisione delle fonti.' },
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
    id: 'founder-portrait-high-resolution',
    filename: 'fabrizio-degni-portrait-2400-source-upscale.png',
    href: '/press-kit/fabrizio-degni-portrait-2400-source-upscale.png',
    mediaType: 'image/png', dimensions: '2400 x 2400 px', bytes: 0, sha256: '', contentCredentials: 'not-attached',
    title: { en: 'Source-faithful high-resolution founder portrait', it: 'Ritratto fondatore ad alta risoluzione fedele alla fonte' },
    caption: { en: 'Owned 2400-pixel Lanczos upscale of the 200-pixel source photograph; no facial detail was generated.', it: 'Upscale Lanczos proprietario da 2400 pixel della fotografia sorgente da 200 pixel; non sono stati generati dettagli del volto.' },
    alt: { en: 'Black-and-white portrait of Fabrizio Degni', it: 'Ritratto in bianco e nero di Fabrizio Degni' },
    usageBoundary: { en: 'Preferred press version; original source detail remains limited and should not be represented as newly captured photography.', it: 'Versione stampa preferita; il dettaglio originale resta limitato e non va presentato come nuova fotografia.' },
    creditLine: 'Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
  },
  {
    id: 'founder-portrait-ai-restored',
    filename: 'fabrizio-degni-portrait-2400-ai-restored.png',
    href: '/press-kit/fabrizio-degni-portrait-2400-ai-restored.png',
    mediaType: 'image/png', dimensions: '2400 x 2400 px', bytes: 0, sha256: '', contentCredentials: 'not-attached',
    title: { en: 'AI-restored founder portrait variant', it: 'Variante restaurata con AI del ritratto fondatore' },
    caption: { en: 'AI-assisted restoration generated from the owned 200-pixel source portrait and supplied as a disclosed alternative.', it: 'Restauro assistito da AI generato dal ritratto proprietario da 200 pixel e fornito come alternativa dichiarata.' },
    alt: { en: 'AI-restored black-and-white portrait variant of Fabrizio Degni', it: 'Variante in bianco e nero restaurata con AI del ritratto di Fabrizio Degni' },
    usageBoundary: { en: 'Label as AI-assisted restoration; do not present as the unaltered source photograph.', it: 'Indicare il restauro assistito da AI; non presentare come fotografia sorgente inalterata.' },
    creditLine: 'Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1',
  },
  {
    id: 'logo-editorial-svg', filename: 'policywatcher-logo-editorial-container.svg', href: '/press-kit/policywatcher-logo-editorial-container.svg',
    mediaType: 'image/svg+xml', dimensions: '2400 x 2400 px', bytes: 0, sha256: '', contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher editorial SVG container', it: 'Contenitore SVG editoriale PolicyWatcher' },
    caption: { en: 'Self-contained SVG carrying the owned high-resolution raster mark.', it: 'SVG auto-contenuto con il marchio raster proprietario ad alta risoluzione.' },
    alt: { en: 'PolicyWatcher logo SVG download', it: 'Download SVG del logo PolicyWatcher' },
    usageBoundary: { en: 'This is not a native vector-path master; do not represent it as one.', it: 'Non e un master nativo a tracciati vettoriali; non presentarlo come tale.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'document-manifest',
  },
  {
    id: 'logo-editorial-eps', filename: 'policywatcher-logo-editorial-container.eps', href: '/press-kit/policywatcher-logo-editorial-container.eps',
    mediaType: 'application/postscript', dimensions: null, bytes: 0, sha256: '', contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher editorial EPS container', it: 'Contenitore EPS editoriale PolicyWatcher' },
    caption: { en: 'EPS print container carrying the owned high-resolution raster mark.', it: 'Contenitore EPS stampa con il marchio raster proprietario ad alta risoluzione.' },
    alt: { en: 'PolicyWatcher logo EPS download', it: 'Download EPS del logo PolicyWatcher' },
    usageBoundary: { en: 'This is not a native vector-path master; do not represent it as one.', it: 'Non e un master nativo a tracciati vettoriali; non presentarlo come tale.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'document-manifest',
  },
  ...[
    {
      id: 'beta27-knowledge-screenshot', filename: 'policywatcher-beta27-evidence-console-2026-08-01.png', title: { en: 'Beta 27 public Knowledge layer', it: 'Knowledge layer pubblico Beta 27' },
      caption: { en: 'Server-rendered public policy reference layer with publication boundary and explicit empty evidence state.', it: 'Layer pubblico renderizzato lato server con limite di pubblicazione e stato vuoto esplicito.' },
      alt: { en: 'PolicyWatcher public Knowledge layer', it: 'Knowledge layer pubblico PolicyWatcher' },
      boundary: { en: 'The captured empty state is not a healthy-data claim.', it: 'Lo stato vuoto acquisito non e una dichiarazione di dati healthy.' },
    },
    {
      id: 'beta27-release-screenshot', filename: 'policywatcher-beta27-release-record-2026-08-01.png', title: { en: 'Beta 27 release record', it: 'Record release Beta 27' },
      caption: { en: 'Dated Admin Operational Readiness record with implemented changes and boundaries.', it: 'Record datato Admin Operational Readiness con modifiche implementate e limiti.' },
      alt: { en: 'PolicyWatcher Beta 27 release record', it: 'Record release PolicyWatcher Beta 27' },
      boundary: { en: 'Release inventory is not a measured outcome, certification or adoption claim.', it: 'L inventario release non e risultato misurato, certificazione o adozione.' },
    },
    {
      id: 'beta27-press-kit-screenshot', filename: 'policywatcher-beta27-press-kit-2026-08-01.png', title: { en: 'Beta 27 Press Kit', it: 'Press Kit Beta 27' },
      caption: { en: 'Evidence-oriented Press Kit with dated status, actions and extension boundaries.', it: 'Press Kit orientato alle evidenze con stato datato, azioni e limiti dell estensione.' },
      alt: { en: 'PolicyWatcher Beta 27 Press Kit interface', it: 'Interfaccia Press Kit PolicyWatcher Beta 27' },
      boundary: { en: 'Verify the live Press Kit before later publication.', it: 'Verificare il Press Kit live prima di pubblicazioni successive.' },
    },
    {
      id: 'beta27-pulse-screenshot', filename: 'policywatcher-beta27-pulse-2026-08-01.png', title: { en: 'Beta 27 Pulse', it: 'Pulse Beta 27' },
      caption: { en: 'Reviewed editorial leads with visible facts and reuse boundaries.', it: 'Lead editoriali revisionati con dati e limiti di riuso visibili.' },
      alt: { en: 'PolicyWatcher Pulse verified leads interface', it: 'Interfaccia lead verificati PolicyWatcher Pulse' },
      boundary: { en: 'Verified is the configured editorial contract, not independent validation.', it: 'Verificato indica il contratto editoriale configurato, non validazione indipendente.' },
    },
    {
      id: 'beta27-data-room-screenshot', filename: 'policywatcher-beta27-data-room-2026-08-01.png', title: { en: 'Beta 27 Data Room', it: 'Data Room Beta 27' },
      caption: { en: 'Dated configured-scope snapshot with citation and available formats.', it: 'Snapshot datato del perimetro configurato con citazione e formati disponibili.' },
      alt: { en: 'PolicyWatcher editorial Data Room', it: 'Data Room editoriale PolicyWatcher' },
      boundary: { en: 'Configured inventory and method; not exhaustive coverage or measured compliance.', it: 'Inventario e metodo configurati; non copertura esaustiva o conformita misurata.' },
    },
  ].map((asset) => ({
    id: asset.id, filename: asset.filename, href: `/press-kit/${asset.filename}`, mediaType: 'image/png', dimensions: '1440 x 1000 px', bytes: 0, sha256: '', contentCredentials: 'not-attached' as const,
    title: asset.title, caption: asset.caption, alt: asset.alt, usageBoundary: asset.boundary,
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'IPTC Photo Metadata 2025.1' as const,
  })),
  {
    id: 'beta27-demo-video', filename: 'policywatcher-beta27-demo-2026-08-01.mp4', href: '/press-kit/policywatcher-beta27-demo-2026-08-01.mp4',
    mediaType: 'video/mp4', dimensions: '1920 x 1080 px · 87 seconds', bytes: 0, sha256: '', contentCredentials: 'not-attached',
    title: { en: 'PolicyWatcher Beta 27 demo video', it: 'Video demo PolicyWatcher Beta 27' },
    caption: { en: 'Eighty-seven-second product demo with synthetic English narration and selectable English and Italian subtitles.', it: 'Demo prodotto di 87 secondi con voce sintetica inglese e sottotitoli selezionabili inglesi e italiani.' },
    alt: { en: 'PolicyWatcher Beta 27 product demonstration', it: 'Dimostrazione prodotto PolicyWatcher Beta 27' },
    usageBoundary: { en: 'Synthetic narration; product demonstration, not an independent review or measured outcome.', it: 'Voce sintetica; dimostrazione prodotto, non review indipendente o risultato misurato.' },
    creditLine: 'PolicyWatcher / Fabrizio Degni', rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard: 'document-manifest',
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
  ...[
    { id: 'release-evidence-pulse-en-png', locale: 'en', format: 'PNG', filename: 'policywatcher-release-evidence-pulse-en-2026-08-15.png', mediaType: 'image/png', dimensions: '2400 x 3168 px', metadataStandard: 'IPTC Photo Metadata 2025.1' },
    { id: 'release-evidence-pulse-en-webp', locale: 'en', format: 'WebP', filename: 'policywatcher-release-evidence-pulse-en-2026-08-15.webp', mediaType: 'image/webp', dimensions: '2400 x 3168 px', metadataStandard: 'document-manifest' },
    { id: 'release-evidence-pulse-it-png', locale: 'it', format: 'PNG', filename: 'policywatcher-release-evidence-pulse-it-2026-08-15.png', mediaType: 'image/png', dimensions: '2400 x 3350 px', metadataStandard: 'IPTC Photo Metadata 2025.1' },
    { id: 'release-evidence-pulse-it-webp', locale: 'it', format: 'WebP', filename: 'policywatcher-release-evidence-pulse-it-2026-08-15.webp', mediaType: 'image/webp', dimensions: '2400 x 3350 px', metadataStandard: 'document-manifest' },
  ].map((asset) => ({
    id: asset.id,
    filename: asset.filename,
    href: `/press-kit/${asset.filename}`,
    mediaType: asset.mediaType,
    dimensions: asset.dimensions,
    bytes: 0,
    sha256: '',
    contentCredentials: 'not-attached' as const,
    title: asset.locale === 'en'
      ? { en: `Release Evidence Pulse infographic (${asset.format}, English)`, it: `Infografica Release Evidence Pulse (${asset.format}, inglese)` }
      : { en: `Release Evidence Pulse infographic (${asset.format}, Italian)`, it: `Infografica Release Evidence Pulse (${asset.format}, italiano)` },
    caption: {
      en: 'Six dated release clusters across the 2 to 15 August 2026 evidence window, with implementation impacts, metrics and residual boundaries.',
      it: 'Sei cluster di release datati nella finestra di evidenza dal 2 al 15 agosto 2026, con impatti implementativi, metriche e limiti residui.',
    },
    alt: asset.locale === 'en'
      ? { en: 'English PolicyWatcher fourteen-day release evidence infographic', it: 'Infografica inglese PolicyWatcher sulle evidenze di release in quattordici giorni' }
      : { en: 'Italian PolicyWatcher fourteen-day release evidence infographic', it: 'Infografica italiana PolicyWatcher sulle evidenze di release in quattordici giorni' },
    usageBoundary: {
      en: 'Implementation inventory, not measured adoption, independent validation or compliance certification. The decorative background is AI-generated and disclosed.',
      it: 'Inventario implementativo, non adozione misurata, validazione indipendente o certificazione di conformita. Lo sfondo decorativo e generato con AI e dichiarato.',
    },
    creditLine: 'PolicyWatcher / Fabrizio Degni',
    rightsUrl: '/press-kit/LICENSE-ASSETS.md',
    metadataStandard: asset.metadataStandard as PressKitAsset['metadataStandard'],
  })),
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
  { en: 'Human-approved AI model registry with JSON Schema, frozen evidence gates and automatic promotion disabled.', it: 'Registro dei modelli AI approvato da persone con JSON Schema, gate di evidenza congelati e promozione automatica disabilitata.' },
  { en: 'Privacy-safe GenAI telemetry projection that excludes prompts, responses and source content.', it: 'Proiezione di telemetria GenAI rispettosa della privacy che esclude prompt, risposte e contenuto delle fonti.' },
  { en: 'One validated fourteen-day release ledger drives the public API, Evidence Pulse and bilingual press infographic.', it: 'Un unico ledger di release validato su quattordici giorni alimenta API pubblica, Evidence Pulse e infografica stampa bilingue.' },
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
      { en: 'Beta 27 release, regional pitch drafts, FAQ, claims freeze and 87-second subtitled demo', it: 'Release Beta 27, pitch regionali, FAQ, claims freeze e demo sottotitolata di 87 secondi' },
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
      { en: 'Beta 27 release, regional pitch drafts, FAQ, claims freeze and 87-second subtitled demo', it: 'Release Beta 27, pitch regionali, FAQ, claims freeze e demo sottotitolata di 87 secondi' },
    ],
    boundary: { en: 'Verify the live Press Kit before later publication. Content Credentials are not attached.', it: 'Verificare il Press Kit live prima di pubblicazioni successive. Le Content Credentials non sono allegate.' },
  },
};

export const pressKitPackages: PressKitPackage[] = pressPackageManifest.packages.map((item) => {
  const locale = item.locale as PressKitLocale;
  if (item.distribution !== 'github-repository') {
    throw new Error(`Unsupported Press Kit package distribution: ${item.distribution}`);
  }
  return { ...item, locale, distribution: item.distribution as 'github-repository', ...packageCopy[locale] };
});

export const pressKitReleases: PressKitRelease[] = [
  {
    slug: 'evidence-release-control-plane-3-9-0-beta-42',
    version: POLICYWATCHER_VERSION,
    displayVersion: POLICYWATCHER_VERSION_DISPLAY,
    datePublished: POLICYWATCHER_RELEASE_DATE,
    dateModified: POLICYWATCHER_RELEASE_DATE,
    status: 'current',
    category: 'confidence',
    title: { en: 'Evidence Release Control Plane', it: 'Control plane delle release evidence-first' },
    summary: { en: 'Adds a model qualification registry, a hashed release-evidence ledger and a two-week evidence pulse shared by web, API and press assets.', it: 'Aggiunge un registro di qualificazione dei modelli, un ledger delle release con hash e un evidence pulse di due settimane condiviso da web, API e asset stampa.' },
    changes: [
      { en: 'The AI EvalOps registry records nine candidates as qualified, blocked, pending or research-only and keeps every promotion human-approved.', it: 'Il registro AI EvalOps classifica nove candidati come qualificati, bloccati, pending o research-only e mantiene ogni promozione soggetta ad approvazione umana.' },
      { en: 'A public 14-day release ledger joins release records to impact evidence and exposes a deterministic SHA-256 digest and ETag.', it: 'Un ledger pubblico di 14 giorni collega le release alle evidenze di impatto ed espone digest SHA-256 ed ETag deterministici.' },
      { en: 'The Evidence Pulse reuses the ledger for an accessible web experience and exact-data press infographic with EN/IT briefing copy.', it: 'L Evidence Pulse riusa il ledger per un esperienza web accessibile e un infografica stampa con dati esatti e briefing EN/IT.' },
    ],
    boundaries: [
      { en: 'Model qualification is limited to the frozen evaluation contract; Qwen3/BGE remain unscored and Gemini 3.7 Flash remains blocked.', it: 'La qualificazione dei modelli e limitata al contratto di valutazione congelato; Qwen3/BGE restano non valutati e Gemini 3.7 Flash resta bloccato.' },
      { en: 'Release metrics are implementation evidence, not adoption, service quality, compliance, accessibility or market-impact outcomes.', it: 'Le metriche di release sono evidenze implementative, non risultati di adozione, qualita del servizio, conformita, accessibilita o impatto di mercato.' },
    ],
    evidenceLinks: [
      { href: '/pulse/two-week-release-impact', label: { en: 'Two-week Evidence Pulse', it: 'Evidence Pulse di due settimane' } },
      { href: '/api/v1/release-evidence', label: { en: 'Release evidence API', it: 'API delle evidenze release' } },
      { href: '/infographics', label: { en: 'Press infographic', it: 'Infografica stampa' } },
    ],
  },
  {
    slug: 'adaptive-experience-3-9-0-beta-41',
    version: '3.9.0-beta.41',
    displayVersion: '3.9.0 Beta 41',
    datePublished: '2026-08-07',
    dateModified: '2026-08-07',
    status: 'archived',
    category: 'product',
    title: { en: 'Adaptive Experience', it: 'Esperienza adattiva' },
    summary: { en: 'Adds explicit complexity and motion controls, a deterministic next step and a source-generated ER sitemap.', it: 'Aggiunge controlli espliciti di complessita e movimento, un prossimo passo deterministico e una sitemap ER generata dalla fonte.' },
    changes: [
      { en: 'Focus, Balanced and Explore modes change hierarchy and density while preserving evidence and publication gates.', it: 'Le modalita Focus, Bilanciata ed Esplora cambiano gerarchia e densita preservando evidenze e gate di pubblicazione.' },
      { en: 'A visible motion preference, skip link, focus treatment and inspectable interface explanation improve user control.', it: 'Una preferenza visibile per il movimento, skip link, focus e spiegazione ispezionabile dell interfaccia migliorano il controllo utente.' },
      { en: 'The ER sitemap generator validates 33 literal static routes, seven domains and four dynamic route families.', it: 'Il generatore della sitemap ER valida 33 route statiche letterali, sette domini e quattro famiglie di route dinamiche.' },
    ],
    boundaries: [
      { en: 'The presentation presets do not personalize evidence, infer expertise or use AI ranking.', it: 'I preset di presentazione non personalizzano le evidenze, non inferiscono competenza e non usano ranking AI.' },
      { en: 'The shipped accessibility improvements are not a formal WCAG conformance claim or measured usability outcome.', it: 'I miglioramenti di accessibilita distribuiti non sono una dichiarazione formale di conformita WCAG o un risultato di usabilita misurato.' },
    ],
    evidenceLinks: [
      { href: '/', label: { en: 'Adaptive dashboard', it: 'Dashboard adattiva' } },
      { href: '/infographics', label: { en: 'ER sitemap infographic', it: 'Infografica sitemap ER' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
    ],
  },
  {
    slug: 'policywatcher-civico-3-9-0-beta-40',
    version: '3.9.0-beta.40',
    displayVersion: '3.9.0 Beta 40',
    datePublished: '2026-08-06',
    dateModified: '2026-08-07',
    status: 'archived',
    category: 'product',
    title: { en: 'PolicyWatcher Civico', it: 'PolicyWatcher Civico' },
    summary: { en: 'Adds a bounded public-evidence workspace for a controlled pilot with Italian consumer associations.', it: 'Aggiunge un workspace circoscritto di evidenze pubbliche per un pilota controllato con le associazioni italiane dei consumatori.' },
    changes: [
      { en: 'Reviewers can build a browser-local watchlist from eligible published change records and assign local review states.', it: 'I revisori possono creare una watchlist locale al browser da record di modifica pubblicati e ammissibili, assegnando stati di revisione locali.' },
      { en: 'Theme triage, source-first inspection and a deterministic Markdown digest support repeatable internal briefing.', it: 'Triage per tema, ispezione source-first e digest Markdown deterministico supportano briefing interni ripetibili.' },
      { en: 'Selected public records can be handed to Evidence Collections while local titles and review state stay out of shared URLs.', it: 'I record pubblici selezionati possono passare alle Raccolte di evidenze mentre titoli locali e stato di revisione restano fuori dagli URL condivisi.' },
      { en: 'Browser Extension availability now reports the owner-confirmed Microsoft Edge Add-ons publication independently from Safari.', it: 'La disponibilita della Browser Extension ora riporta la pubblicazione su Microsoft Edge Add-ons confermata dal publisher separatamente da Safari.' },
    ],
    boundaries: [
      { en: 'The workspace is not an association account, complaint system, legal opinion or automated publication desk.', it: 'Il workspace non e un account associativo, sistema reclami, parere legale o desk di pubblicazione automatica.' },
      { en: 'Watchlist and review state remain in the current browser; unavailable or ineligible records do not become civic evidence.', it: 'Watchlist e stato di revisione restano nel browser corrente; record non disponibili o non ammissibili non diventano evidenze civiche.' },
    ],
    evidenceLinks: [
      { href: '/associazioni', label: { en: 'Civic Lab', it: 'Associazioni' } },
      { href: '/methodology/confidence', label: { en: 'Confidence methodology', it: 'Metodologia confidence' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
    ],
  },
  {
    slug: 'managed-vps-releases-3-9-0-beta-39',
    version: '3.9.0-beta.39',
    displayVersion: '3.9.0 Beta 39',
    datePublished: '2026-08-02',
    dateModified: '2026-08-02',
    status: 'archived',
    category: 'product',
    title: { en: 'Managed VPS Releases', it: 'Release VPS gestite' },
    summary: { en: 'Moves bounded Renderer package upload, verification, asynchronous deployment and recovery into the protected Admin Center.', it: 'Porta nel pannello Admin protetto upload, verifica, deployment asincrono e recovery dei pacchetti Renderer circoscritti.' },
    changes: [
      { en: 'Administrators select the package locally while the browser computes SHA-256 before any upload.', it: 'Gli amministratori selezionano il pacchetto localmente mentre il browser calcola SHA-256 prima dell upload.' },
      { en: 'Hostinger validates and HMAC-signs a bounded upload that Operations Agent 0.2 stages only after independent checksum and archive checks.', it: 'Hostinger valida e firma HMAC un upload circoscritto che Operations Agent 0.2 prepara solo dopo controlli indipendenti su checksum e archivio.' },
      { en: 'The update runs asynchronously while the Admin Center follows install, service restart, smoke test and rollback state.', it: 'L aggiornamento viene eseguito in modo asincrono mentre l Admin Center segue installazione, riavvio del servizio, smoke test e rollback.' },
    ],
    boundaries: [
      { en: 'Operations Agent 0.2 requires one initial VPS bootstrap and does not update itself.', it: 'Operations Agent 0.2 richiede un bootstrap iniziale sulla VPS e non aggiorna se stesso.' },
      { en: 'The workflow accepts no arbitrary URL, path or shell command and remains limited to Renderer release packages of at most 5 MiB.', it: 'Il workflow non accetta URL, percorsi o comandi shell arbitrari e resta limitato a pacchetti release Renderer fino a 5 MiB.' },
    ],
    evidenceLinks: [
      { href: '/admin/vps-services', label: { en: 'Protected VPS Services', it: 'Servizi VPS protetti' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
      { href: '/roadmap', label: { en: 'Release roadmap', it: 'Roadmap release' } },
    ],
  },
  {
    slug: 'git-hosted-press-distribution-3-9-0-beta-38',
    version: '3.9.0-beta.38',
    displayVersion: '3.9.0 Beta 38',
    datePublished: '2026-08-02',
    dateModified: '2026-08-02',
    status: 'archived',
    category: 'distribution',
    title: { en: 'Git-hosted Press Distribution', it: 'Distribuzione Press Kit tramite Git' },
    summary: { en: 'Moves complete editorial-package delivery to the public GitHub repository and removes nested Press Kit ZIPs from Hostinger application artifacts.', it: 'Sposta la distribuzione dei pacchetti editoriali completi nel repository GitHub pubblico e rimuove gli ZIP Press Kit annidati dagli artifact applicativi Hostinger.' },
    changes: [
      { en: 'The English and Italian package records now expose explicit GitHub repository URLs, provider metadata and SHA-256 values.', it: 'I record dei pacchetti inglese e italiano ora espongono URL espliciti del repository GitHub, metadata del provider e valori SHA-256.' },
      { en: 'The Press Kit interface labels the external GitHub handoff and opens it with safe cross-origin link attributes.', it: 'L interfaccia Press Kit identifica l handoff esterno verso GitHub e lo apre con attributi cross-origin sicuri.' },
      { en: 'The Hostinger release builder excludes all complete Press Kit ZIPs and fails if a nested package is detected.', it: 'Il builder della release Hostinger esclude tutti gli ZIP Press Kit completi e fallisce se rileva un pacchetto annidato.' },
    ],
    boundaries: [
      { en: 'GitHub availability and main-branch publication become external dependencies for full-package downloads.', it: 'La disponibilita di GitHub e la pubblicazione sul branch main diventano dipendenze esterne per i download dei pacchetti completi.' },
      { en: 'Checksums establish byte integrity only and do not prove authorship, semantic accuracy or endorsement.', it: 'I checksum stabiliscono solo l integrita dei byte e non provano autorialita, accuratezza semantica o endorsement.' },
    ],
    evidenceLinks: [
      { href: '/press-kit#press-packages', label: { en: 'Press packages', it: 'Pacchetti stampa' } },
      { href: PRESS_KIT_REPOSITORY_URL, label: { en: 'Public repository', it: 'Repository pubblico' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
    ],
  },
  {
    slug: 'resource-navigation-retrieval-diagnostics-3-9-0-beta-37', version: '3.9.0-beta.37', displayVersion: '3.9.0 Beta 37', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'product',
    title: { en: 'Resource Navigation and Retrieval Diagnostics', it: 'Navigazione risorse e diagnostica retrieval' },
    summary: { en: 'Groups the public resource directory and makes shared retrieval behavior inspectable without adding WAF-evasion techniques.', it: 'Raggruppa il catalogo pubblico delle risorse e rende ispezionabile il comportamento dei retrieval condivisi senza aggiungere tecniche di elusione WAF.' },
    changes: [
      { en: 'The footer preserves all public destinations in four Explore, Product, Build and Media groups with responsive native disclosures.', it: 'Il footer preserva tutte le destinazioni pubbliche in quattro gruppi Explore, Product, Build e Media con disclosure native responsive.' },
      { en: 'Protected scans expose safe acquisition fingerprints and explicit network or cached/deduplicated modes while log URLs omit credentials and query values.', it: 'Le scansioni protette espongono fingerprint sicuri delle acquisizioni e modalita network o cached/deduplicated esplicite, mentre gli URL nei log omettono credenziali e valori query.' },
      { en: 'Renderer 1.2 uses its bundled Chromium User-Agent by default and reports authenticated browser-major and override-mode diagnostics.', it: 'Renderer 1.2 usa per default lo User-Agent del Chromium incluso e riporta diagnostica autenticata sulla versione major e sulla modalita override.' },
    ],
    boundaries: [
      { en: 'Different regional policy paths remain separate acquisitions even when they belong to the same brand.', it: 'Percorsi policy regionali differenti restano acquisizioni separate anche quando appartengono allo stesso brand.' },
      { en: 'No stealth plugin, CAPTCHA bypass or WAF-evasion behavior is included.', it: 'Non sono inclusi plugin stealth, bypass CAPTCHA o comportamenti di elusione WAF.' },
    ],
    evidenceLinks: [
      { href: '/admin/source-reliability', label: { en: 'Remediation workbench', it: 'Workbench remediation' } },
      { href: '/developers', label: { en: 'Developer directory', it: 'Catalogo sviluppatori' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
    ],
  },
  {
    slug: 'remediation-community-mutation-hardening-3-9-0-beta-36', version: '3.9.0-beta.36', displayVersion: '3.9.0 Beta 36', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'confidence',
    title: { en: 'Remediation UX, Community Signals and Mutation Hardening', it: 'UX di remediation, segnali community e hardening delle mutazioni' },
    summary: { en: 'Completes two evidence-oriented UX waves and one centralized administrative mutation hardening wave.', it: 'Completa due wave UX orientate alle evidenze e una wave centralizzata di hardening delle mutazioni amministrative.' },
    changes: [
      { en: 'The protected remediation workbench prioritizes the returned issue window and allows closure only after acquisition recovery.', it: 'Il workbench protetto di remediation prioritizza la finestra restituita e consente la chiusura solo dopo il recupero dell acquisizione.' },
      { en: 'The Roadmap Signal Composer keeps a bounded four-stage proposal draft in the browser until an explicit GitHub or copy action.', it: 'Il Composer dei segnali Roadmap mantiene una bozza limitata in quattro fasi nel browser fino a un azione GitHub o copia esplicita.' },
      { en: 'Unsafe admin API requests now pass one origin, media-type, declared-size, rate and response-metadata boundary.', it: 'Le richieste API admin non sicure ora attraversano un unico confine per origine, media type, dimensione dichiarata, rate e metadati di risposta.' },
    ],
    boundaries: [
      { en: 'Workflow closure is not proof of continuous source recovery, and the composer does not establish popularity or adoption.', it: 'La chiusura del workflow non prova il recupero continuo della fonte e il composer non stabilisce popolarita o adozione.' },
      { en: 'Mutation hardening is not a pentest, CSRF certification, distributed rate limit or proof of proxy behavior.', it: 'L hardening delle mutazioni non e un pentest, una certificazione CSRF, un rate limit distribuito o prova del comportamento del proxy.' },
    ],
    evidenceLinks: [
      { href: '/admin/source-reliability', label: { en: 'Remediation workbench', it: 'Workbench remediation' } },
      { href: '/roadmap', label: { en: 'Community roadmap', it: 'Roadmap community' } },
      { href: '/feature-atlas', label: { en: 'Feature Atlas', it: 'Atlante funzionalita' } },
    ],
  },
  {
    slug: 'community-signal-composer-3-9-0-beta-35', version: '3.9.0-beta.35', displayVersion: '3.9.0 Beta 35', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'product',
    title: { en: 'Community Signal Composer UX', it: 'UX del Composer segnali community' },
    summary: { en: 'Turns roadmap interest into a bounded browser-local proposal reviewed before an explicit GitHub handoff.', it: 'Trasforma l interesse per la roadmap in una proposta limitata e locale nel browser, revisionata prima di un handoff GitHub esplicito.' },
    changes: [{ en: 'Candidate filters, four review stages, strict local drafts and deterministic proposal generation replace direct prefilled vote links.', it: 'Filtri candidati, quattro fasi di revisione, bozze locali rigorose e generazione deterministica sostituiscono i link di voto precompilati.' }],
    boundaries: [{ en: 'Draft contents are not sent automatically; GitHub permissions, review, acceptance and adoption remain external.', it: 'I contenuti della bozza non vengono inviati automaticamente; permessi GitHub, revisione, accettazione e adozione restano esterni.' }],
    evidenceLinks: [{ href: '/roadmap', label: { en: 'Community roadmap', it: 'Roadmap community' } }],
  },
  {
    slug: 'source-remediation-workbench-3-9-0-beta-34', version: '3.9.0-beta.34', displayVersion: '3.9.0 Beta 34', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'product',
    title: { en: 'Source Remediation Workbench UX', it: 'UX del Workbench di remediation fonti' },
    summary: { en: 'Adds a returned-window priority sequence, bounded evidence ledger and recovery-gated closure for protected source operations.', it: 'Aggiunge una sequenza di priorita sulla finestra restituita, un ledger di evidenze limitato e la chiusura vincolata al recupero per le operazioni protette sulle fonti.' },
    changes: [{ en: 'Search, status and reason filters, desktop and mobile evidence layouts, safe HTTPS references and a Detect to Close rail support review.', it: 'Ricerca, filtri per stato e motivo, layout evidenze desktop e mobile, riferimenti HTTPS sicuri e una rail da Detect a Close supportano la revisione.' }],
    boundaries: [{ en: 'Resolved records describe workflow state only and do not prove source availability or measured usability improvement.', it: 'I record risolti descrivono solo lo stato del workflow e non provano disponibilita della fonte o miglioramenti di usabilita misurati.' }],
    evidenceLinks: [{ href: '/admin/source-reliability', label: { en: 'Protected workbench', it: 'Workbench protetto' } }],
  },
  {
    slug: 'production-assurance-renderer-hardening-3-9-0-beta-33',
    version: '3.9.0-beta.33',
    displayVersion: '3.9.0 Beta 33',
    datePublished: '2026-08-02',
    dateModified: '2026-08-02',
    status: 'archived',
    category: 'confidence',
    title: { en: 'Production Assurance and Renderer Hardening', it: 'Assurance di produzione e hardening del renderer' },
    summary: { en: 'Completes three roadmap waves with a residency evidence pack, authenticated deployment verification and fail-closed renderer controls.', it: 'Completa tre wave della roadmap con un evidence pack sulla residenza, verifica autenticata del deployment e controlli fail-closed del renderer.' },
    changes: [
      { en: 'A public residency register distinguishes documented, declared, deployment-dependent and open evidence.', it: 'Un registro pubblico sulla residenza distingue evidenze documentate, dichiarate, dipendenti dal deployment e aperte.' },
      { en: 'A protected verification snapshot checks database readiness, release identity, live headers and anonymous rejection paths.', it: 'Uno snapshot protetto verifica readiness del database, identita della release, header live e rifiuto dei percorsi anonimi.' },
      { en: 'Renderer 1.1 requires HTTPS target allowlists and adds secret rotation, authenticated readiness, bounded output and redacted logs.', it: 'Renderer 1.1 richiede allowlist HTTPS dei target e aggiunge rotazione dei secret, readiness autenticata, output limitato e log sanificati.' },
    ],
    boundaries: [
      { en: 'The residency register is not a DPA or proof of the live deployment region.', it: 'Il registro sulla residenza non e un DPA ne prova della regione del deployment live.' },
      { en: 'Production Verification is not a pentest, and renderer readiness is not a source or security certification.', it: 'Production Verification non e un pentest e la readiness del renderer non e una certificazione della fonte o di sicurezza.' },
    ],
    evidenceLinks: [
      { href: '/trust/residency', label: { en: 'Residency evidence', it: 'Evidenze di residenza' } },
      { href: '/admin/production-verification', label: { en: 'Protected verification', it: 'Verifica protetta' } },
    ],
  },
  {
    slug: 'authenticated-production-verification-3-9-0-beta-32', version: '3.9.0-beta.32', displayVersion: '3.9.0 Beta 32', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'confidence',
    title: { en: 'Authenticated Production Verification', it: 'Verifica autenticata della produzione' },
    summary: { en: 'Adds a protected, sanitized post-deploy snapshot with explicit unavailable and external-evidence states.', it: 'Aggiunge uno snapshot post-deploy protetto e sanificato con stati unavailable ed evidenza esterna espliciti.' },
    changes: [{ en: 'Admin and Auditor can inspect runtime, database, header, release and negative authorization checks.', it: 'Admin e Auditor possono ispezionare controlli su runtime, database, header, release e autorizzazione negativa.' }],
    boundaries: [{ en: 'The snapshot is not an independent penetration test or continuous posture result.', it: 'Lo snapshot non e un penetration test indipendente ne un risultato continuo di postura.' }],
    evidenceLinks: [{ href: '/admin/production-verification', label: { en: 'Protected verification', it: 'Verifica protetta' } }],
  },
  {
    slug: 'residency-processor-evidence-3-9-0-beta-31', version: '3.9.0-beta.31', displayVersion: '3.9.0 Beta 31', datePublished: '2026-08-02', dateModified: '2026-08-02', status: 'archived', category: 'confidence',
    title: { en: 'Residency and Processor Evidence', it: 'Evidenze di residenza e processor' },
    summary: { en: 'Publishes a dated human and machine-readable register with record-level evidence states and open closure actions.', it: 'Pubblica un registro datato leggibile da persone e macchine con stati di evidenza per record e azioni aperte di chiusura.' },
    changes: [{ en: 'Six processing and storage records link to four dated public references and a deterministic digest.', it: 'Sei record di trattamento e storage collegano quattro riferimenti pubblici datati e un digest deterministico.' }],
    boundaries: [{ en: 'The register is not a DPA, transfer impact assessment or proof of live hosting and backup regions.', it: 'Il registro non e un DPA, una valutazione di impatto sui trasferimenti o prova delle regioni live di hosting e backup.' }],
    evidenceLinks: [{ href: '/trust/residency', label: { en: 'Residency evidence', it: 'Evidenze di residenza' } }],
  },
  {
    slug: 'enterprise-agent-contract-evidence-3-9-0-beta-30',
    version: '3.9.0-beta.30',
    displayVersion: '3.9.0 Beta 30',
    datePublished: '2026-08-01',
    dateModified: '2026-08-01',
    status: 'archived',
    category: 'product',
    title: { en: 'Enterprise Agent and Contract Evidence Integration', it: 'Integrazione agent enterprise ed evidenze contrattuali' },
    summary: { en: 'Adds a cross-cloud public evidence contract, provider agent source packages and a Word task pane that keeps selected clause text local.', it: 'Aggiunge un contratto pubblico di evidenze cross-cloud, pacchetti sorgente per agent e un task pane Word che mantiene locale il testo della clausola selezionata.' },
    changes: [
      { en: 'Three public read-only operations return deterministic source-linked change and Observatory briefs through a flattened OpenAPI 3.0 contract.', it: 'Tre operazioni pubbliche in sola lettura restituiscono brief deterministici con fonti su cambiamenti e Observatory tramite un contratto OpenAPI 3.0 appiattito.' },
      { en: 'Source packages cover Microsoft 365 Copilot, Vertex AI Agent Builder and Amazon Quick controlled pilots.', it: 'I pacchetti sorgente coprono pilot controllati per Microsoft 365 Copilot, Vertex AI Agent Builder e Amazon Quick.' },
      { en: 'The Word task pane classifies an explicit selection locally and sends only displayed fixed topic labels after separate acknowledgement.', it: 'Il task pane Word classifica localmente una selezione esplicita e invia solo etichette fisse visualizzate dopo un consenso separato.' },
      { en: 'Private tenant workflows remain on the Entra-authenticated Enterprise API v2.', it: 'I workflow privati del tenant restano sull Enterprise API v2 autenticata con Entra.' },
    ],
    boundaries: [
      { en: 'Source-package readiness is not cloud deployment, tenant approval, marketplace publication, certification or provider endorsement.', it: 'La disponibilita dei pacchetti sorgente non equivale a deployment cloud, approvazione tenant, pubblicazione marketplace, certificazione o endorsement del provider.' },
      { en: 'The Word task pane maps topics to public evidence; it does not verify, approve or legally assess a contract.', it: 'Il task pane Word associa argomenti a evidenze pubbliche; non verifica, approva o valuta legalmente un contratto.' },
    ],
    evidenceLinks: [
      { href: '/integrations', label: { en: 'Integration Options', it: 'Opzioni di integrazione' } },
      { href: '/api/v1/agent/openapi.json', label: { en: 'Agent OpenAPI', it: 'OpenAPI agent' } },
      { href: '/office-addin/contract-review', label: { en: 'Word task pane', it: 'Task pane Word' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'multicloud-agent-source-packages-3-9-0-beta-29', version: '3.9.0-beta.29', displayVersion: '3.9.0 Beta 29', datePublished: '2026-08-01', dateModified: '2026-08-01', status: 'archived', category: 'product',
    title: { en: 'Multi-cloud Agent Source Packages', it: 'Pacchetti sorgente agent multi-cloud' },
    summary: { en: 'Packages the public evidence contract for Microsoft 365 Copilot, Vertex AI Agent Builder and Amazon Quick pilots.', it: 'Confeziona il contratto pubblico di evidenze per pilot Microsoft 365 Copilot, Vertex AI Agent Builder e Amazon Quick.' },
    changes: [{ en: 'Provider-specific manifests, deterministic instructions and controlled-pilot runbooks are source controlled.', it: 'Manifest specifici per provider, istruzioni deterministiche e runbook per pilot controllati sono versionati nel sorgente.' }],
    boundaries: [{ en: 'The packages are not deployed, certified or marketplace-published.', it: 'I pacchetti non sono distribuiti, certificati o pubblicati nei marketplace.' }],
    evidenceLinks: [{ href: '/integrations', label: { en: 'Integration Options', it: 'Opzioni di integrazione' } }],
  },
  {
    slug: 'agent-evidence-gateway-3-9-0-beta-28', version: '3.9.0-beta.28', displayVersion: '3.9.0 Beta 28', datePublished: '2026-08-01', dateModified: '2026-08-01', status: 'archived', category: 'product',
    title: { en: 'Cross-cloud Agent Evidence Gateway', it: 'Agent Evidence Gateway cross-cloud' },
    summary: { en: 'Adds three deterministic public evidence operations with citations, timestamps, filters and explicit limits.', it: 'Aggiunge tre operazioni deterministiche su evidenze pubbliche con citazioni, timestamp, filtri e limiti espliciti.' },
    changes: [{ en: 'A flattened OpenAPI 3.0 contract supports public change and curated Observatory briefs.', it: 'Un contratto OpenAPI 3.0 appiattito supporta brief sui cambiamenti pubblici e sull Observatory curato.' }],
    boundaries: [{ en: 'The gateway accepts bounded filters only and does not provide legal advice or exhaustive coverage.', it: 'Il gateway accetta solo filtri circoscritti e non fornisce consulenza legale o copertura esaustiva.' }],
    evidenceLinks: [{ href: '/api/v1/agent/openapi.json', label: { en: 'Agent OpenAPI', it: 'OpenAPI agent' } }],
  },
  {
    slug: 'admin-operational-readiness-3-9-0-beta-27', version: '3.9.0-beta.27', displayVersion: '3.9.0 Beta 27', datePublished: '2026-08-01', dateModified: '2026-08-01', status: 'archived', category: 'product',
    title: { en: 'Admin Operational Readiness', it: 'Readiness operativa amministrativa' },
    summary: { en: 'Connects protected priorities, publication readiness, independent live status, role-safe actions and bounded measurement.', it: 'Collega priorita protette, readiness di pubblicazione, live status indipendenti, azioni role-safe e misurazione circoscritta.' },
    changes: [{ en: 'A deterministic Action Center, readiness funnel and live status cards preserve unavailable states.', it: 'Un Action Center deterministico, un funnel di readiness e live status card preservano gli stati unavailable.' }],
    boundaries: [{ en: 'The dashboard does not certify operational health, usability, accessibility, security or compliance.', it: 'La dashboard non certifica salute operativa, usabilita, accessibilita, sicurezza o compliance.' }],
    evidenceLinks: [{ href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } }],
  },
  {
    slug: 'crawlable-public-knowledge-layer-3-9-0-beta-26',
    version: '3.9.0-beta.26',
    displayVersion: '3.9.0 Beta 26',
    datePublished: '2026-07-31',
    dateModified: '2026-07-31',
    status: 'archived',
    category: 'product',
    title: { en: 'Crawlable Public Knowledge Layer', it: 'Knowledge Layer pubblica indicizzabile' },
    summary: { en: 'Adds server-rendered public reference pages and machine discovery for records that pass the existing evidence gates.', it: 'Aggiunge pagine di riferimento pubbliche renderizzate sul server e discovery machine-readable per i record che superano i gate di evidenza esistenti.' },
    changes: [
      { en: 'A server-rendered Knowledge index and canonical company and policy pages expose bounded public metadata, verification timestamps and evidence links in the initial HTML.', it: 'Un indice Knowledge renderizzato sul server e pagine canoniche per aziende e policy espongono nell HTML iniziale metadata pubblici circoscritti, timestamp di verifica e link alle evidenze.' },
      { en: 'The home route includes a visible server-rendered Knowledge snapshot before the interactive workspace boundary.', it: 'La home include uno snapshot Knowledge visibile e renderizzato sul server prima del confine del workspace interattivo.' },
      { en: 'robots.txt, llms.txt and the dynamic sitemap connect public reference routes while excluding protected and mutation surfaces.', it: 'robots.txt, llms.txt e la sitemap dinamica collegano le route di riferimento pubbliche escludendo superfici protette e di mutazione.' },
      { en: 'Structured data repeats visible claims and citations; missing, invalid or withheld entity records fail closed with HTTP 404.', it: 'I dati strutturati ripetono claim e citazioni visibili; record entita mancanti, non validi o trattenuti restituiscono HTTP 404 in modalita fail-closed.' },
    ],
    boundaries: [
      { en: 'The layer publishes public metadata and evidence links only; it does not expose raw policy text, internal logs, credentials, admin notes or withheld records.', it: 'Il layer pubblica solo metadata pubblici e link alle evidenze; non espone testo grezzo delle policy, log interni, credenziali, note admin o record trattenuti.' },
      { en: 'Crawler directives support discovery but do not guarantee indexing, citation, ranking or inclusion by a search or answer engine.', it: 'Le direttive crawler supportano la discovery ma non garantiscono indicizzazione, citazione, ranking o inclusione da parte di motori di ricerca o risposta.' },
    ],
    evidenceLinks: [
      { href: '/knowledge', label: { en: 'Public Knowledge index', it: 'Indice Knowledge pubblico' } },
      { href: '/methodology/confidence', label: { en: 'Publication methodology', it: 'Metodologia di pubblicazione' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'admin-shell-readability-3-9-0-beta-25',
    version: '3.9.0-beta.25',
    displayVersion: '3.9.0 Beta 25',
    datePublished: '2026-07-30',
    dateModified: '2026-07-30',
    status: 'archived',
    category: 'product',
    title: { en: 'Admin Shell Readability', it: 'Leggibilita della shell amministrativa' },
    summary: { en: 'Makes role, current route, keyboard entry and shared control states explicit across the protected administrative shell.', it: 'Rende espliciti ruolo, percorso corrente, accesso da tastiera e stati dei controlli condivisi nella shell amministrativa protetta.' },
    changes: [
      { en: 'The shared shell labels the authenticated Admin or Auditor role and exposes the current protected route in desktop and mobile navigation.', it: 'La shell condivisa indica il ruolo autenticato Admin o Auditor ed espone il percorso protetto corrente nella navigazione desktop e mobile.' },
      { en: 'Active navigation now uses a structural marker in addition to colour, and a keyboard skip link targets the stable administrative main region.', it: 'La navigazione attiva usa ora un indicatore strutturale oltre al colore e un link di salto da tastiera punta alla regione principale amministrativa stabile.' },
      { en: 'Navigation, menu, close and logout controls retain at least 44px targets with visible focus states.', it: 'I controlli di navigazione, menu, chiusura e logout mantengono target di almeno 44px con stati focus visibili.' },
      { en: 'Session verification and error states use accessible status semantics while shared secondary shell text retains a 12px minimum.', it: 'Gli stati di verifica sessione ed errore usano semantica accessibile mentre il testo secondario condiviso mantiene un minimo di 12px.' },
    ],
    boundaries: [
      { en: 'This release changes the shared administrative frame only; authentication, authorization, protected-page behavior and API contracts are unchanged.', it: 'Questa release modifica solo il frame amministrativo condiviso; autenticazione, autorizzazione, comportamento delle pagine protette e contratti API restano invariati.' },
      { en: 'Implementation checks do not establish measured task-time improvement, accessibility certification or production usability outcomes.', it: 'I controlli di implementazione non stabiliscono un miglioramento misurato dei tempi, una certificazione di accessibilita o risultati di usabilita in produzione.' },
    ],
    evidenceLinks: [
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'webhook-operations-ux-3-9-0-beta-24',
    version: '3.9.0-beta.24',
    displayVersion: '3.9.0 Beta 24',
    datePublished: '2026-07-30',
    dateModified: '2026-07-30',
    status: 'archived',
    category: 'product',
    title: { en: 'Webhook Operations UX', it: 'UX delle operazioni webhook' },
    summary: { en: 'Refines the protected webhook console with one evidence-based operational focus, local ledger filtering and clearer mobile states.', it: 'Affina la console webhook protetta con una priorita operativa basata sulle evidenze, filtri locali del registro e stati mobile piu leggibili.' },
    changes: [
      { en: 'One operational focus derives the next review action from configuration, terminal failures, scheduled work, processing state or the absence of returned exceptions.', it: 'Una priorita operativa deriva la prossima azione di revisione da configurazione, fallimenti terminali, lavoro programmato, stato di elaborazione o assenza di eccezioni restituite.' },
      { en: 'The ledger now filters locally by needs-action, scheduled and delivered state and searches endpoint, event and change identifiers.', it: 'Il registro ora filtra localmente per stato da gestire, programmato e consegnato e cerca identificativi endpoint, evento e cambiamento.' },
      { en: 'Result counts, reset controls and separate no-record and no-match states keep the current filtering context explicit.', it: 'Conteggio risultati, controlli di reset e stati distinti senza record e senza corrispondenze rendono esplicito il contesto dei filtri.' },
      { en: 'Mobile supporting text meets a 12px minimum within the page, while controls retain 44px targets and the ledger avoids page-level horizontal overflow.', it: 'Il testo secondario mobile rispetta un minimo di 12px nella pagina, mentre i controlli mantengono target di 44px e il registro evita overflow orizzontale della pagina.' },
    ],
    boundaries: [
      { en: 'The operational focus describes only the returned ledger window; it is not an exhaustive health determination, delivery guarantee or SLA.', it: 'La priorita operativa descrive solo la finestra del registro restituita; non e una valutazione esaustiva dello stato, una garanzia di consegna o uno SLA.' },
      { en: 'This release changes UI hierarchy and local filtering only; delivery, authorization, retry and receiver contracts remain unchanged.', it: 'Questa release modifica solo gerarchia UI e filtri locali; i contratti di consegna, autorizzazione, retry e receiver restano invariati.' },
    ],
    evidenceLinks: [
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
      { href: '/developers/webhook-readiness', label: { en: 'Receiver verification contract', it: 'Contratto di verifica receiver' } },
      { href: '/developers/event-continuity', label: { en: 'Event Feed Continuity Lab', it: 'Laboratorio continuita feed eventi' } },
    ],
  },
  {
    slug: 'configured-webhook-delivery-pilot-3-9-0-beta-23',
    version: '3.9.0-beta.23',
    displayVersion: '3.9.0 Beta 23',
    datePublished: '2026-07-30',
    dateModified: '2026-07-30',
    status: 'archived',
    category: 'product',
    title: { en: 'Configured Webhook Delivery Pilot', it: 'Pilot di consegna webhook configurata' },
    summary: { en: 'Adds deployment-configured delivery of signed public change events through a persistent outbox, bounded retries and a protected operator console.', it: 'Aggiunge la consegna configurata dal deployment di eventi pubblici firmati tramite outbox persistente, retry circoscritti e console operativa protetta.' },
    changes: [
      { en: 'Eligible public change events are enqueued once per configured destination using the existing stable public event identity.', it: 'Gli eventi pubblici idonei sono accodati una volta per destinazione configurata usando l identita stabile dell evento pubblico esistente.' },
      { en: 'Each request uses the documented HMAC-SHA256 v1 signature headers, an exact HTTPS-origin allowlist and an eight-second timeout.', it: 'Ogni richiesta usa gli header di firma HMAC-SHA256 v1 documentati, una allowlist esatta delle origini HTTPS e un timeout di otto secondi.' },
      { en: 'A persistent outbox and per-attempt ledger record bounded pending, processing, retry, delivered and terminal-failure states without storing receiver bodies.', it: 'Un outbox persistente e un registro per tentativo conservano stati circoscritti pending, processing, retry, delivered e fallimento terminale senza memorizzare i body del receiver.' },
      { en: 'Administrators can run one bounded cycle or reschedule an eligible failed record; auditors receive the same sanitized read-only view.', it: 'Gli amministratori possono eseguire un ciclo circoscritto o riprogrammare un record fallito idoneo; gli auditor ricevono la stessa vista sanitizzata in sola lettura.' },
    ],
    boundaries: [
      { en: 'Destinations are configured by deployment operators; there is no public endpoint registration, tenant self-service or browser-originated delivery.', it: 'Le destinazioni sono configurate dagli operatori del deployment; non esistono registrazione pubblica degli endpoint, self-service tenant o consegna avviata dal browser.' },
      { en: 'The pilot does not provide endpoint challenge verification, automatic key rotation, guaranteed delivery, an SLA or confirmation that a receiver processed an accepted request.', it: 'Il pilot non fornisce challenge di verifica endpoint, rotazione automatica delle chiavi, consegna garantita, SLA o conferma che un receiver abbia elaborato una richiesta accettata.' },
    ],
    evidenceLinks: [
      { href: '/developers/webhook-readiness', label: { en: 'Receiver verification contract', it: 'Contratto di verifica receiver' } },
      { href: '/developers/event-continuity', label: { en: 'Event Feed Continuity Lab', it: 'Laboratorio continuita feed eventi' } },
      { href: '/api/v1/change-events?limit=25&lang=en', label: { en: 'Public change-event envelope', it: 'Envelope pubblico degli eventi' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'event-feed-continuity-3-9-0-beta-22',
    version: '3.9.0-beta.22',
    displayVersion: '3.9.0 Beta 22',
    datePublished: '2026-07-30',
    dateModified: '2026-07-30',
    status: 'archived',
    category: 'product',
    title: { en: 'Event Feed Continuity', it: 'Continuita del feed eventi' },
    summary: { en: 'Adds a browser-local checkpoint and continuity inspection workbench for the public forward-polling change-event feed.', it: 'Aggiunge un checkpoint locale nel browser e un workbench di ispezione della continuita per il feed pubblico degli eventi con polling forward.' },
    changes: [
      { en: 'Developers can inspect the current bounded feed window or explicitly resume from a locally saved opaque cursor.', it: 'Gli sviluppatori possono ispezionare la finestra corrente circoscritta del feed o riprendere esplicitamente da un cursore opaco salvato localmente.' },
      { en: 'The continuity report identifies observable duplicates, chronological regressions, checkpoint overlap and initial-window truncation.', it: 'Il report di continuita identifica duplicati osservabili, regressioni cronologiche, sovrapposizione del checkpoint e troncamento della finestra iniziale.' },
      { en: 'Checkpoint import and export uses a strict versioned JSON contract with a bounded history of 100 public event identifiers.', it: 'Import ed export del checkpoint usano un contratto JSON versionato e rigoroso con una cronologia circoscritta a 100 identificativi evento pubblici.' },
      { en: 'Request state, local-storage state and progressive event disclosure remain explicit and keyboard operable on compact screens.', it: 'Lo stato della richiesta, lo stato del local storage e la visualizzazione progressiva degli eventi restano espliciti e utilizzabili da tastiera su schermi compatti.' },
    ],
    boundaries: [
      { en: 'A clean returned window does not prove exhaustive monitoring, network delivery or the absence of events outside the public feed window.', it: 'Una finestra restituita senza anomalie non prova monitoraggio esaustivo, consegna di rete o assenza di eventi fuori dalla finestra del feed pubblico.' },
      { en: 'The lab does not provide endpoint registration, subscriptions, push delivery, server-side replay storage, delivery receipts or an SLA.', it: 'Il laboratorio non fornisce registrazione endpoint, sottoscrizioni, consegna push, archivio replay lato server, ricevute di consegna o SLA.' },
    ],
    evidenceLinks: [
      { href: '/developers/event-continuity', label: { en: 'Event Feed Continuity Lab', it: 'Laboratorio continuita feed eventi' } },
      { href: '/api/v1/change-events?limit=25&lang=en', label: { en: 'Public change-event feed', it: 'Feed pubblico degli eventi di cambiamento' } },
      { href: '/schemas/event-continuity-checkpoint/v1', label: { en: 'Checkpoint JSON Schema', it: 'Schema JSON del checkpoint' } },
      { href: '/roadmap', label: { en: 'Release impact', it: 'Impatto release' } },
    ],
  },
  {
    slug: 'source-reliability-receiver-conformance-3-9-0-beta-21',
    version: '3.9.0-beta.21',
    displayVersion: '3.9.0 Beta 21',
    datePublished: '2026-07-30',
    dateModified: '2026-07-30',
    status: 'archived',
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
    id: `configured-scope-${PRESS_KIT_DATA_SNAPSHOT_DATE}`,
    title: { en: 'Configured scope snapshot', it: 'Snapshot del perimetro configurato' },
    description: { en: 'Press-ready representation of monitored-company inventory, sectors, canonical KPIs and supported editorial languages.', it: 'Rappresentazione per la stampa di inventario aziende monitorate, settori, KPI canonici e lingue editoriali supportate.' },
    asOf: PRESS_KIT_DATA_SNAPSHOT_DATE,
    generatedAt: PRESS_KIT_DATA_SNAPSHOT_DATE,
    methodologyHref: '/methodology/confidence',
    citation: { en: `PolicyWatcher configured scope snapshot, ${PRESS_KIT_DATA_SNAPSHOT_DATE}, ${PRESS_KIT_CANONICAL_URL}/data (accessed [date]).`, it: `Snapshot del perimetro configurato PolicyWatcher, ${PRESS_KIT_DATA_SNAPSHOT_DATE}, ${PRESS_KIT_CANONICAL_URL}/data (consultato il [data]).` },
    boundary: { en: 'Configured product inventory and method; not exhaustive market coverage, legal advice or measured compliance.', it: 'Inventario e metodo configurati; non copertura esaustiva, consulenza legale o conformita misurata.' },
    files: [
      { format: 'PNG', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_DATA_SNAPSHOT_DATE}.png`, mediaType: 'image/png' },
      { format: 'SVG', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_DATA_SNAPSHOT_DATE}.svg`, mediaType: 'image/svg+xml' },
      { format: 'CSV', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_DATA_SNAPSHOT_DATE}.csv`, mediaType: 'text/csv' },
      { format: 'JSON', href: `/press-kit/policywatcher-configured-scope-${PRESS_KIT_DATA_SNAPSHOT_DATE}.json`, mediaType: 'application/json' },
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
  { id: 'evidence-release-control-plane-release', occurredAt: '2026-08-15', type: 'release', title: { en: 'Evidence Release Control Plane published', it: 'Pubblicato Evidence Release Control Plane' }, detail: { en: 'A human-approved model registry, privacy-safe telemetry, validated release ledger and bilingual Evidence Pulse now share explicit evidence and residual boundaries.', it: 'Un registro modelli approvato da persone, telemetria rispettosa della privacy, un ledger di release validato ed Evidence Pulse bilingue ora condividono evidenze e limiti residui espliciti.' }, affectedHref: '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42' },
  { id: 'adaptive-experience-release', occurredAt: '2026-08-07', type: 'release', title: { en: 'Adaptive Experience published', it: 'Pubblicata Esperienza adattiva' }, detail: { en: 'The dashboard now exposes deterministic complexity and motion controls plus a source-generated ER sitemap.', it: 'La dashboard ora espone controlli deterministici di complessita e movimento oltre a una sitemap ER generata dalla fonte.' }, affectedHref: '/press-kit/releases/adaptive-experience-3-9-0-beta-41' },
  { id: 'edge-addons-publication', occurredAt: '2026-08-06', type: 'release', title: { en: 'Microsoft Edge Add-ons publication reported', it: 'Segnalata la pubblicazione su Microsoft Edge Add-ons' }, detail: { en: 'The Browser Extension page now reports Chrome and Edge as published while the Edge direct action remains gated by official URL configuration.', it: 'La pagina Browser Extension ora riporta Chrome ed Edge come pubblicati, mentre l azione diretta Edge resta vincolata alla configurazione dell URL ufficiale.' }, affectedHref: '/press-kit/releases/policywatcher-civico-3-9-0-beta-40' },
  { id: 'policywatcher-civico-release', occurredAt: '2026-08-06', type: 'release', title: { en: 'PolicyWatcher Civico published', it: 'Pubblicato PolicyWatcher Civico' }, detail: { en: 'A source-first public-evidence workspace now supports a controlled browser-local pilot with Italian consumer associations.', it: 'Un workspace source-first di evidenze pubbliche ora supporta un pilota controllato e locale al browser con le associazioni italiane dei consumatori.' }, affectedHref: '/press-kit/releases/policywatcher-civico-3-9-0-beta-40' },
  { id: 'managed-vps-releases-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Managed VPS Releases published', it: 'Pubblicate le Release VPS gestite' }, detail: { en: 'The protected Admin Center now uploads bounded Renderer packages through Hostinger to Operations Agent 0.2 and follows asynchronous verification or rollback.', it: 'L Admin Center protetto ora carica pacchetti Renderer circoscritti attraverso Hostinger verso Operations Agent 0.2 e segue verifica asincrona o rollback.' }, affectedHref: '/press-kit/releases/managed-vps-releases-3-9-0-beta-39' },
  { id: 'git-hosted-press-distribution-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Git-hosted Press Distribution published', it: 'Pubblicata la distribuzione Press Kit tramite Git' }, detail: { en: 'Complete EN and IT editorial packages now download from the public GitHub repository while Hostinger application artifacts exclude nested Press Kit ZIPs.', it: 'I pacchetti editoriali completi EN e IT ora vengono scaricati dal repository GitHub pubblico, mentre gli artifact applicativi Hostinger escludono gli ZIP Press Kit annidati.' }, affectedHref: '/press-kit/releases/git-hosted-press-distribution-3-9-0-beta-38' },
  { id: 'resource-navigation-retrieval-diagnostics-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Resource Navigation and Retrieval Diagnostics published', it: 'Pubblicate navigazione risorse e diagnostica retrieval' }, detail: { en: 'The public footer now groups its complete destination set while protected scans and renderer readiness expose bounded acquisition diagnostics.', it: 'Il footer pubblico ora raggruppa il set completo di destinazioni, mentre scansioni protette e readiness del renderer espongono diagnostica limitata delle acquisizioni.' }, affectedHref: '/press-kit/releases/resource-navigation-retrieval-diagnostics-3-9-0-beta-37' },
  { id: 'remediation-community-mutation-hardening-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Remediation UX, Community Signals and Mutation Hardening published', it: 'Pubblicati UX remediation, segnali community e hardening mutazioni' }, detail: { en: 'Three roadmap waves add an action-oriented remediation workbench, browser-local signal composer and centralized administrative mutation boundary.', it: 'Tre wave della roadmap aggiungono un workbench remediation orientato all azione, un composer locale nel browser e un confine centralizzato per le mutazioni amministrative.' }, affectedHref: '/press-kit/releases/remediation-community-mutation-hardening-3-9-0-beta-36' },
  { id: 'community-signal-composer-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Community Signal Composer UX published', it: 'Pubblicata la UX del Composer segnali community' }, detail: { en: 'Roadmap interest can now become a bounded local dossier before explicit GitHub handoff.', it: 'L interesse per la roadmap puo ora diventare un dossier locale limitato prima dell handoff GitHub esplicito.' }, affectedHref: '/press-kit/releases/community-signal-composer-3-9-0-beta-35' },
  { id: 'source-remediation-workbench-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Source Remediation Workbench UX published', it: 'Pubblicata la UX del Workbench remediation fonti' }, detail: { en: 'Protected source operations now connect returned-window priority, bounded evidence and recovery-gated closure.', it: 'Le operazioni protette sulle fonti ora collegano priorita della finestra restituita, evidenze limitate e chiusura vincolata al recupero.' }, affectedHref: '/press-kit/releases/source-remediation-workbench-3-9-0-beta-34' },
  { id: 'production-assurance-renderer-hardening-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Production Assurance and Renderer Hardening published', it: 'Pubblicati assurance di produzione e hardening del renderer' }, detail: { en: 'Three roadmap waves add residency evidence, authenticated deployment verification and fail-closed renderer controls.', it: 'Tre wave della roadmap aggiungono evidenze di residenza, verifica autenticata del deployment e controlli fail-closed del renderer.' }, affectedHref: '/press-kit/releases/production-assurance-renderer-hardening-3-9-0-beta-33' },
  { id: 'authenticated-production-verification-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Authenticated Production Verification published', it: 'Pubblicata la verifica autenticata della produzione' }, detail: { en: 'Admin and Auditor can inspect one sanitized post-deploy report while independent testing remains external evidence.', it: 'Admin e Auditor possono ispezionare un report post-deploy sanificato mentre i test indipendenti restano evidenza esterna.' }, affectedHref: '/press-kit/releases/authenticated-production-verification-3-9-0-beta-32' },
  { id: 'residency-processor-evidence-release', occurredAt: '2026-08-02', type: 'release', title: { en: 'Residency and Processor Evidence published', it: 'Pubblicate le evidenze di residenza e processor' }, detail: { en: 'A dated public register separates documentary evidence, operator declarations, deployment-dependent facts and open gaps.', it: 'Un registro pubblico datato separa evidenze documentali, dichiarazioni operatore, fatti dipendenti dal deployment e gap aperti.' }, affectedHref: '/press-kit/releases/residency-processor-evidence-3-9-0-beta-31' },
  { id: 'enterprise-agent-contract-evidence-release', occurredAt: '2026-08-01', type: 'release', title: { en: 'Enterprise Agent and Contract Evidence Integration published', it: 'Pubblicata l integrazione agent enterprise ed evidenze contrattuali' }, detail: { en: 'The public agent gateway, three provider source packages and the Word evidence-mapping task pane now share one bounded public-evidence contract.', it: 'Il gateway agent pubblico, tre pacchetti sorgente provider e il task pane Word per la mappatura delle evidenze ora condividono un unico contratto circoscritto di evidenze pubbliche.' }, affectedHref: '/press-kit/releases/enterprise-agent-contract-evidence-3-9-0-beta-30' },
  { id: 'multicloud-agent-source-packages-release', occurredAt: '2026-08-01', type: 'release', title: { en: 'Multicloud agent source packages published', it: 'Pubblicati i pacchetti sorgente agent multicloud' }, detail: { en: 'Controlled-pilot source packages are available for Microsoft 365 Copilot, Vertex AI Agent Builder and Amazon Quick, with Amazon Q Business retained only for existing-customer compatibility.', it: 'Sono disponibili pacchetti sorgente per pilot controllati con Microsoft 365 Copilot, Vertex AI Agent Builder e Amazon Quick; Amazon Q Business resta solo per compatibilita con clienti esistenti.' }, affectedHref: '/press-kit/releases/multicloud-agent-source-packages-3-9-0-beta-29' },
  { id: 'agent-evidence-gateway-release', occurredAt: '2026-08-01', type: 'release', title: { en: 'Agent Evidence Gateway published', it: 'Pubblicato l Agent Evidence Gateway' }, detail: { en: 'Three deterministic read-only operations expose bounded change and Observatory briefs with citations and explicit empty-result semantics.', it: 'Tre operazioni deterministiche in sola lettura espongono brief circoscritti su cambiamenti e Observatory, con citazioni e semantica esplicita dei risultati vuoti.' }, affectedHref: '/press-kit/releases/agent-evidence-gateway-3-9-0-beta-28' },
  { id: 'admin-operational-readiness-release', occurredAt: '2026-08-01', type: 'release', title: { en: 'Admin Operational Readiness published', it: 'Pubblicata la readiness operativa amministrativa' }, detail: { en: 'The protected dashboard now connects deterministic priorities, publication readiness, independent live status, role-safe actions and bounded measurement with explicit unavailable states.', it: 'La dashboard protetta ora collega priorita deterministiche, readiness di pubblicazione, live status indipendenti, azioni role-safe e misurazione circoscritta con stati unavailable espliciti.' }, affectedHref: '/press-kit/releases/admin-operational-readiness-3-9-0-beta-27' },
  { id: 'crawlable-public-knowledge-layer-release', occurredAt: '2026-07-31', type: 'release', title: { en: 'Crawlable Public Knowledge Layer published', it: 'Pubblicata la Knowledge Layer pubblica indicizzabile' }, detail: { en: 'Evidence-gated company and policy references are now available in initial server-rendered HTML with canonical routes, citations and machine discovery files.', it: 'I riferimenti ad aziende e policy ammessi dai gate di evidenza sono ora disponibili nell HTML iniziale renderizzato sul server, con route canoniche, citazioni e file di discovery machine-readable.' }, affectedHref: '/press-kit/releases/crawlable-public-knowledge-layer-3-9-0-beta-26' },
  { id: 'admin-shell-readability-release', occurredAt: '2026-07-30', type: 'release', title: { en: 'Admin Shell Readability published', it: 'Pubblicata la leggibilita della shell amministrativa' }, detail: { en: 'The protected administrative shell now exposes role, current route, structural active state, keyboard entry and accessible verification states consistently.', it: 'La shell amministrativa protetta ora espone in modo coerente ruolo, percorso corrente, stato attivo strutturale, accesso da tastiera e stati di verifica accessibili.' }, affectedHref: '/press-kit/releases/admin-shell-readability-3-9-0-beta-25' },
  { id: 'webhook-operations-ux-release', occurredAt: '2026-07-30', type: 'release', title: { en: 'Webhook Operations UX published', it: 'Pubblicata la UX delle operazioni webhook' }, detail: { en: 'The protected webhook console now derives one bounded operational focus and provides local status and identifier filtering with explicit mobile and auditor states.', it: 'La console webhook protetta ora deriva una priorita operativa circoscritta e offre filtri locali per stato e identificatore con stati mobile e auditor espliciti.' }, affectedHref: '/press-kit/releases/webhook-operations-ux-3-9-0-beta-24' },
  { id: 'configured-webhook-delivery-release', occurredAt: '2026-07-30', type: 'release', title: { en: 'Configured Webhook Delivery Pilot published', it: 'Pubblicato il pilot di consegna webhook configurata' }, detail: { en: 'Deployment operators can configure signed delivery of eligible public change events through a persistent outbox, bounded retries and a protected operational ledger.', it: 'Gli operatori del deployment possono configurare la consegna firmata degli eventi pubblici idonei tramite outbox persistente, retry circoscritti e registro operativo protetto.' }, affectedHref: '/press-kit/releases/configured-webhook-delivery-pilot-3-9-0-beta-23' },
  { id: 'event-feed-continuity-release', occurredAt: '2026-07-30', type: 'release', title: { en: 'Event Feed Continuity published', it: 'Pubblicata la continuita del feed eventi' }, detail: { en: 'Developers can now inspect bounded polling windows, save or import a strict browser-local checkpoint and explicitly resume while retaining observable continuity findings.', it: 'Gli sviluppatori possono ora ispezionare finestre di polling circoscritte, salvare o importare un checkpoint rigoroso locale nel browser e riprendere esplicitamente mantenendo i rilievi osservabili sulla continuita.' }, affectedHref: '/press-kit/releases/event-feed-continuity-3-9-0-beta-22' },
  { id: 'source-reliability-receiver-conformance-release', occurredAt: '2026-07-30', type: 'release', title: { en: 'Source Reliability and Receiver Conformance published', it: 'Pubblicate affidabilita delle fonti e conformita receiver' }, detail: { en: 'Scan and retrieval state is now persisted for protected operations, exact source-supported baselines can be repaired safely, and developers can run the complete deterministic receiver fixture set.', it: 'Lo stato di scansioni e retrieval e ora persistito per le operazioni protette, le baseline supportate da evidenza esatta possono essere riparate in sicurezza e gli sviluppatori possono eseguire l insieme completo di fixture receiver deterministiche.' }, affectedHref: '/press-kit/releases/source-reliability-receiver-conformance-3-9-0-beta-21' },
  { id: 'webhook-verification-readiness-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Webhook Verification Readiness published', it: 'Pubblicata la preparazione alla verifica webhook' }, detail: { en: 'A browser-local workbench and versioned public kit now define and test the candidate HMAC-SHA256 receiver contract without enabling outbound delivery.', it: 'Un workbench locale nel browser e un kit pubblico versionato ora definiscono e verificano il contratto receiver HMAC-SHA256 candidato senza abilitare la consegna outbound.' }, affectedHref: '/press-kit/releases/webhook-verification-readiness-3-9-0-beta-20' },
  { id: 'collaboration-delivery-contracts-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Collaboration Delivery Contracts published', it: 'Pubblicati i contratti di collaborazione e distribuzione' }, detail: { en: 'Evidence Collections now provides a deterministic review handoff and the public API provides a bounded forward-polling change-event feed.', it: 'Evidence Collections ora fornisce un handoff deterministico per la revisione e l API pubblica offre un feed eventi circoscritto con polling forward.' }, affectedHref: '/press-kit/releases/collaboration-delivery-contracts-3-9-0-beta-19' },
  { id: 'evidence-workflow-refinements-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Evidence Workflow Refinements published', it: 'Pubblicati gli affinamenti del flusso evidenze' }, detail: { en: 'Collections, Evidence Packets, Developers and Integrations now use an evidence-first hierarchy, actionable-state controls, compact mobile navigation and consistent service-page footers.', it: 'Collections, Evidence Packets, Developers e Integrations ora usano una gerarchia evidence-first, controlli legati allo stato utilizzabile, navigazione mobile compatta e footer coerenti per le pagine di servizio.' }, affectedHref: '/press-kit/releases/evidence-workflow-refinements-3-9-0-beta-18' },
  { id: 'shareable-evidence-collections-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Shareable Evidence Collections published', it: 'Pubblicate le collezioni di evidenze condivisibili' }, detail: { en: 'Up to 12 exact public changes can now be selected locally, shared through an ID-only link and exported as deterministic JSON, Markdown or CSV with provenance and review boundaries.', it: 'Fino a 12 cambiamenti pubblici esatti possono ora essere selezionati localmente, condivisi tramite un link contenente solo ID ed esportati come JSON, Markdown o CSV deterministici con provenienza e limiti di revisione.' }, affectedHref: '/press-kit/releases/shareable-evidence-collections-3-9-0-beta-17' },
  { id: 'evidence-governance-packets-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Evidence Governance Packets published', it: 'Pubblicati i pacchetti di governance delle evidenze' }, detail: { en: 'Public changes can now expose sanitized source-confidence state, exact snapshot fingerprints, verified source passages, advisory framework relevance and change-bound PDF/JSON reports.', it: 'I cambiamenti pubblici possono ora esporre stato source-confidence sanificato, impronte snapshot esatte, passaggi fonte verificati, rilevanza framework consultiva e report PDF/JSON legati al change.' }, affectedHref: '/press-kit/releases/evidence-governance-packets-3-9-0-beta-16' },
  { id: 'citable-coverage-registry-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Citable Coverage Registry published', it: 'Pubblicato il registro citabile della copertura' }, detail: { en: 'External references now use stable IDs, derived totals, explicit relationship boundaries, reusable citations and JSON/CSV distributions.', it: 'I riferimenti esterni ora usano ID stabili, totali derivati, limiti espliciti della relazione, citazioni riutilizzabili e distribuzioni JSON/CSV.' }, affectedHref: '/press-kit/releases/citable-coverage-registry-3-9-0-beta-15' },
  { id: 'press-outreach-operations-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Press Outreach Operations published', it: 'Pubblicate le operazioni di contatto stampa' }, detail: { en: 'The protected Outreach Desk operates five reviewed campaign cohorts and records bounded aggregate outcome events without recipient histories or conversion rates.', it: 'Il Press Outreach Desk protetto gestisce cinque coorti revisionate e registra eventi di esito aggregati e circoscritti senza cronologie dei destinatari o tassi di conversione.' }, affectedHref: '/press-kit/releases/press-outreach-operations-3-9-0-beta-14' },
  { id: 'editorial-pulse-release', occurredAt: '2026-07-29', type: 'release', title: { en: 'Editorial Pulse and Distribution published', it: 'Pubblicati Editorial Pulse e distribuzione' }, detail: { en: 'Verified story leads now include deterministic Story Packs, social-card formats, embeds, citations and aggregate reuse-event measurement.', it: 'I lead verificati ora includono Story Pack deterministici, formati social, embed, citazioni e misurazione aggregata degli eventi di riuso.' }, affectedHref: '/press-kit/releases/editorial-pulse-distribution-3-9-0-beta-13' },
  { id: 'local-mime-evidence-intake-release', occurredAt: '2026-07-28', type: 'release', title: { en: 'Local MIME Evidence Intake published', it: 'Pubblicato Intake locale MIME delle evidenze' }, detail: { en: 'The What Changed workflow now decodes bounded .eml files locally while excluding recipients and attachments from extracted clues.', it: 'Il flusso Cosa e cambiato ora decodifica localmente file .eml limitati, escludendo destinatari e allegati dagli indizi estratti.' }, affectedHref: '/press-kit/releases/local-mime-evidence-intake-3-9-0-beta-12' },
  { id: 'evidence-delivery-integration-release', occurredAt: '2026-07-28', type: 'release', title: { en: 'Evidence Delivery & Integration published', it: 'Pubblicata Distribuzione evidenze e integrazione' }, detail: { en: 'The public Developer directory now documents a read-only v1 manifest and localized Observatory registry endpoint with their stated source boundaries.', it: 'Il catalogo pubblico per sviluppatori ora documenta un manifest v1 in sola lettura e l endpoint localizzato del registro Osservatorio con i relativi limiti delle fonti.' }, affectedHref: '/press-kit/releases/evidence-delivery-integration-3-9-0-beta-11' },
  { id: 'source-continuity-ledger-release', occurredAt: '2026-07-28', type: 'release', title: { en: 'Source Continuity Ledger published', it: 'Pubblicato il Source Continuity Ledger' }, detail: { en: 'The public Timeline now separates provider policy changes from sanitized retrieval and publication-state transitions.', it: 'La Timeline pubblica ora separa i cambiamenti delle policy provider dalle transizioni sanificate di retrieval e stato di pubblicazione.' }, affectedHref: '/press-kit/releases/source-continuity-ledger-3-9-0-beta-10' },
  { id: 'verified-browser-distribution-release', occurredAt: '2026-07-27', type: 'release', title: { en: 'Chrome distribution verified', it: 'Distribuzione Chrome verificata' }, detail: { en: 'The public Browser Extension page now links the verified Chrome Web Store listing and keeps Edge and Safari availability states separate.', it: 'La pagina pubblica Browser Extension ora collega la scheda verificata del Chrome Web Store e mantiene separati gli stati di disponibilita di Edge e Safari.' }, affectedHref: '/press-kit/releases/verified-browser-distribution-3-9-0-beta-9' },
  { id: 'assistant-entry-point-consolidation-release', occurredAt: '2026-07-27', type: 'release', title: { en: 'Assistant entry point consolidated', it: 'Accesso all assistente consolidato' }, detail: { en: 'The legacy floating dashboard trigger was removed while unified navigation, Workspace Controls and command search retain access to the same assistant.', it: 'Il precedente trigger flottante della dashboard e stato rimosso, mentre navigazione unificata, Workspace Controls e ricerca comandi mantengono l accesso allo stesso assistente.' }, affectedHref: '/press-kit/releases/assistant-entry-point-consolidation-3-9-0-beta-8' },
  { id: 'newsroom-measurement-release', occurredAt: '2026-07-27', type: 'release', title: { en: 'Newsroom measurement and release assurance published', it: 'Pubblicati misurazione newsroom e assurance della release' }, detail: { en: 'The newsroom records allowlisted aggregate events without persistent visitor identifiers and states the interpretation boundary alongside the current release.', it: 'La newsroom registra eventi aggregati ammessi senza identificatori persistenti dei visitatori e indica il limite interpretativo insieme alla release corrente.' }, affectedHref: '/press-kit/releases/release-assurance-newsroom-insights-3-9-0-beta-7' },
  { id: 'inventory-scope-clarification', occurredAt: '2026-07-27', type: 'clarification', title: { en: 'Monitored inventory scope clarified', it: 'Perimetro inventario monitorato chiarito' }, detail: { en: 'The 16-company fact now states that the WAZE record is an admin-onboarding fixture and is excluded from the monitored inventory count.', it: 'Il dato di 16 aziende ora specifica che il record WAZE e una fixture di onboarding amministrativo ed e escluso dal conteggio dell inventario monitorato.' }, affectedHref: '/press-kit#fact-monitored-companies' },
  { id: 'asset-rights-and-metadata', occurredAt: '2026-07-27', type: 'methodology', title: { en: 'Asset rights and metadata separated', it: 'Diritti e metadati asset separati' }, detail: { en: 'Owned editorial asset terms, IPTC/XMP metadata and the Content Credentials boundary are now recorded separately from repository licensing.', it: 'Condizioni per asset editoriali proprietari, metadati IPTC/XMP e limite delle Content Credentials sono ora registrati separatamente dalla licenza del repository.' }, affectedHref: '/press-kit#media-assets' },
  { id: 'evidence-newsroom-release', occurredAt: '2026-07-27', type: 'release', title: { en: 'Evidence Newsroom registry created', it: 'Creato il registro Evidence Newsroom' }, detail: { en: 'The public registry begins with dated release, claim, package, data and correction records. It does not assert exhaustive history before this date.', it: 'Il registro pubblico inizia con record datati per release, claim, pacchetti, dati e correzioni. Non dichiara una cronologia esaustiva precedente a questa data.' }, affectedHref: '/press-kit/releases/evidence-newsroom-3-9-0-beta-6' },
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
