/**
 * PolicyWatcher - Main Dashboard Page
 *
 * @file src/app/page.tsx
 *
 * Client-side rendered root page (`'use client'`). Displays the full
 * monitoring dashboard: statistics bar, filter controls (search, industry,
 * region, perspective, risk level, date range, sort), a responsive grid of
 * company cards, and a suite of modals (policy details, AI chat, KPI matrix,
 * compare, subscribe, methodology, changelog, about, how-to).
 *
 * Data is fetched from `/api/companies` on mount and refreshed after
 * on-demand scrape operations.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  ShieldAlert, 
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Calendar,
  Clock,
  PauseCircle,
  UserRound,
  Scale,
  FlaskConical,
  PlugZap,
  RotateCcw,
  Layers3,
  GitFork,
  ShieldCheck,
  BarChart3,
  Route,
  Newspaper,
  Sparkles,
  BookOpen,
  Check,
} from 'lucide-react';
import styles from './Dashboard.module.css';
import PolicyDetails from '@/components/PolicyDetails';
import LiveAssistant from '@/components/LiveAssistant';
import SubscribeModal from '@/components/SubscribeModal';
import AboutModal from '@/components/AboutModal';
import ChangelogModal from '@/components/ChangelogModal';
import MethodologyModal from '@/components/MethodologyModal';
import CrossCompanyMatrix from '@/components/CrossCompanyMatrix';
import CommandPalette from '@/components/CommandPalette';
import CompareModal from '@/components/CompareModal';
import TermsGate from '@/components/TermsGate';
import CardRiskReasons from '@/components/ai/CardRiskReasons';
import { SkeletonGrid, SkeletonStatsGrid } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Footer';
import HowToModal from '@/components/HowToModal';
import Navigation, { NavLayout } from '@/components/Navigation';
import { createDeferredViewportEvaluator, shouldSuggestOnTheGo } from '@/lib/mobileContext';
import { dashboardUpdateNotices, getObservatorySource, observatorySignals } from '@/lib/observatory';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import { dataStatusClassKey, getWorstDataStatus, normalizeDataStatus } from '@/lib/policyConfidence';
import {
  composeDashboard,
  getDashboardModuleOrder,
  isDashboardModuleVisible,
  normalizeEvidenceDepth,
  normalizeWorkspaceIntent,
  type DashboardAccent,
  type DashboardDensity,
  type DashboardModuleId,
  type DashboardView,
  type EvidenceDepth,
  type WorkspaceIntent,
} from '@/lib/dashboardComposer';

// Re-export types for backward compatibility
export type { Company, Policy, PolicyChange, RegionImpact } from '@/types/index';
import type { Company } from '@/types/index';

/** Bilingual UI string dictionary, keyed by language code. */
const translations = {
  it: {
    title: 'PolicyWatcher',
    subtitle: 'AI Policy Change Monitor',
    liveAssistant: 'Policy Live Assistant',
    monitoredCompanies: 'Compagnie Monitorate',
    criticalAlerts: 'Allerte Critiche',
    avgRiskScore: 'Rischio Medio',
    activeContext: 'Filtro Contesto Attivo',
    searchPlaceholder: 'Cerca compagnia, policy o termini...',
    allSectors: 'Tutti i Settori',
    techGiants: 'Tech Giants',
    fintech: 'FinTech',
    socialMedia: 'Social Media',
    ecommerce: 'E-Commerce',
    aiProvider: 'Provider AI',
    cloudSaas: 'Cloud/SaaS',
    individual: 'Privato',
    enterprise: 'Azienda',
    updated: 'Aggiornato',
    viewAnalysis: 'Vedi Analisi',
    noResults: 'Nessun record source-verified pubblico disponibile. I record seed restano nascosti finche non viene completata una scansione reale.',
    loading: 'Caricamento dati...',
    policiesList: 'Policies disponibili:',
    privacy: 'Privacy',
    terms: 'Servizi',
    developer: 'Sviluppatori',
    ai: 'Norme AI',
    exportCSV: 'Esporta CSV',
    exportPDF: 'Esporta PDF',
    subscribe: 'Iscriviti Notifiche',
    about: 'Info',
    methodology: 'Metodologia',
    howTo: 'Come Usarlo',
    timeline: 'Timeline',
    showcase: 'Vetrina',
    marketPulseTitle: 'Market Pulse',
    marketPulseSubtitle: 'Ultime modifiche ordinate nel tempo, filtrate per settore.',
    openFullTimeline: 'Apri timeline completa',
    noMarketPulse: 'Nessuna modifica source-verified pubblicabile per questo filtro.',
    suspendedSourcesTitle: 'Sorgenti temporaneamente sospese',
    suspendedSourcesLead: 'Sono state identificate anomalie nell\'ultimo fetching o aggiornamento. Le sorgenti sotto riportate non espongono dati pubblici finche non vengono verificate.',
    suspendedSourcesCount: 'sorgenti sospese',
    suspendedSourceStatus: 'Stato',
    suspendedSourceReason: 'Motivo',
    suspendedSourceLastCheck: 'Ultimo check',
    sourceBaseline: 'Baseline sorgente',
    sourceVerified: 'Sorgente verificata',
    baselineRegistered: 'Baseline sorgente verificata. Nessuna modifica pubblicabile rilevata da quando il monitoraggio reale e stato avviato.',
    noPolicyEvidence: 'Nessuna evidenza sorgente pubblicabile ancora disponibile.',
    sortByRisk: 'Rischio',
    sortByDate: 'Data',
    sortByName: 'Nome',
    allRisks: 'Tutti i Rischi',
    highRisk: 'Alto',
    mediumRisk: 'Medio',
    lowRisk: 'Basso',
    last7d: '7gg',
    last30d: '30gg',
    last90d: '90gg',
    allTime: 'Tutto',
    clearFilters: 'Pulisci Filtri',
    activeFilters: 'filtri attivi',
    workspaceLabel: 'Impostazioni dashboard',
    workspaceTitle: 'Vista operativa personalizzabile',
    workspaceSubtitle: 'Densità, sezioni e accento visuale restano salvati in questo browser.',
    tickerLabel: 'Ticker Observatory',
    tickerPause: 'Pausa su hover o focus',
    onTheGoTitle: 'Profilo di lettura mobile opzionale',
    onTheGoBody: 'Su desktop il workspace completo resta disponibile. Su mobile puoi scegliere Cittadino / Snapshot come profilo di lettura opzionale.',
    onTheGoAction: 'Usa lettura mobile',
    onTheGoActive: 'Lettura mobile attiva',
    onTheGoDismiss: 'Mantieni vista',
    densityLabel: 'Densità',
    comfortable: 'Comfort',
    compact: 'Compatta',
    viewLabel: 'Vista',
    cardView: 'Cards',
    focusView: 'Focus',
    sectionsLabel: 'Sezioni',
    showStats: 'Mostra KPI',
    hideStats: 'Nascondi KPI',
    showPulse: 'Mostra Pulse',
    hidePulse: 'Nascondi Pulse',
    accentLabel: 'Accento',
    accentIndigo: 'Indigo',
    accentTeal: 'Teal',
    accentSlate: 'Slate',
    exploreKicker: `Mappa release v${POLICYWATCHER_VERSION}`,
    exploreTitle: 'Tutte le nuove superfici, in un unico punto.',
    exploreLead: 'Adaptive Workspace, Observatory, sitemap interattiva, press wall, segnali policy, trust center e roadmap sono ora organizzati come percorsi di esplorazione.',
    exploreAtlas: 'Apri sitemap completa',
    exploreFeature: `Stabile in ${POLICYWATCHER_VERSION}`,
    exploreOpen: 'Apri',
    exploreCards: [
      {
        title: 'Cosa è cambiato?',
        href: '/what-changed',
        category: 'Evidenza cittadino',
        body: 'Verifica una mail sulle nuove condizioni o richiedi una revisione umana tracciata.',
      },
      {
        title: 'Atlante del sito',
        href: '/atlas',
        category: 'Navigazione',
        body: 'Grafo interattivo e lista completa delle pagine pubbliche, con collegamenti diretti.',
      },
      {
        title: 'Observatory',
        href: '/observatory',
        category: 'Fonti',
        body: 'Registro curato di fonti AI governance, privacy enforcement, standard ed eventi.',
      },
      {
        title: 'Vetrina progetto',
        href: '/showcase',
        category: 'Overview',
        body: 'Presentazione estesa di piattaforma, workflow, controlli admin e valore informativo.',
      },
      {
        title: 'Visual Guide',
        href: '/infographics',
        category: 'Esperienza',
        body: 'Infografiche interattive su workspace adattivo, categorie e logica delle sezioni.',
      },
      {
        title: 'Segnali Policy',
        href: '/leaderboard',
        category: 'Evidenza',
        body: 'Confronto tra aziende basato su copertura, freschezza e tracciabilita delle fonti.',
      },
      {
        title: 'Trust & Quality',
        href: '/trust',
        category: 'Assurance',
        body: 'Stato dei controlli di qualita, sicurezza, build e dataset QA.',
      },
      {
        title: 'Metodologia',
        href: '/methodology/confidence',
        category: 'Metodo',
        body: 'Provenienza, limiti dell’analisi AI, gate pubblico e processo di verifica.',
      },
      {
        title: 'Press Wall',
        href: '/press',
        category: 'Community',
        body: 'Raccolta ordinata dei contributi pubblici e delle citazioni sul progetto.',
      },
      {
        title: 'Roadmap Community',
        href: '/roadmap',
        category: 'Evolutive',
        body: 'Funzioni in pista, idee future e direzioni UX su cui raccogliere feedback.',
      },
    ],
  },
  en: {
    title: 'PolicyWatcher',
    subtitle: 'AI Policy Change Monitor',
    liveAssistant: 'Policy Live Assistant',
    monitoredCompanies: 'Monitored Companies',
    criticalAlerts: 'Critical Alerts',
    avgRiskScore: 'Avg Risk Score',
    activeContext: 'Active Context Filter',
    searchPlaceholder: 'Search company, policy or terms...',
    allSectors: 'All Sectors',
    techGiants: 'Tech Giants',
    fintech: 'FinTech',
    socialMedia: 'Social Media',
    ecommerce: 'E-Commerce',
    aiProvider: 'AI Provider',
    cloudSaas: 'Cloud/SaaS',
    individual: 'Individual',
    enterprise: 'Enterprise',
    updated: 'Updated',
    viewAnalysis: 'View Analysis',
    noResults: 'No source-verified public records are available. Seed records remain hidden until a real scan completes.',
    loading: 'Loading dashboard data...',
    policiesList: 'Available policies:',
    privacy: 'Privacy',
    terms: 'Terms',
    developer: 'Developer',
    ai: 'AI Terms',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
    subscribe: 'Subscribe to Alerts',
    about: 'About',
    methodology: 'Methodology',
    howTo: 'How To',
    timeline: 'Timeline',
    showcase: 'Showcase',
    marketPulseTitle: 'Market Pulse',
    marketPulseSubtitle: 'Recent policy movements ordered over time and filtered by sector.',
    openFullTimeline: 'Open full timeline',
    noMarketPulse: 'No source-verified publishable changes are available for this filter.',
    suspendedSourcesTitle: 'Temporarily Suspended Sources',
    suspendedSourcesLead: 'Anomalies were identified during the latest fetching or update cycle. The sources below do not expose public data until verified.',
    suspendedSourcesCount: 'suspended sources',
    suspendedSourceStatus: 'Status',
    suspendedSourceReason: 'Reason',
    suspendedSourceLastCheck: 'Last check',
    sourceBaseline: 'Source baseline',
    sourceVerified: 'Source verified',
    baselineRegistered: 'Source baseline verified. No publishable change has been detected since real monitoring started.',
    noPolicyEvidence: 'No publishable source evidence is available yet.',
    sortByRisk: 'Risk',
    sortByDate: 'Date',
    sortByName: 'Name',
    allRisks: 'All Risks',
    highRisk: 'High',
    mediumRisk: 'Medium',
    lowRisk: 'Low',
    last7d: '7d',
    last30d: '30d',
    last90d: '90d',
    allTime: 'All',
    clearFilters: 'Clear Filters',
    activeFilters: 'active filters',
    workspaceLabel: 'Dashboard setup',
    workspaceTitle: 'Personalized operating view',
    workspaceSubtitle: 'Density, sections and visual accent are saved on this browser.',
    tickerLabel: 'Observatory ticker',
    tickerPause: 'Pauses on hover or focus',
    onTheGoTitle: 'Optional mobile reading profile',
    onTheGoBody: 'Desktop keeps the full workspace. On mobile, you can choose Citizen / Snapshot as an optional reading profile.',
    onTheGoAction: 'Use reading mode',
    onTheGoActive: 'Reading mode active',
    onTheGoDismiss: 'Keep current view',
    densityLabel: 'Density',
    comfortable: 'Comfort',
    compact: 'Compact',
    viewLabel: 'View',
    cardView: 'Cards',
    focusView: 'Focus',
    sectionsLabel: 'Sections',
    showStats: 'Show KPI',
    hideStats: 'Hide KPI',
    showPulse: 'Show Pulse',
    hidePulse: 'Hide Pulse',
    accentLabel: 'Accent',
    accentIndigo: 'Indigo',
    accentTeal: 'Teal',
    accentSlate: 'Slate',
    exploreKicker: `v${POLICYWATCHER_VERSION} release map`,
    exploreTitle: 'Every new surface, one clear entry point.',
    exploreLead: 'Adaptive Workspace, Observatory, interactive sitemap, press wall, policy signals, trust center and roadmap are now organized as guided exploration paths.',
    exploreAtlas: 'Open full sitemap',
    exploreFeature: `Stable in ${POLICYWATCHER_VERSION}`,
    exploreOpen: 'Open',
    exploreCards: [
      {
        title: 'What changed?',
        href: '/what-changed',
        category: 'Citizen evidence',
        body: 'Check a policy-update email against verified public comparisons or request human review.',
      },
      {
        title: 'Site Atlas',
        href: '/atlas',
        category: 'Navigation',
        body: 'Interactive graph and complete public-page list with direct links.',
      },
      {
        title: 'Observatory',
        href: '/observatory',
        category: 'Sources',
        body: 'Curated source registry for AI governance, privacy enforcement, standards and event review.',
      },
      {
        title: 'Project Showcase',
        href: '/showcase',
        category: 'Overview',
        body: 'Extended presentation of the platform, workflows, admin controls and information value.',
      },
      {
        title: 'Visual Guide',
        href: '/infographics',
        category: 'Experience',
        body: 'Interactive infographics for adaptive workspace logic, categories and section behavior.',
      },
      {
        title: 'Policy Signals',
        href: '/leaderboard',
        category: 'Evidence',
        body: 'Company comparison based on coverage, freshness and source traceability.',
      },
      {
        title: 'Trust & Quality',
        href: '/trust',
        category: 'Assurance',
        body: 'Quality, security, build and Dataset QA status in one public trust surface.',
      },
      {
        title: 'Methodology',
        href: '/methodology/confidence',
        category: 'Method',
        body: 'Provenance, AI-analysis limits, public gate and verification process.',
      },
      {
        title: 'Press Wall',
        href: '/press',
        category: 'Community',
        body: 'Curated public references and professional-community discussion around the project.',
      },
      {
        title: 'Community Roadmap',
        href: '/roadmap',
        category: 'Evolution',
        body: 'Planned features, future ideas and UX directions open to community feedback.',
      },
    ],
  }
};

