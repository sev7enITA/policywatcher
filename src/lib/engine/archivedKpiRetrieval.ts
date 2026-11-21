import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS, type KpiField } from '../metricsCatalog';
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

interface Passage { start: number; end: number; text: string }

// Split by paragraph, then cover long paragraphs with overlapping code-point windows.
function sourcePassages(text: string): Passage[] {
  const result: Passage[] = [];
  let offset = 0;
  for (const paragraph of text.split('\n')) {
    const chars = Array.from(paragraph);
    for (let start = 0; start < chars.length; start += 420) {
      const part = chars.slice(start, start + 540);
      if (part.join('').trim().length >= 15) {
        result.push({ start: offset + start, end: offset + start + part.length, text: part.join('') });
      }
      if (start + part.length === chars.length) break;
    }
    offset += chars.length + 1;
  }
  return result;
}

function bestPassages(passages: Passage[], field: KpiField): Passage[] {
  const scored = passages.map(passage => ({
    passage,
    score: terms[field].reduce((sum, term, index) => sum + (term.test(passage.text) ? (index === 0 ? 4 : 1) : 0), 0),
  }));
  // Single generic qualifiers (such as "years") need another signal before entering the shortlist.
  const hits = scored.filter(s => s.score >= 2).sort((a, b) => b.score - a.score || a.passage.start - b.passage.start);
  const selected: Passage[] = [];
  for (const { passage } of hits) {
    if (selected.some(prior => prior.text === passage.text || (passage.start < prior.end && prior.start < passage.end))) continue;
    selected.push(passage);
    if (selected.length === 4) break;
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
    let byField = cache.get(row.sha256);
    for (const field of KPI_FIELD_KEYS) {
      if (KPI_ALLOWED_VALUES[field].includes(row.values[field] ?? '')) continue;
      if (text !== undefined && !byField) {
        const passages = sourcePassages(text);
        byField = new Map(KPI_FIELD_KEYS.map(key => [key, bestPassages(passages, key)]));
        cache.set(row.sha256, byField);
      }
      const quotes = text === undefined ? [] : byField?.get(field) ?? [];
      const outcome = !row.source ? 'unverified_source' : !row.source.publicEvidence ? 'withheld_source'
        : text === undefined ? 'missing_archived_text' : quotes.length ? 'passages_found' : 'no_matching_passage';
      candidates.push({
        changeId: row.changeId, field, snapshotId: row.snapshotId, sha256: row.sha256,
        version: row.source?.version ?? null, edition: row.source?.edition ?? null, outcome, quotes,
      });
    }
  }
  return { schema: 'pw-retro-kpi-passages-1', denominator: rows.length * KPI_FIELD_KEYS.length, candidates };
}
