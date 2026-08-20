'use client';

import { ChangeEvent, FormEvent, MouseEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, ClipboardCheck, ChevronDown, FileSearch, FileUp, Languages,
  Laptop, Link2Off, LockKeyhole, Puzzle, RotateCcw, Search,
  ShieldCheck, ShieldQuestion, UserCheck,
} from 'lucide-react';
import {
  parsePolicyInquiryLocally,
  type InquiryPolicyType,
} from '@/lib/policyInquiryClient';
import { parseEmailFileLocally } from '@/lib/emailIntakeClient';
import baseStyles from './whatChanged.module.css';
import explainability from './explainability.module.css';
import refinements from './refinements.module.css';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

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
    kicker: 'VERIFICA NOTIFICA POLICY', title: 'Verifica di una notifica',
    lead: 'L’estensione legge localmente i link presenti nella pagina; il copia-incolla contiene il testo visibile.',
    trustTitle: 'Dati elaborati nel browser', trustBody: 'Il contenuto della notifica resta nel browser. A PolicyWatcher arrivano solo gli indizi minimi che confermi.',
    extensionChoiceLabel: 'Computer · Beta', extensionChoiceTitle: 'Estensione browser', extensionChoiceBody: 'Legge localmente il testo e i link presenti nella pagina. In questa Beta, estrazione o evidenze possono essere incomplete.', extensionChoiceAction: 'Dettagli estensione Beta',
    pasteChoiceLabel: 'Telefono o computer', pasteChoiceTitle: 'Inserimento testo', pasteChoiceBody: 'Il testo semplice non include i link nascosti. PolicyWatcher usa le fonti configurate o registra una richiesta limitata di discovery e QA.', pasteChoiceAction: 'Vai al copia-incolla',
    pasteTitle: 'Testo della notifica', pasteHelp: 'Incolla il testo visibile nella mail o nella notifica.',
    plainTextLimit: 'Il copia-incolla non conserva i link nascosti dietro “qui” o un pulsante. È normale: non devi ricostruirli manualmente.',
    desktopExtensionHint: 'Usa l’estensione browser su un computer per acquisire il link di partenza dalla pagina aperta, con possibili limiti di estrazione.', extensionShortLink: 'Estensione Beta',
    message: 'Testo della mail o notifica', messagePh: 'Incolla qui il testo ricevuto, anche senza link…',
    emlTitle: 'File .eml', emlHelp: 'Il file viene decodificato solo in questo browser. Destinatari e allegati non entrano negli indizi.', emlAction: 'Scegli file .eml',
    emlReady: 'Mail letta localmente', emlAttachment: 'allegato ignorato', emlAttachments: 'allegati ignorati',
    localReady: 'Pronto per la verifica', localFallback: 'Policy da identificare',
    editDetails: 'Correggi o aggiungi dettagli', privacyHow: 'Privacy e come funziona',
    privacyLocal: 'Il testo grezzo, l’oggetto, il destinatario e qualsiasi fingerprint restano nel browser.',
    privacyMinimal: 'Invieremo solo azienda o dominio, link ripulito, categorie e date disponibili.',
    privacyPortfolio: 'Controlleremo il portafoglio di policy pubbliche configurato per l azienda, incluse categorie non citate nella mail.',
    privacyQa: 'Una nuova azienda o fonte viene pubblicata soltanto dopo approvazione e QA umano.',
    reviewTitle: '2. Dati estratti', reviewHelp: 'Correggi l’azienda e seleziona le policy indicate nella mail. Queste informazioni, non il messaggio, saranno inviate.',
    company: 'Azienda da verificare', companyPh: 'Nome dell’organizzazione', companyRequired: 'Non è stato possibile identificare l’organizzazione dal testo. Inserisci il nome dell’organizzazione che ha inviato la notifica.',
    senderDomain: 'Dominio mittente rilevato', startingPolicies: 'Policy indicate nella notifica',
    url: 'Link della policy di partenza (facoltativo)', urlHelp: 'Incollalo separatamente solo se puoi copiarlo facilmente dalla mail o dal sito ufficiale.',
    noticeDate: 'Data della notifica (facoltativa)', effectiveDate: 'Entrata in vigore (facoltativa)',
    scopeTitle: '3. Portafoglio di policy', scopeBody: 'Le categorie selezionate danno priorità all’analisi. PolicyWatcher controlla il portafoglio di policy pubbliche configurato per l’azienda.',
    startTile: 'Segnale iniziale', portfolioTile: 'Portafoglio policy configurato', scopeTypes: ['Privacy', 'Termini', 'Cookie', 'IA', 'Uso accettabile'],
    privacy: 'Il testo resta nel browser. Al server arrivano soltanto azienda o dominio, link ripulito, categorie e date. Nessun indirizzo, oggetto, corpo o fingerprint della mail viene raccolto.',
    submit: 'Verifica cosa è cambiato', loading: 'Verifica in corso…',
    conflictTitle: 'Gli indizi indicano due aziende diverse', conflictBody: (company: string, source: string) => `Il nome indica ${company}, mentre il link o dominio indica ${source}. Correggi il nome oppure rimuovi il link: PolicyWatcher non sceglie in automatico.`,
    storageTitle: 'Richiesta non registrata', storageHelp: 'Il servizio non è disponibile in questo momento. Riprova tra poco.', storagePrivacy: 'Il testo della mail non è stato inviato né conservato.', retry: 'Riprova',
    coverage: 'Copertura del portafoglio', monitored: 'Fonti monitorate', typesReviewed: 'Tipi di policy controllati', startingMatches: 'Evidenze del segnale iniziale', otherMatches: 'Altre evidenze aziendali',
    startingEvidence: 'Evidenze del segnale iniziale', startingEvidenceHelp: 'Confronti pubblicati nelle categorie indicate dalla notifica.',
    otherEvidence: 'Altre evidenze pubblicate dell’azienda', otherEvidenceHelp: 'Confronti pubblici trovati nelle altre policy monitorate.',
    noStartingEvidence: 'Nessun confronto pubblicato coincide con le categorie iniziali; sono comunque mostrate le altre evidenze aziendali.',
    workflowEyebrow: 'FLUSSO DI ELABORAZIONE', workflowTitle: 'Elaborazione della richiesta',
    workflowCaption: 'Il diagramma distingue l’elaborazione nel browser dai dati inviati a PolicyWatcher.',
    browserStep: 'Incolla nel browser', browserStepBody: 'Il testo viene letto localmente per individuare gli elementi utili.',
    cluesStep: 'Solo indizi minimi', cluesStepBody: 'Organizzazione o dominio, URL ufficiale ripulito, tipo di policy e date.',
    evidenceStep: 'Controllo delle evidenze', evidenceStepBody: 'Cerchiamo solo confronti pubblicati e fonti che hanno superato i gate.',
    outcomeStep: 'Esito', outcomeStepBody: 'Confronto pubblicato, azienda monitorata oppure ticket anonimo per revisione.',
    boundary: 'Confine di privacy', onlyCross: 'Solo questi indizi attraversano il confine', browserSide: 'Sul tuo dispositivo', serverSide: 'In PolicyWatcher',
    neverTitle: 'Campi esclusi da trasmissione e conservazione', neverItems: ['Indirizzo email e destinatario', 'Identità completa del mittente', 'Oggetto e corpo del messaggio', 'Allegati e fingerprint del contenuto'],
    sentTitle: 'Inviati solo quando disponibili', sentItems: ['Organizzazione o dominio', 'URL ufficiale senza query', 'Tipo di policy', 'Date di notifica ed efficacia'],
    apiReject: 'Protezione aggiuntiva: l’API rifiuta i campi contenenti il testo grezzo della mail.',
    clue: 'Segnale dalla notifica', verified: 'Evidenze pubbliche disponibili', clueSummary: 'Indizi non personali confermati nel browser', related: 'Perimetro della verifica',
    direct: 'Il link coincide con una fonte monitorata. L analisi ha controllato anche il portafoglio di policy pubbliche configurato per l azienda.',
    relatedNote: 'L’azienda è stata identificata dagli indizi confermati. Le categorie iniziali ordinano i risultati senza escludere le altre policy.',
    open: 'Apri il confronto completo', source: 'Fonte ufficiale', noEvidence: 'Azienda monitorata, confronto non ancora pubblicato', queued: 'Richiesta registrata', queuedDestination: 'La richiesta è nella coda Admin → Policy inquiries.', queuedPrivacy: 'L’amministratore riceve solo gli indizi operativi: il testo della mail resta nel tuo browser.', whatNext: 'Passaggi successivi',
    reference: 'Riferimento', ambiguous: 'Quale azienda intendevi?', choose: 'Verifica questa azienda', why: 'Motivo del risultato',
    matchedWhy: 'Sono mostrate solo evidenze pubblicate. La mail resta un segnale e non prova da sola una specifica modifica.',
    monitoredWhy: 'Le fonti sono monitorate, ma manca un confronto storico pubblicato. Una baseline descrive lo stato attuale, non il passato.',
    queuedWhy: 'È stato creato soltanto un ticket operativo non personale. Nessuna scansione o pubblicazione parte senza approvazione umana.',
    ambiguousWhy: 'Gli indizi corrispondono a più organizzazioni. È richiesta la selezione dell’organizzazione.',
    humanGate: 'Revisione umana', humanSteps: ['Approva l’azienda', 'Rivedi le fonti ufficiali', 'Crea la prima baseline', 'Avvia il monitoraggio ricorrente', 'Applica il gate QA prima della pubblicazione'],
    privacyDetails: 'Approfondisci la privacy', confidenceDetails: 'Come valutiamo le evidenze', back: 'Dashboard', methodology: 'Metodo e limiti',
    note: 'Non è consulenza legale. Ogni risultato mostra solo evidenze passate attraverso il gate di pubblicazione.',
  },
  en: {
    kicker: 'POLICY NOTICE VERIFICATION', title: 'Policy notice verification',
    lead: 'The extension reads links present on the page locally; copy and paste contains visible text.',
    trustTitle: 'Browser processing', trustBody: 'The notification content stays in your browser. Only the minimal clues you confirm reach PolicyWatcher.',
    extensionChoiceLabel: 'Computer · Beta', extensionChoiceTitle: 'Browser extension', extensionChoiceBody: 'It reads text and links present on the page locally. In this Beta, extraction or evidence may be incomplete.', extensionChoiceAction: 'Beta extension details',
    pasteChoiceLabel: 'Phone or computer', pasteChoiceTitle: 'Text input', pasteChoiceBody: 'Plain text does not include hidden links. PolicyWatcher uses configured sources or registers a limited discovery and QA request.', pasteChoiceAction: 'Go to paste',
    pasteTitle: 'Notification text', pasteHelp: 'Paste the visible text from the email or notification.',
    plainTextLimit: 'Copy and paste cannot preserve links hidden behind “here” or a button. This is expected; you do not need to reconstruct them.',
    desktopExtensionHint: 'Use the browser extension on a computer to capture the starting link from the open page, with possible extraction limits.', extensionShortLink: 'Beta extension',
    message: 'Email or notification text', messagePh: 'Paste the message here, even without links…',
    emlTitle: '.eml file', emlHelp: 'The file is decoded only in this browser. Recipients and attachments do not enter the clues.', emlAction: 'Choose .eml file',
    emlReady: 'Email read locally', emlAttachment: 'attachment ignored', emlAttachments: 'attachments ignored',
    localReady: 'Ready to verify', localFallback: 'Policy to identify',
    editDetails: 'Correct or add details', privacyHow: 'Privacy and how it works',
    privacyLocal: 'Raw text, subject, recipient and any fingerprint stay in the browser.',
    privacyMinimal: 'We send only the company or domain, cleaned link, categories and available dates.',
    privacyPortfolio: 'We check the configured public policy portfolio for the company, including categories not mentioned in the email.',
    privacyQa: 'A new company or source is published only after human approval and QA.',
    reviewTitle: '2. Extracted data', reviewHelp: 'Correct the company and select the policies mentioned in the email. These clues, not the message, will be sent.',
    company: 'Company to verify', companyPh: 'Organization name', companyRequired: 'The organization could not be identified from the text. Enter the name of the organization that sent the notification.',
    senderDomain: 'Detected sender domain', startingPolicies: 'Policies mentioned in the notification',
    url: 'Starting policy link (optional)', urlHelp: 'Paste it separately only if you can easily copy it from the email or official site.',
    noticeDate: 'Notification date (optional)', effectiveDate: 'Effective date (optional)',
    scopeTitle: '3. Policy portfolio', scopeBody: 'Selected categories prioritize the analysis. PolicyWatcher checks the configured public policy portfolio for the company.',
    startTile: 'Starting signal', portfolioTile: 'Configured policy portfolio', scopeTypes: ['Privacy', 'Terms', 'Cookies', 'AI', 'Acceptable use'],
    privacy: 'The text stays in your browser. Only company/domain, cleaned link, categories and dates reach the server. No address, subject, message body or email fingerprint is collected.',
    submit: 'Check what changed', loading: 'Checking…',
    conflictTitle: 'The clues point to two different companies', conflictBody: (company: string, source: string) => `The name points to ${company}, while the link or domain points to ${source}. Correct the name or remove the link; PolicyWatcher will not choose silently.`,
    storageTitle: 'Request not registered', storageHelp: 'The service is unavailable right now. Please try again shortly.', storagePrivacy: 'Your email text was not sent or stored.', retry: 'Try again',
    coverage: 'Portfolio coverage', monitored: 'Monitored sources', typesReviewed: 'Policy types reviewed', startingMatches: 'Starting-signal evidence', otherMatches: 'Other company evidence',
    startingEvidence: 'Starting-signal evidence', startingEvidenceHelp: 'Published comparisons in the categories mentioned by the notification.',
    otherEvidence: 'Other published company evidence', otherEvidenceHelp: 'Public comparisons found across the company’s other monitored policies.',
    noStartingEvidence: 'No published comparison matches the starting categories; other company evidence is still shown.',
    workflowEyebrow: 'PROCESSING FLOW', workflowTitle: 'Request processing',
    workflowCaption: 'The diagram distinguishes browser processing from data sent to PolicyWatcher.',
    browserStep: 'Paste in your browser', browserStepBody: 'The text is read locally to identify useful details.',
    cluesStep: 'Minimal clues only', cluesStepBody: 'Organization or domain, cleaned official URL, policy type and dates.',
    evidenceStep: 'Evidence check', evidenceStepBody: 'We search only published comparisons and sources that passed the gates.',
    outcomeStep: 'Outcome', outcomeStepBody: 'Published comparison, monitored company, or anonymous human-review ticket.',
    boundary: 'Privacy boundary', onlyCross: 'Only these clues cross the boundary', browserSide: 'On your device', serverSide: 'In PolicyWatcher',
    neverTitle: 'Fields excluded from transmission and storage', neverItems: ['Email address and recipient', 'Full sender identity', 'Message subject and body', 'Attachments and content fingerprint'],
    sentTitle: 'Sent only when available', sentItems: ['Organization or domain', 'Official URL without query', 'Policy type', 'Notice and effective dates'],
    apiReject: 'Additional safeguard: the API rejects fields containing raw email text.',
    clue: 'Notification starting signal', verified: 'Public evidence available', clueSummary: 'Non-personal clues confirmed in your browser', related: 'Verification scope',
    direct: 'The link matches a monitored source. The analysis also checked the configured public policy portfolio for the company.',
    relatedNote: 'The company was identified from confirmed clues. Starting categories order results without excluding other policies.',
    open: 'Open full comparison', source: 'Official source', noEvidence: 'Company monitored, comparison not yet published', queued: 'Request registered', queuedDestination: 'The request is in the Admin → Policy inquiries queue.', queuedPrivacy: 'The administrator receives only operational clues: the email text stays in your browser.', whatNext: 'Next steps',
    reference: 'Reference', ambiguous: 'Which company did you mean?', choose: 'Check this company', why: 'Result basis',
    matchedWhy: 'Only published evidence is shown. The email remains a signal and does not by itself prove a specific change.',
    monitoredWhy: 'Sources are monitored, but no published historical comparison exists. A baseline describes the current state, not the past.',
    queuedWhy: 'Only a non-personal operational ticket was created. No scan or publication begins without human approval.',
    ambiguousWhy: 'The clues match more than one organization. Organization selection is required.',
    humanGate: 'Human review', humanSteps: ['Approve the company', 'Review official sources', 'Create the first baseline', 'Start recurring monitoring', 'Apply the QA gate before publication'],
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
  const [lang, setLang] = useState<Lang>('en');
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
  const [emailImport, setEmailImport] = useState<{ name: string; ignoredAttachments: number } | null>(null);
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

  async function importEmailFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const parsed = parseEmailFileLocally(new Uint8Array(await file.arrayBuffer()));
      setEmailImport({ name: file.name.slice(0, 120), ignoredAttachments: parsed.ignoredAttachments });
      updateInput(parsed.visibleText);
    } catch (cause) {
      setEmailImport(null);
      const code = cause instanceof Error ? cause.message : '';
      const messages = lang === 'it'
        ? {
            EMAIL_FILE_TOO_LARGE: 'Il file .eml deve essere compreso tra 1 byte e 256 KB.',
            EMAIL_TEXT_TOO_LARGE: 'Il testo utile estratto dalla mail supera 20 KB.',
            EMAIL_TEXT_UNAVAILABLE: 'La mail non contiene testo leggibile senza aprire allegati.',
            INVALID_EMAIL_FILE: 'Il file .eml non ha una struttura MIME supportata.',
          }
        : {
            EMAIL_FILE_TOO_LARGE: 'The .eml file must be between 1 byte and 256 KB.',
            EMAIL_TEXT_TOO_LARGE: 'The useful text extracted from the email exceeds 20 KB.',
            EMAIL_TEXT_UNAVAILABLE: 'The email has no readable text outside attachments.',
            INVALID_EMAIL_FILE: 'The .eml file does not have a supported MIME structure.',
          };
      setError(messages[code as keyof typeof messages] || messages.INVALID_EMAIL_FILE);
    }
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
    <>
      <PublicHeader current="what-changed" lang={lang} />
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
            <label className={styles.messageField}>{t.message}<textarea ref={messageInputRef} id="notification-text" required value={input} onChange={(event) => { setEmailImport(null); updateInput(event.target.value); }} placeholder={t.messagePh} maxLength={20480} rows={8} /></label>
            <div className={styles.emailFileIntake}>
              <div><strong>{t.emlTitle}</strong><span id="email-file-help">{t.emlHelp}</span></div>
              <label className={styles.emailFileAction}><FileUp aria-hidden="true" />{t.emlAction}<input type="file" accept=".eml,message/rfc822" aria-describedby="email-file-help" onChange={(event) => void importEmailFile(event)} /></label>
            </div>
            {emailImport && <p className={styles.emailFileStatus} role="status" aria-live="polite"><CheckCircle2 aria-hidden="true" /><span><strong>{t.emlReady}:</strong> {emailImport.name}{emailImport.ignoredAttachments > 0 ? ` · ${emailImport.ignoredAttachments} ${emailImport.ignoredAttachments === 1 ? t.emlAttachment : t.emlAttachments}` : ''}</span></p>}
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

      <section className={styles.footer} aria-label={lang === 'it' ? 'Limiti e link locali' : 'Boundary and local links'}><p>{t.note}</p><div><Link href="/">{t.back}</Link><Link href="/privacy">Privacy</Link></div></section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