/** Sort direction options for the company grid. */
type SortBy = 'risk-desc' | 'risk-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
/** Quick-filter values for risk level. */
type RiskFilter = 'all' | 'High' | 'Medium' | 'Low';
/** Quick-filter values for the change recency date range. */
type DateRange = 'all' | '7d' | '30d' | '90d';
type TickerItem = {
  id: string;
  label: string;
  message: string;
  href: string;
  tone: 'teal' | 'indigo' | 'amber';
};

interface DashboardPreferences {
  density: DashboardDensity;
  view: DashboardView;
  accent: DashboardAccent;
  showStats: boolean;
  showMarketPulse: boolean;
}

const DASHBOARD_PREFS_KEY = 'policywatcher_dashboard_preferences_v1';
const WORKSPACE_PROFILE_KEY = 'pw_workspace_profile';

const WORKSPACE_INTENTS: Record<'en' | 'it', Array<{
  id: WorkspaceIntent;
  label: string;
  title: string;
  detail: string;
  accent: DashboardAccent;
  icon: typeof UserRound;
}>> = {
  en: [
    {
      id: 'citizen',
      label: 'Citizen',
      title: 'Understand what changed and why it matters',
      detail: 'Plain-language briefing, source status, affected rights, and region impact.',
      accent: 'teal',
      icon: UserRound,
    },
    {
      id: 'grc',
      label: 'GRC / Legal',
      title: 'Inspect evidence before using a signal',
      detail: 'QA state, retrieval evidence, review notes, KPI matrix, and source limitations.',
      accent: 'indigo',
      icon: Scale,
    },
    {
      id: 'research',
      label: 'Research',
      title: 'Compare market movement over time',
      detail: 'Timeline, market pulse, filters, sector comparison, and export paths.',
      accent: 'teal',
      icon: FlaskConical,
    },
    {
      id: 'builder',
      label: 'Builder',
      title: 'Connect PolicyWatcher to other systems',
      detail: 'Exports, public methodology, release artifacts, and integration-oriented views.',
      accent: 'slate',
      icon: PlugZap,
    },
  ],
  it: [
    {
      id: 'citizen',
      label: 'Cittadino',
      title: 'Capire cosa e cambiato e perche conta',
      detail: 'Briefing semplice, stato fonte, diritti impattati e lettura per regione.',
      accent: 'teal',
      icon: UserRound,
    },
    {
      id: 'grc',
      label: 'GRC / Legal',
      title: 'Ispezionare evidenze prima di usare un segnale',
      detail: 'Stato QA, recupero fonte, review notes, matrice KPI e limiti della sorgente.',
      accent: 'indigo',
      icon: Scale,
    },
    {
      id: 'research',
      label: 'Ricerca',
      title: 'Confrontare movimenti di mercato nel tempo',
      detail: 'Timeline, market pulse, filtri, confronto settori e percorsi di export.',
      accent: 'teal',
      icon: FlaskConical,
    },
    {
      id: 'builder',
      label: 'Builder',
      title: 'Collegare PolicyWatcher ad altri sistemi',
      detail: 'Export, metodologia pubblica, artefatti release e viste orientate alle integrazioni.',
      accent: 'slate',
      icon: PlugZap,
    },
  ],
};

