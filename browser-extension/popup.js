'use strict';

const POLICYWATCHER_ORIGIN = 'https://www.policywatcher.online';
const POLICY_TYPES = ['privacy', 'terms', 'cookies', 'ai', 'acceptable-use'];

const copy = {
  it: {
    pageTitle: 'PolicyWatcher: Cosa è cambiato? BETA', versionLabel: 'Estensione beta', openWebsite: 'Apri policywatcher.online', language: 'Lingua', evidenceJourney: 'Notifica visibile, indizi locali, evidenze PolicyWatcher', privacyBoundary: 'Confine di privacy', betaInfoAction: 'Informazioni e limiti della versione Beta', betaInfoTitle: 'Versione di test', betaInfoBody: 'Può produrre risultati incompleti. Non usare comunicazioni riservate; il contenuto grezzo resta locale. Solo informativo, non è consulenza legale.',
    disclosureTitle: 'Prima di leggere la pagina', disclosureLead: 'PolicyWatcher chiederà accesso temporaneo alla scheda solo dopo la tua conferma.',
    railNotice: 'Notifica visibile', railNoticeBody: 'Seleziona il testo della notifica.', railLocal: 'Indizi locali', railLocalBody: 'Letto e scartato qui.',
    railEvidence: 'Evidenze PolicyWatcher', railEvidenceBody: 'Solo indizi confermati.', onDevice: 'Sul tuo dispositivo', onPolicyWatcher: 'In PolicyWatcher',
    factAccess: 'PolicyWatcher usa l’accesso temporaneo activeTab solo quando premi il pulsante.', localOnly: 'Resta locale', factDiscard: 'Testo letto nel browser e scartato subito.',
    mayCross: 'Può essere inviato', factMayCross: 'Organizzazione/dominio confermati, URL pulito, categorie e date.', factNever: 'Mai inviati o conservati: indirizzo email, oggetto, corpo, allegati o fingerprint.', betaWarningTitle: 'Stai usando una versione BETA', betaWarningSafety: 'Software pre-release: estrazione ed evidenze possono essere incomplete o non disponibili. Non usarlo con comunicazioni riservate, sanitarie, finanziarie, lavorative o di autenticazione.', betaWarningBoundary: 'Solo informativo, non è consulenza legale. Il contenuto grezzo resta locale e non viene trasmesso.', continue: 'Ho capito, continua e analizza',
    localInspection: 'Analisi locale', captureTitle: 'Controlla questa notifica', captureLead: 'Per maggiore precisione, seleziona prima il testo della notifica nella pagina.',
    selectTip: 'Seleziona la parte della mail che descrive l’aggiornamento.', scan: 'Analizza la scheda localmente', scanning: 'Analisi locale in corso…', or: 'oppure',
    manual: 'Inserisci solo gli indizi manualmente', unsupported: 'Usa l’inserimento manuale per PDF, pagine protette o schede non supportate.',
    scanUnsupported: 'Questa scheda non può essere analizzata. Puoi inserire gli indizi manualmente.', scanFailed: 'Non è stato possibile analizzare la scheda. Nessun testo è stato inviato.',
    back: 'Indietro', confirmClues: 'Conferma degli indizi', reviewTitle: 'Controlla prima dell’invio', selectedSource: 'Testo selezionato', pageSource: 'Pagina visibile', manualSource: 'Inserimento manuale',
    confidenceHigh: 'Confidenza alta', confidenceMedium: 'Confidenza media', confidenceLow: 'Da verificare', discardConfirmed: 'Testo grezzo scartato. Non è entrato nel popup.', manualBoundary: 'Nessun testo della pagina è stato analizzato: possono essere inviati solo i campi che compili.',
    company: 'Organizzazione', senderDomain: 'Dominio mittente', sourceUrl: 'URL ufficiale della policy (facoltativo)', noticeDate: 'Data notifica', effectiveDate: 'Entrata in vigore',
    policyTypes: 'Policy indicate', privacy: 'Privacy', terms: 'Termini', cookies: 'Cookie', ai: 'IA', acceptableUse: 'Uso accettabile',
    scopeTitle: 'Dal segnale all’intero portafoglio', scopeBody: 'Le categorie iniziali ordinano i risultati, ma PolicyWatcher controlla tutte le policy pubbliche monitorate dell’azienda.',
    submit: 'Controlla le evidenze PolicyWatcher', submitting: 'Verifica in corso…', payloadNote: 'Partono solo organizzazione/dominio, URL ripulito, categorie, date e lingua.',
    missingClue: 'Indica almeno un’organizzazione, un dominio mittente o un URL ufficiale valido.', invalidDomain: 'Controlla il dominio mittente.', invalidUrl: 'Inserisci un URL ufficiale http o https valido.', editClues: 'Modifica indizi',
    resultMatchedKicker: 'Confronti pubblicati trovati', resultMatchedTitle: 'Evidenze verificate disponibili', resultMatchedBody: 'PolicyWatcher ha trovato confronti pubblicati. La notifica resta un segnale e non prova da sola una modifica specifica.',
    resultMonitoredKicker: 'Azienda monitorata', resultMonitoredTitle: 'Confronto non ancora verificato', resultMonitoredBody: 'Le fonti sono monitorate, ma non esiste ancora un confronto storico pubblicato. Una prima baseline descrive lo stato attuale: non dimostra cosa sia cambiato in passato.',
    resultQueuedKicker: 'Revisione umana', resultQueuedTitle: 'Richiesta presa in carico', resultQueuedBody: 'È stato creato un ticket operativo non personale. Nessuna scansione o pubblicazione parte senza approvazione umana; la prima baseline non proverà una modifica storica.',
    resultAmbiguousKicker: 'Conferma necessaria', resultAmbiguousTitle: 'Quale azienda intendevi?', resultAmbiguousBody: 'Gli indizi corrispondono a più organizzazioni. PolicyWatcher non sceglie silenziosamente.',
    resultConflictKicker: 'Indizi in conflitto', resultConflictTitle: 'Gli indizi indicano aziende diverse', resultConflictBody: 'Il nome e la fonte non concordano. Correggi gli indizi prima di riprovare.',
    resultRateKicker: 'Limite temporaneo', resultRateTitle: 'Troppe verifiche ravvicinate', resultRateBody: 'Per proteggere il servizio, attendi prima di inviare una nuova richiesta. Nessun testo della pagina è stato trasmesso.',
    resultStorageKicker: 'Servizio richieste', resultStorageTitle: 'Archivio temporaneamente non disponibile', resultStorageBody: 'La verifica non può essere registrata in questo momento. Riprova più tardi; nessun testo della pagina è stato inviato o conservato.',
    resultOfflineKicker: 'Connessione assente', resultOfflineTitle: 'PolicyWatcher non è raggiungibile', resultOfflineBody: 'Gli indizi restano nel popup e non sono stati ricevuti dal servizio. Controlla la connessione e riprova.',
    resultErrorKicker: 'Verifica non completata', resultErrorTitle: 'Riprova più tardi', resultErrorBody: 'PolicyWatcher non ha potuto completare la richiesta. Il testo grezzo non è mai stato inviato.',
    organization: 'Organizzazione', monitoredSources: 'Fonti monitorate', reviewedTypes: 'Tipi controllati', reference: 'Riferimento', why: 'Perché vedi questo esito',
    matchedWhy: 'Sono mostrate solo evidenze pubblicate e passate attraverso i gate. Le categorie iniziali danno priorità ma non restringono il controllo aziendale.',
    monitoredWhy: 'L’assenza di un confronto pubblicato non equivale all’assenza di modifiche.', queuedWhy: 'Un amministratore deve approvare azienda e fonti prima di baseline, monitoraggio e pubblicazione.',
    evidence: 'Evidenza', openFull: 'Apri il controllo completo', retry: 'Riprova', choose: 'Verifica questa azienda', privacyLink: 'Privacy', methodologyLink: 'Metodo e limiti', legalNote: 'Non è consulenza legale'
  },
  en: {
    pageTitle: 'PolicyWatcher: What changed? BETA', versionLabel: 'Beta extension', openWebsite: 'Open policywatcher.online', language: 'Language', evidenceJourney: 'Visible notice, local clues, PolicyWatcher evidence', privacyBoundary: 'Privacy boundary', betaInfoAction: 'Beta version information and limitations', betaInfoTitle: 'Testing version', betaInfoBody: 'It may produce incomplete results. Do not use confidential communications; raw content stays local. Informational only, not legal advice.',
    disclosureTitle: 'Before reading this page', disclosureLead: 'PolicyWatcher requests temporary access to the tab only after you confirm.',
    railNotice: 'Visible notice', railNoticeBody: 'Select the notice text.', railLocal: 'Local clues', railLocalBody: 'Read and discarded here.',
    railEvidence: 'PolicyWatcher evidence', railEvidenceBody: 'Confirmed clues only.', onDevice: 'On your device', onPolicyWatcher: 'In PolicyWatcher',
    factAccess: 'PolicyWatcher uses temporary activeTab access only when you press the button.', localOnly: 'Stays local', factDiscard: 'Text is read in the browser and immediately discarded.',
    mayCross: 'May be sent', factMayCross: 'Confirmed organization/domain, cleaned URL, categories and dates.', factNever: 'Never sent or stored: email address, subject, body, attachments or fingerprint.', betaWarningTitle: 'You are using a BETA version', betaWarningSafety: 'Pre-release software: extraction and evidence may be incomplete or unavailable. Do not use it with confidential, health, financial, employment or authentication communications.', betaWarningBoundary: 'Informational only, not legal advice. Raw content stays local and is not transmitted.', continue: 'I understand, continue and inspect',
    localInspection: 'Local inspection', captureTitle: 'Check this notice', captureLead: 'For best precision, select the notification text on the page first.',
    selectTip: 'Select the part of the email that describes the update.', scan: 'Inspect this tab locally', scanning: 'Inspecting locally…', or: 'or',
    manual: 'Enter structured clues manually', unsupported: 'Use manual entry for PDFs, protected pages or unsupported tabs.',
    scanUnsupported: 'This tab cannot be inspected. You can enter the clues manually.', scanFailed: 'The tab could not be inspected. No text was sent.',
    back: 'Back', confirmClues: 'Confirm clues', reviewTitle: 'Review before sending', selectedSource: 'Selected text', pageSource: 'Visible page', manualSource: 'Manual entry',
    confidenceHigh: 'High confidence', confidenceMedium: 'Medium confidence', confidenceLow: 'Needs review', discardConfirmed: 'Raw text discarded. It never entered the popup.', manualBoundary: 'No page text was inspected: only the fields you enter can be sent.',
    company: 'Organization', senderDomain: 'Sender domain', sourceUrl: 'Official policy URL (optional)', noticeDate: 'Notice date', effectiveDate: 'Effective date',
    policyTypes: 'Mentioned policies', privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies', ai: 'AI', acceptableUse: 'Acceptable use',
    scopeTitle: 'From signal to full portfolio', scopeBody: 'Starting categories rank results, but PolicyWatcher checks every public monitored policy for the company.',
    submit: 'Check PolicyWatcher evidence', submitting: 'Checking evidence…', payloadNote: 'Only organization/domain, cleaned URL, categories, dates and language are sent.',
    missingClue: 'Enter at least an organization, sender domain, or valid official URL.', invalidDomain: 'Check the sender domain.', invalidUrl: 'Enter a valid official http or https URL.', editClues: 'Edit clues',
    resultMatchedKicker: 'Published comparisons found', resultMatchedTitle: 'Verified evidence available', resultMatchedBody: 'PolicyWatcher found published comparisons. The notice remains a signal and does not by itself prove a specific change.',
    resultMonitoredKicker: 'Company monitored', resultMonitoredTitle: 'Comparison not yet verified', resultMonitoredBody: 'Sources are monitored, but no published historical comparison exists yet. A first baseline describes current state; it does not prove what changed in the past.',
    resultQueuedKicker: 'Human review', resultQueuedTitle: 'Request accepted for review', resultQueuedBody: 'A non-personal operational ticket was created. No scan or publication starts without human approval; the first baseline will not prove a historical change.',
    resultAmbiguousKicker: 'Confirmation needed', resultAmbiguousTitle: 'Which company did you mean?', resultAmbiguousBody: 'The clues match more than one organization. PolicyWatcher will not choose silently.',
    resultConflictKicker: 'Conflicting clues', resultConflictTitle: 'The clues point to different companies', resultConflictBody: 'The name and source do not agree. Correct the clues before trying again.',
    resultRateKicker: 'Temporary limit', resultRateTitle: 'Too many recent checks', resultRateBody: 'To protect the service, wait before submitting another request. No page text was transmitted.',
    resultStorageKicker: 'Request service', resultStorageTitle: 'Storage temporarily unavailable', resultStorageBody: 'The check cannot be recorded right now. Try later; no page text was sent or stored.',
    resultOfflineKicker: 'No connection', resultOfflineTitle: 'PolicyWatcher is unreachable', resultOfflineBody: 'The clues remain in the popup and were not received by the service. Check your connection and try again.',
    resultErrorKicker: 'Check not completed', resultErrorTitle: 'Please try again later', resultErrorBody: 'PolicyWatcher could not complete the request. Raw text was never sent.',
    organization: 'Organization', monitoredSources: 'Monitored sources', reviewedTypes: 'Types reviewed', reference: 'Reference', why: 'Why you see this result',
    matchedWhy: 'Only published evidence that passed the gates is shown. Starting categories rank the evidence without narrowing the company-wide check.',
    monitoredWhy: 'No published comparison does not mean no change occurred.', queuedWhy: 'An administrator must approve the company and sources before baseline, monitoring and publication.',
    evidence: 'Evidence', openFull: 'Open full check', retry: 'Try again', choose: 'Check this company', privacyLink: 'Privacy', methodologyLink: 'Method and limits', legalNote: 'Not legal advice'
  }
};

