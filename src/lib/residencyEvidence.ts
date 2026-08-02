import { createHash } from 'node:crypto';
import { POLICYWATCHER_VERSION } from './release';

export type ResidencyEvidenceState = 'documented' | 'operator-declared' | 'configuration-dependent' | 'open';

export interface ResidencyEvidenceReference {
  id: string;
  title: string;
  href: string;
  publisher: string;
  reviewedAt: string;
  scope: string;
}
export interface ResidencyEvidenceRecord {
  id: string;
  service: string;
  role: 'hosting' | 'storage' | 'backup' | 'retrieval' | 'ai' | 'email';
  data: string;
  location: string;
  state: ResidencyEvidenceState;
  evidence: string;
  limitation: string;
  referenceIds: string[];
}

export const RESIDENCY_EVIDENCE_REVIEWED_AT = '2026-08-02' as const;
export const RESIDENCY_EVIDENCE_SCHEMA_VERSION = '1.0.0' as const;

const references: ResidencyEvidenceReference[] = [
  {
    id: 'hostinger-dpa',
    title: 'Hostinger Data Processing Addendum',
    href: 'https://www.hostinger.com/legal/dpa',
    publisher: 'Hostinger',
    reviewedAt: RESIDENCY_EVIDENCE_REVIEWED_AT,
    scope: 'Contractual processing terms, international-transfer terms and the provider subprocessor appendix.',
  },
  {
    id: 'hostinger-privacy',
    title: 'Hostinger Privacy Policy',
    href: 'https://www.hostinger.com/legal/privacy-policy',
    publisher: 'Hostinger',
    reviewedAt: RESIDENCY_EVIDENCE_REVIEWED_AT,
    scope: 'Provider-level location and international-transfer disclosures. It does not identify the active PolicyWatcher server region.',
  },
  {
    id: 'google-cloud-dpa',
    title: 'Google Cloud Data Processing Addendum',
    href: 'https://cloud.google.com/terms/data-processing-addendum',
    publisher: 'Google Cloud',
    reviewedAt: RESIDENCY_EVIDENCE_REVIEWED_AT,
    scope: 'Processing locations, transfers and subprocessor terms for covered Google Cloud services.',
  },
  {
    id: 'policywatcher-privacy',
    title: 'PolicyWatcher Privacy Policy',
    href: '/privacy',
    publisher: 'PolicyWatcher',
    reviewedAt: RESIDENCY_EVIDENCE_REVIEWED_AT,
    scope: 'Application-level processing purposes, data minimization, transfers and current storage-security boundaries.',
  },
];

const records: ResidencyEvidenceRecord[] = [
  {
    id: 'primary-application-hosting',
    service: 'Primary web application hosting',
    role: 'hosting',
    data: 'Application runtime, HTTP requests and hosting-level logs',
    location: 'Active deployment region must be confirmed from the current hosting control plane.',
    state: 'operator-declared',
    evidence: 'The repository identifies Hostinger as the deployment provider and supplies a dated provider DPA reference.',
    limitation: 'A provider contract or general data-center list does not prove the region selected for the running deployment.',
    referenceIds: ['hostinger-dpa', 'hostinger-privacy', 'policywatcher-privacy'],
  },
  {
    id: 'production-database',
    service: 'Production SQLite database',
    role: 'storage',
    data: 'Subscriber preferences, public-evidence records and protected operational records',
    location: 'Co-located with the configured application filesystem unless deployment evidence shows otherwise.',
    state: 'configuration-dependent',
    evidence: 'The application validates an absolute production database path and exposes only sanitized readiness state to authenticated operators.',
    limitation: 'The source tree cannot prove the physical volume region, encryption-at-rest control or current host configuration.',
    referenceIds: ['policywatcher-privacy', 'hostinger-dpa'],
  },
  {
    id: 'database-backups',
    service: 'Database backup copies',
    role: 'backup',
    data: 'Encrypted application export when an administrator explicitly creates one; provider backups remain provider-controlled',
    location: 'Not publicly verified.',
    state: 'open',
    evidence: 'PolicyWatcher includes administrator-only encrypted export and local verification tooling.',
    limitation: 'The application does not attest that provider backups exist, are current, encrypted, restorable or retained in a specific region.',
    referenceIds: ['policywatcher-privacy', 'hostinger-dpa'],
  },
  {
    id: 'renderer-vps',
    service: 'Optional browser renderer VPS',
    role: 'retrieval',
    data: 'Public official-source URLs and rendered public policy HTML',
    location: 'Deployment-controlled and not publicly verified.',
    state: 'configuration-dependent',
    evidence: 'The renderer is a separate bearer-protected service and is optional when direct retrieval succeeds.',
    limitation: 'The evidence pack does not infer VPS region, hosting provider or retention from application configuration.',
    referenceIds: ['policywatcher-privacy'],
  },
  {
    id: 'gemini-api',
    service: 'Google Gemini API',
    role: 'ai',
    data: 'Explicit assistant question text; Word clause text and browser-extension notice content are excluded from this path',
    location: 'May be processed outside the EEA under the applicable Google service terms.',
    state: 'documented',
    evidence: 'The public privacy policy names the assistant transfer and the provider DPA describes processing-location and transfer terms.',
    limitation: 'This register does not assert a selectable EU-only Gemini processing location for the configured API use.',
    referenceIds: ['google-cloud-dpa', 'policywatcher-privacy'],
  },
  {
    id: 'smtp-delivery',
    service: 'Configured SMTP delivery provider',
    role: 'email',
    data: 'Subscriber email address and requested alert content when email delivery is enabled',
    location: 'Depends on the deployment-selected SMTP provider and account configuration.',
    state: 'configuration-dependent',
    evidence: 'SMTP is deployment configured; no provider identity or region is hard-coded in the application contract.',
    limitation: 'A provider-specific DPA, subprocessor list, retention setting and transfer assessment require deployment evidence.',
    referenceIds: ['policywatcher-privacy'],
  },
];

function stableDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function getResidencyEvidencePack() {
  const evidence = {
    schemaVersion: RESIDENCY_EVIDENCE_SCHEMA_VERSION,
    release: POLICYWATCHER_VERSION,
    reviewedAt: RESIDENCY_EVIDENCE_REVIEWED_AT,
    status: 'bounded-evidence-register' as const,
    records,
    references,
    openActions: [
      'Attach a dated hosting control-plane record identifying the active application and database region.',
      'Attach current backup-region, retention, encryption and restore-test evidence.',
      'Record the configured SMTP provider, applicable DPA and transfer controls before asserting its processing location.',
      'Re-review provider DPA and subprocessor references after a provider or material service change.',
    ],
    boundary:
      'This pack distinguishes public documents, operator declarations, configuration-dependent facts and open evidence. It is not a DPA, transfer impact assessment, legal opinion, provider certification or proof of the live deployment region.',
  };

  return {
    ...evidence,
    digestAlgorithm: 'sha256' as const,
    digest: stableDigest(evidence),
  };
}