const EVIDENCE_DEPTHS: Record<'en' | 'it', Array<{
  id: EvidenceDepth;
  label: string;
  detail: string;
}>> = {
  en: [
    {
      id: 'snapshot',
      label: 'Snapshot',
      detail: 'Low-noise orientation. Diagnostics stay visible only when they affect interpretation.',
    },
    {
      id: 'operational',
      label: 'Operational',
      detail: 'Repeat-use mode with filters, metadata, review context, and export-ready controls.',
    },
    {
      id: 'forensic',
      label: 'Forensic',
      detail: 'Audit-oriented mode exposing retrieval path, QA state, hashes, timestamps, and limitations.',
    },
  ],
  it: [
    {
      id: 'snapshot',
      label: 'Snapshot',
      detail: 'Orientamento rapido. I diagnostici restano visibili quando cambiano l\'interpretazione.',
    },
    {
      id: 'operational',
      label: 'Operativa',
      detail: 'Uso ricorrente con filtri, metadata, contesto review e controlli di export.',
    },
    {
      id: 'forensic',
      label: 'Forensic',
      detail: 'Vista audit con percorso recupero, stato QA, hash, timestamp e limitazioni.',
    },
  ],
};

const WORKSPACE_MODULE_LABELS: Record<'en' | 'it', Record<DashboardModuleId, string>> = {
  en: {
    sourceQuality: 'Source QA warnings',
    observatory: 'Observatory source watch',
    stats: 'Risk and coverage cards',
    filters: 'Search and context filters',
    marketPulse: 'Market pulse timeline',
    companyCards: 'Company evidence cards',
  },
  it: {
    sourceQuality: 'Avvisi QA sorgenti',
    observatory: 'Observatory fonti',
    stats: 'Card rischio e copertura',
    filters: 'Ricerca e filtri contesto',
    marketPulse: 'Timeline market pulse',
    companyCards: 'Card evidenze aziende',
  },
};

const WORKSPACE_COPY = {
  en: {
    label: 'Adaptive workspace',
    title: 'Start from the question, not from the dashboard',
    lead: 'Choose the purpose of the session and the depth of evidence you need. PolicyWatcher reorganizes density, priority, and context while source-quality warnings remain visible.',
    chooseIntent: '1. Choose the job',
    chooseDepth: '2. Choose evidence depth',
    generatedLogic: '3. Generated evidence stack',
    activeProfile: 'Active workspace',
    primaryModules: 'Primary evidence',
    supportingModules: 'Supporting evidence',
    noSupportingModules: 'None at this evidence depth.',
    sourcePinned: 'Source QA stays pinned and cannot be hidden.',
    firstUseLabel: 'Guided start',
    firstUseClose: 'Skip for now',
    defaultAction: 'Reset default',
    presetPrefix: 'Intent',
    depthPrefix: 'Depth',
    summaryTitle: 'Workspace active',
    changeAction: 'Change view',
    applyAction: 'Apply workspace',
    closeAction: 'Close',
    compactLead: 'Dashboard modules are arranged for this goal. Reopen the workspace setup when your session changes.',
  },
  it: {
    label: 'Workspace adattivo',
    title: 'Parti dalla domanda, non dalla dashboard',
    lead: 'Scegli lo scopo della sessione e la profondita delle evidenze. PolicyWatcher riorganizza densita, priorita e contesto mantenendo visibili gli avvisi sulla qualita delle fonti.',
    chooseIntent: '1. Scegli il lavoro',
    chooseDepth: '2. Scegli profondita evidenza',
    generatedLogic: '3. Stack evidenze generato',
    activeProfile: 'Workspace attivo',
    primaryModules: 'Evidenze primarie',
    supportingModules: 'Evidenze di supporto',
    noSupportingModules: 'Nessuna a questa profondita di evidenza.',
    sourcePinned: 'Il QA sorgenti resta fissato e non puo essere nascosto.',
    firstUseLabel: 'Avvio guidato',
    firstUseClose: 'Salta per ora',
    defaultAction: 'Reset default',
    presetPrefix: 'Intento',
    depthPrefix: 'Profondita',
    summaryTitle: 'Workspace attivo',
    changeAction: 'Cambia vista',
    applyAction: 'Usa workspace',
    closeAction: 'Chiudi',
    compactLead: 'I moduli della dashboard sono ordinati per questo obiettivo. Riapri la configurazione quando cambia la sessione.',
  },
};

interface MarketPulseChange {
  id: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  overallScore: number;
  tldrEn: string | null;
  tldrIt: string | null;
  aiSummaryEn: string | null;
  aiSummaryIt: string | null;
  createdAt: string;
  policy: {
    name: string;
    type: string;
    jurisdiction: string;
    company: {
      name: string;
      industry: string;
    };
  };
}

interface SourceSuspension {
  id: string;
  company: {
    name: string;
    industry: string;
  };
  policyName: string;
  jurisdiction: string;
  sourceHost: string | null;
  dataStatus: string;
  ingestionMethod: string;
  lastCheckDate: string;
  latestCheck?: {
    status?: string | null;
    source?: string | null;
    reason?: string | null;
    httpStatus?: number | null;
  } | null;
  suspensionReason: string;
  publicMessageEn: string;
  publicMessageIt: string;
}

/**
 * Root dashboard component.
 *
 * Manages all top-level UI state (companies list, filters, modal visibility,
 * language, region, perspective) and renders the full single-page dashboard.
 */
