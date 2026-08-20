import {
  GLOBAL_COUNTRIES,
  countryRegion,
  type GlobalCountryCode,
  type GlobalRegion,
  type PlatformLanguage,
} from './globalContext';

export const CIVIC_DIRECTORY_SCHEMA = 'policywatcher.civic-directory.v1' as const;
export const CIVIC_DIRECTORY_REVIEWED_AT = '2026-08-07' as const;
export const CIVIC_SUGGESTION_EMAIL = 'info@policywatcher.online' as const;

export type CivicOrganizationType =
  | 'consumer-generalist'
  | 'digital-rights'
  | 'privacy-data'
  | 'financial-services'
  | 'communications-media'
  | 'children-families'
  | 'transport-housing'
  | 'food-sustainability';

export type CivicVerificationKind =
  | 'government-registry'
  | 'network-membership'
  | 'official-profile';

export type CivicTerritory = GlobalRegion | GlobalCountryCode;

export const CIVIC_DIRECTORY_QUERY_KEYS = Object.freeze({
  territory: 'civic_territory',
  type: 'civic_type',
  query: 'civic_q',
});

export interface CivicOrganization {
  schema: typeof CIVIC_DIRECTORY_SCHEMA;
  id: string;
  name: string;
  shortName?: string;
  scope: 'global' | 'regional' | 'national';
  region: GlobalRegion;
  country: GlobalCountryCode;
  types: readonly CivicOrganizationType[];
  website: string;
  sourceLabel: string;
  sourceUrl: string;
  verificationKind: CivicVerificationKind;
  reviewedAt: typeof CIVIC_DIRECTORY_REVIEWED_AT;
}

export const CIVIC_TYPE_LABELS: Readonly<Record<CivicOrganizationType, { en: string; it: string }>> = Object.freeze({
  'consumer-generalist': { en: 'General consumer protection', it: 'Tutela consumatori generalista' },
  'digital-rights': { en: 'Digital rights', it: 'Diritti digitali' },
  'privacy-data': { en: 'Privacy and data', it: 'Privacy e dati' },
  'financial-services': { en: 'Financial services', it: 'Servizi finanziari' },
  'communications-media': { en: 'Communications and media', it: 'Comunicazioni e media' },
  'children-families': { en: 'Children and families', it: 'Minori e famiglie' },
  'transport-housing': { en: 'Transport and housing', it: 'Trasporti e abitare' },
  'food-sustainability': { en: 'Food and sustainability', it: 'Cibo e sostenibilità' },
});

export const CIVIC_VERIFICATION_LABELS: Readonly<Record<CivicVerificationKind, { en: string; it: string }>> = Object.freeze({
  'government-registry': { en: 'Government registry', it: 'Registro governativo' },
  'network-membership': { en: 'Verified network', it: 'Rete verificata' },
  'official-profile': { en: 'Official profile', it: 'Profilo ufficiale' },
});

const SOURCES = Object.freeze({
  mimit: {
    label: 'MIMIT · Azioni rappresentative nazionali',
    url: 'https://www.mimit.gov.it/it/?id=2044830&view=article',
    kind: 'government-registry' as const,
  },
  dgccrf: {
    label: 'DGCCRF · Associations nationales',
    url: 'https://www.economie.gouv.fr/dgccrf/les-demarches-et-les-services/demarches-et-services-en-tant-que-consommateur/liste-et-coordonnees-des-associations-nationales',
    kind: 'government-registry' as const,
  },
  spain: {
    label: 'Ministerio de Derechos Sociales, Consumo y Agenda 2030',
    url: 'https://www.dsca.gob.es/es/consumo/asociaciones-personas-consumidoras/listado-asociaciones-consumidores-usuarios',
    kind: 'government-registry' as const,
  },
  beuc: {
    label: 'BEUC · Our members',
    url: 'https://www.beuc.eu/about-beuc/members',
    kind: 'network-membership' as const,
  },
  edri: {
    label: 'EDRi · Our network',
    url: 'https://edri.org/about-us/our-network/',
    kind: 'network-membership' as const,
  },
  consumersInternational: {
    label: 'Consumers International · Members',
    url: 'https://www.consumersinternational.org/members/',
    kind: 'network-membership' as const,
  },
});

interface OrganizationInput {
  id: string;
  name: string;
  shortName?: string;
  country?: GlobalCountryCode;
  region?: GlobalRegion;
  scope?: CivicOrganization['scope'];
  types: readonly CivicOrganizationType[];
  website: string;
  source?: keyof typeof SOURCES;
}

