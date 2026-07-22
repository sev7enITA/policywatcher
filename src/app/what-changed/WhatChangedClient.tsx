'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Ban, Building2, CalendarDays, Check, CheckCircle2, ClipboardCheck,
  FileSearch, FileText, Files, Languages, Laptop, Link2, LockKeyhole, Search,
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
    lead: 'Incolla il testo così com’è. È normale che il copia-incolla non conservi i link: confermerai localmente azienda e policy citate prima della verifica.',
    trustTitle: 'Il testo della mail non lascia questo browser', trustBody: 'L’estrazione avviene sul tuo dispositivo. PolicyWatcher riceve solo indizi operativi non personali.',
    pasteTitle: '1. Incolla la notifica', pasteHelp: 'Copia il testo visibile della mail. I collegamenti nascosti nei pulsanti possono mancare: non è un errore.',
    message: 'Testo della mail o notifica', messagePh: 'Incolla qui il testo ricevuto, anche senza link…',
    reviewTitle: '2. Controlla gli indizi estratti nel browser', reviewHelp: 'Correggi l’azienda e seleziona le policy indicate nella mail. Queste informazioni, non il messaggio, saranno inviate.',
    company: 'Azienda da verificare', companyPh: 'es. MioDottore', companyRequired: 'Conferma il nome dell’azienda perché nel testo non è presente un dominio mittente affidabile.',
    senderDomain: 'Dominio mittente rilevato', startingPolicies: 'Policy indicate nella notifica',
    url: 'Link della policy di partenza (facoltativo)', urlHelp: 'Incollalo separatamente solo se puoi copiarlo facilmente dalla mail o dal sito ufficiale.',
    noticeDate: 'Data della notifica (facoltativa)', effectiveDate: 'Entrata in vigore (facoltativa)',
    scopeTitle: '3. Dalla policy segnalata all’intero portafoglio', scopeBody: 'Le categorie selezionate danno priorità all’analisi; non la limitano. PolicyWatcher controlla tutte le policy pubbliche monitorate dell’azienda.',
    startTile: 'Segnale iniziale', portfolioTile: 'Tutte le policy monitorate', scopeTypes: ['Privacy', 'Termini', 'Cookie', 'IA', 'Uso accettabile'],
    privacy: 'Il testo resta nel browser. Al server arrivano soltanto azienda o dominio, link ripulito, categorie e date. Nessun indirizzo, oggetto, corpo o fingerprint della mail viene raccolto.',
    submit: 'Controlla il portafoglio policy dell’azienda', loading: 'Controllo dell’intero portafoglio…',
    conflictTitle: 'Gli indizi indicano due aziende diverse', conflictBody: (company: string, source: string) => `Il nome indica ${company}, mentre il link o dominio indica ${source}. Correggi il nome oppure rimuovi il link: PolicyWatcher non sceglie in automatico.`,
    storageTitle: 'Servizio richieste non disponibile', storageHelp: 'L’amministratore deve verificare il database e applicare le migrazioni mancanti, inclusa PolicyInquiry.', storagePrivacy: 'Il testo della mail non è stato inviato né conservato.',
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
    open: 'Apri il confronto completo', source: 'Fonte ufficiale', noEvidence: 'Azienda monitorata, confronto non ancora verificato', queued: 'Richiesta presa in carico',
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
    lead: 'Paste the text as-is. Copying normally loses hidden link targets; that is expected. You will confirm the company and mentioned policies locally before verification.',
    trustTitle: 'Your email text never leaves this browser', trustBody: 'Extraction happens on your device. PolicyWatcher receives only non-personal operational clues.',
    pasteTitle: '1. Paste the notification', pasteHelp: 'Copy the visible email text. Links hidden behind buttons may be missing; this is not an error.',
    message: 'Email or notification text', messagePh: 'Paste the message here, even without links…',
    reviewTitle: '2. Review clues extracted in your browser', reviewHelp: 'Correct the company and select the policies mentioned in the email. These clues—not the message—will be sent.',
    company: 'Company to verify', companyPh: 'e.g. DocPlanner', companyRequired: 'Confirm the company name because the text contains no reliable sender domain.',
    senderDomain: 'Detected sender domain', startingPolicies: 'Policies mentioned in the notification',
    url: 'Starting policy link (optional)', urlHelp: 'Paste it separately only if you can easily copy it from the email or official site.',
    noticeDate: 'Notification date (optional)', effectiveDate: 'Effective date (optional)',
    scopeTitle: '3. From the reported policy to the whole portfolio', scopeBody: 'Selected categories prioritize the analysis; they never limit it. PolicyWatcher checks every public monitored policy for the company.',
    startTile: 'Starting signal', portfolioTile: 'All monitored policies', scopeTypes: ['Privacy', 'Terms', 'Cookies', 'AI', 'Acceptable use'],
    privacy: 'The text stays in your browser. Only company/domain, cleaned link, categories and dates reach the server. No address, subject, message body or email fingerprint is collected.',
    submit: 'Check the company policy portfolio', loading: 'Checking the full portfolio…',
    conflictTitle: 'The clues point to two different companies', conflictBody: (company: string, source: string) => `The name points to ${company}, while the link or domain points to ${source}. Correct the name or remove the link; PolicyWatcher will not choose silently.`,
    storageTitle: 'Request service unavailable', storageHelp: 'The administrator must check the database and apply missing migrations, including PolicyInquiry.', storagePrivacy: 'Your email text was not sent or stored.',
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
    open: 'Open full comparison', source: 'Official source', noEvidence: 'Company monitored, comparison not yet verified', queued: 'Request accepted for review',
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

  const requiresCompany = Boolean(input.trim()) && !localClues?.senderDomain;
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
        <form className={`${styles.form} ${styles.guidedForm}`} onSubmit={submit}>
          <section className={styles.intakeSection} aria-labelledby="paste-title">
            <div className={styles.sectionHeading}><span>01</span><div><h2 id="paste-title">{t.pasteTitle}</h2><p>{t.pasteHelp}</p></div></div>
            <label className={styles.messageField}>{t.message}<textarea required value={input} onChange={(event) => updateInput(event.target.value)} placeholder={t.messagePh} maxLength={20480} rows={8} /></label>
          </section>

          {input.trim() && <section className={`${styles.intakeSection} ${styles.localReview}`} aria-labelledby="review-title">
            <div className={styles.localBadge}><Laptop size={15} />{lang === 'it' ? 'Elaborazione locale' : 'Local processing'}</div>
            <div className={styles.sectionHeading}><span>02</span><div><h2 id="review-title">{t.reviewTitle}</h2><p>{t.reviewHelp}</p></div></div>
            <div className={styles.reviewGrid}>
              <label>{t.company}<input value={companyName} required={requiresCompany} aria-describedby={requiresCompany ? 'company-required' : undefined} onChange={(event) => { setCompanyTouched(true); setCompanyName(event.target.value); }} placeholder={t.companyPh} maxLength={160} /></label>
              {localClues?.senderDomain && <div className={styles.detectedClue}><span>{t.senderDomain}</span><strong>{localClues.senderDomain}</strong></div>}
            </div>
            {requiresCompany && !companyName.trim() && <p id="company-required" className={styles.inlineNotice}><ShieldQuestion size={16} />{t.companyRequired}</p>}
            <fieldset className={styles.policyPicker}>
              <legend>{t.startingPolicies}</legend>
              <div>{POLICY_TYPES.map((type) => <button type="button" key={type} aria-pressed={selectedTypes.includes(type)} onClick={() => togglePolicyType(type)}><span aria-hidden="true">{selectedTypes.includes(type) ? '✓' : '+'}</span>{policyLabels[lang][type]}</button>)}</div>
            </fieldset>
            <div className={styles.reviewGrid}>
              <label>{t.noticeDate}<input type="date" value={noticeDate} onChange={(event) => { setDatesTouched(true); setNoticeDate(event.target.value); }} /></label>
              <label>{t.effectiveDate}<input type="date" value={effectiveDate} onChange={(event) => { setDatesTouched(true); setEffectiveDate(event.target.value); }} /></label>
            </div>
            <label className={styles.urlField}>{t.url}<span>{t.urlHelp}</span><input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://…" inputMode="url" maxLength={2000} /></label>
          </section>}

          <section className={`${styles.intakeSection} ${styles.scopePanel}`} aria-labelledby="scope-title">
            <div className={styles.sectionHeading}><span>03</span><div><h2 id="scope-title">{t.scopeTitle}</h2><p>{t.scopeBody}</p></div></div>
            <div className={styles.portfolioFlow} aria-label={t.scopeBody}>
              <div className={styles.signalTile}><FileText aria-hidden="true" /><span>{t.startTile}</span><strong>{selectedTypes.length ? selectedTypes.map((type) => policyLabels[lang][type]).join(' · ') : (lang === 'it' ? 'Dalla notifica' : 'From the notice')}</strong></div>
              <div className={styles.fanConnector} aria-hidden="true"><i /><i /><i /></div>
              <div className={styles.portfolioTiles}><div className={styles.portfolioLabel}><Files aria-hidden="true" /><span>{t.portfolioTile}</span></div>{t.scopeTypes.map((type, index) => <span key={type} style={{ '--tile-index': index } as React.CSSProperties}>{type}</span>)}</div>
            </div>
          </section>

          <label className={styles.honeypot} aria-hidden="true">Website<input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          <p className={styles.privacy}><LockKeyhole size={17} />{t.privacy}</p>
          <button className={styles.submit} type="submit" disabled={!canSubmit}>{loading ? t.loading : t.submit}<Search size={18} /></button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>

        {result?.state === 'conflict' && <section className={`${styles.receipt} ${styles.conflictReceipt}`} aria-live="polite" data-result-explanation="conflict"><div className={styles.receiptHeading}><ShieldQuestion /><div><p>{t.clue}</p><h2>{t.conflictTitle}</h2></div></div><p>{t.conflictBody(result.companyCandidate.name, result.sourceCandidate.name)}</p></section>}
        {result?.state === 'storage_unavailable' && <section className={`${styles.receipt} ${styles.unavailableReceipt}`} aria-live="polite" data-result-explanation="storage_unavailable"><div className={styles.receiptHeading}><FileSearch /><div><p>{t.queued}</p><h2>{t.storageTitle}</h2></div></div><p>{result.message}</p><p>{t.storagePrivacy}</p></section>}

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

        {result?.state === 'queued' && <section className={styles.receipt} aria-live="polite">
          <div className={styles.receiptHeading}><ClipboardCheck /><div><p>{t.queued}</p><h2>{result.companyHint || (lang === 'it' ? 'Nuova verifica' : 'New verification')}</h2></div></div>
          <p>{result.baselineNotice}</p><p className={styles.reference}>{t.reference}: <code>{result.reference}</code></p>
          <div className={styles.whyBlock} data-result-explanation="queued"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.queuedWhy}</p></div></div>
          <div className={styles.humanGate}><div><UserCheck aria-hidden="true" /><strong>{t.humanGate}</strong></div><ol>{t.humanSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></div>
        </section>}

        {result?.state === 'ambiguous' && <section className={styles.receipt} aria-live="polite"><h2>{t.ambiguous}</h2><div className={styles.whyBlock} data-result-explanation="ambiguous"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.ambiguousWhy}</p></div></div><div className={styles.candidates}>{result.candidates.map((candidate) => <button type="button" key={candidate.id} onClick={() => chooseCompany(candidate.name)}><span>{candidate.name}</span><small>{t.choose}</small></button>)}</div></section>}
      </div>

      <section className={styles.explainer} aria-labelledby="workflow-title">
        <div className={styles.explainerHeading}><div><p>{t.workflowEyebrow}</p><h2 id="workflow-title">{t.workflowTitle}</h2></div><div className={styles.referenceLinks}><Link href="/privacy">{t.privacyDetails}</Link><Link href="/methodology/confidence">{t.confidenceDetails}</Link></div></div>
        <figure className={styles.workflowFigure}><div className={styles.workflowMap}>
          <section className={styles.browserZone} aria-label={t.browserSide}><p className={styles.zoneLabel}><Laptop aria-hidden="true" />{t.browserSide}</p><article className={styles.workflowStep}><span className={styles.stepNumber}>1</span><div><h3>{t.browserStep}</h3><p>{t.browserStepBody}</p></div></article></section>
          <div className={styles.privacyBoundary} role="separator" aria-label={`${t.boundary}. ${t.onlyCross}`}><span className={styles.boundaryMarker}><LockKeyhole aria-hidden="true" /></span><div><strong>{t.boundary}</strong><span>{t.onlyCross}</span></div></div>
          <section className={styles.serverZone} aria-label={t.serverSide}><p className={styles.zoneLabel}><ShieldCheck aria-hidden="true" />{t.serverSide}</p><ol><li className={styles.workflowStep}><span className={styles.stepNumber}>2</span><div><h3>{t.cluesStep}</h3><p>{t.cluesStepBody}</p></div></li><li className={styles.workflowStep}><span className={styles.stepNumber}>3</span><div><h3>{t.evidenceStep}</h3><p>{t.evidenceStepBody}</p></div></li><li className={styles.workflowStep}><span className={styles.stepNumber}>4</span><div><h3>{t.outcomeStep}</h3><p>{t.outcomeStepBody}</p></div></li></ol></section>
        </div><figcaption>{t.workflowCaption}</figcaption></figure>
        <div className={styles.dataBoundary} aria-label={lang === 'it' ? 'Dati esclusi e dati minimi inviati' : 'Excluded data and minimal data sent'}><section className={styles.neverSent}><div className={styles.dataHeading}><Ban aria-hidden="true" /><h3>{t.neverTitle}</h3></div><ul>{t.neverItems.map((item) => <li key={item}><span aria-hidden="true">×</span>{item}</li>)}</ul></section><section className={styles.minimalSent}><div className={styles.dataHeading}><Check aria-hidden="true" /><h3>{t.sentTitle}</h3></div><ul>{t.sentItems.map((item, index) => <li key={item}>{index === 0 ? <Building2 aria-hidden="true" /> : index === 1 ? <Link2 aria-hidden="true" /> : index === 2 ? <FileText aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}{item}</li>)}</ul></section><p className={styles.apiSafeguard}><LockKeyhole aria-hidden="true" />{t.apiReject}</p></div>
      </section>

      <footer className={styles.footer}><p>{t.note}</p><div><Link href="/">{t.back}</Link><Link href="/privacy">Privacy</Link></div></footer>
    </main>
  );
}
