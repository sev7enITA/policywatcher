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
import { localizedPublicPath } from '@/lib/seo';

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
    installTitle: 'Disponibilità per browser', installLead: 'Stati distinti per browser. Candidato iOS aggiornato il 22 novembre 2026; le indicazioni storiche degli store sono separate dalle prove di compilazione.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Estensione Manifest V3 per browser desktop basati su Chromium.',
    edgeBody: 'La pubblicazione su Edge Add-ons è stata dichiarata in precedenza. La verifica attuale e l’URL della scheda restano da confermare.',
    safariBody: 'Candidato Safari iOS per sviluppatori 0.1.0 (1), runtime condiviso 3.8.3.3. Non disponibile per gli utenti tramite App Store o TestFlight.',
    install: 'Apri e installa', directLinkPending: 'La pubblicazione è storica; verifica attuale e URL Edge Add-ons restano da confermare prima di mostrare un pulsante diretto.', safariNote: 'Le build non firmate non equivalgono a un’app iPhone installabile dagli utenti. Restano necessari collaudo Safari, firma e revisione Apple.',
    fallback: 'Stai usando il telefono o lo store non è ancora disponibile?', fallbackBody: 'Incolla il testo visibile: i link nascosti non saranno inclusi, ma PolicyWatcher può usare le fonti già monitorate o aprire una richiesta minima di discovery e QA.', fallbackAction: 'Continua con il copia-incolla',
    privacy: 'Privacy', methodology: 'Metodo e limiti', contact: 'Contatti', legal: 'Non è consulenza legale.',
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
    installTitle: 'Browser availability', installLead: 'Independent browser states. iOS candidate updated on 22 November 2026; historical store statements are separate from build evidence.',
    chrome: 'Google Chrome', edge: 'Microsoft Edge', safari: 'Safari',
    chromeBody: 'Manifest V3 extension for Chromium-based desktop browsers.',
    edgeBody: 'Edge Add-ons publication was previously reported. Current listing availability and its exact URL still require verification.',
    safariBody: 'Safari iOS developer candidate 0.1.0 (1), shared runtime 3.8.3.3. Not available to end users through the App Store or TestFlight.',
    install: 'View and install', directLinkPending: 'The publication statement is historical; current availability and the Edge Add-ons URL require verification before a direct button is shown.', safariNote: 'Unsigned builds are not an iPhone app installable by ordinary users. Safari qualification, signing and Apple review are still required.',
    fallback: 'On a phone or is the store not available yet?', fallbackBody: 'Paste the visible text: hidden links will not be included, but PolicyWatcher can use monitored sources or open a minimized discovery and QA request.', fallbackAction: 'Continue with copy and paste',
    privacy: 'Privacy', methodology: 'Method and limits', contact: 'Contact', legal: 'Not legal advice.',
  },
} as const;

export default function BrowserExtensionClient({ storeLinks, lang = 'en' }: { storeLinks: BrowserExtensionStoreLinks; lang?: Lang }) {
  const t = copy[lang];
  const stores = [
    { id: 'chrome' as const, name: t.chrome, body: t.chromeBody, icon: Globe2 },
    { id: 'edge' as const, name: t.edge, body: t.edgeBody, icon: Monitor },
    { id: 'safari' as const, name: t.safari, body: t.safariBody, icon: Puzzle },
  ];

  return <main className={styles.shell} lang={lang}>
    <header className={styles.header}>
      <Link href={localizedPublicPath('/', lang)} className={styles.brand}><Image src="/logo-mark.png" width={32} height={32} alt="" /><span>PolicyWatcher</span></Link>
      <div><Link href={localizedPublicPath('/what-changed', lang)}><ArrowLeft aria-hidden="true" />{t.back}</Link><Link href={lang === 'it' ? '/browser-extension' : '/browser-extension?lang=it'}><Languages aria-hidden="true" />{t.switchLanguage}</Link></div>
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
          {id === 'edge' && !hasInstallLink && <small>{t.directLinkPending}</small>}
          {id === 'safari' && <small>{t.safariNote}</small>}
        </div>
      </article>})}</div>
    </section>

    <section className={styles.iosCandidate} id="ios-developer-candidate" aria-labelledby="ios-candidate-title">
      <p>{lang === 'it' ? 'Evidenze di sviluppo · 22 novembre 2026' : 'Development evidence · 22 November 2026'}</p>
      <h2 id="ios-candidate-title">{lang === 'it' ? 'Safari iOS: candidato per sviluppatori' : 'Safari iOS: developer candidate'}</h2>
      <dl>
        <div><dt>{lang === 'it' ? 'Versioni separate' : 'Separate versions'}</dt><dd>{lang === 'it' ? 'Contenitore iOS 0.1.0, build 1. Runtime dell’estensione 3.8.3.3, invariato. La versione del sito rimane 5.5.0.' : 'iOS container 0.1.0, build 1. Extension runtime 3.8.3.3, unchanged. The website remains version 5.5.0.'}</dd></div>
        <div><dt>{lang === 'it' ? 'Osservato localmente' : 'Observed locally'}</dt><dd>{lang === 'it' ? 'Build simulatore e archivio ARM64 per dispositivo, entrambi non firmati. Il contenitore ha mostrato la schermata iniziale in inglese su un simulatore iPhone Duo con iOS 27.1.' : 'Unsigned simulator build and ARM64 device archive. The containing app displayed its initial English screen in an iPhone Duo simulator running iOS 27.1.'}</dd></div>
        <div><dt>{lang === 'it' ? 'Ancora da verificare' : 'Still unverified'}</dt><dd>{lang === 'it' ? 'Attivazione e funzionamento reale in Safari, iPhone fisico, iPad, iOS 17 minimo e accessibilità. Firma, provisioning e revisione Apple restano da completare. Nessun caricamento su App Store o TestFlight.' : 'Actual Safari activation and operation, physical iPhone, iPad, minimum iOS 17 and accessibility. Signing, provisioning and Apple review remain open. No App Store or TestFlight upload.'}</dd></div>
      </dl>
      <p>{lang === 'it' ? 'Queste prove riguardano compilazione e avvio del contenitore. Non dimostrano funzionamento dell’estensione in Safari né disponibilità per gli utenti.' : 'These observations cover compilation and containing-app startup. They do not demonstrate extension operation in Safari or availability to end users.'}</p>
      <a href="https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/browser-extension-ios-assessment-2026-11-22.md" target="_blank" rel="noopener noreferrer">{lang === 'it' ? 'Leggi prove, tentativi e limiti su GitHub' : 'Read evidence, attempts and limits on GitHub'}<ExternalLink aria-hidden="true" /></a>
    </section>

    <section className={styles.fallback}>
      <Link2 aria-hidden="true" /><div><h2>{t.fallback}</h2><p>{t.fallbackBody}</p><Link href={localizedPublicPath('/what-changed#paste-notice', lang)}>{t.fallbackAction}<ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <footer className={styles.footer}><p>{t.legal}</p><nav><Link href={localizedPublicPath('/privacy', lang)}>{t.privacy}</Link><Link href={localizedPublicPath('/methodology/confidence', lang)}>{t.methodology}</Link><Link href={localizedPublicPath('/about', lang)}>{t.contact}</Link></nav></footer>
  </main>;
}