function organization(input: OrganizationInput): CivicOrganization {
  const country = input.country ?? 'all';
  const region = input.region ?? countryRegion(country);
  const source = input.source ? SOURCES[input.source] : null;
  return Object.freeze({
    schema: CIVIC_DIRECTORY_SCHEMA,
    id: input.id,
    name: input.name,
    shortName: input.shortName,
    scope: input.scope ?? (country === 'all' ? (region === 'global' ? 'global' : 'regional') : 'national'),
    region,
    country,
    types: Object.freeze([...input.types]),
    website: input.website,
    sourceLabel: source?.label ?? 'Official organization profile',
    sourceUrl: source?.url ?? input.website,
    verificationKind: source?.kind ?? 'official-profile',
    reviewedAt: CIVIC_DIRECTORY_REVIEWED_AT,
  });
}

export const CIVIC_ORGANIZATIONS: readonly CivicOrganization[] = Object.freeze([
  organization({ id: 'consumers-international', name: 'Consumers International', region: 'global', scope: 'global', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.consumersinternational.org/', source: 'consumersInternational' }),
  organization({ id: 'beuc', name: 'The European Consumer Organisation', shortName: 'BEUC', region: 'europe', scope: 'regional', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.beuc.eu/', source: 'beuc' }),
  organization({ id: 'edri', name: 'European Digital Rights', shortName: 'EDRi', region: 'europe', scope: 'regional', types: ['digital-rights', 'privacy-data'], website: 'https://edri.org/', source: 'edri' }),

  organization({ id: 'it-consumatoritalia', name: 'Federazione Nazionale ACP – AIACE – SDC', shortName: 'Consumatori Italia', country: 'it', types: ['consumer-generalist'], website: 'https://www.consumatoritalia.it/', source: 'mimit' }),
  organization({ id: 'it-assoutenti', name: 'Assoutenti APS', country: 'it', types: ['consumer-generalist', 'transport-housing'], website: 'https://www.assoutenti.it/', source: 'mimit' }),
  organization({ id: 'it-confconsumatori', name: 'Confconsumatori', country: 'it', types: ['consumer-generalist'], website: 'https://www.confconsumatori.it/', source: 'mimit' }),
  organization({ id: 'it-adiconsum', name: 'Adiconsum APS', country: 'it', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.adiconsum.it/', source: 'mimit' }),
  organization({ id: 'it-codici', name: 'Codici · Centro per i Diritti del Cittadino', shortName: 'Codici', country: 'it', types: ['consumer-generalist'], website: 'https://codici.org/', source: 'mimit' }),
  organization({ id: 'it-adusbef', name: 'Adusbef', country: 'it', types: ['financial-services'], website: 'https://www.adusbef.it/', source: 'mimit' }),
  organization({ id: 'it-altroconsumo', name: 'Altroconsumo', country: 'it', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.altroconsumo.it/', source: 'mimit' }),
  organization({ id: 'it-ctcu', name: 'Centro Tutela Consumatori Utenti', shortName: 'CTCU', country: 'it', types: ['consumer-generalist'], website: 'https://www.consumer.bz.it/', source: 'mimit' }),
  organization({ id: 'it-movimento-consumatori', name: 'Movimento Consumatori', country: 'it', types: ['consumer-generalist'], website: 'https://www.movimentoconsumatori.it/', source: 'mimit' }),
  organization({ id: 'it-udicon', name: 'Unione per la Difesa dei Consumatori', shortName: 'UDICON', country: 'it', types: ['consumer-generalist'], website: 'https://www.udicon.org/', source: 'mimit' }),
  organization({ id: 'it-hermes', name: 'Hermes Center for Transparency and Digital Human Rights', shortName: 'Hermes Center', country: 'it', types: ['digital-rights', 'privacy-data'], website: 'https://www.hermescenter.org/', source: 'edri' }),
  organization({ id: 'it-privacy-network', name: 'Privacy Network', country: 'it', types: ['digital-rights', 'privacy-data'], website: 'https://privacy-network.it/', source: 'edri' }),

  organization({ id: 'fr-aclc', name: 'Association citoyenne et laïque des consommateurs', shortName: 'ACLC', country: 'fr', types: ['consumer-generalist'], website: 'https://www.aclc.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-afoc', name: 'Association Force Ouvrière consommateurs', shortName: 'AFOC', country: 'fr', types: ['consumer-generalist'], website: 'https://www.afoc.net/', source: 'dgccrf' }),
  organization({ id: 'fr-cgl', name: 'Confédération générale du logement', shortName: 'CGL', country: 'fr', types: ['consumer-generalist', 'transport-housing'], website: 'https://www.lacgl.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-clcv', name: 'Consommation, logement et cadre de vie', shortName: 'CLCV', country: 'fr', types: ['consumer-generalist', 'transport-housing'], website: 'https://www.clcv.org/', source: 'dgccrf' }),
  organization({ id: 'fr-cnafc', name: 'Confédération nationale des associations familiales catholiques', shortName: 'CNAFC', country: 'fr', types: ['consumer-generalist', 'children-families'], website: 'https://www.afc-france.org/', source: 'dgccrf' }),
  organization({ id: 'fr-cnl', name: 'Confédération nationale du logement', shortName: 'CNL', country: 'fr', types: ['consumer-generalist', 'transport-housing'], website: 'https://confederationnationaledulogement.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-csf', name: 'Confédération syndicale des familles', shortName: 'CSF', country: 'fr', types: ['consumer-generalist', 'children-families'], website: 'https://www.la-csf.org/', source: 'dgccrf' }),
  organization({ id: 'fr-familles-de-france', name: 'Familles de France', country: 'fr', types: ['consumer-generalist', 'children-families'], website: 'https://www.familles-de-france.org/', source: 'dgccrf' }),
  organization({ id: 'fr-familles-rurales', name: 'Familles Rurales', country: 'fr', types: ['consumer-generalist', 'children-families'], website: 'https://www.famillesrurales.org/', source: 'dgccrf' }),
  organization({ id: 'fr-fnaut', name: 'Fédération nationale des associations d’usagers des transports', shortName: 'FNAUT', country: 'fr', types: ['transport-housing'], website: 'https://www.fnaut.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-foodwatch', name: 'Foodwatch France', country: 'fr', types: ['food-sustainability'], website: 'https://www.foodwatch.org/fr/', source: 'dgccrf' }),
  organization({ id: 'fr-indecosa', name: 'INDECOSA-CGT', country: 'fr', types: ['consumer-generalist'], website: 'https://indecosa.cgt.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-que-choisir', name: 'Que Choisir Ensemble', country: 'fr', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.quechoisir.org/', source: 'dgccrf' }),
  organization({ id: 'fr-unaf', name: 'Union nationale des associations familiales', shortName: 'UNAF', country: 'fr', types: ['consumer-generalist', 'children-families'], website: 'https://www.unaf.fr/', source: 'dgccrf' }),
  organization({ id: 'fr-la-quadrature', name: 'La Quadrature du Net', shortName: 'LQDN', country: 'fr', types: ['digital-rights', 'privacy-data'], website: 'https://www.laquadrature.net/', source: 'edri' }),

  organization({ id: 'es-fuci', name: 'Federación de Usuarios Consumidores Independientes', shortName: 'FUCI', country: 'es', types: ['consumer-generalist'], website: 'https://www.fuci.es/', source: 'spain' }),
  organization({ id: 'es-hispacoop', name: 'Confederación Española de Cooperativas de Consumidores y Usuarios', shortName: 'HISPACOOP', country: 'es', types: ['consumer-generalist'], website: 'https://www.hispacoop.es/', source: 'spain' }),
  organization({ id: 'es-adicae', name: 'Asociación de Usuarios de Bancos, Cajas y Seguros', shortName: 'ADICAE', country: 'es', types: ['financial-services'], website: 'https://www.adicae.net/', source: 'spain' }),
  organization({ id: 'es-unae', name: 'Unión Cívica Nacional de Consumidores y Amas de Casa', shortName: 'UNAE', country: 'es', types: ['consumer-generalist', 'children-families'], website: 'https://www.federacionunae.com/', source: 'spain' }),
  organization({ id: 'es-cecu', name: 'Federación de Consumidores y Usuarios', shortName: 'CECU', country: 'es', types: ['consumer-generalist', 'digital-rights'], website: 'https://cecu.es/', source: 'spain' }),
  organization({ id: 'es-ocu', name: 'Organización de Consumidores y Usuarios', shortName: 'OCU', country: 'es', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.ocu.org/', source: 'spain' }),
  organization({ id: 'es-auc', name: 'Asociación de Usuarios de la Comunicación', shortName: 'AUC', country: 'es', types: ['communications-media', 'digital-rights'], website: 'https://www.auc.es/', source: 'spain' }),
  organization({ id: 'es-facua', name: 'Consumidores en Acción', shortName: 'FACUA', country: 'es', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.facua.org/', source: 'spain' }),
  organization({ id: 'es-asufin', name: 'Asociación de Usuarios Financieros', shortName: 'ASUFIN', country: 'es', types: ['financial-services', 'digital-rights'], website: 'https://www.asufin.com/', source: 'spain' }),
  organization({ id: 'es-usfin', name: 'USFIN Sociedad Cooperativa', shortName: 'USFIN', country: 'es', types: ['financial-services'], website: 'https://www.usfin.es/', source: 'spain' }),
  organization({ id: 'es-consumes', name: 'Confederación CONSUMES', shortName: 'CONSUMES', country: 'es', types: ['consumer-generalist'], website: 'https://www.consumes.es/', source: 'spain' }),
  organization({ id: 'es-xnet', name: 'Xnet', country: 'es', types: ['digital-rights', 'privacy-data'], website: 'https://xnet-x.net/', source: 'edri' }),

  organization({ id: 'at-vki', name: 'Verein für Konsumenteninformation', shortName: 'VKI', country: 'at', types: ['consumer-generalist'], website: 'https://vki.at/', source: 'beuc' }),
  organization({ id: 'at-epicenter', name: 'epicenter.works', country: 'at', types: ['digital-rights', 'privacy-data'], website: 'https://epicenter.works/', source: 'edri' }),
  organization({ id: 'at-noyb', name: 'European Center for Digital Rights', shortName: 'noyb', country: 'at', types: ['privacy-data', 'digital-rights'], website: 'https://noyb.eu/', source: 'edri' }),
  organization({ id: 'cz-dtest', name: 'dTest', country: 'cz', types: ['consumer-generalist'], website: 'https://www.dtest.cz/', source: 'beuc' }),
  organization({ id: 'dk-taenk', name: 'Forbrugerrådet Tænk', country: 'dk', types: ['consumer-generalist', 'digital-rights'], website: 'https://taenk.dk/', source: 'beuc' }),
  organization({ id: 'fi-kuluttajaliitto', name: 'Kuluttajaliitto', country: 'fi', types: ['consumer-generalist'], website: 'https://www.kuluttajaliitto.fi/', source: 'beuc' }),
  organization({ id: 'de-vzbv', name: 'Verbraucherzentrale Bundesverband', shortName: 'vzbv', country: 'de', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.vzbv.de/', source: 'beuc' }),
  organization({ id: 'de-stiftung-warentest', name: 'Stiftung Warentest', country: 'de', types: ['consumer-generalist'], website: 'https://www.test.de/', source: 'beuc' }),
  organization({ id: 'de-digitalcourage', name: 'Digitalcourage', country: 'de', types: ['digital-rights', 'privacy-data'], website: 'https://digitalcourage.de/', source: 'edri' }),
  organization({ id: 'ie-cai', name: 'Consumers’ Association of Ireland', shortName: 'CAI', country: 'ie', types: ['consumer-generalist'], website: 'https://thecai.ie/', source: 'beuc' }),
  organization({ id: 'ie-iccl', name: 'Irish Council for Civil Liberties', shortName: 'ICCL', country: 'ie', types: ['digital-rights', 'privacy-data'], website: 'https://www.iccl.ie/', source: 'edri' }),
  organization({ id: 'nl-consumentenbond', name: 'Consumentenbond', country: 'nl', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.consumentenbond.nl/', source: 'beuc' }),
  organization({ id: 'nl-bits-of-freedom', name: 'Bits of Freedom', country: 'nl', types: ['digital-rights', 'privacy-data'], website: 'https://www.bitsoffreedom.nl/', source: 'edri' }),
  organization({ id: 'no-forbrukerradet', name: 'Forbrukerrådet', country: 'no', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.forbrukerradet.no/', source: 'beuc' }),
  organization({ id: 'pl-federacja-konsumentow', name: 'Federacja Konsumentów', country: 'pl', types: ['consumer-generalist'], website: 'https://www.federacja-konsumentow.org.pl/', source: 'beuc' }),
  organization({ id: 'pl-panoptykon', name: 'Fundacja Panoptykon', shortName: 'Panoptykon', country: 'pl', types: ['digital-rights', 'privacy-data'], website: 'https://panoptykon.org/', source: 'edri' }),
  organization({ id: 'pt-deco', name: 'Associação Portuguesa para a Defesa do Consumidor', shortName: 'DECO', country: 'pt', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.deco.proteste.pt/', source: 'beuc' }),
  organization({ id: 'se-sveriges-konsumenter', name: 'Sveriges Konsumenter', country: 'se', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.sverigeskonsumenter.se/', source: 'beuc' }),
  organization({ id: 'ch-frc', name: 'Fédération romande des consommateurs', shortName: 'FRC', country: 'ch', types: ['consumer-generalist'], website: 'https://www.frc.ch/', source: 'beuc' }),
  organization({ id: 'gb-which', name: 'Which?', country: 'gb', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.which.co.uk/', source: 'beuc' }),
  organization({ id: 'gb-citizens-advice', name: 'Citizens Advice', country: 'gb', types: ['consumer-generalist', 'financial-services'], website: 'https://www.citizensadvice.org.uk/', source: 'beuc' }),
  organization({ id: 'gb-open-rights-group', name: 'Open Rights Group', shortName: 'ORG', country: 'gb', types: ['digital-rights', 'privacy-data'], website: 'https://www.openrightsgroup.org/', source: 'edri' }),

  organization({ id: 'us-consumer-reports', name: 'Consumer Reports', country: 'us', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.consumerreports.org/', source: 'consumersInternational' }),
  organization({ id: 'us-public-knowledge', name: 'Public Knowledge', country: 'us', types: ['digital-rights', 'communications-media'], website: 'https://publicknowledge.org/' }),
  organization({ id: 'us-epic', name: 'Electronic Privacy Information Center', shortName: 'EPIC', country: 'us', types: ['privacy-data', 'digital-rights'], website: 'https://epic.org/' }),
  organization({ id: 'us-eff', name: 'Electronic Frontier Foundation', shortName: 'EFF', country: 'us', types: ['digital-rights', 'privacy-data'], website: 'https://www.eff.org/', source: 'edri' }),
  organization({ id: 'ca-piac', name: 'Public Interest Advocacy Centre', shortName: 'PIAC', country: 'ca', types: ['consumer-generalist', 'communications-media'], website: 'https://www.piac.ca/' }),
  organization({ id: 'ca-openmedia', name: 'OpenMedia', country: 'ca', types: ['digital-rights', 'communications-media'], website: 'https://openmedia.org/' }),
  organization({ id: 'au-choice', name: 'CHOICE', country: 'au', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.choice.com.au/', source: 'consumersInternational' }),
  organization({ id: 'au-accan', name: 'Australian Communications Consumer Action Network', shortName: 'ACCAN', country: 'au', types: ['communications-media', 'digital-rights'], website: 'https://accan.org.au/' }),
  organization({ id: 'au-digital-rights-watch', name: 'Digital Rights Watch', country: 'au', types: ['digital-rights', 'privacy-data'], website: 'https://digitalrightswatch.org.au/' }),
  organization({ id: 'br-idec', name: 'Instituto Brasileiro de Defesa do Consumidor', shortName: 'Idec', country: 'br', types: ['consumer-generalist', 'digital-rights'], website: 'https://idec.org.br/', source: 'consumersInternational' }),
  organization({ id: 'in-consumer-voice', name: 'Consumer VOICE', country: 'in', types: ['consumer-generalist', 'digital-rights'], website: 'https://consumer-voice.org/', source: 'consumersInternational' }),
  organization({ id: 'in-iff', name: 'Internet Freedom Foundation', shortName: 'IFF', country: 'in', types: ['digital-rights', 'privacy-data'], website: 'https://internetfreedom.in/' }),
  organization({ id: 'nz-consumer', name: 'Consumer New Zealand', country: 'nz', types: ['consumer-generalist', 'digital-rights'], website: 'https://www.consumer.org.nz/', source: 'consumersInternational' }),
  organization({ id: 'gh-consumer-advocacy-centre', name: 'Consumer Advocacy Centre', shortName: 'CAC Ghana', country: 'gh', types: ['consumer-generalist', 'communications-media'], website: 'https://www.consumersinternational.org/members/', source: 'consumersInternational' }),
  organization({ id: 'za-national-consumer-forum', name: 'National Consumer Forum', shortName: 'NCF', country: 'za', types: ['consumer-generalist'], website: 'https://www.ncf.org.za/' }),
]);

export const CIVIC_DIRECTORY_STATS = Object.freeze({
  organizations: CIVIC_ORGANIZATIONS.length,
  countries: new Set(
    CIVIC_ORGANIZATIONS
      .filter((organization) => organization.country !== 'all')
      .map((organization) => organization.country),
  ).size,
  digitalSpecialists: CIVIC_ORGANIZATIONS.filter(
    (organization) => organization.types.includes('digital-rights')
      || organization.types.includes('privacy-data'),
  ).length,
  verificationSources: new Set(
    CIVIC_ORGANIZATIONS.map((organization) => organization.sourceUrl),
  ).size,
});

export function countryLabel(country: GlobalCountryCode, lang: PlatformLanguage): string {
  if (country === 'all') return lang === 'it' ? 'Rete globale' : 'Global network';
  const option = GLOBAL_COUNTRIES.find((entry) => entry.code === country);
  if (!option) return country.toUpperCase();
  return lang === 'it' ? option.nativeLabel : option.label;
}

function textMatches(organization: CivicOrganization, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('en');
  if (!normalized) return true;
  const country = GLOBAL_COUNTRIES.find((entry) => entry.code === organization.country);
  return [
    organization.name,
    organization.shortName ?? '',
    organization.country,
    organization.region,
    organization.sourceLabel,
    country?.label ?? '',
    country?.nativeLabel ?? '',
    ...organization.types,
    ...organization.types.flatMap((type) => [CIVIC_TYPE_LABELS[type].it, CIVIC_TYPE_LABELS[type].en]),
  ]
    .some((value) => value.toLocaleLowerCase('en').includes(normalized));
}

const CIVIC_TERRITORIES = new Set<CivicTerritory>([
  'global',
  'all',
  'europe',
  'north-america',
  'latin-america',
  'asia-pacific',
  'africa',
  ...GLOBAL_COUNTRIES.map((country) => country.code),
]);

const CIVIC_TYPES = new Set<CivicOrganizationType>(
  Object.keys(CIVIC_TYPE_LABELS) as CivicOrganizationType[],
);

export interface CivicDirectoryQuerySnapshot {
  territory: CivicTerritory | null;
  type: CivicOrganizationType | 'all' | null;
  query: string;
  hasExplicitFilters: boolean;
}

function cleanDirectoryQuery(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 120);
}

export function parseCivicDirectoryQuery(search: string | URLSearchParams): CivicDirectoryQuerySnapshot {
  const params = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search;
  const territoryValue = params.get(CIVIC_DIRECTORY_QUERY_KEYS.territory);
  const typeValue = params.get(CIVIC_DIRECTORY_QUERY_KEYS.type);
  const queryValue = params.get(CIVIC_DIRECTORY_QUERY_KEYS.query);
  const territory = territoryValue && CIVIC_TERRITORIES.has(territoryValue as CivicTerritory)
    ? territoryValue as CivicTerritory
    : null;
  const type = typeValue === 'all' || (typeValue && CIVIC_TYPES.has(typeValue as CivicOrganizationType))
    ? typeValue as CivicOrganizationType | 'all'
    : null;
  const query = cleanDirectoryQuery(queryValue ?? '');

  return {
    territory,
    type,
    query,
    hasExplicitFilters: territory !== null || type !== null || query.length > 0,
  };
}

export function buildCivicDirectorySearch(
  filters: { territory: CivicTerritory; type: CivicOrganizationType | 'all'; query: string },
  existingSearch = '',
): string {
  const params = new URLSearchParams(existingSearch.startsWith('?') ? existingSearch.slice(1) : existingSearch);
  params.delete(CIVIC_DIRECTORY_QUERY_KEYS.territory);
  params.delete(CIVIC_DIRECTORY_QUERY_KEYS.type);
  params.delete(CIVIC_DIRECTORY_QUERY_KEYS.query);

  if (filters.territory !== 'global') params.set(CIVIC_DIRECTORY_QUERY_KEYS.territory, filters.territory);
  if (filters.type !== 'all') params.set(CIVIC_DIRECTORY_QUERY_KEYS.type, filters.type);
  const query = cleanDirectoryQuery(filters.query);
  if (query) params.set(CIVIC_DIRECTORY_QUERY_KEYS.query, query);

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function matchesCivicDirectory(
  organization: CivicOrganization,
  filters: { territory: CivicTerritory; type: 'all' | CivicOrganizationType; query: string },
): boolean {
  if (filters.type !== 'all' && !organization.types.includes(filters.type)) return false;
  if (!textMatches(organization, filters.query)) return false;

  const territory = filters.territory;
  if (territory === 'global') return true;
  if (territory === 'all') return organization.scope === 'global';
  if (['europe', 'north-america', 'latin-america', 'asia-pacific', 'africa'].includes(territory)) {
    return organization.scope === 'global' || organization.region === territory;
  }
  const selectedRegion = countryRegion(territory as GlobalCountryCode);
  return organization.scope === 'global'
    || (organization.scope === 'regional' && organization.region === selectedRegion)
    || organization.country === territory;
}

export function sortCivicOrganizations(
  organizations: readonly CivicOrganization[],
  territory: CivicTerritory,
): CivicOrganization[] {
  const regionalTerritories: GlobalRegion[] = ['europe', 'north-america', 'latin-america', 'asia-pacific', 'africa'];
  const selectedRegion = regionalTerritories.includes(territory as GlobalRegion)
    ? territory as GlobalRegion
    : countryRegion(territory as GlobalCountryCode);
  return [...organizations].sort((left, right) => {
    const rank = (organization: CivicOrganization) => {
      if (organization.country === territory) return 0;
      if (organization.scope === 'regional' && organization.region === selectedRegion) return territory === selectedRegion ? 0 : 1;
      if (territory === selectedRegion && organization.region === selectedRegion) return 1;
      if (organization.scope === 'global') return 2;
      return 3;
    };
    return rank(left) - rank(right) || left.name.localeCompare(right.name, 'en');
  });
}

function cleanSuggestionText(value: string, maxLength: number): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, maxLength);
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export interface CivicSuggestionInput {
  name: string;
  country: string;
  website: string;
  sourceUrl: string;
  focus: string;
  submittedBy?: string;
}

export function buildCivicSuggestionMailto(input: CivicSuggestionInput): string | null {
  const name = cleanSuggestionText(input.name, 140);
  const country = cleanSuggestionText(input.country, 80);
  const focus = cleanSuggestionText(input.focus, 600);
  const submittedBy = cleanSuggestionText(input.submittedBy ?? '', 80);
  const website = safeHttpsUrl(input.website);
  const sourceUrl = safeHttpsUrl(input.sourceUrl);
  if (!name || !country || !website || !sourceUrl) return null;

  const subject = `Civic directory suggestion · ${name}`;
  const body = [
    'Organization suggestion for the PolicyWatcher Civic directory',
    '',
    `Name: ${name}`,
    `Country / area: ${country}`,
    `Official website: ${website}`,
    `Independent registry or network source: ${sourceUrl}`,
    `Digital-consumer focus: ${focus || 'Not specified'}`,
    `Submitted by: ${submittedBy || 'Not specified'}`,
    '',
    'I understand that the suggestion is reviewed before inclusion and does not establish affiliation or endorsement.',
  ].join('\n');

  return `mailto:${CIVIC_SUGGESTION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export interface CivicCorrectionInput {
  organizationId: string;
  name: string;
  website: string;
  sourceUrl: string;
}

export function buildCivicCorrectionMailto(input: CivicCorrectionInput): string | null {
  const organizationId = cleanSuggestionText(input.organizationId, 100);
  const name = cleanSuggestionText(input.name, 140);
  const website = safeHttpsUrl(input.website);
  const sourceUrl = safeHttpsUrl(input.sourceUrl);
  if (!organizationId || !name || !website || !sourceUrl) return null;

  const subject = `Civic directory correction · ${name}`;
  const body = [
    'Correction request for the PolicyWatcher Civic directory',
    '',
    `Listing ID: ${organizationId}`,
    `Organization: ${name}`,
    `Current official website: ${website}`,
    `Current verification source: ${sourceUrl}`,
    '',
    'Requested correction:',
    '',
    'Supporting public source (HTTPS):',
    '',
    'Relationship to the organization (optional):',
    '',
    'I understand that PolicyWatcher reviews evidence before applying a change and that this email does not update the directory automatically.',
  ].join('\n');

  return `mailto:${CIVIC_SUGGESTION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
