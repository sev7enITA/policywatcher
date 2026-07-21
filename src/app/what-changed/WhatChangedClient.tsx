'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Languages,
  Laptop,
  Link2,
  LockKeyhole,
  Search,
  ShieldCheck,
  ShieldQuestion,
  UserCheck,
} from 'lucide-react';
import { parsePolicyInquiryLocally } from '@/lib/policyInquiryClient';
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
type Result =
  | { state: 'matched'; relationship: 'direct_policy_source' | 'related_policy_type'; company: { name: string }; notificationClues: { noticeDate: string | null; effectiveDate: string | null; policyTypes: string[] }; changes: Change[] }
  | { state: 'monitored_no_verified_change'; reference: string; company: { name: string }; monitoredSources: Array<{ id: string; url: string; type: string }>; baselineNotice: string }
  | { state: 'queued'; reference: string; companyHint?: string | null; baselineNotice?: string }
  | { state: 'ambiguous'; candidates: Array<{ id: string; name: string; slug: string }> };

const copy = {
  it: {
    kicker: 'Dalla notifica all’evidenza', title: 'Hai ricevuto una mail sulle nuove condizioni?',
    lead: 'Incolla il messaggio o il link ufficiale. PolicyWatcher cerca confronti pubblici verificati: il riassunto del mittente resta un indizio, non una prova.',
    trustTitle: 'Il testo della mail non lascia questo browser', trustBody: 'L’estrazione avviene sul tuo dispositivo. PolicyWatcher riceve solo indizi operativi non personali.',
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
    company: 'Organizzazione (facoltativa)', companyPh: 'es. Waze o BlaBlaCar — non inserire nomi di persone', url: 'Link ufficiale (facoltativo)',
    message: 'Testo della mail o notifica', messagePh: 'Incolla qui intestazione e contenuto essenziale…',
    privacy: 'Il testo resta nel browser: al server inviamo solo organizzazione o dominio, categorie policy e date. Nessun indirizzo, oggetto, contenuto o fingerprint della mail viene raccolto o conservato.',
    submit: 'Verifica cosa è cambiato', loading: 'Verifica delle evidenze…',
    clue: 'Indizio dalla notifica',
    verified: 'Evidenze pubbliche disponibili', clueSummary: 'Indizi non personali elaborati nel browser', related: 'Confronti verificati correlati', direct: 'La fonte ufficiale coincide con quella monitorata, ma la notifica non prova quale versione o confronto descriva.', relatedNote: 'Abbiamo trovato confronti pubblici compatibili con azienda e tipo di policy. La notifica non identifica quale di questi descriva.', open: 'Apri il confronto completo', source: 'Fonte ufficiale',
    noEvidence: 'Azienda monitorata, confronto non ancora verificato', queued: 'Richiesta presa in carico',
    reference: 'Riferimento', ambiguous: 'Quale azienda intendevi?', choose: 'Verifica questa azienda',
    why: 'Perché vedi questo risultato', matchedWhy: 'Esiste un’evidenza pubblicata compatibile. La mail, però, non prova quale versione o specifico cambiamento descriva.',
    monitoredWhy: 'L’organizzazione è monitorata, ma non esiste ancora un confronto storico verificato. Una prima baseline descrive lo stato attuale: non prova cosa sia cambiato in passato.',
    queuedWhy: 'È stato creato soltanto un ticket operativo non personale. Nessuna scansione o pubblicazione parte senza approvazione umana.',
    ambiguousWhy: 'Gli indizi corrispondono a più organizzazioni. PolicyWatcher non indovina: serve la tua scelta prima di cercare evidenze.',
    humanGate: 'Il gate umano prima della pubblicazione', humanSteps: ['Approva l’azienda', 'Verifica le fonti ufficiali', 'Crea la prima baseline', 'Avvia il monitoraggio ricorrente', 'Pubblica solo dopo il QA'],
    privacyDetails: 'Approfondisci la privacy', confidenceDetails: 'Come valutiamo le evidenze',
    back: 'Dashboard', methodology: 'Metodo e limiti', note: 'Non è consulenza legale. Ogni risultato mostra solo evidenze passate attraverso il gate di pubblicazione.',
  },
  en: {
    kicker: 'From notification to evidence', title: 'Did you receive an email about new terms?',
    lead: 'Paste the message or official link. PolicyWatcher checks verified public comparisons; the sender’s summary remains a clue, not evidence.',
    trustTitle: 'Your email text never leaves this browser', trustBody: 'Extraction happens on your device. PolicyWatcher receives only non-personal operational clues.',
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
    company: 'Organization (optional)', companyPh: 'e.g. Waze or BlaBlaCar — do not enter a person’s name', url: 'Official link (optional)',
    message: 'Email or notification text', messagePh: 'Paste the essential headers and content here…',
    privacy: 'The text stays in your browser. Only organization/domain, policy categories and dates reach the server. No address, subject, message content or email fingerprint is collected or retained.',
    submit: 'Check what changed', loading: 'Checking evidence…',
    clue: 'Notification clue',
    verified: 'Public evidence available', clueSummary: 'Non-personal clues processed in your browser', related: 'Related verified comparisons', direct: 'The official source matches a monitored source, but the notification does not prove which version or comparison it describes.', relatedNote: 'We found public comparisons compatible with the company and policy type. The notification does not identify which one it describes.', open: 'Open full comparison', source: 'Official source',
    noEvidence: 'Company monitored, comparison not yet verified', queued: 'Request accepted for review',
    reference: 'Reference', ambiguous: 'Which company did you mean?', choose: 'Check this company',
    why: 'Why you see this result', matchedWhy: 'Compatible published evidence exists. The email itself, however, does not prove which version or specific change it describes.',
    monitoredWhy: 'The organization is monitored, but no verified historical comparison is available yet. A first baseline describes the current state; it does not prove a past change.',
    queuedWhy: 'Only a non-personal operational ticket was created. No scan or publication begins without human approval.',
    ambiguousWhy: 'The clues match more than one organization. PolicyWatcher refuses to guess: you must choose before evidence is searched.',
    humanGate: 'The human gate before publication', humanSteps: ['Approve the company', 'Verify official sources', 'Create the first baseline', 'Start recurring monitoring', 'Publish only after QA'],
    privacyDetails: 'Read the privacy details', confidenceDetails: 'How we assess evidence',
    back: 'Dashboard', methodology: 'Method and limitations', note: 'Not legal advice. Results contain only evidence that passed the publication gate.',
  },
};

