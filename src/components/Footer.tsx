/**
 * @file Footer.tsx
 *
 * Site-wide footer rendered at the bottom of every page.
 *
 * Sections:
 *  - **Brand** logo, tagline, and "Made in the EU" badge.
 *  - **Legal** links to the Privacy Policy and Terms of Use (the Terms
 *    link clears localStorage acceptance so the TermsGate re-appears).
 *  - **Contact & Security** mailto link and security policy page.
 *  - **Resources** external links (e.g. PALO Framework).
 *  - **Bottom bar** beta notice and copyright notice.
 *
 * Supports EN/IT localisation.
 */
'use client';

import { BarChart3, ShieldCheck, FileText, Lock, Mail, ExternalLink, Sparkles, Cpu, Newspaper, GitFork, Search, UserRound, Network, Code2, Plug, FolderKanban } from 'lucide-react';
import { POLICYWATCHER_BUILD_LABEL, POLICYWATCHER_VERSION } from '@/lib/release';
import Link from 'next/link';
import styles from './Footer.module.css';

/** Props for the {@link Footer} component. */
interface FooterProps {
  /** Active UI language controls all footer copy. */
  lang: 'en' | 'it';
  /** Compact keeps the utility-page boundary without the long resource directory. */
  variant?: 'full' | 'compact';
}

const content = {
  en: {
    tagline: 'Monitoring how Big Tech changes your rights.',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    methodology: 'Methodology',
    contact: 'Contact',
    security: 'Security',
    securityTxt: 'security.txt',
    resources: 'Resources',
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
    releaseNotice: `Release v${POLICYWATCHER_VERSION}. AI-assisted assessments, not legal advice. Verify with provider sources.`,
    copy: `Copyright ${new Date().getFullYear()} PolicyWatcher by Fabrizio Degni. All rights reserved.`,
    madeIn: 'Made in the EU',
  },
  it: {
    tagline: 'Monitoraggio di come le Big Tech cambiano i tuoi diritti.',
    legal: 'Legale',
    privacy: 'Privacy Policy',
    terms: 'Termini di Utilizzo',
    methodology: 'Metodologia',
    contact: 'Contatti',
    security: 'Sicurezza',
    securityTxt: 'security.txt',
    resources: 'Risorse',
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
    releaseNotice: `Release v${POLICYWATCHER_VERSION}. Valutazioni assistite da AI, non parere legale. Verificare con le fonti provider.`,
    copy: `Copyright ${new Date().getFullYear()} PolicyWatcher di Fabrizio Degni. Tutti i diritti riservati.`,
    madeIn: 'Fatto in UE',
  },
};

/**
 * Global footer with legal links, contact info, resources, and beta notice.
 *
 * @param props - {@link FooterProps}
 * @returns The rendered `<footer>` element.
 */
export default function Footer({ lang, variant = 'full' }: FooterProps) {
  const t = content[lang];

  if (variant === 'compact') {
    return (
      <footer className={`${styles.footer} ${styles.compactFooter}`}>
        <div className={`${styles.container} ${styles.compactContainer}`}>
          <div className={styles.compactIdentity}>
            <div className={styles.logoRow}>
              <ShieldCheck size={18} className={styles.logoIcon} />
              <span className={styles.logoText}>PolicyWatcher</span>
            </div>
            <p>{t.releaseNotice}</p>
          </div>
          <nav className={styles.compactLinks} aria-label={lang === 'it' ? 'Link essenziali' : 'Essential links'}>
            <Link href="/knowledge"><FileText size={13} />{t.knowledge}</Link>
            <a href="/privacy"><Lock size={13} />{t.privacy}</a>
            <a href="/terms"><FileText size={13} />{t.terms}</a>
            <a href="/press-kit"><Newspaper size={13} />{t.pressKit}</a>
            <Link href="/collections"><FolderKanban size={13} />{t.collections}</Link>
            <Link href="/pulse"><Sparkles size={13} />{t.pulse}</Link>
            <a href="mailto:info@policywatcher.online"><Mail size={13} />{t.contact}</a>
          </nav>
          <p className={styles.compactCopy}>{t.copy} / Build {POLICYWATCHER_BUILD_LABEL}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logoRow}>
              <ShieldCheck size={20} className={styles.logoIcon} />
              <span className={styles.logoText}>PolicyWatcher</span>
            </div>
            <p className={styles.tagline}>{t.tagline}</p>
            <span className={styles.madeIn}>{t.madeIn}</span>
          </div>

          {/* Legal */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>{t.legal}</h4>
            <ul className={styles.links}>
              <li>
                <a href="/privacy">
                  <Lock size={14} />
                  {t.privacy}
                </a>
              </li>
              <li>
                <a href="/terms">
                  <FileText size={14} />
                  {t.terms}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Security */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>{t.contact}</h4>
            <ul className={styles.links}>
              <li>
                <a href="mailto:info@policywatcher.online">
                  <Mail size={14} />
                  info@policywatcher.online
                </a>
              </li>
              <li>
                <a href="/security">
                  <ShieldCheck size={14} />
                  {lang === 'it' ? 'Politiche di Sicurezza' : 'Security Policy'}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>{t.resources}</h4>
            <ul className={styles.links}>
              <li>
                <Link href="/knowledge">
                  <FileText size={14} />
                  {t.knowledge}
                </Link>
              </li>
              <li>
                <a href="/about">
                  <UserRound size={14} />
                  {t.about}
                </a>
              </li>
              <li>
                <a href="/roadmap">
                  <Cpu size={14} />
                  {t.roadmap}
                </a>
              </li>
              <li>
                <a href="/atlas">
                  <GitFork size={14} />
                  {t.atlas}
                </a>
              </li>
              <li>
                <a href="/feature-atlas">
                  <Network size={14} />
                  {t.featureAtlas}
                </a>
              </li>
              <li>
                <a href="/observatory">
                  <Search size={14} />
                  {t.observatory}
                </a>
              </li>
              <li>
                <a href="/developers">
                  <Code2 size={14} />
                  {t.developers}
                </a>
              </li>
              <li>
                <a href="/integrations">
                  <Plug size={14} />
                  {t.integrations}
                </a>
              </li>
              <li>
                <Link href="/collections">
                  <FolderKanban size={14} />
                  {t.collections}
                </Link>
              </li>
              <li>
                <a href="/leaderboard">
                  <BarChart3 size={14} />
                  {t.leaderboard}
                </a>
              </li>
              <li>
                <a href="/showcase">
                  <Sparkles size={14} />
                  {t.showcase}
                </a>
              </li>
              <li>
                <a href="/press">
                  <Newspaper size={14} />
                  {t.press}
                </a>
              </li>
              <li>
                <a href="/press-kit">
                  <FileText size={14} />
                  {t.pressKit}
                </a>
              </li>
              <li><Link href="/pulse"><Sparkles size={14} />{t.pulse}</Link></li>
              <li>
                <a href="/trust">
                  <ShieldCheck size={14} />
                  {t.trust}
                </a>
              </li>
              <li>
                <a href="/infographics">
                  <Sparkles size={14} />
                  {t.infographics}
                </a>
              </li>
              <li>
                <a href="https://www.paloframework.org" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  {t.paloFramework}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.releaseNotice}>{t.releaseNotice}</p>
          <p className={styles.copy}>{t.copy} / Build {POLICYWATCHER_BUILD_LABEL}</p>
        </div>
      </div>
    </footer>
  );
}
