'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import {
  RELEASE_EVIDENCE_LEDGER,
  getReleaseEvidencePulse,
  type ReleasePulseEntry,
  type ReleasePulseLocale,
} from '@/lib/releasePulse';
import styles from './ReleaseEvidencePulse.module.css';

export type ReleaseEvidencePulseVariant = 'compact' | 'full';

const COPY = {
  en: {
    kicker: '14-day evidence window',
    headline: 'What changed. What it unlocked. What remains unproven.',
    framing: 'Six dated release receipts connect shipped controls to their evidence and explicit residual boundary.',
    releases: 'release clusters',
    days: 'inclusive days',
    references: 'evidence references',
    traceLabel: 'Release evidence traces',
    traceHelp: 'The traces connect implementation, listed evidence and the boundary attached to every release. They are not outcome scores.',
    shipped: 'Shipped',
    validated: 'Validated',
    guarded: 'Guarded',
    selected: 'Selected release receipt',
    impact: 'Implementation impact',
    metrics: 'Exact implementation metrics',
    evidence: 'Evidence',
    boundary: 'Boundary',
    claimBoundary: 'Ledger claim boundary',
    digest: 'SHA-256 digest fragment',
    api: 'Release evidence API',
    release: 'Beta 42 release record',
    infographic: 'Release infographic',
    archive: 'Release archive',
    select: 'Open release receipt',
    current: 'Current release receipt',
    version: 'Version',
    date: 'Date',
    wave: 'Wave',
    inspect: 'Inspect the full 14-day record',
    traceCompactHelp: 'Implementation, evidence and boundary traces; not outcome scores.',
    claimBoundaryBody: RELEASE_EVIDENCE_LEDGER.claimBoundary,
  },
  it: {
    kicker: 'Finestra di evidenza di 14 giorni',
    headline: 'Cosa è cambiato. Cosa ha sbloccato. Cosa resta da provare.',
    framing: 'Sei ricevute di release datate collegano i controlli distribuiti alle evidenze e al limite residuo esplicito.',
    releases: 'cluster di release',
    days: 'giorni inclusivi',
    references: 'riferimenti di evidenza',
    traceLabel: 'Tracce delle evidenze di release',
    traceHelp: 'Le tracce collegano implementazione, evidenze elencate e limite associato a ogni release. Non sono punteggi di risultato.',
    shipped: 'Distribuito',
    validated: 'Validato',
    guarded: 'Protetto',
    selected: 'Ricevuta di release selezionata',
    impact: 'Impatto implementativo',
    metrics: 'Metriche implementative esatte',
    evidence: 'Evidenze',
    boundary: 'Limite',
    claimBoundary: 'Limite dichiarativo del ledger',
    digest: 'Frammento digest SHA-256',
    api: 'API delle evidenze di release',
    release: 'Record release Beta 42',
    infographic: 'Infografica release',
    archive: 'Archivio release',
    select: 'Apri ricevuta di release',
    current: 'Ricevuta della release corrente',
    version: 'Versione',
    date: 'Data',
    wave: 'Ondata',
    inspect: 'Esplora il record completo di 14 giorni',
    traceCompactHelp: 'Tracce di implementazione, evidenza e limite; non punteggi di risultato.',
    claimBoundaryBody: 'Solo inventario implementativo ed evidenze di valutazione osservate. Le metriche di release non stabiliscono adozione, conformità legale, disponibilità continua o risultati per gli utenti.',
  },
} as const;

const ITALIAN_DISPLAY_REPLACEMENTS = [
  ['piu', 'più'],
  ['integrita', 'integrità'],
  ['autorialita', 'autorialità'],
  ['reperibilita', 'reperibilità'],
  ['disponibilita', 'disponibilità'],
  ['modalita', 'modalità'],
  ['usabilita', 'usabilità'],
  ['conformita', 'conformità'],
  ['qualita', 'qualità'],
  ['non e ', 'non è '],
  ['qualificazione e ', 'qualificazione è '],
  ['L inclusione', 'L’inclusione'],
  ['dell agent', 'dell’agent'],
] as const;

function localizeReleaseText(text: string, locale: ReleasePulseLocale): string {
  if (locale !== 'it') return text;
  return ITALIAN_DISPLAY_REPLACEMENTS.reduce(
    (localized, [source, replacement]) => localized.replaceAll(source, replacement),
    text,
  );
}

