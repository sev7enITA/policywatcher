'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import GlobalContextControl, { useGlobalContext } from './GlobalContextControl';
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
  { id: 'trust', href: '/trust', en: 'Trust QA', it: 'Trust QA' },
  { id: 'pulse', href: '/pulse', en: 'Pulse', it: 'Pulse' },
  { id: 'press-kit', href: '/press-kit', en: 'Press Kit', it: 'Press Kit' },
  { id: 'legal', href: '/terms', en: 'Terms', it: 'Termini' },
];

export default function PublicHeader({ current, lang = 'en', lockLang = false }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const primaryIds: PublicSection[] = ['what-changed', 'knowledge', 'guides', 'methodology'];
  const globalContext = useGlobalContext(lang, lockLang ? lang : undefined);
  const activeLang = lockLang ? lang : globalContext.ready ? globalContext.lang : lang;

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
                href={link.id === 'per-te' ? activeLang === 'it' ? '/per-te' : '/per-te?lang=en' : link.id === 'associations'
                  ? activeLang === 'it' ? '/it/associazioni' : '/en/associations'
                  : link.id === 'guides' && activeLang === 'it' ? '/guides?lang=it' : link.href}
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
              <summary>{activeLang === 'it' ? 'Altri strumenti' : 'More tools'}</summary>
              <div className={styles.toolsLinks}>
                {links.filter((link) => !primaryIds.includes(link.id)).map((link) => (
                  <Link
                    key={link.id}
                    href={link.id === 'per-te'
                      ? activeLang === 'it' ? '/per-te' : '/per-te?lang=en'
                      : link.id === 'associations'
                        ? activeLang === 'it' ? '/it/associazioni' : '/en/associations'
                        : link.href}
                    aria-current={current === link.id ? 'page' : undefined}
                    onClick={closeNavigation}
                  >
                    {link[activeLang]}
                  </Link>
                ))}
              </div>
            </details>
          </nav>
        </div>
      </div>
    </header>
  );
}
