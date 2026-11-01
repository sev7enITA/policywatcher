'use client';

/**
 * @file Navigation.tsx
 *
 * Task-based navigation for the public dashboard.
 * Stable entrances lead to a complete, searchable directory; role shortcuts
 * remain available without changing the main navigation order.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { flushSync } from 'react-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Compass,
  ScanLine,
  SlidersHorizontal,
  Rows3,
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
  Menu,
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
import ModalDialog from './ModalDialog';
import { filterNavigationItems, NAVIGATION_COPY, NAVIGATION_GROUPS, NAVIGATION_LANES, navigationGroupFor, type NavigationFilter, type NavigationLane } from '@/lib/navigationDirectory';
import styles from './Navigation.module.css';

export type NavLayout = 'hud' | 'spotlight' | 'sidebar';

interface NavigationProps {
  documentScopeQuery?: string;
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
  mobileLabel?: string;
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
  documentScopeQuery,
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
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [activeLane, setActiveLane] = useState<NavigationFilter>('all');
  const isIt = lang === 'it';

  useEffect(() => {
    onChangeLayout('hud');

    try {
      localStorage.removeItem('policywatcher_nav_layout');
    } catch {
      /* Browser storage can be unavailable in private contexts. */
    }
  }, [onChangeLayout]);

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
      whatChanged: 'Check a notice',
      observatory: 'Observatory',
      knowledge: 'Companies and policies',
      developers: 'Developers',
      integrations: 'Integrations',
      associations: 'Civic Lab',
      leaderboard: 'Signals',
      showcase: 'Showcase',
      atlas: 'Atlas',
      featureAtlas: 'Features',
      roadmap: 'Roadmap',
      trust: 'Trust & quality',
      pressKit: 'Press Kit',
      matrix: 'KPI matrix',
      subscribe: 'Alerts',
      changelog: 'Product updates',
      about: 'About',
      assistant: 'AI Chat',
      workspace: 'Workspace',
      workspaceTitle: 'Configure your workspace',
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
      more: 'All tools',
      close: 'Close',
      moreTitle: 'Find your next step',
      moreSubtitle: 'Three ways into the evidence. Every tool, in one place.',
      catalogTitle: 'Need the full platform map?',
      catalogBody: 'Atlas keeps features, documentation and specialist surfaces in one browsable index.',
      catalogAction: 'Open Atlas',
      navigationLabel: 'PolicyWatcher navigation',
      mobileLabel: 'PolicyWatcher mobile commands',
      quickAccessLabel: 'Workspace quick access',
      language: 'Italiano',
      tooltips: {
        search: 'Search companies, policies and dashboard actions',
        timeline: 'Open the source-verified change timeline',
        whatChanged: 'Check a policy-update email against verified evidence',
        observatory: 'Open the curated policy source observatory',
        knowledge: 'Find a company and read its public policy records',
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
      export: 'Esporta dati',
      methodology: 'Metodo',
      howTo: 'Guida',
      timeline: 'Timeline',
      whatChanged: 'Verifica un avviso',
      observatory: 'Osservatorio',
      knowledge: 'Aziende e policy',
      developers: 'Sviluppatori',
      integrations: 'Integrazioni',
      associations: 'Associazioni',
      leaderboard: 'Segnali',
      showcase: 'Vetrina',
      atlas: 'Atlante',
      featureAtlas: 'Funzioni',
      roadmap: 'Roadmap',
      trust: 'Qualità e verifiche',
      pressKit: 'Press Kit',
      matrix: 'Matrice KPI',
      subscribe: 'Avvisi',
      changelog: 'Novità del prodotto',
      about: 'Info',
      assistant: 'AI Chat',
      workspace: 'Workspace',
      workspaceTitle: 'Configura il tuo spazio',
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
      more: 'Tutti gli strumenti',
      close: 'Chiudi',
      moreTitle: 'Scegli da dove partire',
      moreSubtitle: 'Tre modi per esplorare le evidenze. Ogni strumento, in un solo posto.',
      catalogTitle: 'Cerchi la mappa completa?',
      catalogBody: 'L’Atlante raccoglie funzioni, documentazione e superfici specialistiche in un solo indice.',
      catalogAction: 'Apri l’Atlante',
      navigationLabel: 'Navigazione PolicyWatcher',
      mobileLabel: 'Comandi mobili PolicyWatcher',
      quickAccessLabel: 'Accesso rapido del workspace',
      language: 'English',
      tooltips: {
        search: 'Cerca aziende, policy e strumenti',
        timeline: 'Consulta la cronologia delle modifiche verificate',
        whatChanged: 'Confronta un avviso di aggiornamento con le evidenze disponibili',
        observatory: 'Esplora le fonti delle policy monitorate',
        knowledge: 'Trova un’azienda e consulta le sue policy pubbliche',
        developers: 'Consulta la documentazione delle integrazioni e delle API pubbliche',
        integrations: 'Esplora le integrazioni pubbliche, aziendali, Microsoft e pianificate',
        associations: 'Esplora le evidenze per le associazioni dei consumatori',
        leaderboard: 'Confronta i segnali osservati nelle policy delle aziende',
        showcase: 'Scopri la piattaforma, i percorsi di utilizzo e le presentazioni',
        atlas: 'Esplora la mappa della piattaforma e i collegamenti tra le sezioni',
        featureAtlas: 'Esplora funzionalità, dipendenze e prove di implementazione',
        roadmap: 'Consulta le funzionalità pianificate e le priorità della community',
        trust: 'Consulta le verifiche sulle fonti e sulla sicurezza',
        pressKit: 'Trova informazioni sul prodotto, materiali e contatti per la stampa',
        matrix: 'Confronta gli indicatori delle aziende',
        export: 'Esporta i dati filtrati della dashboard',
        methodology: 'Scopri il metodo e i limiti delle analisi',
        howTo: 'Consulta la guida per usare PolicyWatcher',
        subscribe: 'Ricevi avvisi sulle modifiche alle policy',
        changelog: 'Consulta gli aggiornamenti e le note di manutenzione',
        language: 'Cambia la lingua dell’interfaccia',
        about: 'Scopri il progetto e il suo autore',
        assistant: 'Fai una domanda sulle policy',
        workspace: 'Rivedi le priorità e configura il tuo spazio',
        more: 'Esplora tutti gli strumenti',
      },
    },
  }[lang];

  const groups = useMemo<CommandGroup[]>(() => [
    {
      id: 'observe',
      label: t.observe,
      items: [
        { id: 'per-te', label: lang === 'it' ? 'Per te' : 'For you', tooltip: lang === 'it' ? 'Segui i tuoi servizi e annota le tue scelte' : 'Follow your services and record your choices', icon: User, href: lang === 'it' ? '/per-te' : '/per-te?lang=en' },
        { id: 'associations', label: t.associations, tooltip: t.tooltips.associations, icon: Users, href: lang === 'it' ? '/it/associazioni' : '/en/associations' },
        { id: 'timeline', label: t.timeline, tooltip: t.tooltips.timeline, icon: Clock, href: documentScopeQuery ? `/timeline?documents=${encodeURIComponent(documentScopeQuery)}` : '/timeline' },
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
    documentScopeQuery,
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
    mobileLabel: isIt ? 'Verifica' : 'Check',
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
  };

  const searchCommand: CommandItem = {
    id: 'search',
    label: t.search,
    shortLabel: t.searchTitle,
    tooltip: t.tooltips.search,
    icon: Search,
    onClick: onOpenSearch,
  };

  const directoryCommands = [...allCommands, whatChangedCommand, workspaceCommand, assistantCommand, searchCommand];
  const visibleCommands = filterNavigationItems(directoryCommands, directoryQuery, activeLane);
  const directoryGroups = NAVIGATION_GROUPS.map((id) => ({
    id,
    ...NAVIGATION_COPY[id][lang],
    items: visibleCommands.filter((item) => navigationGroupFor(item.id) === id),
  })).filter((group) => group.items.length > 0);
  const laneIcons = { monitor: ScanLine, compare: Rows3, understand: BookOpen };

  const openDirectory = (lane: NavigationFilter = 'all') => {
    setDirectoryQuery('');
    setActiveLane(lane);
    setMoreOpen(true);
  };

  const runCommand = (item: CommandItem) => {
    // Unmount the directory and restore focus before another dialog takes over.
    if (moreOpen) flushSync(() => setMoreOpen(false));
    item.onClick?.();
  };

  const renderCommand = (item: CommandItem, mode: 'ribbon' | 'sheet' | 'icon' | 'mobile' | 'quick' = 'ribbon') => {
    const Icon = item.icon;
    const className = [
      styles.commandButton,
      item.tone === 'accent' ? styles.commandAccent : '',
      mode === 'sheet' ? styles.sheetCommand : '',
      mode === 'quick' ? styles.quickCommand : '',
      mode === 'icon' ? styles.iconOnlyCommand : '',
    ].filter(Boolean).join(' ');
    const content = (
      <>
        <Icon size={18} aria-hidden="true" />
        <span className={styles.commandText}>
          <span className={styles.commandLabel}>{mode === 'mobile' ? item.mobileLabel ?? item.label : item.label}</span>
          {mode === 'sheet' && <small>{item.tooltip}</small>}
        </span>
        {mode === 'sheet' && <ArrowRight size={15} className={styles.commandArrow} aria-hidden="true" />}
      </>
    );
    const shared = { className, title: mode === 'sheet' ? undefined : item.tooltip, 'aria-label': item.shortLabel ?? item.label };
    if (item.href) {
      return <Link key={item.id} href={item.href} {...shared} onClick={() => setMoreOpen(false)}>{content}</Link>;
    }
    return <button key={item.id} type="button" {...shared} onClick={() => runCommand(item)}>{content}</button>;
  };

  const laneButton = (lane: NavigationLane, mobile = false) => {
    const Icon = laneIcons[lane];
    const copy = NAVIGATION_COPY[lane][lang];
    return (
      <button
        key={lane}
        type="button"
        className={styles.laneButton}
        onClick={() => openDirectory(lane)}
        aria-haspopup="dialog"
        aria-expanded={moreOpen && activeLane === lane}
        title={copy.description}
      >
        <Icon size={mobile ? 20 : 17} aria-hidden="true" />
        <span>{copy.label}</span>
      </button>
    );
  };

  const renderQuickAccess = (position: 'top' | 'bottom') => !directoryQuery.trim() && activeLane === 'all' && (
    <div className={`${styles.quickAccess} ${position === 'top' ? styles.quickAccessTop : styles.quickAccessBottom}`}>
      <span><SlidersHorizontal size={15} aria-hidden="true" />{isIt ? 'Per il tuo spazio' : 'For your workspace'} <strong>{t.workspaceIntent[workspaceIntent]} · {t.evidenceDepth[evidenceDepth]}</strong></span>
      <div>{quickActions.map((item) => renderCommand(item, 'quick'))}</div>
    </div>
  );

  return (
    <>
      <nav className={styles.controlRibbon} aria-label={t.navigationLabel}>
        <button type="button" className={styles.ribbonIdentity} aria-label={t.tooltips.changelog} title={t.tooltips.changelog} onClick={onOpenChangelog}>
          <Image src="/logo-mark.png" alt="" width={30} height={30} className={styles.identityMark} />
          <span className={styles.identityText}><strong>PolicyWatcher</strong><span>{t.status}</span></span>
        </button>
        <div className={styles.laneEntrances}>{NAVIGATION_LANES.map((lane) => laneButton(lane))}</div>
        {renderCommand(whatChangedCommand, 'icon')}
        <button type="button" className={`${styles.commandButton} ${styles.searchButton}`} onClick={onOpenSearch} title={t.tooltips.search} aria-label={t.searchTitle}>
          <Search size={18} aria-hidden="true" /><span>{t.search}</span><kbd>⌘ / Ctrl K</kbd>
        </button>
        <button type="button" className={`${styles.commandButton} ${styles.moreButton}`} onClick={() => openDirectory()} aria-haspopup="dialog" aria-expanded={moreOpen}>
          <Menu size={19} aria-hidden="true" /><span>{t.more}</span>
        </button>
      </nav>

      <nav className={styles.mobileCommandBar} aria-label={t.mobileLabel}>
        {NAVIGATION_LANES.map((lane) => laneButton(lane, true))}
        <button type="button" className={styles.mobileMoreButton} onClick={() => openDirectory()} aria-label={t.more} aria-haspopup="dialog" aria-expanded={moreOpen}>
          <Menu size={20} aria-hidden="true" /><span>{isIt ? 'Strumenti' : 'All tools'}</span>
        </button>
      </nav>

      {moreOpen && (
        <ModalDialog label={t.moreTitle} className={styles.directoryLayer} onRequestClose={() => setMoreOpen(false)}>
          <section className={styles.directory}>
            <header className={styles.sheetHeader}>
              <div>
                <span className={styles.eyebrow}><Compass size={14} aria-hidden="true" /> {isIt ? 'La tua bussola' : 'Your evidence compass'}</span>
                <h2>{t.moreTitle}</h2>
                <p>{t.moreSubtitle}</p>
              </div>
              <button type="button" className={styles.sheetCloseButton} onClick={() => setMoreOpen(false)} aria-label={t.close}><X size={21} aria-hidden="true" /></button>
            </header>

            <div className={styles.directoryToolbar}>
              <label className={styles.toolSearch}>
                <Search size={19} aria-hidden="true" />
                <span className={styles.srOnly}>{isIt ? 'Trova uno strumento' : 'Find a tool'}</span>
                <input value={directoryQuery} type="search" placeholder={isIt ? 'Trova uno strumento…' : 'Find a tool…'} onChange={(event) => setDirectoryQuery(event.target.value)} />
              </label>
              <GlobalContextControl fallbackLang={lang} />
            </div>

            <div className={styles.filterBar} aria-label={isIt ? 'Filtra gli strumenti' : 'Filter tools'}>
              <button type="button" aria-pressed={!directoryQuery.trim() && activeLane === 'all'} onClick={() => { setActiveLane('all'); setDirectoryQuery(''); }}>{t.more}<span>{directoryCommands.length}</span></button>
              {NAVIGATION_LANES.map((lane) => <button key={lane} type="button" aria-pressed={!directoryQuery.trim() && activeLane === lane} onClick={() => { setDirectoryQuery(''); setActiveLane(lane); }}>{NAVIGATION_COPY[lane][lang].label}</button>)}
            </div>

            <div className={styles.directoryBody}>
              {renderQuickAccess('top')}
              <p className={styles.resultCount} role="status" aria-live="polite">
                {directoryQuery.trim()
                  ? `${visibleCommands.length} ${isIt
                    ? (visibleCommands.length === 1 ? 'risultato in tutti gli strumenti' : 'risultati in tutti gli strumenti')
                    : (visibleCommands.length === 1 ? 'result across all tools' : 'results across all tools')}`
                  : activeLane !== 'all' ? NAVIGATION_COPY[activeLane][lang].description : isIt ? 'Scegli un percorso. Puoi passare da uno all’altro in qualsiasi momento.' : 'Choose a starting point. Move between them whenever you need.'}
              </p>
              {visibleCommands.length === 0 ? (
                <div className={styles.emptyState}>
                  <Search size={28} aria-hidden="true" />
                  <h3>{isIt ? 'Nessuno strumento trovato' : 'No matching tools'}</h3>
                  <p>{isIt ? 'Prova “avvisi”, “fonti” o “esporta”. Puoi cercare anche in inglese.' : 'Try “alerts”, “sources” or “export”. Italian terms work too.'}</p>
                  <button type="button" onClick={() => { setDirectoryQuery(''); setActiveLane('all'); }}>{isIt ? 'Mostra tutti gli strumenti' : 'Show all tools'}</button>
                </div>
              ) : (
                <div className={styles.sheetGroups} data-filtered={activeLane !== 'all' && !directoryQuery.trim()}>
                  {directoryGroups.map((group) => (
                    <section key={group.id} className={styles.sheetGroup} data-group={group.id} aria-label={group.label}>
                      <header className={styles.groupHeader}>
                        {NAVIGATION_LANES.includes(group.id as NavigationLane) && <span className={styles.laneNumber} aria-hidden="true">0{NAVIGATION_LANES.indexOf(group.id as NavigationLane) + 1}</span>}
                        <div><h3>{group.label}</h3><p>{group.description}</p></div>
                      </header>
                      <div className={styles.sheetGrid}>{group.items.map((item) => renderCommand(item, 'sheet'))}</div>
                    </section>
                  ))}
                </div>
              )}
              {renderQuickAccess('bottom')}
            </div>
            <footer className={styles.sheetFooter}>
              <span>PolicyWatcher <span aria-hidden="true">/</span> {isIt ? 'Dalle fonti alla comprensione' : 'From sources to understanding'}</span>
              <button type="button" onClick={() => runCommand(searchCommand)}><Search size={15} aria-hidden="true" />{isIt ? 'Cerchi un’azienda o una policy?' : 'Looking for a company or policy?'}<ArrowRight size={14} aria-hidden="true" /></button>
            </footer>
          </section>
        </ModalDialog>
      )}
    </>
  );
}
