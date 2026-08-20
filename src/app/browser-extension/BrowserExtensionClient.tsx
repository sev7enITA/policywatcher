'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ExternalLink, FileCheck2, Globe2, Languages,
  Link2, LockKeyhole, Monitor, Puzzle, ShieldCheck,
} from 'lucide-react';
import {
  POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS,
  type BrowserExtensionStoreLinks,
} from '@/lib/browserExtensionStores';
import {
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE,
} from '@/lib/release';
import styles from './browserExtension.module.css';
import { useState } from 'react';

type Lang = 'it' | 'en';

const copy = {
  it: {
    back: 'Cosa è cambiato?', switchLanguage: 'English', kicker: 'Estensione browser · Beta',
    title: 'Verifica dei link',
    lead: 'PolicyWatcher legge localmente la notifica aperta e recupera i link presenti nella pagina. Conferma organizzazione, policy e link di partenza prima della verifica.',
    betaTitle: 'Versione Beta per test controllati', betaBody: 'È software pre-release: estrazione ed evidenze possono essere incomplete o non disponibili. Non usarlo con comunicazioni riservate, sanitarie, finanziarie, lavorative o di autenticazione; non è consulenza legale.', betaBoundary: 'Il contenuto grezzo resta sul dispositivo e non viene trasmesso.',
    boundary: 'Campi esclusi dalla trasmissione', boundaryBody: 'Il payload dell’estensione esclude testo, oggetto, indirizzi e allegati.',
    local: 'Nella scheda aperta', localItems: ['Testo visibile della notifica', 'Link reali presenti nei pulsanti', 'Mittente e date visibili'],
    sent: 'Solo dopo la conferma', sentItems: ['Organizzazione o dominio', 'Un link di partenza ripulito', 'Categorie di policy e date'],
    howTitle: 'Controllo avviato dall’utente',
    steps: [
      ['Apri la notifica', 'Rimani sulla mail o sulla pagina che segnala l’aggiornamento.'],
      ['Avvia l’estensione', 'L’accesso temporaneo alla scheda parte soltanto quando premi Analizza.'],
      ['Conferma gli indizi', 'Controlla organizzazione, policy e presenza del link di partenza.'],
      ['Verifica le evidenze', 'Solo i campi strutturati confermati raggiungono PolicyWatcher.'],
    ],
    installTitle: 'Disponibilità per browser', installLead: 'Ogni browser mostra uno stato indipendente. Stato aggiornato: 6 agosto 2026.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Estensione Manifest V3 per browser desktop basati su Chromium.',
    edgeBody: 'La versione per Microsoft Edge è pubblicata su Microsoft Edge Add-ons.',
    safariBody: 'Richiede firma del publisher e pacchetto App Store tramite Safari Web Extension.',
    install: 'Apri e installa', directLinkPending: 'La scheda è pubblicata. Il pulsante diretto apparirà quando l’URL Edge Add-ons sarà configurato nel deployment.', safariNote: 'La sorgente Safari non equivale a un’app installabile. La disponibilità mobile verrà dichiarata solo dopo firma e revisione App Store.',
    fallback: 'Stai usando il telefono o lo store non è ancora disponibile?', fallbackBody: 'Incolla il testo visibile: i link nascosti non saranno inclusi, ma PolicyWatcher può usare le fonti già monitorate o aprire una richiesta minima di discovery e QA.', fallbackAction: 'Continua con il copia-incolla',
    privacy: 'Privacy', methodology: 'Metodo e limiti', legal: 'Non è consulenza legale.',
  },
  en: {
    back: 'What changed?', switchLanguage: 'Italiano', kicker: 'Browser extension · Beta',
    title: 'Link verification',
    lead: 'PolicyWatcher reads the open notice locally and retrieves links from the page. Confirm the organization, policy and starting link before verification.',
    betaTitle: 'Beta version for controlled testing', betaBody: 'This is pre-release software: extraction and evidence may be incomplete or unavailable. Do not use it with confidential, health, financial, employment or authentication communications; it is not legal advice.', betaBoundary: 'Raw content stays on the device and is not transmitted.',
    boundary: 'Fields excluded from transmission', boundaryBody: 'The extension payload excludes text, subject, addresses and attachments.',
    local: 'In the open tab', localItems: ['Visible notification text', 'Real links behind buttons', 'Visible sender and dates'],
    sent: 'Only after confirmation', sentItems: ['Organization or domain', 'One cleaned starting link', 'Policy categories and dates'],
    howTitle: 'A short, user-initiated check',
    steps: [
      ['Open the notification', 'Stay on the email or page that reports the update.'],
      ['Run the extension', 'Temporary tab access starts only when you press Inspect.'],
      ['Confirm the clues', 'Review the organization, policies and whether a starting link was found.'],
      ['Verify the evidence', 'Only confirmed structured fields reach PolicyWatcher.'],
    ],
    installTitle: 'Browser availability', installLead: 'Each browser has an independent status. Updated: 6 August 2026.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Manifest V3 extension for Chromium-based desktop browsers.',
    edgeBody: 'The Microsoft Edge version is published on Microsoft Edge Add-ons.',
    safariBody: 'Requires publisher signing and App Store packaging as a Safari Web Extension.',
    install: 'View and install', directLinkPending: 'The listing is published. The direct button will appear after the Edge Add-ons URL is configured in the deployment.', safariNote: 'Safari source is not an installable app. Mobile availability will be stated only after App Store signing and review.',
    fallback: 'On a phone or is the store not available yet?', fallbackBody: 'Paste the visible text: hidden links will not be included, but PolicyWatcher can use monitored sources or open a minimized discovery and QA request.', fallbackAction: 'Continue with copy and paste',
    privacy: 'Privacy', methodology: 'Method and limits', legal: 'Not legal advice.',
  },
} as const;