export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketPulseChanges, setMarketPulseChanges] = useState<MarketPulseChange[]>([]);
  const [marketPulseLoading, setMarketPulseLoading] = useState(true);
  const [sourceSuspensions, setSourceSuspensions] = useState<SourceSuspension[]>([]);
  const [sourceSuspensionsTotal, setSourceSuspensionsTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  
  // Bilingual state
  const [lang, setLang] = useState<'en' | 'it'>('en');

  // Multi-region and audience state filters
  const [selectedRegion, setSelectedRegion] = useState<'EU' | 'US' | 'Global'>('EU');
  const [selectedPerspective, setSelectedPerspective] = useState<'Individual' | 'Enterprise'>('Individual');

  // Advanced filters
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortBy, setSortBy] = useState<SortBy>('risk-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selected policy modal
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  
  // Modals
  const [chatOpen, setChatOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [, setExportMenuOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Compare modal
  const [compareOpen, setCompareOpen] = useState(false);

  // Interchangeable Navigation Layout (hud | spotlight | sidebar)
  const [navLayout, setNavLayout] = useState<NavLayout>('hud');

  const [prefsReady, setPrefsReady] = useState(false);
  const [dashboardDensity, setDashboardDensity] = useState<DashboardDensity>('comfortable');
  const [dashboardView, setDashboardView] = useState<DashboardView>('cards');
  const [dashboardAccent, setDashboardAccent] = useState<DashboardAccent>('indigo');
  const [showStats, setShowStats] = useState(true);
  const [showMarketPulse, setShowMarketPulse] = useState(true);
  const [workspaceIntent, setWorkspaceIntent] = useState<WorkspaceIntent>('citizen');
  const [evidenceDepth, setEvidenceDepth] = useState<EvidenceDepth>('snapshot');
  const [draftWorkspaceIntent, setDraftWorkspaceIntent] = useState<WorkspaceIntent>('citizen');
  const [draftEvidenceDepth, setDraftEvidenceDepth] = useState<EvidenceDepth>('snapshot');
  const [workspaceConfiguratorOpen, setWorkspaceConfiguratorOpen] = useState(false);
  const [workspaceFirstUseMode, setWorkspaceFirstUseMode] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [onTheGoSuggested, setOnTheGoSuggested] = useState(false);
  const [onTheGoMotionSuggested, setOnTheGoMotionSuggested] = useState(false);
  const [onTheGoDismissed, setOnTheGoDismissed] = useState(false);
  const [onTheGoModeActive, setOnTheGoModeActive] = useState(false);
  const composerDialogRef = useRef<HTMLDivElement>(null);
  const composerHeadingRef = useRef<HTMLHeadingElement>(null);
  const composerPreviousFocusRef = useRef<HTMLElement | null>(null);

  const t = translations[lang];
  const workspaceText = WORKSPACE_COPY[lang];
  const intentOptions = WORKSPACE_INTENTS[lang];
  const depthOptions = EVIDENCE_DEPTHS[lang];
  const moduleLabels = WORKSPACE_MODULE_LABELS[lang];
  const explorationIcons = [GitFork, Search, Sparkles, Layers3, BarChart3, ShieldCheck, BookOpen, Newspaper, Route];
  const activeIntent = useMemo(
    () => intentOptions.find((option) => option.id === workspaceIntent) ?? intentOptions[0],
    [intentOptions, workspaceIntent]
  );
  const activeDepth = useMemo(
    () => depthOptions.find((option) => option.id === evidenceDepth) ?? depthOptions[0],
    [depthOptions, evidenceDepth]
  );
  const draftIntent = useMemo(
    () => intentOptions.find((option) => option.id === draftWorkspaceIntent) ?? intentOptions[0],
    [draftWorkspaceIntent, intentOptions]
  );
  const draftDepth = useMemo(
    () => depthOptions.find((option) => option.id === draftEvidenceDepth) ?? depthOptions[0],
    [depthOptions, draftEvidenceDepth]
  );
  const workspaceSettings = useMemo(
    () => composeDashboard(workspaceIntent, evidenceDepth),
    [evidenceDepth, workspaceIntent]
  );
  const draftWorkspaceSettings = useMemo(
    () => composeDashboard(draftWorkspaceIntent, draftEvidenceDepth),
    [draftEvidenceDepth, draftWorkspaceIntent]
  );
  const workspaceHasDraftChanges = draftWorkspaceIntent !== workspaceIntent || draftEvidenceDepth !== evidenceDepth;
  const tickerItems = useMemo<TickerItem[]>(() => {
    const signalItems = observatorySignals.slice(0, 4).map((signal): TickerItem => {
      const source = getObservatorySource(signal.sourceId);
      const tone = signal.priority === 'high' ? 'teal' : signal.priority === 'medium' ? 'indigo' : 'amber';

      return {
        id: signal.id,
        label: `${source?.shortName ?? 'Observatory'} / ${signal.contentType}`,
        message: signal.title[lang],
        href: signal.localHref,
        tone,
      };
    });

    const noticeItems = dashboardUpdateNotices.map((notice): TickerItem => ({
      id: notice.id,
      label: notice.label[lang],
      message: notice.message[lang],
      href: notice.href,
      tone: notice.tone,
    }));

    return [...signalItems, ...noticeItems];
  }, [lang]);
  const tickerLoopItems = useMemo(() => [...tickerItems, ...tickerItems], [tickerItems]);
  const onTheGoProfileActive = onTheGoModeActive && workspaceIntent === 'citizen' && evidenceDepth === 'snapshot';
  const showOnTheGoPrompt = !onTheGoDismissed && (onTheGoSuggested || onTheGoMotionSuggested || onTheGoProfileActive);
  const getModuleOrder = useCallback(
    (moduleId: DashboardModuleId) => getDashboardModuleOrder(workspaceSettings, moduleId),
    [workspaceSettings]
  );
  const isModuleVisible = useCallback(
    (moduleId: DashboardModuleId) => isDashboardModuleVisible(workspaceSettings, moduleId),
    [workspaceSettings]
  );
  const closeWorkspaceComposer = useCallback(() => {
    setDraftWorkspaceIntent(workspaceIntent);
    setDraftEvidenceDepth(evidenceDepth);
    setWorkspaceConfiguratorOpen(false);
    setWorkspaceFirstUseMode(false);
  }, [evidenceDepth, workspaceIntent]);
  const applyWorkspaceComposer = useCallback(() => {
    setWorkspaceIntent(draftWorkspaceIntent);
    setEvidenceDepth(draftEvidenceDepth);
    if (draftWorkspaceIntent !== 'citizen' || draftEvidenceDepth !== 'snapshot') {
      setOnTheGoModeActive(false);
    }
    setWorkspaceConfiguratorOpen(false);
    setWorkspaceFirstUseMode(false);
  }, [draftEvidenceDepth, draftWorkspaceIntent]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesRes, suspensionsRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/source-suspensions'),
      ]);
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data);
      }
      if (suspensionsRes.ok) {
        const data = await suspensionsRes.json();
        setSourceSuspensions(data.sources || []);
        setSourceSuspensionsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCompanies();
    });
  }, [fetchCompanies]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (industryFilter !== 'all') params.set('industry', industryFilter);

    queueMicrotask(() => {
      if (!active) return;
      setMarketPulseLoading(true);
      fetch(`/api/changes?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Market pulse fetch failed'))))
        .then((data: { changes?: MarketPulseChange[] }) => {
          if (active) setMarketPulseChanges(data.changes || []);
        })
        .catch((error) => {
          console.error('Error loading market pulse:', error);
          if (active) setMarketPulseChanges([]);
        })
        .finally(() => {
          if (active) setMarketPulseLoading(false);
        });
    });

    return () => {
      active = false;
    };
  }, [industryFilter]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(DASHBOARD_PREFS_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<DashboardPreferences>;
          if (saved.density === 'comfortable' || saved.density === 'compact') {
            setDashboardDensity(saved.density);
          }
          if (saved.view === 'cards' || saved.view === 'focus') {
            setDashboardView(saved.view);
          }
          if (saved.accent === 'indigo' || saved.accent === 'teal' || saved.accent === 'slate') {
            setDashboardAccent(saved.accent);
          }
          if (typeof saved.showStats === 'boolean') {
            setShowStats(saved.showStats);
          }
          if (typeof saved.showMarketPulse === 'boolean') {
            setShowMarketPulse(saved.showMarketPulse);
          }
        }
      } catch {
        // Local preference storage is optional.
      } finally {
        setPrefsReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let nextIntent: WorkspaceIntent = 'citizen';
      let nextDepth: EvidenceDepth = 'snapshot';
      let nextOnTheGoModeActive = false;
      let shouldOpenFirstUse = true;

      try {
        const params = new URLSearchParams(window.location.search);
        const intentFromUrl = normalizeWorkspaceIntent(params.get('intent') || params.get('workspace'));
        const depthFromUrl = normalizeEvidenceDepth(params.get('depth'));
        const hasWorkspaceParams = params.has('intent') || params.has('workspace') || params.has('depth');
        const raw = localStorage.getItem(WORKSPACE_PROFILE_KEY);
        let saved: Partial<{ intent: string; depth: string; onTheGo: boolean }> | null = null;
        if (raw) {
          try {
            saved = JSON.parse(raw) as Partial<{ intent: string; depth: string; onTheGo: boolean }>;
          } catch {
            saved = null;
          }
        }

        if (hasWorkspaceParams) {
          shouldOpenFirstUse = false;
          nextIntent = intentFromUrl ?? nextIntent;
          nextDepth = depthFromUrl ?? nextDepth;
          nextOnTheGoModeActive = Boolean(saved?.onTheGo && nextIntent === 'citizen' && nextDepth === 'snapshot');
        } else {
          const savedIntent = normalizeWorkspaceIntent(saved?.intent ?? null);
          const savedDepth = normalizeEvidenceDepth(saved?.depth ?? null);
          if (savedIntent && savedDepth) {
            shouldOpenFirstUse = false;
            nextIntent = savedIntent;
            nextDepth = savedDepth;
            nextOnTheGoModeActive = Boolean(saved?.onTheGo && nextIntent === 'citizen' && nextDepth === 'snapshot');
          }
        }
      } catch {
        // Invalid URLs or storage contents fall back to the public default profile.
      } finally {
        setWorkspaceIntent(nextIntent);
        setEvidenceDepth(nextDepth);
        setDraftWorkspaceIntent(nextIntent);
        setDraftEvidenceDepth(nextDepth);
        setOnTheGoModeActive(nextOnTheGoModeActive);
        setWorkspaceConfiguratorOpen(shouldOpenFirstUse);
        setWorkspaceFirstUseMode(shouldOpenFirstUse);
        setWorkspaceReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!workspaceConfiguratorOpen || !workspaceFirstUseMode) return;

    composerPreviousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => composerHeadingRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWorkspaceComposer();
        return;
      }
      if (event.key !== 'Tab' || !composerDialogRef.current) return;

      const focusable = Array.from(
        composerDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (composerPreviousFocusRef.current && document.contains(composerPreviousFocusRef.current)) {
        composerPreviousFocusRef.current.focus();
      }
    };
  }, [closeWorkspaceComposer, workspaceConfiguratorOpen, workspaceFirstUseMode]);

  useEffect(() => {
    if (!workspaceReady) return;

    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      setDashboardDensity(workspaceSettings.density);
      setDashboardView(workspaceSettings.view);
      setDashboardAccent(workspaceSettings.accent);
      setShowStats(workspaceSettings.showStats);
      setShowMarketPulse(workspaceSettings.showMarketPulse);

      try {
        localStorage.setItem(WORKSPACE_PROFILE_KEY, JSON.stringify({
          intent: workspaceIntent,
          depth: evidenceDepth,
          onTheGo: onTheGoModeActive && workspaceIntent === 'citizen' && evidenceDepth === 'snapshot',
        }));

        const url = new URL(window.location.href);
        url.searchParams.set('intent', workspaceIntent);
        url.searchParams.set('depth', evidenceDepth);
        window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
      } catch {
        // URL/history and localStorage are optional in restricted browser modes.
      }
    });

    return () => {
      active = false;
    };
  }, [
    evidenceDepth,
    onTheGoModeActive,
    workspaceIntent,
    workspaceReady,
    workspaceSettings.accent,
    workspaceSettings.density,
    workspaceSettings.showMarketPulse,
    workspaceSettings.showStats,
    workspaceSettings.view,
  ]);

  useEffect(() => {
    if (!prefsReady) return;
    try {
      const nextPrefs: DashboardPreferences = {
        density: dashboardDensity,
        view: dashboardView,
        accent: dashboardAccent,
        showStats,
        showMarketPulse,
      };
      localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(nextPrefs));
    } catch {
      // Ignore storage errors in privacy modes.
    }
  }, [dashboardAccent, dashboardDensity, dashboardView, prefsReady, showMarketPulse, showStats]);

  useEffect(() => {
    let active = true;
    const smallScreenQuery = window.matchMedia('(max-width: 720px)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

    const updateContext = () => {
      if (!active) return;
      setOnTheGoSuggested(shouldSuggestOnTheGo({
        smallScreen: smallScreenQuery.matches,
        coarsePointer: coarsePointerQuery.matches,
        viewportWidth: window.innerWidth,
      }));
    };

    const listenToQuery = (query: MediaQueryList) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', updateContext);
        return () => query.removeEventListener('change', updateContext);
      }
      query.addListener(updateContext);
      return () => query.removeListener(updateContext);
    };

    updateContext();
    const removeSmallScreenListener = listenToQuery(smallScreenQuery);
    const removeCoarsePointerListener = listenToQuery(coarsePointerQuery);

    const orientationEvaluator = createDeferredViewportEvaluator(() => {
      if (!active) return;
      updateContext();
      setOnTheGoMotionSuggested(coarsePointerQuery.matches && window.innerWidth < 920);
    });
    const handleOrientation = () => orientationEvaluator.schedule();
    const orientation = window.screen.orientation;
    if (orientation && typeof orientation.addEventListener === 'function') {
      orientation.addEventListener('change', handleOrientation);
    } else {
      window.addEventListener('orientationchange', handleOrientation);
    }

    return () => {
      active = false;
      orientationEvaluator.cancel();
      removeSmallScreenListener();
      removeCoarsePointerListener();
      if (orientation && typeof orientation.removeEventListener === 'function') {
        orientation.removeEventListener('change', handleOrientation);
      } else {
        window.removeEventListener('orientationchange', handleOrientation);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K toggles the command palette (works even from inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && !e.metaKey) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(`.${styles.searchInput}`)?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedPolicyId(null);
        setChatOpen(false);
        setSubscribeOpen(false);
        setAboutOpen(false);
        setExportMenuOpen(false);
        setMatrixOpen(false);
        setMethodologyOpen(false);
        setCommandPaletteOpen(false);
        setCompareOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helpers used by the command palette
  const handleSelectCompany = useCallback((companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company && company.policies[0]) {
      setSelectedPolicyId(company.policies[0].id);
    }
  }, [companies]);


  // Date range cutoff
  /** Returns the Date cutoff based on the selected date-range filter, or null for 'all'. */
  const getDateCutoff = () => {
    if (dateRange === 'all') return null;
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  };

  // Filter + sort companies
  const filteredCompanies = companies
    .filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.policies.some((p) => 
          p.name.toLowerCase().includes(search.toLowerCase()) || 
          p.type.toLowerCase().includes(search.toLowerCase()) ||
          p.jurisdiction.toLowerCase().includes(search.toLowerCase())
        );
      const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
      
      // Risk filter
      if (riskFilter !== 'all') {
        const hasMatchingRisk = company.policies.some((p) => {
          const change = p.changes[0];
          if (!change) return false;
          return change.overallRisk === riskFilter;
        });
        if (!hasMatchingRisk) return false;
      }

      // Date range filter
      const dateCutoff = getDateCutoff();
      if (dateCutoff) {
        const hasRecentChange = company.policies.some((p) => {
          const change = p.changes[0];
          if (!change) return false;
          return new Date(change.createdAt) >= dateCutoff;
        });
        if (!hasRecentChange) return false;
      }

      return matchesSearch && matchesIndustry;
    })
    .sort((a, b) => {
      const aChange = a.policies[0]?.changes[0];
      const bChange = b.policies[0]?.changes[0];
      
      switch (sortBy) {
        case 'risk-desc':
          return (bChange?.overallScore || 0) - (aChange?.overallScore || 0);
        case 'risk-asc':
          return (aChange?.overallScore || 0) - (bChange?.overallScore || 0);
        case 'date-desc':
          return new Date(bChange?.createdAt || 0).getTime() - new Date(aChange?.createdAt || 0).getTime();
        case 'date-asc':
          return new Date(aChange?.createdAt || 0).getTime() - new Date(bChange?.createdAt || 0).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const totalMonitored = companies.length;
  
  const activeWarnings = companies.filter((c) => {
    return c.policies.some((p) => {
      const latestChange = p.changes[0];
      if (!latestChange) return false;
      const matchingImpact = latestChange.regionImpacts.find(
        (imp) => imp.region === selectedRegion && imp.perspective === selectedPerspective
      );
      return (matchingImpact?.riskLevel || latestChange.overallRisk) === 'High';
    });
  }).length;

  let totalScore = 0;
  let policiesCount = 0;
  companies.forEach((c) => {
    c.policies.forEach((p) => {
      if (p.changes[0]) {
        totalScore += p.changes[0].overallScore;
        policiesCount++;
      }
    });
  });
  const averageRiskScore = policiesCount > 0 ? totalScore / policiesCount : 0;

  // Count active filters
  const activeFilterCount = [
    riskFilter !== 'all',
    dateRange !== 'all',
    industryFilter !== 'all',
    search.length > 0,
  ].filter(Boolean).length;

  /** Maps a risk level string to its CSS colour variable. */
  const getRiskColor = (risk: string) => {
    if (risk === 'High') return 'var(--risk-high)';
    if (risk === 'Medium') return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  /** Maps a risk level string to its glow CSS colour variable (used for box-shadow). */
  const getRiskColorGlow = (risk: string) => {
    if (risk === 'High') return 'var(--risk-high-glow)';
    if (risk === 'Medium') return 'var(--risk-medium-glow)';
    return 'var(--risk-low-glow)';
  };

  const getDataStatusColor = (status: string) => {
    const normalized = normalizeDataStatus(status, 'Needs Review');
    if (normalized === 'Unavailable') return '#ef4444';
    if (normalized === 'Needs Review') return '#f97316';
    if (normalized === 'Partial') return '#d97706';
    if (normalized === 'Reviewed') return '#8b5cf6';
    if (normalized === 'Configured') return '#64748b';
    return '#10b981';
  };

  /** Derives a 128px Google favicon URL from a company's website domain. */
  const getCompanyLogoUrl = (website: string) => {
    try {
      const url = new URL(website);
      const parts = url.hostname.split('.');
      const domain = parts.slice(-2).join('.');
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  };

  const visibleMarketPulse = marketPulseChanges.slice(0, 12);

  /** Triggers a CSV export of the currently filtered company list. */
  const handleExportCSV = async () => {
    try {
      const { exportToCSV } = await import('@/lib/exporters');
      exportToCSV(filteredCompanies, `policywatcher-export-${new Date().toISOString().slice(0, 10)}`);
      setExportMenuOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  /** Resets all filters and sort to their default values. */
  const clearAllFilters = () => {
    setSearch('');
    setIndustryFilter('all');
    setRiskFilter('all');
    setDateRange('all');
    setSortBy('risk-desc');
  };

  /** Returns the localised label for a policy type code. */
  const getPolTypeLabel = (type: string) => {
    switch (type) {
      case 'privacy': return t.privacy;
      case 'terms': return t.terms;
      case 'ai': return t.ai;
      case 'developer': return t.developer;
      default: return type;
    }
  };

  const getSuspensionReasonLabel = (source: SourceSuspension) => {
    const reason = `${source.latestCheck?.reason || source.suspensionReason || ''}`.toLowerCase();
    const httpStatus = source.latestCheck?.httpStatus;

    if (
      httpStatus === 403 ||
      reason.includes('h2_status_403') ||
      reason.includes('cloudflare') ||
      reason.includes('bot') ||
      reason.includes('challenge')
    ) {
      return lang === 'it'
        ? 'La fonte ufficiale risponde con protezione provider/anti-bot alle strategie automatiche.'
        : 'The official source returned provider or anti-bot protection to automated retrieval strategies.';
    }

    if (reason.includes('content_too_short')) {
      return lang === 'it'
        ? 'Il contenuto recuperato non contiene testo policy sufficiente per una baseline pubblicabile.'
        : 'The retrieved body did not contain enough policy text for a publishable baseline.';
    }

    if (reason.includes('wayback_only_stale_snapshots') || reason.includes('stale')) {
      return lang === 'it'
        ? 'Gli archivi disponibili sono troppo datati per essere usati come evidenza corrente.'
        : 'Available archive snapshots are too stale to be used as current evidence.';
    }

    if (source.suspensionReason === 'source_evidence_missing') {
      return lang === 'it'
        ? 'Inventario configurato, ma non esiste ancora una baseline verificata da sorgente.'
        : 'Configured inventory exists, but no source-verified baseline is available yet.';
    }

    if (source.suspensionReason === 'partial_retrieval') {
      return lang === 'it'
        ? 'Recupero incompleto: la sorgente resta sospesa fino a revisione.'
        : 'Incomplete retrieval: the source remains suspended pending review.';
    }

    return lang === 'it'
      ? 'Quality gate in attesa di verifica o remediation della sorgente.'
      : 'Quality gate pending source verification or remediation.';
  };

  // Modals are statically imported (require() broke the matrix body rendering
  // and is not safe with Turbopack/Next 16). They are code-split via the
  // isOpen guard inside each component (early return when closed).
  const ActiveIntentIcon = activeIntent.icon;
  const visibleSupportingModules = draftWorkspaceSettings.supportingModules.filter((moduleId) =>
    draftWorkspaceSettings.visibleModules.includes(moduleId)
  );
  const workspaceConfigurator = (
    <motion.div
      ref={workspaceFirstUseMode ? composerDialogRef : undefined}
      id="adaptive-workspace-configurator"
      className={`${styles.workspaceConfigurator} ${workspaceFirstUseMode ? styles.workspaceConfiguratorDialog : ''}`}
      initial={{ opacity: 0, height: workspaceFirstUseMode ? 'auto' : 0, y: -8 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: workspaceFirstUseMode ? 'auto' : 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      role={workspaceFirstUseMode ? 'dialog' : undefined}
      aria-modal={workspaceFirstUseMode ? 'true' : undefined}
      aria-labelledby="workspace-composer-title"
      aria-describedby="workspace-composer-description"
    >
      <div className={styles.workspaceCopy}>
        <span className={styles.workspaceKicker}>
          <Layers3 size={14} />
          {workspaceFirstUseMode ? workspaceText.firstUseLabel : workspaceText.label}
        </span>
        <h2
          id="workspace-composer-title"
          ref={workspaceFirstUseMode ? composerHeadingRef : undefined}
          tabIndex={workspaceFirstUseMode ? -1 : undefined}
        >
          {workspaceText.title}
        </h2>
        <p id="workspace-composer-description">{workspaceText.lead}</p>
      </div>

      <div className={styles.workspaceControls} aria-label={t.workspaceLabel}>
        <div className={`${styles.preferenceGroup} ${styles.intentGroup}`}>
          <span className={styles.preferenceLabel}>{workspaceText.chooseIntent}</span>
          <div className={styles.workspaceIntentGrid}>
            {intentOptions.map((intent) => {
              const IntentIcon = intent.icon;
              const selected = draftWorkspaceIntent === intent.id;
              return (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => setDraftWorkspaceIntent(intent.id)}
                  className={selected ? styles.workspaceIntentActive : ''}
                  data-intent={intent.id}
                  aria-pressed={selected}
                >
                  <IntentIcon size={16} />
                  <span>{intent.label}</span>
                  <strong>{intent.title}</strong>
                  {selected && <Check className={styles.workspaceSelectionCheck} size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${styles.preferenceGroup} ${styles.depthGroup}`}>
          <span className={styles.preferenceLabel}>{workspaceText.chooseDepth}</span>
          <div className={styles.workspaceDepthStack}>
            {depthOptions.map((depth) => {
              const selected = draftEvidenceDepth === depth.id;
              return (
                <button
                  key={depth.id}
                  type="button"
                  onClick={() => setDraftEvidenceDepth(depth.id)}
                  className={selected ? styles.workspaceDepthActive : ''}
                  aria-pressed={selected}
                >
                  <span>{depth.label}</span>
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className={styles.workspaceDepthNote}>{draftDepth.detail}</p>
        </div>

        <div className={`${styles.preferenceGroup} ${styles.generatedGroup}`}>
          <span className={styles.preferenceLabel}>{workspaceText.generatedLogic}</span>
          <div className={styles.workspaceGeneratedCard} aria-live="polite">
            <div className={styles.generatedHeader}>
              <span>{workspaceText.activeProfile}</span>
              <strong>{draftIntent.label} / {draftDepth.label}</strong>
            </div>
            <p>{draftIntent.detail}</p>
            <div className={styles.generatedSafety}>
              <ShieldCheck size={17} aria-hidden="true" />
              <div>
                <strong>{moduleLabels.sourceQuality}</strong>
                <span>{workspaceText.sourcePinned}</span>
              </div>
            </div>
            <div className={styles.generatedEvidenceGroups}>
              <div>
                <span className={styles.generatedGroupLabel}>{workspaceText.primaryModules}</span>
                <motion.ol layout className={styles.generatedEvidenceStack}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {draftWorkspaceSettings.primaryModules.map((moduleId, index) => (
                      <motion.li
                        layout
                        key={moduleId}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                      >
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{moduleLabels[moduleId]}</strong>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ol>
              </div>
              <div>
                <span className={styles.generatedGroupLabel}>{workspaceText.supportingModules}</span>
                {visibleSupportingModules.length > 0 ? (
                  <div className={styles.generatedModules}>
                    {visibleSupportingModules.map((moduleId) => (
                      <span key={moduleId}>{moduleLabels[moduleId]}</span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.generatedEmptySupport}>{workspaceText.noSupportingModules}</p>
                )}
              </div>
            </div>
            <div className={styles.generatedMeta}>
              <span>{draftWorkspaceSettings.density}</span>
              <span>{draftWorkspaceSettings.view}</span>
              <span>{draftWorkspaceSettings.accent}</span>
            </div>
            <button
              type="button"
              className={styles.workspaceReset}
              onClick={() => {
                setDraftWorkspaceIntent('citizen');
                setDraftEvidenceDepth('snapshot');
              }}
            >
              <RotateCcw size={14} />
              {workspaceText.defaultAction}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.workspaceActions}>
        <button type="button" className={styles.workspaceCloseButton} onClick={closeWorkspaceComposer}>
          <X size={16} />
          {workspaceFirstUseMode ? workspaceText.firstUseClose : workspaceText.closeAction}
        </button>
        <button
          type="button"
          className={styles.workspaceApplyButton}
          onClick={applyWorkspaceComposer}
          disabled={!workspaceHasDraftChanges && !workspaceFirstUseMode}
        >
          {workspaceText.applyAction}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <TermsGate lang={lang} onLangToggle={() => setLang((l) => (l === 'en' ? 'it' : 'en'))}>
    <div
      className={styles.dashboard}
      data-nav-layout={navLayout}
      data-density={dashboardDensity}
      data-view={dashboardView}
      data-accent={dashboardAccent}
      data-workspace-intent={workspaceIntent}
      data-evidence-depth={evidenceDepth}
      data-on-the-go={onTheGoProfileActive ? 'true' : 'false'}
    >

      {/* Conditionally render clean logo header for HUD / Spotlight modes */}
      {navLayout !== 'sidebar' && (
        <header className={styles.header} style={{ borderBottom: navLayout === 'spotlight' ? 'none' : undefined }}>
          <div className={styles.headerContent} style={{ justifyContent: 'center' }}>
            <div className={styles.logoArea} style={{ pointerEvents: 'none' }}>
              <Image src="/logo-mark.png" alt="PolicyWatcher" width={56} height={56} className={styles.logoImage} priority />
              <div>
                <h1 className={styles.logoTitle}>PolicyWatcher</h1>
                <span className={styles.logoSubtitle}>{t.subtitle}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Unified Layout Navigation coordinator */}
      <Navigation
        lang={lang}
        onToggleLanguage={() => setLang((l) => (l === 'en' ? 'it' : 'en'))}
        onOpenAssistant={() => setChatOpen(true)}
        onOpenSubscribe={() => setSubscribeOpen(true)}
        onOpenExport={() => setExportMenuOpen(true)}
        onOpenMatrix={() => setMatrixOpen(true)}
        onOpenMethodology={() => setMethodologyOpen(true)}
        onOpenHowTo={() => setHowToOpen(true)}
        onOpenChangelog={() => setChangelogOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onChangeLayout={(layout) => setNavLayout(layout)}
      />

      <AnimatePresence>
        {workspaceConfiguratorOpen && workspaceFirstUseMode && (
          <motion.div
            className={styles.workspaceComposerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeWorkspaceComposer();
            }}
          >
            {workspaceConfigurator}
          </motion.div>
        )}
      </AnimatePresence>

      <main className={styles.mainContainer}>
        <motion.section
          className={styles.workspacePanel}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className={styles.workspaceSummaryCard}>
            <div className={styles.workspaceSummaryMain}>
              <span className={styles.workspaceKicker}>
                <Layers3 size={14} />
                {workspaceText.summaryTitle}
              </span>
              <h2>{activeIntent.label} / {activeDepth.label}</h2>
              <p>{workspaceText.compactLead}</p>
            </div>
            <div className={styles.workspaceActiveSummary}>
              <span>
                <ActiveIntentIcon size={14} />
                {workspaceText.presetPrefix}: <strong>{activeIntent.label}</strong>
              </span>
              <span>
                <SlidersHorizontal size={14} />
                {workspaceText.depthPrefix}: <strong>{activeDepth.label}</strong>
              </span>
            </div>
            <button
              type="button"
              className={styles.workspaceChangeButton}
              aria-expanded={workspaceConfiguratorOpen}
              aria-controls="adaptive-workspace-configurator"
              onClick={() => {
                setDraftWorkspaceIntent(workspaceIntent);
                setDraftEvidenceDepth(evidenceDepth);
                setWorkspaceFirstUseMode(false);
                setWorkspaceConfiguratorOpen((open) => !open);
              }}
            >
              <SlidersHorizontal size={16} />
              {workspaceText.changeAction}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {workspaceConfiguratorOpen && !workspaceFirstUseMode && workspaceConfigurator}
          </AnimatePresence>

          {showOnTheGoPrompt && (
            <motion.div
              className={styles.onTheGoPrompt}
              data-active={onTheGoProfileActive ? 'true' : 'false'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              <div>
                <span className={styles.workspaceKicker}>
                  <UserRound size={14} />
                  {t.onTheGoTitle}
                </span>
                <p>{t.onTheGoBody}</p>
              </div>
              {onTheGoProfileActive ? (
                <span className={styles.onTheGoStatus}>{t.onTheGoActive}</span>
              ) : (
                <div className={styles.onTheGoActions}>
                  <button
                    type="button"
                    className={styles.onTheGoPrimary}
                    onClick={() => {
                      setWorkspaceIntent('citizen');
                      setEvidenceDepth('snapshot');
                      setDraftWorkspaceIntent('citizen');
                      setDraftEvidenceDepth('snapshot');
                      setDashboardDensity('comfortable');
                      setDashboardView('cards');
                      setShowStats(false);
                      setShowMarketPulse(true);
                      setWorkspaceConfiguratorOpen(false);
                      setOnTheGoModeActive(true);
                    }}
                  >
                    {t.onTheGoAction}
                  </button>
                  <button
                    type="button"
                    className={styles.onTheGoSecondary}
                    onClick={() => setOnTheGoDismissed(true)}
                  >
                    {t.onTheGoDismiss}
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </motion.section>

        {isModuleVisible('observatory') && (
          <motion.section
            className={styles.observatoryTicker}
            style={{ order: getModuleOrder('observatory') }}
            aria-label={t.tickerLabel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
          >
            <div className={styles.tickerHeader}>
              <span className={styles.workspaceKicker}>
                <Search size={14} />
                {t.tickerLabel}
              </span>
              <span>
                <PauseCircle size={14} />
                {t.tickerPause}
              </span>
            </div>
            <div className={styles.tickerViewport}>
              <div className={styles.tickerTrack}>
                {tickerLoopItems.map((item, index) => (
                  <Link
                    key={`${item.id}-${index}`}
                    href={item.href}
                    className={styles.tickerItem}
                    data-tone={item.tone}
                    aria-hidden={index >= tickerItems.length}
                    tabIndex={index >= tickerItems.length ? -1 : undefined}
                  >
                    <span>{item.label}</span>
                    <strong>{item.message}</strong>
                  </Link>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          className={styles.releaseMapSection}
          style={{ order: 90 }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          aria-labelledby="release-map-title"
        >
          <div className={styles.releaseMapHeader}>
            <div>
              <span className={styles.releaseMapKicker}>
                <Sparkles size={15} />
                {t.exploreKicker}
              </span>
              <h2 id="release-map-title">{t.exploreTitle}</h2>
              <p>{t.exploreLead}</p>
            </div>
            <Link href="/atlas" className={styles.releaseMapPrimaryLink}>
              {t.exploreAtlas}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className={styles.releaseMapGrid}>
            {t.exploreCards.map((card, index) => {
              const Icon = explorationIcons[index] ?? Sparkles;
              return (
                <Link key={`${card.href}-${card.title}`} href={card.href} className={styles.releaseMapCard}>
                  <span className={styles.releaseMapIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.releaseMapMeta}>{card.category}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <span className={styles.releaseMapAction}>
                    {t.exploreOpen}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Statistics Grid */}
        {showStats && isModuleVisible('stats') && (
          <motion.section
            className={styles.statsGrid}
            style={{ order: getModuleOrder('stats') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
          >
            <div className={`${styles.statCard} glass-panel`} style={{ '--stat-color': 'var(--dashboard-accent)' } as React.CSSProperties}>
              <span className={styles.statLabel}>{t.monitoredCompanies}</span>
              <div className={styles.statValue}>{totalMonitored}</div>
            </div>
            <div className={`${styles.statCard} glass-panel`} style={{ '--stat-color': 'var(--risk-high)' } as React.CSSProperties}>
              <span className={styles.statLabel}>{t.criticalAlerts} ({selectedRegion})</span>
              <div className={styles.statValue} style={{ color: activeWarnings > 0 ? 'var(--risk-high)' : 'var(--text-main)' }}>
                {activeWarnings}
              </div>
            </div>
            <div className={`${styles.statCard} glass-panel`} style={{ '--stat-color': 'var(--secondary)' } as React.CSSProperties}>
              <span className={styles.statLabel}>{t.avgRiskScore}</span>
              <div className={styles.statValue}>{averageRiskScore.toFixed(1)}/10</div>
            </div>
            <div className={`${styles.statCard} glass-panel`} style={{ '--stat-color': 'var(--risk-low)' } as React.CSSProperties}>
              <span className={styles.statLabel}>{t.activeContext}</span>
              <div className={styles.statContextValue}>
                {selectedRegion} / {selectedPerspective === 'Individual' ? t.individual : t.enterprise}
              </div>
            </div>
          </motion.section>
        )}

        {/* Filter Bar */}
        {isModuleVisible('filters') && (
          <motion.section
            className={`${styles.controlsBar} glass-panel`}
            style={{ order: getModuleOrder('filters') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
          <div className={styles.searchFilterGroup}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select 
              value={industryFilter} 
              onChange={(e) => setIndustryFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">{t.allSectors}</option>
              <option value="Tech Giant">{t.techGiants}</option>
              <option value="FinTech">{t.fintech}</option>
              <option value="Social Media">{t.socialMedia}</option>
              <option value="E-Commerce">{t.ecommerce}</option>
              <option value="AI Provider">{t.aiProvider}</option>
              <option value="Cloud/SaaS">{t.cloudSaas}</option>
            </select>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.filterToggleBtnActive : ''}`}
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          <div className={styles.toggleSelectors}>
            {/* Region Select */}
            <div className={styles.toggleButtonGroup}>
              {(['EU', 'US', 'Global'] as const).map((region) => (
                <button 
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`${styles.toggleBtn} ${selectedRegion === region ? styles.toggleBtnActive : ''}`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Audience Select */}
            <div className={styles.toggleButtonGroup}>
              {(['Individual', 'Enterprise'] as const).map((perspective) => (
                <button 
                  key={perspective}
                  onClick={() => setSelectedPerspective(perspective)}
                  className={`${styles.toggleBtn} ${selectedPerspective === perspective ? styles.toggleBtnActive : ''}`}
                >
                  {perspective === 'Individual' ? t.individual : t.enterprise}
                </button>
              ))}
            </div>
          </div>
          </motion.section>
        )}

        {/* Advanced Filters Panel */}
        <AnimatePresence>
        {showAdvancedFilters && isModuleVisible('filters') && (
          <motion.section 
            className={`${styles.advancedFilters} glass-panel`}
            style={{ order: getModuleOrder('filters') + 1 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Risk Level */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <AlertTriangle size={14} />
                {lang === 'it' ? 'Livello Rischio' : 'Risk Level'}
              </label>
              <div className={styles.toggleButtonGroup}>
                {([
                  { value: 'all' as RiskFilter, label: t.allRisks },
                  { value: 'High' as RiskFilter, label: t.highRisk },
                  { value: 'Medium' as RiskFilter, label: t.mediumRisk },
                  { value: 'Low' as RiskFilter, label: t.lowRisk },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRiskFilter(opt.value)}
                    className={`${styles.toggleBtn} ${riskFilter === opt.value ? styles.toggleBtnActive : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Calendar size={14} />
                {lang === 'it' ? 'Periodo' : 'Time Range'}
              </label>
              <div className={styles.toggleButtonGroup}>
                {([
                  { value: 'all' as DateRange, label: t.allTime },
                  { value: '7d' as DateRange, label: t.last7d },
                  { value: '30d' as DateRange, label: t.last30d },
                  { value: '90d' as DateRange, label: t.last90d },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`${styles.toggleBtn} ${dateRange === opt.value ? styles.toggleBtnActive : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <ArrowUpDown size={14} />
                {lang === 'it' ? 'Ordina per' : 'Sort by'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className={styles.selectInput}
              >
                <option value="risk-desc">{t.sortByRisk} (High to Low)</option>
                <option value="risk-asc">{t.sortByRisk} (Low to High)</option>
                <option value="date-desc">{t.sortByDate} (Newest)</option>
                <option value="date-asc">{t.sortByDate} (Oldest)</option>
                <option value="name-asc">{t.sortByName} (A-Z)</option>
                <option value="name-desc">{t.sortByName} (Z-A)</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className={styles.clearFiltersBtn}>
                <X size={14} /> {t.clearFilters} ({activeFilterCount} {t.activeFilters})
              </button>
            )}
          </motion.section>
        )}
        </AnimatePresence>

        {!loading && sourceSuspensionsTotal > 0 && (
          <motion.section
            className={styles.sourceSuspensionPanel}
            style={{ order: getModuleOrder('sourceQuality') }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            aria-label={t.suspendedSourcesTitle}
          >
            <div className={styles.sourceSuspensionHeader}>
              <div>
                <h2 className={styles.sourceSuspensionTitle}>
                  <PauseCircle size={18} />
                  {t.suspendedSourcesTitle}
                </h2>
                <p className={styles.sourceSuspensionLead}>{t.suspendedSourcesLead}</p>
              </div>
              <div className={styles.sourceSuspensionCount}>
                <strong>{sourceSuspensionsTotal}</strong>
                <span>{t.suspendedSourcesCount}</span>
              </div>
            </div>

            <div className={styles.sourceSuspensionList}>
              {sourceSuspensions.slice(0, 6).map((source) => (
                <div key={source.id} className={styles.sourceSuspensionItem}>
                  <div>
                    <strong>{source.company.name}</strong>
                    <span>
                      {source.policyName} / {source.jurisdiction}
                      {source.sourceHost ? ` / ${source.sourceHost}` : ''}
                    </span>
                  </div>
                  <div className={styles.sourceSuspensionMeta}>
                    <span>{t.suspendedSourceStatus}: {source.dataStatus}</span>
                    <span>{t.suspendedSourceReason}: {getSuspensionReasonLabel(source)}</span>
                    <span>
                      {t.suspendedSourceLastCheck}: {new Date(source.lastCheckDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Market Pulse Timeline */}
        {showMarketPulse && isModuleVisible('marketPulse') && (
          <motion.section
            className={styles.marketPulseSection}
            style={{ order: getModuleOrder('marketPulse') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <div className={styles.marketPulseHeader}>
              <div>
                <h2 className={styles.marketPulseTitle}>
                  <Clock size={18} />
                  {t.marketPulseTitle}
                </h2>
                <p className={styles.marketPulseSubtitle}>{t.marketPulseSubtitle}</p>
              </div>
              <Link href="/timeline" className={styles.marketPulseLink}>
                {t.openFullTimeline}
                <ArrowRight size={14} />
              </Link>
            </div>

            {marketPulseLoading ? (
              <div className={styles.marketPulseLoading}>
                {lang === 'it' ? 'Caricamento timeline...' : 'Loading timeline...'}
              </div>
            ) : visibleMarketPulse.length === 0 ? (
              <div className={styles.marketPulseLoading}>{t.noMarketPulse}</div>
            ) : (
              <div className={styles.marketPulseScroller} aria-label={t.marketPulseTitle}>
                <div className={styles.marketPulseTrack}>
                  {visibleMarketPulse.map((change) => {
                    const date = new Date(change.createdAt).toLocaleDateString(
                      lang === 'it' ? 'it-IT' : 'en-US',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    );
                    const summary =
                      (lang === 'it'
                        ? change.tldrIt || change.aiSummaryIt
                        : change.tldrEn || change.aiSummaryEn) || '';

                    return (
                      <Link
                        key={change.id}
                        href={`/change/${change.id}`}
                        className={styles.marketPulseItem}
                        style={{ '--pulse-color': getRiskColor(change.overallRisk) } as React.CSSProperties}
                      >
                        <span className={styles.marketPulseDot} />
                        <span className={styles.marketPulseDate}>{date}</span>
                        <strong className={styles.marketPulseCompany}>{change.policy.company.name}</strong>
                        <span className={styles.marketPulsePolicy}>
                          {change.policy.name} / {change.policy.jurisdiction}
                        </span>
                        <span className={styles.marketPulseSummary}>{summary}</span>
                        <span className={styles.marketPulseMeta}>
                          {change.policy.company.industry} / {change.overallRisk} {change.overallScore}/10
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Results Count */}
        {!loading && (
          <div className={styles.resultsInfo} style={{ order: getModuleOrder('companyCards') - 1 }}>
            {filteredCompanies.length} / {companies.length} {lang === 'it' ? 'compagnie' : 'companies'}
          </div>
        )}

        {/* Loading / Empty / Grid */}
        {loading ? (
          <>
            <SkeletonStatsGrid />
            <SkeletonGrid count={6} />
          </>
        ) : filteredCompanies.length === 0 ? (
          <div className={styles.emptyState} style={{ order: getModuleOrder('companyCards') }}>
            <ShieldAlert size={48} className={styles.emptyIcon} />
            <p>{t.noResults}</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className={styles.clearFiltersBtn}>
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <motion.section 
            className={styles.companyGrid}
            style={{ order: getModuleOrder('companyCards') }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            {filteredCompanies.map((company) => {
              const firstPolicy = company.policies[0];
              const companyDataStatus = getWorstDataStatus(company.policies);
              const latestChange = firstPolicy?.changes[0];
              const firstPolicyStatus = normalizeDataStatus(firstPolicy?.dataStatus, 'Needs Review');
              const hasVerifiedBaseline = !latestChange && firstPolicyStatus === 'Available';
              
              const matchingImpact = latestChange?.regionImpacts.find(
                (imp) => imp.region === selectedRegion && imp.perspective === selectedPerspective
              );
              
              const currentRisk = matchingImpact?.riskLevel || latestChange?.overallRisk || 'Low';
              const currentScore = latestChange?.overallScore || null;
              
              const summaryText = latestChange 
                ? (lang === 'it'
                    ? latestChange.tldrIt || latestChange.aiSummaryIt
                    : latestChange.tldrEn || latestChange.aiSummaryEn)
                : hasVerifiedBaseline
                  ? t.baselineRegistered
                  : t.noPolicyEvidence;
                
              const formattedDate = latestChange 
                ? new Date(latestChange.createdAt).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'N/A';

              const cardRiskColor = latestChange ? getRiskColor(currentRisk) : getDataStatusColor(firstPolicyStatus);
              const cardRiskColorGlow = latestChange ? getRiskColorGlow(currentRisk) : 'rgba(16, 185, 129, 0.14)';

              const hasHighAlert = company.policies.some((p) => {
                const change = p.changes[0];
                if (!change) return false;
                const imp = change.regionImpacts.find(
                  (i) => i.region === selectedRegion && i.perspective === selectedPerspective
                );
                return (imp?.riskLevel || change.overallRisk) === 'High';
              });

              return (
                <motion.div 
                  key={company.id} 
                  className={`${styles.companyCard} glass-panel glass-panel-hover`}
                  style={{ borderTop: `3px solid ${cardRiskColor}` }}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  {hasHighAlert && (
                    <div className={styles.regionalAlert} style={{ '--risk-color': 'var(--risk-high)' } as React.CSSProperties}>
                      <span className={styles.pulsePoint}></span>
                      {lang === 'it' ? `Allerta ${selectedRegion}` : `${selectedRegion} Alert`}
                    </div>
                  )}

                  <div className={styles.cardTop}>
                    <div className={styles.companyInfo}>
                      {getCompanyLogoUrl(company.website) ? (
                        <Image
                          src={getCompanyLogoUrl(company.website)!}
                          alt={`${company.name} logo`}
                          width={44}
                          height={44}
                          className={styles.companyLogo}
                          style={{ objectFit: 'contain', background: '#fff' }}
                          unoptimized
                        />
                      ) : (
                        <div
                          className={styles.companyLogo}
                          style={{ backgroundColor: company.logo || 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                        >
                          {company.name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className={styles.companyName}>{company.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <span className={styles.industryTag}>{company.industry}</span>
                          {company.policies.length > 0 && (
                            <span className={`${styles.confidenceBadge} ${styles[`badge_${dataStatusClassKey(companyDataStatus)}`]}`}>
                              {companyDataStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.riskIndicator}>
                      <span className={styles.riskLabel}>
                        {latestChange ? `Risk (${selectedRegion})` : t.sourceBaseline}
                      </span>
                      <div className={styles.riskScore} style={{ '--risk-color': cardRiskColor, '--risk-color-glow': cardRiskColorGlow } as React.CSSProperties}>
                        {latestChange ? `${currentRisk} (${currentScore}/10)` : t.sourceVerified}
                      </div>
                    </div>
                  </div>

                  <p className={styles.cardMiddle}>
                    {summaryText}
                  </p>

                  {/* Inline risk reasons (explains WHY the score is what it is) */}
                  {latestChange && (
                    <CardRiskReasons
                      riskReasonsJson={latestChange.riskReasonsJson}
                      lang={lang}
                    />
                  )}

                  {/* Policy Pills with Jurisdiction Badge */}
                  <div className={styles.policyPillsSection}>
                    <span className={styles.policyPillsLabel}>
                      {t.policiesList}
                    </span>
                    <div className={styles.policyPills}>
                      {company.policies.map((pol) => {
                        const polRisk = pol.changes[0]?.overallRisk || 'Low';
                        const polColor = getRiskColor(polRisk);
                        const jurisdictionMatch = pol.jurisdiction === selectedRegion || pol.jurisdiction === 'Global';
                        
                        const dataStatus = normalizeDataStatus(pol.dataStatus, 'Needs Review');
                        const statusDotColor = getDataStatusColor(dataStatus);

                        return (
                          <button
                            key={pol.id}
                            onClick={() => setSelectedPolicyId(pol.id)}
                            className={`${styles.policyPill} ${jurisdictionMatch ? styles.policyPillHighlight : ''}`}
                            style={{ borderColor: polColor }}
                            title={`${pol.name} - Ingestion: ${pol.ingestionMethod || 'Unknown'} (${dataStatus})`}
                          >
                            <span 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                backgroundColor: statusDotColor, 
                                display: 'inline-block'
                              }}
                            />
                            {getPolTypeLabel(pol.type)}
                            <span className={styles.jurisdictionBadge}>{pol.jurisdiction}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <span className={styles.updateDate}>{t.updated}: {formattedDate}</span>
                    {firstPolicy && (
                      <button 
                        onClick={() => setSelectedPolicyId(firstPolicy.id)}
                        className={styles.actionLink}
                      >
                        {t.viewAnalysis} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.section>
        )}
      </main>

      <Footer lang={lang} />

      {/* Floating Action Live Chat */}
      <button 
        onClick={() => setChatOpen(true)}
        className={styles.chatTrigger}
        title="Open Policy Live Assistant"
        aria-label="Open Policy Live Assistant"
      >
        <MessageSquare className={styles.chatTriggerIcon} />
      </button>

      {/* Slide-over Policy Details */}
      {selectedPolicyId && (
        <PolicyDetails 
          policyId={selectedPolicyId} 
          onClose={() => setSelectedPolicyId(null)}
          selectedRegion={selectedRegion}
          selectedPerspective={selectedPerspective}
          onDataRefresh={fetchCompanies}
          lang={lang}
        />
      )}

      {/* Live Assistant */}
      {chatOpen && (
        <LiveAssistant 
          onClose={() => setChatOpen(false)}
          companies={companies}
          lang={lang}
        />
      )}

      {/* Subscribe Modal */}
      {subscribeOpen && (
        <SubscribeModal
          isOpen={subscribeOpen}
          onClose={() => setSubscribeOpen(false)}
          lang={lang}
        />
      )}

      {/* About Modal */}
      {aboutOpen && (
        <AboutModal
          isOpen={aboutOpen}
          onClose={() => setAboutOpen(false)}
        />
      )}

      {/* Changelog Modal */}
      {changelogOpen && (
        <ChangelogModal
          isOpen={changelogOpen}
          onClose={() => setChangelogOpen(false)}
        />
      )}

      {/* KPI Matrix Modal */}
      {matrixOpen && (
        <CrossCompanyMatrix
          isOpen={matrixOpen}
          onClose={() => setMatrixOpen(false)}
          lang={lang}
        />
      )}

      {/* Methodology Modal */}
      {methodologyOpen && (
        <MethodologyModal
          isOpen={methodologyOpen}
          onClose={() => setMethodologyOpen(false)}
          lang={lang}
        />
      )}

      {/* Compare A/B Modal */}
      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        companies={companies}
        lang={lang}
      />

      {/* Command Palette (Cmd K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        companies={companies}
        lang={lang}
        onToggleLanguage={() => setLang((l) => (l === 'en' ? 'it' : 'en'))}
        onOpenAssistant={() => setChatOpen(true)}
        onOpenSubscribe={() => setSubscribeOpen(true)}
        onOpenExport={() => handleExportCSV()}
        onOpenMatrix={() => setMatrixOpen(true)}
        onOpenMethodology={() => setMethodologyOpen(true)}
        onOpenHowTo={() => setHowToOpen(true)}
        onSelectCompany={handleSelectCompany}
        onSetIndustry={(ind) => setIndustryFilter(ind)}
        onSetRisk={(r) => setRiskFilter(r as RiskFilter)}
        onSetRegion={(r) => setSelectedRegion(r)}
        onSetPerspective={(p) => setSelectedPerspective(p)}
        onClearFilters={clearAllFilters}
      />

      {/* How To Modal */}
      {howToOpen && (
        <HowToModal
          onClose={() => setHowToOpen(false)}
          lang={lang}
        />
      )}
    </div>
    </TermsGate>
  );
}