let language = 'it';
let lastResult = null;
let lastCapture = null;

const byId = (id) => document.getElementById(id);
const views = ['disclosure', 'capture', 'review', 'result'];

function translatePage() {
  document.documentElement.lang = language;
  document.title = copy[language].pageTitle;
  byId('extension-version').textContent = `${copy[language].versionLabel} v${chrome.runtime.getManifest().version}`;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = copy[language][node.dataset.i18n];
    if (value) node.textContent = value;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    const value = copy[language][node.dataset.i18nAria];
    if (value) node.setAttribute('aria-label', value);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const value = copy[language][node.dataset.i18nTitle];
    if (value) node.setAttribute('title', value);
  });
  document.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  updateCaptureSummary();
  if (!byId('result-view').hidden && lastResult) renderResult(lastResult);
}

function setBetaInfo(open) {
  const button = byId('beta-info-button');
  const panel = byId('beta-info-panel');
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
}

function showView(name) {
  setBetaInfo(false);
  views.forEach((view) => { byId(`${view}-view`).hidden = view !== name; });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const heading = byId(`${name}-view`).querySelector('h1, [role="status"], button');
  if (heading && name !== 'disclosure') heading.focus?.({ preventScroll: true });
}

function setBusy(busy, context) {
  const button = byId(context === 'scan' ? 'scan-button' : 'submit-button');
  button.disabled = busy;
  const span = button.querySelector('span');
  span.textContent = busy ? copy[language][context === 'scan' ? 'scanning' : 'submitting'] : copy[language][context === 'scan' ? 'scan' : 'submit'];
}

