'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Languages, RefreshCw, ShieldCheck } from 'lucide-react';
import EvidenceStatusRail from '@/components/EvidenceStatusRail';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { TERMS_LAST_UPDATED, TERMS_OF_USE, TERMS_STORAGE_KEY, type TermsLanguage } from '@/lib/termsOfUse';
import styles from './terms.module.css';

export default function TermsPageClient() {
  const [lang, setLang] = useState<TermsLanguage>('en');
  const [renewed, setRenewed] = useState(false);
  const t = TERMS_OF_USE[lang];

  const renewAcknowledgement = () => {
    try {
      localStorage.removeItem(TERMS_STORAGE_KEY);
    } catch {
      // Browser storage may be unavailable; the page remains fully readable.
    }
    setRenewed(true);
  };

  return (
    <div className={styles.page}>
      <PublicHeader current="legal" lang={lang} />
      <EvidenceStatusRail
        label={lang === 'it' ? 'Documento pubblico' : 'Public document'}
        title={t.title}
        detail={lang === 'it'
          ? 'Confini d’uso condivisi con la presa visione della dashboard.'
          : 'The same use boundaries presented by the dashboard acknowledgement.'}
        meta={`${lang === 'it' ? 'Aggiornato' : 'Updated'} ${TERMS_LAST_UPDATED}`}
        tone="guide"
      />

      <main className={styles.content}>
        <header className={styles.hero}>
          <div>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              {t.back}
            </Link>
            <span className={styles.eyebrow}><ShieldCheck size={14} /> PolicyWatcher legal</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
          <button
            type="button"
            className={styles.languageButton}
            onClick={() => setLang((current) => current === 'en' ? 'it' : 'en')}
          >
            <Languages size={16} />
            {t.language}
          </button>
        </header>

        <section className={styles.boundarySection} aria-labelledby="terms-boundaries">
          <div className={styles.sectionIndex}>01</div>
          <div>
            <h2 id="terms-boundaries">{t.boundaryTitle}</h2>
            <ol className={styles.boundaryList}>
              {t.boundaries.map((boundary) => (
                <li key={boundary}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className={styles.detailGrid}>
          <section aria-labelledby="responsible-interpretation">
            <span className={styles.sectionIndex}>02</span>
            <h2 id="responsible-interpretation">{t.evidenceTitle}</h2>
            <p>{t.evidenceBody}</p>
            <div className={styles.referenceLinks}>
              <Link href="/methodology/confidence">{lang === 'it' ? 'Metodologia e confidence' : 'Methodology and confidence'}</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </section>

          <section aria-labelledby="local-acknowledgement">
            <span className={styles.sectionIndex}>03</span>
            <h2 id="local-acknowledgement">{t.consentTitle}</h2>
            <p>{t.consentBody}</p>
            <button type="button" className={styles.renewButton} onClick={renewAcknowledgement}>
              <RefreshCw size={16} />
              {t.renew}
            </button>
            {renewed && <p className={styles.renewedNotice} role="status">{t.renewed}</p>}
          </section>
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
