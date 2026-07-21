export type Locale = 'en' | 'it';

export type LocalizedText = Record<Locale, string>;

export type ObservatoryContentType =
  | 'regulatory updates'
  | 'AI governance'
  | 'privacy enforcement'
  | 'standards'
  | 'events';

export interface ObservatorySource {
  id: string;
  name: string;
  shortName: string;
  url: string;
  region: string;
  authority: string;
  contentTypes: ObservatoryContentType[];
  reviewCadence: LocalizedText;
  note: LocalizedText;
}

export interface ObservatorySignal {
  id: string;
  sourceId: string;
  title: LocalizedText;
  summary: LocalizedText;
  contentType: ObservatoryContentType;
  region: string;
  dateLabel: LocalizedText;
  localHref: string;
  priority: 'high' | 'medium' | 'watch';
}

export interface ObservatoryEvent {
  id: string;
  title: LocalizedText;
  organizer: string;
  dateLabel: LocalizedText;
  timeLabel: LocalizedText;
  location: LocalizedText;
  summary: LocalizedText;
  href: string;
  calendar: {
    startUtc: string;
    endUtc: string;
    filename: string;
  };
}

export function getObservatoryCountdown(targetDate: Date, now: Date) {
  const targetUtc = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  );
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((targetUtc - nowUtc) / 86_400_000);

  if (days > 1) return `D-${days}`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'Review due';
}

export interface DashboardNotice {
  id: string;
  label: LocalizedText;
  message: LocalizedText;
  href: string;
  tone: 'teal' | 'indigo' | 'amber';
}

export const observatorySources: ObservatorySource[] = [
  {
    id: 'oecd-ai',
    name: 'OECD.AI Policy Observatory',
    shortName: 'OECD.AI',
    url: 'https://oecd.ai/',
    region: 'Global',
    authority: 'Intergovernmental policy observatory',
    contentTypes: ['AI governance', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during monthly governance sweeps',
      it: 'Rivisto nei cicli mensili di governance',
    },
    note: {
      en: 'Country policy resources and AI policy analysis for cross-market context.',
      it: 'Risorse paese e analisi policy AI per contesto multi-mercato.',
    },
  },
  {
    id: 'edpb-news',
    name: 'EDPB News',
    shortName: 'EDPB',
    url: 'https://www.edpb.europa.eu/news_en',
    region: 'European Union',
    authority: 'EU data protection body',
    contentTypes: ['privacy enforcement', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during EU privacy sweeps',
      it: 'Rivisto nei cicli privacy UE',
    },
    note: {
      en: 'Board news, coordinated enforcement updates and guidance signals.',
      it: 'News del comitato, aggiornamenti enforcement coordinato e segnali guida.',
    },
  },
  {
    id: 'eu-ai-office',
    name: 'European AI Office',
    shortName: 'EU AI Office',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
    region: 'European Union',
    authority: 'European Commission AI governance office',
    contentTypes: ['AI governance', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during EU AI Act monitoring',
      it: 'Rivisto nel monitoraggio EU AI Act',
    },
    note: {
      en: 'AI Act implementation, model governance and institutional coordination.',
      it: 'Attuazione AI Act, governance dei modelli e coordinamento istituzionale.',
    },
  },
  {
    id: 'ftc-tech',
    name: 'FTC Technology Blog and News',
    shortName: 'FTC',
    url: 'https://www.ftc.gov/news-events',
    region: 'United States',
    authority: 'US consumer protection agency',
    contentTypes: ['privacy enforcement', 'AI governance', 'regulatory updates'],
    reviewCadence: {
      en: 'Reviewed during US enforcement sweeps',
      it: 'Rivisto nei cicli enforcement USA',
    },
    note: {
      en: 'Consumer protection, privacy, competition and technology enforcement context.',
      it: 'Contesto su protezione consumatori, privacy, concorrenza e tecnologia.',
    },
  },
  {
    id: 'uk-ico',
    name: 'UK ICO News',
    shortName: 'UK ICO',
    url: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/',
    region: 'United Kingdom',
    authority: 'UK information rights regulator',
    contentTypes: ['privacy enforcement', 'regulatory updates', 'events'],
    reviewCadence: {
      en: 'Reviewed during UK privacy sweeps',
      it: 'Rivisto nei cicli privacy UK',
    },
    note: {
      en: 'Regulatory news, consultation updates and enforcement context for UK data rights.',
      it: 'News regolatorie, consultazioni e enforcement per i diritti dati UK.',
    },
  },
  {
    id: 'nist-airc',
    name: 'NIST AI Resource Center',
    shortName: 'NIST AIRC',
    url: 'https://airc.nist.gov/',
    region: 'United States',
    authority: 'US standards and measurement institute',
    contentTypes: ['standards', 'AI governance', 'events'],
    reviewCadence: {
      en: 'Reviewed during standards sweeps',
      it: 'Rivisto nei cicli standard',
    },
    note: {
      en: 'AI RMF, standards resources and implementation support materials.',
      it: 'AI RMF, risorse standard e materiali di supporto implementativo.',
    },
  },
  {
    id: 'ieee-isope',
    name: 'IEEE ISoPE',
    shortName: 'IEEE ISoPE',
    url: 'https://ieee-isope.org/',
    region: 'Global',
    authority: 'Standards and policy engineering community',
    contentTypes: ['standards', 'events', 'AI governance'],
    reviewCadence: {
      en: 'Reviewed during standards and events sweeps',
      it: 'Rivisto nei cicli standard ed eventi',
    },
    note: {
      en: 'Standards-oriented events and policy engineering references.',
      it: 'Eventi orientati agli standard e riferimenti di policy engineering.',
    },
  },
];

