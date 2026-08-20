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
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronUp,
  Clock,
  Code2,
  Cpu,
  Download,
  GitFork,
  Grid3X3,
  HelpCircle,
  History,
  Languages,
  Layers3,
  MailSearch,
  Network,
  Newspaper,
  MoreHorizontal,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import { getWorkspaceQuickActionIds } from '@/lib/workspaceNavigation';
import type { EvidenceDepth, WorkspaceIntent } from '@/lib/dashboardComposer';
import GlobalContextControl from './GlobalContextControl';
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
  onOpenWorkspace: () => void;
  /** Execute global command palette search. */
  onOpenSearch: () => void;
  /** Callback to parent to adjust padding/margins depending on active navigation width/height. */
  onChangeLayout: (layout: NavLayout) => void;
  workspaceIntent: WorkspaceIntent;
  evidenceDepth: EvidenceDepth;
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
  onOpenWorkspace,
  onOpenSearch,
  onChangeLayout,
  workspaceIntent,
  evidenceDepth,
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
      whatChanged: 'What changed?',
      observatory: 'Observatory',
      knowledge: 'Knowledge',
      developers: 'Developers',
      integrations: 'Integrations',
      associations: 'Civic Lab',
      leaderboard: 'Signals',
      showcase: 'Showcase',
      atlas: 'Atlas',
      featureAtlas: 'Features',
      roadmap: 'Roadmap',
      trust: 'Trust QA',
      pressKit: 'Press Kit',
      matrix: 'Matrix',
      subscribe: 'Alerts',
      changelog: 'Changes',
      about: 'About',
      assistant: 'AI Chat',
      workspace: 'Workspace',
      workspaceTitle: 'Configure Workspace Active',
      workspaceIntent: {
        citizen: 'Citizen',
        grc: 'GRC / Legal',
        research: 'Research',
        builder: 'Builder',
      },
      evidenceDepth: {
        snapshot: 'Snapshot',
        operational: 'Operational',
        forensic: 'Forensic',
      },
      more: 'More',
      close: 'Close',
      moreTitle: 'Workspace Controls',
      moreSubtitle: 'Public dashboard actions, exports, docs, and QA references.',
      catalogTitle: 'Need the full platform map?',
      catalogBody: 'Atlas keeps features, documentation and specialist surfaces in one browsable index.',
      catalogAction: 'Open Atlas',
      navigationLabel: 'PolicyWatcher command ribbon',
      mobileLabel: 'PolicyWatcher mobile commands',
      quickAccessLabel: 'Workspace quick access',
      language: 'Italiano',
      tooltips: {
        search: 'Search companies, policies and dashboard actions',
        timeline: 'Open the source-verified change timeline',
        whatChanged: 'Check a policy-update email against verified evidence',
        observatory: 'Open the curated policy source observatory',
        knowledge: 'Open server-rendered public company and policy references',
        developers: 'Open public integration documentation and API directory',
        integrations: 'Compare public, enterprise, Microsoft and planned integration paths',
        associations: 'Open the consumer-association public-evidence workspace',
        leaderboard: 'Compare companies by operational evidence signals',
        showcase: 'View the platform overview, workflows and visuals',
        atlas: 'Explore the public platform as an entity-relation graph',
        featureAtlas: 'Trace platform capabilities, dependencies and implementation proof',
        roadmap: 'Review planned features and community priorities',
        trust: 'Open public trust, QA and security evidence',
        pressKit: 'Open product facts, media assets and press contact information',
        matrix: 'Open the cross-company KPI matrix',
        export: 'Export filtered dashboard data',
        methodology: 'Read the methodology and confidence process',
        howTo: 'Open the user guide',
        subscribe: 'Subscribe to policy change alerts',
        changelog: 'See release changes and maintenance notes',
        language: 'Switch dashboard language',
        about: 'Open project and author information',
        assistant: 'Ask the PolicyWatcher assistant',
        workspace: 'Review what is prioritized and configure your workspace',
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
      whatChanged: 'Cosa è cambiato?',
      observatory: 'Observatory',
      knowledge: 'Conoscenza',
      developers: 'Sviluppatori',
      integrations: 'Integrazioni',
      associations: 'Associazioni',
      leaderboard: 'Segnali',
      showcase: 'Vetrina',
      atlas: 'Atlante',
      featureAtlas: 'Funzioni',
      roadmap: 'Roadmap',
      trust: 'Trust QA',
      pressKit: 'Press Kit',
      matrix: 'Matrice',
      subscribe: 'Avvisi',
      changelog: 'Change',
      about: 'Info',
      assistant: 'AI Chat',
      workspace: 'Workspace',
      workspaceTitle: 'Configura Workspace Active',
      workspaceIntent: {
        citizen: 'Cittadino',
        grc: 'GRC / Legal',
        research: 'Ricerca',
        builder: 'Builder',
      },
      evidenceDepth: {
        snapshot: 'Snapshot',
        operational: 'Operativa',
        forensic: 'Forensic',
      },
      more: 'Altro',
      close: 'Chiudi',
      moreTitle: 'Controlli Workspace',
      moreSubtitle: 'Azioni pubbliche, export, documentazione e riferimenti QA.',
      catalogTitle: 'Cerchi la mappa completa?',
      catalogBody: 'L’Atlante raccoglie funzioni, documentazione e superfici specialistiche in un solo indice.',
      catalogAction: 'Apri l’Atlante',
      navigationLabel: 'Barra comandi PolicyWatcher',
      mobileLabel: 'Comandi mobili PolicyWatcher',
      quickAccessLabel: 'Accesso rapido del workspace',
      language: 'English',
      tooltips: {
        search: 'Cerca aziende, policy e azioni della dashboard',
        timeline: 'Apri la timeline delle modifiche verificate',
        whatChanged: 'Verifica una mail di aggiornamento rispetto alle evidenze',
        observatory: 'Apri l osservatorio curato delle fonti policy',
        knowledge: 'Apri i riferimenti pubblici ad aziende e policy renderizzati sul server',
        developers: 'Apri documentazione integrazioni e directory API pubblica',
        integrations: 'Confronta integrazioni pubbliche, enterprise, Microsoft e pianificate',
        associations: 'Apri il workspace di evidenze pubbliche per le associazioni dei consumatori',
        leaderboard: 'Confronta le aziende per segnali di evidenza operativa',
        showcase: 'Guarda overview, workflow e visual della piattaforma',
        atlas: 'Esplora la piattaforma come grafo entita-relazioni',
        featureAtlas: 'Traccia funzionalita, dipendenze ed evidenze implementative',
        roadmap: 'Consulta funzioni pianificate e priorita community',
        trust: 'Apri evidenze pubbliche di trust, QA e sicurezza',
        pressKit: 'Apri dati sul prodotto, asset media e contatti stampa',
        matrix: 'Apri la matrice KPI cross-company',
        export: 'Esporta i dati filtrati della dashboard',
        methodology: 'Leggi metodologia e processo di confidence',
        howTo: 'Apri la guida utente',
        subscribe: 'Iscriviti agli alert sulle modifiche',
        changelog: 'Vedi modifiche di release e note manutentive',
        language: 'Cambia lingua della dashboard',
        about: 'Apri informazioni sul progetto e autore',
        assistant: 'Interroga l’assistente PolicyWatcher',
        workspace: 'Rivedi le priorita e configura il workspace',
        more: 'Apri tutti i controlli',
      },
    },
  }[lang];

  const groups = useMemo<CommandGroup[]>(() => [
    {
      id: 'observe',
      label: t.observe,
      items: [
        { id: 'associations', label: t.associations, tooltip: t.tooltips.associations, icon: Users, href: lang === 'it' ? '/it/associazioni' : '/en/associations' },
        { id: 'timeline', label: t.timeline, tooltip: t.tooltips.timeline, icon: Clock, href: '/timeline' },
        { id: 'observatory', label: t.observatory, tooltip: t.tooltips.observatory, icon: Search, href: '/observatory' },
        { id: 'leaderboard', label: t.leaderboard, tooltip: t.tooltips.leaderboard, icon: BarChart3, href: '/leaderboard' },
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
    lang,
    onOpenAbout,
    onOpenChangelog,
    onOpenExport,
    onOpenHowTo,
    onOpenMatrix,
    onOpenMethodology,
    onOpenSubscribe,
    onToggleLanguage,
    t.about,
    t.associations,
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
    t.leaderboard,
    t.subscribe,
    t.timeline,
    t.tooltips.about,
    t.tooltips.associations,
    t.tooltips.changelog,
    t.tooltips.export,
    t.tooltips.howTo,
    t.tooltips.language,
    t.tooltips.leaderboard,
    t.tooltips.matrix,
    t.tooltips.methodology,
    t.tooltips.observatory,
    t.tooltips.subscribe,
    t.tooltips.timeline,
  ]);

  const catalogCommands = useMemo<CommandItem[]>(() => [
    { id: 'knowledge', label: t.knowledge, tooltip: t.tooltips.knowledge, icon: Layers3, href: '/knowledge' },
    { id: 'developers', label: t.developers, tooltip: t.tooltips.developers, icon: Code2, href: '/developers' },
    { id: 'integrations', label: t.integrations, tooltip: t.tooltips.integrations, icon: Plug, href: '/integrations' },
    { id: 'showcase', label: t.showcase, tooltip: t.tooltips.showcase, icon: Sparkles, href: '/showcase' },
    { id: 'press-kit', label: t.pressKit, tooltip: t.tooltips.pressKit, icon: Newspaper, href: '/press-kit' },
    { id: 'atlas', label: t.atlas, tooltip: t.tooltips.atlas, icon: GitFork, href: '/atlas' },
    { id: 'feature-atlas', label: t.featureAtlas, tooltip: t.tooltips.featureAtlas, icon: Network, href: '/feature-atlas' },
    { id: 'roadmap', label: t.roadmap, tooltip: t.tooltips.roadmap, icon: Cpu, href: '/roadmap' },
    { id: 'trust', label: t.trust, tooltip: t.tooltips.trust, icon: ShieldCheck, href: '/trust' },
  ], [
    t.atlas,
    t.developers,
    t.featureAtlas,
    t.integrations,
    t.knowledge,
    t.pressKit,
    t.roadmap,
    t.showcase,
    t.trust,
    t.tooltips.atlas,
    t.tooltips.developers,
    t.tooltips.featureAtlas,
    t.tooltips.integrations,
    t.tooltips.knowledge,
    t.tooltips.pressKit,
    t.tooltips.roadmap,
    t.tooltips.showcase,
    t.tooltips.trust,
  ]);

  const allCommands = useMemo(
    () => [...groups.flatMap((group) => group.items), ...catalogCommands],
    [catalogCommands, groups],
  );

  const quickActionIds = useMemo(
    () => getWorkspaceQuickActionIds(workspaceIntent),
    [workspaceIntent],
  );
  const quickActions = useMemo(
    () => quickActionIds
      .map((id) => allCommands.find((command) => command.id === id))
      .filter((command): command is CommandItem => Boolean(command)),
    [allCommands, quickActionIds],
  );

  const whatChangedCommand: CommandItem = {
    id: 'what-changed',
    label: t.whatChanged,
    tooltip: t.tooltips.whatChanged,
    icon: MailSearch,
    href: '/what-changed',
    tone: 'accent',
  };

  const workspaceCommand: CommandItem = {
    id: 'workspace',
    label: t.workspace,
    shortLabel: t.workspaceTitle,
    tooltip: t.tooltips.workspace,
    icon: Layers3,
    onClick: onOpenWorkspace,
  };

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

  const renderCommand = (item: CommandItem, mode: 'ribbon' | 'sheet' | 'icon' = 'ribbon') => {
    const Icon = item.icon;
    const className = [
      styles.commandButton,
      item.tone === 'accent' ? styles.commandAccent : '',
      item.tone === 'quiet' ? styles.commandQuiet : '',
      mode === 'sheet' ? styles.sheetCommand : '',
      mode === 'icon' ? styles.iconOnlyCommand : '',
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
      <nav className={styles.controlRibbon} aria-label={t.navigationLabel}>
        <button
          type="button"
          className={styles.ribbonIdentity}
          aria-label={t.tooltips.changelog}
          title={t.tooltips.changelog}
          onClick={onOpenChangelog}
        >
          <span className={styles.identityMark} aria-hidden="true">
            <span />
          </span>
          <span className={styles.identityText}>
            <strong>PolicyWatcher</strong>
            <span>{t.status}</span>
          </span>
        </button>

        {renderCommand(whatChangedCommand, 'icon')}

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

        <div className={styles.quickActions} aria-label={t.quickAccessLabel}>
          {quickActions.map((item) => renderCommand(item))}
        </div>

        <GlobalContextControl className={styles.dashboardContext} compact />

        <button
          type="button"
          className={styles.workspaceButton}
          onClick={onOpenWorkspace}
          aria-label={t.workspaceTitle}
          data-tooltip={t.tooltips.workspace}
          title={t.workspaceTitle}
        >
          <Layers3 size={18} aria-hidden="true" />
          <span>
            <strong>{t.workspace}</strong>
            <small>{t.workspaceIntent[workspaceIntent]} · {t.evidenceDepth[evidenceDepth]}</small>
          </span>
        </button>

        <button
          type="button"
          className={`${styles.commandButton} ${styles.moreButton}`}
          onClick={() => setMoreOpen(true)}
          data-tooltip={t.tooltips.more}
          aria-label={t.more}
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={19} aria-hidden="true" />
          <span className={styles.commandLabel}>{t.more}</span>
        </button>

        {renderCommand(assistantCommand, 'icon')}
      </nav>

      <nav className={styles.mobileCommandBar} aria-label={t.mobileLabel}>
        {renderCommand(whatChangedCommand)}
        {renderCommand(workspaceCommand)}
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

            <div className={styles.sheetStartRow}>
              {renderCommand(whatChangedCommand, 'sheet')}
              {renderCommand(workspaceCommand, 'sheet')}
            </div>

            <div className={styles.sheetGlobalContext}>
              <GlobalContextControl />
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

            <Link href="/atlas" className={styles.sheetCatalog} onClick={() => setMoreOpen(false)}>
              <GitFork size={20} aria-hidden="true" />
              <span>
                <strong>{t.catalogTitle}</strong>
                <small>{t.catalogBody}</small>
              </span>
              <span>{t.catalogAction} <ArrowRight size={15} aria-hidden="true" /></span>
            </Link>

            <div className={styles.sheetFooter}>
              <span>{allCommands.length + 4}</span>
              <span>{isIt ? 'controlli disponibili' : 'available controls'}</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
