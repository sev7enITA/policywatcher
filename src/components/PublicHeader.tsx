'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import styles from './PublicHeader.module.css';

export type PublicSection =
  | 'associations'
  | 'knowledge'
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
}

const links: Array<{ id: PublicSection; href: string; en: string; it: string }> = [
  { id: 'associations', href: '/associazioni', en: 'Civic Lab', it: 'Associazioni' },
  { id: 'knowledge', href: '/knowledge', en: 'Knowledge', it: 'Conoscenza' },
  { id: 'collections', href: '/collections', en: 'Collections', it: 'Raccolte' },
  { id: 'evidence', href: '/evidence', en: 'Evidence', it: 'Evidenze' },
  { id: 'signals', href: '/leaderboard', en: 'Signals', it: 'Segnali' },
  { id: 'infographics', href: '/infographics', en: 'Infographics', it: 'Infografiche' },
  { id: 'trust', href: '/trust', en: 'Trust QA', it: 'Trust QA' },
  { id: 'pulse', href: '/pulse', en: 'Pulse', it: 'Pulse' },
  { id: 'press-kit', href: '/press-kit', en: 'Press Kit', it: 'Press Kit' },
  { id: 'legal', href: '/terms', en: 'Terms', it: 'Termini' },
];

export default function PublicHeader({ current, lang = 'en' }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="PolicyWatcher home">
          <Image src="/logo-mark.png" alt="" width={38} height={38} className={styles.mark} priority />
          <span>
            <strong>PolicyWatcher</strong>
            <small>{lang === 'it' ? 'Laboratorio di evidenze pubbliche' : 'Public evidence laboratory'}</small>
          </span>
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          <span>{lang === 'it' ? (mobileOpen ? 'Chiudi' : 'Menu') : (mobileOpen ? 'Close' : 'Menu')}</span>
        </button>
        <div className={styles.navWrap} data-open={mobileOpen ? 'true' : 'false'}>
          <nav id="public-mobile-navigation" className={styles.nav} aria-label={lang === 'it' ? 'Navigazione pubblica' : 'Public navigation'}>
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                aria-current={current === link.id ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {link[lang]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
