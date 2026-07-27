'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ExternalLink, FileCheck2, Globe2, Languages,
  Link2, LockKeyhole, Monitor, Puzzle, ShieldCheck,
} from 'lucide-react';
import type { BrowserExtensionStoreLinks } from '@/lib/browserExtensionStores';
import {
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
} from '@/lib/release';
import styles from './browserExtension.module.css';
import { useState } from 'react';

type Lang = 'it' | 'en';

const copy = {
  it: {
    back: 'Cosa è cambiato?', switchLanguage: 'English', kicker: 'Estensione browser · Beta',
    title: 'Dalla mail ai link reali, senza inviare la mail',
    lead: 'Con un gesto esplicito, PolicyWatcher legge localmente la notifica aperta e recupera i link presenti nella pagina. Tu confermi gli indizi minimi prima della verifica.',
    betaTitle: 'Versione Beta per test controllati', betaBody: 'È software pre-release: estrazione ed evidenze possono essere incomplete o non disponibili. Non usarlo con comunicazioni riservate, sanitarie, finanziarie, lavorative o di autenticazione; non è consulenza legale.', betaBoundary: 'Il contenuto grezzo resta sul dispositivo e non viene trasmesso.',
    boundary: 'Il contenuto resta nel browser', boundaryBody: 'Testo, oggetto, indirizzi e allegati non vengono trasmessi né conservati.',
    local: 'Nella scheda aperta', localItems: ['Testo visibile della notifica', 'Link reali presenti nei pulsanti', 'Mittente e date visibili'],
    sent: 'Solo dopo la conferma', sentItems: ['Organizzazione o dominio', 'Un link di partenza ripulito', 'Categorie di policy e date'],
    howTitle: 'Un controllo breve, sempre sotto il tuo controllo',
    steps: [
      ['Apri la notifica', 'Rimani sulla mail o sulla pagina che segnala l’aggiornamento.'],
      ['Avvia l’estensione', 'L’accesso temporaneo alla scheda parte soltanto quando premi Analizza.'],
      ['Conferma gli indizi', 'Controlla organizzazione, policy e presenza del link di partenza.'],
      ['Verifica le evidenze', 'Solo i campi strutturati confermati raggiungono PolicyWatcher.'],
    ],
    installTitle: 'Disponibilità per browser', installLead: 'I pulsanti di installazione compaiono solo quando la pubblicazione ufficiale nello store è configurata.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Estensione Manifest V3 per browser desktop basati su Chromium.',
    edgeBody: 'La stessa base verificata, distribuita tramite Microsoft Edge Add-ons.',
    safariBody: 'Richiede firma del publisher e pacchetto App Store tramite Safari Web Extension.',
    install: 'Installa dallo store', safariNote: 'La sorgente Safari non equivale a un’app installabile. La disponibilità mobile verrà dichiarata solo dopo firma e revisione App Store.',
    fallback: 'Stai usando il telefono o lo store non è ancora disponibile?', fallbackBody: 'Incolla il testo visibile: i link nascosti non saranno inclusi, ma PolicyWatcher può usare le fonti già monitorate o aprire una richiesta minima di discovery e QA.', fallbackAction: 'Continua con il copia-incolla',
    privacy: 'Privacy', methodology: 'Metodo e limiti', legal: 'Non è consulenza legale.',
  },
  en: {
    back: 'What changed?', switchLanguage: 'Italiano', kicker: 'Browser extension · Beta',
    title: 'From the email to real links, without sending the email',
    lead: 'After an explicit action, PolicyWatcher reads the open notification locally and retrieves links present in the page. You confirm the minimal clues before verification.',
    betaTitle: 'Beta version for controlled testing', betaBody: 'This is pre-release software: extraction and evidence may be incomplete or unavailable. Do not use it with confidential, health, financial, employment or authentication communications; it is not legal advice.', betaBoundary: 'Raw content stays on the device and is not transmitted.',
    boundary: 'Content stays in the browser', boundaryBody: 'Text, subject, addresses and attachments are never transmitted or stored.',
    local: 'In the open tab', localItems: ['Visible notification text', 'Real links behind buttons', 'Visible sender and dates'],
    sent: 'Only after confirmation', sentItems: ['Organization or domain', 'One cleaned starting link', 'Policy categories and dates'],
    howTitle: 'A short check, always under your control',
    steps: [
      ['Open the notification', 'Stay on the email or page that reports the update.'],
      ['Run the extension', 'Temporary tab access starts only when you press Inspect.'],
      ['Confirm the clues', 'Review the organization, policies and whether a starting link was found.'],
      ['Verify the evidence', 'Only confirmed structured fields reach PolicyWatcher.'],
    ],
    installTitle: 'Browser availability', installLead: 'Install buttons appear only when an official store publication is configured.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Manifest V3 extension for Chromium-based desktop browsers.',
    edgeBody: 'The same reviewed codebase, distributed through Microsoft Edge Add-ons.',
    safariBody: 'Requires publisher signing and App Store packaging as a Safari Web Extension.',
    install: 'Install from store', safariNote: 'Safari source is not an installable app. Mobile availability will be stated only after App Store signing and review.',
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
      <div className={styles.sectionHeading}><p>{lang === 'it' ? 'Installazione verificata' : 'Verified installation'}</p><h2>{t.installTitle}</h2><span>{t.installLead}</span></div>
      <div className={styles.storeList}>{stores.map(({ id, name, body, icon: Icon }) => <article key={id}>
        <Icon aria-hidden="true" /><div><h3>{name}</h3><p>{body}</p>{storeLinks[id]
          ? <a href={storeLinks[id]!} target="_blank" rel="noopener noreferrer">{t.install}<ExternalLink aria-hidden="true" /></a>
          : <strong><span aria-hidden="true" />{POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]}</strong>}
          {id === 'safari' && <small>{t.safariNote}</small>}
        </div>
      </article>)}</div>
    </section>

    <section className={styles.fallback}>
      <Link2 aria-hidden="true" /><div><h2>{t.fallback}</h2><p>{t.fallbackBody}</p><Link href="/what-changed#paste-notice">{t.fallbackAction}<ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <footer className={styles.footer}><p>{t.legal}</p><nav><Link href="/privacy">{t.privacy}</Link><Link href="/methodology/confidence">{t.methodology}</Link></nav></footer>
  </main>;
}
