'use client';

/**
 * @file Navigation.tsx
 *
 * Unified layout coordinator rendering one of three interchangeable styles:
 *  - **HUD Dock** (bottom center floating toolbar)
 *  - **Spotlight Bar** (minimalist search-bar prompt at top)
 *  - **Forensic Sidebar** (collapsible left vertical rail)
 *
 * Handles client-side local storage preference and mobile-friendly layouts.
 */
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Languages,
  Zap,
  Bell,
  Download,
  Grid3X3,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
  Cpu,
  User,
  History,
  Settings,
  Layout,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import styles from './Navigation.module.css';

export type NavLayout = 'hud' | 'spotlight' | 'sidebar';

interface NavigationProps {
  /** Active UI language. */
  lang: 'en' | 'it';
  onToggleLanguage: () => void;
  onOpenAssistant: () => void;
  onOpenSubscribe: () => void;
  onOpenExport: () => void;
  onOpenMatrix: () => void;
  onOpenMethodology: () => void;
  onOpenHowTo: () => void;
  onOpenChangelog: () => void;
  onOpenAbout: () => void;
  /** Execute global command palette (⌘K) search. */
  onOpenSearch: () => void;
  /** Callback to parent to adjust padding/margins depending on active navigation width/height. */
  onChangeLayout: (layout: NavLayout) => void;
}

