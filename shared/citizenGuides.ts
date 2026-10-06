import type { CitizenGuide } from './citizen';

/** Editorial review of official public guidance, not a test in the user's account. */
export const CITIZEN_GUIDES: readonly CitizenGuide[] = [
  {
    id: 'openai-training-control', serviceSlugs: ['openai', 'chatgpt'],
    title: { it: 'Controlla l’uso delle conversazioni per migliorare i modelli', en: 'Check how conversations are used to improve models' },
    scope: { it: 'ChatGPT per uso personale. I servizi per organizzazioni possono avere regole diverse.', en: 'Personal ChatGPT accounts. Services for organizations can have different rules.' },
    steps: { it: ['Apri la guida ufficiale e controlla quale tipo di account descrive.', 'Nel tuo account apri le impostazioni e la sezione dei controlli sui dati.', 'Leggi l’opzione relativa al miglioramento dei modelli e scegli la tua preferenza.'], en: ['Open the official guide and check which account type it describes.', 'In your account, open settings and the data controls section.', 'Read the model-improvement setting and choose your preference.'] },
    boundary: { it: 'Questa impostazione non cancella la cronologia. La guida descrive anche eccezioni, inclusi i feedback volontari. PolicyWatcher non legge né modifica il tuo account.', en: 'This setting does not delete history. The guide also describes exceptions, including voluntary feedback. PolicyWatcher cannot read or change your account.' },
    officialUrl: 'https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt', reviewedAt: '2026-10-06',
  },
  {
    id: 'google-activity-control', serviceSlugs: ['google', 'alphabet'],
    title: { it: 'Rivedi il salvataggio delle attività Google', en: 'Review Google activity storage' },
    scope: { it: 'Account Google personale. Le impostazioni possono variare per account e durante gli aggiornamenti dell’interfaccia.', en: 'Personal Google accounts. Settings can differ by account and during interface updates.' },
    steps: { it: ['Apri la guida ufficiale sulle attività web e app.', 'Segui il collegamento alle impostazioni del tuo account.', 'Controlla separatamente il salvataggio futuro e le opzioni per eliminare le attività già presenti.'], en: ['Open the official Web & App Activity guide.', 'Follow its link to your account settings.', 'Review future storage separately from options to delete existing activity.'] },
    boundary: { it: 'Disattivare un salvataggio e cancellare dati esistenti sono scelte diverse. Leggi gli effetti indicati da Google prima di confermare.', en: 'Turning off storage and deleting existing data are different choices. Read Google’s description of the effects before confirming.' },
    officialUrl: 'https://support.google.com/accounts/answer/54068', reviewedAt: '2026-10-06',
  },
  {
    id: 'apple-data-portal', serviceSlugs: ['apple'],
    title: { it: 'Consulta le opzioni Apple per dati e privacy', en: 'Explore Apple data and privacy options' },
    scope: { it: 'Portale Dati e privacy per il tuo account Apple. Le opzioni dipendono dall’account e dal paese.', en: 'Data and Privacy portal for your Apple account. Options depend on the account and country.' },
    steps: { it: ['Apri il portale ufficiale Dati e privacy.', 'Accedi direttamente sul sito Apple, se richiesto.', 'Leggi le opzioni disponibili e i loro effetti prima di avviare una richiesta.'], en: ['Open the official Data and Privacy portal.', 'Sign in directly on Apple’s website if asked.', 'Read the available options and their effects before starting a request.'] },
    boundary: { it: 'PolicyWatcher non riceve le tue credenziali e non invia richieste per tuo conto. Non tutte le opzioni sono disponibili in ogni paese.', en: 'PolicyWatcher does not receive your credentials or submit requests for you. Not every option is available in every country.' },
    officialUrl: 'https://privacy.apple.com/', reviewedAt: '2026-10-06',
  },
  {
    id: 'tiktok-privacy-controls', serviceSlugs: ['tiktok', 'bytedance'],
    title: { it: 'Rivedi la visibilità del tuo account TikTok', en: 'Review your TikTok account visibility' },
    scope: { it: 'Impostazioni di privacy TikTok. Età, paese e tipo di account possono limitare le opzioni.', en: 'TikTok privacy settings. Age, country and account type can limit available options.' },
    steps: { it: ['Apri l’indice ufficiale delle impostazioni di privacy.', 'Scegli la guida sull’opzione che vuoi controllare, ad esempio la visibilità del profilo.', 'Confronta la guida con ciò che compare nel tuo account prima di cambiare un’impostazione.'], en: ['Open the official privacy-settings index.', 'Choose the guide for the setting you want to check, such as profile visibility.', 'Compare the guide with your account before changing a setting.'] },
    boundary: { it: 'Una preferenza di visibilità non risolve tutte le questioni sull’uso dei dati. Le opzioni dei minori possono essere diverse.', en: 'A visibility preference does not settle every question about data use. Options for minors may differ.' },
    officialUrl: 'https://support.tiktok.com/en/account-and-privacy/account-privacy-settings', reviewedAt: '2026-10-06',
  },
  {
    id: 'anthropic-training-information', serviceSlugs: ['anthropic', 'claude'],
    title: { it: 'Controlla le regole sull’uso delle conversazioni Claude', en: 'Check how Claude conversations may be used' },
    scope: { it: 'Prodotti Claude per consumatori. Le offerte commerciali e API hanno condizioni distinte.', en: 'Consumer Claude products. Commercial and API offerings have separate terms.' },
    steps: { it: ['Apri la spiegazione ufficiale sull’addestramento dei modelli.', 'Individua il paragrafo che riguarda il tuo prodotto e tipo di account.', 'Segui i riferimenti ai controlli di privacy e leggi le eccezioni prima di scegliere.'], en: ['Open the official explanation of model training.', 'Find the section for your product and account type.', 'Follow its privacy-control references and read the exceptions before choosing.'] },
    boundary: { it: 'Feedback e controlli di sicurezza possono seguire regole specifiche. Non deduciamo la preferenza attiva nel tuo account.', en: 'Feedback and safety reviews can follow specific rules. We do not infer which preference is active in your account.' },
    officialUrl: 'https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training', reviewedAt: '2026-10-06',
  },
  {
    id: 'microsoft-privacy-dashboard', serviceSlugs: ['microsoft'],
    title: { it: 'Consulta il dashboard privacy Microsoft', en: 'Explore the Microsoft privacy dashboard' },
    scope: { it: 'Account Microsoft personale. I dati disponibili dipendono dai servizi usati e dalle impostazioni.', en: 'Personal Microsoft accounts. Available data depends on the services used and their settings.' },
    steps: { it: ['Apri la guida ufficiale al dashboard privacy.', 'Segui il collegamento al dashboard e accedi su Microsoft, se richiesto.', 'Controlla quali attività sono mostrate e quali richiedono impostazioni in altri servizi.'], en: ['Open the official privacy-dashboard guide.', 'Follow the dashboard link and sign in on Microsoft if asked.', 'Check which activities are shown and which require settings in other services.'] },
    boundary: { it: 'L’assenza di un’attività nel dashboard non dimostra che il servizio non conservi dati. Leggi la spiegazione Microsoft sulle attività mancanti.', en: 'An activity missing from the dashboard does not prove the service stores no data. Read Microsoft’s explanation of missing activities.' },
    officialUrl: 'https://support.microsoft.com/en-us/accounts-billing/security/view-your-data-on-the-privacy-dashboard', reviewedAt: '2026-10-06',
  },
];

export function citizenGuidesForService(slug: string): CitizenGuide[] {
  return CITIZEN_GUIDES.filter(guide => guide.serviceSlugs.includes(slug.toLowerCase()));
}
export function citizenGuideFreshness(guide: CitizenGuide, now = new Date()): 'current' | 'review_due' {
  const age = now.getTime() - Date.parse(`${guide.reviewedAt}T00:00:00Z`);
  return Number.isFinite(age) && age >= 0 && age <= 90 * 86400000 ? 'current' : 'review_due';
}
