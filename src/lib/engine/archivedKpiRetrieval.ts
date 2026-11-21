import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS, type KpiField } from '../metricsCatalog';
import { archivedEditionConflict } from './archivedEdition';
import { cohortRows, verifiedSourceTexts } from './archivedKpiReview';

// Ordered clause-level search terms. Each distinct match contributes once per passage.
const terms: Record<KpiField, RegExp[]> = {
  kpiDataCollection: [/personal (?:data|information)|dati personali/i, /collect|gather|raccogli|raccolta/i, /geoloc|biometric|transaction history|storico delle transazioni/i],
  kpiThirdPartySharing: [/disclos|condivid|condivision|comunichiamo|we share/i, /third part|terz[ie]|affiliate/i, /advertis|partner|service provider|fornitor/i],
  kpiDataRetention: [/retention|retain|we keep|conservazion|conserviamo/i, /how long|periodo (?:di|per)|finch[ée]|as long as/i, /\b(?:days?|months?|years?|giorni|mesi|anni)\b/i],
  kpiRightToDeletion: [/right to (?:erasure|deletion)|richiedere la cancellazione|diritto (?:alla|di) cancellazione/i, /delete|erasur|cancell|eliminare/i, /request|richied|chieder|except|eccezion/i],
  kpiCrossBorderTransfer: [/transfer.{0,55}(?:personal data|overseas|abroad)|trasferiment.{0,45}(?:dati|internazional)/i, /contractual clauses|binding corporate rules|clausole contrattuali|norme vincolanti/i, /adequacy|adeguatezza|cross.border|outside.{0,20}(?:eea|uk)|al di fuori.{0,20}(?:see|ue)/i],
  kpiAiTrainingOptOut: [/training|addestrament|addestrare|train.{0,30}(?:model|system)/i, /opt.out|object to|oppor|opposizione|disattivare/i, /generati(?:ve|va)|artificial intelligence|intelligenza artificiale/i],
  kpiAiOutputOwnership: [/\boutput\b|generated (?:content|response)|contenuti? generat/i, /owners?hip|\bown(?:s)?\b|titolarit|proprietà/i, /hereby assign|all right, title|cede.{0,30}diritt|di tua proprietà/i],
  kpiAlgoTransparency: [/algorithm|algoritm|ranking|recommendation system|sistemi? di raccomandazione/i, /how we rank|key factors|parametri principali|fattori principali/i],
  kpiAutomatedDecision: [/automat.{0,30}decision|decision.{0,35}automat|processo decisionale/i, /profiling|profilazion|creditworthiness|merito creditizio/i, /human review|intervento umano|effetti giuridici|legal effects/i],
  kpiAiBiasFairness: [/bias|fairness|pregiudiz|distorsion|discriminazion|discriminat/i, /model|algorithm|algoritm|sistem.{0,20}(?:ia|intelligenza)/i],
  kpiConsentMechanism: [/consent|consens/i, /explicit|esplicit|opt.in|opt.out/i, /withdraw|revoc|prior consent|previo consenso/i],
  kpiRegulatoryCompliance: [/compliance with|comply with|in conformità|in ottemperanza/i, /GDPR|CCPA|regolamento generale|leggi applicabili|applicable (?:law|regulations)/i],
  kpiBreachNotification: [/breach|security incident|violazion.{0,30}(?:sicurezza|dati)|incidente di sicurezza/i, /notify|notification|comunicher|notifi/i, /undue delay|senza ingiustificato ritardo|\b(?:24|48|72) (?:hours?|ore)\b/i],
  kpiIndependentAudit: [/audits?|verifiche indipendenti|revisore esterno/i, /independen|indipenden|third.party|external|estern/i, /SOC [12]|ISO.?27|certific/i],
  kpiContentModeration: [/moderat|moderazion|takedown|rimozione dei contenuti/i, /remove.{0,25}content|rimuov.{0,25}contenut|flag.{0,15}content/i, /appeal|reclamo|ricorso|community (?:standards|guidelines)/i],
};