export const observatorySignals: ObservatorySignal[] = [
  {
    id: 'eu-ai-act-implementation-watch',
    sourceId: 'eu-ai-office',
    title: {
      en: 'EU AI Act implementation watch added to the governance queue',
      it: 'Monitoraggio EU AI Act aggiunto alla coda governance',
    },
    summary: {
      en: 'The registry now points researchers to the European AI Office page for AI Act implementation context and institutional updates.',
      it: 'Il registro indirizza ricercatori alla pagina European AI Office per contesto AI Act e aggiornamenti istituzionali.',
    },
    contentType: 'AI governance',
    region: 'European Union',
    dateLabel: {
      en: 'Jul 2026 review',
      it: 'Revisione lug 2026',
    },
    localHref: '/observatory',
    priority: 'high',
  },
  {
    id: 'privacy-enforcement-watch',
    sourceId: 'edpb-news',
    title: {
      en: 'Privacy enforcement sweep now includes EDPB and UK ICO news',
      it: 'Il ciclo enforcement privacy include EDPB e UK ICO',
    },
    summary: {
      en: 'European and UK privacy sources are grouped for manual review before dashboard interpretation.',
      it: 'Fonti privacy UE e UK sono raggruppate per revisione manuale prima dell interpretazione in dashboard.',
    },
    contentType: 'privacy enforcement',
    region: 'EU / UK',
    dateLabel: {
      en: 'Current watchlist',
      it: 'Watchlist corrente',
    },
    localHref: '/observatory',
    priority: 'medium',
  },
  {
    id: 'standards-resource-watch',
    sourceId: 'nist-airc',
    title: {
      en: 'Standards queue anchored on NIST AIRC and IEEE ISoPE',
      it: 'Coda standard basata su NIST AIRC e IEEE ISoPE',
    },
    summary: {
      en: 'Standards resources are separated from enforcement updates so readers can inspect method context clearly.',
      it: 'Le risorse standard sono separate dagli aggiornamenti enforcement per rendere chiaro il contesto metodologico.',
    },
    contentType: 'standards',
    region: 'Global / US',
    dateLabel: {
      en: 'Standards watch',
      it: 'Monitoraggio standard',
    },
    localHref: '/observatory',
    priority: 'watch',
  },
  {
    id: 'us-technology-enforcement-watch',
    sourceId: 'ftc-tech',
    title: {
      en: 'US technology enforcement source added to public discovery',
      it: 'Fonte enforcement tecnologia USA aggiunta alla scoperta pubblica',
    },
    summary: {
      en: 'FTC news and technology updates are listed as context for consumer protection and AI governance monitoring.',
      it: 'News FTC e aggiornamenti tecnologia sono elencati come contesto per protezione consumatori e governance AI.',
    },
    contentType: 'regulatory updates',
    region: 'United States',
    dateLabel: {
      en: 'Source registry',
      it: 'Registro fonti',
    },
    localHref: '/observatory',
    priority: 'medium',
  },
];