function inspectPageLocally() {
  const POLICY_WORDS = /privacy|informativa|personal data|dati personali|terms|termini|condizioni|conditions|cookie|artificial intelligence|intelligenza artificiale|acceptable use|uso accettabile|policy/i;
  const MAIL_HOSTS = /(^|\.)(mail\.google|outlook|office|live|yahoo|proton|icloud)\./i;
  const REDIRECT_KEYS = /^(?:url|u|target|dest|destination|redirect|redirect_url|continue)$/i;
  const clean = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const cleanVisibleText = (value, max) => String(value || '')
    .replace(/\r/g, '')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
  const cleanDomain = (value) => clean(value, 253).toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.-]/g, '');
  const cleanUrl = (value) => {
    try {
      const parsed = new URL(value, location.href);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      // Opaque click-through URLs can contain a user token or an encoded
      // destination. Fail closed instead of forwarding or guessing it.
      const hasRedirectTarget = Array.from(parsed.searchParams.keys()).some((key) => REDIRECT_KEYS.test(key));
      const looksLikeRedirector = /(?:^|[.-])(?:click|track|tracking|redirect|links?)(?:[.-]|$)/i.test(parsed.hostname)
        || /\/(?:click|track|redirect|out)(?:\/|$)/i.test(parsed.pathname);
      if (hasRedirectTarget || (looksLikeRedirector && parsed.search)) return null;
      parsed.username = '';
      parsed.password = '';
      parsed.search = '';
      parsed.hash = '';
      parsed.hostname = parsed.hostname.toLowerCase();
      return parsed.toString().slice(0, 2000);
    } catch { return null; }
  };
  const normalized = (value) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const policyTypes = (value) => {
    const text = normalized(value);
    const found = [];
    if (/privacy|informativa|personal data|dati personali/.test(text)) found.push('privacy');
    if (/terms|termini|condizioni|conditions|terms of service/.test(text)) found.push('terms');
    if (/cookie/.test(text)) found.push('cookies');
    if (
      /artificial intelligence|intelligenza artificiale|generative ai|ai policy|ai training/.test(text)
      || /funzionalita\s+(?:supportat[aei]\s+dall['’]?\s*)?ia\b|\bia\s+(?:generativa|facoltativa|policy|governance|training|model|system|feature)/.test(text)
    ) found.push('ai');
    if (/acceptable use|uso accettabile/.test(text)) found.push('acceptable-use');
    return found;
  };
  const toDate = (value) => {
    if (!value) return null;
    const months = { gennaio: 'January', febbraio: 'February', marzo: 'March', aprile: 'April', maggio: 'May', giugno: 'June', luglio: 'July', agosto: 'August', settembre: 'September', ottobre: 'October', novembre: 'November', dicembre: 'December' };
    let prepared = String(value).replace(/\s+at\s+/gi, ' ').replace(/(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/gi, (match) => months[match.toLowerCase()]).replace(/(\d)[°º]/g, '$1');
    const parsed = new Date(prepared);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  };

  const selectionState = window.getSelection ? window.getSelection() : null;
  const selection = cleanVisibleText(selectionState ? selectionState.toString() : '', 50000);
  const sourceKind = selection.length >= 20 ? 'selection' : 'page';
  const pageVisible = cleanVisibleText(document.body ? document.body.innerText : '', 50000);
  const visible = selection || pageVisible;
  const title = clean(document.title, 300);
  const working = `${title}\n${visible}`;
  const metadataWorking = `${title}\n${pageVisible}`;

  const senderMatch = metadataWorking.match(/(?:^|\n)\s*(?:from|da|mittente)\s*:\s*([^\n]{1,180})/i);
  const senderEmail = senderMatch?.[1]?.match(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/i);
  let senderDomain = senderEmail ? cleanDomain(senderEmail[1]) : null;
  // The value comes from innerText, not HTML. Remove address syntax one token
  // class at a time instead of attempting incomplete multi-character tag
  // stripping, then keep rendering through form values/textContent only.
  let companyName = senderMatch ? clean(senderMatch[1]
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[<>]/g, ' '), 160) : null;
  companyName = companyName && companyName.length > 1 ? companyName.replace(/^["']|["']$/g, '').trim() : null;
  if (!companyName) {
    const signature = working.match(/(?:^|\n)[ \t]*(?:il[ \t]+)?team(?:[ \t]+(?:di|of))?[ \t]+([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]*$/imu)
      || working.match(/(?:^|\n)[ \t]*(?:the[ \t]+)?([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]+team[ \t]*$/imu)
      || metadataWorking.match(/(?:^|\n)[ \t]*(?:il[ \t]+)?team(?:[ \t]+(?:di|of))?[ \t]+([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]*$/imu)
      || metadataWorking.match(/(?:^|\n)[ \t]*(?:the[ \t]+)?([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]+team[ \t]*$/imu);
    const candidate = clean(signature?.[1], 160).replace(/[.!,:;]+$/, '');
    companyName = candidate && !/^(?:utente|cliente|customer|support|assistenza|staff|team)$/i.test(candidate)
      ? candidate
      : null;
  }

  let notificationContext = null;
  if (sourceKind === 'selection' && selectionState && selectionState.rangeCount > 0) {
    const common = selectionState.getRangeAt(0).commonAncestorContainer;
    const commonElement = common?.nodeType === 1 ? common : common?.parentElement;
    notificationContext = commonElement?.closest?.('article, [role="article"], [data-message-id], [data-message-id] [role="main"], main') || commonElement || null;
  }
  if (!notificationContext) {
    notificationContext = document.querySelector?.('article[role="article"], [data-message-id], main article, [role="main"] article') || null;
  }
  // When a message context is available, never fall back to global webmail
  // navigation/footer anchors: no link is safer than the wrong link.
  const anchorRoot = notificationContext?.querySelectorAll ? notificationContext : document;
  const anchors = Array.from(anchorRoot.querySelectorAll('a[href]')).slice(0, 1000);
  let sourceUrl = null;
  for (const anchor of anchors) {
    const label = `${clean(anchor.textContent, 180)} ${clean(anchor.getAttribute('aria-label'), 100)} ${clean(anchor.href, 500)}`;
    if (!POLICY_WORDS.test(label)) continue;
    const candidate = cleanUrl(anchor.href);
    if (candidate && !MAIL_HOSTS.test(new URL(candidate).hostname)) { sourceUrl = candidate; break; }
  }
  if (!sourceUrl && POLICY_WORDS.test(location.pathname) && !MAIL_HOSTS.test(location.hostname)) sourceUrl = cleanUrl(location.href);
  if (!senderDomain && sourceUrl) senderDomain = cleanDomain(new URL(sourceUrl).hostname);
  if (!companyName && senderDomain) {
    const label = senderDomain.split('.').slice(-2, -1)[0] || '';
    companyName = label ? label.charAt(0).toUpperCase() + label.slice(1) : null;
  }

  const dateHeader = metadataWorking.match(/(?:^|\n)\s*(?:date|data)\s*:\s*([^\n]{4,120})/i);
  const effective = working.match(/(?:effective|in vigore|a partire dal|with effect from)\s+(?:il\s+|on\s+)?([^\n,.]{4,60}\b20\d{2})/i)
    || working.match(/(?:^|\n|[.!?]\s+)(?:il|on)\s+([^\n,.]{4,45}\b20\d{2})(?=\s+(?:aggiorneremo|we (?:will|are going to) update|entreranno|will take effect))/i);
  const types = policyTypes(working);
  const score = Number(Boolean(senderDomain || sourceUrl)) + Number(Boolean(companyName)) + Number(types.length > 0) + Number(sourceKind === 'selection');

  // Only this structured object crosses the isolated page boundary. `visible`
  // and `working` remain function-local and are discarded when this returns.
  return {
    companyName,
    senderDomain,
    sourceUrl,
    noticeDate: toDate(dateHeader?.[1]),
    effectiveDate: toDate(effective?.[1]),
    policyTypes: types,
    sourceKind,
    confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
    rawDiscarded: true
  };
}

async function inspectActiveTab() {
  setBusy(true, 'scan');
  const status = byId('scan-status');
  status.classList.remove('error');
  status.textContent = copy[language].scanning;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !Number.isInteger(tab.id) || /^(chrome|edge|about|safari-extension):/i.test(tab.url || '')) throw new Error('UNSUPPORTED');
    const injection = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: inspectPageLocally });
    const clues = injection?.[0]?.result;
    if (!clues || typeof clues !== 'object') throw new Error('UNSUPPORTED');
    lastCapture = clues;
    populateReview(clues);
    status.textContent = '';
    showView('review');
  } catch (error) {
    status.classList.add('error');
    status.textContent = error?.message === 'UNSUPPORTED' ? copy[language].scanUnsupported : copy[language].scanFailed;
  } finally { setBusy(false, 'scan'); }
}

function populateReview(clues) {
  byId('company-name').value = clues.companyName || '';
  byId('sender-domain').value = clues.senderDomain || '';
  byId('source-url').value = clues.sourceUrl || '';
  byId('notice-date').value = clues.noticeDate || '';
  byId('effective-date').value = clues.effectiveDate || '';
  document.querySelectorAll('input[name="policyType"]').forEach((input) => { input.checked = (clues.policyTypes || []).includes(input.value); });
  byId('discard-confirmation').hidden = !clues.rawDiscarded;
  byId('manual-confirmation').hidden = clues.sourceKind !== 'manual';
  byId('form-error').textContent = '';
  updateCaptureSummary();
}

function updateCaptureSummary() {
  if (!lastCapture) return;
  const sourceKey = lastCapture.sourceKind === 'selection' ? 'selectedSource' : lastCapture.sourceKind === 'page' ? 'pageSource' : 'manualSource';
  const confidenceKey = lastCapture.confidence === 'high' ? 'confidenceHigh' : lastCapture.confidence === 'medium' ? 'confidenceMedium' : 'confidenceLow';
  byId('source-label').textContent = copy[language][sourceKey];
  byId('confidence-label').textContent = copy[language][confidenceKey];
}

function cleanDomain(value) {
  const candidate = String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(candidate) && candidate.includes('.') ? candidate : null;
}

function cleanUrl(value) {
  if (!String(value || '').trim()) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().slice(0, 2000);
  } catch { return null; }
}

function payloadFromForm() {
  const companyName = byId('company-name').value.trim().slice(0, 160);
  const senderInput = byId('sender-domain').value.trim();
  const senderDomain = senderInput ? cleanDomain(senderInput) : '';
  if (senderInput && !senderDomain) throw new Error('INVALID_DOMAIN');
  const sourceInput = byId('source-url').value.trim();
  const sourceUrl = sourceInput ? cleanUrl(sourceInput) : '';
  if (sourceInput && !sourceUrl) throw new Error('INVALID_URL');
  if (!companyName && !senderDomain && !sourceUrl) throw new Error('MISSING_CLUE');
  return {
    companyName,
    senderDomain,
    sourceUrl,
    noticeDate: byId('notice-date').value || '',
    effectiveDate: byId('effective-date').value || '',
    policyTypes: Array.from(document.querySelectorAll('input[name="policyType"]:checked')).map((input) => input.value).filter((type) => POLICY_TYPES.includes(type)),
    lang: language,
    honeypot: ''
  };
}

function queryEvidence(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'POLICYWATCHER_QUERY', payload }, (response) => {
      if (chrome.runtime.lastError) { reject(new Error('OFFLINE')); return; }
      resolve(response);
    });
  });
}