export default function Navigation({
  lang,
  onToggleLanguage,
  onOpenAssistant,
  onOpenSubscribe,
  onOpenExport,
  onOpenMatrix,
  onOpenMethodology,
  onOpenHowTo,
  onOpenChangelog,
  onOpenAbout,
  onOpenSearch,
  onChangeLayout,
}: NavigationProps) {
  const [navLayout, setNavLayout] = useState<NavLayout>('hud');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // HUD scroll auto-hide states
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hudHidden, setHudHidden] = useState(false);
  
  const selectorRef = useRef<HTMLDivElement>(null);
  const isIt = lang === 'it';

  // Load preferred layout on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('policywatcher_nav_layout') as NavLayout | null;
      if (stored && ['hud', 'spotlight', 'sidebar'].includes(stored)) {
        setNavLayout(stored);
        onChangeLayout(stored);
      } else {
        onChangeLayout('hud');
      }
    }
  }, [onChangeLayout]);

  // Click outside to close layout selector menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll auto-hide for Bottom HUD
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setHudHidden(true);
      } else {
        setHudHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const selectLayout = (layout: NavLayout) => {
    setNavLayout(layout);
    localStorage.setItem('policywatcher_nav_layout', layout);
    onChangeLayout(layout);
    setSelectorOpen(false);
  };

  const t = {
    en: {
      search: 'Search actions (⌘K)',
      export: 'Export CSV',
      methodology: 'Methodology',
      howTo: 'Tutorial guide',
      timeline: 'Policy timeline',
      showcase: 'App Showcase',
      roadmap: '3.5 Roadmap',
      matrix: 'KPI Matrix',
      compare: 'Compare A/B',
      subscribe: 'Subscribe',
      changelog: 'Changelog',
      about: 'About platform',
      assistant: 'Voice AI Chat',
      layoutTitle: 'Navigation Layout',
      layoutHud: 'Bottom HUD Dock',
      layoutSpotlight: 'Top Spotlight Bar',
      layoutSidebar: 'Forensic Sidebar',
    },
    it: {
      search: 'Cerca azioni (⌘K)',
      export: 'Esporta CSV',
      methodology: 'Metodologia',
      howTo: 'Guida onboarding',
      timeline: 'Timeline modifiche',
      showcase: 'Vetrina app',
      roadmap: 'Roadmap 3.5',
      matrix: 'Matrice KPI',
      compare: 'Confronta A/B',
      subscribe: 'Iscriviti',
      changelog: 'Aggiornamenti',
      about: 'Info piattaforma',
      assistant: 'Chat AI vocale',
      layoutTitle: 'Layout Navigazione',
      layoutHud: 'Bottom HUD Dock',
      layoutSpotlight: 'Top Spotlight Bar',
      layoutSidebar: 'Forensic Sidebar',
    }
  }[lang];

  /* ----------------------------------------------------
     Render Layouts
     ---------------------------------------------------- */

  return (
    <>
      {/* 1. Global Floating Layout Selector Selector Button */}
      <div className={styles.layoutSelectorWrapper} ref={selectorRef}>
        <button 
          onClick={() => setSelectorOpen(!selectorOpen)}
          className={styles.selectorBtn}
          title={t.layoutTitle}
          aria-label={t.layoutTitle}
        >
          <Layout size={18} />
        </button>
        {selectorOpen && (
          <div className={styles.selectorMenu}>
            <div className={styles.menuHeader}>{t.layoutTitle}</div>
            <button 
              onClick={() => selectLayout('hud')}
              className={`${styles.menuOption} ${navLayout === 'hud' ? styles.menuOptionActive : ''}`}
            >
              <Cpu size={14} />
              {t.layoutHud}
            </button>
            <button 
              onClick={() => selectLayout('spotlight')}
              className={`${styles.menuOption} ${navLayout === 'spotlight' ? styles.menuOptionActive : ''}`}
            >
              <Search size={14} />
              {t.layoutSpotlight}
            </button>
            <button 
              onClick={() => selectLayout('sidebar')}
              className={`${styles.menuOption} ${navLayout === 'sidebar' ? styles.menuOptionActive : ''}`}
            >
              <SlidersHorizontal size={14} />
              {t.layoutSidebar}
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
         STYLE 1: Bottom HUD Dock
         ========================================== */}
      {navLayout === 'hud' && (
        <nav className={`${styles.hudDock} ${hudHidden ? styles.hudHidden : ''}`}>
          {/* Quick Search */}
          <button onClick={onOpenSearch} className={styles.hudBtn} data-tooltip={t.search}>
            <Search size={18} />
          </button>
          
          <div className={styles.hudDivider} />

          {/* Core Navigation Links */}
          <Link href="/timeline" className={styles.hudBtn} data-tooltip={t.timeline}>
            <Clock size={18} />
          </Link>
          <Link href="/showcase" className={styles.hudBtn} data-tooltip={t.showcase}>
            <Sparkles size={18} />
          </Link>
          <Link href="/roadmap" className={styles.hudBtn} data-tooltip={t.roadmap}>
            <Cpu size={18} />
          </Link>

          <div className={styles.hudDivider} />

          {/* Dashboard Modal triggers */}
          <button onClick={onOpenMatrix} className={styles.hudBtn} data-tooltip={t.matrix}>
            <Grid3X3 size={18} />
          </button>
          <button onClick={onOpenExport} className={styles.hudBtn} data-tooltip={t.export}>
            <Download size={18} />
          </button>
          <button onClick={onOpenMethodology} className={styles.hudBtn} data-tooltip={t.methodology}>
            <BookOpen size={18} />
          </button>
          <button onClick={onOpenHowTo} className={styles.hudBtn} data-tooltip={t.howTo}>
            <HelpCircle size={18} />
          </button>
          <button onClick={onOpenSubscribe} className={styles.hudBtn} data-tooltip={t.subscribe}>
            <Bell size={18} />
          </button>
          <button onClick={onOpenChangelog} className={styles.hudBtn} data-tooltip={t.changelog}>
            <History size={18} />
          </button>
          <button onClick={onOpenAbout} className={styles.hudBtn} data-tooltip={t.about}>
            <User size={18} />
          </button>
          
          <div className={styles.hudDivider} />

          {/* Lang toggle */}
          <button onClick={onToggleLanguage} className={styles.hudBtn} data-tooltip={isIt ? 'Switch to English' : "Passa all'italiano"}>
            <Languages size={18} />
          </button>

          <div className={styles.hudDivider} />

          {/* AI assistant */}
          <button onClick={onOpenAssistant} className={styles.hudAssistantBtn} data-tooltip={t.assistant}>
            <Zap size={18} />
          </button>
        </nav>
      )}

      {/* ==========================================
         STYLE 2: Spotlight Command Bar
         ========================================== */}
      {navLayout === 'spotlight' && (
        <div className={styles.spotlightBar} onClick={onOpenSearch}>
          <div className={styles.spotlightLeft}>
            <Search size={16} />
            <span className={styles.spotlightPrompt}>{t.search}</span>
          </div>
          <div className={styles.spotlightRight}>
            <span className={styles.spotlightKbd}>⌘K</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleLanguage();
              }}
              className={styles.spotlightSettingsBtn}
              title={isIt ? 'Switch to English' : "Passa all'italiano"}
            >
              <Languages size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
         STYLE 3: Left Sidebar
         ========================================== */}
      {(navLayout === 'sidebar' || mobileSidebarOpen) && (
        <>
          {/* Mobile backdrop drawer blur */}
          <div 
            className={`${styles.mobileSidebarBackdrop} ${mobileSidebarOpen ? styles.mobileBackdropActive : ''}`}
            onClick={() => setMobileSidebarOpen(false)}
          />

          <nav className={`${styles.sidebarRail} ${mobileSidebarOpen ? styles.sidebarActive : ''}`}>
            <div className={styles.sidebarTop}>
              <Link href="/" className={styles.sidebarLogoRow} onClick={() => setMobileSidebarOpen(false)}>
                <ShieldCheck className={styles.sidebarLogoIcon} size={24} />
                <span className={styles.sidebarLogoTitle}>PolicyWatcher</span>
              </Link>

              <div className={styles.sidebarMenu}>
                {/* Search */}
                <button 
                  onClick={() => {
                    onOpenSearch();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.search}
                >
                  <span className={styles.sidebarBtnIcon}><Search size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.search}</span>
                </button>

                {/* Core Routes */}
                <Link 
                  href="/timeline" 
                  className={styles.sidebarBtn} 
                  data-tooltip={t.timeline}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className={styles.sidebarBtnIcon}><Clock size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.timeline}</span>
                </Link>
                <Link 
                  href="/showcase" 
                  className={styles.sidebarBtn} 
                  data-tooltip={t.showcase}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className={styles.sidebarBtnIcon}><Sparkles size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.showcase}</span>
                </Link>
                <Link 
                  href="/roadmap" 
                  className={styles.sidebarBtn} 
                  data-tooltip={t.roadmap}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className={styles.sidebarBtnIcon}><Cpu size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.roadmap}</span>
                </Link>

                {/* Modals */}
                <button 
                  onClick={() => {
                    onOpenMatrix();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.matrix}
                >
                  <span className={styles.sidebarBtnIcon}><Grid3X3 size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.matrix}</span>
                  {/* Flashing GRC Telemetry light indicator */}
                  <span className={`${styles.telemetryDot} ${styles.telemetryOrange}`} />
                </button>

                <button 
                  onClick={() => {
                    onOpenExport();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.export}
                >
                  <span className={styles.sidebarBtnIcon}><Download size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.export}</span>
                </button>

                <button 
                  onClick={() => {
                    onOpenMethodology();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.methodology}
                >
                  <span className={styles.sidebarBtnIcon}><BookOpen size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.methodology}</span>
                </button>

                <button 
                  onClick={() => {
                    onOpenHowTo();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.howTo}
                >
                  <span className={styles.sidebarBtnIcon}><HelpCircle size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.howTo}</span>
                </button>

                <button 
                  onClick={() => {
                    onOpenSubscribe();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.subscribe}
                >
                  <span className={styles.sidebarBtnIcon}><Bell size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.subscribe}</span>
                </button>

                <button 
                  onClick={() => {
                    onOpenChangelog();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.changelog}
                >
                  <span className={styles.sidebarBtnIcon}><History size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.changelog}</span>
                </button>

                <button 
                  onClick={() => {
                    onOpenAbout();
                    setMobileSidebarOpen(false);
                  }} 
                  className={styles.sidebarBtn}
                  data-tooltip={t.about}
                >
                  <span className={styles.sidebarBtnIcon}><User size={18} /></span>
                  <span className={styles.sidebarBtnLabel}>{t.about}</span>
                </button>
              </div>
            </div>

            <div className={styles.sidebarBottom}>
              <button 
                onClick={() => {
                  onToggleLanguage();
                  setMobileSidebarOpen(false);
                }} 
                className={styles.sidebarBtn}
                title={isIt ? 'Switch to English' : "Passa all'italiano"}
              >
                <span className={styles.sidebarBtnIcon}><Languages size={18} /></span>
                <span className={styles.sidebarBtnLabel}>{isIt ? 'English' : 'Italiano'}</span>
              </button>

              <button 
                onClick={() => {
                  onOpenAssistant();
                  setMobileSidebarOpen(false);
                }} 
                className={styles.sidebarAssistantBtn}
                data-tooltip={t.assistant}
              >
                <span className={styles.sidebarBtnIcon}><Zap size={18} /></span>
                <span className={styles.sidebarBtnLabel}>{t.assistant}</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Floating Hamburguer FAB for sidebar mobile drawer */}
      {navLayout === 'sidebar' && (
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className={styles.mobileMenuFAB}
          aria-label="Toggle Navigation Drawer"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile HUD fallback Bottom Bar */}
      {navLayout === 'hud' && (
        <div className={styles.mobileBottomBar}>
          <Link href="/timeline" className={`${styles.mobileBottomBtn}`}>
            <Clock size={20} />
            <span>Timeline</span>
          </Link>
          <button onClick={onOpenMatrix} className={styles.mobileBottomBtn}>
            <Grid3X3 size={20} />
            <span>Matrix</span>
          </button>
          <button onClick={onOpenAssistant} className={styles.mobileBottomBtn} style={{ color: 'var(--primary)' }}>
            <Zap size={20} />
            <span>AI Chat</span>
          </button>
          <button onClick={onOpenSearch} className={styles.mobileBottomBtn}>
            <Search size={20} />
            <span>Search</span>
          </button>
          <button onClick={onOpenAbout} className={styles.mobileBottomBtn}>
            <User size={20} />
            <span>About</span>
          </button>
        </div>
      )}
    </>
  );
}