function keyPoints(change: Change, lang: Lang): string[] {
  try {
    const value = JSON.parse(change.keyPointsJson || '[]') as Array<{ textIt?: string; textEn?: string }>;
    return value.slice(0, 3).map((item) => lang === 'it' ? item.textIt || item.textEn || '' : item.textEn || item.textIt || '').filter(Boolean);
  } catch { return []; }
}

export default function WhatChangedClient() {
  const [lang, setLang] = useState<Lang>('it');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [input, setInput] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = copy[lang];

  async function submit(event?: FormEvent, companyOverride?: string) {
    event?.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const clues = parsePolicyInquiryLocally(input, companyOverride || companyName, websiteUrl);
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
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      setResult(payload);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(code === 'INPUT_TOO_LARGE'
        ? (lang === 'it' ? 'Il testo supera 20 KB.' : 'The text exceeds 20 KB.')
        : code === 'INVALID_URL'
          ? (lang === 'it' ? 'Il link ufficiale non è valido.' : 'The official link is invalid.')
          : cause instanceof Error ? cause.message : 'Request failed');
    } finally { setLoading(false); }
  }

  function chooseCompany(name: string) {
    setCompanyName(name);
    void submit(undefined, name);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><Image src="/logo-mark.png" width={32} height={32} alt="" /><span>PolicyWatcher</span></Link>
        <nav aria-label="Public navigation"><Link href="/what-changed" className={refinements.currentNav} aria-current="page">{lang === 'it' ? 'Cosa è cambiato?' : 'What changed?'}</Link><Link href="/timeline">Timeline</Link><Link href="/observatory">Observatory</Link><Link href="/atlas">Atlas</Link><Link href="/methodology/confidence">{t.methodology}</Link><button type="button" onClick={() => setLang(lang === 'it' ? 'en' : 'it')}><Languages size={16} /> {lang === 'it' ? 'English' : 'Italiano'}</button></nav>
      </header>

      <section className={styles.intro}>
        <p className={styles.kicker}>{t.kicker}</p><h1>{t.title}</h1><p className={styles.lead}>{t.lead}</p>
        <div className={styles.trustStatement} role="note">
          <ShieldCheck aria-hidden="true" />
          <div><strong>{t.trustTitle}</strong><span>{t.trustBody}</span></div>
        </div>
      </section>

      <section className={styles.explainer} aria-labelledby="workflow-title">
        <div className={styles.explainerHeading}>
          <div><p>{t.workflowEyebrow}</p><h2 id="workflow-title">{t.workflowTitle}</h2></div>
          <div className={styles.referenceLinks}><Link href="/privacy">{t.privacyDetails}</Link><Link href="/methodology/confidence">{t.confidenceDetails}</Link></div>
        </div>

        <figure className={styles.workflowFigure}>
          <div className={styles.workflowMap}>
            <section className={styles.browserZone} aria-label={t.browserSide}>
              <p className={styles.zoneLabel}><Laptop aria-hidden="true" />{t.browserSide}</p>
              <article className={styles.workflowStep}>
                <span className={styles.stepNumber}>1</span>
                <div><h3>{t.browserStep}</h3><p>{t.browserStepBody}</p></div>
              </article>
            </section>

            <div className={styles.privacyBoundary} role="separator" aria-label={`${t.boundary}. ${t.onlyCross}`}>
              <span className={styles.boundaryMarker}><LockKeyhole aria-hidden="true" /></span>
              <div><strong>{t.boundary}</strong><span>{t.onlyCross}</span></div>
            </div>

            <section className={styles.serverZone} aria-label={t.serverSide}>
              <p className={styles.zoneLabel}><ShieldCheck aria-hidden="true" />{t.serverSide}</p>
              <ol>
                <li className={styles.workflowStep}>
                  <span className={styles.stepNumber}>2</span>
                  <div><h3>{t.cluesStep}</h3><p>{t.cluesStepBody}</p></div>
                </li>
                <li className={styles.workflowStep}>
                  <span className={styles.stepNumber}>3</span>
                  <div><h3>{t.evidenceStep}</h3><p>{t.evidenceStepBody}</p></div>
                </li>
                <li className={styles.workflowStep}>
                  <span className={styles.stepNumber}>4</span>
                  <div><h3>{t.outcomeStep}</h3><p>{t.outcomeStepBody}</p></div>
                </li>
              </ol>
            </section>
          </div>
          <figcaption>{t.workflowCaption}</figcaption>
        </figure>

        <div className={styles.dataBoundary} aria-label={lang === 'it' ? 'Dati esclusi e dati minimi inviati' : 'Excluded data and minimal data sent'}>
          <section className={styles.neverSent}>
            <div className={styles.dataHeading}><Ban aria-hidden="true" /><h3>{t.neverTitle}</h3></div>
            <ul>{t.neverItems.map((item) => <li key={item}><span aria-hidden="true">×</span>{item}</li>)}</ul>
          </section>
          <section className={styles.minimalSent}>
            <div className={styles.dataHeading}><Check aria-hidden="true" /><h3>{t.sentTitle}</h3></div>
            <ul>
              {t.sentItems.map((item, index) => <li key={item}>
                {index === 0 ? <Building2 aria-hidden="true" /> : index === 1 ? <Link2 aria-hidden="true" /> : index === 2 ? <FileText aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}
                {item}
              </li>)}
            </ul>
          </section>
          <p className={styles.apiSafeguard}><LockKeyhole aria-hidden="true" />{t.apiReject}</p>
        </div>
      </section>

      <div className={styles.workspace}>
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.twoFields}>
            <label>{t.company}<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t.companyPh} maxLength={160} /></label>
            <label>{t.url}<input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" inputMode="url" maxLength={2000} /></label>
          </div>
          <label>{t.message}<textarea required={!companyName && !websiteUrl} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.messagePh} maxLength={20480} rows={9} /></label>
          <label className={styles.honeypot} aria-hidden="true">Website<input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          <p className={styles.privacy}><LockKeyhole size={17} />{t.privacy}</p>
          <button className={styles.submit} type="submit" disabled={loading || (!input.trim() && !companyName.trim() && !websiteUrl.trim())}>{loading ? t.loading : t.submit}<Search size={18} /></button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>

        {result?.state === 'matched' && <section className={`${styles.receipt} ${styles.matched}`} aria-live="polite">
          <div className={styles.receiptHeading}><CheckCircle2 /><div><p>{t.verified}</p><h2>{result.company.name}</h2></div></div>
          <div className={styles.claim}><span>{t.clue}</span><p>{t.clueSummary}: {result.notificationClues.policyTypes.join(', ') || 'policy'}{result.notificationClues.effectiveDate ? ` · ${new Date(result.notificationClues.effectiveDate).toLocaleDateString(lang)}` : ''}</p></div>
          <div className={refinements.provenance}><strong>{t.related}</strong><p>{result.relationship === 'direct_policy_source' ? t.direct : t.relatedNote}</p></div>
          <div className={styles.whyBlock} data-result-explanation="matched"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.matchedWhy}</p></div></div>
          {result.changes.map((change) => <article className={styles.change} key={change.id}>
            <div className={styles.changeMeta}><strong>{change.policy.name}</strong><span data-risk={change.overallRisk}>{change.overallRisk} · {change.overallScore}/10</span><time>{new Date(change.createdAt).toLocaleDateString(lang)}</time></div>
            <p>{lang === 'it' ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn}</p>
            {keyPoints(change, lang).length > 0 && <ul>{keyPoints(change, lang).map((point) => <li key={point}>{point}</li>)}</ul>}
            <div className={`${baseStyles.changeLinks} ${explainability.narrowActions}`}><Link href={`/change/${change.id}?lang=${lang}`}>{t.open}<ArrowRight size={16} /></Link><a href={change.policy.url} target="_blank" rel="noopener noreferrer">{t.source}</a></div>
          </article>)}
        </section>}

        {result?.state === 'monitored_no_verified_change' && <section className={styles.receipt} aria-live="polite">
          <div className={styles.receiptHeading}><FileSearch /><div><p>{t.noEvidence}</p><h2>{result.company.name}</h2></div></div>
          <p>{result.baselineNotice}</p><p className={styles.reference}>{t.reference}: <code>{result.reference}</code></p>
          <div className={styles.whyBlock} data-result-explanation="monitored_no_verified_change"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.monitoredWhy}</p></div></div>
          {result.monitoredSources.length > 0 && <ul className={styles.sources}>{result.monitoredSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.type}</a></li>)}</ul>}
        </section>}

        {result?.state === 'queued' && <section className={styles.receipt} aria-live="polite">
          <div className={styles.receiptHeading}><ClipboardCheck /><div><p>{t.queued}</p><h2>{result.companyHint || (lang === 'it' ? 'Nuova verifica' : 'New verification')}</h2></div></div>
          <p>{result.baselineNotice}</p><p className={styles.reference}>{t.reference}: <code>{result.reference}</code></p>
          <div className={styles.whyBlock} data-result-explanation="queued"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.queuedWhy}</p></div></div>
          <div className={styles.humanGate}>
            <div><UserCheck aria-hidden="true" /><strong>{t.humanGate}</strong></div>
            <ol>{t.humanSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
          </div>
        </section>}

        {result?.state === 'ambiguous' && <section className={styles.receipt} aria-live="polite"><h2>{t.ambiguous}</h2><div className={styles.whyBlock} data-result-explanation="ambiguous"><ShieldQuestion aria-hidden="true" /><div><strong>{t.why}</strong><p>{t.ambiguousWhy}</p></div></div><div className={styles.candidates}>{result.candidates.map((candidate) => <button type="button" key={candidate.id} onClick={() => chooseCompany(candidate.name)}><span>{candidate.name}</span><small>{t.choose}</small></button>)}</div></section>}
      </div>

      <footer className={styles.footer}><p>{t.note}</p><div><Link href="/">{t.back}</Link><Link href="/privacy">Privacy</Link></div></footer>
    </main>
  );
}
