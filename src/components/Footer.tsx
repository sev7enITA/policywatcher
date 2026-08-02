/**
 * @file Footer.tsx
 *
 * Site-wide footer rendered at the bottom of every page.
 *
 * The full footer separates resource discovery into four bounded groups and
 * keeps legal/contact destinations in a directly visible utility row. The
 * compact variant preserves the smaller utility-page boundary.
 */
'use client';

import {
  BarChart3,
  ChevronDown,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  FolderKanban,
  GitFork,
  Lock,
  Mail,
  Network,
  Newspaper,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { POLICYWATCHER_BUILD_LABEL, POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './Footer.module.css';

/** Props for the {@link Footer} component. */
interface FooterProps {
  /** Active UI language controls all footer copy. */
  lang: 'en' | 'it';
  /** Compact keeps the utility-page boundary without the resource directory. */
  variant?: 'full' | 'compact';
}

const content = {
  en: {
    tagline: 'Monitoring how Big Tech changes your rights.',
    explore: 'Explore',
    product: 'Product',
    build: 'Build',
    media: 'Media',
    resourceNavigation: 'PolicyWatcher resource navigation',
    mobileResourceNavigation: 'PolicyWatcher resource navigation by category',
    utilityNavigation: 'Legal, security and contact links',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    contact: 'Contact',
    securityPolicy: 'Security Policy',
    about: 'About the Project',
    showcase: 'Showcase',
    observatory: 'Observatory',
    developers: 'Developer Directory',
    integrations: 'Integration Options',
    knowledge: 'Public Knowledge',
    collections: 'Evidence Collections',
    atlas: 'Site Atlas',
    featureAtlas: 'Feature Intelligence Atlas',
    leaderboard: 'Policy Signals',
    roadmap: 'Community Roadmap',
    press: 'Press Wall',
    pressKit: 'Press Kit',
    pulse: 'Editorial Pulse',
    trust: 'Trust & Quality',
    infographics: 'Infographics',
    paloFramework: 'PALO Framework',
    opensNewTab: 'opens in a new tab',
    releaseNotice: `Release v${POLICYWATCHER_VERSION}. AI-assisted assessments, not legal advice. Verify with provider sources.`,
    copy: `Copyright ${new Date().getFullYear()} PolicyWatcher by Fabrizio Degni. All rights reserved.`,
    madeIn: 'Made in the EU',
  },
  it: {
    tagline: 'Monitoraggio di come le Big Tech cambiano i tuoi diritti.',
    explore: 'Esplora',
    product: 'Prodotto',
    build: 'Sviluppo',
    media: 'Media',
    resourceNavigation: 'Navigazione delle risorse PolicyWatcher',
    mobileResourceNavigation: 'Navigazione delle risorse PolicyWatcher per categoria',
    utilityNavigation: 'Link legali, di sicurezza e contatto',
    privacy: 'Privacy Policy',
    terms: 'Termini di Utilizzo',
    contact: 'Contatti',
    securityPolicy: 'Politiche di Sicurezza',
    about: 'Il progetto e l’autore',
    showcase: 'Vetrina',
    observatory: 'Observatory',
    developers: 'Directory sviluppatori',
    integrations: 'Opzioni di integrazione',
    knowledge: 'Conoscenza pubblica',
    collections: 'Raccolte di evidenze',
    atlas: 'Atlante del sito',
    featureAtlas: 'Atlante delle funzionalità',
    leaderboard: 'Segnali policy',
    roadmap: 'Roadmap community',
    press: 'Press wall',
    pressKit: 'Press kit',
    pulse: 'Pulse editoriale',
    trust: 'Qualità e fiducia',
    infographics: 'Infografiche',
    paloFramework: 'PALO Framework',
    opensNewTab: 'si apre in una nuova scheda',
    releaseNotice: `Release v${POLICYWATCHER_VERSION}. Valutazioni assistite da AI, non parere legale. Verificare con le fonti provider.`,
    copy: `Copyright ${new Date().getFullYear()} PolicyWatcher di Fabrizio Degni. Tutti i diritti riservati.`,
    madeIn: 'Fatto in UE',
  },
};

/**
 * Global footer with categorized resources, legal links, contact information,
 * and a release boundary.
 */
export default function Footer({ lang, variant = 'full' }: FooterProps) {
  const t = content[lang];

  if (variant === 'compact') {
    return (
      <footer className={`${styles.footer} ${styles.compactFooter}`}>
        <div className={`${styles.container} ${styles.compactContainer}`}>
          <div className={styles.compactIdentity}>
            <div className={styles.logoRow}>
              <ShieldCheck size={18} className={styles.logoIcon} aria-hidden="true" />
              <span className={styles.logoText}>PolicyWatcher</span>
            </div>
            <p>{t.releaseNotice}</p>
          </div>
          <nav className={styles.compactLinks} aria-label={lang === 'it' ? 'Link essenziali' : 'Essential links'}>
            <Link href="/knowledge"><FileText size={13} aria-hidden="true" />{t.knowledge}</Link>
            <Link href="/privacy"><Lock size={13} aria-hidden="true" />{t.privacy}</Link>
            <Link href="/terms"><FileText size={13} aria-hidden="true" />{t.terms}</Link>
            <Link href="/press-kit"><Newspaper size={13} aria-hidden="true" />{t.pressKit}</Link>
            <Link href="/collections"><FolderKanban size={13} aria-hidden="true" />{t.collections}</Link>
            <Link href="/pulse"><Sparkles size={13} aria-hidden="true" />{t.pulse}</Link>
            <a href="mailto:info@policywatcher.online"><Mail size={13} aria-hidden="true" />{t.contact}</a>
          </nav>
          <p className={styles.compactCopy}>{t.copy} / Build {POLICYWATCHER_BUILD_LABEL}</p>
        </div>
      </footer>
    );
  }

  const resourceGroups = [
    {
      id: 'explore',
      label: t.explore,
      links: [
        { href: '/knowledge', label: t.knowledge, icon: FileText },
        { href: '/observatory', label: t.observatory, icon: Search },
        { href: '/collections', label: t.collections, icon: FolderKanban },
        { href: '/leaderboard', label: t.leaderboard, icon: BarChart3 },
      ],
    },
    {
      id: 'product',
      label: t.product,
      links: [
        { href: '/roadmap', label: t.roadmap, icon: Cpu },
        { href: '/atlas', label: t.atlas, icon: GitFork },
        { href: '/feature-atlas', label: t.featureAtlas, icon: Network },
        { href: '/showcase', label: t.showcase, icon: Sparkles },
        { href: '/trust', label: t.trust, icon: ShieldCheck },
      ],
    },
    {
      id: 'build',
      label: t.build,
      links: [
        { href: '/developers', label: t.developers, icon: Code2 },
        { href: '/integrations', label: t.integrations, icon: Plug },
        { href: 'https://www.paloframework.org', label: t.paloFramework, icon: ExternalLink, external: true },
      ],
    },
    {
      id: 'media',
      label: t.media,
      links: [
        { href: '/press', label: t.press, icon: Newspaper },
        { href: '/press-kit', label: t.pressKit, icon: FileText },
        { href: '/pulse', label: t.pulse, icon: Sparkles },
        { href: '/infographics', label: t.infographics, icon: BarChart3 },
      ],
    },
  ];

  const renderLinks = (group: (typeof resourceGroups)[number]) => (
    <ul className={styles.links}>
      {group.links.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.label} (${t.opensNewTab})`}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            ) : (
              <Link href={item.href}>
                <Icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <section className={styles.brand} aria-label="PolicyWatcher">
            <div className={styles.logoRow}>
              <ShieldCheck size={20} className={styles.logoIcon} aria-hidden="true" />
              <span className={styles.logoText}>PolicyWatcher</span>
            </div>
            <p className={styles.tagline}>{t.tagline}</p>
            <span className={styles.madeIn}>{t.madeIn}</span>
            <Link className={styles.aboutLink} href="/about">
              <UserRound size={14} aria-hidden="true" />
              {t.about}
            </Link>
          </section>

          <nav className={styles.resourceDirectory} aria-label={t.resourceNavigation}>
            {resourceGroups.map((group) => (
              <section className={styles.column} aria-labelledby={`footer-${lang}-${group.id}`} key={group.id}>
                <h2 className={styles.columnTitle} id={`footer-${lang}-${group.id}`}>{group.label}</h2>
                {renderLinks(group)}
              </section>
            ))}
          </nav>

          <nav className={styles.mobileDirectory} aria-label={t.mobileResourceNavigation}>
            {resourceGroups.map((group) => (
              <details className={styles.disclosure} key={group.id}>
                <summary className={styles.mobileSummary}>
                  <span>{group.label}</span>
                  <ChevronDown className={styles.disclosureIcon} size={18} aria-hidden="true" />
                </summary>
                {renderLinks(group)}
              </details>
            ))}
          </nav>
        </div>

        <div className={styles.utilityRow}>
          <nav className={styles.utilityLinks} aria-label={t.utilityNavigation}>
            <Link href="/privacy"><Lock size={14} aria-hidden="true" />{t.privacy}</Link>
            <Link href="/terms"><FileText size={14} aria-hidden="true" />{t.terms}</Link>
            <Link href="/security"><ShieldCheck size={14} aria-hidden="true" />{t.securityPolicy}</Link>
            <a href="mailto:info@policywatcher.online"><Mail size={14} aria-hidden="true" />info@policywatcher.online</a>
          </nav>
          <div className={styles.bottom}>
            <p className={styles.releaseNotice}>{t.releaseNotice}</p>
            <p className={styles.copy}>{t.copy} / Build {POLICYWATCHER_BUILD_LABEL}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