export default function BrowserExtensionClient({ storeLinks }: { storeLinks: BrowserExtensionStoreLinks }) {
  const [lang, setLang] = useState<Lang>('it');
  const t = copy[lang];
  const stores = [
    { id: 'chrome' as const, name: t.chrome, body: t.chromeBody, icon: Globe2 },
    { id: 'edge' as const, name: t.edge, body: t.edgeBody, icon: Monitor },
    { id: 'safari' as const, name: t.safari, body: t.safariBody, icon: Puzzle },
  ];

  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Image src="/logo-mark.png" width={32} height={32} alt="" /><span>PolicyWatcher</span></Link>
      <div><Link href="/what-changed"><ArrowLeft aria-hidden="true" />{t.back}</Link><button type="button" onClick={() => setLang(lang === 'it' ? 'en' : 'it')}><Languages aria-hidden="true" />{t.switchLanguage}</button></div>
    </header>

    <section className={styles.hero}>
      <div><p className={styles.kicker}>{t.kicker}</p><h1>{t.title}</h1><p className={styles.lead}>{t.lead}</p></div>
      <aside><ShieldCheck aria-hidden="true" /><div><strong>{t.boundary}</strong><span>{t.boundaryBody}</span></div></aside>
    </section>

    <section className={styles.betaNotice} role="note" aria-labelledby="beta-status-title">
      <span>{POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE}</span>
      <div><h2 id="beta-status-title">{t.betaTitle}</h2><p>{t.betaBody}</p></div>
      <p className={styles.betaBoundary}><LockKeyhole aria-hidden="true" />{t.betaBoundary}</p>
    </section>

    <section className={styles.boundary} aria-label={lang === 'it' ? 'Confine dei dati' : 'Data boundary'}>
      <div><span><LockKeyhole aria-hidden="true" />{t.local}</span><ul>{t.localItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></div>
      <div className={styles.boundaryMarker}><ArrowRight aria-hidden="true" /><small>{lang === 'it' ? 'Conferma' : 'Confirm'}</small></div>
      <div><span><FileCheck2 aria-hidden="true" />{t.sent}</span><ul>{t.sentItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></div>
    </section>

    <section className={styles.process}>
      <h2>{t.howTitle}</h2>
      <ol>{t.steps.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
    </section>

    <section className={styles.availability}>
      <div className={styles.sectionHeading}><p>{lang === 'it' ? 'Disponibilità store' : 'Store availability'}</p><h2>{t.installTitle}</h2><span>{t.installLead}</span></div>
      <div className={styles.storeList}>{stores.map(({ id, name, body, icon: Icon }) => {
        const status = POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS[id];
        const isPublished = status.state === 'published';
        const hasInstallLink = isPublished && Boolean(storeLinks[id]);
        return <article key={id} data-store-state={status.state}>
        <Icon aria-hidden="true" /><div><h3>{name}</h3>
          <strong className={isPublished ? styles.storePublished : styles.storePending}>
            <span aria-hidden="true" />{status[lang]}
          </strong>
          <p>{body}</p>{hasInstallLink
          ? <a href={storeLinks[id]!} target="_blank" rel="noopener noreferrer">{t.install}<ExternalLink aria-hidden="true" /></a>
          : null}
          {id === 'edge' && isPublished && !hasInstallLink && <small>{t.directLinkPending}</small>}
          {id === 'safari' && <small>{t.safariNote}</small>}
        </div>
      </article>})}</div>
    </section>

    <section className={styles.fallback}>
      <Link2 aria-hidden="true" /><div><h2>{t.fallback}</h2><p>{t.fallbackBody}</p><Link href="/what-changed#paste-notice">{t.fallbackAction}<ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <footer className={styles.footer}><p>{t.legal}</p><nav><Link href="/privacy">{t.privacy}</Link><Link href="/methodology/confidence">{t.methodology}</Link></nav></footer>
  </main>;
}
