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
  Bell,
  BookOpen,
  ChevronUp,
  Clock,
  Cpu,
  Download,
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
      status: 'v3.5 QA',
      search: 'Search',
      searchTitle: 'Search actions',
      export: 'Export',
      methodology: 'Methodology',
      howTo: 'How to',
      timeline: 'Timeline',
      showcase: 'Showcase',
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
    },
    it: {
      observe: 'Osserva',
      audit: 'Audita',
      operate: 'Opera',
      status: 'v3.5 QA',
      search: 'Cerca',
      searchTitle: 'Cerca azioni',
      export: 'Export',
      methodology: 'Metodo',
      howTo: 'Guida',
      timeline: 'Timeline',
      showcase: 'Vetrina',
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
    },
  }[lang];

  const groups = useMemo<CommandGroup[]>(() => [
    {
      id: 'observe',
      label: t.observe,
      items: [
        { id: 'timeline', label: t.timeline, icon: Clock, href: '/timeline' },
        { id: 'showcase', label: t.showcase, icon: Sparkles, href: '/showcase' },
        { id: 'roadmap', label: t.roadmap, icon: Cpu, href: '/roadmap' },
        { id: 'trust', label: t.trust, icon: ShieldCheck, href: '/trust' },
      ],
    },
    {
      id: 'audit',
      label: t.audit,
      items: [
        { id: 'matrix', label: t.matrix, icon: Grid3X3, onClick: onOpenMatrix },
        { id: 'export', label: t.export, icon: Download, onClick: onOpenExport },
        { id: 'methodology', label: t.methodology, icon: BookOpen, onClick: onOpenMethodology },
        { id: 'how-to', label: t.howTo, icon: HelpCircle, onClick: onOpenHowTo },
      ],
    },
    {
      id: 'operate',
      label: t.operate,
      items: [
        { id: 'subscribe', label: t.subscribe, icon: Bell, onClick: onOpenSubscribe },
        { id: 'changelog', label: t.changelog, icon: History, onClick: onOpenChangelog },
        { id: 'language', label: t.language, icon: Languages, onClick: onToggleLanguage, tone: 'quiet' },
        { id: 'about', label: t.about, icon: User, onClick: onOpenAbout, tone: 'quiet' },
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
    t.audit,
    t.changelog,
    t.export,
    t.howTo,
    t.language,
    t.matrix,
    t.methodology,
    t.observe,
    t.operate,
    t.roadmap,
    t.showcase,
    t.subscribe,
    t.timeline,
    t.trust,
  ]);

  const allCommands = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const assistantCommand: CommandItem = {
    id: 'assistant',
    label: t.assistant,
    icon: Zap,
    onClick: onOpenAssistant,
    tone: 'accent',
  };

  const searchCommand: CommandItem = {
    id: 'search',
    label: t.search,
    shortLabel: t.searchTitle,
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
          title={t.searchTitle}
          aria-label={t.searchTitle}
        >
          <Search size={18} aria-hidden="true" />
          <span className={styles.commandLabel}>{t.search}</span>
          <kbd className={styles.commandKbd}>⌘K</kbd>
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
