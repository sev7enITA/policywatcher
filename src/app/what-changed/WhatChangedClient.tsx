'use client';

import { FormEvent, MouseEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, ClipboardCheck, ChevronDown, FileSearch, Languages,
  Laptop, Link2Off, LockKeyhole, Puzzle, RotateCcw, Search,
  ShieldCheck, ShieldQuestion, UserCheck,
} from 'lucide-react';
import {
  parsePolicyInquiryLocally,
  type InquiryPolicyType,
} from '@/lib/policyInquiryClient';
import baseStyles from './whatChanged.module.css';
import explainability from './explainability.module.css';
import refinements from './refinements.module.css';

const styles = { ...baseStyles, ...explainability };

type Lang = 'it' | 'en';
type Change = {
  id: string; createdAt: string; overallRisk: string; overallScore: number;
  tldrEn: string | null; tldrIt: string | null; aiSummaryEn: string; aiSummaryIt: string;
  keyPointsJson: string | null;
  policy: { id: string; name: string; type: string; url: string };
};
type Portfolio = {
  totalMonitoredSources: number;
  policyTypesReviewed: string[];
  startingPolicyTypes: InquiryPolicyType[];
  startingEvidenceCount: number;
  otherEvidenceCount: number;
};
type Result =
  | { state: 'matched'; relationship: 'direct_policy_source' | 'related_policy_type'; company: { name: string }; notificationClues: { noticeDate: string | null; effectiveDate: string | null; policyTypes: InquiryPolicyType[] }; portfolio: Portfolio; startingEvidence: Change[]; otherEvidence: Change[]; changes: Change[] }
  | { state: 'monitored_no_verified_change'; reference: string; company: { name: string }; monitoredSources: Array<{ id: string; url: string; type: string }>; portfolio: Portfolio; baselineNotice: string }
  | { state: 'queued'; reference: string; companyHint?: string | null; baselineNotice?: string }
  | { state: 'ambiguous'; candidates: Array<{ id: string; name: string; slug: string }> }
  | { state: 'conflict'; companyCandidate: { name: string }; sourceCandidate: { name: string } }
  | { state: 'storage_unavailable'; message: string };