// These phrase families identify operative clauses even where legal vocabulary varies.
// Qualifiers such as a duration or a third party can refine ranking but cannot prove a value.
const operative: Record<KpiField, RegExp> = {
  kpiDataCollection: /\bcollect(?:ed|ing|ion)?\b|information (?:we|you)|data (?:we|about)|transaction histor|account (?:number|balances?)|device identifiers?|dati (?:che|raccolti)|informazioni (?:che|raccolte)|dati (?:biometrici|finanziari)/i,
  kpiThirdPartySharing: /(?:shar(?:e|ing)|disclos(?:e|ure)|provid(?:e|ing))[^.;]{0,85}(?:information|personal data|third part|affiliate)|(?:condivid|comunic|divulgh)[^.;]{0,65}(?:dat[io]|informazioni|terzi)/i,
  kpiDataRetention: /retention|(?:retain|stor(?:e|ed)|keep|conserv\w*)[^.;]{0,90}(?:data|information|dati|informazioni|years|months|duration|anni|mesi|period)|(?:data|information|dati)[^.;]{0,90}(?:stored|held|kept|conservat)/i,
  kpiRightToDeletion: /delet(?:ion|e|ing)|eras(?:ure|e)|right to be forgotten|cancellazion|eliminazion|cancellare|eliminare/i,
  kpiCrossBorderTransfer: /international transfers?|transfer(?:red|s|ring)?[^.;]{0,110}(?:border|countr|jurisdiction|outside|overseas|personal (?:data|information)|EEA)|contractual clauses|corporate rules|adequacy|adequate protection|cross.border|trasfer\w*[^.;]{0,85}(?:dati|paesi|estero|frontier)|clausole (?:contrattuali|tipo)|adeguatezza/i,
  kpiAiTrainingOptOut: /(?:train\w*|improv\w*|addestr\w*)[^.;]{0,60}(?:models?|artificial intelligence|sistemi di IA)|(?:models?|artificial intelligence)[^.;]{0,55}(?:train|improv)/i,
  kpiAiOutputOwnership: /(?:outpu(?:t|ts)|generated (?:content|responses?)|contenuti? generat\w*)[^.;]{0,70}(?:belong|own|retain|right|propriet|diritt)|(?:own|title|assign|propriet|diritt)[^.;]{0,70}(?:output|generated|generat[io])/i,
  kpiAlgoTransparency: /algorithm|algoritm|ranking|recommendation system|(?:image|keyword|automated) filters?|filtri? automat|systems? (?:rank|recommend)/i,
  kpiAutomatedDecision: /automated (?:processing|decision)|decision.{0,24}automat|automat.{0,24}decision|profiling|profilazion/i,
  kpiAiBiasFairness: /algorithmic (?:bias|discrimination)|(?:model|artificial intelligence|automated)[^.;]{0,90}(?:bias|fair|discriminat)|(?:bias|fairness|discriminazion)[^.;]{0,65}(?:algorithm|model|sistemi)/i,
  kpiConsentMechanism: /(?:explicit|prior|informed|withdraw|with your) consent|consenso (?:esplicit|preventiv|informat)|revoc\w*[^.;]{0,30}consenso|opt.in/i,
  kpiRegulatoryCompliance: /comply with|in compliance with|conformità (?:al|con)|adempiere agli obblighi/i,
  kpiBreachNotification: /data breach|security incident|violazion\w* (?:dei dati|di sicurezza)|incidente di sicurezza/i,
  kpiIndependentAudit: /(?:independent|external|third.party) audits?|audited by|revisione indipendente|audit (?:estern|indipend)|SOC [12]|ISO.?27/i,
  kpiContentModeration: /moderat(?:e|ion|ing)|moderazion|remove.{0,40}content|report(?:ed|ing)? (?:other users.{1,3}|harmful )?content|takedown|rimuov\w*.{0,30}contenut|community guidelines/i,
};
interface Passage { start: number; end: number; text: string }
interface SourceIndex { chars: string[]; units: Passage[] }

// Retain sentence boundaries, including line breaks in lists. Overlap long sentences
// to keep a provision crossing a window boundary eligible for retrieval.
function sourceIndex(text: string): SourceIndex {
  const chars = Array.from(text);
  const units: Passage[] = [];
  let offset = 0;
  for (const sentence of text.split(/(?<=\n)|(?<=[.!?;])(?=\s)/u)) {
    const length = Array.from(sentence).length;
    for (let pos = 0; pos < length; pos += 420) {
      const start = offset + pos;
      const end = offset + Math.min(length, pos + 580);
      const part = chars.slice(start, end).join('');
      if (part.trim().length >= 12) units.push({ start, end, text: part });
      if (end === offset + length) break;
    }
    offset += length;
  }
  return { chars, units };
}

function bestPassages(source: SourceIndex, field: KpiField): Passage[] {
  const hits = [];
  for (const unit of source.units) {
    const operativeMatch = operative[field].test(unit.text);
    const score = terms[field].reduce((sum, term) => sum + Number(term.test(unit.text)), 0);
    if (!operativeMatch && score < 2) continue;
    hits.push({ unit, score: score + (operativeMatch ? 3 : 0) });
  }
  hits.sort((a, b) => b.score - a.score || a.unit.start - b.unit.start);
  const selected: Passage[] = [];
  for (const { unit } of hits) {
    if (selected.some(q => q.start <= unit.start && q.end >= unit.end)) continue;
    // Adjacent sentences preserve the subject, exceptions, headings and list qualifiers.
    const start = Math.max(0, unit.start - 170);
    const end = Math.min(source.chars.length, unit.end + 220);
    const text = source.chars.slice(start, end).join('');
    if (selected.some(q => q.text.includes(unit.text.trim()))) continue;
    selected.push({ start, end, text });
    if (selected.length === 8) break;
  }
  return selected;
}

export function retrieveArchivedKpiEvidence(cohort: unknown, archive: unknown) {
  const rows = cohortRows(cohort);
  const sources = verifiedSourceTexts(archive);
  const cache = new Map<string, Map<KpiField, Passage[]>>();
  const candidates = [];
  for (const row of rows) {
    const text = row.source?.publicEvidence ? sources.get(row.sha256) : undefined;
    const conflict = row.source && text ? archivedEditionConflict(row.source.edition, text) : null;
    let byField = cache.get(row.sha256);
    for (const field of KPI_FIELD_KEYS) {
      if (KPI_ALLOWED_VALUES[field].includes(row.values[field] ?? '')) continue;
      if (text !== undefined && !conflict && !byField) {
        const passages = sourceIndex(text);
        byField = new Map(KPI_FIELD_KEYS.map(key => [key, bestPassages(passages, key)]));
        cache.set(row.sha256, byField);
      }
      const quotes = text === undefined || conflict ? [] : byField?.get(field) ?? [];
      const outcome = !row.source ? 'unverified_source' : !row.source.publicEvidence ? 'withheld_source'
        : text === undefined ? 'missing_archived_text' : conflict ? 'archived_edition_conflict' : quotes.length ? 'passages_found' : 'no_matching_passage';
      candidates.push({
        changeId: row.changeId, field, snapshotId: row.snapshotId, sha256: row.sha256,
        version: row.source?.version ?? null, edition: row.source?.edition ?? null, outcome, quotes,
      });
    }
  }
  return { schema: 'pw-retro-kpi-passages-1', denominator: rows.length * KPI_FIELD_KEYS.length, candidates };
}
