'use client';

/**
 * @file Navigation.tsx
 *
 * Deterministic command navigation for the public dashboard.
 * The previous interchangeable layouts were browser-state dependent; this
 * ribbon keeps the same controls visible and predictable on every profile.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronUp,
  Clock,
  Cpu,
  Download,
  GitFork,
  Grid3X3,
  HelpCircle,
  History,
  Languages,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { POLICYWATCHER_VERSION } from '@/lib/release';
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
  /** Execute global command palette search. */
  onOpenSearch: () => void;
  /** Callback to parent to adjust padding/margins depending on active navigation width/height. */
  onChangeLayout: (layout: NavLayout) => void;
}

type CommandItem = {
  id: string;
  label: string;
  shortLabel?: string;
  tooltip?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: 'default' | 'accent' | 'quiet';
};

type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

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
  const [moreOpen, setMoreOpen] = useState(false);
  const isIt = lang === 'it';

  useEffect(() => {
    onChangeLayout('hud');

    try {
      localStorage.removeItem('policywatcher_nav_layout');
    } catch {
      /* Browser storage can be unavailable in private contexts. */
    }
  }, [onChangeLayout]);

  useEffect(() => {
    if (!moreOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [moreOpen]);

  const t = {
    en: {
      observe: 'Observe',
      audit: 'Audit',
      operate: 'Operate',
      status: `v${POLICYWATCHER_VERSION}`,
      search: 'Search',
      searchTitle: 'Search actions',
      export: 'Export',
      methodology: 'Methodology',
      howTo: 'How to',
      timeline: 'Timeline',
      observatory: 'Observatory',
      leaderboard: 'Signals',
      showcase: 'Showcase',
      atlas: 'Atlas',
      roadmap: 'Roadmap',
      trust: 'Trust QA',
      matrix: 'Matrix',
      subscribe: 'Alerts',
      changelog: 'Changes',
      about: 'About',
      assistant: 'AI Chat',
      more: 'More',
      close: 'Close',
      moreTitle: 'Workspace Controls',
      moreSubtitle: 'Public dashboard actions, exports, docs, and QA references.',
      language: 'Italiano',
      tooltips: {
        search: 'Search companies, policies and dashboard actions',
        timeline: 'Open the source-verified change timeline',
        observatory: 'Open the curated policy source observatory',
        leaderboard: 'Compare companies by operational evidence signals',
        showcase: 'View the platform overview, workflows and visuals',
        atlas: 'Explore the public platform as an entity-relation graph',
        roadmap: 'Review planned features and community priorities',
        trust: 'Open public trust, QA and security evidence',
        matrix: 'Open the cross-company KPI matrix',
        export: 'Export filtered dashboard data',
        methodology: 'Read the methodology and confidence process',
        howTo: 'Open the user guide',
        subscribe: 'Subscribe to policy change alerts',
        changelog: 'See release changes and maintenance notes',
        language: 'Switch dashboard language',
        about: 'Open project and author information',
        assistant: 'Ask the PolicyWatcher assistant',
        more: 'Open all controls',
      },
    },
    it: {
      observe: 'Osserva',
      audit: 'Audita',
      operate: 'Opera',
      status: `v${POLICYWATCHER_VERSION}`,
      search: 'Cerca',
      searchTitle: 'Cerca azioni',
      export: 'Export',
      methodology: 'Metodo',
      howTo: 'Guida',
      timeline: 'Timeline',
      observatory: 'Observatory',
      leaderboard: 'Segnali',
      showcase: 'Vetrina',
      atlas: 'Atlante',
      roadmap: 'Roadmap',
      trust: 'Trust QA',
      matrix: 'Matrice',
      subscribe: 'Avvisi',
      changelog: 'Change',
      about: 'Info',
      assistant: 'AI Chat',
      more: 'Altro',
      close: 'Chiudi',
      moreTitle: 'Controlli Workspace',
      moreSubtitle: 'Azioni pubbliche, export, documentazione e riferimenti QA.',
      language: 'English',
      tooltips: {
        search: 'Cerca aziende, policy e azioni della dashboard',
        timeline: 'Apri la timeline delle modifiche verificate',
        observatory: 'Apri l osservatorio curato delle fonti policy',
        leaderboard: 'Confronta le aziende per segnali di evidenza operativa',
        showcase: 'Guarda overview, workflow e visual della piattaforma',
        atlas: 'Esplora la piattaforma come grafo entita-relazioni',
        roadmap: 'Consulta funzioni pianificate e priorita community',
        trust: 'Apri evidenze pubbliche di trust, QA e sicurezza',
        matrix: 'Apri la matrice KPI cross-company',
        export: 'Esporta i dati filtrati della dashboard',
        methodology: 'Leggi metodologia e processo di confidence',
        howTo: 'Apri la guida utente',
        subscribe: 'Iscriviti agli alert sulle modifiche',
        changelog: 'Vedi modifiche di release e note manutentive',
        language: 'Cambia lingua della dashboard',
        about: 'Apri informazioni sul progetto e autore',
        assistant: 'Interroga l’assistente PolicyWatcher',
        more: 'Apri tutti i controlli',
      },
    },
  }[lang];

  const groups = useMemo<CommandGroup[]>(() => [
    {
      id: 'observe',
      label: t.observe,
      items: [
        { id: 'timeline', label: t.timeline, tooltip: t.tooltips.timeline, icon: Clock, href: '/timeline' },
        { id: 'observatory', label: t.observatory, tooltip: t.tooltips.observatory, icon: Search, href: '/observatory' },
        { id: 'leaderboard', label: t.leaderboard, tooltip: t.tooltips.leaderboard, icon: BarChart3, href: '/leaderboard' },
        { id: 'showcase', label: t.showcase, tooltip: t.tooltips.showcase, icon: Sparkles, href: '/showcase' },
        { id: 'atlas', label: t.atlas, tooltip: t.tooltips.atlas, icon: GitFork, href: '/atlas' },
        { id: 'roadmap', label: t.roadmap, tooltip: t.tooltips.roadmap, icon: Cpu, href: '/roadmap' },
        { id: 'trust', label: t.trust, tooltip: t.tooltips.trust, icon: ShieldCheck, href: '/trust' },
      ],
    },
    {
      id: 'audit',
      label: t.audit,
      items: [
        { id: 'matrix', label: t.matrix, tooltip: t.tooltips.matrix, icon: Grid3X3, onClick: onOpenMatrix },
        { id: 'export', label: t.export, tooltip: t.tooltips.export, icon: Download, onClick: onOpenExport },
        { id: 'methodology', label: t.methodology, tooltip: t.tooltips.methodology, icon: BookOpen, onClick: onOpenMethodology },
        { id: 'how-to', label: t.howTo, tooltip: t.tooltips.howTo, icon: HelpCircle, onClick: onOpenHowTo },
      ],
    },
    {
      id: 'operate',
      label: t.operate,
      items: [
        { id: 'subscribe', label: t.subscribe, tooltip: t.tooltips.subscribe, icon: Bell, onClick: onOpenSubscribe },
        { id: 'changelog', label: t.changelog, tooltip: t.tooltips.changelog, icon: History, onClick: onOpenChangelog },
        { id: 'language', label: t.language, tooltip: t.tooltips.language, icon: Languages, onClick: onToggleLanguage, tone: 'quiet' },
        { id: 'about', label: t.about, tooltip: t.tooltips.about, icon: User, onClick: onOpenAbout, tone: 'quiet' },
      ],
    },
  ], [
    onOpenAbout,
    onOpenChangelog,
    onOpenExport,
    onOpenHowTo,
    onOpenMatrix,
    onOpenMethodology,
    onOpenSubscribe,
    onToggleLanguage,
    t.about,
    t.atlas,
    t.audit,
    t.changelog,
    t.export,
    t.howTo,
    t.language,
    t.matrix,
    t.methodology,
    t.observe,
    t.observatory,
    t.operate,
    t.roadmap,
    t.leaderboard,
    t.showcase,
    t.subscribe,
    t.timeline,
    t.trust,
    t.tooltips.about,
    t.tooltips.atlas,
    t.tooltips.changelog,
    t.tooltips.export,
    t.tooltips.howTo,
    t.tooltips.language,
    t.tooltips.leaderboard,
    t.tooltips.matrix,
    t.tooltips.methodology,
    t.tooltips.observatory,
    t.tooltips.roadmap,
    t.tooltips.showcase,
    t.tooltips.subscribe,
    t.tooltips.timeline,
    t.tooltips.trust,
  ]);

  const allCommands = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const assistantCommand: CommandItem = {
    id: 'assistant',
    label: t.assistant,
    tooltip: t.tooltips.assistant,
    icon: Zap,
    onClick: onOpenAssistant,
    tone: 'accent',
  };

  const searchCommand: CommandItem = {
    id: 'search',
    label: t.search,
    shortLabel: t.searchTitle,
    tooltip: t.tooltips.search,
    icon: Search,
    onClick: onOpenSearch,
  };

  const runCommand = (item: CommandItem) => {
    setMoreOpen(false);
    item.onClick?.();
  };

  const renderCommand = (item: CommandItem, mode: 'ribbon' | 'sheet' = 'ribbon') => {
    const Icon = item.icon;
    const className = [
      styles.commandButton,
      item.tone === 'accent' ? styles.commandAccent : '',
      item.tone === 'quiet' ? styles.commandQuiet : '',
      mode === 'sheet' ? styles.sheetCommand : '',
    ].filter(Boolean).join(' ');

    const content = (
      <>
        <Icon size={18} aria-hidden="true" />
        <span className={styles.commandLabel}>{item.label}</span>
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={className}
          data-tooltip={item.tooltip ?? item.shortLabel ?? item.label}
          title={item.shortLabel ?? item.label}
          aria-label={item.shortLabel ?? item.label}
          onClick={() => setMoreOpen(false)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className={className}
        data-tooltip={item.tooltip ?? item.shortLabel ?? item.label}
        title={item.shortLabel ?? item.label}
        aria-label={item.shortLabel ?? item.label}
        onClick={() => runCommand(item)}
      >
        {content}
      </button>
    );
  };

  return (
    <>
      <nav className={styles.controlRibbon} aria-label="PolicyWatcher command ribbon">
        <div className={styles.ribbonIdentity} aria-label="PolicyWatcher release status">
          <span className={styles.identityMark} aria-hidden="true">
            <span />
          </span>
          <span className={styles.identityText}>
            <strong>PolicyWatcher</strong>
            <span>{t.status}</span>
          </span>
        </div>

        <button
          type="button"
          className={`${styles.commandButton} ${styles.searchButton}`}
          onClick={onOpenSearch}
          data-tooltip={t.tooltips.search}
          title={t.searchTitle}
          aria-label={t.searchTitle}
        >
          <Search size={18} aria-hidden="true" />
          <span className={styles.commandLabel}>{t.search}</span>
          <kbd className={styles.commandKbd}>Cmd K</kbd>
        </button>

        <div className={styles.ribbonGroups}>
          {groups.map((group) => (
            <section key={group.id} className={styles.commandGroup} aria-label={group.label}>
              <span className={styles.groupLabel}>{group.label}</span>
              <div className={styles.groupItems}>
                {group.items.map((item) => renderCommand(item))}
              </div>
            </section>
          ))}
        </div>

        {renderCommand(assistantCommand)}
      </nav>

      <nav className={styles.mobileCommandBar} aria-label="PolicyWatcher mobile commands">
        {renderCommand(groups[0].items[0])}
        {renderCommand(groups[1].items[0])}
        {renderCommand(assistantCommand)}
        {renderCommand(searchCommand)}
        <button
          type="button"
          className={`${styles.commandButton} ${styles.mobileMoreButton}`}
          onClick={() => setMoreOpen(true)}
          data-tooltip={t.tooltips.more}
          aria-label={t.more}
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span className={styles.commandLabel}>{t.more}</span>
        </button>
      </nav>

      {moreOpen && (
        <div className={styles.mobileSheetLayer} role="presentation" onClick={() => setMoreOpen(false)}>
          <aside
            className={styles.mobileSheet}
            role="dialog"
            aria-modal="true"
            aria-label={t.moreTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetGrip} aria-hidden="true">
              <ChevronUp size={18} />
            </div>
            <header className={styles.sheetHeader}>
              <div>
                <h2>{t.moreTitle}</h2>
                <p>{t.moreSubtitle}</p>
              </div>
              <button
                type="button"
                className={styles.sheetCloseButton}
                onClick={() => setMoreOpen(false)}
                aria-label={t.close}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.sheetSearchRow}>
              {renderCommand(searchCommand, 'sheet')}
              {renderCommand(assistantCommand, 'sheet')}
            </div>

            <div className={styles.sheetGroups}>
              {groups.map((group) => (
                <section key={group.id} className={styles.sheetGroup} aria-label={group.label}>
                  <span className={styles.sheetGroupLabel}>{group.label}</span>
                  <div className={styles.sheetGrid}>
                    {group.items.map((item) => renderCommand(item, 'sheet'))}
                  </div>
                </section>
              ))}
            </div>

            <div className={styles.sheetFooter}>
              <span>{allCommands.length + 2}</span>
              <span>{isIt ? 'controlli disponibili' : 'available controls'}</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
