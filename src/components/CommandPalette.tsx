'use client';

/**
 * PolicyWatcher - Command Palette (Cmd+K / Ctrl+K)
 *
 * A Raycast/Linear-style command palette for fast navigation:
 *  - Jump to a company
 *  - Toggle filters (risk level, industry, region, perspective)
 *  - Switch language
 *  - Open actions (export, subscribe, methodology, matrix, assistant)
 *
 * Keyboard:
 *  - Cmd+K / Ctrl+K  open/close
 *  - ↑ / ↓        navigate
 *  - Enter        run
 *  - Esc          close
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BarChart3,
  Search,
  Building2,
  SlidersHorizontal,
  Languages,
  Zap,
  Bell,
  Download,
  Grid3X3,
  GitFork,
  Network,
  BookOpen,
  ShieldAlert,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Cpu,
  Code2,
  ShieldCheck,
  Newspaper,
  UserRound,
  Link2,
  Plug,
  FolderKanban,
} from 'lucide-react';
import styles from './CommandPalette.module.css';
import type { Company, Lang } from '@/types';

/**
 * Describes a single executable entry inside the command palette.
 * Commands are grouped visually and searched by label, hint, and keywords.
 */
interface Command {
  /** Unique stable identifier, e.g. `act-export` or `nav-google`. */
  id: string;
  /** Display label in English (always present). */
  label: string;
  /** Optional Italian translation of the label. */
  labelIt?: string;
  /** Short badge shown to the right (e.g. "CSV", "AI Q&A"). */
  hint?: string;
  /** Icon rendered before the label. */
  icon: React.ReactNode;
  /** Grouping category controls the section header in the results list. */
  group: 'navigation' | 'filters' | 'actions';
  /** Space-separated tokens used for fuzzy-ish search matching. */
  keywords?: string;
  /** Action executed when the command is selected. */
  run: () => void;
}

/**
 * Props for the {@link CommandPalette} component.
 *
 * Callbacks prefixed with `onOpen*` launch the corresponding modal;
 * `onSet*` callbacks apply dashboard-level filters.
 */
interface CommandPaletteProps {
  /** Whether the palette overlay is visible. */
  isOpen: boolean;
  /** Dismiss the palette (Escape, backdrop click, or after running a command). */
  onClose: () => void;
  /** Full company list used to build navigation commands dynamically. */
  companies: Company[];
  /** Current UI language. */
  lang: Lang;
  onToggleLanguage: () => void;
  onOpenAssistant: () => void;
  onOpenSubscribe: () => void;
  onOpenExport: () => void;
  onOpenMatrix: () => void;
  onOpenMethodology: () => void;
  onOpenHowTo: () => void;
  /** Copy the canonical URL for the currently configured dashboard evidence view. */
  onCopyView: () => void;
  /** Navigate the dashboard to a specific company card. */
  onSelectCompany: (companyId: string) => void;
  onSetIndustry: (industry: string) => void;
  onSetRisk: (risk: string) => void;
  onSetRegion: (region: 'EU' | 'US' | 'Global') => void;
  onSetPerspective: (p: 'Individual' | 'Enterprise') => void;
  onClearFilters: () => void;
}

/**
 * Raycast / Linear-style command palette overlay.
 *
 * Provides instant keyboard-driven access to navigation, filter, and
 * action commands. Fully searchable and navigable via arrow keys.
 *
 * @param props - {@link CommandPaletteProps}
 * @returns The palette overlay when open; `null` otherwise.
 */
