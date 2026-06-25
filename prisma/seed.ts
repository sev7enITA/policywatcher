import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper types and factory functions
// ---------------------------------------------------------------------------

interface RegionImpactInput {
  region: 'EU' | 'US' | 'Global' | 'UK';
  perspective: 'Individual' | 'Enterprise';
  impactAnalysisEn: string;
  impactAnalysisIt: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  complianceNoteEn?: string;
  complianceNoteIt?: string;
}

interface RemediationInput {
  titleEn: string;
  titleIt: string;
  descriptionEn: string;
  descriptionIt: string;
  actionUrl?: string;
  actionTextEn?: string;
  actionTextIt?: string;
}

interface SnapshotInput {
  version: number;
  text: string;
  hash: string;
  date: string;
}

interface KpiInput {
  kpiDataCollection: 'Minimal' | 'Moderate' | 'Extensive';
  kpiThirdPartySharing: 'None' | 'Limited' | 'Broad';
  kpiDataRetention: 'Defined' | 'Extended' | 'Indefinite';
  kpiRightToDeletion: 'Full' | 'Partial' | 'None';
  kpiCrossBorderTransfer: 'Restricted' | 'Controlled' | 'Unrestricted';
  kpiAiTrainingOptOut: 'Available' | 'Partial' | 'Not Available';
  kpiAiOutputOwnership: 'User Retained' | 'Shared' | 'Company Claimed';
  kpiAlgoTransparency: 'Published' | 'Partial' | 'Opaque';
  kpiAutomatedDecision: 'Disclosed' | 'Partial' | 'Undisclosed';
  kpiAiBiasFairness: 'Committed' | 'Mentioned' | 'Absent';
  kpiConsentMechanism: 'Explicit Opt-In' | 'Opt-Out' | 'Implicit';
  kpiRegulatoryCompliance: 'Comprehensive' | 'Partial' | 'Minimal';
  kpiBreachNotification: 'Within 24h' | 'Within 72h' | 'Unspecified';
  kpiIndependentAudit: 'Certified' | 'Partial' | 'None';
  kpiContentModeration: 'Transparent' | 'Partial' | 'Opaque';
}

interface ChangeInput {
  oldSnapIdx: number;
  newSnapIdx: number;
  diff: string;
  aiSummaryEn: string;
  aiSummaryIt: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  overallScore: number;
  remediations: RemediationInput[];
  aiTrainingOptOut: string;
  aiDataScrapingRestricted: string;
  aiIpLicensing: string;
  aiPromptRetention: string;
  date: string;
  regionImpacts: RegionImpactInput[];
  kpis: KpiInput;
}

interface PolicySeedInput {
  name: string;
  type: string;
  jurisdiction: string;
  url: string;
  currentText: string;
  currentHash: string;
  snapshots: SnapshotInput[];
  changes: ChangeInput[];
}

/** Creates a full set of 6 region impacts (EU/US/Global x Individual/Enterprise) */
function makeStandardImpacts(
  p: {
    euIndEn: string; euIndIt: string; euIndRisk: 'Low' | 'Medium' | 'High';
    euEntEn: string; euEntIt: string; euEntRisk: 'Low' | 'Medium' | 'High';
    usIndEn: string; usIndIt: string; usIndRisk: 'Low' | 'Medium' | 'High';
    usEntEn: string; usEntIt: string; usEntRisk: 'Low' | 'Medium' | 'High';
    glIndEn: string; glIndIt: string; glIndRisk: 'Low' | 'Medium' | 'High';
    glEntEn: string; glEntIt: string; glEntRisk: 'Low' | 'Medium' | 'High';
    euIndCompEn?: string; euIndCompIt?: string;
    euEntCompEn?: string; euEntCompIt?: string;
    usIndCompEn?: string; usIndCompIt?: string;
    usEntCompEn?: string; usEntCompIt?: string;
  }
): RegionImpactInput[] {
  return [
    { region: 'EU', perspective: 'Individual', impactAnalysisEn: p.euIndEn, impactAnalysisIt: p.euIndIt, riskLevel: p.euIndRisk, complianceNoteEn: p.euIndCompEn, complianceNoteIt: p.euIndCompIt },
    { region: 'EU', perspective: 'Enterprise', impactAnalysisEn: p.euEntEn, impactAnalysisIt: p.euEntIt, riskLevel: p.euEntRisk, complianceNoteEn: p.euEntCompEn, complianceNoteIt: p.euEntCompIt },
    { region: 'US', perspective: 'Individual', impactAnalysisEn: p.usIndEn, impactAnalysisIt: p.usIndIt, riskLevel: p.usIndRisk, complianceNoteEn: p.usIndCompEn, complianceNoteIt: p.usIndCompIt },
    { region: 'US', perspective: 'Enterprise', impactAnalysisEn: p.usEntEn, impactAnalysisIt: p.usEntIt, riskLevel: p.usEntRisk, complianceNoteEn: p.usEntCompEn, complianceNoteIt: p.usEntCompIt },
    { region: 'Global', perspective: 'Individual', impactAnalysisEn: p.glIndEn, impactAnalysisIt: p.glIndIt, riskLevel: p.glIndRisk },
    { region: 'Global', perspective: 'Enterprise', impactAnalysisEn: p.glEntEn, impactAnalysisIt: p.glEntIt, riskLevel: p.glEntRisk },
  ];
}

/** Replaces Global with UK for UK-specific impacts */
function makeUKImpacts(
  p: {
    euIndEn: string; euIndIt: string; euIndRisk: 'Low' | 'Medium' | 'High';
    euEntEn: string; euEntIt: string; euEntRisk: 'Low' | 'Medium' | 'High';
    ukIndEn: string; ukIndIt: string; ukIndRisk: 'Low' | 'Medium' | 'High';
    ukEntEn: string; ukEntIt: string; ukEntRisk: 'Low' | 'Medium' | 'High';
    glIndEn: string; glIndIt: string; glIndRisk: 'Low' | 'Medium' | 'High';
    glEntEn: string; glEntIt: string; glEntRisk: 'Low' | 'Medium' | 'High';
  }
): RegionImpactInput[] {
  return [
    { region: 'EU', perspective: 'Individual', impactAnalysisEn: p.euIndEn, impactAnalysisIt: p.euIndIt, riskLevel: p.euIndRisk },
    { region: 'EU', perspective: 'Enterprise', impactAnalysisEn: p.euEntEn, impactAnalysisIt: p.euEntIt, riskLevel: p.euEntRisk },
    { region: 'UK', perspective: 'Individual', impactAnalysisEn: p.ukIndEn, impactAnalysisIt: p.ukIndIt, riskLevel: p.ukIndRisk },
    { region: 'UK', perspective: 'Enterprise', impactAnalysisEn: p.ukEntEn, impactAnalysisIt: p.ukEntIt, riskLevel: p.ukEntRisk },
    { region: 'Global', perspective: 'Individual', impactAnalysisEn: p.glIndEn, impactAnalysisIt: p.glIndIt, riskLevel: p.glIndRisk },
    { region: 'Global', perspective: 'Enterprise', impactAnalysisEn: p.glEntEn, impactAnalysisIt: p.glEntIt, riskLevel: p.glEntRisk },
  ];
}