const WAVE_LABELS: Record<ReleasePulseEntry['wave'], Record<ReleasePulseLocale, string>> = {
  technical: { en: 'Technical', it: 'Tecnica' },
  distribution: { en: 'Distribution', it: 'Distribuzione' },
  product: { en: 'Product', it: 'Prodotto' },
  experience: { en: 'Experience', it: 'Esperienza' },
  assurance: { en: 'Assurance', it: 'Assurance' },
};

const RELEASE_LINKS = [
  { href: '/api/v1/release-evidence', key: 'api' },
  { href: '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42', key: 'release' },
  { href: '/infographics', key: 'infographic' },
  { href: '/press-kit/releases', key: 'archive' },
] as const;

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

function selectWithProgressiveTransition(nextVersion: string, update: (version: string) => void) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDocument = document as TransitionDocument;
  if (!reducedMotion && transitionDocument.startViewTransition) {
    transitionDocument.startViewTransition(() => {
      flushSync(() => update(nextVersion));
    });
    return;
  }
  update(nextVersion);
}

export default function ReleaseEvidencePulse({
  locale = 'en',
  variant = 'full',
}: {
  locale?: ReleasePulseLocale;
  variant?: ReleaseEvidencePulseVariant;
}) {
  const releases = getReleaseEvidencePulse();
  const copy = COPY[locale];
  const [selectedVersion, setSelectedVersion] = useState(RELEASE_EVIDENCE_LEDGER.currentRelease);
  const selectedRelease = releases.find((release) => release.version === selectedVersion) ?? releases.at(-1)!;
  const selectedTitle = localizeReleaseText(selectedRelease.title[locale], locale);
  const selectedImpact = localizeReleaseText(selectedRelease.impact[locale], locale);
  const selectedBoundary = localizeReleaseText(selectedRelease.boundary[locale], locale);
  const evidenceReferenceCount = releases.reduce((total, release) => total + release.evidence.length, 0);
  const titleId = `release-evidence-pulse-${variant}-title`;

  return (
    <section
      className={`${styles.pulse} ${variant === 'compact' ? styles.pulseCompact : styles.pulseFull}`}
      aria-labelledby={titleId}
      data-variant={variant}
    >
      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.kicker}>{copy.kicker}</p>
          <h2 id={titleId}>{copy.headline}</h2>
          <p className={styles.framing}>{copy.framing}</p>
        </div>
        <dl className={styles.summaryCounts} aria-label={copy.kicker}>
          <div><dt>{copy.releases}</dt><dd>{releases.length}</dd></div>
          <div><dt>{copy.days}</dt><dd>{RELEASE_EVIDENCE_LEDGER.window.inclusiveDays}</dd></div>
          <div><dt>{copy.references}</dt><dd>{evidenceReferenceCount}</dd></div>
        </dl>
      </header>

      <figure className={styles.instrument}>
        <div className={styles.traceLegend} aria-label={copy.traceLabel}>
          <span data-trace="shipped"><i aria-hidden="true" />{copy.shipped}</span>
          <span data-trace="validated"><i aria-hidden="true" />{copy.validated}</span>
          <span data-trace="guarded"><i aria-hidden="true" />{copy.guarded}</span>
        </div>
        <div className={styles.railViewport} tabIndex={0} aria-label={`${copy.traceLabel}. ${variant === 'compact' ? copy.traceCompactHelp : copy.traceHelp}`}>
          <div className={styles.railCanvas}>
            <svg className={styles.seismograph} viewBox="0 0 600 66" preserveAspectRatio="none" aria-hidden="true">
              <polyline data-trace="shipped" points="18,12 126,16 234,10 342,17 450,13 582,18" />
              <polyline data-trace="validated" points="18,31 126,35 234,34 342,28 450,33 582,27" />
              <polyline data-trace="guarded" points="18,52 126,48 234,53 342,49 450,51 582,46" />
            </svg>
            <ol
              className={styles.releaseRail}
              style={{ '--release-count': releases.length } as CSSProperties}
            >
              {releases.map((release) => (
                <li key={release.version}>
                  <button
                    type="button"
                    aria-pressed={selectedRelease.version === release.version}
                    aria-label={`${copy.select}: ${release.displayVersion}, ${localizeReleaseText(release.title[locale], locale)}`}
                    onClick={() => selectWithProgressiveTransition(release.version, setSelectedVersion)}
                  >
                    <span className={styles.node} aria-hidden="true"><i /><i /><i /></span>
                    <time dateTime={release.date}>{release.date.slice(5).replace('-', '.')}</time>
                    <strong>{release.displayVersion}</strong>
                    {variant === 'full' ? <small>{localizeReleaseText(release.title[locale], locale)}</small> : null}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <figcaption>{variant === 'compact' ? copy.traceCompactHelp : copy.traceHelp}</figcaption>
      </figure>

      {variant === 'compact' ? (
        <details className={`${styles.receipt} ${styles.compactReceipt}`}>
          <summary className={styles.compactSummary}>
            <span className={styles.compactReceiptStatus} aria-live="polite" aria-atomic="true">
              <span className={styles.compactReceiptLabel}>{copy.current}</span>
              <strong>{selectedTitle}</strong>
              <span className={styles.compactMetadata}>
                <span><b>{copy.version}</b> {selectedRelease.displayVersion}</span>
                <span><b>{copy.date}</b> <time dateTime={selectedRelease.date}>{selectedRelease.date}</time></span>
                <span><b>{copy.wave}</b> {WAVE_LABELS[selectedRelease.wave][locale]}</span>
              </span>
            </span>
          </summary>
          <div className={styles.compactReceiptBody}>
            <div>
              <h4>{copy.impact}</h4>
              <p>{selectedImpact}</p>
            </div>
            <div>
              <h4>{copy.boundary}</h4>
              <p>{selectedBoundary}</p>
            </div>
          </div>
        </details>
      ) : (
        <article className={styles.receipt} aria-live="polite" aria-atomic="true">
          <header className={styles.receiptHeader}>
            <div>
              <span>{copy.selected}</span>
              <h3>{selectedTitle}</h3>
            </div>
            <dl>
              <div><dt>{copy.version}</dt><dd>{selectedRelease.displayVersion}</dd></div>
              <div><dt>{copy.date}</dt><dd><time dateTime={selectedRelease.date}>{selectedRelease.date}</time></dd></div>
              <div><dt>{copy.wave}</dt><dd>{WAVE_LABELS[selectedRelease.wave][locale]}</dd></div>
            </dl>
          </header>

          <div className={styles.receiptBody}>
            <section className={styles.impact} aria-labelledby={`${titleId}-impact`}>
              <h4 id={`${titleId}-impact`}>{copy.impact}</h4>
              <p>{selectedImpact}</p>
              <h4>{copy.metrics}</h4>
              <dl className={styles.metrics}>
                {selectedRelease.metrics.map((metric) => (
                  <div key={`${metric.value}-${metric.label.en}`}>
                    <dt>{localizeReleaseText(metric.label[locale], locale)}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <dl className={styles.evidenceBoundary}>
              <div data-field="evidence">
                <dt>{copy.evidence}</dt>
                <dd>{selectedRelease.evidence.join(' · ')}</dd>
              </div>
              <div data-field="boundary">
                <dt>{copy.boundary}</dt>
                <dd>{selectedBoundary}</dd>
              </div>
            </dl>
          </div>
        </article>
      )}

      <aside className={styles.ledgerBoundary}>
        <div>
          <span>{copy.claimBoundary}</span>
          <p>{copy.claimBoundaryBody}</p>
        </div>
        <code title={RELEASE_EVIDENCE_LEDGER.integrity.digest}>
          {copy.digest}: {RELEASE_EVIDENCE_LEDGER.integrity.digest.slice(0, 16)}…
        </code>
      </aside>

      {variant === 'full' ? (
        <nav className={styles.links} aria-label={locale === 'it' ? 'Evidenze e risorse di release' : 'Release evidence and resources'}>
          {RELEASE_LINKS.map((link) => <Link key={link.href} href={link.href}>{copy[link.key]}<span aria-hidden="true">↗</span></Link>)}
        </nav>
      ) : (
        <Link className={styles.compactCta} href="/pulse/two-week-release-impact">
          {copy.inspect}<span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