export default function CommandPalette({
  isOpen,
  onClose,
  companies,
  lang,
  onToggleLanguage,
  onOpenAssistant,
  onOpenSubscribe,
  onOpenExport,
  onOpenMatrix,
  onOpenMethodology,
  onOpenHowTo,
  onCopyView,
  onSelectCompany,
  onSetIndustry,
  onSetRisk,
  onSetRegion,
  onSetPerspective,
  onClearFilters,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isIt = lang === 'it';

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setQuery('');
        setActiveIndex(0);
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Build the command list
  const commands = useMemo<Command[]>(() => {
    const actions: Command[] = [
      {
        id: 'act-assistant',
        label: 'Open Policy Live Assistant',
        labelIt: 'Apri Policy Live Assistant',
        hint: 'AI Q&A',
        icon: <Zap size={16} />,
        group: 'actions',
        keywords: 'chat ai ask question gemini',
        run: () => {
          onOpenAssistant();
          onClose();
        },
      },
      {
        id: 'act-export',
        label: 'Export dashboard as CSV',
        labelIt: 'Esporta dashboard come CSV',
        hint: 'CSV',
        icon: <Download size={16} />,
        group: 'actions',
        keywords: 'csv download file export',
        run: () => {
          onOpenExport();
          onClose();
        },
      },
      {
        id: 'act-copy-view',
        label: 'Copy configured dashboard view',
        labelIt: 'Copia la vista dashboard configurata',
        hint: 'URL',
        icon: <Link2 size={16} />,
        group: 'actions',
        keywords: 'copy share link url deep link configured view dashboard filters',
        run: () => {
          onCopyView();
          onClose();
        },
      },
      {
        id: 'act-matrix',
        label: 'Open KPI Matrix',
        labelIt: 'Apri Matrice KPI',
        hint: 'Cross-company',
        icon: <Grid3X3 size={16} />,
        group: 'actions',
        keywords: 'kpi matrix compare cross',
        run: () => {
          onOpenMatrix();
          onClose();
        },
      },
      {
        id: 'act-subscribe',
        label: 'Subscribe to alerts',
        labelIt: 'Iscriviti alle notifiche',
        icon: <Bell size={16} />,
        group: 'actions',
        keywords: 'email newsletter alerts notify',
        run: () => {
          onOpenSubscribe();
          onClose();
        },
      },
      {
        id: 'act-methodology',
        label: 'View methodology',
        labelIt: 'Vedi metodologia',
        icon: <BookOpen size={16} />,
        group: 'actions',
        keywords: 'how kpi score risk methodology',
        run: () => {
          onOpenMethodology();
          onClose();
        },
      },
      {
        id: 'act-about',
        label: 'About PolicyWatcher',
        labelIt: 'PolicyWatcher: progetto e autore',
        icon: <UserRound size={16} />,
        group: 'actions',
        keywords: 'about author autore creator fabrizio degni project contact github open source',
        run: () => {
          window.location.href = '/about';
        },
      },
      {
        id: 'act-atlas',
        label: 'Open Site Atlas',
        labelIt: 'Apri Atlante del sito',
        icon: <GitFork size={16} />,
        group: 'actions',
        keywords: 'atlas sitemap map graph entity relation navigation explore sections architecture',
        run: () => {
          window.location.href = '/atlas';
        },
      },
      {
        id: 'act-feature-atlas',
        label: 'Open Feature Intelligence Atlas',
        labelIt: 'Apri Atlante delle funzionalità',
        icon: <Network size={16} />,
        group: 'actions',
        keywords: 'feature atlas capability dependency operational constellation evidence chain kpi kri implementation proof',
        run: () => {
          window.location.href = '/feature-atlas';
        },
      },
      {
        id: 'act-knowledge',
        label: 'Open Public Knowledge',
        labelIt: 'Apri Conoscenza pubblica',
        icon: <BookOpen size={16} />,
        group: 'actions',
        keywords: 'knowledge company policy reference crawlable server rendered ssr evidence public',
        run: () => {
          window.location.href = '/knowledge';
        },
      },
      {
        id: 'act-observatory',
        label: 'Open Observatory',
        labelIt: 'Apri Osservatorio',
        icon: <Search size={16} />,
        group: 'actions',
        keywords: 'observatory osservatorio fonti sources registry news events regulatory privacy governance ieee oecd edpb nist ftc ico',
        run: () => {
          window.location.href = '/observatory';
        },
      },
      {
        id: 'act-developers',
        label: 'Open Developer Directory',
        labelIt: 'Apri Directory per sviluppatori',
        icon: <Code2 size={16} />,
        group: 'actions',
        keywords: 'developer sviluppatori api integration integrations manifest json cors webhook observatory builder',
        run: () => {
          window.location.href = '/developers';
        },
      },
      {
        id: 'act-collections',
        label: 'Open Evidence Collections',
        labelIt: 'Apri Raccolte di evidenze',
        icon: <FolderKanban size={16} />,
        group: 'actions',
        keywords: 'collections collection bundle briefing review local share ids markdown json csv evidence',
        run: () => {
          window.location.href = '/collections';
        },
      },
      {
        id: 'act-integrations',
        label: 'Open Integration Options',
        labelIt: 'Apri opzioni di integrazione',
        icon: <Plug size={16} />,
        group: 'actions',
        keywords: 'integration integrations enterprise azure entra apim power platform connector teams copilot mcp marketplace api v1 v2',
        run: () => {
          window.location.href = '/integrations';
        },
      },
      {
        id: 'act-roadmap',
        label: 'View Community Roadmap',
        labelIt: 'Vedi la roadmap community',
        icon: <Cpu size={16} />,
        group: 'actions',
        keywords: 'roadmap community signal next releases evolution program confidence adaptive dashboard',
        run: () => {
          window.location.href = '/roadmap';
        },
      },
      {
        id: 'act-press',
        label: 'Open Press Wall',
        labelIt: 'Apri Press Wall',
        icon: <Newspaper size={16} />,
        group: 'actions',
        keywords: 'press media mentions coverage articles linkedin community talked about policywatcher',
        run: () => {
          window.location.href = '/press';
        },
      },
      {
        id: 'act-press-kit',
        label: 'Open Press Kit',
        labelIt: 'Apri Press Kit',
        icon: <Newspaper size={16} />,
        group: 'actions',
        keywords: 'press kit media facts assets downloads contact newsroom stampa scheda',
        run: () => {
          window.location.href = '/press-kit';
        },
      },
      {
        id: 'act-pulse',
        label: 'Open Editorial Pulse',
        labelIt: 'Apri Pulse editoriale',
        icon: <Newspaper size={16} />,
        group: 'actions',
        keywords: 'pulse story leads journalists story pack social cards editorial newsroom',
        run: () => {
          window.location.href = '/pulse';
        },
      },
      {
        id: 'act-trust',
        label: 'View Trust & Quality Evidence',
        labelIt: 'Vedi evidenze qualità e fiducia',
        icon: <ShieldCheck size={16} />,
        group: 'actions',
        keywords: 'trust quality evidence qa dataset assurance confidence ci codeql scorecard badges security',
        run: () => {
          window.location.href = '/trust';
        },
      },
      {
        id: 'act-leaderboard',
        label: 'Open Policy Signals Board',
        labelIt: 'Apri Policy Signals Board',
        icon: <BarChart3 size={16} />,
        group: 'actions',
        keywords: 'leaderboard signals evidence source coverage public evidence confidence board',
        run: () => {
          window.location.href = '/leaderboard';
        },
      },
      {
        id: 'act-howto',
        label: 'Open onboarding guide (How To)',
        labelIt: 'Apri guida di onboarding (How To)',
        icon: <HelpCircle size={16} />,
        group: 'actions',
        keywords: 'howto onboarding guide help tutorial directions info manual',
        run: () => {
          onOpenHowTo();
          onClose();
        },
      },
      {
        id: 'act-language',
        label: isIt ? 'Switch to English' : "Passa all'italiano",
        icon: <Languages size={16} />,
        group: 'actions',
        keywords: 'language en it italiano english',
        run: () => {
          onToggleLanguage();
          onClose();
        },
      },
    ];

    const filterCommands: Command[] = [
      {
        id: 'filter-clear',
        label: 'Clear all filters',
        labelIt: 'Pulisci tutti i filtri',
        icon: <SlidersHorizontal size={16} />,
        group: 'filters',
        keywords: 'reset clear remove filters',
        run: () => {
          onClearFilters();
          onClose();
        },
      },
      ...(['EU', 'US', 'Global'] as const).map((r) => ({
        id: `filter-region-${r}`,
        label: `Region: ${r}`,
        labelIt: `Regione: ${r}`,
        icon: <SlidersHorizontal size={16} />,
        group: 'filters' as const,
        keywords: `region ${r} jurisdiction`,
        run: () => {
          onSetRegion(r);
          onClose();
        },
      })),
      ...(['Individual', 'Enterprise'] as const).map((p) => ({
        id: `filter-persp-${p}`,
        label: `Audience: ${p}`,
        labelIt: `Audience: ${p === 'Individual' ? 'Privato' : 'Azienda'}`,
        icon: <SlidersHorizontal size={16} />,
        group: 'filters' as const,
        keywords: `perspective audience ${p}`,
        run: () => {
          onSetPerspective(p);
          onClose();
        },
      })),
      ...(['High', 'Medium', 'Low'] as const).map((r) => ({
        id: `filter-risk-${r}`,
        label: `Risk: ${r}`,
        labelIt: `Rischio: ${r === 'High' ? 'Alto' : r === 'Medium' ? 'Medio' : 'Basso'}`,
        icon: <ShieldAlert size={16} />,
        group: 'filters' as const,
        keywords: `risk ${r}`,
        run: () => {
          onSetRisk(r);
          onClose();
        },
      })),
      ...[
        'Tech Giant',
        'FinTech',
        'Social Media',
        'E-Commerce',
        'AI Provider',
        'Cloud/SaaS',
      ].map((ind) => ({
        id: `filter-ind-${ind}`,
        label: `Industry: ${ind}`,
        labelIt: `Settore: ${ind}`,
        icon: <Building2 size={16} />,
        group: 'filters' as const,
        keywords: `industry sector ${ind}`,
        run: () => {
          onSetIndustry(ind);
          onClose();
        },
      })),
    ];

    const companyCommands: Command[] = (companies || [])
      .filter((c) => c && c.id && c.name)
      .map((c) => ({
        id: `nav-${c.id}`,
        label: `Go to ${c.name}`,
        labelIt: `Vai a ${c.name}`,
        hint: c.industry || '',
        icon: <Building2 size={16} />,
        group: 'navigation',
        keywords: `${c.name} ${c.industry || ''} ${c.slug || ''}`,
        run: () => {
          onSelectCompany(c.id);
          onClose();
        },
      }));

    return [...actions, ...filterCommands, ...companyCommands];
  }, [
    companies,
    isIt,
    onOpenAssistant,
    onOpenExport,
    onOpenMatrix,
    onOpenMethodology,
    onOpenSubscribe,
    onOpenHowTo,
    onCopyView,
    onSelectCompany,
    onClearFilters,
    onSetIndustry,
    onSetPerspective,
    onSetRegion,
    onSetRisk,
    onToggleLanguage,
    onClose,
  ]);

  // Filter by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.labelIt || ''} ${
        cmd.keywords || ''
      } ${cmd.hint || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= filtered.length) {
      queueMicrotask(() => setActiveIndex(0));
    }
  }, [filtered, activeIndex]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runActive = useCallback(() => {
    const cmd = filtered[activeIndex];
    if (cmd) cmd.run();
  }, [filtered, activeIndex]);

  // Keyboard navigation inside the palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runActive();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filtered.length, runActive, onClose]
  );

  // Group results for rendering
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach((cmd) => {
      const arr = map.get(cmd.group) || [];
      arr.push(cmd);
      map.set(cmd.group, arr);
    });
    return map;
  }, [filtered]);

  const groupLabels: Record<string, string> = isIt
    ? { actions: 'Azioni', filters: 'Filtri', navigation: 'Navigazione' }
    : { actions: 'Actions', filters: 'Filters', navigation: 'Navigation' };

  // All hooks must be called before this point (Rules of Hooks).
  if (!isOpen) return null;


  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={
              isIt
                ? "Cerca un'azienda, un filtro o un'azione..."
                : 'Search a company, filter, or action...'
            }
            className={styles.input}
            aria-label="Command palette search"
          />
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        {/* Results */}
        <div className={styles.results} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <Search size={28} className={styles.emptyIcon} />
              <p>{isIt ? 'Nessun risultato' : 'No results found'}</p>
            </div>
          ) : (
            Array.from(groups.entries()).map(([group, cmds]) => (
              <div key={group} className={styles.group}>
                <div className={styles.groupLabel}>{groupLabels[group]}</div>
                {cmds.map((cmd) => {
                  const idx = filtered.indexOf(cmd);
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => cmd.run()}
                      className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                    >
                      <span className={styles.itemIcon}>{cmd.icon}</span>
                      <span className={styles.itemLabel}>
                        {isIt && cmd.labelIt ? cmd.labelIt : cmd.label}
                      </span>
                      {cmd.hint && <span className={styles.itemHint}>{cmd.hint}</span>}
                      {isActive && (
                        <span className={styles.itemReturn}>
                          <CornerDownLeft size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <kbd className={styles.kbd}>
              <ArrowUp size={11} />
              <ArrowDown size={11} />
            </kbd>
            {isIt ? 'naviga' : 'navigate'}
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.kbd}>
              <CornerDownLeft size={12} />
            </kbd>
            {isIt ? 'seleziona' : 'select'}
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.kbd}>esc</kbd>
            {isIt ? 'chiudi' : 'close'}
          </span>
        </div>
      </div>
    </div>
  );
}
