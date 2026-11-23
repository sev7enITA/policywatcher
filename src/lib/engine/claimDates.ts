type DateRole = 'last_updated_date' | 'effective_date';
type ClaimSide = 'old' | 'new';

const MONTHS = [
  ['january', 'gennaio'], ['february', 'febbraio'], ['march', 'marzo'], ['april', 'aprile'],
  ['may', 'maggio'], ['june', 'giugno'], ['july', 'luglio'], ['august', 'agosto'],
  ['september', 'settembre'], ['october', 'ottobre'], ['november', 'novembre'], ['december', 'dicembre'],
];
const MONTH_INDEX = new Map(MONTHS.flatMap((names, index) => names.map(name => [name, index + 1] as const)));
const MONTH = [...MONTH_INDEX.keys()].join('|');
const DAY = '(?:0?[1-9]|[12][0-9]|3[01])';
const YEAR = '(?:19|20|21)[0-9]{2}';
const ORDINAL = '(?:st|nd|rd|th|º|°)?';
const DATE = new RegExp([
  `(?<yearIso>${YEAR})-(?<monthIso>0[1-9]|1[0-2])-(?<dayIso>0[1-9]|[12][0-9]|3[01])`,
  `(?<dayFirst>${DAY})${ORDINAL}\\s+(?:of\\s+)?(?<monthAfter>${MONTH})[,]?\\s+(?<yearAfter>${YEAR})`,
  `(?<monthBefore>${MONTH})\\s+(?<dayAfter>${DAY})${ORDINAL}[,]?\\s+(?<yearBefore>${YEAR})`,
].map(pattern => `(?:${pattern})`).join('|'), 'giu');

const UPDATED_CUE = /\b(?:last updated|last update|updated on|ultima modifica|ultimo aggiornamento|aggiornat[oa] il)\b/i;
const ROLE_BEFORE_DATE = {
  last_updated_date: /\b(?:last updated|last update|updated on|ultima modifica|ultimo aggiornamento|aggiornat[oa] il)\s*(?:[:\u2013\u2014-]\s*)?(?:(?:date|on|il|del)\s+)?$/i,
  effective_date: /\b(?:effective(?:\s+(?:date|from|on|as of))?|takes? effect(?:\s+on)?|entry into force|in vigore(?:\s+dal)?|efficacia|decorrenza)\s*(?:[:\u2013\u2014-]\s*)?(?:(?:on|il|del|dal)\s+)?$/i,
};

function calendarDates(text: string) {
  return Array.from(text.matchAll(DATE)).flatMap(match => {
    const before = text[match.index - 1], after = text[match.index + match[0].length];
    if ((before && /[\p{L}\p{N}]/u.test(before)) || (after && /[\p{L}\p{N}]/u.test(after))) return [];
    const groups = match.groups!;
    const year = Number(groups.yearIso || groups.yearAfter || groups.yearBefore);
    const month = groups.monthIso ? Number(groups.monthIso) : MONTH_INDEX.get((groups.monthAfter || groups.monthBefore).toLowerCase())!;
    const day = Number(groups.dayIso || groups.dayFirst || groups.dayAfter);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return [];
    return [{ offset: match.index, value: date.toISOString().slice(0, 10) }];
  });
}

function datesForRole(text: string, role: DateRole): string[] {
  return calendarDates(text).filter(date => ROLE_BEFORE_DATE[role].test(text.slice(Math.max(0, date.offset - 80), date.offset)))
    .map(date => date.value);
}

export function claimDateSupported(
  claim: { category: string; operation: string; textEn: string; textIt: string },
  evidence: ReadonlyArray<{ side: ClaimSide; quote: string }>,
): boolean {
  const explicitRoles = [claim.textEn, claim.textIt].flatMap(text => {
    const roles: DateRole[] = [];
    if (/\b(?:effective (?:date|from|on|as of)|takes? effect|entry into force|in vigore|efficacia|decorrenza)\b/i.test(text)
      || datesForRole(text, 'effective_date').length) roles.push('effective_date');
    if (UPDATED_CUE.test(text)) roles.push('last_updated_date');
    return roles;
  });
  if (claim.category === 'effective_date' || claim.category === 'last_updated_date') explicitRoles.push(claim.category);
  const roles = [...new Set(explicitRoles)];
  if (!roles.length) return true;
  if (roles.length !== 1) return false;
  const [role] = roles;

  // Quoted calendar values must be bound to this role on each relevant side.
  // Unparseable, ambiguous and unchanged values require human review.
  const values = (side: ClaimSide) => [...new Set(evidence.filter(span => span.side === side)
    .flatMap(span => datesForRole(span.quote, role)))];
  const old = values('old'), next = values('new');
  const en = [...new Set(calendarDates(claim.textEn).map(date => date.value))];
  const it = [...new Set(calendarDates(claim.textIt).map(date => date.value))];
  if (!en.length || en.length !== it.length || en.some((value, index) => value !== it[index])) return false;
  if (claim.operation === 'added') return next.length === 1 && en.length === 1 && en[0] === next[0];
  if (claim.operation === 'removed') return old.length === 1 && en.length === 1 && en[0] === old[0];
  return old.length === 1 && next.length === 1 && old[0] !== next[0]
    && (en.length === 1 ? en[0] === next[0] : en.length === 2 && en[0] === old[0] && en[1] === next[0]);
}