const POLICY_TYPES: InquiryPolicyType[] = ['privacy', 'terms', 'cookies', 'ai', 'acceptable-use'];
const policyLabels: Record<Lang, Record<InquiryPolicyType, string>> = {
  it: { privacy: 'Privacy', terms: 'Termini', cookies: 'Cookie', ai: 'IA', 'acceptable-use': 'Uso accettabile' },
  en: { privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies', ai: 'AI', 'acceptable-use': 'Acceptable use' },
};

const copy = {
  it: {
    kicker: 'Dalla notifica all’evidenza', title: 'Hai ricevuto una mail sulle nuove condizioni?',
    lead: 'Scegli il percorso più semplice. L’estensione legge localmente anche i link reali; il copia-incolla contiene solo il testo visibile.',
    trustTitle: 'Privacy per impostazione', trustBody: 'Il contenuto della notifica resta nel browser. A PolicyWatcher arrivano solo gli indizi minimi che confermi.',
    extensionChoiceLabel: 'Consigliato su computer · Beta', extensionChoiceTitle: 'Usa l’estensione browser', extensionChoiceBody: 'Legge localmente testo e link reali. In questa Beta, estrazione o evidenze possono essere incomplete.', extensionChoiceAction: 'Scopri l’estensione Beta',
    pasteChoiceLabel: 'Rapido sul telefono', pasteChoiceTitle: 'Incolla il testo visibile', pasteChoiceBody: 'Il testo semplice non include i link nascosti. Va bene: useremo le fonti già monitorate o avvieremo una richiesta minima di discovery e QA.', pasteChoiceAction: 'Vai al copia-incolla',
    pasteTitle: 'Incolla la notifica', pasteHelp: 'Una sola azione: incolla il testo che vedi nella mail.',
    plainTextLimit: 'Il copia-incolla non conserva i link nascosti dietro “qui” o un pulsante. È normale: non devi ricostruirli manualmente.',
    desktopExtensionHint: 'Su un computer? L’estensione Beta può acquisire il link di partenza dalla pagina aperta, con possibili limiti di estrazione.', extensionShortLink: 'Estensione Beta',
    message: 'Testo della mail o notifica', messagePh: 'Incolla qui il testo ricevuto, anche senza link…',
    localReady: 'Pronto per la verifica', localFallback: 'Policy da identificare',
    editDetails: 'Correggi o aggiungi dettagli', privacyHow: 'Privacy e come funziona',
    privacyLocal: 'Il testo grezzo, l’oggetto, il destinatario e qualsiasi fingerprint restano nel browser.',
    privacyMinimal: 'Invieremo solo azienda o dominio, link ripulito, categorie e date disponibili.',
    privacyPortfolio: 'Controlleremo tutte le policy pubbliche monitorate, non solo quelle citate nella mail.',
    privacyQa: 'Una nuova azienda o fonte viene pubblicata soltanto dopo approvazione e QA umano.',
    reviewTitle: '2. Controlla gli indizi estratti nel browser', reviewHelp: 'Correggi l’azienda e seleziona le policy indicate nella mail. Queste informazioni, non il messaggio, saranno inviate.',
    company: 'Azienda da verificare', companyPh: 'Nome dell’organizzazione', companyRequired: 'Non abbiamo trovato un nome affidabile nel testo. Inserisci soltanto l’organizzazione che ha inviato la notifica.',
    senderDomain: 'Dominio mittente rilevato', startingPolicies: 'Policy indicate nella notifica',
    url: 'Link della policy di partenza (facoltativo)', urlHelp: 'Incollalo separatamente solo se puoi copiarlo facilmente dalla mail o dal sito ufficiale.',
    noticeDate: 'Data della notifica (facoltativa)', effectiveDate: 'Entrata in vigore (facoltativa)',
    scopeTitle: '3. Dalla policy segnalata all’intero portafoglio', scopeBody: 'Le categorie selezionate danno priorità all’analisi; non la limitano. PolicyWatcher controlla tutte le policy pubbliche monitorate dell’azienda.',
    startTile: 'Segnale iniziale', portfolioTile: 'Tutte le policy monitorate', scopeTypes: ['Privacy', 'Termini', 'Cookie', 'IA', 'Uso accettabile'],
    privacy: 'Il testo resta nel browser. Al server arrivano soltanto azienda o dominio, link ripulito, categorie e date. Nessun indirizzo, oggetto, corpo o fingerprint della mail viene raccolto.',
    submit: 'Verifica cosa è cambiato', loading: 'Verifica in corso…',
    conflictTitle: 'Gli indizi indicano due aziende diverse', conflictBody: (company: string, source: string) => `Il nome indica ${company}, mentre il link o dominio indica ${source}. Correggi il nome oppure rimuovi il link: PolicyWatcher non sceglie in automatico.`,
    storageTitle: 'Richiesta non registrata', storageHelp: 'Il servizio non è disponibile in questo momento. Riprova tra poco.', storagePrivacy: 'Il testo della mail non è stato inviato né conservato.', retry: 'Riprova',
    coverage: 'Copertura del portafoglio', monitored: 'Fonti monitorate', typesReviewed: 'Tipi di policy controllati', startingMatches: 'Evidenze del segnale iniziale', otherMatches: 'Altre evidenze aziendali',
    startingEvidence: 'Evidenze del segnale iniziale', startingEvidenceHelp: 'Confronti verificati nelle categorie indicate dalla notifica.',
    otherEvidence: 'Altre evidenze verificate dell’azienda', otherEvidenceHelp: 'Confronti pubblici trovati nelle altre policy monitorate.',
    noStartingEvidence: 'Nessun confronto pubblicato coincide con le categorie iniziali; sono comunque mostrate le altre evidenze aziendali.',
    workflowEyebrow: 'Il percorso dell’evidenza', workflowTitle: 'Dalla mail a una risposta verificabile, in quattro passaggi',
    workflowCaption: 'Il confine mostra esattamente dove finisce l’elaborazione privata e dove inizia la verifica di PolicyWatcher.',
    browserStep: 'Incolla nel browser', browserStepBody: 'Il testo viene letto localmente per individuare gli elementi utili.',
    cluesStep: 'Solo indizi minimi', cluesStepBody: 'Organizzazione o dominio, URL ufficiale ripulito, tipo di policy e date.',
    evidenceStep: 'Controllo delle evidenze', evidenceStepBody: 'Cerchiamo solo confronti pubblicati e fonti che hanno superato i gate.',
    outcomeStep: 'Esito spiegato', outcomeStepBody: 'Confronto verificato, azienda monitorata oppure ticket anonimo per revisione.',
    boundary: 'Confine di privacy', onlyCross: 'Solo questi indizi attraversano il confine', browserSide: 'Sul tuo dispositivo', serverSide: 'In PolicyWatcher',
    neverTitle: 'Non vengono mai inviati o conservati', neverItems: ['Indirizzo email e destinatario', 'Identità completa del mittente', 'Oggetto e corpo del messaggio', 'Allegati e fingerprint del contenuto'],
    sentTitle: 'Inviati solo quando disponibili', sentItems: ['Organizzazione o dominio', 'URL ufficiale senza query', 'Tipo di policy', 'Date di notifica ed efficacia'],
    apiReject: 'Protezione aggiuntiva: l’API rifiuta i campi contenenti il testo grezzo della mail.',
    clue: 'Segnale dalla notifica', verified: 'Evidenze pubbliche disponibili', clueSummary: 'Indizi non personali confermati nel browser', related: 'Perimetro della verifica',
    direct: 'Il link coincide con una fonte monitorata. L’analisi è stata comunque estesa a tutte le policy pubbliche dell’azienda.',
    relatedNote: 'L’azienda è stata identificata dagli indizi confermati. Le categorie iniziali ordinano i risultati senza escludere le altre policy.',
    open: 'Apri il confronto completo', source: 'Fonte ufficiale', noEvidence: 'Azienda monitorata, confronto non ancora verificato', queued: 'Richiesta registrata', queuedDestination: 'La richiesta è nella coda Admin → Policy inquiries.', queuedPrivacy: 'L’amministratore riceve solo gli indizi operativi: il testo della mail resta nel tuo browser.', whatNext: 'Cosa succede ora?',
    reference: 'Riferimento', ambiguous: 'Quale azienda intendevi?', choose: 'Verifica questa azienda', why: 'Perché vedi questo risultato',
    matchedWhy: 'Sono mostrate solo evidenze pubblicate. La mail resta un segnale e non prova da sola una specifica modifica.',
    monitoredWhy: 'Le fonti sono monitorate, ma manca un confronto storico verificato. Una baseline descrive lo stato attuale, non il passato.',
    queuedWhy: 'È stato creato soltanto un ticket operativo non personale. Nessuna scansione o pubblicazione parte senza approvazione umana.',
    ambiguousWhy: 'Gli indizi corrispondono a più organizzazioni. PolicyWatcher non indovina: serve la tua scelta.',
    humanGate: 'Il gate umano prima della pubblicazione', humanSteps: ['Approva l’azienda', 'Verifica le fonti ufficiali', 'Crea la prima baseline', 'Avvia il monitoraggio ricorrente', 'Pubblica solo dopo il QA'],
    privacyDetails: 'Approfondisci la privacy', confidenceDetails: 'Come valutiamo le evidenze', back: 'Dashboard', methodology: 'Metodo e limiti',
    note: 'Non è consulenza legale. Ogni risultato mostra solo evidenze passate attraverso il gate di pubblicazione.',
  },
  en: {
    kicker: 'From notification to evidence', title: 'Did you receive an email about new terms?',
    lead: 'Choose the easiest path. The extension can read real links locally; copy and paste contains visible text only.',
    trustTitle: 'Private by default', trustBody: 'The notification content stays in your browser. Only the minimal clues you confirm reach PolicyWatcher.',
    extensionChoiceLabel: 'Recommended on a computer · Beta', extensionChoiceTitle: 'Use the browser extension', extensionChoiceBody: 'It reads text and real links locally. In this Beta, extraction or evidence may be incomplete.', extensionChoiceAction: 'Explore the Beta extension',
    pasteChoiceLabel: 'Quick on a phone', pasteChoiceTitle: 'Paste visible text', pasteChoiceBody: 'Plain text does not include hidden links. That is fine: we use monitored sources or open a minimized discovery and QA request.', pasteChoiceAction: 'Go to paste',
    pasteTitle: 'Paste the notification', pasteHelp: 'One action: paste the text you can see in the email.',
    plainTextLimit: 'Copy and paste cannot preserve links hidden behind “here” or a button. This is expected; you do not need to reconstruct them.',
    desktopExtensionHint: 'On a computer? The Beta extension can capture the starting link from the open page, with possible extraction limits.', extensionShortLink: 'Beta extension',
    message: 'Email or notification text', messagePh: 'Paste the message here, even without links…',
    localReady: 'Ready to verify', localFallback: 'Policy to identify',
    editDetails: 'Correct or add details', privacyHow: 'Privacy and how it works',
    privacyLocal: 'Raw text, subject, recipient and any fingerprint stay in the browser.',
    privacyMinimal: 'We send only the company or domain, cleaned link, categories and available dates.',
    privacyPortfolio: 'We check every monitored public policy, not only the ones mentioned in the email.',
    privacyQa: 'A new company or source is published only after human approval and QA.',
    reviewTitle: '2. Review clues extracted in your browser', reviewHelp: 'Correct the company and select the policies mentioned in the email. These clues—not the message—will be sent.',
    company: 'Company to verify', companyPh: 'Organization name', companyRequired: 'We could not find a reliable name in the text. Enter only the organization that sent the notification.',
    senderDomain: 'Detected sender domain', startingPolicies: 'Policies mentioned in the notification',
    url: 'Starting policy link (optional)', urlHelp: 'Paste it separately only if you can easily copy it from the email or official site.',
    noticeDate: 'Notification date (optional)', effectiveDate: 'Effective date (optional)',
    scopeTitle: '3. From the reported policy to the whole portfolio', scopeBody: 'Selected categories prioritize the analysis; they never limit it. PolicyWatcher checks every public monitored policy for the company.',
    startTile: 'Starting signal', portfolioTile: 'All monitored policies', scopeTypes: ['Privacy', 'Terms', 'Cookies', 'AI', 'Acceptable use'],
    privacy: 'The text stays in your browser. Only company/domain, cleaned link, categories and dates reach the server. No address, subject, message body or email fingerprint is collected.',
    submit: 'Check what changed', loading: 'Checking…',
    conflictTitle: 'The clues point to two different companies', conflictBody: (company: string, source: string) => `The name points to ${company}, while the link or domain points to ${source}. Correct the name or remove the link; PolicyWatcher will not choose silently.`,
    storageTitle: 'Request not registered', storageHelp: 'The service is unavailable right now. Please try again shortly.', storagePrivacy: 'Your email text was not sent or stored.', retry: 'Try again',
    coverage: 'Portfolio coverage', monitored: 'Monitored sources', typesReviewed: 'Policy types reviewed', startingMatches: 'Starting-signal evidence', otherMatches: 'Other company evidence',
    startingEvidence: 'Starting-signal evidence', startingEvidenceHelp: 'Verified comparisons in the categories mentioned by the notification.',
    otherEvidence: 'Other verified company evidence', otherEvidenceHelp: 'Public comparisons found across the company’s other monitored policies.',
    noStartingEvidence: 'No published comparison matches the starting categories; other company evidence is still shown.',
    workflowEyebrow: 'The evidence journey', workflowTitle: 'From an email to a verifiable answer, in four steps',
    workflowCaption: 'The boundary shows exactly where private processing ends and PolicyWatcher verification begins.',
    browserStep: 'Paste in your browser', browserStepBody: 'The text is read locally to identify useful details.',
    cluesStep: 'Minimal clues only', cluesStepBody: 'Organization or domain, cleaned official URL, policy type and dates.',
    evidenceStep: 'Evidence check', evidenceStepBody: 'We search only published comparisons and sources that passed the gates.',
    outcomeStep: 'Explained outcome', outcomeStepBody: 'Verified comparison, monitored company, or anonymous human-review ticket.',
    boundary: 'Privacy boundary', onlyCross: 'Only these clues cross the boundary', browserSide: 'On your device', serverSide: 'In PolicyWatcher',
    neverTitle: 'Never sent or stored', neverItems: ['Email address and recipient', 'Full sender identity', 'Message subject and body', 'Attachments and content fingerprint'],
    sentTitle: 'Sent only when available', sentItems: ['Organization or domain', 'Official URL without query', 'Policy type', 'Notice and effective dates'],
    apiReject: 'Additional safeguard: the API rejects fields containing raw email text.',
    clue: 'Notification starting signal', verified: 'Public evidence available', clueSummary: 'Non-personal clues confirmed in your browser', related: 'Verification scope',
    direct: 'The link matches a monitored source. The analysis was still expanded to all public company policies.',
    relatedNote: 'The company was identified from confirmed clues. Starting categories order results without excluding other policies.',
    open: 'Open full comparison', source: 'Official source', noEvidence: 'Company monitored, comparison not yet verified', queued: 'Request registered', queuedDestination: 'The request is in the Admin → Policy inquiries queue.', queuedPrivacy: 'The administrator receives only operational clues: the email text stays in your browser.', whatNext: 'What happens next?',
    reference: 'Reference', ambiguous: 'Which company did you mean?', choose: 'Check this company', why: 'Why you see this result',
    matchedWhy: 'Only published evidence is shown. The email remains a signal and does not by itself prove a specific change.',
    monitoredWhy: 'Sources are monitored, but no verified historical comparison exists. A baseline describes the current state, not the past.',
    queuedWhy: 'Only a non-personal operational ticket was created. No scan or publication begins without human approval.',
    ambiguousWhy: 'The clues match more than one organization. PolicyWatcher refuses to guess: you must choose.',
    humanGate: 'The human gate before publication', humanSteps: ['Approve the company', 'Verify official sources', 'Create the first baseline', 'Start recurring monitoring', 'Publish only after QA'],
    privacyDetails: 'Read the privacy details', confidenceDetails: 'How we assess evidence', back: 'Dashboard', methodology: 'Method and limitations',
    note: 'Not legal advice. Results contain only evidence that passed the publication gate.',
  },
};

function keyPoints(change: Change, lang: Lang): string[] {
  try {
    const value = JSON.parse(change.keyPointsJson || '[]') as Array<{ textIt?: string; textEn?: string }>;
    return value.slice(0, 3).map((item) => lang === 'it' ? item.textIt || item.textEn || '' : item.textEn || item.textIt || '').filter(Boolean);
  } catch { return []; }
}

function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export default function WhatChangedClient() {
  const [lang, setLang] = useState<Lang>('it');
  const [companyName, setCompanyName] = useState('');
  const [companyTouched, setCompanyTouched] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [input, setInput] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<InquiryPolicyType[]>([]);
  const [categoriesTouched, setCategoriesTouched] = useState(false);
  const [noticeDate, setNoticeDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [datesTouched, setDatesTouched] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const t = copy[lang];

  const localClues = useMemo(() => {
    try { return parsePolicyInquiryLocally(input); } catch { return null; }
  }, [input]);

  function updateInput(value: string) {
    setInput(value);
    setResult(null);
    setError('');
    try {
      const clues = parsePolicyInquiryLocally(value);
      if (!companyTouched) setCompanyName(clues.companyHint || '');
      if (!categoriesTouched) setSelectedTypes(clues.policyTypes);
      if (!datesTouched) {
        setNoticeDate(dateInputValue(clues.noticeDate));
        setEffectiveDate(dateInputValue(clues.effectiveDate));
      }
    } catch { /* The submit path renders the size/format error. */ }
  }

  function togglePolicyType(type: InquiryPolicyType) {
    setCategoriesTouched(true);
    setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  function focusPasteInput(event: MouseEvent<HTMLAnchorElement>) {
    const textarea = messageInputRef.current;
    if (!textarea) return;
    event.preventDefault();
    window.history.replaceState(null, '', '#paste-notice');
    textarea.focus({ preventScroll: true });
    textarea.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  async function submit(event?: FormEvent, companyOverride?: string) {
    event?.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const clues = parsePolicyInquiryLocally(input, companyOverride || companyName, websiteUrl, {
        policyTypes: selectedTypes,
        noticeDate: noticeDate || null,
        effectiveDate: effectiveDate || null,
      });
      const response = await fetch('/api/policy-inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: clues.companyHint,
          senderDomain: clues.senderDomain,
          sourceUrl: clues.sourceUrl,
          noticeDate: clues.noticeDate,
          effectiveDate: clues.effectiveDate,
          policyTypes: clues.policyTypes,
          lang,
          honeypot,
        }),
      });
      const payload = await response.json();
      if (payload.state === 'conflict') { setResult(payload); return; }
      if (payload.code === 'POLICY_INQUIRY_STORAGE_UNAVAILABLE') {
        setResult({ state: 'storage_unavailable', message: payload.error || t.storageHelp }); return;
      }
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      setResult(payload);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(code === 'INPUT_TOO_LARGE'
        ? (lang === 'it' ? 'Il testo supera 20 KB.' : 'The text exceeds 20 KB.')
        : code === 'INVALID_URL'
          ? (lang === 'it' ? 'Il link della policy non è valido.' : 'The policy link is invalid.')
          : cause instanceof Error ? cause.message : 'Request failed');
    } finally { setLoading(false); }
  }

  function chooseCompany(name: string) {
    setCompanyName(name);
    setCompanyTouched(true);
    void submit(undefined, name);
  }

  function renderChange(change: Change) {
    return <article className={styles.change} key={change.id}>
      <div className={styles.changeMeta}><strong>{change.policy.name}</strong><span data-risk={change.overallRisk}>{change.overallRisk} · {change.overallScore}/10</span><time>{new Date(change.createdAt).toLocaleDateString(lang)}</time></div>
      <p>{lang === 'it' ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn}</p>
      {keyPoints(change, lang).length > 0 && <ul>{keyPoints(change, lang).map((point) => <li key={point}>{point}</li>)}</ul>}
      <div className={`${baseStyles.changeLinks} ${explainability.narrowActions}`}><Link href={`/change/${change.id}?lang=${lang}`}>{t.open}<ArrowRight size={16} /></Link><a href={change.policy.url} target="_blank" rel="noopener noreferrer">{t.source}</a></div>
    </article>;
  }

  const identityLabel = companyName.trim() || localClues?.senderDomain || '';
  const requiresCompany = Boolean(input.trim()) && !identityLabel;
  const canSubmit = Boolean(input.trim()) && Boolean(companyName.trim() || localClues?.senderDomain) && !loading;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><Image src="/logo-mark.png" width={32} height={32} alt="" /><span>PolicyWatcher</span></Link>
        <nav aria-label="Public navigation"><Link href="/what-changed" className={refinements.currentNav} aria-current="page">{lang === 'it' ? 'Cosa è cambiato?' : 'What changed?'}</Link><Link href="/timeline">Timeline</Link><Link href="/observatory">Observatory</Link><Link href="/atlas">Atlas</Link><Link href="/methodology/confidence">{t.methodology}</Link><button type="button" onClick={() => setLang(lang === 'it' ? 'en' : 'it')}><Languages size={16} /> {lang === 'it' ? 'English' : 'Italiano'}</button></nav>
      </header>

      <section className={styles.intro}>
        <p className={styles.kicker}>{t.kicker}</p><h1>{t.title}</h1><p className={styles.lead}>{t.lead}</p>
        <div className={styles.trustStatement} role="note"><ShieldCheck aria-hidden="true" /><div><strong>{t.trustTitle}</strong><span>{t.trustBody}</span></div></div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.captureChoice} aria-label={lang === 'it' ? 'Scegli come acquisire la notifica' : 'Choose how to capture the notification'}>
          <article className={`${styles.capturePath} ${styles.extensionPath}`}>
            <div className={styles.pathIcon}><Puzzle aria-hidden="true" /></div>
            <div className={styles.pathCopy}><p>{t.extensionChoiceLabel}</p><h2>{t.extensionChoiceTitle}</h2><span>{t.extensionChoiceBody}</span></div>
            <Link className={styles.pathAction} href="/browser-extension">{t.extensionChoiceAction}<ArrowRight aria-hidden="true" /></Link>
          </article>
          <article className={`${styles.capturePath} ${styles.pastePath}`}>
            <div className={styles.pathIcon}><ClipboardCheck aria-hidden="true" /></div>
            <div className={styles.pathCopy}><p>{t.pasteChoiceLabel}</p><h2>{t.pasteChoiceTitle}</h2><span>{t.pasteChoiceBody}</span></div>
            <a className={styles.pathAction} href="#paste-notice" onClick={focusPasteInput}>{t.pasteChoiceAction}<ArrowRight aria-hidden="true" /></a>
          </article>
          <p className={styles.mobileExtensionNote}>{t.desktopExtensionHint} <Link href="/browser-extension">{t.extensionShortLink}<ArrowRight aria-hidden="true" /></Link></p>
        </section>

        <form className={`${styles.form} ${styles.guidedForm}`} onSubmit={submit}>
          <section id="paste-notice" className={styles.intakeSection} aria-labelledby="paste-title">
            <div className={styles.compactHeading}><div><h2 id="paste-title">{t.pasteTitle}</h2><p>{t.pasteHelp}</p></div><span><Laptop size={15} />{lang === 'it' ? 'Analisi locale' : 'Local analysis'}</span></div>
            <label className={styles.messageField}>{t.message}<textarea ref={messageInputRef} id="notification-text" required value={input} onChange={(event) => updateInput(event.target.value)} placeholder={t.messagePh} maxLength={20480} rows={8} /></label>
            <div className={styles.plainTextNotice} role="note"><Link2Off aria-hidden="true" /><div><p>{t.plainTextLimit}</p><span>{t.desktopExtensionHint} <Link href="/browser-extension">{t.extensionShortLink}<ArrowRight aria-hidden="true" /></Link></span></div></div>
          </section>

          {input.trim() && <div className={styles.afterPaste}>
            {identityLabel && <div className={styles.localSummary} role="status" aria-live="polite" aria-atomic="true">
              <span><CheckCircle2 aria-hidden="true" />{t.localReady}</span>
              <strong>{identityLabel} <i aria-hidden="true">·</i> {selectedTypes.length ? selectedTypes.map((type) => policyLabels[lang][type]).join(lang === 'it' ? ' e ' : ' & ') : t.localFallback}</strong>
            </div>}

            {requiresCompany && <div className={styles.companyRecovery}>
              <label htmlFor="company-required-input">{t.company}</label>
              <input id="company-required-input" value={companyName} required aria-describedby="company-required" onChange={(event) => { setCompanyTouched(true); setCompanyName(event.target.value); }} placeholder={t.companyPh} maxLength={160} autoComplete="organization" />
              <p id="company-required"><ShieldQuestion size={16} />{t.companyRequired}</p>
            </div>}

            <details className={styles.disclosure}>
              <summary>{t.editDetails}<ChevronDown aria-hidden="true" /></summary>
              <div className={styles.advancedFields}>
                {identityLabel && <label>{t.company}<input value={companyName} onChange={(event) => { setCompanyTouched(true); setCompanyName(event.target.value); }} placeholder={t.companyPh} maxLength={160} autoComplete="organization" /></label>}
                {localClues?.senderDomain && <div className={styles.detectedClue}><span>{t.senderDomain}</span><strong>{localClues.senderDomain}</strong></div>}
                <fieldset className={styles.policyPicker}>
                  <legend>{t.startingPolicies}</legend>
                  <div>{POLICY_TYPES.map((type) => <button type="button" key={type} aria-pressed={selectedTypes.includes(type)} onClick={() => togglePolicyType(type)}><span aria-hidden="true">{selectedTypes.includes(type) ? '✓' : '+'}</span>{policyLabels[lang][type]}</button>)}</div>
                </fieldset>
                <div className={styles.reviewGrid}>
                  <label>{t.noticeDate}<input type="date" value={noticeDate} onChange={(event) => { setDatesTouched(true); setNoticeDate(event.target.value); }} /></label>
                  <label>{t.effectiveDate}<input type="date" value={effectiveDate} onChange={(event) => { setDatesTouched(true); setEffectiveDate(event.target.value); }} /></label>
                </div>
                <label className={styles.urlField}>{t.url}<span>{t.urlHelp}</span><input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://…" inputMode="url" maxLength={2000} /></label>
              </div>
            </details>

            <button className={styles.submit} type="submit" disabled={!canSubmit}>{loading ? t.loading : t.submit}<Search size={18} /></button>

            <details className={`${styles.disclosure} ${styles.privacyDisclosure}`}>
              <summary><span><LockKeyhole aria-hidden="true" />{t.privacyHow}</span><ChevronDown aria-hidden="true" /></summary>
              <div><p>{t.privacyLocal}</p><p>{t.privacyMinimal}</p><p>{t.privacyPortfolio}</p><p>{t.privacyQa}</p><nav><Link href="/privacy">{t.privacyDetails}</Link><Link href="/methodology/confidence">{t.confidenceDetails}</Link></nav></div>
            </details>
          </div>}

          <label className={styles.honeypot} aria-hidden="true">Website<input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>

        {result?.state === 'conflict' && <section className={`${styles.receipt} ${styles.conflictReceipt}`} aria-live="polite" data-result-explanation="conflict"><div className={styles.receiptHeading}><ShieldQuestion /><div><p>{t.clue}</p><h2>{t.conflictTitle}</h2></div></div><p>{t.conflictBody(result.companyCandidate.name, result.sourceCandidate.name)}</p></section>}
        {result?.state === 'storage_unavailable' && <section className={`${styles.receipt} ${styles.unavailableReceipt}`} aria-live="assertive" data-result-explanation="storage_unavailable"><div className={styles.receiptHeading}><FileSearch /><div><p>{lang === 'it' ? 'Non inviata' : 'Not sent'}</p><h2>{t.storageTitle}</h2></div></div><p>{t.storageHelp}</p><p>{t.storagePrivacy}</p><button className={styles.retry} type="button" onClick={() => void submit()} disabled={loading}><RotateCcw aria-hidden="true" />{loading ? t.loading : t.retry}</button></section>}

        {result?.state === 'matched' && <section className={`${styles.receipt} ${styles.matched}`} aria-live="polite">
          <div className={styles.receiptHeading}><CheckCircle2 /><div><p>{t.verified}</p><h2>{result.company.name}</h2></div></div>
          <div className={styles.claim}><span>{t.clue}</span><p>{t.clueSummary}: {result.notificationClues.policyTypes.map((type) => policyLabels[lang][type]).join(', ') || 'policy'}{result.notificationClues.effectiveDate ? ` · ${new Date(result.notificationClues.effectiveDate).toLocaleDateString(lang)}` : ''}</p></div>
          <section className={styles.coverage} aria-labelledby="coverage-title"><h3 id="coverage-title">{t.coverage}</h3><dl><div><dt>{t.monitored}</dt><dd>{result.portfolio.totalMonitoredSources}</dd></div><div><dt>{t.typesReviewed}</dt><dd>{result.portfolio.policyTypesReviewed.length}</dd></div><div><dt>{t.startingMatches}</dt><dd>{result.portfolio.startingEvidenceCount}</dd></div><div><dt>{t.otherMatches}</dt><dd>{result.portfolio.otherEvidenceCount}</dd></div></dl><p>{result.portfolio.policyTypesReviewed.join(' · ')}</p></section>
          <div className={refinements.provenance}><strong>{t.related}</strong><p>{result.relationship === 'direct_policy_source' ? t.direct : t.relatedNote}</p></div>
          <div className={styles.whyBlock} data-result-explanation="matched"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.matchedWhy}</p></div></div>
          <section className={styles.evidenceGroup}><div className={styles.evidenceGroupHeading}><span>01</span><div><h3>{t.startingEvidence}</h3><p>{t.startingEvidenceHelp}</p></div></div>{result.startingEvidence.length ? result.startingEvidence.map(renderChange) : <p className={styles.emptyEvidence}>{t.noStartingEvidence}</p>}</section>
          {result.otherEvidence.length > 0 && <section className={styles.evidenceGroup}><div className={styles.evidenceGroupHeading}><span>02</span><div><h3>{t.otherEvidence}</h3><p>{t.otherEvidenceHelp}</p></div></div>{result.otherEvidence.map(renderChange)}</section>}
        </section>}

        {result?.state === 'monitored_no_verified_change' && <section className={styles.receipt} aria-live="polite">
          <div className={styles.receiptHeading}><FileSearch /><div><p>{t.noEvidence}</p><h2>{result.company.name}</h2></div></div>
          <section className={styles.coverage}><h3>{t.coverage}</h3><dl><div><dt>{t.monitored}</dt><dd>{result.portfolio.totalMonitoredSources}</dd></div><div><dt>{t.typesReviewed}</dt><dd>{result.portfolio.policyTypesReviewed.length}</dd></div></dl><p>{result.portfolio.policyTypesReviewed.join(' · ')}</p></section>
          <p>{result.baselineNotice}</p><p className={styles.reference}>{t.reference}: <code>{result.reference}</code></p>
          <div className={styles.whyBlock} data-result-explanation="monitored_no_verified_change"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.monitoredWhy}</p></div></div>
          {result.monitoredSources.length > 0 && <ul className={styles.sources}>{result.monitoredSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.type}</a></li>)}</ul>}
        </section>}

        {result?.state === 'queued' && <section className={`${styles.receipt} ${styles.queuedReceipt}`} aria-live="polite">
          <div className={styles.receiptHeading}><ClipboardCheck /><div><p>{t.queued}</p><h2>{result.companyHint || (lang === 'it' ? 'Nuova verifica' : 'New verification')}</h2></div></div>
          <p className={styles.queueDestination}>{t.queuedDestination}</p><p className={styles.reference}>{t.reference}: <code>{result.reference}</code></p>
          <p className={styles.queuePrivacy}><LockKeyhole aria-hidden="true" />{t.queuedPrivacy}</p>
          <details className={`${styles.disclosure} ${styles.receiptDisclosure}`}>
            <summary>{t.whatNext}<ChevronDown aria-hidden="true" /></summary>
            <div><p>{result.baselineNotice}</p><div className={styles.whyBlock} data-result-explanation="queued"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.queuedWhy}</p></div></div><div className={styles.humanGate}><div><UserCheck aria-hidden="true" /><strong>{t.humanGate}</strong></div><ol>{t.humanSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></div></div>
          </details>
        </section>}

        {result?.state === 'ambiguous' && <section className={styles.receipt} aria-live="polite"><h2>{t.ambiguous}</h2><div className={styles.whyBlock} data-result-explanation="ambiguous"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.ambiguousWhy}</p></div></div><div className={styles.candidates}>{result.candidates.map((candidate) => <button type="button" key={candidate.id} onClick={() => chooseCompany(candidate.name)}><span>{candidate.name}</span><small>{t.choose}</small></button>)}</div></section>}
      </div>

      <footer className={styles.footer}><p>{t.note}</p><div><Link href="/">{t.back}</Link><Link href="/privacy">Privacy</Link></div></footer>
    </main>
  );
}