export const observatoryEvents: ObservatoryEvent[] = [
  {
    id: 'ieee-isope-2026-programme-review',
    title: {
      en: 'IEEE ISoPE 2026 programme review',
      it: 'Revisione programma IEEE ISoPE 2026',
    },
    organizer: 'PolicyWatcher Observatory',
    dateLabel: {
      en: '16 Sep 2026',
      it: '16 set 2026',
    },
    timeLabel: {
      en: '09:00 UTC',
      it: '09:00 UTC',
    },
    location: {
      en: 'Remote registry review',
      it: 'Revisione registro da remoto',
    },
    summary: {
      en: 'Review public IEEE ISoPE materials before the October 1-2, 2026 privacy symposium window in New York.',
      it: 'Rivedere i materiali pubblici IEEE ISoPE prima della finestra del simposio privacy dell 1-2 ottobre 2026 a New York.',
    },
    href: 'https://ieee-isope.org/',
    calendar: {
      startUtc: '20260916T090000Z',
      endUtc: '20260916T093000Z',
      filename: 'policywatcher-ieee-isope-2026-programme-review.ics',
    },
  },
  {
    id: 'eu-ai-office-monthly-review',
    title: {
      en: 'European AI Office review window',
      it: 'Finestra revisione European AI Office',
    },
    organizer: 'PolicyWatcher Observatory',
    dateLabel: {
      en: 'First week monthly',
      it: 'Prima settimana mensile',
    },
    timeLabel: {
      en: 'Manual review',
      it: 'Revisione manuale',
    },
    location: {
      en: 'Observatory registry',
      it: 'Registro Observatory',
    },
    summary: {
      en: 'Recurring review window for AI Act implementation context and model-governance materials.',
      it: 'Finestra ricorrente per contesto AI Act e materiali governance modelli.',
    },
    href: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
    calendar: {
      startUtc: '20261005T090000Z',
      endUtc: '20261005T093000Z',
      filename: 'policywatcher-eu-ai-office-review.ics',
    },
  },
];

export const dashboardUpdateNotices: DashboardNotice[] = [
  {
    id: 'dashboard-ticker-added',
    label: {
      en: 'Dashboard',
      it: 'Dashboard',
    },
    message: {
      en: 'Observatory signals now appear below the active workspace summary.',
      it: 'I segnali Observatory ora compaiono sotto il riepilogo workspace attivo.',
    },
    href: '/observatory',
    tone: 'teal',
  },
  {
    id: 'trust-boundary-reminder',
    label: {
      en: 'Trust',
      it: 'Trust',
    },
    message: {
      en: 'Source QA and Dataset QA notices remain visible across workspace profiles.',
      it: 'Avvisi Source QA e Dataset QA restano visibili in ogni profilo workspace.',
    },
    href: '/trust',
    tone: 'amber',
  },
  {
    id: 'atlas-observatory-link',
    label: {
      en: 'Atlas',
      it: 'Atlante',
    },
    message: {
      en: 'The Site Atlas now maps Observatory beside evidence and governance surfaces.',
      it: 'L Atlante ora mappa Observatory accanto a superfici evidenza e governance.',
    },
    href: '/atlas',
    tone: 'indigo',
  },
  {
    id: 'roadmap-reading-mode',
    label: {
      en: 'Roadmap',
      it: 'Roadmap',
    },
    message: {
      en: 'First mobile reading mode is available from the workspace area.',
      it: 'La prima modalita lettura mobile e disponibile dall area workspace.',
    },
    href: '/roadmap',
    tone: 'teal',
  },
];

export function getObservatorySource(sourceId: string): ObservatorySource | undefined {
  return observatorySources.find((source) => source.id === sourceId);
}

export function buildObservatoryIcs(event: ObservatoryEvent): string {
  const uid = formatIcsUid(event.id);
  const title = escapeIcsText(event.title.en);
  const summary = escapeIcsText(event.summary.en);
  const location = escapeIcsText(event.location.en);
  const sourceUrl = formatIcsHttpUrl(event.href);
  const startUtc = formatIcsDateTime(event.calendar.startUtc);
  const endUtc = formatIcsDateTime(event.calendar.endUtc);

  return foldIcsLines([
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PolicyWatcher//Observatory//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@policywatcher.online`,
    `DTSTAMP:${formatIcsDateTime(new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''))}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${summary} Source: ${escapeIcsText(sourceUrl)}`,
    `LOCATION:${location}`,
    `URL:${sourceUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]).join('\r\n');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsUid(value: string): string {
  if (!/^[a-z0-9._-]+$/i.test(value)) {
    throw new Error(`Invalid observatory calendar event id: ${value}`);
  }

  return value;
}

function formatIcsDateTime(value: string): string {
  if (!/^\d{8}T\d{6}Z$/.test(value)) {
    throw new Error(`Invalid observatory calendar timestamp: ${value}`);
  }

  return value;
}

function formatIcsHttpUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Invalid observatory calendar URL protocol: ${url.protocol}`);
  }

  return url.toString();
}

function foldIcsLines(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const folded = [];
    let remaining = line;

    while (remaining.length > 75) {
      folded.push(remaining.slice(0, 75));
      remaining = ` ${remaining.slice(75)}`;
    }

    folded.push(remaining);
    return folded;
  });
}
