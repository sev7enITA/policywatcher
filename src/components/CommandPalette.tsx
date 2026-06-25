'use client';

/**
 * PolicyWatcher - Command Palette (⌘K / Ctrl+K)
 *
 * A Raycast/Linear-style command palette for fast navigation:
 *  - Jump to a company
 *  - Toggle filters (risk level, industry, region, perspective)
 *  - Switch language
 *  - Open actions (export, subscribe, methodology, matrix, assistant)
 *
 * Keyboard:
 *  - ⌘K / Ctrl+K  open/close
 *  - ↑ / ↓        navigate
 *  - Enter        run
 *  - Esc          close
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Building2,
  SlidersHorizontal,
  Languages,
  Zap,
  Bell,
  Download,
  Grid3X3,
  BookOpen,
  ShieldAlert,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  HelpCircle,
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
  /** Grouping category — controls the section header in the results list. */
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
  /** Full company list — used to build navigation commands dynamically. */
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
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
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
    if (activeIndex >= filtered.length) setActiveIndex(0);
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

  if (!isOpen) return null;

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
