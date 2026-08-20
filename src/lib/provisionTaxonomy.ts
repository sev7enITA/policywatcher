export const PROVISION_TAXONOMY_VERSION = '1.0.0' as const;

export const PROVISION_TAXONOMY_KEYS = [
  'ai_training',
  'data_sharing',
  'retention',
  'arbitration',
  'content_licensing',
  'liability',
] as const;

export const PROVISION_ASSESSMENTS = [
  'present',
  'absent',
  'conditional',
  'unclear',
  'not_assessed',
] as const;

export type ProvisionTaxonomyKey = (typeof PROVISION_TAXONOMY_KEYS)[number];
export type ProvisionAssessment = (typeof PROVISION_ASSESSMENTS)[number];

export interface ProvisionTaxon {
  key: ProvisionTaxonomyKey;
  label: Readonly<{ en: string; it: string }>;
  scope: Readonly<{ en: string; it: string }>;
}

function taxon(
  key: ProvisionTaxonomyKey,
  label: { en: string; it: string },
  scope: { en: string; it: string },
): ProvisionTaxon {
  return Object.freeze({
    key,
    label: Object.freeze(label),
    scope: Object.freeze(scope),
  });
}

export const PROVISION_TAXONOMY: Readonly<Record<ProvisionTaxonomyKey, ProvisionTaxon>> =
  Object.freeze({
    ai_training: taxon(
      'ai_training',
      { en: 'AI training', it: 'Addestramento AI' },
      {
        en: 'Use of submitted, uploaded or generated content for model training, including exclusions and opt-out mechanisms.',
        it: 'Uso dei contenuti inviati, caricati o generati per addestrare modelli, incluse esclusioni e modalità di opt-out.',
      },
    ),
    data_sharing: taxon(
      'data_sharing',
      { en: 'Data sharing', it: 'Condivisione dei dati' },
      {
        en: 'Disclosure, sale, transfer or access to data by affiliates, processors, partners, authorities or other third parties.',
        it: 'Comunicazione, vendita, trasferimento o accesso ai dati da parte di affiliate, responsabili, partner, autorità o altri terzi.',
      },
    ),
    retention: taxon(
      'retention',
      { en: 'Retention', it: 'Conservazione' },
      {
        en: 'Retention periods, deletion triggers and stated operational, legal or safety exceptions.',
        it: 'Periodi di conservazione, condizioni di cancellazione ed eccezioni operative, legali o di sicurezza dichiarate.',
      },
    ),
    arbitration: taxon(
      'arbitration',
      { en: 'Arbitration', it: 'Arbitrato' },
      {
        en: 'Mandatory arbitration, opt-out windows, class-action waivers, venue and dispute procedure.',
        it: 'Arbitrato obbligatorio, termini di opt-out, rinuncia alle azioni collettive, foro e procedura di controversia.',
      },
    ),
    content_licensing: taxon(
      'content_licensing',
      { en: 'Content licensing', it: 'Licenza sui contenuti' },
      {
        en: 'Rights granted over user content, including purpose, territory, duration, sublicensing and termination effects.',
        it: 'Diritti concessi sui contenuti degli utenti, inclusi finalità, territorio, durata, sublicenza ed effetti della cessazione.',
      },
    ),
    liability: taxon(
      'liability',
      { en: 'Liability', it: 'Responsabilità' },
      {
        en: 'Liability limitations, exclusions, indemnities, remedy limits and allocation of loss.',
        it: 'Limitazioni ed esclusioni di responsabilità, manleve, limiti ai rimedi e allocazione delle perdite.',
      },
    ),
  });

export const PROVISION_TAXONOMY_BOUNDARY =
  'The taxonomy classifies observed contract language. An assessment is not a legal conclusion, a compliance determination or proof that a clause is enforceable.';

export function isProvisionTaxonomyKey(value: string): value is ProvisionTaxonomyKey {
  return (PROVISION_TAXONOMY_KEYS as readonly string[]).includes(value);
}

export function isProvisionAssessment(value: string): value is ProvisionAssessment {
  return (PROVISION_ASSESSMENTS as readonly string[]).includes(value);
}

export function getProvisionTaxon(key: ProvisionTaxonomyKey): ProvisionTaxon {
  return PROVISION_TAXONOMY[key];
}
