'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Compass, Menu, X } from 'lucide-react';
import GlobalContextControl, { useGlobalContext } from './GlobalContextControl';
import { NAVIGATION_COPY, NAVIGATION_GROUPS, NAVIGATION_LANES, navigationGroupFor, type NavigationLane } from '@/lib/navigationDirectory';
import styles from './PublicHeader.module.css';

export type PublicSection =
  | 'per-te'
  | 'associations'
  | 'knowledge'
  | 'guides'
  | 'collections'
  | 'evidence'
  | 'signals'
  | 'infographics'
  | 'trust'
  | 'legal'
  | 'about'
  | 'atlas'
  | 'feature-atlas'
  | 'methodology'
  | 'observatory'
  | 'developers'
  | 'integrations'
  | 'press'
  | 'press-kit'
  | 'privacy'
  | 'pulse'
  | 'roadmap'
  | 'security'
  | 'showcase'
  | 'timeline'
  | 'what-changed';

interface PublicHeaderProps {
  current: PublicSection;
  lang?: 'en' | 'it';
  lockLang?: boolean;
}

const links: Array<{ id: PublicSection; href: string; en: string; it: string }> = [
  { id: 'what-changed', href: '/what-changed', en: 'Check a notice', it: 'Verifica un avviso' },
  { id: 'methodology', href: '/methodology/confidence', en: 'Method and sources', it: 'Metodo e fonti' },
  { id: 'per-te', href: '/per-te', en: 'For you', it: 'Per te' },
  { id: 'associations', href: '/en/associations', en: 'Civic Lab', it: 'Associazioni' },
  { id: 'guides', href: '/guides', en: 'Guides', it: 'Guide' },
  { id: 'knowledge', href: '/knowledge', en: 'Companies and policies', it: 'Aziende e policy' },
  { id: 'collections', href: '/collections', en: 'Collections', it: 'Raccolte' },
  { id: 'evidence', href: '/evidence', en: 'Evidence', it: 'Evidenze' },
  { id: 'signals', href: '/leaderboard', en: 'Signals', it: 'Segnali' },
  { id: 'infographics', href: '/infographics', en: 'Infographics', it: 'Infografiche' },
  { id: 'trust', href: '/trust', en: 'Trust & quality', it: 'Qualità e verifiche' },
  { id: 'pulse', href: '/pulse', en: 'Pulse', it: 'Pulse' },
  { id: 'press-kit', href: '/press-kit', en: 'Press Kit', it: 'Press Kit' },
  { id: 'legal', href: '/terms', en: 'Terms', it: 'Termini' },
  { id: 'timeline', href: '/timeline', en: 'Change timeline', it: 'Cronologia modifiche' },
  { id: 'observatory', href: '/observatory', en: 'Source observatory', it: 'Osservatorio fonti' },
  { id: 'developers', href: '/developers', en: 'Developers', it: 'Sviluppatori' },
  { id: 'integrations', href: '/integrations', en: 'Integrations', it: 'Integrazioni' },
  { id: 'atlas', href: '/atlas', en: 'Site Atlas', it: 'Mappa del sito' },
  { id: 'feature-atlas', href: '/feature-atlas', en: 'Features', it: 'Funzionalità' },
  { id: 'roadmap', href: '/roadmap', en: 'Roadmap', it: 'Roadmap' },
  { id: 'showcase', href: '/showcase', en: 'Showcase', it: 'Vetrina' },
  { id: 'about', href: '/about', en: 'About the project', it: 'Il progetto' },
];

