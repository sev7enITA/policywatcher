/**
 * @file Footer.tsx
 *
 * Site-wide footer rendered at the bottom of every page.
 *
 * Sections:
 *  - **Brand** — logo, tagline, and "Made in the EU" badge.
 *  - **Legal** — links to the Privacy Policy and Terms of Use (the Terms
 *    link clears localStorage acceptance so the TermsGate re-appears).
 *  - **Contact & Security** — mailto link and security policy page.
 *  - **Resources** — external links (e.g. PALO Framework).
 *  - **Bottom bar** — beta disclaimer and copyright notice.
 *
 * Supports EN/IT localisation.
 */
'use client';

import { ShieldCheck, FileText, Lock, Mail, ExternalLink, Sparkles, Cpu } from 'lucide-react';
import styles from './Footer.module.css';

/** Props for the {@link Footer} component. */
interface FooterProps {
  /** Active UI language — controls all footer copy. */
  lang: 'en' | 'it';
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
    showcase: 'Showcase',
    roadmap: '3.5 Roadmap',
    paloFramework: 'PALO Framework',
    disclaimer: 'Beta Release. AI-generated assessments, not legal advice. Use at your own risk.',
    copy: `\u00A9 ${new Date().getFullYear()} PolicyWatcher by Fabrizio Degni. All rights reserved.`,
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
    showcase: 'Vetrina',
    roadmap: 'Roadmap 3.5',
    paloFramework: 'PALO Framework',
    disclaimer: 'Versione Beta. Valutazioni generate da AI, non costituiscono parere legale. Uso a proprio rischio.',
    copy: `\u00A9 ${new Date().getFullYear()} PolicyWatcher di Fabrizio Degni. Tutti i diritti riservati.`,
    madeIn: 'Fatto in UE',
  },
};

/**
 * Global footer with legal links, contact info, resources, and beta disclaimer.
 *
 * @param props - {@link FooterProps}
 * @returns The rendered `<footer>` element.
 */
export default function Footer({ lang }: FooterProps) {
  const t = content[lang];

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
                <a href="#terms-gate" onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('policywatcher_terms_accepted_v1');
                    window.location.reload();
                  }
                }}>
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
                <a href="/roadmap">
                  <Cpu size={14} />
                  {t.roadmap}
                </a>
              </li>
              <li>
                <a href="/showcase">
                  <Sparkles size={14} />
                  {t.showcase}
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
          <p className={styles.disclaimer}>{t.disclaimer}</p>
          <p className={styles.copy}>{t.copy} &bull; Build v3.0.1</p>
        </div>
      </div>
    </footer>
  );
}
