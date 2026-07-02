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

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShieldAlert, 
  MessageSquare,
  ArrowRight,
  FileText,
  AlertTriangle,
  Zap,
  Download,
  Bell,
  User,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Calendar,
  ChevronDown,
  Grid3X3,
  BookOpen,
  GitCompare,
  History,
  HelpCircle,
  Clock,
  Sparkles,
  Cpu
} from 'lucide-react';
import styles from './Dashboard.module.css';
import PolicyDetails from '@/components/PolicyDetails';
import LiveAssistant from '@/components/LiveAssistant';
import DisclaimerBanner from '@/components/DisclaimerBanner';
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

// Re-export types for backward compatibility
export type { Company, Policy, PolicyChange, RegionImpact } from '@/types/index';
import type { Company } from '@/types/index';

/** Bilingual UI string dictionary, keyed by language code. */
const translations = {
  it: {
    title: 'PolicyWatcher',
    subtitle: 'AI Regulatory Compliance Monitor',
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
    noResults: 'Nessun risultato corrisponde ai criteri.',
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
    noMarketPulse: 'Nessuna modifica disponibile per questo filtro.',
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
    disclaimer: 'Beta Release: Questa piattaforma e in fase di sviluppo (beta) e non rappresenta un prodotto finale. Le informazioni sono generate tramite analisi automatizzata (AI) e possono contenere imprecisioni o errori interpretativi. Non costituiscono parere legale o certificazione di conformita. L\'autore declina ogni responsabilita. L\'interpretazione e l\'uso dei dati sono esclusivamente a rischio e responsabilita dell\'utente. Verificare sempre presso le fonti ufficiali.',
  },
  en: {
    title: 'PolicyWatcher',
    subtitle: 'AI Regulatory Compliance Monitor',
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
    noResults: 'No companies match the criteria.',
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
    noMarketPulse: 'No changes available for this filter.',
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
    disclaimer: 'Beta Release: This platform is in active development (beta) and does not represent a final product. All information is generated through automated AI analysis and may contain inaccuracies or interpretive errors. It does not constitute legal advice or compliance certification. The author disclaims all liability. Interpretation and use of this data are solely at the user\'s own risk and responsibility. Always verify with official sources.',
  }
};

/** Sort direction options for the company grid. */
type SortBy = 'risk-desc' | 'risk-asc' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
/** Quick-filter values for risk level. */
type RiskFilter = 'all' | 'High' | 'Medium' | 'Low';
/** Quick-filter values for the change recency date range. */
type DateRange = 'all' | '7d' | '30d' | '90d';

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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Compare modal
  const [compareOpen, setCompareOpen] = useState(false);

  // Interchangeable Navigation Layout (hud | spotlight | sidebar)
  const [navLayout, setNavLayout] = useState<NavLayout>('hud');

  const t = translations[lang];

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
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

  // Automatically open onboarding for new sessions (unless skipped permanently)
  useEffect(() => {
    try {
      const skipPermanently = localStorage.getItem('policywatcher_onboarding_skip_permanently') === 'true';
      const sessionSeen = sessionStorage.getItem('policywatcher_onboarding_session_seen') === 'true';
      if (!skipPermanently && !sessionSeen) {
        const timer = setTimeout(() => {
          setHowToOpen(true);
        }, 400);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K toggles the command palette (works even from inputs)
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
        setHowToOpen(false);
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

  // Modals are statically imported (require() broke the matrix body rendering
  // and is not safe with Turbopack/Next 16). They are code-split via the
  // isOpen guard inside each component (early return when closed).

  return (
    <TermsGate lang={lang} onLangToggle={() => setLang((l) => (l === 'en' ? 'it' : 'en'))}>
    <div className={styles.dashboard} data-nav-layout={navLayout}>
      <DisclaimerBanner />

      {/* Conditionally render clean logo header for HUD / Spotlight modes */}
      {navLayout !== 'sidebar' && (
        <header className={styles.header} style={{ borderBottom: navLayout === 'spotlight' ? 'none' : undefined }}>
          <div className={styles.headerContent} style={{ justifyContent: 'center' }}>
            <div className={styles.logoArea} style={{ pointerEvents: 'none' }}>
              <Image src="/logo.png" alt="PolicyWatcher" width={40} height={40} className={styles.logoImage} priority />
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

      <main className={styles.mainContainer}>
        {/* Statistics Grid */}
        <motion.section 
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
        >
          <div className={`${styles.statCard} glass-panel`} style={{ '--stat-color': 'var(--primary)' } as React.CSSProperties}>
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

        {/* Filter Bar */}
        <motion.section 
          className={`${styles.controlsBar} glass-panel`}
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

        {/* Advanced Filters Panel */}
        <AnimatePresence>
        {showAdvancedFilters && (
          <motion.section 
            className={`${styles.advancedFilters} glass-panel`}
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

        {/* Market Pulse Timeline */}
        <motion.section
          className={styles.marketPulseSection}
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
                        {change.policy.name} · {change.policy.jurisdiction}
                      </span>
                      <span className={styles.marketPulseSummary}>{summary}</span>
                      <span className={styles.marketPulseMeta}>
                        {change.policy.company.industry} · {change.overallRisk} {change.overallScore}/10
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>

        {/* Results Count */}
        {!loading && (
          <div className={styles.resultsInfo}>
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
          <div className={styles.emptyState}>
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
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            {filteredCompanies.map((company) => {
              const firstPolicy = company.policies[0];
              const latestChange = firstPolicy?.changes[0];
              
              const matchingImpact = latestChange?.regionImpacts.find(
                (imp) => imp.region === selectedRegion && imp.perspective === selectedPerspective
              );
              
              const currentRisk = matchingImpact?.riskLevel || latestChange?.overallRisk || 'Low';
              const currentScore = latestChange?.overallScore || 1;
              
              const summaryText = latestChange 
                ? (lang === 'it'
                    ? latestChange.tldrIt || latestChange.aiSummaryIt
                    : latestChange.tldrEn || latestChange.aiSummaryEn)
                : (lang === 'it' ? 'Nessuna policy registrata.' : 'No policy registered yet.');
                
              const formattedDate = latestChange 
                ? new Date(latestChange.createdAt).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'N/A';

              const cardRiskColor = getRiskColor(currentRisk);
              const cardRiskColorGlow = getRiskColorGlow(currentRisk);

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
                        <span className={styles.industryTag}>{company.industry}</span>
                      </div>
                    </div>
                    
                    <div className={styles.riskIndicator}>
                      <span className={styles.riskLabel}>Risk ({selectedRegion})</span>
                      <div className={styles.riskScore} style={{ '--risk-color': cardRiskColor, '--risk-color-glow': cardRiskColorGlow } as React.CSSProperties}>
                        {currentRisk} ({currentScore}/10)
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

                        return (
                          <button
                            key={pol.id}
                            onClick={() => setSelectedPolicyId(pol.id)}
                            className={`${styles.policyPill} ${jurisdictionMatch ? styles.policyPillHighlight : ''}`}
                            style={{ borderColor: polColor }}
                          >
                            <FileText size={10} />
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

      {/* Command Palette (⌘K) */}
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