async function submitReview(event) {
  event.preventDefault();
  const errorBox = byId('form-error');
  errorBox.textContent = '';
  let payload;
  try { payload = payloadFromForm(); }
  catch (error) {
    errorBox.textContent = copy[language][error.message === 'INVALID_DOMAIN' ? 'invalidDomain' : error.message === 'INVALID_URL' ? 'invalidUrl' : 'missingClue'];
    return;
  }
  setBusy(true, 'submit');
  try {
    const response = await queryEvidence(payload);
    if (!response || response.networkError) lastResult = { clientState: 'offline' };
    else if (response.status === 429) lastResult = { clientState: 'rate_limited' };
    else if (response.status === 503 || response.payload?.code === 'POLICY_INQUIRY_STORAGE_UNAVAILABLE') lastResult = { clientState: 'storage_unavailable' };
    else if (!response.ok && response.payload?.state !== 'conflict') lastResult = { clientState: 'general_error' };
    else lastResult = response.payload;
    renderResult(lastResult);
    showView('result');
  } catch { lastResult = { clientState: 'offline' }; renderResult(lastResult); showView('result'); }
  finally { setBusy(false, 'submit'); }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function addMeta(container, label, value) {
  const item = element('div');
  item.append(element('dt', '', label), element('dd', '', value));
  container.append(item);
}

function addExplanation(container, text) {
  const block = element('div', 'explain-block');
  block.append(element('strong', '', copy[language].why), element('p', '', text));
  container.append(block);
}

function addReference(container, reference) {
  if (!reference) return;
  const line = element('p', 'reference');
  line.append(`${copy[language].reference}: `, element('code', '', String(reference).slice(0, 100)));
  container.append(line);
}

function addActions(container, retry) {
  const actions = element('div', 'result-actions');
  const full = element('a', 'primary-button', copy[language].openFull);
  full.href = `${POLICYWATCHER_ORIGIN}/what-changed`;
  full.target = '_blank';
  full.rel = 'noopener noreferrer';
  actions.append(full);
  if (retry) {
    const button = element('button', 'secondary-button', copy[language].retry);
    button.type = 'button';
    button.addEventListener('click', () => showView('review'));
    actions.append(button);
  }
  container.append(actions);
}

function renderResult(result) {
  const root = byId('result-content');
  root.replaceChildren();
  const state = result?.clientState || result?.state || 'general_error';
  const config = {
    matched: ['resultMatchedKicker', 'resultMatchedTitle', 'resultMatchedBody', ''],
    monitored_no_verified_change: ['resultMonitoredKicker', 'resultMonitoredTitle', 'resultMonitoredBody', 'info'],
    queued: ['resultQueuedKicker', 'resultQueuedTitle', 'resultQueuedBody', 'info'],
    ambiguous: ['resultAmbiguousKicker', 'resultAmbiguousTitle', 'resultAmbiguousBody', 'warning'],
    conflict: ['resultConflictKicker', 'resultConflictTitle', 'resultConflictBody', 'warning'],
    rate_limited: ['resultRateKicker', 'resultRateTitle', 'resultRateBody', 'warning'],
    storage_unavailable: ['resultStorageKicker', 'resultStorageTitle', 'resultStorageBody', 'error'],
    offline: ['resultOfflineKicker', 'resultOfflineTitle', 'resultOfflineBody', 'error'],
    general_error: ['resultErrorKicker', 'resultErrorTitle', 'resultErrorBody', 'error']
  }[state] || ['resultErrorKicker', 'resultErrorTitle', 'resultErrorBody', 'error'];
  const section = element('div', `result-state ${config[3]}`.trim());
  section.append(element('p', 'result-kicker', copy[language][config[0]]), element('h1', 'result-headline', copy[language][config[1]]), element('p', 'result-copy', copy[language][config[2]]));

  if (state === 'matched') {
    const meta = element('dl', 'result-meta');
    addMeta(meta, copy[language].organization, result.company?.name || '-');
    addMeta(meta, copy[language].monitoredSources, result.portfolio?.totalMonitoredSources ?? '-');
    addMeta(meta, copy[language].reviewedTypes, result.portfolio?.policyTypesReviewed?.length ?? '-');
    addMeta(meta, copy[language].evidence, result.changes?.length ?? 0);
    section.append(meta);
    const list = element('div', 'evidence-list');
    (Array.isArray(result.changes) ? result.changes.slice(0, 3) : []).forEach((change) => {
      const item = element('article', 'evidence-item');
      const summary = language === 'it' ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn;
      item.append(element('strong', '', change.policy?.name || change.policy?.type || copy[language].evidence), element('p', '', summary || '-'));
      list.append(item);
    });
    section.append(list);
    addExplanation(section, copy[language].matchedWhy);
    addActions(section, false);
  } else if (state === 'monitored_no_verified_change') {
    const meta = element('dl', 'result-meta');
    addMeta(meta, copy[language].organization, result.company?.name || '-');
    addMeta(meta, copy[language].monitoredSources, result.portfolio?.totalMonitoredSources ?? result.monitoredSources?.length ?? '-');
    section.append(meta);
    addReference(section, result.reference);
    addExplanation(section, copy[language].monitoredWhy);
    addActions(section, false);
  } else if (state === 'queued') {
    addReference(section, result.reference);
    addExplanation(section, copy[language].queuedWhy);
    addActions(section, false);
  } else if (state === 'ambiguous') {
    const candidates = element('div', 'candidate-list');
    (Array.isArray(result.candidates) ? result.candidates.slice(0, 6) : []).forEach((candidate) => {
      const button = element('button', '', candidate.name);
      button.type = 'button';
      button.setAttribute('aria-label', `${copy[language].choose}: ${candidate.name}`);
      button.addEventListener('click', () => {
        byId('company-name').value = String(candidate.name || '').slice(0, 160);
        showView('review');
        byId('company-name').focus();
      });
      candidates.append(button);
    });
    section.append(candidates);
    addActions(section, true);
  } else {
    addActions(section, true);
  }
  root.append(section);
}

function openManualReview() {
  lastCapture = { companyName: '', senderDomain: '', sourceUrl: '', noticeDate: '', effectiveDate: '', policyTypes: [], sourceKind: 'manual', confidence: 'low', rawDiscarded: false };
  populateReview(lastCapture);
  showView('review');
  byId('company-name').focus();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => { language = button.dataset.lang === 'en' ? 'en' : 'it'; translatePage(); }));
  byId('beta-info-button').addEventListener('click', () => setBetaInfo(byId('beta-info-button').getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && byId('beta-info-button').getAttribute('aria-expanded') === 'true') {
      setBetaInfo(false);
      byId('beta-info-button').focus();
    }
  });
  byId('continue-button').addEventListener('click', () => showView('capture'));
  byId('scan-button').addEventListener('click', inspectActiveTab);
  byId('manual-button').addEventListener('click', openManualReview);
  byId('review-form').addEventListener('submit', submitReview);
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.back)));
  translatePage();
});
