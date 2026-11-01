/** Task vocabulary shared by the dashboard directory and public navigation. */
export type NavigationLane = 'monitor' | 'compare' | 'understand';
export type NavigationGroup = NavigationLane | 'resources' | 'settings';
export type NavigationFilter = NavigationLane | 'all';
export type NavigationLanguage = 'en' | 'it';

export const NAVIGATION_LANES: readonly NavigationLane[] = ['monitor', 'compare', 'understand'];
export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [...NAVIGATION_LANES, 'resources', 'settings'];

export const NAVIGATION_COPY = {
  monitor: { en: { label: 'Monitor', description: 'Services, sources & alerts' }, it: { label: 'Osserva', description: 'Servizi, fonti e avvisi' } },
  compare: { en: { label: 'Compare', description: 'Updates, versions & signals' }, it: { label: 'Confronta', description: 'Modifiche, versioni e segnali' } },
  understand: { en: { label: 'Understand', description: 'Evidence, method & guidance' }, it: { label: 'Approfondisci', description: 'Evidenze, metodo e guide' } },
  resources: { en: { label: 'Explore the project', description: 'Maps, integrations & resources' }, it: { label: 'Esplora il progetto', description: 'Mappe, integrazioni e risorse' } },
  settings: { en: { label: 'Your workspace', description: 'Search, preferences & project information' }, it: { label: 'Il tuo spazio', description: 'Ricerca, preferenze e informazioni' } },
} as const;

const COMMAND_GROUP: Record<string, NavigationGroup> = {
  'per-te': 'monitor', knowledge: 'monitor', observatory: 'monitor', associations: 'monitor', subscribe: 'monitor',
  'what-changed': 'compare', timeline: 'compare', leaderboard: 'compare', signals: 'compare', matrix: 'compare', export: 'compare',
  methodology: 'understand', 'how-to': 'understand', guides: 'understand', trust: 'understand', assistant: 'understand',
  evidence: 'understand', collections: 'understand',
  developers: 'resources', integrations: 'resources', showcase: 'resources', 'press-kit': 'resources',
  atlas: 'resources', 'feature-atlas': 'resources', roadmap: 'resources', infographics: 'resources', pulse: 'resources',
  workspace: 'settings', search: 'settings', changelog: 'settings', language: 'settings', about: 'settings', legal: 'settings',
};

/** Both languages remain searchable regardless of the displayed interface language. */
const COMMAND_TERMS: Record<string, string> = {
  'per-te': 'per te for you watchlist preferiti servizi services',
  knowledge: 'knowledge conoscenza aziende companies policy policies fonti sources documenti records',
  observatory: 'observatory osservatorio monitoraggio monitoring fonti sources',
  associations: 'civic lab associazioni consumatori associations consumers',
  subscribe: 'subscribe subscription alerts avvisi notifiche notifications iscrizione email',
  'what-changed': 'what changed cosa cambiato avviso notice verifica email mail differenze changes',
  timeline: 'timeline cronologia storico history versioni versions modifiche changes',
  leaderboard: 'leaderboard signals segnali aziende companies confronto comparison',
  signals: 'signals segnali leaderboard',
  matrix: 'matrix matrice kpi indicatori confronto compare aziende companies',
  export: 'export esporta esportazione scarica download csv dati data',
  methodology: 'methodology method metodo metodologia confidence affidabilita fonti sources',
  'how-to': 'how to help guide guida aiuto istruzioni',
  guides: 'guides guide aiuto help',
  trust: 'trust quality qualita qa sicurezza security verifiche',
  assistant: 'assistant assistente ai chat domande questions',
  evidence: 'evidence evidenze prove fonti sources',
  collections: 'collections raccolte',
  developers: 'developers sviluppatori api codice code',
  integrations: 'integrations integrazioni connettori connectors enterprise microsoft',
  showcase: 'showcase vetrina presentazione overview',
  'press-kit': 'press kit stampa media immagini assets',
  atlas: 'atlas atlante mappa map sito site',
  'feature-atlas': 'features funzionalita funzioni capacita capabilities',
  roadmap: 'roadmap pianificazione planned community priorita',
  infographics: 'infographics infografiche immagini images',
  pulse: 'pulse editoriale editorial notizie news',
  workspace: 'workspace spazio personalizza configure configura ruolo role',
  search: 'search cerca ricerca aziende companies policy policies',
  changelog: 'changelog release versioni aggiornamenti updates novita',
  language: 'language lingua italiano italian inglese english',
  about: 'about info informazioni progetto project autore author',
  legal: 'terms termini uso use legal legale',
};

export function navigationGroupFor(id: string): NavigationGroup {
  return COMMAND_GROUP[id] ?? 'resources';
}

export function normalizeNavigationQuery(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function filterNavigationItems<T extends { id: string; label: string; tooltip?: string }>(
  items: readonly T[], query: string, lane: NavigationFilter = 'all',
): T[] {
  const tokens = normalizeNavigationQuery(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    // Typing always searches the entire directory, including other lanes.
    if (!tokens.length) return lane === 'all' || navigationGroupFor(item.id) === lane;
    const text = normalizeNavigationQuery(`${item.id} ${item.label} ${item.tooltip ?? ''} ${COMMAND_TERMS[item.id] ?? ''}`);
    return tokens.every((token) => text.includes(token));
  });
}