export default function PublicHeader({ current, lang = 'en', lockLang = false }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const primaryIds: PublicSection[] = ['what-changed', 'knowledge', 'guides', 'methodology'];
  const globalContext = useGlobalContext(lang, lockLang ? lang : undefined);
  const activeLang = lockLang ? lang : globalContext.ready ? globalContext.lang : lang;
  const publicGroups = NAVIGATION_GROUPS.map((id) => ({
    id,
    ...NAVIGATION_COPY[id][activeLang],
    label: id === 'settings' ? activeLang === 'it' ? 'Informazioni' : 'Information' : NAVIGATION_COPY[id][activeLang].label,
    items: links.filter((link) => navigationGroupFor(link.id) === id),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolsRef.current?.contains(event.target) && toolsRef.current) {
        toolsRef.current.open = false;
      }
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, []);

  function localizedHref(link: typeof links[number]) {
    if (link.id === 'per-te') return activeLang === 'it' ? '/per-te' : '/per-te?lang=en';
    if (link.id === 'associations') return activeLang === 'it' ? '/it/associazioni' : '/en/associations';
    if (link.id === 'guides' && activeLang === 'it') return '/guides?lang=it';
    return link.href;
  }

  function closeNavigation() {
    setMobileOpen(false);
    if (toolsRef.current) toolsRef.current.open = false;
  }

  return (
    <header
      className={styles.header}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileOpen) {
          closeNavigation();
          menuRef.current?.focus();
        }
      }}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="PolicyWatcher home">
          <Image src="/logo-mark.png" alt="" width={38} height={38} className={styles.mark} priority />
          <span>
            <strong>PolicyWatcher</strong>
            <small>{activeLang === 'it' ? 'Laboratorio di evidenze pubbliche' : 'Public evidence laboratory'}</small>
          </span>
        </Link>
        <GlobalContextControl className={styles.globalContext} fallbackLang={lang} forcedLang={lockLang ? lang : undefined} />
        <button
          type="button"
          className={styles.menuButton}
          ref={menuRef}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          <span>{activeLang === 'it' ? (mobileOpen ? 'Chiudi' : 'Menu') : (mobileOpen ? 'Close' : 'Menu')}</span>
        </button>
        <div className={styles.navWrap} data-open={mobileOpen ? 'true' : 'false'}>
          <nav id="public-mobile-navigation" className={styles.nav} aria-label={activeLang === 'it' ? 'Navigazione pubblica' : 'Public navigation'}>
            {primaryIds.map((id) => links.find((link) => link.id === id)!).map((link) => (
              <Link
                key={link.id}
                href={localizedHref(link)}
                aria-current={current === link.id ? 'page' : undefined}
                onClick={closeNavigation}
              >
                {link[activeLang]}
              </Link>
            ))}
            <details
              className={styles.tools}
              ref={toolsRef}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  if (toolsRef.current) {
                    toolsRef.current.open = false;
                    toolsRef.current.querySelector('summary')?.focus();
                  }
                }
              }}
            >
              <summary>
                <Compass size={17} aria-hidden="true" />
                <span>{activeLang === 'it' ? 'Tutti gli strumenti' : 'All tools'}</span>
                <ChevronDown size={15} className={styles.toolsChevron} aria-hidden="true" />
              </summary>
              <div className={styles.toolsPanel}>
                <header className={styles.directoryHeader}>
                  <div><span>PolicyWatcher</span><h2>{activeLang === 'it' ? 'Scegli da dove partire' : 'Find your next step'}</h2></div>
                  <button type="button" aria-label={activeLang === 'it' ? 'Chiudi strumenti' : 'Close tools'} onClick={() => { if (toolsRef.current) { toolsRef.current.open = false; toolsRef.current.querySelector('summary')?.focus(); } }}><X size={19} aria-hidden="true" /></button>
                </header>
                <div className={styles.toolsLinks}>
                  {publicGroups.map((group) => (
                    <section key={group.id} className={styles.toolGroup} data-group={group.id} aria-label={group.label}>
                      <header>
                        {NAVIGATION_LANES.includes(group.id as NavigationLane) && <span className={styles.laneNumber} aria-hidden="true">0{NAVIGATION_LANES.indexOf(group.id as NavigationLane) + 1}</span>}
                        <div><h3>{group.label}</h3><p>{group.description}</p></div>
                      </header>
                      <div>{group.items.map((link) => (
                        <Link key={link.id} href={localizedHref(link)} aria-current={current === link.id ? 'page' : undefined} onClick={closeNavigation}>
                          <span>{link[activeLang]}</span><ArrowUpRight size={14} aria-hidden="true" />
                        </Link>
                      ))}</div>
                    </section>
                  ))}
                </div>
                <Link href="/" className={styles.workspaceLink} onClick={closeNavigation}>
                  {activeLang === 'it' ? 'Apri lo spazio interattivo' : 'Open the interactive workspace'} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </details>
          </nav>
        </div>
      </div>
    </header>
  );
}