async function seedPolicy(companyId: string, input: PolicySeedInput) {
  const policy = await prisma.policy.create({
    data: {
      companyId,
      name: input.name,
      type: input.type,
      jurisdiction: input.jurisdiction,
      url: input.url,
      currentText: input.currentText,
      currentHash: input.currentHash,
    },
  });

  const snapshots = [];
  for (const s of input.snapshots) {
    const snap = await prisma.policySnapshot.create({
      data: { policyId: policy.id, version: s.version, text: s.text, hash: s.hash, createdAt: new Date(s.date) },
    });
    snapshots.push(snap);
  }

  for (const c of input.changes) {
    const change = await prisma.policyChange.create({
      data: {
        policyId: policy.id,
        oldSnapshotId: snapshots[c.oldSnapIdx].id,
        newSnapshotId: snapshots[c.newSnapIdx].id,
        diff: c.diff,
        aiSummaryEn: c.aiSummaryEn,
        aiSummaryIt: c.aiSummaryIt,
        overallRisk: c.overallRisk,
        overallScore: c.overallScore,
        remediationsJson: JSON.stringify(c.remediations),
        aiTrainingOptOut: c.aiTrainingOptOut,
        aiDataScrapingRestricted: c.aiDataScrapingRestricted,
        aiIpLicensing: c.aiIpLicensing,
        aiPromptRetention: c.aiPromptRetention,
        createdAt: new Date(c.date),
        // KPI fields
        kpiDataCollection: c.kpis.kpiDataCollection,
        kpiThirdPartySharing: c.kpis.kpiThirdPartySharing,
        kpiDataRetention: c.kpis.kpiDataRetention,
        kpiRightToDeletion: c.kpis.kpiRightToDeletion,
        kpiCrossBorderTransfer: c.kpis.kpiCrossBorderTransfer,
        kpiAiTrainingOptOut: c.kpis.kpiAiTrainingOptOut,
        kpiAiOutputOwnership: c.kpis.kpiAiOutputOwnership,
        kpiAlgoTransparency: c.kpis.kpiAlgoTransparency,
        kpiAutomatedDecision: c.kpis.kpiAutomatedDecision,
        kpiAiBiasFairness: c.kpis.kpiAiBiasFairness,
        kpiConsentMechanism: c.kpis.kpiConsentMechanism,
        kpiRegulatoryCompliance: c.kpis.kpiRegulatoryCompliance,
        kpiBreachNotification: c.kpis.kpiBreachNotification,
        kpiIndependentAudit: c.kpis.kpiIndependentAudit,
        kpiContentModeration: c.kpis.kpiContentModeration,
      },
    });

    for (const imp of c.regionImpacts) {
      await prisma.regionImpact.create({
        data: {
          policyChangeId: change.id,
          region: imp.region,
          perspective: imp.perspective,
          impactAnalysisEn: imp.impactAnalysisEn,
          impactAnalysisIt: imp.impactAnalysisIt,
          riskLevel: imp.riskLevel,
          complianceNoteEn: imp.complianceNoteEn,
          complianceNoteIt: imp.complianceNoteIt,
        },
      });
    }
  }

  return policy;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('Cleaning existing database content...');
  await prisma.regionImpact.deleteMany({});
  await prisma.policyChange.deleteMany({});
  await prisma.policySnapshot.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Seeding companies...');
  const companiesData = [
    { name: 'Google', slug: 'google', logo: '#4285F4', industry: 'Tech Giant', website: 'https://policies.google.com' },
    { name: 'Anthropic', slug: 'anthropic', logo: '#E0B8A0', industry: 'Tech Giant', website: 'https://www.anthropic.com' },
    { name: 'Microsoft', slug: 'microsoft', logo: '#00A4EF', industry: 'Tech Giant', website: 'https://www.microsoft.com' },
    { name: 'Meta', slug: 'meta', logo: '#0668E1', industry: 'Tech Giant', website: 'https://www.meta.com' },
    { name: 'Stripe', slug: 'stripe', logo: '#635BFF', industry: 'FinTech', website: 'https://stripe.com' },
    { name: 'PayPal', slug: 'paypal', logo: '#003087', industry: 'FinTech', website: 'https://www.paypal.com' },
    { name: 'Revolut', slug: 'revolut', logo: '#1c1e21', industry: 'FinTech', website: 'https://www.revolut.com' },
    { name: 'Wise', slug: 'wise', logo: '#3751FF', industry: 'FinTech', website: 'https://wise.com' },
    { name: 'Klarna', slug: 'klarna', logo: '#FFB3C6', industry: 'FinTech', website: 'https://www.klarna.com' },
    { name: 'Plaid', slug: 'plaid', logo: '#0A85EA', industry: 'FinTech', website: 'https://plaid.com' },
    { name: 'OpenAI', slug: 'openai', logo: '#10A37F', industry: 'AI Provider', website: 'https://openai.com' },
    { name: 'Amazon', slug: 'amazon', logo: '#FF9900', industry: 'E-Commerce', website: 'https://www.amazon.com' },
    { name: 'Apple', slug: 'apple', logo: '#A2AAAD', industry: 'Tech Giant', website: 'https://www.apple.com' },
    { name: 'TikTok', slug: 'tiktok', logo: '#010101', industry: 'Social Media', website: 'https://www.tiktok.com' },
    { name: 'Zoom', slug: 'zoom', logo: '#2D8CFF', industry: 'Cloud/SaaS', website: 'https://zoom.us' },
    { name: 'X (Twitter)', slug: 'x-twitter', logo: '#000000', industry: 'Social Media', website: 'https://x.com' },
  ];

  const co: Record<string, any> = {};
  for (const c of companiesData) {
    co[c.slug] = await prisma.company.create({ data: c });
  }

  // =========================================================================
  // 1. GOOGLE
  // =========================================================================
  console.log('Seeding Google...');

  // Google Privacy Policy - EU
  await seedPolicy(co['google'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://policies.google.com/privacy?hl=it',
    currentText: 'Google Privacy Policy V3 (EU) - GDPR-specific data processing terms. Voice inputs from Gemini Live train foundation models with explicit consent.',
    currentHash: 'google-privacy-eu-v3',
    snapshots: [
      { version: 1, text: '# Google Privacy Policy V1 (EU)\nWe collect Search queries and Chrome browsing data.\nPersonalized ads are shown based on web activity.\nData processed under EU-US Privacy Shield.', hash: 'google-privacy-eu-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Google Privacy Policy V2 (EU)\nWe collect Search queries, Chrome data, and location history.\n[UPDATED] Data transfers governed by Standard Contractual Clauses following Privacy Shield invalidation.\n[UPDATED] GDPR Article 17 right to erasure procedures formalized.', hash: 'google-privacy-eu-v2', date: '2025-03-15T09:00:00Z' },
      { version: 3, text: '# Google Privacy Policy V3 (EU)\nWe collect Search queries, Chrome data, location history, and Gemini Live voice recordings.\n[UPDATED] Consumer voice recordings train Gemini models with explicit GDPR-compliant consent.\n[UPDATED] Google Workspace Enterprise data excluded from AI training.\n[UPDATED] EU AI Act transparency obligations acknowledged.', hash: 'google-privacy-eu-v3', date: '2026-06-01T10:00:00Z' },
    ],
    changes: [
      {
        oldSnapIdx: 0, newSnapIdx: 1,
        diff: '+ Data transfers governed by Standard Contractual Clauses.\n+ GDPR Article 17 right to erasure procedures formalized.',
        aiSummaryEn: 'Google transitioned EU data transfers from Privacy Shield to Standard Contractual Clauses and formalized GDPR erasure request procedures.',
        aiSummaryIt: 'Google ha migrato i trasferimenti dati UE dal Privacy Shield alle Clausole Contrattuali Standard e formalizzato le procedure di cancellazione GDPR.',
        overallRisk: 'Low', overallScore: 3,
        remediations: [{ titleEn: 'Verify Data Transfer Clauses', titleIt: 'Verifica Clausole Trasferimento Dati', descriptionEn: 'Review updated SCC terms in Google Cloud contracts.', descriptionIt: 'Rivedi i termini SCC aggiornati nei contratti Google Cloud.' }],
        aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Protected', aiPromptRetention: 'System-deleted',
        date: '2025-03-15T12:00:00Z',
        regionImpacts: makeStandardImpacts({
          euIndEn: 'SCC clauses replace Privacy Shield. Erasure rights are now formally documented.', euIndIt: 'Le SCC sostituiscono il Privacy Shield. I diritti di cancellazione sono formalmente documentati.', euIndRisk: 'Low',
          euEntEn: 'Enterprises must update DPA agreements to reference new SCC framework.', euEntIt: 'Le aziende devono aggiornare i DPA per fare riferimento al nuovo framework SCC.', euEntRisk: 'Low',
          usIndEn: 'Minimal impact on US users. Privacy Shield invalidation is EU-specific.', usIndIt: 'Impatto minimo sugli utenti USA. L\'invalidazione del Privacy Shield riguarda l\'UE.', usIndRisk: 'Low',
          usEntEn: 'US enterprises serving EU customers must verify SCC compliance.', usEntIt: 'Le imprese USA che servono clienti UE devono verificare la conformita SCC.', usEntRisk: 'Low',
          glIndEn: 'Global users see improved data transfer transparency.', glIndIt: 'Gli utenti globali beneficiano di maggiore trasparenza nei trasferimenti dati.', glIndRisk: 'Low',
          glEntEn: 'International firms should audit Google data residency options.', glEntIt: 'Le aziende internazionali devono verificare le opzioni di residenza dati Google.', glEntRisk: 'Low',
        }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
      },
      {
        oldSnapIdx: 1, newSnapIdx: 2,
        diff: '+ Consumer voice recordings train Gemini models with explicit consent.\n+ Google Workspace Enterprise data excluded from AI training.\n+ EU AI Act transparency obligations acknowledged.',
        aiSummaryEn: 'Google now trains Gemini models on consumer voice data with GDPR-compliant consent. Enterprise Workspace data remains excluded. EU AI Act transparency requirements are acknowledged.',
        aiSummaryIt: 'Google addestra i modelli Gemini sui dati vocali consumer con consenso conforme al GDPR. I dati Enterprise Workspace restano esclusi. Riconosciuti gli obblighi di trasparenza dell\'EU AI Act.',
        overallRisk: 'Medium', overallScore: 6,
        remediations: [
          { titleEn: 'Disable Gemini Chat History', titleIt: 'Disattiva Cronologia Gemini', descriptionEn: 'Prevent Google from storing and training on your prompt inputs via settings.', descriptionIt: 'Impedisci a Google di salvare e usare i tuoi prompt disattivando la cronologia.', actionUrl: 'https://myactivity.google.com', actionTextEn: 'Google MyActivity', actionTextIt: 'Attivita Google' },
          { titleEn: 'Enforce Workspace Policies', titleIt: 'Applica Politiche Workspace', descriptionEn: 'Ensure employees use managed Workspace accounts for corporate tasks.', descriptionIt: 'Assicurarsi che i dipendenti usino account Workspace gestiti per attivita aziendali.' },
        ],
        aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Claimed by company', aiPromptRetention: '180 days',
        date: '2026-06-01T12:00:00Z',
        regionImpacts: makeStandardImpacts({
          euIndEn: 'Audio biometric training requires EDPB-compliant opt-in consent. Disabling web/app activity serves as opt-out.', euIndIt: 'L\'addestramento su audio biometrico richiede consenso opt-in conforme EDPB. Disattivare l\'attivita web/app funge da opt-out.', euIndRisk: 'Medium', euIndCompEn: 'GDPR Article 9 biometric consent.', euIndCompIt: 'GDPR Art. 9: consenso biometrico.',
          euEntEn: 'Employees using personal accounts for corporate work risk leaking IP to public foundation models.', euEntIt: 'I dipendenti che usano account personali per lavoro aziendale rischiano di immettere dati riservati nell\'addestramento IA.', euEntRisk: 'High', euEntCompEn: 'EU AI Act compliance risk.', euEntCompIt: 'Rischio conformita EU AI Act.',
          usIndEn: 'Gemini prompts are used for training by default. Opt-out must be toggled manually in account settings.', usIndIt: 'I prompt Gemini sono usati per l\'addestramento di default. L\'opt-out va attivato manualmente.', usIndRisk: 'Medium', usIndCompEn: 'FTC transparency obligations.', usIndCompIt: 'FTC: obblighi di trasparenza.',
          usEntEn: 'Google Cloud and Workspace accounts protected under commercial SLA contracts.', usEntIt: 'Account Workspace e Google Cloud protetti da clausole contrattuali SLA.', usEntRisk: 'Low',
          glIndEn: 'International users have limited control over data once used for model training.', glIndIt: 'Gli utenti globali hanno controllo limitato sui dati usati per l\'addestramento.', glIndRisk: 'Medium',
          glEntEn: 'Verify server residency settings for local data sovereignty compliance.', glEntIt: 'Verificare la localizzazione server per conformita alle leggi nazionali sui dati.', glEntRisk: 'Medium',
        }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
      },
    ],
  });

  // Google Privacy Policy - US
  await seedPolicy(co['google'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US',
    url: 'https://policies.google.com/privacy?hl=en',
    currentText: 'Google Privacy Policy V2 (US) - CCPA/CPRA compliant. Consumer data feeds AI model training with opt-out available.',
    currentHash: 'google-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Google Privacy Policy V1 (US)\nWe collect Search queries and Chrome data.\nPersonalized ads shown based on web activity.\nCCPA opt-out link provided for California residents.', hash: 'google-privacy-us-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Google Privacy Policy V2 (US)\n[UPDATED] Gemini voice recordings and prompts train AI models for consumer accounts.\n[UPDATED] CPRA enhanced rights for California residents.\nDo Not Sell My Personal Information link provided.', hash: 'google-privacy-us-v2', date: '2026-06-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Gemini voice recordings and prompts train AI models.\n+ CPRA enhanced rights for California residents.',
      aiSummaryEn: 'Google updated US privacy terms to disclose AI training on consumer voice data and expanded CPRA rights for California residents.',
      aiSummaryIt: 'Google ha aggiornato i termini privacy USA per dichiarare l\'addestramento IA su dati vocali consumer e ampliato i diritti CPRA per i residenti in California.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Exercise CPRA Rights', titleIt: 'Esercita i Diritti CPRA', descriptionEn: 'Use the Do Not Sell link to restrict AI training data usage.', descriptionIt: 'Usa il link Non Vendere per limitare l\'uso dei dati per l\'addestramento IA.' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Claimed by company', aiPromptRetention: '180 days',
      date: '2026-06-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific policy. Limited direct impact on EU individuals.', euIndIt: 'Politica specifica USA. Impatto diretto limitato sugli individui UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises with US subsidiaries should monitor CPRA compliance.', euEntIt: 'Le imprese UE con filiali USA devono monitorare la conformita CPRA.', euEntRisk: 'Low',
        usIndEn: 'CPRA grants California residents enhanced rights including data correction and limiting sensitive data use.', usIndIt: 'Il CPRA garantisce ai residenti californiani diritti ampliati inclusa la correzione dati e la limitazione dell\'uso di dati sensibili.', usIndRisk: 'Medium',
        usEntEn: 'Businesses must provide clear CPRA-compliant opt-out mechanisms for AI training.', usEntIt: 'Le aziende devono fornire meccanismi di opt-out conformi al CPRA per l\'addestramento IA.', usEntRisk: 'Medium',
        glIndEn: 'US-centric policy with limited global applicability.', glIndIt: 'Politica centrata sugli USA con applicabilita globale limitata.', glIndRisk: 'Low',
        glEntEn: 'Global companies serving US users must comply with state-level privacy laws.', glEntIt: 'Le aziende globali che servono utenti USA devono rispettare le leggi sulla privacy a livello statale.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // Google Privacy Policy - Global
  await seedPolicy(co['google'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global',
    url: 'https://policies.google.com/privacy',
    currentText: 'Google Privacy Policy V2 (Global) - Baseline data collection terms for all regions without specific regulatory framework.',
    currentHash: 'google-privacy-global-v2',
    snapshots: [
      { version: 1, text: '# Google Privacy Policy V1 (Global)\nBaseline data collection: Search queries, Chrome data, device identifiers.\nPersonalized advertising based on activity data.', hash: 'google-privacy-global-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Google Privacy Policy V2 (Global)\n[UPDATED] Consumer interactions with Gemini services feed AI model improvements.\n[UPDATED] Aggregated and anonymized telemetry shared with research partners.', hash: 'google-privacy-global-v2', date: '2026-06-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Consumer interactions with Gemini services feed AI model improvements.\n+ Aggregated and anonymized telemetry shared with research partners.',
      aiSummaryEn: 'Google expanded global baseline policy to include AI training on consumer Gemini interactions and anonymized telemetry sharing with research partners.',
      aiSummaryIt: 'Google ha ampliato la politica globale di base per includere l\'addestramento IA sulle interazioni consumer con Gemini e la condivisione di telemetria anonimizzata con partner di ricerca.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Activity Controls', titleIt: 'Rivedi Controlli Attivita', descriptionEn: 'Manage AI training participation via Google Activity Controls.', descriptionIt: 'Gestisci la partecipazione all\'addestramento IA tramite i Controlli Attivita Google.', actionUrl: 'https://myactivity.google.com', actionTextEn: 'Activity Controls', actionTextIt: 'Controlli Attivita' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Claimed by company', aiPromptRetention: '180 days',
      date: '2026-06-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'EU individuals should refer to the EU-specific policy for GDPR protections.', euIndIt: 'Gli individui UE devono fare riferimento alla politica specifica UE per le protezioni GDPR.', euIndRisk: 'Low',
        euEntEn: 'Global baseline does not supersede EU-specific regulatory obligations.', euEntIt: 'La base globale non sostituisce gli obblighi normativi specifici dell\'UE.', euEntRisk: 'Low',
        usIndEn: 'US individuals covered by both global and US-specific terms.', usIndIt: 'Gli individui USA sono coperti sia dai termini globali che da quelli specifici USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises should review state-specific requirements separately.', usEntIt: 'Le imprese USA devono verificare i requisiti statali separatamente.', usEntRisk: 'Low',
        glIndEn: 'Telemetry sharing with research partners may expose behavioral patterns at scale.', glIndIt: 'La condivisione di telemetria con partner di ricerca puo esporre modelli comportamentali su larga scala.', glIndRisk: 'Medium',
        glEntEn: 'International enterprises must verify data sovereignty against centralized Google data routing.', glEntIt: 'Le imprese internazionali devono verificare la sovranita dei dati rispetto al routing centralizzato Google.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // Google AI Terms of Service - Global
  await seedPolicy(co['google'].id, {
    name: 'AI Terms of Service', type: 'ai', jurisdiction: 'Global',
    url: 'https://policies.google.com/terms/generative-ai',
    currentText: 'Google AI Terms V2 (Global) - Users retain output ownership but grant Google a perpetual license for safety verification. Aggregated outputs may train safety classifiers.',
    currentHash: 'google-ai-global-v2',
    snapshots: [
      { version: 1, text: '# Google AI Terms V1 (2025)\nProhibited uses: illegal content, CSAM, cyberattacks via Vertex AI and Gemini.\nUsers retain ownership of generated outputs.', hash: 'google-ai-v1', date: '2025-04-05T09:00:00Z' },
      { version: 2, text: '# Google AI Terms V2 (2026)\nProhibited uses: illegal content, CSAM, cyberattacks via Gemini.\n[UPDATED] Users retain output ownership but grant Google a perpetual license for safety verification.\n[UPDATED] Aggregated outputs may train safety classifiers.', hash: 'google-ai-v2', date: '2026-04-10T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Users grant Google a perpetual license to verify safety on outputs.\n+ Aggregated outputs may train safety classifiers.',
      aiSummaryEn: 'Google claims a perpetual license to scan and review AI outputs for safety audits and to train classification models on aggregated safety prompts.',
      aiSummaryIt: 'Google si riserva una licenza perpetua per scansionare e verificare i risultati delle IA per audit di sicurezza e per addestrare classificatori su prompt aggregati.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Output Licensing', titleIt: 'Verifica Licenze Output', descriptionEn: 'Review safety scanning settings when processing proprietary business information.', descriptionIt: 'Rivedi le impostazioni di scansione di sicurezza quando elabori informazioni aziendali riservate.' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Claimed by company', aiPromptRetention: 'Indefinite',
      date: '2026-04-10T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Scanning user prompts raises GDPR concerns if chat contents are accessed by human reviewers.', euIndIt: 'La scansione dei prompt pone questioni GDPR se i contenuti vengono letti da revisori umani.', euIndRisk: 'Medium',
        euEntEn: 'Proprietary IP in outputs is protected, but the perpetual license for safety models requires legal review.', euEntIt: 'La proprieta intellettuale negli output e protetta, ma la licenza perpetua per modelli di sicurezza richiede revisione legale.', euEntRisk: 'Medium',
        usIndEn: 'Standard safety screening terms apply under US commercial law.', usIndIt: 'Si applicano le condizioni standard di screening di sicurezza ai sensi del diritto commerciale USA.', usIndRisk: 'Low',
        usEntEn: 'Commercial APIs bypass human safety audits, preserving IP protection.', usEntIt: 'Le API commerciali bypassano gli audit manuali di sicurezza, preservando la protezione della proprieta intellettuale.', usEntRisk: 'Low',
        glIndEn: 'Generative output licensing terms apply uniformly across jurisdictions.', glIndIt: 'I termini di licenza degli output generativi si applicano uniformemente in tutte le giurisdizioni.', glIndRisk: 'Low',
        glEntEn: 'Review safety classifiers against local regulatory requirements.', glEntIt: 'Valutare i classificatori di sicurezza rispetto ai requisiti normativi locali.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // =========================================================================
  // 2. ANTHROPIC
  // =========================================================================
  console.log('Seeding Anthropic...');

  // Anthropic Terms of Service - Global
  await seedPolicy(co['anthropic'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'Global',
    url: 'https://www.anthropic.com/legal/terms',
    currentText: '# Anthropic Terms V2\nCommercial API data excluded from model training.\nFree-tier consumer data may be used for training unless user opts out.',
    currentHash: 'anthropic-terms-v2',
    snapshots: [
      { version: 1, text: '# Anthropic Terms V1\nClaude service terms.\nNo user data is used for model training.', hash: 'anthropic-terms-v1', date: '2025-05-10T10:00:00Z' },
      { version: 2, text: '# Anthropic Terms V2\nClaude services terms.\n[UPDATED] Commercial API data is excluded from model training.\n[UPDATED] Free-tier consumer data may be used to train models unless opting out.', hash: 'anthropic-terms-v2', date: '2026-03-22T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Free-tier consumer data may be used to train models unless opting out.\n+ Commercial API data remains excluded from model training.',
      aiSummaryEn: 'Anthropic updated terms allowing free-tier consumer data for model training. Commercial API inputs remain fully protected and excluded.',
      aiSummaryIt: 'Anthropic ha aggiornato i termini consentendo l\'uso dei dati consumer gratuiti per l\'addestramento. I dati API commerciali restano protetti ed esclusi.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Opt-out of Model Training', titleIt: 'Disattiva Addestramento Modelli', descriptionEn: 'Free-tier users can submit the privacy request form to opt out of model training.', descriptionIt: 'Gli utenti free possono compilare il modulo privacy per negare l\'uso dei dati per l\'addestramento.', actionUrl: 'https://www.anthropic.com/legal/privacy', actionTextEn: 'Privacy Form', actionTextIt: 'Modulo Privacy' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
      date: '2026-03-22T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'GDPR requires explicit opt-out pathways for training. Users must submit privacy request tickets.', euIndIt: 'Il GDPR richiede canali di opt-out espliciti. Gli utenti devono inoltrare richieste di privacy.', euIndRisk: 'Medium',
        euEntEn: 'Commercial APIs are excluded from training, ensuring no IP leaks for enterprise users.', euEntIt: 'Le API commerciali sono escluse dall\'addestramento, garantendo nessuna fuga di proprieta intellettuale.', euEntRisk: 'Low',
        usIndEn: 'Consumer chat history trains Claude by default unless opt-out is requested.', usIndIt: 'I dati delle chat consumer addestrano Claude di default salvo richiesta di opt-out.', usIndRisk: 'Medium',
        usEntEn: 'Protected commercial data terms satisfy US corporate compliance standards.', usEntIt: 'I termini di protezione dati commerciali soddisfano gli standard di conformita aziendale USA.', usEntRisk: 'Low',
        glIndEn: 'Opt-out requests are processed globally within 30 days.', glIndIt: 'Le richieste di opt-out vengono processate a livello globale entro 30 giorni.', glIndRisk: 'Low',
        glEntEn: 'API endpoints comply with international regulatory privacy standards.', glEntIt: 'Gli endpoint API rispettano gli standard internazionali di privacy normativa.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Partial',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Anthropic Acceptable Use Policy - Global
  await seedPolicy(co['anthropic'].id, {
    name: 'Acceptable Use Policy', type: 'aup', jurisdiction: 'Global',
    url: 'https://www.anthropic.com/legal/aup',
    currentText: '# Anthropic AUP V2\nExpanded prohibited categories including automated decision-making in employment, credit, and insurance without human oversight.',
    currentHash: 'anthropic-aup-v2',
    snapshots: [
      { version: 1, text: '# Anthropic AUP V1\nProhibited: weapons development, CSAM generation, mass surveillance.\nUsers must not circumvent safety filters.', hash: 'anthropic-aup-v1', date: '2025-06-01T10:00:00Z' },
      { version: 2, text: '# Anthropic AUP V2\n[UPDATED] Expanded prohibited categories: automated decision-making in employment, credit, and insurance without human review.\n[UPDATED] Red-teaming and security research explicitly permitted under responsible disclosure.', hash: 'anthropic-aup-v2', date: '2026-02-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Automated decision-making in employment, credit, insurance prohibited without human review.\n+ Security research and red-teaming permitted under responsible disclosure.',
      aiSummaryEn: 'Anthropic expanded prohibited uses to include unsupervised automated decisions in high-stakes domains. Security research is now explicitly permitted under responsible disclosure terms.',
      aiSummaryIt: 'Anthropic ha ampliato gli usi vietati per includere decisioni automatizzate non supervisionate in ambiti ad alto rischio. La ricerca sulla sicurezza e ora esplicitamente consentita sotto termini di divulgazione responsabile.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Audit Automated Workflows', titleIt: 'Verifica Flussi Automatizzati', descriptionEn: 'Ensure all Claude-powered decision systems include human-in-the-loop review.', descriptionIt: 'Assicurarsi che tutti i sistemi decisionali basati su Claude includano la revisione umana.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Protected', aiPromptRetention: 'Not specified',
      date: '2026-02-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Aligns with EU AI Act requirements for human oversight in high-risk AI applications.', euIndIt: 'Conforme ai requisiti dell\'EU AI Act sulla supervisione umana nelle applicazioni IA ad alto rischio.', euIndRisk: 'Low',
        euEntEn: 'Enterprises using Claude for HR or credit scoring must implement human review layers.', euEntIt: 'Le imprese che usano Claude per HR o scoring creditizio devono implementare livelli di revisione umana.', euEntRisk: 'Medium',
        usIndEn: 'Limited direct impact. Existing US regulations do not uniformly require human oversight.', usIndIt: 'Impatto diretto limitato. Le normative USA non richiedono uniformemente la supervisione umana.', usIndRisk: 'Low',
        usEntEn: 'Businesses should proactively adopt human-in-the-loop practices to mitigate regulatory risk.', usEntIt: 'Le aziende dovrebbero adottare proattivamente pratiche di supervisione umana per mitigare il rischio normativo.', usEntRisk: 'Low',
        glIndEn: 'Global alignment with emerging responsible AI norms benefits end users.', glIndIt: 'L\'allineamento globale con le norme emergenti sull\'IA responsabile beneficia gli utenti finali.', glIndRisk: 'Low',
        glEntEn: 'Multinational deployments gain regulatory clarity on permitted use cases.', glEntIt: 'Le implementazioni multinazionali ottengono chiarezza normativa sui casi d\'uso consentiti.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Partial',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // =========================================================================
  // 3. MICROSOFT
  // =========================================================================
  console.log('Seeding Microsoft...');

  // Microsoft Privacy Statement - EU
  await seedPolicy(co['microsoft'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'EU',
    url: 'https://privacy.microsoft.com/it-it/privacystatement',
    currentText: 'Microsoft Privacy Statement V2 (EU) - Copilot interaction data governed by GDPR-specific processing terms. Enterprise data excluded from AI model training.',
    currentHash: 'ms-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Microsoft Privacy Statement V1 (EU)\nWe collect diagnostic data, usage telemetry, and Bing search queries.\nData processed under EU Standard Contractual Clauses.', hash: 'ms-privacy-eu-v1', date: '2024-09-01T09:00:00Z' },
      { version: 2, text: '# Microsoft Privacy Statement V2 (EU)\n[UPDATED] Copilot interactions on consumer accounts may improve AI services.\n[UPDATED] Microsoft 365 Enterprise tenants excluded from AI training via data boundary controls.\n[UPDATED] EU Data Boundary for Microsoft Cloud fully operational.', hash: 'ms-privacy-eu-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Copilot interactions on consumer accounts may improve AI services.\n+ Microsoft 365 Enterprise tenants excluded via data boundary.\n+ EU Data Boundary for Microsoft Cloud operational.',
      aiSummaryEn: 'Microsoft disclosed that consumer Copilot interactions may train AI services. Enterprise M365 tenants are protected by EU Data Boundary. Full EU data residency now operational.',
      aiSummaryIt: 'Microsoft ha dichiarato che le interazioni Copilot consumer possono addestrare i servizi IA. I tenant M365 Enterprise sono protetti dall\'EU Data Boundary. La residenza dati UE e ora operativa.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Enable EU Data Boundary', titleIt: 'Attiva EU Data Boundary', descriptionEn: 'Configure Microsoft 365 tenant to use EU Data Boundary controls.', descriptionIt: 'Configura il tenant Microsoft 365 per utilizzare i controlli EU Data Boundary.', actionUrl: 'https://admin.microsoft.com', actionTextEn: 'Admin Center', actionTextIt: 'Centro Amministrazione' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Consumer Copilot data may train AI models. Users can disable optional diagnostics to limit data sharing.', euIndIt: 'I dati Copilot consumer possono addestrare modelli IA. Gli utenti possono disattivare la diagnostica opzionale.', euIndRisk: 'Medium', euIndCompEn: 'GDPR Articles 6 and 9.', euIndCompIt: 'GDPR Articoli 6 e 9.',
        euEntEn: 'Enterprise tenants protected by EU Data Boundary. No AI training on organizational data.', euEntIt: 'I tenant Enterprise protetti dall\'EU Data Boundary. Nessun addestramento IA sui dati organizzativi.', euEntRisk: 'Low', euEntCompEn: 'EU Data Boundary certified.', euEntCompIt: 'EU Data Boundary certificato.',
        usIndEn: 'EU-specific terms. US users should refer to the US privacy statement.', usIndIt: 'Termini specifici UE. Gli utenti USA devono fare riferimento all\'informativa privacy USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU operations benefit from EU Data Boundary guarantees.', usEntIt: 'Le imprese USA con operazioni UE beneficiano delle garanzie EU Data Boundary.', usEntRisk: 'Low',
        glIndEn: 'EU data residency guarantees do not extend to other regions by default.', glIndIt: 'Le garanzie di residenza dati UE non si estendono ad altre regioni per impostazione predefinita.', glIndRisk: 'Low',
        glEntEn: 'Multinational enterprises should verify data boundary availability per region.', glEntIt: 'Le imprese multinazionali devono verificare la disponibilita del data boundary per regione.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Shared',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Microsoft Privacy Statement - US
  await seedPolicy(co['microsoft'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'US',
    url: 'https://privacy.microsoft.com/en-us/privacystatement',
    currentText: 'Microsoft Privacy Statement V2 (US) - Copilot and Windows telemetry terms updated for CCPA/CPRA compliance.',
    currentHash: 'ms-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Microsoft Privacy Statement V1 (US)\nDiagnostic data collection for Windows and Office products.\nCCPA Do Not Sell link available for California residents.', hash: 'ms-privacy-us-v1', date: '2024-09-01T09:00:00Z' },
      { version: 2, text: '# Microsoft Privacy Statement V2 (US)\n[UPDATED] Windows Recall feature stores activity snapshots locally with user control.\n[UPDATED] Copilot consumer prompts may improve AI models under CPRA-compliant terms.', hash: 'ms-privacy-us-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Windows Recall stores activity snapshots locally with user control.\n+ Copilot consumer prompts may improve AI models under CPRA terms.',
      aiSummaryEn: 'Microsoft introduced Windows Recall with local-only storage and updated Copilot training disclosure under CPRA-compliant terms.',
      aiSummaryIt: 'Microsoft ha introdotto Windows Recall con archiviazione solo locale e aggiornato la divulgazione sull\'addestramento Copilot conforme al CPRA.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Configure Windows Recall', titleIt: 'Configura Windows Recall', descriptionEn: 'Review Windows Recall settings to manage local activity snapshots.', descriptionIt: 'Rivedi le impostazioni di Windows Recall per gestire gli snapshot di attivita locale.' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. EU users governed by EU-specific privacy statement.', euIndIt: 'Termini specifici USA. Gli utenti UE sono disciplinati dall\'informativa privacy UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises with US employees should verify Recall deployment policies.', euEntIt: 'Le imprese UE con dipendenti USA devono verificare le politiche di distribuzione di Recall.', euEntRisk: 'Low',
        usIndEn: 'Windows Recall snapshots remain local. Copilot prompts may train AI unless opted out.', usIndIt: 'Gli snapshot di Windows Recall restano locali. I prompt Copilot possono addestrare l\'IA salvo opt-out.', usIndRisk: 'Medium',
        usEntEn: 'Enterprise group policies can disable Recall and Copilot training company-wide.', usEntIt: 'Le policy di gruppo aziendali possono disabilitare Recall e l\'addestramento Copilot a livello aziendale.', usEntRisk: 'Low',
        glIndEn: 'US-centric feature rollout. International availability varies.', glIndIt: 'Rilascio funzionalita centrato sugli USA. La disponibilita internazionale varia.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises should track regional rollout schedules for Recall.', glEntIt: 'Le imprese globali devono monitorare i calendari di rilascio regionali per Recall.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Shared',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Microsoft Privacy Statement - Global
  await seedPolicy(co['microsoft'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'Global',
    url: 'https://privacy.microsoft.com/en/privacystatement',
    currentText: 'Microsoft Privacy Statement V2 (Global) - Baseline telemetry and Copilot data collection terms.',
    currentHash: 'ms-privacy-global-v2',
    snapshots: [
      { version: 1, text: '# Microsoft Privacy Statement V1 (Global)\nDiagnostic data, usage telemetry, Bing queries collected globally.\nData routed through US-based datacenters.', hash: 'ms-privacy-global-v1', date: '2024-09-01T09:00:00Z' },
      { version: 2, text: '# Microsoft Privacy Statement V2 (Global)\n[UPDATED] Copilot interactions processed for service improvement.\n[UPDATED] Responsible AI principles govern all data processing decisions.', hash: 'ms-privacy-global-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Copilot interactions processed for service improvement.\n+ Responsible AI principles govern data processing.',
      aiSummaryEn: 'Microsoft updated global privacy baseline to include Copilot data processing and formally adopted Responsible AI principles as governing framework.',
      aiSummaryIt: 'Microsoft ha aggiornato la base globale sulla privacy per includere il trattamento dati Copilot e adottato formalmente i principi di IA Responsabile come framework di governo.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Review Copilot Settings', titleIt: 'Rivedi Impostazioni Copilot', descriptionEn: 'Adjust Copilot data sharing preferences in account settings.', descriptionIt: 'Regola le preferenze di condivisione dati Copilot nelle impostazioni account.' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Global baseline applies. EU-specific protections addressed in regional policy.', euIndIt: 'Si applica la base globale. Le protezioni UE sono trattate nella politica regionale.', euIndRisk: 'Low',
        euEntEn: 'Enterprises should reference EU-specific statement for compliance obligations.', euEntIt: 'Le imprese devono fare riferimento all\'informativa UE per gli obblighi di conformita.', euEntRisk: 'Low',
        usIndEn: 'Copilot data processing terms align with existing US consumer expectations.', usIndIt: 'I termini di trattamento dati Copilot sono allineati alle aspettative dei consumatori USA.', usIndRisk: 'Low',
        usEntEn: 'Responsible AI framework provides governance clarity for enterprise deployments.', usEntIt: 'Il framework di IA Responsabile fornisce chiarezza di governance per le implementazioni aziendali.', usEntRisk: 'Low',
        glIndEn: 'Responsible AI principles provide baseline protections for global users.', glIndIt: 'I principi di IA Responsabile forniscono protezioni di base per gli utenti globali.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises benefit from unified Responsible AI governance framework.', glEntIt: 'Le imprese globali beneficiano di un framework unificato di governance dell\'IA Responsabile.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Shared',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Microsoft Services Agreement - Global
  await seedPolicy(co['microsoft'].id, {
    name: 'Services Agreement', type: 'terms', jurisdiction: 'Global',
    url: 'https://www.microsoft.com/en/servicesagreement',
    currentText: 'Microsoft Services Agreement V2 - Updated arbitration and AI-generated content liability terms.',
    currentHash: 'ms-services-v2',
    snapshots: [
      { version: 1, text: '# Microsoft Services Agreement V1\nStandard terms for Microsoft consumer services.\nDisputes resolved in Washington state courts.', hash: 'ms-services-v1', date: '2024-09-01T09:00:00Z' },
      { version: 2, text: '# Microsoft Services Agreement V2\n[UPDATED] Binding arbitration for consumer disputes.\n[UPDATED] Microsoft disclaims liability for AI-generated content accuracy.', hash: 'ms-services-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Binding arbitration for consumer disputes.\n+ Microsoft disclaims liability for AI-generated content accuracy.',
      aiSummaryEn: 'Microsoft introduced binding arbitration for consumer disputes and disclaimed liability for the accuracy of AI-generated content across Copilot services.',
      aiSummaryIt: 'Microsoft ha introdotto l\'arbitrato vincolante per le dispute consumer e declinato la responsabilita per l\'accuratezza dei contenuti generati dall\'IA nei servizi Copilot.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Arbitration Terms', titleIt: 'Rivedi Termini di Arbitrato', descriptionEn: 'Understand the implications of mandatory arbitration on dispute resolution rights.', descriptionIt: 'Comprendere le implicazioni dell\'arbitrato obbligatorio sui diritti di risoluzione delle controversie.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: 'Not specified',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Arbitration clauses may be unenforceable under EU consumer protection laws.', euIndIt: 'Le clausole di arbitrato possono essere inapplicabili ai sensi delle leggi sulla tutela dei consumatori UE.', euIndRisk: 'Low',
        euEntEn: 'AI liability disclaimers require enterprises to implement output verification workflows.', euEntIt: 'Le esclusioni di responsabilita IA richiedono alle imprese di implementare flussi di verifica degli output.', euEntRisk: 'Medium',
        usIndEn: 'Binding arbitration is enforceable in the US, limiting class action participation.', usIndIt: 'L\'arbitrato vincolante e applicabile negli USA, limitando la partecipazione ad azioni collettive.', usIndRisk: 'Medium',
        usEntEn: 'Enterprises must independently verify AI-generated content before relying on it.', usEntIt: 'Le imprese devono verificare indipendentemente i contenuti generati dall\'IA prima di farvi affidamento.', usEntRisk: 'Medium',
        glIndEn: 'AI content liability disclaimers apply globally across all Microsoft services.', glIndIt: 'Le esclusioni di responsabilita per contenuti IA si applicano globalmente a tutti i servizi Microsoft.', glIndRisk: 'Medium',
        glEntEn: 'Global enterprises should establish AI output review policies to mitigate reliance risks.', glEntIt: 'Le imprese globali devono stabilire politiche di revisione degli output IA per mitigare i rischi.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Shared',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 4. META
  // =========================================================================
  console.log('Seeding Meta...');

  // Meta Privacy Policy - EU
  await seedPolicy(co['meta'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.facebook.com/privacy/explanation',
    currentText: 'Meta Privacy Policy V2 (EU) - Legitimate interest basis for AI training paused following DPC intervention. Cross-platform data consolidation under scrutiny.',
    currentHash: 'meta-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Meta Privacy Policy V1 (EU)\nWe collect user interactions, content, and network connections across Facebook, Instagram, and WhatsApp.\nPersonalized ads served based on cross-platform behavioral analysis.', hash: 'meta-privacy-eu-v1', date: '2024-08-01T09:00:00Z' },
      { version: 2, text: '# Meta Privacy Policy V2 (EU)\n[UPDATED] Cross-platform data consolidation for AI model training claimed under legitimate interest basis.\n[UPDATED] DPC intervention paused legitimate interest processing. Consent mechanism under review.\n[UPDATED] Meta AI features availability limited in EEA pending regulatory resolution.', hash: 'meta-privacy-eu-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Cross-platform data consolidation for AI training under legitimate interest.\n+ DPC intervention paused processing. Consent mechanism under review.\n+ Meta AI features limited in EEA pending resolution.',
      aiSummaryEn: 'Meta attempted to use legitimate interest as the legal basis for AI training on EU user data. The Irish DPC intervened, pausing this processing. Meta AI features are limited in the EEA.',
      aiSummaryIt: 'Meta ha tentato di usare l\'interesse legittimo come base giuridica per l\'addestramento IA sui dati degli utenti UE. Il DPC irlandese e intervenuto, sospendendo il trattamento. Le funzionalita Meta AI sono limitate nello SEE.',
      overallRisk: 'High', overallScore: 8,
      remediations: [
        { titleEn: 'Submit Data Objection', titleIt: 'Invia Obiezione Dati', descriptionEn: 'Use the objection form to prevent your data from being used for AI training.', descriptionIt: 'Usa il modulo di obiezione per impedire l\'uso dei tuoi dati per l\'addestramento IA.', actionUrl: 'https://www.facebook.com/privacy/genai', actionTextEn: 'Objection Form', actionTextIt: 'Modulo Obiezione' },
        { titleEn: 'Audit Cross-Platform Data Sharing', titleIt: 'Verifica Condivisione Dati Cross-Platform', descriptionEn: 'Review data sharing settings across Facebook, Instagram, and WhatsApp.', descriptionIt: 'Rivedi le impostazioni di condivisione dati su Facebook, Instagram e WhatsApp.' },
      ],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Claimed by company', aiPromptRetention: 'Indefinite',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'DPC intervention protects EU users. Legitimate interest basis challenged. Users should submit objection forms.', euIndIt: 'L\'intervento del DPC protegge gli utenti UE. La base dell\'interesse legittimo e contestata. Gli utenti devono inviare moduli di obiezione.', euIndRisk: 'High', euIndCompEn: 'GDPR Article 21 objection right.', euIndCompIt: 'GDPR Articolo 21: diritto di opposizione.',
        euEntEn: 'Enterprises using Meta platforms for marketing face regulatory uncertainty on data processing.', euEntIt: 'Le imprese che usano piattaforme Meta per il marketing affrontano incertezza normativa sul trattamento dati.', euEntRisk: 'High', euEntCompEn: 'DPC enforcement ongoing.', euEntCompIt: 'Applicazione DPC in corso.',
        usIndEn: 'EU-specific regulatory action. Limited direct impact on US users.', usIndIt: 'Azione normativa specifica UE. Impatto diretto limitato sugli utenti USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU audiences should monitor DPC decisions for compliance implications.', usEntIt: 'Le imprese USA con pubblico UE devono monitorare le decisioni DPC per implicazioni di conformita.', usEntRisk: 'Medium',
        glIndEn: 'EU regulatory precedent may influence global data protection standards.', glIndIt: 'Il precedente normativo UE potrebbe influenzare gli standard globali di protezione dati.', glIndRisk: 'Medium',
        glEntEn: 'Multinational enterprises should prepare for stricter AI training consent requirements globally.', glEntIt: 'Le imprese multinazionali devono prepararsi a requisiti di consenso piu stringenti per l\'addestramento IA a livello globale.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'None',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // Meta Privacy Policy - US
  await seedPolicy(co['meta'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US',
    url: 'https://www.facebook.com/privacy/policy',
    currentText: 'Meta Privacy Policy V2 (US) - User-generated content trains Meta AI models. CCPA opt-out available for California residents.',
    currentHash: 'meta-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Meta Privacy Policy V1 (US)\nWe collect user content, interactions, and device information.\nCCPA Do Not Sell link available for California residents.', hash: 'meta-privacy-us-v1', date: '2024-08-01T09:00:00Z' },
      { version: 2, text: '# Meta Privacy Policy V2 (US)\n[UPDATED] Public posts and interactions used to train Meta AI and Llama models.\n[UPDATED] Private messages remain excluded from AI training.', hash: 'meta-privacy-us-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Public posts and interactions used to train Meta AI and Llama models.\n+ Private messages excluded from AI training.',
      aiSummaryEn: 'Meta began using public posts and interactions to train Meta AI and Llama models in the US. Private messages are explicitly excluded from training data.',
      aiSummaryIt: 'Meta ha iniziato a usare post pubblici e interazioni per addestrare i modelli Meta AI e Llama negli USA. I messaggi privati sono esplicitamente esclusi dai dati di addestramento.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [{ titleEn: 'Limit Public Data Sharing', titleIt: 'Limita Condivisione Dati Pubblici', descriptionEn: 'Review account privacy settings to control what content is publicly accessible.', descriptionIt: 'Rivedi le impostazioni privacy dell\'account per controllare quali contenuti sono pubblicamente accessibili.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Claimed by company', aiPromptRetention: 'Indefinite',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. EU users subject to separate EU privacy policy.', euIndIt: 'Termini specifici USA. Gli utenti UE sono soggetti alla politica privacy UE separata.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises should ensure US-based employees understand Meta AI training scope.', euEntIt: 'Le imprese UE devono assicurarsi che i dipendenti negli USA comprendano la portata dell\'addestramento Meta AI.', euEntRisk: 'Low',
        usIndEn: 'Public posts on Facebook and Instagram train AI models. Users cannot fully opt out of public data usage.', usIndIt: 'I post pubblici su Facebook e Instagram addestrano modelli IA. Gli utenti non possono escludere completamente l\'uso dei dati pubblici.', usIndRisk: 'Medium',
        usEntEn: 'Enterprise social media strategies should account for AI training on public content.', usEntIt: 'Le strategie aziendali sui social media devono considerare l\'addestramento IA sui contenuti pubblici.', usEntRisk: 'Medium',
        glIndEn: 'US AI training practices may set precedent for other markets.', glIndIt: 'Le pratiche di addestramento IA negli USA possono creare un precedente per altri mercati.', glIndRisk: 'Medium',
        glEntEn: 'Monitor regional rollout of Meta AI training on user content.', glEntIt: 'Monitorare il rilascio regionale dell\'addestramento Meta AI sui contenuti degli utenti.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'None',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // Meta Terms of Service - Global
  await seedPolicy(co['meta'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'Global',
    url: 'https://www.facebook.com/legal/terms',
    currentText: 'Meta Terms of Service V2 - Users grant a non-exclusive license for AI training on public content. Content moderation appeals process updated.',
    currentHash: 'meta-terms-v2',
    snapshots: [
      { version: 1, text: '# Meta Terms of Service V1\nUsers grant Meta a non-exclusive license to use, distribute, and display content.\nContent moderation governed by Community Standards.', hash: 'meta-terms-v1', date: '2024-08-01T09:00:00Z' },
      { version: 2, text: '# Meta Terms of Service V2\n[UPDATED] License grant extended to include AI model training on publicly shared content.\n[UPDATED] Content moderation appeals process expanded with independent oversight board review.', hash: 'meta-terms-v2', date: '2026-03-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ License grant extended to include AI model training on public content.\n+ Content moderation appeals expanded with Oversight Board review.',
      aiSummaryEn: 'Meta extended the content license to include AI training on public posts and expanded the content moderation appeals process through the independent Oversight Board.',
      aiSummaryIt: 'Meta ha esteso la licenza sui contenuti per includere l\'addestramento IA sui post pubblici e ampliato il processo di appello sulla moderazione tramite il Comitato di Supervisione indipendente.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Content License Scope', titleIt: 'Verifica Ambito Licenza Contenuti', descriptionEn: 'Understand the expanded scope of the content license for AI training purposes.', descriptionIt: 'Comprendere l\'ambito ampliato della licenza contenuti per scopi di addestramento IA.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Claimed by company', aiPromptRetention: 'Indefinite',
      date: '2026-03-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'EU consumers retain statutory rights that may limit license enforceability.', euIndIt: 'I consumatori UE mantengono diritti legali che possono limitare l\'applicabilita della licenza.', euIndRisk: 'Medium',
        euEntEn: 'Brand content published on Meta platforms falls under the expanded AI training license.', euEntIt: 'I contenuti brand pubblicati su piattaforme Meta rientrano nella licenza ampliata per l\'addestramento IA.', euEntRisk: 'Medium',
        usIndEn: 'License grant is broad and typical of US social media terms of service.', usIndIt: 'La concessione di licenza e ampia e tipica dei termini di servizio dei social media USA.', usIndRisk: 'Low',
        usEntEn: 'Marketing content posted publicly will contribute to AI model training datasets.', usEntIt: 'I contenuti marketing pubblicati pubblicamente contribuiranno ai dataset di addestramento IA.', usEntRisk: 'Medium',
        glIndEn: 'Global users subject to uniform content licensing terms.', glIndIt: 'Gli utenti globali soggetti a termini uniformi di licenza dei contenuti.', glIndRisk: 'Medium',
        glEntEn: 'Enterprises should evaluate AI training implications before posting proprietary content.', glEntIt: 'Le imprese devono valutare le implicazioni dell\'addestramento IA prima di pubblicare contenuti proprietari.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'None',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // =========================================================================
  // 5. STRIPE
  // =========================================================================
  console.log('Seeding Stripe...');

  // Stripe Privacy Policy - EU
  await seedPolicy(co['stripe'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://stripe.com/it/privacy',
    currentText: 'Stripe Privacy Policy V4 (EU) - Biometric KYC, AI credit scoring, and Stripe Payments Europe Ltd. data processing.',
    currentHash: 'stripe-privacy-eu-v4',
    snapshots: [
      { version: 1, text: '# Stripe Privacy Policy V1 (EU)\nTransaction amounts, card brand, basic device details collected.\nNo AI training on transactional records. Data in secure EU datacenters.', hash: 'stripe-privacy-eu-v1', date: '2024-03-10T08:00:00Z' },
      { version: 2, text: '# Stripe Privacy Policy V2 (EU)\n[UPDATED] KYC identity verification data collected.\n[UPDATED] Regional EU datacenters. Standard Contractual Clauses updated.', hash: 'stripe-privacy-eu-v2', date: '2025-01-15T09:00:00Z' },
      { version: 3, text: '# Stripe Privacy Policy V3 (EU)\n[UPDATED] Automated browser telemetry for fraud detection.\n[UPDATED] Data shared with financial partners. Prompt data retained 90 days.', hash: 'stripe-privacy-eu-v3', date: '2025-09-20T10:00:00Z' },
      { version: 4, text: '# Stripe Privacy Policy V4 (EU)\n[UPDATED] KYC biometric face scans collected.\n[UPDATED] Aggregated, anonymized transactional data trains AI fraud detection and credit profiling models.\n[UPDATED] EU data handled by Stripe Payments Europe Ltd under SCC.', hash: 'stripe-privacy-eu-v4', date: '2026-06-01T11:00:00Z' },
    ],
    changes: [
      {
        oldSnapIdx: 0, newSnapIdx: 1,
        diff: '+ KYC identity verification data collected.\n+ Regional EU datacenters with SCC clauses.',
        aiSummaryEn: 'Stripe added identity verification requirements and formalized cross-border transfers under Standard Contractual Clauses.',
        aiSummaryIt: 'Stripe ha aggiunto requisiti di verifica identita e formalizzato i trasferimenti transfrontalieri sotto Clausole Contrattuali Standard.',
        overallRisk: 'Low', overallScore: 3,
        remediations: [{ titleEn: 'Upload KYC Documents', titleIt: 'Carica Documenti KYC', descriptionEn: 'Merchants must submit identity verification via Stripe Dashboard.', descriptionIt: 'I merchant devono inviare la verifica identita tramite la Dashboard Stripe.', actionUrl: 'https://stripe.com/docs/kyc', actionTextEn: 'Verify KYC', actionTextIt: 'Verifica KYC' }],
        aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: 'System-deleted',
        date: '2025-01-15T12:00:00Z',
        regionImpacts: makeStandardImpacts({
          euIndEn: 'KYC identity data collected under GDPR-compliant processing. SCC clauses govern cross-border transfers.', euIndIt: 'Dati identita KYC raccolti con trattamento conforme al GDPR. Le SCC disciplinano i trasferimenti transfrontalieri.', euIndRisk: 'Low',
          euEntEn: 'Merchants must update data processing agreements to reference SCC framework.', euEntIt: 'I merchant devono aggiornare gli accordi di trattamento dati per fare riferimento al framework SCC.', euEntRisk: 'Low',
          usIndEn: 'EU-specific SCC terms. Minimal impact on US users.', usIndIt: 'Termini SCC specifici UE. Impatto minimo sugli utenti USA.', usIndRisk: 'Low',
          usEntEn: 'US merchants serving EU customers must verify SCC compliance in contracts.', usEntIt: 'I merchant USA che servono clienti UE devono verificare la conformita SCC nei contratti.', usEntRisk: 'Low',
          glIndEn: 'Identity verification requirements apply to merchants globally.', glIndIt: 'I requisiti di verifica identita si applicano ai merchant a livello globale.', glIndRisk: 'Low',
          glEntEn: 'Global merchants must complete KYC onboarding procedures.', glEntIt: 'I merchant globali devono completare le procedure di onboarding KYC.', glEntRisk: 'Low',
        }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
      },
      {
        oldSnapIdx: 1, newSnapIdx: 2,
        diff: '+ Automated browser telemetry for fraud detection.\n+ Data shared with financial partners. Prompt data retained 90 days.',
        aiSummaryEn: 'Stripe introduced automated browser fingerprinting for fraud prevention and extended data retention of prompts to 90 days.',
        aiSummaryIt: 'Stripe ha introdotto il fingerprinting automatico del browser per la prevenzione frodi e prolungato la conservazione dei dati prompt a 90 giorni.',
        overallRisk: 'Medium', overallScore: 5,
        remediations: [{ titleEn: 'Review Fraud Controls', titleIt: 'Verifica Controlli Antifrode', descriptionEn: 'Review updated telemetry triggers in the fraud prevention settings.', descriptionIt: 'Rivedi i trigger di telemetria nelle impostazioni di prevenzione frodi.' }],
        aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: '90 days',
        date: '2025-09-20T12:00:00Z',
        regionImpacts: makeStandardImpacts({
          euIndEn: 'Browser telemetry collection requires consent under ePrivacy Directive. Users must be informed.', euIndIt: 'La raccolta di telemetria browser richiede consenso ai sensi della Direttiva ePrivacy. Gli utenti devono essere informati.', euIndRisk: 'Medium', euIndCompEn: 'ePrivacy Directive compliance.', euIndCompIt: 'Conformita Direttiva ePrivacy.',
          euEntEn: 'Merchants integrating Stripe.js must update cookie consent banners for telemetry disclosure.', euEntIt: 'I merchant che integrano Stripe.js devono aggiornare i banner di consenso cookie per la divulgazione della telemetria.', euEntRisk: 'Medium',
          usIndEn: 'Browser telemetry is standard for fraud prevention under US commercial practices.', usIndIt: 'La telemetria browser e standard per la prevenzione frodi nelle pratiche commerciali USA.', usIndRisk: 'Low',
          usEntEn: 'Minimal impact. Fraud prevention telemetry is commercially expected.', usEntIt: 'Impatto minimo. La telemetria per la prevenzione frodi e commercialmente prevista.', usEntRisk: 'Low',
          glIndEn: 'Financial partner data sharing increases third-party exposure for global users.', glIndIt: 'La condivisione dati con partner finanziari aumenta l\'esposizione a terze parti per gli utenti globali.', glIndRisk: 'Medium',
          glEntEn: 'Global merchants should review the list of financial partners receiving shared data.', glEntIt: 'I merchant globali devono verificare l\'elenco dei partner finanziari che ricevono dati condivisi.', glEntRisk: 'Medium',
        }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
      },
      {
        oldSnapIdx: 2, newSnapIdx: 3,
        diff: '+ KYC biometric face scans collected.\n+ Aggregated transactional data trains AI fraud detection and credit profiling models.\n+ Stripe Payments Europe Ltd handles EEA data under SCC.',
        aiSummaryEn: 'Stripe introduced facial biometrics for KYC onboarding and announced that aggregated transaction flows train AI credit scoring models. EU data processed by Stripe Payments Europe Ltd.',
        aiSummaryIt: 'Stripe ha introdotto la biometria facciale per l\'onboarding KYC e annunciato che i flussi transazionali aggregati addestrano modelli di scoring creditizio IA. Dati UE trattati da Stripe Payments Europe Ltd.',
        overallRisk: 'High', overallScore: 8,
        remediations: [
          { titleEn: 'Opt-Out of AI Profiling', titleIt: 'Disattiva Profilazione IA', descriptionEn: 'Disable data usage for merchant credit profiling in the Privacy Panel.', descriptionIt: 'Disattiva l\'utilizzo dei dati per la profilazione creditizia dal Pannello Privacy.', actionUrl: 'https://stripe.com/privacy', actionTextEn: 'Privacy Panel', actionTextIt: 'Pannello Privacy' },
          { titleEn: 'Update Cookie and Privacy Policy', titleIt: 'Aggiorna Informativa Cookie e Privacy', descriptionEn: 'Enterprises must disclose biometric collection to end-users in their privacy policies.', descriptionIt: 'Le aziende devono comunicare la raccolta biometrica agli utenti finali nelle proprie informative privacy.' },
        ],
        aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
        date: '2026-06-01T14:00:00Z',
        regionImpacts: makeStandardImpacts({
          euIndEn: 'GDPR Article 9 requires explicit opt-in for biometric processing. Fallback identification methods must be offered.', euIndIt: 'Il GDPR Articolo 9 richiede opt-in esplicito per il trattamento biometrico. Devono essere offerte alternative di identificazione.', euIndRisk: 'High', euIndCompEn: 'GDPR Article 9: Biometrics.', euIndCompIt: 'GDPR Art. 9: Biometria.',
          euEntEn: 'Merchants must update consumer privacy policies. AI credit scoring triggers EU AI Act high-risk classification.', euEntIt: 'I merchant devono aggiornare le informative privacy. Lo scoring creditizio IA attiva la classificazione ad alto rischio dell\'EU AI Act.', euEntRisk: 'High', euEntCompEn: 'EU AI Act and GDPR compliance required.', euEntCompIt: 'Conformita EU AI Act e GDPR richiesta.',
          usIndEn: 'CCPA protects California residents. Transaction telemetry profiles unless opt-out via Do Not Sell links.', usIndIt: 'Il CCPA protegge i residenti californiani. La telemetria transazionale profila gli utenti salvo opt-out tramite link Non Vendere.', usIndRisk: 'Medium', usIndCompEn: 'CCPA compliant.', usIndCompIt: 'Conforme CCPA.',
          usEntEn: 'Enhanced fraud detection algorithms benefit merchants. State biometric laws (Illinois BIPA) require attention.', usEntIt: 'Algoritmi migliorati di rilevamento frodi beneficiano i merchant. Le leggi biometriche statali (Illinois BIPA) richiedono attenzione.', usEntRisk: 'Medium', usEntCompEn: 'Verify state biometric rules.', usEntCompIt: 'Verificare norme biometriche statali.',
          glIndEn: 'Global users see transactional data centralized with limited cross-border deletion rights.', glIndIt: 'Gli utenti globali vedono i dati transazionali centralizzati con diritti limitati di cancellazione transfrontaliera.', glIndRisk: 'Medium',
          glEntEn: 'Firms must audit local data sovereignty regulations against Stripe centralized data routing.', glEntIt: 'Le aziende devono verificare le normative locali sulla sovranita dei dati rispetto al routing centralizzato Stripe.', glEntRisk: 'Medium',
        }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
      },
    ],
  });

  // Stripe Privacy Policy - US
  await seedPolicy(co['stripe'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US',
    url: 'https://stripe.com/us/privacy',
    currentText: 'Stripe Privacy Policy V2 (US) - CCPA/CPRA compliant terms for transaction data and AI fraud models.',
    currentHash: 'stripe-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Stripe Privacy Policy V1 (US)\nTransaction amounts, card brand, device details collected.\nCCPA Do Not Sell link for California residents.', hash: 'stripe-privacy-us-v1', date: '2024-03-10T08:00:00Z' },
      { version: 2, text: '# Stripe Privacy Policy V2 (US)\n[UPDATED] Aggregated transaction data trains AI fraud detection models.\n[UPDATED] CPRA-enhanced rights for California residents.\n[UPDATED] Biometric verification available for high-value merchant onboarding.', hash: 'stripe-privacy-us-v2', date: '2026-06-01T11:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Aggregated transaction data trains AI fraud detection.\n+ CPRA-enhanced rights for California residents.\n+ Biometric verification for high-value merchant onboarding.',
      aiSummaryEn: 'Stripe updated US privacy terms to disclose AI fraud model training on aggregated data, enhanced CPRA rights, and introduced biometric verification for high-value merchants.',
      aiSummaryIt: 'Stripe ha aggiornato i termini privacy USA per dichiarare l\'addestramento di modelli antifrode IA su dati aggregati, ampliato i diritti CPRA e introdotto la verifica biometrica per merchant ad alto valore.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [{ titleEn: 'Exercise CPRA Rights', titleIt: 'Esercita Diritti CPRA', descriptionEn: 'Use the Do Not Sell link to restrict data usage for AI training.', descriptionIt: 'Usa il link Non Vendere per limitare l\'uso dei dati per l\'addestramento IA.' }],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: '30 days',
      date: '2026-06-01T14:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific privacy terms. EU users governed by EU Stripe privacy policy.', euIndIt: 'Termini privacy specifici USA. Gli utenti UE sono disciplinati dalla privacy policy Stripe UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises with US operations should monitor CPRA compliance obligations.', euEntIt: 'Le imprese UE con operazioni USA devono monitorare gli obblighi di conformita CPRA.', euEntRisk: 'Low',
        usIndEn: 'CPRA grants enhanced rights for California residents including data correction and sensitive data limits.', usIndIt: 'Il CPRA garantisce diritti ampliati per i residenti californiani inclusa la correzione dati e limiti sui dati sensibili.', usIndRisk: 'Medium',
        usEntEn: 'State biometric laws (Illinois BIPA) apply to facial verification. Merchants must verify compliance.', usEntIt: 'Le leggi biometriche statali (Illinois BIPA) si applicano alla verifica facciale. I merchant devono verificare la conformita.', usEntRisk: 'Medium',
        glIndEn: 'US-centric terms with limited global applicability.', glIndIt: 'Termini incentrati sugli USA con applicabilita globale limitata.', glIndRisk: 'Low',
        glEntEn: 'Global merchants accepting US payments subject to these terms.', glEntIt: 'I merchant globali che accettano pagamenti USA sono soggetti a questi termini.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Stripe Privacy Policy - Global
  await seedPolicy(co['stripe'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global',
    url: 'https://stripe.com/privacy',
    currentText: 'Stripe Privacy Policy V2 (Global) - Baseline payment data collection and fraud prevention terms.',
    currentHash: 'stripe-privacy-global-v2',
    snapshots: [
      { version: 1, text: '# Stripe Privacy Policy V1 (Global)\nBaseline: transaction amounts, card brand, device details.\nData secured in regional datacenters.', hash: 'stripe-privacy-global-v1', date: '2024-03-10T08:00:00Z' },
      { version: 2, text: '# Stripe Privacy Policy V2 (Global)\n[UPDATED] Aggregated transaction data supports AI-powered fraud prevention globally.\n[UPDATED] Stripe Atlas data processing terms updated for international incorporations.', hash: 'stripe-privacy-global-v2', date: '2026-06-01T11:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Aggregated transaction data supports AI fraud prevention globally.\n+ Stripe Atlas processing terms updated.',
      aiSummaryEn: 'Stripe updated global baseline to include AI-powered fraud prevention on aggregated transaction data and revised Stripe Atlas incorporation processing terms.',
      aiSummaryIt: 'Stripe ha aggiornato la base globale per includere la prevenzione frodi IA su dati transazionali aggregati e rivisto i termini di trattamento per le incorporazioni Stripe Atlas.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Review Fraud Prevention Settings', titleIt: 'Rivedi Impostazioni Antifrode', descriptionEn: 'Configure Stripe Radar sensitivity levels for your business.', descriptionIt: 'Configura i livelli di sensibilita di Stripe Radar per la tua attivita.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: 'System-deleted',
      date: '2026-06-01T14:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'EU users should refer to EU-specific policy for GDPR protections.', euIndIt: 'Gli utenti UE devono fare riferimento alla policy specifica UE per le protezioni GDPR.', euIndRisk: 'Low',
        euEntEn: 'Global baseline does not supersede EU regulatory obligations.', euEntIt: 'La base globale non sostituisce gli obblighi normativi UE.', euEntRisk: 'Low',
        usIndEn: 'US users covered by both global and US-specific terms.', usIndIt: 'Gli utenti USA sono coperti sia dai termini globali che da quelli specifici USA.', usIndRisk: 'Low',
        usEntEn: 'US merchants should review state-specific requirements separately.', usEntIt: 'I merchant USA devono verificare i requisiti statali separatamente.', usEntRisk: 'Low',
        glIndEn: 'AI fraud prevention operates on aggregated data minimizing individual exposure.', glIndIt: 'La prevenzione frodi IA opera su dati aggregati minimizzando l\'esposizione individuale.', glIndRisk: 'Low',
        glEntEn: 'Global merchants benefit from improved fraud detection accuracy.', glEntIt: 'I merchant globali beneficiano di una migliore accuratezza nel rilevamento frodi.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Stripe Services Agreement - EU
  await seedPolicy(co['stripe'].id, {
    name: 'Services Agreement', type: 'terms', jurisdiction: 'EU',
    url: 'https://stripe.com/it/legal/ssa',
    currentText: 'Stripe Services Agreement V2 (EU) - Arbitration terms and fee increases for international card-not-present transactions.',
    currentHash: 'stripe-services-eu-v2',
    snapshots: [
      { version: 1, text: '# Stripe Services Agreement V1 (EU)\nCommercial terms for EU merchants.\nDisputes resolved in Irish courts. API keys must be secured.', hash: 'stripe-services-eu-v1', date: '2024-05-01T08:00:00Z' },
      { version: 2, text: '# Stripe Services Agreement V2 (EU)\n[UPDATED] Disputes settled by arbitration under ICC rules.\n[UPDATED] Processing fees increased by 0.5% for card-not-present cross-border charges.', hash: 'stripe-services-eu-v2', date: '2025-11-15T09:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Disputes settled by arbitration under ICC rules.\n+ Fees increased by 0.5% for international CNP charges.',
      aiSummaryEn: 'Stripe introduced ICC arbitration for EU merchant disputes and increased processing fees by 0.5% for international card-not-present transactions.',
      aiSummaryIt: 'Stripe ha introdotto l\'arbitrato ICC per le dispute con merchant UE e aumentato le tariffe di elaborazione dello 0.5% per le transazioni internazionali senza carta.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [{ titleEn: 'Review Billing Models', titleIt: 'Rivedi Modelli di Fatturazione', descriptionEn: 'Adjust pricing matrices to absorb the 0.5% fee increase on international transactions.', descriptionIt: 'Adegua i listini prezzi per assorbire l\'aumento dello 0.5% sulle transazioni internazionali.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: 'Not specified',
      date: '2025-11-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'EU consumer protection laws may limit arbitration clause enforceability.', euIndIt: 'Le leggi sulla tutela dei consumatori UE possono limitare l\'applicabilita delle clausole di arbitrato.', euIndRisk: 'Low',
        euEntEn: 'International charge rates rise by 0.5%, increasing operating costs for cross-border SaaS businesses.', euEntIt: 'Le tariffe internazionali aumentano dello 0.5%, incrementando i costi operativi per i business SaaS transfrontalieri.', euEntRisk: 'Medium', euEntCompEn: 'EU consumer contract limits apply.', euEntCompIt: 'Si applicano i limiti contrattuali per i consumatori UE.',
        usIndEn: 'EU-specific arbitration terms. US users governed by US services agreement.', usIndIt: 'Termini di arbitrato specifici UE. Gli utenti USA sono disciplinati dall\'accordo servizi USA.', usIndRisk: 'Low',
        usEntEn: 'US merchants operating in EU must factor in increased cross-border fees.', usEntIt: 'I merchant USA che operano nell\'UE devono considerare l\'aumento delle tariffe transfrontaliere.', usEntRisk: 'Medium',
        glIndEn: 'International arbitration standardizes dispute resolution globally.', glIndIt: 'L\'arbitrato internazionale standardizza la risoluzione delle controversie a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Cross-border merchant charges rise, affecting international commerce margins.', glEntIt: 'L\'aumento delle tariffe transfrontaliere incide sui margini del commercio internazionale.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Stripe Services Agreement - US
  await seedPolicy(co['stripe'].id, {
    name: 'Services Agreement', type: 'terms', jurisdiction: 'US',
    url: 'https://stripe.com/us/legal/ssa',
    currentText: 'Stripe Services Agreement V2 (US) - Binding arbitration and fee adjustments for international transactions.',
    currentHash: 'stripe-services-us-v2',
    snapshots: [
      { version: 1, text: '# Stripe Services Agreement V1 (US)\nBasic commercial terms. Disputes resolved in California courts.\nAPI keys must be secured. Standard processing rates.', hash: 'stripe-services-us-v1', date: '2024-05-01T08:00:00Z' },
      { version: 2, text: '# Stripe Services Agreement V2 (US)\n[UPDATED] Disputes settled by binding arbitration under AAA rules.\n[UPDATED] Fees increased by 0.5% for card-not-present cross-border international charges.', hash: 'stripe-services-us-v2', date: '2025-11-15T09:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Disputes settled by binding arbitration under AAA rules.\n+ Fees increased by 0.5% for international CNP charges.',
      aiSummaryEn: 'Stripe introduced binding AAA arbitration for US merchant disputes and increased processing fees for international card-not-present charges by 0.5%.',
      aiSummaryIt: 'Stripe ha introdotto l\'arbitrato vincolante AAA per le dispute con merchant USA e aumentato le tariffe di elaborazione per le transazioni internazionali senza carta dello 0.5%.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [{ titleEn: 'Review Billing Models', titleIt: 'Rivedi Modelli di Fatturazione', descriptionEn: 'Adjust pricing to absorb the 0.5% fee increase on international transactions.', descriptionIt: 'Adegua i prezzi per assorbire l\'aumento dello 0.5% sulle transazioni internazionali.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Protected', aiPromptRetention: 'Not specified',
      date: '2025-11-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific arbitration terms. Limited impact on EU individuals.', euIndIt: 'Termini di arbitrato specifici USA. Impatto limitato sugli individui UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises with US Stripe accounts subject to US arbitration terms.', euEntIt: 'Le imprese UE con account Stripe USA soggette ai termini di arbitrato USA.', euEntRisk: 'Low',
        usIndEn: 'Binding arbitration is fully enforceable in the US, limiting class action participation.', usIndIt: 'L\'arbitrato vincolante e pienamente applicabile negli USA, limitando la partecipazione ad azioni collettive.', usIndRisk: 'Medium',
        usEntEn: 'Arbitration is standard commercial practice. Factor in international fee increases.', usEntIt: 'L\'arbitrato e prassi commerciale standard. Considerare gli aumenti delle tariffe internazionali.', usEntRisk: 'Low',
        glIndEn: 'US arbitration terms apply to accounts under US jurisdiction.', glIndIt: 'I termini di arbitrato USA si applicano agli account sotto giurisdizione americana.', glIndRisk: 'Low',
        glEntEn: 'Cross-border merchant charges rise, impacting international sellers.', glEntIt: 'L\'aumento delle tariffe transfrontaliere impatta i venditori internazionali.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // =========================================================================
  // 6. PAYPAL
  // =========================================================================
  console.log('Seeding PayPal...');

  // PayPal Privacy Statement - EU
  await seedPolicy(co['paypal'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.paypal.com/it/webapps/mpp/ua/privacy-full',
    currentText: 'PayPal Privacy Statement V2 (EU) - Enhanced data sharing with credit bureaus and AI risk modeling under GDPR-compliant terms.',
    currentHash: 'paypal-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# PayPal Privacy Statement V1 (EU)\nTransaction data, account details, and device information collected.\nData shared with PayPal group entities for fraud prevention.', hash: 'paypal-privacy-eu-v1', date: '2024-07-01T09:00:00Z' },
      { version: 2, text: '# PayPal Privacy Statement V2 (EU)\n[UPDATED] Enhanced data sharing with credit bureaus for risk assessment.\n[UPDATED] Automated fraud scoring models powered by aggregated transaction patterns.\n[UPDATED] GDPR-compliant legitimate interest basis documented for fraud prevention processing.', hash: 'paypal-privacy-eu-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Enhanced data sharing with credit bureaus for risk assessment.\n+ Automated fraud scoring models on aggregated transaction patterns.\n+ Legitimate interest basis for fraud prevention documented.',
      aiSummaryEn: 'PayPal expanded EU data sharing to include credit bureaus for risk assessment and deployed automated fraud scoring on aggregated patterns under documented legitimate interest.',
      aiSummaryIt: 'PayPal ha ampliato la condivisione dati UE per includere agenzie di credito per la valutazione del rischio e implementato scoring antifrode automatizzato su pattern aggregati sotto interesse legittimo documentato.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [{ titleEn: 'Review Credit Bureau Sharing', titleIt: 'Verifica Condivisione Agenzie Credito', descriptionEn: 'Request details on which credit bureaus receive your transaction data.', descriptionIt: 'Richiedi dettagli su quali agenzie di credito ricevono i tuoi dati transazionali.', actionUrl: 'https://www.paypal.com/privacy/center', actionTextEn: 'Privacy Center', actionTextIt: 'Centro Privacy' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Credit bureau sharing increases financial profiling exposure. GDPR Article 22 automated decision-making rights apply.', euIndIt: 'La condivisione con agenzie di credito aumenta l\'esposizione alla profilazione finanziaria. Si applicano i diritti dell\'Articolo 22 GDPR sulle decisioni automatizzate.', euIndRisk: 'Medium', euIndCompEn: 'GDPR Article 22 applies.', euIndCompIt: 'Si applica il GDPR Articolo 22.',
        euEntEn: 'Merchants should inform customers about PayPal data sharing with credit agencies.', euEntIt: 'I merchant devono informare i clienti sulla condivisione dati PayPal con le agenzie di credito.', euEntRisk: 'Medium',
        usIndEn: 'EU-specific terms. US users governed by US privacy statement.', usIndIt: 'Termini specifici UE. Gli utenti USA sono disciplinati dall\'informativa privacy USA.', usIndRisk: 'Low',
        usEntEn: 'Limited direct impact on US enterprise operations.', usEntIt: 'Impatto diretto limitato sulle operazioni aziendali USA.', usEntRisk: 'Low',
        glIndEn: 'Credit bureau sharing practices may vary by jurisdiction.', glIndIt: 'Le pratiche di condivisione con agenzie di credito possono variare per giurisdizione.', glIndRisk: 'Low',
        glEntEn: 'Global merchants should verify local credit reporting obligations.', glEntIt: 'I merchant globali devono verificare gli obblighi locali di segnalazione creditizia.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // PayPal Privacy Statement - US
  await seedPolicy(co['paypal'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'US',
    url: 'https://www.paypal.com/us/webapps/mpp/ua/privacy-full',
    currentText: 'PayPal Privacy Statement V2 (US) - CCPA/CPRA compliant terms with expanded Venmo data sharing disclosures.',
    currentHash: 'paypal-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# PayPal Privacy Statement V1 (US)\nTransaction data, Venmo social feed data, device information collected.\nCCPA Do Not Sell link provided.', hash: 'paypal-privacy-us-v1', date: '2024-07-01T09:00:00Z' },
      { version: 2, text: '# PayPal Privacy Statement V2 (US)\n[UPDATED] Venmo transaction descriptions shared with merchant analytics partners.\n[UPDATED] CPRA-enhanced rights including data correction and processing limits.', hash: 'paypal-privacy-us-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Venmo transaction descriptions shared with merchant analytics partners.\n+ CPRA-enhanced rights for California residents.',
      aiSummaryEn: 'PayPal expanded US privacy terms to disclose Venmo transaction description sharing with merchant analytics partners and enhanced CPRA rights.',
      aiSummaryIt: 'PayPal ha ampliato i termini privacy USA per divulgare la condivisione delle descrizioni transazionali Venmo con partner analitici dei merchant e ampliato i diritti CPRA.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Adjust Venmo Privacy Settings', titleIt: 'Regola Impostazioni Privacy Venmo', descriptionEn: 'Set Venmo transactions to private to limit description sharing.', descriptionIt: 'Imposta le transazioni Venmo come private per limitare la condivisione delle descrizioni.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. Venmo is not available in the EU.', euIndIt: 'Termini specifici USA. Venmo non e disponibile nell\'UE.', euIndRisk: 'Low',
        euEntEn: 'No direct impact on EU enterprise operations.', euEntIt: 'Nessun impatto diretto sulle operazioni aziendali UE.', euEntRisk: 'Low',
        usIndEn: 'Venmo transaction descriptions may reveal purchasing habits to merchant partners.', usIndIt: 'Le descrizioni delle transazioni Venmo possono rivelare abitudini di acquisto ai partner merchant.', usIndRisk: 'Medium',
        usEntEn: 'Merchants receiving Venmo analytics data must handle it under CPRA obligations.', usEntIt: 'I merchant che ricevono dati analitici Venmo devono gestirli secondo gli obblighi CPRA.', usEntRisk: 'Medium',
        glIndEn: 'US-centric Venmo terms with limited global applicability.', glIndIt: 'Termini Venmo centrati sugli USA con applicabilita globale limitata.', glIndRisk: 'Low',
        glEntEn: 'Global merchants integrating PayPal should verify regional data sharing terms.', glEntIt: 'I merchant globali che integrano PayPal devono verificare i termini di condivisione dati regionali.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // PayPal User Agreement - EU
  await seedPolicy(co['paypal'].id, {
    name: 'User Agreement', type: 'terms', jurisdiction: 'EU',
    url: 'https://www.paypal.com/it/webapps/mpp/ua/useragreement-full',
    currentText: 'PayPal User Agreement V2 (EU) - Updated fee structure and dispute resolution for European users.',
    currentHash: 'paypal-ua-eu-v2',
    snapshots: [
      { version: 1, text: '# PayPal User Agreement V1 (EU)\nStandard terms for EU PayPal users.\nDisputes handled by Luxembourg courts. Standard currency conversion fees.', hash: 'paypal-ua-eu-v1', date: '2024-07-01T09:00:00Z' },
      { version: 2, text: '# PayPal User Agreement V2 (EU)\n[UPDATED] Currency conversion markup increased to 4% above wholesale rate.\n[UPDATED] Account dormancy fees introduced after 12 months of inactivity.', hash: 'paypal-ua-eu-v2', date: '2026-02-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Currency conversion markup increased to 4%.\n+ Account dormancy fees after 12 months inactivity.',
      aiSummaryEn: 'PayPal increased EU currency conversion markup to 4% and introduced dormancy fees for accounts inactive for 12 or more months.',
      aiSummaryIt: 'PayPal ha aumentato il markup sulla conversione valutaria UE al 4% e introdotto commissioni di inattivita per gli account inattivi da 12 o piu mesi.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Currency Settings', titleIt: 'Verifica Impostazioni Valuta', descriptionEn: 'Consider using card issuer conversion rates instead of PayPal rates.', descriptionIt: 'Considerare l\'uso dei tassi di conversione dell\'emittente carta invece dei tassi PayPal.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-02-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Higher conversion fees impact cross-border purchases. Dormancy fees may affect occasional users.', euIndIt: 'Le commissioni di conversione piu alte impattano gli acquisti transfrontalieri. Le commissioni di inattivita possono colpire gli utenti occasionali.', euIndRisk: 'Medium',
        euEntEn: 'Merchants should evaluate conversion cost impact on international sales margins.', euEntIt: 'I merchant devono valutare l\'impatto dei costi di conversione sui margini delle vendite internazionali.', euEntRisk: 'Medium',
        usIndEn: 'EU-specific fee terms. US users governed by US user agreement.', usIndIt: 'Termini tariffari specifici UE. Gli utenti USA sono disciplinati dall\'accordo utente USA.', usIndRisk: 'Low',
        usEntEn: 'US merchants with EU customers should communicate fee changes.', usEntIt: 'I merchant USA con clienti UE devono comunicare le variazioni tariffarie.', usEntRisk: 'Low',
        glIndEn: 'Currency conversion markup affects all cross-currency PayPal transactions in the EU.', glIndIt: 'Il markup sulla conversione valutaria interessa tutte le transazioni PayPal cross-valuta nell\'UE.', glIndRisk: 'Medium',
        glEntEn: 'International merchants should compare PayPal rates against alternative payment processors.', glEntIt: 'I merchant internazionali devono confrontare le tariffe PayPal con processori di pagamento alternativi.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // PayPal User Agreement - US
  await seedPolicy(co['paypal'].id, {
    name: 'User Agreement', type: 'terms', jurisdiction: 'US',
    url: 'https://www.paypal.com/us/webapps/mpp/ua/useragreement-full',
    currentText: 'PayPal User Agreement V2 (US) - Binding arbitration and updated fee disclosures.',
    currentHash: 'paypal-ua-us-v2',
    snapshots: [
      { version: 1, text: '# PayPal User Agreement V1 (US)\nStandard commercial terms. Disputes resolved in California courts.\nStandard processing fees apply.', hash: 'paypal-ua-us-v1', date: '2024-07-01T09:00:00Z' },
      { version: 2, text: '# PayPal User Agreement V2 (US)\n[UPDATED] Mandatory binding arbitration with class action waiver.\n[UPDATED] Instant transfer fee increased to 1.75% (capped at $25).', hash: 'paypal-ua-us-v2', date: '2026-02-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Mandatory binding arbitration with class action waiver.\n+ Instant transfer fee increased to 1.75%.',
      aiSummaryEn: 'PayPal introduced mandatory binding arbitration with a class action waiver for US users and increased the instant transfer fee to 1.75%.',
      aiSummaryIt: 'PayPal ha introdotto l\'arbitrato vincolante obbligatorio con rinuncia alle azioni collettive per gli utenti USA e aumentato la commissione di trasferimento istantaneo all\'1.75%.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Opt-Out of Arbitration', titleIt: 'Rinuncia all\'Arbitrato', descriptionEn: 'Users may opt out of arbitration within 30 days of accepting updated terms.', descriptionIt: 'Gli utenti possono rinunciare all\'arbitrato entro 30 giorni dall\'accettazione dei termini aggiornati.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-02-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific arbitration terms. EU consumer rights provide alternative protections.', euIndIt: 'Termini di arbitrato specifici USA. I diritti dei consumatori UE offrono protezioni alternative.', euIndRisk: 'Low',
        euEntEn: 'No direct impact on EU enterprise operations.', euEntIt: 'Nessun impatto diretto sulle operazioni aziendali UE.', euEntRisk: 'Low',
        usIndEn: 'Binding arbitration limits class action participation. Opt-out window is 30 days.', usIndIt: 'L\'arbitrato vincolante limita la partecipazione ad azioni collettive. La finestra di opt-out e di 30 giorni.', usIndRisk: 'Medium',
        usEntEn: 'Increased transfer fees impact businesses relying on instant payouts.', usEntIt: 'L\'aumento delle commissioni di trasferimento impatta le aziende che si affidano ai pagamenti istantanei.', usEntRisk: 'Medium',
        glIndEn: 'US arbitration terms apply to accounts under US jurisdiction.', glIndIt: 'I termini di arbitrato USA si applicano agli account sotto giurisdizione americana.', glIndRisk: 'Low',
        glEntEn: 'International merchants with US PayPal accounts subject to updated fee structure.', glEntIt: 'I merchant internazionali con account PayPal USA soggetti alla struttura tariffaria aggiornata.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // =========================================================================
  // 7. REVOLUT
  // =========================================================================
  console.log('Seeding Revolut...');

  // Revolut Privacy Policy - EU
  await seedPolicy(co['revolut'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.revolut.com/legal/privacy',
    currentText: 'Revolut Privacy Policy V2 (EU) - Open banking data aggregation and AI spending categorization under GDPR terms.',
    currentHash: 'revolut-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Revolut Privacy Policy V1 (EU)\nTransaction data, identity verification, and device information collected.\nOpen banking connections governed by PSD2 consent requirements.', hash: 'revolut-privacy-eu-v1', date: '2024-10-01T09:00:00Z' },
      { version: 2, text: '# Revolut Privacy Policy V2 (EU)\n[UPDATED] AI-powered spending categorization processes transaction descriptions.\n[UPDATED] Open banking data from connected accounts aggregated for financial insights.\n[UPDATED] Biometric authentication data stored locally on device.', hash: 'revolut-privacy-eu-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI spending categorization processes transaction descriptions.\n+ Open banking data aggregated for financial insights.\n+ Biometric authentication stored locally on device.',
      aiSummaryEn: 'Revolut introduced AI-powered spending categorization and open banking data aggregation for financial insights. Biometric authentication data is stored locally on the user device.',
      aiSummaryIt: 'Revolut ha introdotto la categorizzazione delle spese tramite IA e l\'aggregazione dati open banking per approfondimenti finanziari. I dati biometrici di autenticazione sono archiviati localmente sul dispositivo.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Connected Accounts', titleIt: 'Verifica Account Collegati', descriptionEn: 'Audit which external bank accounts are connected and sharing data with Revolut.', descriptionIt: 'Verifica quali conti bancari esterni sono collegati e condividono dati con Revolut.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeUKImpacts({
        euIndEn: 'PSD2 consent requirements protect EU users. Spending categorization processes transaction metadata only.', euIndIt: 'I requisiti di consenso PSD2 proteggono gli utenti UE. La categorizzazione spese elabora solo i metadati delle transazioni.', euIndRisk: 'Low',
        euEntEn: 'Enterprises should verify employee expense account data is not shared via open banking connections.', euEntIt: 'Le imprese devono verificare che i dati dei conti spese dei dipendenti non siano condivisi tramite connessioni open banking.', euEntRisk: 'Medium',
        ukIndEn: 'UK open banking framework provides strong consumer consent protections. FCA oversight applies.', ukIndIt: 'Il framework open banking UK fornisce forti protezioni del consenso dei consumatori. Si applica la supervisione FCA.', ukIndRisk: 'Low',
        ukEntEn: 'UK enterprises using Revolut Business should audit data aggregation scope.', ukEntIt: 'Le imprese UK che usano Revolut Business devono verificare l\'ambito dell\'aggregazione dati.', ukEntRisk: 'Low',
        glIndEn: 'Open banking availability varies by jurisdiction. Feature set may differ.', glIndIt: 'La disponibilita dell\'open banking varia per giurisdizione. Il set di funzionalita potrebbe differire.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises should verify Revolut feature availability per region.', glEntIt: 'Le imprese globali devono verificare la disponibilita delle funzionalita Revolut per regione.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Revolut Privacy Policy - UK
  await seedPolicy(co['revolut'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'UK',
    url: 'https://www.revolut.com/legal/privacy',
    currentText: 'Revolut Privacy Policy V2 (UK) - FCA-regulated data processing with UK GDPR compliance for AI features.',
    currentHash: 'revolut-privacy-uk-v2',
    snapshots: [
      { version: 1, text: '# Revolut Privacy Policy V1 (UK)\nTransaction data, KYC information collected under FCA regulations.\nUK GDPR data processing principles applied.', hash: 'revolut-privacy-uk-v1', date: '2024-10-01T09:00:00Z' },
      { version: 2, text: '# Revolut Privacy Policy V2 (UK)\n[UPDATED] AI-driven credit risk assessment for lending products.\n[UPDATED] UK-US data transfer under UK Adequacy Regulations.\n[UPDATED] ICO-compliant data retention schedules published.', hash: 'revolut-privacy-uk-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI-driven credit risk assessment for lending products.\n+ UK-US data transfer under UK Adequacy Regulations.\n+ ICO-compliant data retention schedules published.',
      aiSummaryEn: 'Revolut deployed AI credit risk assessment for UK lending products under FCA oversight and documented UK-US data transfers under UK Adequacy Regulations.',
      aiSummaryIt: 'Revolut ha implementato la valutazione del rischio di credito tramite IA per i prodotti di prestito UK sotto supervisione FCA e documentato i trasferimenti dati UK-USA ai sensi dei Regolamenti di Adeguatezza UK.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Request Credit Score Explanation', titleIt: 'Richiedi Spiegazione Punteggio Credito', descriptionEn: 'Request a human review of any automated credit decision under UK GDPR Article 22 equivalent.', descriptionIt: 'Richiedi una revisione umana di qualsiasi decisione di credito automatizzata ai sensi dell\'equivalente UK dell\'Articolo 22 GDPR.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeUKImpacts({
        euIndEn: 'UK-specific terms. EU users governed by EU privacy policy.', euIndIt: 'Termini specifici UK. Gli utenti UE sono disciplinati dalla privacy policy UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises serving UK customers should verify UK data adequacy status.', euEntIt: 'Le imprese UE che servono clienti UK devono verificare lo stato di adeguatezza dati UK.', euEntRisk: 'Low',
        ukIndEn: 'AI credit decisions require meaningful human review under UK GDPR. FCA consumer duty applies.', ukIndIt: 'Le decisioni di credito IA richiedono una revisione umana significativa ai sensi del GDPR UK. Si applica il dovere di diligenza FCA.', ukIndRisk: 'Medium',
        ukEntEn: 'UK enterprises using Revolut lending should verify AI decision transparency requirements.', ukEntIt: 'Le imprese UK che usano i prestiti Revolut devono verificare i requisiti di trasparenza delle decisioni IA.', ukEntRisk: 'Medium',
        glIndEn: 'UK regulatory standards may influence international fintech practices.', glIndIt: 'Gli standard normativi UK potrebbero influenzare le pratiche fintech internazionali.', glIndRisk: 'Low',
        glEntEn: 'Global fintechs should monitor UK FCA guidance on AI in financial services.', glEntIt: 'Le fintech globali devono monitorare le linee guida della FCA UK sull\'IA nei servizi finanziari.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Revolut Terms of Use - EU
  await seedPolicy(co['revolut'].id, {
    name: 'Terms of Use', type: 'terms', jurisdiction: 'EU',
    url: 'https://www.revolut.com/legal/terms',
    currentText: 'Revolut Terms of Use V2 (EU) - Updated cryptocurrency terms and account suspension policies.',
    currentHash: 'revolut-terms-eu-v2',
    snapshots: [
      { version: 1, text: '# Revolut Terms of Use V1 (EU)\nStandard e-money institution terms.\nCryptocurrency trading available with spread-based pricing.', hash: 'revolut-terms-eu-v1', date: '2024-10-01T09:00:00Z' },
      { version: 2, text: '# Revolut Terms of Use V2 (EU)\n[UPDATED] MiCA-compliant cryptocurrency trading terms.\n[UPDATED] Enhanced account suspension transparency with 30-day notice for compliance holds.', hash: 'revolut-terms-eu-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ MiCA-compliant cryptocurrency trading terms.\n+ 30-day notice for compliance-related account holds.',
      aiSummaryEn: 'Revolut updated EU terms for MiCA cryptocurrency compliance and improved account suspension transparency with 30-day notice requirements.',
      aiSummaryIt: 'Revolut ha aggiornato i termini UE per la conformita MiCA sulle criptovalute e migliorato la trasparenza delle sospensioni degli account con un preavviso di 30 giorni.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Review Crypto Terms', titleIt: 'Rivedi Termini Cripto', descriptionEn: 'Understand MiCA-compliant trading conditions and consumer protections.', descriptionIt: 'Comprendere le condizioni di trading conformi a MiCA e le protezioni per i consumatori.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeUKImpacts({
        euIndEn: 'MiCA compliance provides standardized consumer protections for crypto trading across the EU.', euIndIt: 'La conformita MiCA fornisce protezioni standardizzate per i consumatori nel trading di criptovalute nell\'UE.', euIndRisk: 'Low',
        euEntEn: 'Enterprises should verify Revolut MiCA licensing status for compliance purposes.', euEntIt: 'Le imprese devono verificare lo stato della licenza MiCA di Revolut per scopi di conformita.', euEntRisk: 'Low',
        ukIndEn: 'UK crypto terms may differ from MiCA-regulated EU terms. FCA crypto marketing rules apply.', ukIndIt: 'I termini cripto UK possono differire dai termini UE regolati da MiCA. Si applicano le regole FCA sulla pubblicita delle criptovalute.', ukIndRisk: 'Low',
        ukEntEn: 'UK enterprises should separately verify FCA crypto compliance requirements.', ukEntIt: 'Le imprese UK devono verificare separatamente i requisiti di conformita cripto della FCA.', ukEntRisk: 'Low',
        glIndEn: 'Crypto feature availability varies significantly by jurisdiction.', glIndIt: 'La disponibilita delle funzionalita cripto varia significativamente per giurisdizione.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises should check regional crypto regulatory status before using Revolut.', glEntIt: 'Le imprese globali devono verificare lo stato normativo cripto regionale prima di usare Revolut.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Revolut Terms of Use - UK
  await seedPolicy(co['revolut'].id, {
    name: 'Terms of Use', type: 'terms', jurisdiction: 'UK',
    url: 'https://www.revolut.com/legal/terms',
    currentText: 'Revolut Terms of Use V2 (UK) - FCA-authorized banking terms and updated complaint resolution procedures.',
    currentHash: 'revolut-terms-uk-v2',
    snapshots: [
      { version: 1, text: '# Revolut Terms of Use V1 (UK)\nE-money terms under FCA authorization.\nComplaints referred to Financial Ombudsman Service.', hash: 'revolut-terms-uk-v1', date: '2024-10-01T09:00:00Z' },
      { version: 2, text: '# Revolut Terms of Use V2 (UK)\n[UPDATED] Full UK banking license terms replace e-money authorization.\n[UPDATED] FSCS deposit protection up to 85,000 GBP now applies.', hash: 'revolut-terms-uk-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Full UK banking license terms replace e-money authorization.\n+ FSCS deposit protection up to 85,000 GBP applies.',
      aiSummaryEn: 'Revolut transitioned from e-money institution to full UK banking license with FSCS deposit protection up to 85,000 GBP.',
      aiSummaryIt: 'Revolut e passata da istituto di moneta elettronica a licenza bancaria UK completa con protezione depositi FSCS fino a 85.000 GBP.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Verify FSCS Coverage', titleIt: 'Verifica Copertura FSCS', descriptionEn: 'Confirm your deposits qualify for FSCS protection under the new banking license.', descriptionIt: 'Conferma che i tuoi depositi sono idonei alla protezione FSCS ai sensi della nuova licenza bancaria.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeUKImpacts({
        euIndEn: 'UK-specific banking terms. EU users served by separate EU-licensed entity.', euIndIt: 'Termini bancari specifici UK. Gli utenti UE sono serviti da un\'entita con licenza UE separata.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises should verify which Revolut entity serves their jurisdiction.', euEntIt: 'Le imprese UE devono verificare quale entita Revolut serve la loro giurisdizione.', euEntRisk: 'Low',
        ukIndEn: 'FSCS deposit protection provides substantial consumer safety net for UK account holders.', ukIndIt: 'La protezione depositi FSCS fornisce una rete di sicurezza sostanziale per i titolari di conto UK.', ukIndRisk: 'Low',
        ukEntEn: 'UK enterprises benefit from full banking license regulatory certainty.', ukEntIt: 'Le imprese UK beneficiano della certezza normativa della licenza bancaria completa.', ukEntRisk: 'Low',
        glIndEn: 'UK banking license strengthens Revolut credibility globally.', glIndIt: 'La licenza bancaria UK rafforza la credibilita di Revolut a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises should verify local licensing status independently.', glEntIt: 'Le imprese globali devono verificare lo stato della licenza locale in modo indipendente.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 8. WISE
  // =========================================================================
  console.log('Seeding Wise...');

  // Wise Privacy Policy - EU
  await seedPolicy(co['wise'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://wise.com/gb/legal/privacy-policy',
    currentText: 'Wise Privacy Policy V2 (EU) - Enhanced AML data processing and AI transaction monitoring under GDPR terms.',
    currentHash: 'wise-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Wise Privacy Policy V1 (EU)\nTransfer details, identity documents, and device data collected.\nData processed under GDPR for AML/KYC obligations.', hash: 'wise-privacy-eu-v1', date: '2024-11-01T09:00:00Z' },
      { version: 2, text: '# Wise Privacy Policy V2 (EU)\n[UPDATED] AI-powered transaction monitoring for enhanced AML compliance.\n[UPDATED] Recipient data verified against sanctions databases in real-time.', hash: 'wise-privacy-eu-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI transaction monitoring for AML compliance.\n+ Real-time sanctions database verification for recipients.',
      aiSummaryEn: 'Wise deployed AI-powered transaction monitoring for AML compliance and introduced real-time recipient verification against international sanctions databases.',
      aiSummaryIt: 'Wise ha implementato il monitoraggio transazioni tramite IA per la conformita AML e introdotto la verifica in tempo reale dei destinatari contro i database delle sanzioni internazionali.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Verify Recipient Details', titleIt: 'Verifica Dettagli Destinatario', descriptionEn: 'Ensure recipient information is accurate to avoid false sanctions flags.', descriptionIt: 'Assicurarsi che le informazioni del destinatario siano accurate per evitare falsi flag sulle sanzioni.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'AI transaction monitoring is a legal obligation under EU AML directives. Processing is lawful under GDPR Article 6(1)(c).', euIndIt: 'Il monitoraggio transazioni IA e un obbligo legale ai sensi delle direttive AML UE. Il trattamento e lecito ai sensi del GDPR Articolo 6(1)(c).', euIndRisk: 'Low',
        euEntEn: 'Enterprises using Wise for payroll transfers should verify AML monitoring scope.', euEntIt: 'Le imprese che usano Wise per i trasferimenti stipendiali devono verificare l\'ambito del monitoraggio AML.', euEntRisk: 'Low',
        usIndEn: 'EU AML monitoring terms. US users governed by US privacy policy.', usIndIt: 'Termini di monitoraggio AML UE. Gli utenti USA sono disciplinati dalla privacy policy USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU payees benefit from enhanced compliance certainty.', usEntIt: 'Le imprese USA con beneficiari UE beneficiano di una maggiore certezza di conformita.', usEntRisk: 'Low',
        glIndEn: 'Sanctions screening applies to all cross-border transfers regardless of origin.', glIndIt: 'Lo screening delle sanzioni si applica a tutti i trasferimenti transfrontalieri indipendentemente dall\'origine.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises benefit from automated AML compliance reducing manual overhead.', glEntIt: 'Le imprese globali beneficiano della conformita AML automatizzata che riduce il lavoro manuale.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Wise Privacy Policy - US
  await seedPolicy(co['wise'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US',
    url: 'https://wise.com/us/legal/privacy-policy',
    currentText: 'Wise Privacy Policy V2 (US) - FinCEN-compliant AML processing and state-level money transmitter disclosures.',
    currentHash: 'wise-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Wise Privacy Policy V1 (US)\nTransfer details and identity data collected under FinCEN requirements.\nState money transmitter licenses disclosed.', hash: 'wise-privacy-us-v1', date: '2024-11-01T09:00:00Z' },
      { version: 2, text: '# Wise Privacy Policy V2 (US)\n[UPDATED] Enhanced AI-based suspicious activity detection per FinCEN guidance.\n[UPDATED] CPRA rights available for California residents.', hash: 'wise-privacy-us-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI-based suspicious activity detection per FinCEN guidance.\n+ CPRA rights for California residents.',
      aiSummaryEn: 'Wise enhanced AI suspicious activity detection in compliance with FinCEN guidance and added CPRA rights for California residents.',
      aiSummaryIt: 'Wise ha potenziato il rilevamento di attivita sospette tramite IA in conformita con le linee guida FinCEN e aggiunto i diritti CPRA per i residenti in California.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Exercise CPRA Rights', titleIt: 'Esercita Diritti CPRA', descriptionEn: 'California residents can request data access and deletion via the privacy center.', descriptionIt: 'I residenti in California possono richiedere l\'accesso e la cancellazione dei dati tramite il centro privacy.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. EU users governed by EU privacy policy.', euIndIt: 'Termini specifici USA. Gli utenti UE sono disciplinati dalla privacy policy UE.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises with US operations should monitor FinCEN compliance updates.', euEntIt: 'Le imprese UE con operazioni USA devono monitorare gli aggiornamenti di conformita FinCEN.', euEntRisk: 'Low',
        usIndEn: 'AI-based monitoring is standard under FinCEN BSA requirements for money transmitters.', usIndIt: 'Il monitoraggio basato sull\'IA e standard ai sensi dei requisiti FinCEN BSA per i trasmettitori di denaro.', usIndRisk: 'Low',
        usEntEn: 'Businesses benefit from enhanced compliance reducing regulatory risk.', usEntIt: 'Le aziende beneficiano di una conformita migliorata che riduce il rischio normativo.', usEntRisk: 'Low',
        glIndEn: 'US AML compliance applies to all transfers touching US financial system.', glIndIt: 'La conformita AML USA si applica a tutti i trasferimenti che toccano il sistema finanziario americano.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises sending funds to/from US subject to FinCEN monitoring.', glEntIt: 'Le imprese globali che inviano fondi da/verso gli USA sono soggette al monitoraggio FinCEN.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Wise Privacy Policy - Global
  await seedPolicy(co['wise'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global',
    url: 'https://wise.com/gb/legal/privacy-policy',
    currentText: 'Wise Privacy Policy V2 (Global) - Baseline AML and transfer data processing terms.',
    currentHash: 'wise-privacy-global-v2',
    snapshots: [
      { version: 1, text: '# Wise Privacy Policy V1 (Global)\nBaseline: transfer details, identity documents, device data.\nData processed under applicable local laws.', hash: 'wise-privacy-global-v1', date: '2024-11-01T09:00:00Z' },
      { version: 2, text: '# Wise Privacy Policy V2 (Global)\n[UPDATED] Unified AML compliance framework across all operating jurisdictions.\n[UPDATED] Multi-currency account data aggregated for service improvement.', hash: 'wise-privacy-global-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Unified AML compliance framework.\n+ Multi-currency account data aggregated for service improvement.',
      aiSummaryEn: 'Wise unified its AML compliance framework globally and began aggregating multi-currency account data for service improvements.',
      aiSummaryIt: 'Wise ha unificato il framework di conformita AML a livello globale e iniziato ad aggregare i dati degli account multi-valuta per miglioramenti del servizio.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Review Data Sharing Settings', titleIt: 'Rivedi Impostazioni Condivisione Dati', descriptionEn: 'Manage preferences for data usage in service improvements.', descriptionIt: 'Gestisci le preferenze sull\'uso dei dati per i miglioramenti del servizio.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'EU users should refer to EU-specific policy for GDPR protections.', euIndIt: 'Gli utenti UE devono fare riferimento alla policy specifica UE per le protezioni GDPR.', euIndRisk: 'Low',
        euEntEn: 'Global terms do not override regional regulatory requirements.', euEntIt: 'I termini globali non prevalgono sui requisiti normativi regionali.', euEntRisk: 'Low',
        usIndEn: 'US users covered by both global and US-specific terms.', usIndIt: 'Gli utenti USA coperti sia dai termini globali che da quelli specifici USA.', usIndRisk: 'Low',
        usEntEn: 'Unified AML framework provides consistency for multi-jurisdiction operations.', usEntIt: 'Il framework AML unificato fornisce coerenza per le operazioni multi-giurisdizione.', usEntRisk: 'Low',
        glIndEn: 'Aggregated multi-currency data processing improves service but increases data concentration.', glIndIt: 'Il trattamento aggregato dei dati multi-valuta migliora il servizio ma aumenta la concentrazione dei dati.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises benefit from standardized AML procedures across Wise operations.', glEntIt: 'Le imprese globali beneficiano di procedure AML standardizzate nelle operazioni Wise.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Wise Terms of Use - Global
  await seedPolicy(co['wise'].id, {
    name: 'Terms of Use', type: 'terms', jurisdiction: 'Global',
    url: 'https://wise.com/gb/legal/terms-of-use',
    currentText: 'Wise Terms of Use V2 - Updated transfer limits and liability terms for multi-currency accounts.',
    currentHash: 'wise-terms-v2',
    snapshots: [
      { version: 1, text: '# Wise Terms of Use V1\nStandard terms for international money transfers.\nTransfer limits based on verification level.', hash: 'wise-terms-v1', date: '2024-11-01T09:00:00Z' },
      { version: 2, text: '# Wise Terms of Use V2\n[UPDATED] Increased transfer limits for fully verified accounts.\n[UPDATED] Wise not liable for delays caused by compliance screening.', hash: 'wise-terms-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Increased transfer limits for verified accounts.\n+ Wise not liable for compliance screening delays.',
      aiSummaryEn: 'Wise increased transfer limits for fully verified accounts and disclaimed liability for delays arising from compliance screening processes.',
      aiSummaryIt: 'Wise ha aumentato i limiti di trasferimento per gli account completamente verificati e declinato la responsabilita per i ritardi derivanti dai processi di screening di conformita.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Complete Full Verification', titleIt: 'Completa Verifica Completa', descriptionEn: 'Upload all required documents to access increased transfer limits.', descriptionIt: 'Carica tutti i documenti richiesti per accedere ai limiti di trasferimento aumentati.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Higher limits benefit frequent cross-border senders. Compliance delays are standard for AML.', euIndIt: 'Limiti piu alti beneficiano i mittenti transfrontalieri frequenti. I ritardi di conformita sono standard per l\'AML.', euIndRisk: 'Low',
        euEntEn: 'Enterprise transfers may still face compliance holds during peak periods.', euEntIt: 'I trasferimenti aziendali possono ancora subire blocchi di conformita durante i periodi di picco.', euEntRisk: 'Low',
        usIndEn: 'Verified US accounts benefit from increased limits. Compliance screening is legally required.', usIndIt: 'Gli account USA verificati beneficiano di limiti aumentati. Lo screening di conformita e legalmente obbligatorio.', usIndRisk: 'Low',
        usEntEn: 'Businesses should plan for potential compliance delays on high-value transfers.', usEntIt: 'Le aziende devono pianificare potenziali ritardi di conformita sui trasferimenti ad alto valore.', usEntRisk: 'Low',
        glIndEn: 'Transfer limits and verification requirements may vary by corridor.', glIndIt: 'I limiti di trasferimento e i requisiti di verifica possono variare per corridoio.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises should verify corridor-specific limits and processing times.', glEntIt: 'Le imprese globali devono verificare i limiti specifici per corridoio e i tempi di elaborazione.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 9. KLARNA
  // =========================================================================
  console.log('Seeding Klarna...');

  // Klarna Privacy Notice - EU
  await seedPolicy(co['klarna'].id, {
    name: 'Privacy Notice', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.klarna.com/it/privacy',
    currentText: 'Klarna Privacy Notice V2 (EU) - AI-powered purchase financing decisions and consumer data profiling under GDPR.',
    currentHash: 'klarna-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Klarna Privacy Notice V1 (EU)\nPurchase history, payment behavior, and device data collected.\nCredit decisions based on traditional scoring models and external credit agencies.', hash: 'klarna-privacy-eu-v1', date: '2024-12-01T09:00:00Z' },
      { version: 2, text: '# Klarna Privacy Notice V2 (EU)\n[UPDATED] AI-powered instant credit decisions replacing traditional scoring for Pay Later products.\n[UPDATED] Purchase behavior data feeds personalized shopping recommendations.\n[UPDATED] GDPR Article 22 right to human review of AI credit decisions preserved.', hash: 'klarna-privacy-eu-v2', date: '2026-04-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI instant credit decisions for Pay Later products.\n+ Purchase behavior feeds personalized recommendations.\n+ GDPR Article 22 human review right preserved.',
      aiSummaryEn: 'Klarna replaced traditional credit scoring with AI-powered instant decisions for Pay Later products. Purchase behavior now drives personalized recommendations. GDPR Article 22 human review rights remain available.',
      aiSummaryIt: 'Klarna ha sostituito lo scoring creditizio tradizionale con decisioni istantanee basate sull\'IA per i prodotti Paga Dopo. Il comportamento d\'acquisto ora alimenta raccomandazioni personalizzate. I diritti di revisione umana dell\'Articolo 22 GDPR restano disponibili.',
      overallRisk: 'High', overallScore: 7,
      remediations: [
        { titleEn: 'Request Human Review', titleIt: 'Richiedi Revisione Umana', descriptionEn: 'Exercise GDPR Article 22 right to request human review of any AI credit decision.', descriptionIt: 'Esercita il diritto dell\'Articolo 22 GDPR per richiedere la revisione umana di qualsiasi decisione creditizia IA.' },
        { titleEn: 'Manage Data Preferences', titleIt: 'Gestisci Preferenze Dati', descriptionEn: 'Adjust personalization settings to limit purchase behavior profiling.', descriptionIt: 'Regola le impostazioni di personalizzazione per limitare la profilazione del comportamento d\'acquisto.' },
      ],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'AI credit decisions classified as high-risk under EU AI Act. GDPR Article 22 human review right is critical.', euIndIt: 'Le decisioni creditizie IA classificate ad alto rischio ai sensi dell\'EU AI Act. Il diritto di revisione umana dell\'Articolo 22 GDPR e fondamentale.', euIndRisk: 'High', euIndCompEn: 'EU AI Act high-risk classification.', euIndCompIt: 'Classificazione ad alto rischio EU AI Act.',
        euEntEn: 'Merchants offering Klarna should disclose AI credit decision-making to customers.', euEntIt: 'I merchant che offrono Klarna devono comunicare ai clienti il processo decisionale creditizio basato sull\'IA.', euEntRisk: 'Medium', euEntCompEn: 'EU AI Act transparency requirement.', euEntCompIt: 'Requisito di trasparenza EU AI Act.',
        usIndEn: 'EU-specific terms. US users governed by US privacy notice.', usIndIt: 'Termini specifici UE. Gli utenti USA sono disciplinati dall\'informativa privacy USA.', usIndRisk: 'Low',
        usEntEn: 'US merchants with EU customers should verify Klarna AI compliance status.', usEntIt: 'I merchant USA con clienti UE devono verificare lo stato di conformita IA di Klarna.', usEntRisk: 'Low',
        glIndEn: 'AI credit decisions may expand to other markets with varying regulatory protections.', glIndIt: 'Le decisioni creditizie IA possono espandersi ad altri mercati con protezioni normative variabili.', glIndRisk: 'Medium',
        glEntEn: 'International merchants should monitor Klarna AI rollout per region.', glEntIt: 'I merchant internazionali devono monitorare il rilascio dell\'IA Klarna per regione.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Klarna Privacy Notice - US
  await seedPolicy(co['klarna'].id, {
    name: 'Privacy Notice', type: 'privacy', jurisdiction: 'US',
    url: 'https://www.klarna.com/us/privacy',
    currentText: 'Klarna Privacy Notice V2 (US) - AI credit decisions and CCPA/CPRA-compliant data practices.',
    currentHash: 'klarna-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Klarna Privacy Notice V1 (US)\nPurchase and payment data collected. CCPA Do Not Sell link available.', hash: 'klarna-privacy-us-v1', date: '2024-12-01T09:00:00Z' },
      { version: 2, text: '# Klarna Privacy Notice V2 (US)\n[UPDATED] AI credit decisions for Pay Later products. FCRA adverse action notices provided.\n[UPDATED] CPRA rights for California residents including data correction.', hash: 'klarna-privacy-us-v2', date: '2026-04-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI credit decisions with FCRA adverse action notices.\n+ CPRA rights including data correction.',
      aiSummaryEn: 'Klarna introduced AI credit decisions for US Pay Later products with FCRA-compliant adverse action notices and enhanced CPRA rights for California residents.',
      aiSummaryIt: 'Klarna ha introdotto decisioni creditizie IA per i prodotti Paga Dopo USA con notifiche di azioni avverse conformi al FCRA e diritti CPRA potenziati per i residenti in California.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Adverse Action Notice', titleIt: 'Verifica Notifica Azione Avversa', descriptionEn: 'If declined, review the adverse action notice for credit decision factors.', descriptionIt: 'In caso di rifiuto, verificare la notifica di azione avversa per i fattori della decisione creditizia.' }],
      aiTrainingOptOut: 'Not Allowed', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. EU users governed by EU privacy notice.', euIndIt: 'Termini specifici USA. Gli utenti UE sono disciplinati dall\'informativa privacy UE.', euIndRisk: 'Low',
        euEntEn: 'No direct impact on EU enterprise operations.', euEntIt: 'Nessun impatto diretto sulle operazioni aziendali UE.', euEntRisk: 'Low',
        usIndEn: 'AI credit decisions must comply with FCRA. Adverse action notices explain denial reasons.', usIndIt: 'Le decisioni creditizie IA devono essere conformi al FCRA. Le notifiche di azione avversa spiegano le ragioni del rifiuto.', usIndRisk: 'Medium',
        usEntEn: 'Merchants offering Klarna should inform customers about AI-based approval decisions.', usEntIt: 'I merchant che offrono Klarna devono informare i clienti sulle decisioni di approvazione basate sull\'IA.', usEntRisk: 'Low',
        glIndEn: 'US FCRA protections apply to credit decisions within the US market.', glIndIt: 'Le protezioni FCRA USA si applicano alle decisioni creditizie nel mercato statunitense.', glIndRisk: 'Low',
        glEntEn: 'International merchants with US Klarna integration subject to FCRA requirements.', glEntIt: 'I merchant internazionali con integrazione Klarna USA soggetti ai requisiti FCRA.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Klarna Terms of Service - EU
  await seedPolicy(co['klarna'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'EU',
    url: 'https://www.klarna.com/it/terms',
    currentText: 'Klarna Terms of Service V2 (EU) - Updated Pay Later terms and consumer credit directive compliance.',
    currentHash: 'klarna-terms-eu-v2',
    snapshots: [
      { version: 1, text: '# Klarna Terms of Service V1 (EU)\nPay Later terms with standard 30-day payment window.\nConsumer credit regulated under national implementations.', hash: 'klarna-terms-eu-v1', date: '2024-12-01T09:00:00Z' },
      { version: 2, text: '# Klarna Terms of Service V2 (EU)\n[UPDATED] Pay in 3 installments now regulated under revised Consumer Credit Directive.\n[UPDATED] Late payment fees capped per EU member state regulations.', hash: 'klarna-terms-eu-v2', date: '2026-04-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Pay in 3 regulated under revised Consumer Credit Directive.\n+ Late payment fees capped per member state.',
      aiSummaryEn: 'Klarna updated EU terms to comply with the revised Consumer Credit Directive for installment products and capped late payment fees per member state regulations.',
      aiSummaryIt: 'Klarna ha aggiornato i termini UE per conformarsi alla Direttiva sul Credito al Consumo rivista per i prodotti a rate e limitato le commissioni per ritardato pagamento secondo le normative degli stati membri.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Review Payment Schedule', titleIt: 'Rivedi Piano Pagamenti', descriptionEn: 'Confirm payment deadlines to avoid late fees under the new regulated terms.', descriptionIt: 'Conferma le scadenze di pagamento per evitare commissioni di ritardo secondo i nuovi termini regolamentati.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Consumer Credit Directive provides enhanced protections for installment payments across the EU.', euIndIt: 'La Direttiva sul Credito al Consumo fornisce protezioni rafforzate per i pagamenti rateali in tutta l\'UE.', euIndRisk: 'Low',
        euEntEn: 'Merchants should update checkout disclosures to reflect regulated installment terms.', euEntIt: 'I merchant devono aggiornare le informative al checkout per riflettere i termini rateali regolamentati.', euEntRisk: 'Low',
        usIndEn: 'EU-specific consumer credit terms. US users governed by US terms.', usIndIt: 'Termini di credito al consumo specifici UE. Gli utenti USA sono disciplinati dai termini USA.', usIndRisk: 'Low',
        usEntEn: 'US merchants with EU Klarna integration should verify directive compliance.', usEntIt: 'I merchant USA con integrazione Klarna UE devono verificare la conformita alla direttiva.', usEntRisk: 'Low',
        glIndEn: 'EU consumer credit regulations set high standards that may influence global practices.', glIndIt: 'Le normative UE sul credito al consumo stabiliscono standard elevati che possono influenzare le pratiche globali.', glIndRisk: 'Low',
        glEntEn: 'International merchants should monitor regulatory developments in BNPL markets.', glEntIt: 'I merchant internazionali devono monitorare gli sviluppi normativi nei mercati BNPL.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Klarna Terms of Service - US
  await seedPolicy(co['klarna'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'US',
    url: 'https://www.klarna.com/us/terms',
    currentText: 'Klarna Terms of Service V2 (US) - CFPB-regulated BNPL terms with binding arbitration.',
    currentHash: 'klarna-terms-us-v2',
    snapshots: [
      { version: 1, text: '# Klarna Terms of Service V1 (US)\nPay Later terms for US consumers. Standard rate terms.\nDisputes handled in Ohio courts.', hash: 'klarna-terms-us-v1', date: '2024-12-01T09:00:00Z' },
      { version: 2, text: '# Klarna Terms of Service V2 (US)\n[UPDATED] CFPB interpretive rule classifies BNPL as credit subject to Regulation Z disclosures.\n[UPDATED] Binding arbitration with class action waiver introduced.', hash: 'klarna-terms-us-v2', date: '2026-04-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ CFPB classifies BNPL as credit under Regulation Z.\n+ Binding arbitration with class action waiver.',
      aiSummaryEn: 'Klarna updated US terms following CFPB classification of BNPL as credit subject to Regulation Z. Binding arbitration with class action waiver was introduced.',
      aiSummaryIt: 'Klarna ha aggiornato i termini USA a seguito della classificazione CFPB del BNPL come credito soggetto alla Regulation Z. Introdotto l\'arbitrato vincolante con rinuncia alle azioni collettive.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [{ titleEn: 'Review Regulation Z Disclosures', titleIt: 'Verifica Informative Regulation Z', descriptionEn: 'Review credit disclosures now required under Regulation Z for BNPL products.', descriptionIt: 'Verificare le informative sul credito ora richieste dalla Regulation Z per i prodotti BNPL.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Not specified', aiIpLicensing: 'Not specified', aiPromptRetention: 'Not specified',
      date: '2026-04-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific CFPB terms. EU users governed by EU terms.', euIndIt: 'Termini CFPB specifici USA. Gli utenti UE sono disciplinati dai termini UE.', euIndRisk: 'Low',
        euEntEn: 'No direct impact on EU enterprise operations.', euEntIt: 'Nessun impatto diretto sulle operazioni aziendali UE.', euEntRisk: 'Low',
        usIndEn: 'BNPL now treated as credit with full Regulation Z disclosures and dispute rights.', usIndIt: 'Il BNPL e ora trattato come credito con informative complete Regulation Z e diritti di contestazione.', usIndRisk: 'Medium',
        usEntEn: 'Merchants must ensure checkout flows display required Regulation Z disclosures.', usEntIt: 'I merchant devono assicurarsi che i flussi di checkout mostrino le informative Regulation Z richieste.', usEntRisk: 'Medium',
        glIndEn: 'US BNPL regulation may influence global regulatory approaches.', glIndIt: 'La regolamentazione BNPL USA potrebbe influenzare gli approcci normativi globali.', glIndRisk: 'Low',
        glEntEn: 'International merchants should track BNPL regulatory developments across markets.', glEntIt: 'I merchant internazionali devono seguire gli sviluppi normativi BNPL nei vari mercati.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 10. PLAID
  // =========================================================================
  console.log('Seeding Plaid...');

  // Plaid Privacy Policy - US
  await seedPolicy(co['plaid'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'US',
    url: 'https://plaid.com/legal/#privacy',
    currentText: 'Plaid Privacy Policy V2 (US) - Enhanced consent framework and reduced data retention following FTC settlement.',
    currentHash: 'plaid-privacy-us-v2',
    snapshots: [
      { version: 1, text: '# Plaid Privacy Policy V1 (US)\nBank account credentials, transaction history, and balance data collected.\nData shared with connected application developers. Broad data usage rights.', hash: 'plaid-privacy-us-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Plaid Privacy Policy V2 (US)\n[UPDATED] Granular consent screens showing exactly which data fields each app accesses.\n[UPDATED] Historical transaction data limited to 24 months per FTC settlement.\n[UPDATED] Data deletion upon app disconnection within 30 days.', hash: 'plaid-privacy-us-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Granular consent screens showing data field access per app.\n+ Transaction history limited to 24 months.\n+ Data deletion within 30 days of app disconnection.',
      aiSummaryEn: 'Plaid overhauled its consent framework with granular data field visibility, limited historical data to 24 months per FTC settlement, and committed to 30-day deletion upon app disconnection.',
      aiSummaryIt: 'Plaid ha rinnovato il framework di consenso con visibilita granulare dei campi dati, limitato i dati storici a 24 mesi secondo l\'accordo FTC e si e impegnata nella cancellazione entro 30 giorni dalla disconnessione dell\'app.',
      overallRisk: 'Medium', overallScore: 4,
      remediations: [
        { titleEn: 'Audit Connected Apps', titleIt: 'Verifica App Collegate', descriptionEn: 'Review and disconnect unused applications from your Plaid account via the portal.', descriptionIt: 'Rivedi e disconnetti le applicazioni non utilizzate dal tuo account Plaid tramite il portale.', actionUrl: 'https://my.plaid.com', actionTextEn: 'Plaid Portal', actionTextIt: 'Portale Plaid' },
        { titleEn: 'Verify Data Retention', titleIt: 'Verifica Conservazione Dati', descriptionEn: 'Confirm that historical transaction data is limited to the 24-month window.', descriptionIt: 'Conferma che i dati storici delle transazioni siano limitati alla finestra di 24 mesi.' },
      ],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms driven by FTC settlement. EU users have separate GDPR protections.', euIndIt: 'Termini specifici USA derivanti dall\'accordo FTC. Gli utenti UE hanno protezioni GDPR separate.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises using Plaid for US operations benefit from improved consent transparency.', euEntIt: 'Le imprese UE che usano Plaid per operazioni USA beneficiano di una migliore trasparenza del consenso.', euEntRisk: 'Low',
        usIndEn: 'Granular consent screens provide better visibility into data sharing. Historical data now limited.', usIndIt: 'Le schermate di consenso granulare forniscono migliore visibilita sulla condivisione dati. I dati storici ora sono limitati.', usIndRisk: 'Low', usIndCompEn: 'FTC settlement compliance.', usIndCompIt: 'Conformita all\'accordo FTC.',
        usEntEn: 'Developers must implement updated Plaid Link consent flows. Data access limited to 24 months.', usEntIt: 'Gli sviluppatori devono implementare i flussi di consenso Plaid Link aggiornati. L\'accesso ai dati limitato a 24 mesi.', usEntRisk: 'Medium', usEntCompEn: 'FTC consent decree requirements.', usEntCompIt: 'Requisiti del decreto di consenso FTC.',
        glIndEn: 'FTC settlement raises the bar for open finance data sharing practices globally.', glIndIt: 'L\'accordo FTC alza lo standard per le pratiche di condivisione dati nella finanza aperta a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Global fintech companies should align with enhanced consent standards.', glEntIt: 'Le aziende fintech globali devono allinearsi agli standard di consenso migliorati.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Plaid Privacy Policy - EU
  await seedPolicy(co['plaid'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://plaid.com/legal/#privacy',
    currentText: 'Plaid Privacy Policy V2 (EU) - PSD2-compliant open banking data processing with GDPR consent requirements.',
    currentHash: 'plaid-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Plaid Privacy Policy V1 (EU)\nBank account data accessed via PSD2 AISP authorization.\nGDPR-compliant data processing with explicit user consent.', hash: 'plaid-privacy-eu-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Plaid Privacy Policy V2 (EU)\n[UPDATED] Enhanced PSD2 consent renewal every 90 days per regulatory requirement.\n[UPDATED] Data minimization: only fields explicitly consented to are processed.\n[UPDATED] Right to data portability explicitly documented.', hash: 'plaid-privacy-eu-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ PSD2 consent renewal every 90 days.\n+ Data minimization: only consented fields processed.\n+ Right to data portability documented.',
      aiSummaryEn: 'Plaid formalized PSD2 consent renewal cycles (90 days), adopted strict data minimization for EU users, and explicitly documented data portability rights.',
      aiSummaryIt: 'Plaid ha formalizzato i cicli di rinnovo del consenso PSD2 (90 giorni), adottato la minimizzazione stretta dei dati per gli utenti UE e documentato esplicitamente i diritti alla portabilita dei dati.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Renew PSD2 Consent', titleIt: 'Rinnova Consenso PSD2', descriptionEn: 'Re-authorize bank connections every 90 days when prompted by connected applications.', descriptionIt: 'Riautorizza le connessioni bancarie ogni 90 giorni quando richiesto dalle applicazioni collegate.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'PSD2 90-day consent renewal provides regular review of data access. GDPR data portability strengthened.', euIndIt: 'Il rinnovo del consenso PSD2 ogni 90 giorni fornisce una revisione regolare dell\'accesso ai dati. Rafforzata la portabilita dati GDPR.', euIndRisk: 'Low', euIndCompEn: 'PSD2 and GDPR compliant.', euIndCompIt: 'Conforme a PSD2 e GDPR.',
        euEntEn: 'Developers must handle 90-day consent renewal flows gracefully in application UX.', euEntIt: 'Gli sviluppatori devono gestire con grazia i flussi di rinnovo consenso a 90 giorni nell\'UX dell\'applicazione.', euEntRisk: 'Low',
        usIndEn: 'EU-specific PSD2 terms. US users governed by US privacy policy.', usIndIt: 'Termini PSD2 specifici UE. Gli utenti USA sono disciplinati dalla privacy policy USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU open banking integrations must support 90-day re-consent.', usEntIt: 'Le imprese USA con integrazioni open banking UE devono supportare il riconsenso a 90 giorni.', usEntRisk: 'Low',
        glIndEn: 'EU consent standards set high bar for open banking data access globally.', glIndIt: 'Gli standard di consenso UE stabiliscono standard elevati per l\'accesso ai dati nell\'open banking a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Global open banking platforms should adopt similar consent renewal practices.', glEntIt: 'Le piattaforme open banking globali dovrebbero adottare pratiche simili di rinnovo del consenso.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Plaid End User Services Agreement - US
  await seedPolicy(co['plaid'].id, {
    name: 'End User Services Agreement', type: 'terms', jurisdiction: 'US',
    url: 'https://plaid.com/legal/#end-user-services',
    currentText: 'Plaid End User Services Agreement V2 (US) - Updated liability terms and data accuracy disclaimers.',
    currentHash: 'plaid-eusa-us-v2',
    snapshots: [
      { version: 1, text: '# Plaid EUSA V1 (US)\nStandard terms for end users connecting bank accounts via Plaid.\nPlaid acts as authorized agent for data access.', hash: 'plaid-eusa-us-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Plaid EUSA V2 (US)\n[UPDATED] Plaid disclaims liability for data accuracy from financial institution sources.\n[UPDATED] Users may revoke access at any time via the Plaid Portal with 30-day data deletion.', hash: 'plaid-eusa-us-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Plaid disclaims liability for data accuracy from financial institutions.\n+ Users may revoke access at any time with 30-day deletion.',
      aiSummaryEn: 'Plaid disclaimed liability for data accuracy provided by financial institutions and formalized user access revocation with 30-day data deletion guarantees.',
      aiSummaryIt: 'Plaid ha declinato la responsabilita per l\'accuratezza dei dati forniti dagli istituti finanziari e formalizzato la revoca dell\'accesso con garanzie di cancellazione dati entro 30 giorni.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [{ titleEn: 'Manage Connected Accounts', titleIt: 'Gestisci Account Collegati', descriptionEn: 'Use the Plaid Portal to review and revoke application access to your bank data.', descriptionIt: 'Usa il Portale Plaid per rivedere e revocare l\'accesso delle applicazioni ai tuoi dati bancari.', actionUrl: 'https://my.plaid.com', actionTextEn: 'Plaid Portal', actionTextIt: 'Portale Plaid' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'US-specific terms. EU users have separate GDPR-governed agreements.', euIndIt: 'Termini specifici USA. Gli utenti UE hanno accordi separati regolati dal GDPR.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises should verify which legal agreements govern their Plaid integration.', euEntIt: 'Le imprese UE devono verificare quali accordi legali disciplinano la loro integrazione Plaid.', euEntRisk: 'Low',
        usIndEn: 'Data accuracy disclaimers shift verification responsibility to users and their financial institutions.', usIndIt: 'Le esclusioni di responsabilita sull\'accuratezza dei dati spostano la responsabilita di verifica sugli utenti e i loro istituti finanziari.', usIndRisk: 'Low',
        usEntEn: 'Developers relying on Plaid data should implement independent validation checks.', usEntIt: 'Gli sviluppatori che si affidano ai dati Plaid devono implementare controlli di validazione indipendenti.', usEntRisk: 'Medium',
        glIndEn: 'User access revocation with deletion guarantees sets industry best practice.', glIndIt: 'La revoca dell\'accesso utente con garanzie di cancellazione stabilisce la migliore pratica del settore.', glIndRisk: 'Low',
        glEntEn: 'Global fintech platforms should adopt similar data deletion commitments.', glEntIt: 'Le piattaforme fintech globali dovrebbero adottare impegni simili di cancellazione dati.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // Plaid End User Services Agreement - EU
  await seedPolicy(co['plaid'].id, {
    name: 'End User Services Agreement', type: 'terms', jurisdiction: 'EU',
    url: 'https://plaid.com/legal/#end-user-services',
    currentText: 'Plaid End User Services Agreement V2 (EU) - PSD2-governed account access terms with GDPR data rights.',
    currentHash: 'plaid-eusa-eu-v2',
    snapshots: [
      { version: 1, text: '# Plaid EUSA V1 (EU)\nTerms for EU end users under PSD2 AISP framework.\nData access authorized via bank-side Strong Customer Authentication.', hash: 'plaid-eusa-eu-v1', date: '2024-06-01T09:00:00Z' },
      { version: 2, text: '# Plaid EUSA V2 (EU)\n[UPDATED] Enhanced SCA flow with redirect-based authentication.\n[UPDATED] GDPR data subject rights (access, correction, deletion) explicitly documented.\n[UPDATED] Data processing limited to purposes disclosed at time of consent.', hash: 'plaid-eusa-eu-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Enhanced SCA flow with redirect-based authentication.\n+ GDPR data subject rights explicitly documented.\n+ Processing limited to disclosed purposes.',
      aiSummaryEn: 'Plaid enhanced EU authentication flows with redirect-based SCA, explicitly documented GDPR data subject rights, and committed to purpose-limited data processing.',
      aiSummaryIt: 'Plaid ha migliorato i flussi di autenticazione UE con SCA basata su reindirizzamento, documentato esplicitamente i diritti degli interessati GDPR e si e impegnata al trattamento dati limitato alle finalita dichiarate.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Review Consent Scope', titleIt: 'Rivedi Ambito del Consenso', descriptionEn: 'Verify which data fields and purposes you have consented to in the Plaid consent screen.', descriptionIt: 'Verifica a quali campi dati e finalita hai acconsentito nella schermata di consenso Plaid.' }],
      aiTrainingOptOut: 'Not specified', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Not specified', aiPromptRetention: 'System-deleted',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Enhanced SCA and purpose limitation provide strong consumer protections. GDPR rights fully documented.', euIndIt: 'SCA potenziata e limitazione delle finalita forniscono forti protezioni per i consumatori. Diritti GDPR completamente documentati.', euIndRisk: 'Low', euIndCompEn: 'PSD2 SCA and GDPR compliant.', euIndCompIt: 'Conforme a PSD2 SCA e GDPR.',
        euEntEn: 'Developers must implement redirect-based SCA flows per updated Plaid specifications.', euEntIt: 'Gli sviluppatori devono implementare flussi SCA basati su reindirizzamento secondo le specifiche Plaid aggiornate.', euEntRisk: 'Low',
        usIndEn: 'EU-specific PSD2 terms. US users governed by US end user agreement.', usIndIt: 'Termini PSD2 specifici UE. Gli utenti USA sono disciplinati dall\'accordo utente USA.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU users must support PSD2-compliant authentication flows.', usEntIt: 'Le imprese USA con utenti UE devono supportare i flussi di autenticazione conformi a PSD2.', usEntRisk: 'Low',
        glIndEn: 'EU authentication and consent standards influence global open banking practices.', glIndIt: 'Gli standard di autenticazione e consenso UE influenzano le pratiche globali di open banking.', glIndRisk: 'Low',
        glEntEn: 'Global platforms should adopt similar purpose-limited data processing commitments.', glEntIt: 'Le piattaforme globali dovrebbero adottare impegni simili di trattamento dati limitato alle finalita.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 11. OPENAI
  // =========================================================================
  console.log('Seeding OpenAI...');

  // OpenAI Terms of Use - Global
  await seedPolicy(co['openai'].id, {
    name: 'Terms of Use', type: 'terms', jurisdiction: 'Global',
    url: 'https://openai.com/policies/terms-of-use',
    currentText: '# OpenAI Terms of Use V2\nChatGPT Plus and Team data not used for model training. Free tier users may opt out. Prompts retained 30 days for abuse monitoring.',
    currentHash: 'openai-terms-v2',
    snapshots: [
      { version: 1, text: '# OpenAI Terms of Use V1\nGeneral terms for ChatGPT and API services.\nUser content may be used to improve models.\nNo explicit AI training opt-out mechanism.', hash: 'openai-terms-v1', date: '2024-03-15T10:00:00Z' },
      { version: 2, text: '# OpenAI Terms of Use V2\n[UPDATED] ChatGPT Plus and Team data is not used for model training by default.\n[UPDATED] Free tier users may opt out of training via Settings > Data Controls.\n[UPDATED] Prompts are retained for 30 days for abuse monitoring and safety review, then deleted.', hash: 'openai-terms-v2', date: '2026-04-10T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ ChatGPT Plus and Team data excluded from model training by default.\n+ Free tier users may opt out via Settings > Data Controls.\n+ Prompts retained for 30 days for abuse monitoring, then deleted.',
      aiSummaryEn: 'OpenAI updated its Terms of Use to exclude ChatGPT Plus and Team subscriber data from model training. Free tier users now have an opt-out mechanism via Data Controls. Prompt data is retained for 30 days for abuse monitoring before deletion.',
      aiSummaryIt: 'OpenAI ha aggiornato i Termini d\'Uso escludendo i dati degli abbonati ChatGPT Plus e Team dall\'addestramento dei modelli. Gli utenti gratuiti ora possono disattivare l\'uso dei dati tramite Controlli Dati. I prompt vengono conservati per 30 giorni per il monitoraggio degli abusi prima della cancellazione.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [
        { titleEn: 'Disable Model Training', titleIt: 'Disattiva Addestramento Modelli', descriptionEn: 'Free tier users should navigate to Settings > Data Controls and toggle off "Improve the model for everyone" to opt out.', descriptionIt: 'Gli utenti gratuiti devono andare in Impostazioni > Controlli Dati e disattivare "Migliora il modello per tutti" per negare il consenso.', actionUrl: 'https://chat.openai.com/settings', actionTextEn: 'ChatGPT Settings', actionTextIt: 'Impostazioni ChatGPT' },
        { titleEn: 'Review Prompt Retention', titleIt: 'Verifica Conservazione Prompt', descriptionEn: 'Be aware that prompts are retained for 30 days regardless of training opt-out. Avoid sharing sensitive data in prompts.', descriptionIt: 'Tieni presente che i prompt vengono conservati per 30 giorni indipendentemente dall\'opt-out. Evita di condividere dati sensibili nei prompt.' }
      ],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'User retains rights', aiPromptRetention: '30 days',
      date: '2026-04-10T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'GDPR Art. 6 requires lawful basis for processing. Opt-out mechanism partially addresses consent requirements but 30-day retention may conflict with data minimisation principles.', euIndIt: 'L\'Art. 6 GDPR richiede una base giuridica per il trattamento. Il meccanismo di opt-out soddisfa parzialmente i requisiti di consenso ma la conservazione di 30 giorni puo confliggere con i principi di minimizzazione.', euIndRisk: 'Medium',
        euEntEn: 'Enterprise users on Team/Plus plans benefit from automatic exclusion. No additional compliance action required.', euEntIt: 'Gli utenti aziendali con piani Team/Plus beneficiano dell\'esclusione automatica. Nessuna azione di conformita aggiuntiva richiesta.', euEntRisk: 'Low',
        usIndEn: 'Free tier data used for training by default. Users must manually opt out through Data Controls settings.', usIndIt: 'I dati del piano gratuito sono usati per l\'addestramento di default. Gli utenti devono disattivare manualmente tramite le impostazioni Controlli Dati.', usIndRisk: 'Medium',
        usEntEn: 'Paid tiers (Plus, Team, Enterprise) provide contractual guarantees against training data usage.', usEntIt: 'I piani a pagamento (Plus, Team, Enterprise) forniscono garanzie contrattuali contro l\'uso dei dati per l\'addestramento.', usEntRisk: 'Low',
        glIndEn: '30-day prompt retention applies globally. Users in jurisdictions with strong data protection should review implications.', glIndIt: 'La conservazione dei prompt per 30 giorni si applica globalmente. Gli utenti in giurisdizioni con forte protezione dati dovrebbero valutare le implicazioni.', glIndRisk: 'Medium',
        glEntEn: 'Global enterprises should verify that their OpenAI plan tier provides adequate data isolation guarantees.', glEntIt: 'Le imprese globali devono verificare che il loro piano OpenAI fornisca garanzie adeguate di isolamento dei dati.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Partial',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // OpenAI Privacy Policy - EU
  await seedPolicy(co['openai'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://openai.com/policies/eu-privacy-policy',
    currentText: '# OpenAI EU Privacy Policy V2\nEnhanced GDPR Art. 17 right to erasure compliance. Updated DPA for business customers. EU data residency option for Enterprise tier.',
    currentHash: 'openai-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# OpenAI EU Privacy Policy V1\nBasic GDPR compliance statement.\nPersonal data processed for model improvement under legitimate interest.\nData subject requests handled within 30 days.', hash: 'openai-privacy-eu-v1', date: '2024-06-20T10:00:00Z' },
      { version: 2, text: '# OpenAI EU Privacy Policy V2\n[UPDATED] Enhanced GDPR Art. 17 erasure: deletion requests processed within 15 business days with confirmation receipt.\n[UPDATED] Data Processing Addendum updated with Standard Contractual Clauses (SCCs) for cross-border transfers.\n[UPDATED] EU data residency option available for Enterprise tier customers via Azure EU regions.', hash: 'openai-privacy-eu-v2', date: '2026-02-28T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ GDPR Art. 17 erasure requests processed within 15 business days with confirmation.\n+ DPA updated with Standard Contractual Clauses for cross-border transfers.\n+ EU data residency option for Enterprise via Azure EU regions.',
      aiSummaryEn: 'OpenAI strengthened EU privacy protections by accelerating erasure request processing to 15 business days, updating the DPA with SCCs, and offering EU data residency for Enterprise customers through Azure EU regions.',
      aiSummaryIt: 'OpenAI ha rafforzato le protezioni privacy UE accelerando l\'elaborazione delle richieste di cancellazione a 15 giorni lavorativi, aggiornando il DPA con SCCs e offrendo la residenza dati UE per i clienti Enterprise tramite le regioni Azure UE.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [
        { titleEn: 'Submit Erasure Request', titleIt: 'Invia Richiesta di Cancellazione', descriptionEn: 'EU users can submit GDPR Art. 17 erasure requests through the OpenAI privacy portal for processing within 15 business days.', descriptionIt: 'Gli utenti UE possono inviare richieste di cancellazione ai sensi dell\'Art. 17 GDPR tramite il portale privacy di OpenAI per l\'elaborazione entro 15 giorni lavorativi.', actionUrl: 'https://privacy.openai.com/policies', actionTextEn: 'Privacy Portal', actionTextIt: 'Portale Privacy' }
      ],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'User retains rights', aiPromptRetention: '30 days',
      date: '2026-02-28T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Improved erasure timelines and SCC-backed cross-border transfers strengthen EU user protections significantly.', euIndIt: 'Tempistiche di cancellazione migliorate e trasferimenti transfrontalieri supportati da SCC rafforzano significativamente le protezioni degli utenti UE.', euIndRisk: 'Low',
        euEntEn: 'Enterprise EU data residency option eliminates cross-border transfer concerns for regulated industries.', euEntIt: 'L\'opzione di residenza dati UE per Enterprise elimina le preoccupazioni sui trasferimenti transfrontalieri per i settori regolamentati.', euEntRisk: 'Low',
        usIndEn: 'EU-specific policy improvements. US users governed by the general OpenAI privacy policy.', usIndIt: 'Miglioramenti specifici per la policy UE. Gli utenti USA sono disciplinati dalla privacy policy generale di OpenAI.', usIndRisk: 'Low',
        usEntEn: 'US enterprises with EU operations benefit from updated SCCs simplifying data transfer compliance.', usEntIt: 'Le imprese USA con operazioni UE beneficiano delle SCC aggiornate che semplificano la conformita sui trasferimenti dati.', usEntRisk: 'Low',
        glIndEn: 'Enhanced EU standards may set baseline expectations for privacy rights globally.', glIndIt: 'Gli standard UE migliorati potrebbero stabilire aspettative di base per i diritti alla privacy a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Multinational organizations can leverage EU data residency to centralize compliance across regions.', glEntIt: 'Le organizzazioni multinazionali possono sfruttare la residenza dati UE per centralizzare la conformita tra le regioni.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Extended',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Partial',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Partial',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 12. AMAZON
  // =========================================================================
  console.log('Seeding Amazon...');

  // Amazon Privacy Notice - EU
  await seedPolicy(co['amazon'].id, {
    name: 'Privacy Notice', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ',
    currentText: '# Amazon Privacy Notice V2\nAlexa voice recordings used for LLM training with opt-out. Ring/Blink data sharing expanded to include neighborhood safety partners. AI shopping recommendations powered by purchase history and browsing behavior.',
    currentHash: 'amazon-privacy-eu-v2',
    snapshots: [
      { version: 1, text: '# Amazon Privacy Notice V1\nStandard e-commerce data collection: purchase history, browsing, payment methods.\nAlexa voice recordings stored for service improvement.\nThird-party marketplace sellers receive order fulfillment data.', hash: 'amazon-privacy-eu-v1', date: '2024-01-15T10:00:00Z' },
      { version: 2, text: '# Amazon Privacy Notice V2\n[UPDATED] Alexa voice recordings are now used for large language model training. Users may opt out via Alexa Privacy Settings.\n[UPDATED] Ring and Blink video data sharing expanded to include law enforcement and neighborhood safety partners.\n[UPDATED] AI-powered shopping recommendations use full purchase history, browsing behavior, and Alexa interactions to personalize results.', hash: 'amazon-privacy-eu-v2', date: '2026-03-20T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Alexa voice recordings used for LLM training with opt-out via Alexa Privacy Settings.\n+ Ring/Blink video data sharing expanded to law enforcement and neighborhood safety partners.\n+ AI shopping recommendations powered by full purchase history, browsing, and Alexa interactions.',
      aiSummaryEn: 'Amazon significantly expanded data usage: Alexa voice recordings now train LLMs (opt-out available), Ring/Blink camera data is shared with law enforcement partners, and AI shopping recommendations leverage cross-device behavioral data including Alexa interactions.',
      aiSummaryIt: 'Amazon ha ampliato significativamente l\'uso dei dati: le registrazioni vocali di Alexa ora addestrano LLM (opt-out disponibile), i dati delle telecamere Ring/Blink sono condivisi con le forze dell\'ordine, e le raccomandazioni di acquisto IA sfruttano dati comportamentali cross-device incluse le interazioni Alexa.',
      overallRisk: 'High', overallScore: 7,
      remediations: [
        { titleEn: 'Disable Alexa Training', titleIt: 'Disattiva Addestramento Alexa', descriptionEn: 'Navigate to Alexa app > Settings > Alexa Privacy > Manage Your Alexa Data and disable "Help improve Amazon services and develop new features".', descriptionIt: 'Vai nell\'app Alexa > Impostazioni > Privacy Alexa > Gestisci i Tuoi Dati Alexa e disattiva "Aiuta a migliorare i servizi Amazon e sviluppare nuove funzionalita".', actionUrl: 'https://www.amazon.com/alexa-privacy/apd/myad', actionTextEn: 'Alexa Privacy', actionTextIt: 'Privacy Alexa' },
        { titleEn: 'Review Ring Sharing Settings', titleIt: 'Rivedi Impostazioni Condivisione Ring', descriptionEn: 'Review and restrict Ring/Blink data sharing with third parties in the Ring app under Control Center > Video Sharing.', descriptionIt: 'Rivedi e limita la condivisione dati Ring/Blink con terze parti nell\'app Ring sotto Centro di Controllo > Condivisione Video.' }
      ],
      aiTrainingOptOut: 'Opt-out available', aiDataScrapingRestricted: 'Not restricted', aiIpLicensing: 'Company retains broad license', aiPromptRetention: 'Indefinite',
      date: '2026-03-20T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Alexa voice data for LLM training raises GDPR Art. 6 and Art. 9 concerns. Ring data sharing with law enforcement may violate proportionality principles. EDPB guidance on voice assistants applies.', euIndIt: 'L\'uso dei dati vocali Alexa per l\'addestramento LLM solleva preoccupazioni relative agli Art. 6 e 9 GDPR. La condivisione dati Ring con le forze dell\'ordine potrebbe violare i principi di proporzionalita. Si applicano le linee guida EDPB sugli assistenti vocali.', euIndRisk: 'High',
        euEntEn: 'EU enterprises using Amazon services should audit data flows to ensure GDPR compliance, particularly for voice and video data.', euEntIt: 'Le imprese UE che usano servizi Amazon dovrebbero verificare i flussi di dati per garantire la conformita GDPR, in particolare per dati vocali e video.', euEntRisk: 'Medium',
        usIndEn: 'Expanded data collection across Alexa, Ring, and shopping creates a comprehensive behavioral profile. Opt-out options are buried in device-specific settings.', usIndIt: 'La raccolta dati espansa tra Alexa, Ring e shopping crea un profilo comportamentale completo. Le opzioni di opt-out sono nascoste nelle impostazioni specifiche del dispositivo.', usIndRisk: 'High',
        usEntEn: 'Businesses using Ring for premises security should evaluate third-party data sharing implications for employee privacy.', usEntIt: 'Le aziende che usano Ring per la sicurezza dei locali dovrebbero valutare le implicazioni della condivisione dati con terzi per la privacy dei dipendenti.', usEntRisk: 'Medium',
        glIndEn: 'Cross-device data aggregation for AI recommendations creates significant profiling concerns in jurisdictions with weak privacy laws.', glIndIt: 'L\'aggregazione dati cross-device per le raccomandazioni IA crea preoccupazioni significative sulla profilazione in giurisdizioni con leggi sulla privacy deboli.', glIndRisk: 'High',
        glEntEn: 'Global enterprises should implement data governance policies restricting Amazon device usage in sensitive environments.', glEntIt: 'Le imprese globali dovrebbero implementare politiche di governance dei dati che limitano l\'uso di dispositivi Amazon in ambienti sensibili.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Partial',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // AWS Data Processing Addendum - Global
  await seedPolicy(co['amazon'].id, {
    name: 'AWS Data Processing Addendum', type: 'developer', jurisdiction: 'Global',
    url: 'https://aws.amazon.com/compliance/data-processing-addendum/',
    currentText: '# AWS Data Processing Addendum V2\nBedrock model customization data fully isolated. SCC clauses updated for Schrems II compliance. AI governance controls added for automated decision-making transparency.',
    currentHash: 'aws-dpa-v2',
    snapshots: [
      { version: 1, text: '# AWS Data Processing Addendum V1\nStandard DPA for AWS services.\nCustomer content is not accessed or used for AWS AI/ML service improvement.\nData processed in customer-selected AWS regions.', hash: 'aws-dpa-v1', date: '2024-09-01T10:00:00Z' },
      { version: 2, text: '# AWS Data Processing Addendum V2\n[UPDATED] Amazon Bedrock model customization data is fully isolated in customer-dedicated environments with no cross-tenant access.\n[UPDATED] Standard Contractual Clauses updated to reflect Schrems II supplementary measures and EDPB recommendations.\n[UPDATED] AI governance controls added: customers can audit automated decision-making logs and configure transparency reporting.', hash: 'aws-dpa-v2', date: '2026-05-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Bedrock model customization data fully isolated in customer-dedicated environments.\n+ SCCs updated with Schrems II supplementary measures.\n+ AI governance controls for automated decision-making audit and transparency.',
      aiSummaryEn: 'AWS strengthened the DPA with full data isolation for Bedrock model customization, updated SCCs with Schrems II supplementary measures, and introduced AI governance controls enabling customers to audit automated decision-making and configure transparency reporting.',
      aiSummaryIt: 'AWS ha rafforzato il DPA con isolamento completo dei dati per la personalizzazione dei modelli Bedrock, aggiornato le SCC con misure supplementari Schrems II e introdotto controlli di governance IA che consentono ai clienti di verificare il processo decisionale automatizzato e configurare report di trasparenza.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [
        { titleEn: 'Review Updated DPA', titleIt: 'Rivedi DPA Aggiornato', descriptionEn: 'Review the updated AWS DPA and verify that your data processing agreements reference the latest SCC clauses and Schrems II supplementary measures.', descriptionIt: 'Rivedi il DPA AWS aggiornato e verifica che i tuoi accordi di trattamento dati facciano riferimento alle clausole SCC piu recenti e alle misure supplementari Schrems II.', actionUrl: 'https://aws.amazon.com/compliance/data-processing-addendum/', actionTextEn: 'AWS DPA', actionTextIt: 'DPA AWS' }
      ],
      aiTrainingOptOut: 'Full isolation', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Customer retains all rights', aiPromptRetention: 'Customer-controlled',
      date: '2026-05-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Updated SCCs and Schrems II measures address EU data transfer requirements. Bedrock isolation provides strong data protection.', euIndIt: 'Le SCC aggiornate e le misure Schrems II rispondono ai requisiti UE sui trasferimenti dati. L\'isolamento Bedrock fornisce una forte protezione dei dati.', euIndRisk: 'Low',
        euEntEn: 'EU enterprises gain full data isolation for AI model customization and audit capabilities for automated decision-making compliance.', euEntIt: 'Le imprese UE ottengono l\'isolamento completo dei dati per la personalizzazione dei modelli IA e capacita di audit per la conformita del processo decisionale automatizzato.', euEntRisk: 'Low',
        usIndEn: 'Minimal direct impact on individual users. DPA governs enterprise and developer relationships.', usIndIt: 'Impatto diretto minimo sugli utenti individuali. Il DPA disciplina i rapporti aziendali e con gli sviluppatori.', usIndRisk: 'Low',
        usEntEn: 'US enterprises benefit from AI governance controls and audit capabilities for compliance documentation.', usEntIt: 'Le imprese USA beneficiano dei controlli di governance IA e delle capacita di audit per la documentazione di conformita.', usEntRisk: 'Low',
        glIndEn: 'AWS governance controls set industry standard for AI data processing transparency globally.', glIndIt: 'I controlli di governance AWS stabiliscono lo standard di settore per la trasparenza del trattamento dati IA a livello globale.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises can leverage unified DPA with region-specific SCC supplements for multinational deployments.', glEntIt: 'Le imprese globali possono sfruttare un DPA unificato con supplementi SCC specifici per regione per implementazioni multinazionali.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'None',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Partial'
        },
    }],
  });

  // =========================================================================
  // 13. APPLE
  // =========================================================================
  console.log('Seeding Apple...');

  // Apple Privacy Policy - EU
  await seedPolicy(co['apple'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.apple.com/legal/privacy/en-ww/',
    currentText: '# Apple Privacy Policy V2\nApple Intelligence processes data on-device by default. Private Cloud Compute handles requests that exceed device capacity with end-to-end encryption. No user data is used for foundation model training.',
    currentHash: 'apple-privacy-v2',
    snapshots: [
      { version: 1, text: '# Apple Privacy Policy V1\nApple collects minimal personal data. On-device processing is prioritized for all features.\nData minimization and differential privacy are core principles.\nNo personal data is used for model training.', hash: 'apple-privacy-v1', date: '2024-06-10T10:00:00Z' },
      { version: 2, text: '# Apple Privacy Policy V2\n[UPDATED] Apple Intelligence introduced with on-device processing as the default.\n[UPDATED] Private Cloud Compute (PCC) architecture handles server-side AI with end-to-end encryption and no data retention.\n[UPDATED] No user data is used for foundation model training.\nDifferential privacy and on-device processing remain core principles.', hash: 'apple-privacy-v2', date: '2026-01-15T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Apple Intelligence introduced with on-device processing as the default.\n+ Private Cloud Compute (PCC) handles server-side AI with end-to-end encryption.\n+ No data retention on PCC servers after processing completes.\n+ Foundation model training excludes all user data.',
      aiSummaryEn: 'Apple introduced Apple Intelligence with a privacy-first architecture. On-device processing remains the default, and a new Private Cloud Compute system handles server-side AI requests with end-to-end encryption and zero data retention. No user data is used for training foundation models.',
      aiSummaryIt: 'Apple ha introdotto Apple Intelligence con un\'architettura incentrata sulla privacy. L\'elaborazione on-device rimane l\'impostazione predefinita e un nuovo sistema Private Cloud Compute gestisce le richieste IA lato server con crittografia end-to-end e nessuna conservazione dei dati. Nessun dato utente viene utilizzato per l\'addestramento dei modelli fondazionali.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Review Apple Intelligence Settings', titleIt: 'Controlla Impostazioni Apple Intelligence', descriptionEn: 'Users can review and disable specific Apple Intelligence features in Settings > Apple Intelligence & Siri.', descriptionIt: 'Gli utenti possono controllare e disabilitare specifiche funzioni di Apple Intelligence in Impostazioni > Apple Intelligence e Siri.', actionUrl: 'https://support.apple.com/en-us/HT213408', actionTextEn: 'Privacy Settings Guide', actionTextIt: 'Guida Impostazioni Privacy' }],
      aiTrainingOptOut: 'Not applicable (no user data used)', aiDataScrapingRestricted: 'Fully restricted', aiIpLicensing: 'Protected', aiPromptRetention: 'None',
      date: '2026-01-15T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Apple\'s on-device processing and PCC architecture exceed GDPR data minimization requirements. No user data leaves the device unless explicitly required.', euIndIt: 'L\'elaborazione on-device e l\'architettura PCC di Apple superano i requisiti di minimizzazione dei dati del GDPR. Nessun dato utente lascia il dispositivo se non esplicitamente richiesto.', euIndRisk: 'Low',
        euEntEn: 'Enterprise deployments benefit from zero data retention on Apple servers, simplifying GDPR compliance and data processing agreements.', euEntIt: 'Le implementazioni aziendali beneficiano della zero data retention sui server Apple, semplificando la conformita al GDPR e gli accordi di trattamento dati.', euEntRisk: 'Low',
        usIndEn: 'Privacy-first approach provides strong protections even in the absence of comprehensive US federal privacy legislation.', usIndIt: 'L\'approccio privacy-first offre forti protezioni anche in assenza di una legislazione federale USA completa sulla privacy.', usIndRisk: 'Low',
        usEntEn: 'On-device processing minimizes enterprise data exposure and liability under state-level privacy regulations.', usEntIt: 'L\'elaborazione on-device minimizza l\'esposizione dei dati aziendali e la responsabilita ai sensi delle normative sulla privacy a livello statale.', usEntRisk: 'Low',
        glIndEn: 'Apple\'s privacy architecture sets a global industry benchmark for AI-powered features with minimal data collection.', glIndIt: 'L\'architettura privacy di Apple stabilisce un benchmark globale nel settore per le funzionalita basate sull\'IA con raccolta dati minima.', glIndRisk: 'Low',
        glEntEn: 'Multinational enterprises benefit from uniform privacy guarantees across all Apple platforms and jurisdictions.', glEntIt: 'Le imprese multinazionali beneficiano di garanzie di privacy uniformi su tutte le piattaforme e giurisdizioni Apple.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'None',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Apple Intelligence & Privacy - Global
  await seedPolicy(co['apple'].id, {
    name: 'Apple Intelligence & Privacy', type: 'ai', jurisdiction: 'Global',
    url: 'https://www.apple.com/apple-intelligence/',
    currentText: '# Apple Intelligence & Privacy V2\nExpanded Siri capabilities with third-party AI integration (ChatGPT). User consent required for each external AI call. No prompts stored by Apple.',
    currentHash: 'apple-ai-v2',
    snapshots: [
      { version: 1, text: '# Apple Intelligence & Privacy V1\nApple Intelligence launched with on-device processing.\nPrivate Cloud Compute (PCC) architecture processes complex requests with cryptographic guarantees.\nAll AI features can be individually disabled by the user.', hash: 'apple-ai-v1', date: '2025-06-09T10:00:00Z' },
      { version: 2, text: '# Apple Intelligence & Privacy V2\n[UPDATED] Expanded Siri capabilities with deeper contextual understanding.\n[UPDATED] Third-party AI integration (ChatGPT) available with explicit per-request user consent.\n[UPDATED] No prompts or context stored by Apple when routing to external AI providers.\nPCC architecture remains fully auditable by independent security researchers.', hash: 'apple-ai-v2', date: '2026-03-20T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Expanded Siri capabilities with deeper contextual understanding.\n+ Third-party AI integration (ChatGPT) with explicit per-request user consent.\n+ No prompts or context stored by Apple when routing to external AI providers.\n+ PCC architecture open to independent security researcher audits.',
      aiSummaryEn: 'Apple expanded Siri with third-party AI integration (ChatGPT), requiring explicit user consent for each external AI call. Apple does not store any prompts or context when routing to external providers. PCC remains independently auditable.',
      aiSummaryIt: 'Apple ha espanso Siri con l\'integrazione di IA di terze parti (ChatGPT), richiedendo il consenso esplicito dell\'utente per ogni chiamata IA esterna. Apple non conserva prompt o contesto quando instrada verso provider esterni. Il PCC rimane verificabile in modo indipendente.',
      overallRisk: 'Low', overallScore: 2,
      remediations: [{ titleEn: 'Manage Third-Party AI Access', titleIt: 'Gestisci Accesso IA Terze Parti', descriptionEn: 'Users can disable ChatGPT integration entirely in Settings > Apple Intelligence & Siri > ChatGPT. Each external AI call also requires individual confirmation.', descriptionIt: 'Gli utenti possono disabilitare completamente l\'integrazione ChatGPT in Impostazioni > Apple Intelligence e Siri > ChatGPT. Ogni chiamata IA esterna richiede anche una conferma individuale.', actionUrl: 'https://support.apple.com/en-us/HT213408', actionTextEn: 'Siri & AI Settings', actionTextIt: 'Impostazioni Siri e IA' }],
      aiTrainingOptOut: 'Not applicable (no data used for training)', aiDataScrapingRestricted: 'Fully restricted', aiIpLicensing: 'Protected', aiPromptRetention: 'None (no storage by Apple)',
      date: '2026-03-20T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Per-request consent for third-party AI exceeds GDPR requirements for informed consent. Users retain full control over external data sharing.', euIndIt: 'Il consenso per ogni richiesta all\'IA di terze parti supera i requisiti del GDPR per il consenso informato. Gli utenti mantengono il pieno controllo sulla condivisione esterna dei dati.', euIndRisk: 'Low',
        euEntEn: 'Enterprise MDM profiles can block third-party AI integrations entirely, ensuring no data leaves the Apple ecosystem.', euEntIt: 'I profili MDM aziendali possono bloccare completamente le integrazioni IA di terze parti, garantendo che nessun dato esca dall\'ecosistema Apple.', euEntRisk: 'Low',
        usIndEn: 'Granular consent mechanisms provide strong user protections for AI-powered features.', usIndIt: 'I meccanismi di consenso granulare offrono forti protezioni per gli utenti nelle funzionalita basate sull\'IA.', usIndRisk: 'Low',
        usEntEn: 'IT administrators can enforce AI restrictions via Apple Business Manager and MDM configurations.', usEntIt: 'Gli amministratori IT possono imporre restrizioni IA tramite Apple Business Manager e configurazioni MDM.', usEntRisk: 'Low',
        glIndEn: 'Apple\'s consent-per-request model establishes a global best practice for third-party AI data routing transparency.', glIndIt: 'Il modello di consenso per richiesta di Apple stabilisce una best practice globale per la trasparenza nell\'instradamento dei dati verso IA di terze parti.', glIndRisk: 'Low',
        glEntEn: 'Global enterprises benefit from consistent AI governance controls across all Apple deployments.', glEntIt: 'Le imprese globali beneficiano di controlli di governance IA coerenti in tutte le implementazioni Apple.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Minimal',
          kpiThirdPartySharing: 'None',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Restricted',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Published',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Committed',
          kpiConsentMechanism: 'Explicit Opt-In',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 24h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // =========================================================================
  // 14. TIKTOK
  // =========================================================================
  console.log('Seeding TikTok...');

  // TikTok Privacy Policy - EU
  await seedPolicy(co['tiktok'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
    url: 'https://www.tiktok.com/legal/privacy-policy-eea',
    currentText: '# TikTok Privacy Policy V2\nProject Clover: EU user data stored in Dublin and Norway data centers. Biometric data collected for age verification. Content recommendation algorithm feeds personalized advertising. Data shared with ByteDance subsidiaries for operational purposes.',
    currentHash: 'tiktok-privacy-v2',
    snapshots: [
      { version: 1, text: '# TikTok Privacy Policy V1\nTikTok collects usage data, device identifiers, and content interactions for content recommendations.\nData stored in Singapore and US data centers.\nThird-party advertising partners receive anonymized behavioral data.', hash: 'tiktok-privacy-v1', date: '2024-03-01T10:00:00Z' },
      { version: 2, text: '# TikTok Privacy Policy V2\n[UPDATED] Project Clover: EU user data migrated to dedicated data centers in Dublin, Ireland and Hamar, Norway.\n[UPDATED] Biometric data (facial geometry) collected for age verification and content safety purposes.\n[UPDATED] Content recommendation algorithm directly feeds personalized advertising pipeline.\n[UPDATED] Data shared with ByteDance subsidiaries for platform operations, analytics, and service improvement.\nThird-party advertising partners continue to receive behavioral data.', hash: 'tiktok-privacy-v2', date: '2026-02-10T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Project Clover: EU data localization in Dublin and Norway data centers.\n+ Biometric data (facial geometry) collected for age verification.\n+ Content recommendation algorithm directly feeds personalized advertising.\n+ Data shared with ByteDance subsidiaries for operations and analytics.\n- Data stored in Singapore and US data centers.',
      aiSummaryEn: 'TikTok launched Project Clover for EU data localization but simultaneously expanded biometric data collection for age verification. The content recommendation algorithm now directly feeds personalized advertising. Data sharing with ByteDance subsidiaries remains broad and includes analytics and platform operations.',
      aiSummaryIt: 'TikTok ha lanciato il Progetto Clover per la localizzazione dei dati UE ma ha contemporaneamente ampliato la raccolta di dati biometrici per la verifica dell\'eta. L\'algoritmo di raccomandazione dei contenuti ora alimenta direttamente la pubblicita personalizzata. La condivisione dei dati con le sussidiarie di ByteDance rimane ampia e include analisi e operazioni della piattaforma.',
      overallRisk: 'High', overallScore: 8,
      remediations: [
        { titleEn: 'Disable Personalized Ads', titleIt: 'Disattiva Pubblicita Personalizzata', descriptionEn: 'Go to Settings > Privacy > Ads Personalization to limit how your data feeds the advertising algorithm.', descriptionIt: 'Vai in Impostazioni > Privacy > Personalizzazione Annunci per limitare l\'uso dei tuoi dati nell\'algoritmo pubblicitario.', actionUrl: 'https://www.tiktok.com/setting', actionTextEn: 'Privacy Settings', actionTextIt: 'Impostazioni Privacy' },
        { titleEn: 'Request Data Deletion', titleIt: 'Richiedi Cancellazione Dati', descriptionEn: 'Submit a GDPR data deletion request through the in-app privacy center or via email to privacy@tiktok.com.', descriptionIt: 'Invia una richiesta di cancellazione dati GDPR tramite il centro privacy nell\'app o via email a privacy@tiktok.com.', actionUrl: 'https://www.tiktok.com/legal/report/privacy', actionTextEn: 'Privacy Request Form', actionTextIt: 'Modulo Richiesta Privacy' },
      ],
      aiTrainingOptOut: 'Not available', aiDataScrapingRestricted: 'Not restricted', aiIpLicensing: 'Broad license to TikTok', aiPromptRetention: 'Indefinite',
      date: '2026-02-10T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Despite Project Clover data localization, biometric collection and ByteDance data sharing raise serious GDPR compliance concerns. Users have limited visibility into cross-border data flows.', euIndIt: 'Nonostante la localizzazione dei dati del Progetto Clover, la raccolta biometrica e la condivisione dati con ByteDance sollevano serie preoccupazioni di conformita al GDPR. Gli utenti hanno visibilita limitata sui flussi di dati transfrontalieri.', euIndRisk: 'High',
        euEntEn: 'Enterprises should prohibit TikTok on corporate devices due to uncontrolled data sharing with ByteDance subsidiaries and opaque data processing practices.', euEntIt: 'Le aziende dovrebbero vietare TikTok sui dispositivi aziendali a causa della condivisione incontrollata dei dati con le sussidiarie di ByteDance e pratiche opache di trattamento dati.', euEntRisk: 'High',
        usIndEn: 'Data flows to ByteDance subsidiaries raise national security concerns. Users have no effective control over how recommendation data trains the algorithm.', usIndIt: 'I flussi di dati verso le sussidiarie di ByteDance sollevano preoccupazioni di sicurezza nazionale. Gli utenti non hanno alcun controllo effettivo su come i dati di raccomandazione addestrano l\'algoritmo.', usIndRisk: 'High',
        usEntEn: 'US enterprises face regulatory and reputational risk from TikTok usage due to ongoing legislative scrutiny and potential bans.', usEntIt: 'Le aziende USA affrontano rischi normativi e reputazionali dall\'uso di TikTok a causa del continuo controllo legislativo e potenziali divieti.', usEntRisk: 'High',
        glIndEn: 'Opaque algorithmic content recommendations and broad data sharing with ByteDance raise global privacy and manipulation concerns.', glIndIt: 'Le raccomandazioni algoritmiche opache dei contenuti e l\'ampia condivisione dati con ByteDance sollevano preoccupazioni globali su privacy e manipolazione.', glIndRisk: 'High',
        glEntEn: 'Multinational enterprises should assess TikTok data exposure risks under each jurisdiction\'s privacy framework before corporate use.', glEntIt: 'Le imprese multinazionali dovrebbero valutare i rischi di esposizione dati di TikTok in base al quadro normativo sulla privacy di ciascuna giurisdizione prima dell\'uso aziendale.', glEntRisk: 'High',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // TikTok Community Guidelines - Global
  await seedPolicy(co['tiktok'].id, {
    name: 'Community Guidelines', type: 'terms', jurisdiction: 'Global',
    url: 'https://www.tiktok.com/community-guidelines',
    currentText: '# TikTok Community Guidelines V2\nExpanded AI labeling requirements for synthetic media. Automated content removal for policy violations. Limited appeal mechanism for removed content. Government takedown request disclosures published quarterly.',
    currentHash: 'tiktok-guidelines-v2',
    snapshots: [
      { version: 1, text: '# TikTok Community Guidelines V1\nContent moderation policies enforced through combination of automated systems and human review.\nAI-generated content must be labeled using the AI Content label feature.\nAppeal process available for content removal decisions.', hash: 'tiktok-guidelines-v1', date: '2024-09-15T10:00:00Z' },
      { version: 2, text: '# TikTok Community Guidelines V2\n[UPDATED] Expanded AI labeling requirements: all synthetic or AI-manipulated media must be disclosed.\n[UPDATED] Automated content removal systems now handle majority of policy violations without human review.\n[UPDATED] Appeal mechanism limited to one appeal per removal with 48-hour response window.\n[UPDATED] Government takedown request disclosures published in quarterly transparency reports.\nContent promoting dangerous challenges, misinformation, and hate speech remains prohibited.', hash: 'tiktok-guidelines-v2', date: '2026-04-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ All synthetic or AI-manipulated media must be labeled and disclosed.\n+ Automated content removal handles majority of violations without human review.\n+ Appeal mechanism limited to one appeal per removal with 48-hour window.\n+ Government takedown requests disclosed in quarterly transparency reports.\n- Full appeal process available for content removal decisions.',
      aiSummaryEn: 'TikTok expanded AI content labeling requirements and increased automated content removal. The appeal mechanism has been restricted to a single appeal per removal with a 48-hour response window. Government takedown requests are now disclosed quarterly, though the level of detail remains limited.',
      aiSummaryIt: 'TikTok ha ampliato i requisiti di etichettatura dei contenuti IA e aumentato la rimozione automatica dei contenuti. Il meccanismo di ricorso e stato limitato a un singolo appello per rimozione con una finestra di risposta di 48 ore. Le richieste di rimozione governative vengono ora divulgate trimestralmente, sebbene il livello di dettaglio rimanga limitato.',
      overallRisk: 'Medium', overallScore: 5,
      remediations: [
        { titleEn: 'Label AI Content Properly', titleIt: 'Etichetta Correttamente i Contenuti IA', descriptionEn: 'Always use the AI Content disclosure label when posting synthetic or AI-manipulated media to avoid automatic removal.', descriptionIt: 'Utilizza sempre l\'etichetta di divulgazione Contenuti IA quando pubblichi media sintetici o manipolati dall\'IA per evitare la rimozione automatica.' },
        { titleEn: 'Review Transparency Reports', titleIt: 'Consulta i Report di Trasparenza', descriptionEn: 'Check TikTok\'s quarterly transparency reports to understand government takedown patterns in your region.', descriptionIt: 'Consulta i report di trasparenza trimestrali di TikTok per comprendere i modelli di rimozione governativa nella tua regione.', actionUrl: 'https://www.tiktok.com/transparency', actionTextEn: 'Transparency Center', actionTextIt: 'Centro Trasparenza' },
      ],
      aiTrainingOptOut: 'Not available', aiDataScrapingRestricted: 'Not restricted', aiIpLicensing: 'Broad license to TikTok', aiPromptRetention: 'Not specified',
      date: '2026-04-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Automated content removal without human review raises concerns under the EU Digital Services Act which requires meaningful appeal mechanisms.', euIndIt: 'La rimozione automatica dei contenuti senza revisione umana solleva preoccupazioni ai sensi del Digital Services Act UE che richiede meccanismi di ricorso significativi.', euIndRisk: 'Medium',
        euEntEn: 'Businesses using TikTok for marketing face unpredictable automated content removal that may impact campaign performance.', euEntIt: 'Le aziende che usano TikTok per il marketing affrontano una rimozione automatica imprevedibile dei contenuti che puo influire sulle prestazioni delle campagne.', euEntRisk: 'Medium',
        usIndEn: 'Limited appeal mechanisms reduce user recourse for wrongful content removal. First Amendment concerns around government takedown requests.', usIndIt: 'I meccanismi di ricorso limitati riducono le possibilita degli utenti per rimozioni erronee. Preoccupazioni sul Primo Emendamento riguardo alle richieste di rimozione governative.', usIndRisk: 'Medium',
        usEntEn: 'Brands should diversify social media strategies to mitigate risk of automated content removal disrupting marketing efforts.', usEntIt: 'I brand dovrebbero diversificare le strategie social per mitigare il rischio di rimozione automatica dei contenuti che interrompe gli sforzi di marketing.', usEntRisk: 'Medium',
        glIndEn: 'Opaque automated moderation disproportionately affects creators in regions with less TikTok policy advocacy and limited local language support.', glIndIt: 'La moderazione automatica opaca colpisce in modo sproporzionato i creatori nelle regioni con meno rappresentanza nelle politiche TikTok e supporto linguistico locale limitato.', glIndRisk: 'Medium',
        glEntEn: 'Global enterprises must account for inconsistent content moderation standards across TikTok\'s regional deployments.', glEntIt: 'Le imprese globali devono tenere conto di standard di moderazione dei contenuti incoerenti nelle diverse implementazioni regionali di TikTok.', glEntRisk: 'Medium',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'Partial',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Partial',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // =========================================================================
  // 15. ZOOM
  // =========================================================================
  console.log('Seeding Zoom...');

  // Zoom Privacy Statement - Global
  await seedPolicy(co['zoom'].id, {
    name: 'Privacy Statement', type: 'privacy', jurisdiction: 'Global',
    url: 'https://explore.zoom.us/en/privacy/',
    currentText: '# Zoom Privacy Statement V2\nAI Companion features collect meeting transcripts for real-time summarization.\nOpt-out available per meeting via host controls.\nData shared with third-party AI providers only with explicit admin consent.\nAttention tracking feature permanently removed.',
    currentHash: 'zoom-privacy-v2',
    snapshots: [
      { version: 1, text: '# Zoom Privacy Statement V1\nVideo meeting data collected for service delivery and quality improvement.\nRecording transcription available as opt-in feature.\nAttention tracking feature available for hosts.\nData retained for duration of account plus 30 days.', hash: 'zoom-privacy-v1', date: '2024-03-15T10:00:00Z' },
      { version: 2, text: '# Zoom Privacy Statement V2\n[UPDATED] AI Companion features added for meeting summarization and smart recap.\n[UPDATED] Meeting transcripts processed by AI models for real-time summarization.\n[UPDATED] Opt-out available per meeting via host controls and admin dashboard.\n[UPDATED] Data shared with third-party AI providers only with explicit admin consent.\nAttention tracking feature permanently removed.\nData retained for duration of account plus 30 days.', hash: 'zoom-privacy-v2', date: '2026-01-20T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ AI Companion features added for meeting summarization and smart recap.\n+ Meeting transcripts processed by AI models for real-time summarization.\n+ Opt-out available per meeting via host controls and admin dashboard.\n+ Data shared with third-party AI providers only with explicit admin consent.\n- Attention tracking feature available for hosts.',
      aiSummaryEn: 'Zoom introduced AI Companion features that process meeting transcripts for summarization. After significant public backlash in 2023 over AI training terms, Zoom now provides per-meeting opt-out and requires explicit admin consent for third-party AI data sharing. Attention tracking was permanently removed.',
      aiSummaryIt: 'Zoom ha introdotto le funzionalita AI Companion che elaborano le trascrizioni delle riunioni per la sintesi. Dopo le forti critiche pubbliche nel 2023 sui termini di addestramento AI, Zoom ora fornisce l\'opt-out per singola riunione e richiede il consenso esplicito dell\'amministratore per la condivisione dati con provider AI di terze parti. Il tracciamento dell\'attenzione e stato rimosso permanentemente.',
      overallRisk: 'Medium', overallScore: 6,
      remediations: [
        { titleEn: 'Disable AI Companion', titleIt: 'Disattiva AI Companion', descriptionEn: 'Administrators can disable AI Companion features globally via the admin dashboard under AI Settings.', descriptionIt: 'Gli amministratori possono disattivare le funzionalita AI Companion globalmente tramite la dashboard admin nelle Impostazioni AI.', actionUrl: 'https://explore.zoom.us/en/ai-assistant/', actionTextEn: 'AI Settings', actionTextIt: 'Impostazioni AI' },
        { titleEn: 'Review Third-Party Sharing', titleIt: 'Controlla Condivisione Terze Parti', descriptionEn: 'Check and revoke third-party AI provider consents in the Data Privacy section of account settings.', descriptionIt: 'Controlla e revoca i consensi ai provider AI di terze parti nella sezione Privacy Dati delle impostazioni account.' },
      ],
      aiTrainingOptOut: 'Per-meeting opt-out available', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Customer owned', aiPromptRetention: 'Duration of account',
      date: '2026-01-20T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'GDPR requires clear consent for AI processing of meeting data. Per-meeting opt-out partially satisfies requirements, but default-on processing raises concerns.', euIndIt: 'Il GDPR richiede un consenso chiaro per l\'elaborazione AI dei dati delle riunioni. L\'opt-out per riunione soddisfa parzialmente i requisiti, ma l\'elaborazione attiva di default solleva preoccupazioni.', euIndRisk: 'Medium',
        euEntEn: 'Enterprise admins can centrally disable AI features. GDPR-compliant data processing agreements available for Business and Enterprise plans.', euEntIt: 'Gli amministratori enterprise possono disattivare centralmente le funzionalita AI. Accordi di trattamento dati conformi al GDPR disponibili per i piani Business ed Enterprise.', euEntRisk: 'Low',
        usIndEn: 'AI Companion processes meeting content by default. Users should verify opt-out settings per meeting to protect sensitive discussions.', usIndIt: 'AI Companion elabora il contenuto delle riunioni di default. Gli utenti dovrebbero verificare le impostazioni di opt-out per riunione per proteggere le discussioni sensibili.', usIndRisk: 'Medium',
        usEntEn: 'Enterprise plans offer granular AI controls. Admin-level consent required before data flows to third-party AI providers.', usEntIt: 'I piani Enterprise offrono controlli AI granulari. Il consenso a livello amministratore e richiesto prima che i dati vengano inviati ai provider AI di terze parti.', usEntRisk: 'Low',
        glIndEn: 'AI features process data in regional data centers. Opt-out controls available globally but require per-meeting action.', glIndIt: 'Le funzionalita AI elaborano i dati nei data center regionali. I controlli di opt-out sono disponibili globalmente ma richiedono un\'azione per ogni riunione.', glIndRisk: 'Medium',
        glEntEn: 'Data residency options available for enterprise customers. Third-party AI sharing requires explicit cross-border transfer consent.', glEntIt: 'Opzioni di residenza dati disponibili per i clienti enterprise. La condivisione AI con terze parti richiede il consenso esplicito per il trasferimento transfrontaliero.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // Zoom Terms of Service - Global
  await seedPolicy(co['zoom'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'Global',
    url: 'https://explore.zoom.us/en/terms/',
    currentText: '# Zoom Terms of Service V2\nCustomer content explicitly excluded from model training.\nAI Companion features require admin opt-in for Enterprise plans.\nFree-tier data may contribute to model improvement with user consent.',
    currentHash: 'zoom-tos-v2',
    snapshots: [
      { version: 1, text: '# Zoom Terms of Service V1\nStandard SaaS terms for video communications platform.\nData ownership remains with the customer.\nZoom may use aggregated, anonymized data for service improvement.\nCustomer responsible for compliance with recording consent laws.', hash: 'zoom-tos-v1', date: '2024-06-01T10:00:00Z' },
      { version: 2, text: '# Zoom Terms of Service V2\n[UPDATED] Customer content explicitly excluded from AI model training.\n[UPDATED] AI Companion features require admin opt-in for Enterprise and Business plans.\n[UPDATED] Free-tier data may contribute to model improvement with user consent notification.\nData ownership remains with the customer.\nCustomer responsible for compliance with recording consent laws.', hash: 'zoom-tos-v2', date: '2026-03-10T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Customer content explicitly excluded from AI model training.\n+ AI Companion features require admin opt-in for Enterprise and Business plans.\n+ Free-tier data may contribute to model improvement with user consent notification.\n- Zoom may use aggregated, anonymized data for service improvement.',
      aiSummaryEn: 'Following the 2023 backlash, Zoom updated its terms to explicitly exclude customer content from AI model training. Enterprise plans now require admin opt-in for AI features. Free-tier users receive consent notifications before data contributes to model improvement.',
      aiSummaryIt: 'A seguito delle critiche del 2023, Zoom ha aggiornato i termini per escludere esplicitamente il contenuto dei clienti dall\'addestramento dei modelli AI. I piani Enterprise ora richiedono l\'opt-in dell\'amministratore per le funzionalita AI. Gli utenti del piano gratuito ricevono notifiche di consenso prima che i dati contribuiscano al miglioramento dei modelli.',
      overallRisk: 'Low', overallScore: 3,
      remediations: [
        { titleEn: 'Verify AI Opt-In Status', titleIt: 'Verifica Stato Opt-In AI', descriptionEn: 'Enterprise administrators should verify AI Companion opt-in status in the admin console under Account Settings > AI Features.', descriptionIt: 'Gli amministratori Enterprise dovrebbero verificare lo stato di opt-in di AI Companion nella console admin in Impostazioni Account > Funzionalita AI.', actionUrl: 'https://explore.zoom.us/en/terms/', actionTextEn: 'View Terms', actionTextIt: 'Vedi Termini' },
      ],
      aiTrainingOptOut: 'Explicit exclusion for paid tiers', aiDataScrapingRestricted: 'Restricted', aiIpLicensing: 'Customer owned', aiPromptRetention: 'Session duration',
      date: '2026-03-10T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Explicit exclusion from AI training aligns with GDPR data minimization principles. Free-tier consent notification meets transparency requirements.', euIndIt: 'L\'esclusione esplicita dall\'addestramento AI e in linea con i principi di minimizzazione dati del GDPR. La notifica di consenso del piano gratuito soddisfa i requisiti di trasparenza.', euIndRisk: 'Low',
        euEntEn: 'Admin opt-in requirement provides strong data governance controls. Enterprise data fully protected from AI training pipelines.', euEntIt: 'Il requisito di opt-in dell\'amministratore fornisce forti controlli di governance dei dati. I dati Enterprise completamente protetti dalle pipeline di addestramento AI.', euEntRisk: 'Low',
        usIndEn: 'Clear separation between paid and free-tier AI data usage. Users on free plans should review consent notifications carefully.', usIndIt: 'Chiara separazione tra utilizzo dati AI per piani a pagamento e gratuiti. Gli utenti dei piani gratuiti dovrebbero esaminare attentamente le notifiche di consenso.', usIndRisk: 'Low',
        usEntEn: 'Enterprise terms provide contractual guarantees against AI training, satisfying corporate data protection requirements.', usEntIt: 'I termini Enterprise forniscono garanzie contrattuali contro l\'addestramento AI, soddisfacendo i requisiti aziendali di protezione dati.', usEntRisk: 'Low',
        glIndEn: 'Global consistency in AI exclusion terms. Free-tier users in all regions receive identical consent mechanisms.', glIndIt: 'Coerenza globale nei termini di esclusione AI. Gli utenti del piano gratuito in tutte le regioni ricevono meccanismi di consenso identici.', glIndRisk: 'Low',
        glEntEn: 'Multinational enterprises benefit from uniform AI data governance across all Zoom deployment regions.', glEntIt: 'Le imprese multinazionali beneficiano di una governance dati AI uniforme in tutte le regioni di distribuzione Zoom.', glEntRisk: 'Low',
      }),
        kpis: {
          kpiDataCollection: 'Moderate',
          kpiThirdPartySharing: 'Limited',
          kpiDataRetention: 'Defined',
          kpiRightToDeletion: 'Full',
          kpiCrossBorderTransfer: 'Controlled',
          kpiAiTrainingOptOut: 'Available',
          kpiAiOutputOwnership: 'User Retained',
          kpiAlgoTransparency: 'Partial',
          kpiAutomatedDecision: 'Disclosed',
          kpiAiBiasFairness: 'Mentioned',
          kpiConsentMechanism: 'Opt-Out',
          kpiRegulatoryCompliance: 'Comprehensive',
          kpiBreachNotification: 'Within 72h',
          kpiIndependentAudit: 'Certified',
          kpiContentModeration: 'Transparent'
        },
    }],
  });

  // =========================================================================
  // 16. X (TWITTER)
  // =========================================================================
  console.log('Seeding X (Twitter)...');

  // X Privacy Policy - Global
  await seedPolicy(co['x-twitter'].id, {
    name: 'Privacy Policy', type: 'privacy', jurisdiction: 'Global',
    url: 'https://x.com/en/privacy',
    currentText: '# X Privacy Policy V2\nAll public posts used by default to train Grok AI models.\nDMs excluded from training but metadata analyzed for safety and recommendations.\nBiometric data collected for identity verification (Verified accounts).\nData shared with xAI Corp for model training.\nOpt-out available in Settings > Privacy > Grok but not prominently surfaced.',
    currentHash: 'x-privacy-v2',
    snapshots: [
      { version: 1, text: '# X Privacy Policy V1\nStandard social media data collection for personalized content and advertising.\nUser posts, interactions, and device data collected.\nPersonalized ads based on user activity and interests.\nData shared with advertising partners in anonymized form.\nUsers can control ad personalization in Privacy settings.', hash: 'x-privacy-v1', date: '2024-01-10T10:00:00Z' },
      { version: 2, text: '# X Privacy Policy V2\n[UPDATED] All public posts, replies, and media used by default to train Grok AI and other xAI models.\n[UPDATED] Direct messages excluded from AI training but metadata (timestamps, participants, frequency) analyzed for safety and recommendation algorithms.\n[UPDATED] Biometric data including facial geometry collected for identity verification on Verified accounts.\n[UPDATED] Data shared with xAI Corp as affiliated entity for model training and development.\n[UPDATED] Opt-out available in Settings > Privacy and Safety > Grok data sharing, but not prominently surfaced in UI.\nPersonalized ads based on user activity, interests, and AI-inferred preferences.', hash: 'x-privacy-v2', date: '2026-03-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ All public posts, replies, and media used by default to train Grok AI and other xAI models.\n+ Direct messages excluded from AI training but metadata analyzed for safety and recommendations.\n+ Biometric data including facial geometry collected for identity verification.\n+ Data shared with xAI Corp as affiliated entity for model training.\n+ Opt-out buried in Settings > Privacy and Safety > Grok data sharing.\n- Data shared with advertising partners in anonymized form.',
      aiSummaryEn: 'X dramatically expanded its data collection to fuel Grok AI training. All public posts are now used by default for model training, with opt-out controls buried deep in settings. Biometric data collection was introduced for identity verification. Data flows freely to xAI Corp, raising major privacy concerns across jurisdictions.',
      aiSummaryIt: 'X ha ampliato drasticamente la raccolta dati per alimentare l\'addestramento di Grok AI. Tutti i post pubblici sono ora utilizzati di default per l\'addestramento dei modelli, con i controlli di opt-out nascosti nelle impostazioni. E stata introdotta la raccolta di dati biometrici per la verifica dell\'identita. I dati fluiscono liberamente verso xAI Corp, sollevando gravi preoccupazioni sulla privacy in tutte le giurisdizioni.',
      overallRisk: 'High', overallScore: 8,
      remediations: [
        { titleEn: 'Disable Grok Data Sharing', titleIt: 'Disattiva Condivisione Dati Grok', descriptionEn: 'Navigate to Settings > Privacy and Safety > Grok and disable "Allow your posts to be used for Grok training". This must be done manually for each account.', descriptionIt: 'Naviga in Impostazioni > Privacy e Sicurezza > Grok e disattiva "Consenti l\'uso dei tuoi post per l\'addestramento di Grok". Questa operazione deve essere eseguita manualmente per ogni account.', actionUrl: 'https://x.com/settings/privacy_and_safety', actionTextEn: 'Privacy Settings', actionTextIt: 'Impostazioni Privacy' },
        { titleEn: 'Review Biometric Data Consent', titleIt: 'Controlla Consenso Dati Biometrici', descriptionEn: 'Verified users should review biometric data collection terms and consider implications under local biometric privacy laws (e.g., BIPA in Illinois).', descriptionIt: 'Gli utenti Verificati dovrebbero esaminare i termini di raccolta dati biometrici e considerare le implicazioni delle leggi locali sulla privacy biometrica (es. BIPA in Illinois).' },
      ],
      aiTrainingOptOut: 'Opt-out buried in settings', aiDataScrapingRestricted: 'Unrestricted for public content', aiIpLicensing: 'Broad license to xAI', aiPromptRetention: 'Indefinite',
      date: '2026-03-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Default AI training on public posts likely violates GDPR legitimate interest requirements. Buried opt-out fails transparency obligations under Article 13. Biometric data collection triggers Article 9 special category protections.', euIndIt: 'L\'addestramento AI predefinito sui post pubblici probabilmente viola i requisiti di interesse legittimo del GDPR. L\'opt-out nascosto non soddisfa gli obblighi di trasparenza dell\'Articolo 13. La raccolta di dati biometrici attiva le protezioni delle categorie speciali dell\'Articolo 9.', euIndRisk: 'High',
        euEntEn: 'Enterprises using X for corporate communications face uncontrolled data exposure to xAI training. No enterprise-grade data protection controls available.', euEntIt: 'Le imprese che usano X per le comunicazioni aziendali affrontano un\'esposizione incontrollata dei dati all\'addestramento xAI. Nessun controllo di protezione dati di livello enterprise disponibile.', euEntRisk: 'High',
        usIndEn: 'Biometric data collection may violate Illinois BIPA and Texas CUBI. Default-on AI training has no federal opt-out protections. Users have limited recourse under current US privacy framework.', usIndIt: 'La raccolta di dati biometrici potrebbe violare l\'Illinois BIPA e il Texas CUBI. L\'addestramento AI attivo di default non ha protezioni federali di opt-out. Gli utenti hanno ricorsi limitati nell\'attuale quadro normativo USA sulla privacy.', usIndRisk: 'High',
        usEntEn: 'Corporate accounts lack admin-level controls for AI data sharing. Employee posts on company accounts become xAI training data by default.', usEntIt: 'Gli account aziendali non dispongono di controlli a livello amministratore per la condivisione dati AI. I post dei dipendenti sugli account aziendali diventano dati di addestramento xAI di default.', usEntRisk: 'High',
        glIndEn: 'Global users face uniform default-on AI training with no regional data residency guarantees. Opt-out mechanisms are identical regardless of local privacy laws.', glIndIt: 'Gli utenti globali affrontano un addestramento AI attivo di default uniforme senza garanzie regionali di residenza dati. I meccanismi di opt-out sono identici indipendentemente dalle leggi locali sulla privacy.', glIndRisk: 'High',
        glEntEn: 'No enterprise tier or data protection addendum available. Organizations cannot contractually prevent AI training on their public content.', glEntIt: 'Nessun livello enterprise o addendum di protezione dati disponibile. Le organizzazioni non possono impedire contrattualmente l\'addestramento AI sui loro contenuti pubblici.', glEntRisk: 'High',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'None',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Minimal',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  // X Terms of Service - Global
  await seedPolicy(co['x-twitter'].id, {
    name: 'Terms of Service', type: 'terms', jurisdiction: 'Global',
    url: 'https://x.com/en/tos',
    currentText: '# X Terms of Service V2\nExpanded content license covers AI training and derivative works.\nUser-generated content can be used to train any xAI model without additional compensation.\nLimited recourse for content misuse.\nIndemnification clause expanded to cover AI-generated outputs derived from user content.',
    currentHash: 'x-tos-v2',
    snapshots: [
      { version: 1, text: '# X Terms of Service V1\nStandard social media terms of service.\nContent license grants X a worldwide, non-exclusive, royalty-free license to use, display, and distribute user content.\nUsers retain ownership of their content.\nX may remove content that violates platform rules.\nDispute resolution via arbitration.', hash: 'x-tos-v1', date: '2024-06-15T10:00:00Z' },
      { version: 2, text: '# X Terms of Service V2\n[UPDATED] Content license expanded to include AI training, model development, and creation of derivative works by X and affiliated entities including xAI Corp.\n[UPDATED] User-generated content (text, images, video) can be used to train any current or future xAI model without additional notice or compensation.\n[UPDATED] Limited recourse for content misuse: disputes resolved exclusively via arbitration with class action waiver.\n[UPDATED] Indemnification clause expanded: users indemnify X and xAI for claims arising from AI-generated outputs derived from user content.\nUsers retain nominal ownership of their content.\nDispute resolution via binding arbitration with class action waiver.', hash: 'x-tos-v2', date: '2026-05-01T10:00:00Z' },
    ],
    changes: [{
      oldSnapIdx: 0, newSnapIdx: 1,
      diff: '+ Content license expanded to include AI training, model development, and derivative works by xAI Corp.\n+ User-generated content usable for any current or future xAI model without compensation.\n+ Limited recourse: arbitration-only dispute resolution with class action waiver.\n+ Indemnification expanded to cover AI-generated outputs derived from user content.\n- Content license grants X a worldwide, non-exclusive, royalty-free license to use, display, and distribute.\n- Users retain ownership of their content.',
      aiSummaryEn: 'X dramatically expanded its content license to cover AI training and derivative works across all xAI models. Users now grant perpetual rights for their content to train AI without compensation or meaningful recourse. The indemnification clause makes users liable for AI outputs derived from their content, creating an unprecedented transfer of risk to users.',
      aiSummaryIt: 'X ha ampliato drasticamente la licenza sui contenuti per coprire l\'addestramento AI e le opere derivate su tutti i modelli xAI. Gli utenti ora concedono diritti perpetui per l\'addestramento AI dei loro contenuti senza compenso o ricorso significativo. La clausola di indennizzo rende gli utenti responsabili per gli output AI derivati dai loro contenuti, creando un trasferimento di rischio senza precedenti verso gli utenti.',
      overallRisk: 'High', overallScore: 9,
      remediations: [
        { titleEn: 'Delete Sensitive Content', titleIt: 'Elimina Contenuti Sensibili', descriptionEn: 'Remove any sensitive or proprietary content from your X account. Note that content already ingested for AI training may not be retroactively removed from models.', descriptionIt: 'Rimuovi qualsiasi contenuto sensibile o proprietario dal tuo account X. Nota che i contenuti gia acquisiti per l\'addestramento AI potrebbero non essere rimossi retroattivamente dai modelli.', actionUrl: 'https://x.com/settings/account', actionTextEn: 'Account Settings', actionTextIt: 'Impostazioni Account' },
        { titleEn: 'Consider Platform Alternatives', titleIt: 'Considera Alternative alla Piattaforma', descriptionEn: 'Organizations should evaluate whether the expanded AI license terms are compatible with their IP protection policies and consider migrating corporate communications to platforms with stronger content protections.', descriptionIt: 'Le organizzazioni dovrebbero valutare se i termini ampliati della licenza AI sono compatibili con le loro politiche di protezione della proprieta intellettuale e considerare la migrazione delle comunicazioni aziendali verso piattaforme con protezioni dei contenuti piu forti.' },
      ],
      aiTrainingOptOut: 'Not available', aiDataScrapingRestricted: 'Unrestricted', aiIpLicensing: 'Perpetual broad license to xAI', aiPromptRetention: 'Indefinite',
      date: '2026-05-01T12:00:00Z',
      regionImpacts: makeStandardImpacts({
        euIndEn: 'Expanded content license may conflict with EU copyright directive and moral rights protections. Indemnification for AI outputs raises consumer protection concerns under Unfair Contract Terms Directive.', euIndIt: 'La licenza sui contenuti ampliata potrebbe confliggere con la direttiva europea sul copyright e le protezioni dei diritti morali. L\'indennizzo per gli output AI solleva preoccupazioni di protezione dei consumatori ai sensi della Direttiva sulle clausole contrattuali abusive.', euIndRisk: 'High',
        euEntEn: 'Corporate content posted on X becomes AI training material with no enterprise protections. Companies risk uncontrolled IP exposure through employee social media activity.', euEntIt: 'I contenuti aziendali pubblicati su X diventano materiale di addestramento AI senza protezioni enterprise. Le aziende rischiano un\'esposizione incontrollata della proprieta intellettuale attraverso l\'attivita social dei dipendenti.', euEntRisk: 'High',
        usIndEn: 'Binding arbitration with class action waiver severely limits user legal recourse. Indemnification clause shifts AI liability from xAI to individual users in an unprecedented manner.', usIndIt: 'L\'arbitrato vincolante con rinuncia all\'azione collettiva limita gravemente il ricorso legale degli utenti. La clausola di indennizzo trasferisce la responsabilita AI da xAI agli utenti individuali in modo senza precedenti.', usIndRisk: 'High',
        usEntEn: 'No corporate data protection tier. Employee social media policies should explicitly address X content licensing to prevent inadvertent IP licensing to xAI.', usEntIt: 'Nessun livello di protezione dati aziendali. Le politiche aziendali sui social media dovrebbero affrontare esplicitamente la licenza sui contenuti X per prevenire la concessione involontaria di licenze IP a xAI.', usEntRisk: 'High',
        glIndEn: 'Uniform terms applied globally regardless of local consumer protection laws. Users in jurisdictions with weaker protections bear full risk of the expanded license.', glIndIt: 'Termini uniformi applicati globalmente indipendentemente dalle leggi locali di protezione dei consumatori. Gli utenti in giurisdizioni con protezioni piu deboli sopportano l\'intero rischio della licenza ampliata.', glIndRisk: 'High',
        glEntEn: 'Multinational organizations should prohibit sharing proprietary content on X. No contractual protections exist to limit AI training on corporate content.', glEntIt: 'Le organizzazioni multinazionali dovrebbero vietare la condivisione di contenuti proprietari su X. Non esistono protezioni contrattuali per limitare l\'addestramento AI sui contenuti aziendali.', glEntRisk: 'High',
      }),
        kpis: {
          kpiDataCollection: 'Extensive',
          kpiThirdPartySharing: 'Broad',
          kpiDataRetention: 'Indefinite',
          kpiRightToDeletion: 'None',
          kpiCrossBorderTransfer: 'Unrestricted',
          kpiAiTrainingOptOut: 'Not Available',
          kpiAiOutputOwnership: 'Company Claimed',
          kpiAlgoTransparency: 'Opaque',
          kpiAutomatedDecision: 'Undisclosed',
          kpiAiBiasFairness: 'Absent',
          kpiConsentMechanism: 'Implicit',
          kpiRegulatoryCompliance: 'Minimal',
          kpiBreachNotification: 'Unspecified',
          kpiIndependentAudit: 'None',
          kpiContentModeration: 'Opaque'
        },
    }],
  });

  console.log('Seed completed successfully for all 16 companies.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
