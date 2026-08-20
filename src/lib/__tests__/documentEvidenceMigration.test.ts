import fs from 'node:fs';
import path from 'node:path';
import type { PolicyChange } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_EVIDENCE_DUAL_WRITE_ENV,
  isDocumentEvidenceDualWriteEnabled,
  legacyDocumentCanonicalKey,
  legacyEntityCanonicalKey,
  projectLegacyProvision,
} from '@/lib/documentEvidenceSync';

const root = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fixtureChange(overrides: Partial<PolicyChange> = {}): PolicyChange {
  return {
    id: 'change-1',
    policyId: 'policy-1',
    oldSnapshotId: 'snapshot-1',
    newSnapshotId: 'snapshot-2',
    diff: '[]',
    aiSummaryEn: 'Summary',
    aiSummaryIt: 'Sintesi',
    tldrEn: null,
    tldrIt: null,
    keyPointsJson: null,
    riskReasonsJson: null,
    overallRisk: 'Medium',
    overallScore: 5,
    remediationsJson: '[]',
    publicEvidence: true,
    publicPublishedAt: new Date('2026-08-19T10:00:00Z'),
    aiTrainingOptOut: 'Allowed',
    aiDataScrapingRestricted: 'Not specified',
    aiIpLicensing: 'Protected',
    aiPromptRetention: '30 days',
    kpiDataCollection: 'Not assessed',
    kpiThirdPartySharing: 'Not assessed',
    kpiDataRetention: '30 days',
    kpiRightToDeletion: 'Not assessed',
    kpiCrossBorderTransfer: 'Not assessed',
    kpiAiTrainingOptOut: 'Opt-out available',
    kpiAiOutputOwnership: 'Protected',
    kpiAlgoTransparency: 'Not assessed',
    kpiAutomatedDecision: 'Not assessed',
    kpiAiBiasFairness: 'Not assessed',
    kpiConsentMechanism: 'Not assessed',
    kpiRegulatoryCompliance: 'Not assessed',
    kpiBreachNotification: 'Not assessed',
    kpiIndependentAudit: 'Not assessed',
    kpiContentModeration: 'Not assessed',
    createdAt: new Date('2026-08-19T09:00:00Z'),
    ...overrides,
  };
}

describe('document evidence migration and dual-write contracts', () => {
  it('uses immutable legacy UUID bridges rather than mutable names or slugs', () => {
    expect(legacyEntityCanonicalKey('company-uuid')).toBe('legacy-company:company-uuid');
    expect(legacyDocumentCanonicalKey('policy-uuid')).toBe('legacy-policy:policy-uuid');
  });

  it('keeps production dual-write opt-in and exact', () => {
    expect(isDocumentEvidenceDualWriteEnabled({})).toBe(false);
    expect(isDocumentEvidenceDualWriteEnabled({ [DOCUMENT_EVIDENCE_DUAL_WRITE_ENV]: 'true' })).toBe(false);
    expect(isDocumentEvidenceDualWriteEnabled({ [DOCUMENT_EVIDENCE_DUAL_WRITE_ENV]: '1' })).toBe(true);
  });

  it('projects structured legacy evidence conservatively across the initial taxonomy', () => {
    const change = fixtureChange();
    expect(projectLegacyProvision(change, 'ai_training')).toMatchObject({
      assessment: 'conditional',
      evidenceText: 'Opt-out available',
      reviewStatus: 'published',
    });
    expect(projectLegacyProvision(change, 'data_sharing')).toMatchObject({
      assessment: 'unclear',
      evidenceText: 'Not specified',
    });
    expect(projectLegacyProvision(change, 'retention')).toMatchObject({
      assessment: 'present',
      evidenceText: '30 days',
    });
    expect(projectLegacyProvision(change, 'arbitration')).toMatchObject({
      assessment: 'not_assessed',
      evidenceText: null,
      sourceLocator: null,
    });
  });

  it('wires the transactional projection to every legacy evidence mutation boundary', () => {
    for (const file of [
      'src/lib/policyBaseline.ts',
      'src/lib/configuredPolicy.ts',
      'src/app/api/cron/check-all/route.ts',
      'src/app/api/scrape/route.ts',
      'src/app/api/admin/policies/route.ts',
      'src/app/api/admin/source-onboarding/[itemId]/route.ts',
    ]) {
      expect(source(file), file).toContain('dualWriteCanonicalPolicyGraph');
    }
    expect(source('src/lib/companyOnboardingService.ts')).toContain('dualWriteCanonicalEntity');
    expect(source('src/app/api/admin/companies/route.ts')).toContain(
      'deleteCanonicalEntityForLegacyCompany',
    );
  });

  it('exposes guarded backfill, reconciliation, and smoke commands', () => {
    const packageJson = JSON.parse(source('package.json')) as { scripts: Record<string, string> };
    expect(packageJson.scripts).toMatchObject({
      'db:document-evidence:backfill': 'tsx scripts/backfill-document-evidence.ts',
      'db:document-evidence:reconcile': 'tsx scripts/reconcile-document-evidence.ts',
      'db:document-evidence:smoke': 'tsx scripts/smoke-document-evidence-dual-write.ts',
    });
    expect(source('scripts/backfill-document-evidence.ts')).toContain(
      'POLICYWATCHER_DOCUMENT_EVIDENCE_BACKFILL_ACK',
    );
    expect(source('scripts/smoke-document-evidence-dual-write.ts')).toContain(
      'document_evidence_dual_write_assertion_failed',
    );
    for (const script of [
      'scripts/backfill-document-evidence.ts',
      'scripts/reconcile-document-evidence.ts',
      'scripts/smoke-document-evidence-dual-write.ts',
    ]) {
      expect(source(script), script).not.toContain('existsSync(absolutePath)');
      expect(source(script), script).toContain("flag: 'wx'");
    }
  });

  it('runs canonical backfill and dual-write inside the PostgreSQL CI rehearsal', () => {
    const workflow = source('.github/workflows/quality.yml');
    expect(workflow).toContain('Backfill and reconcile canonical evidence in the SQLite fixture');
    expect(workflow).toContain('Verify canonical dual-write on PostgreSQL');
    expect(workflow).toContain('/tmp/policywatcher-document-evidence-postgresql.json');
    expect(source('scripts/create-postgresql-rehearsal-fixture.mjs')).toContain(
      "createHash('sha256').update(evidenceText, 'utf8').digest('hex')",
    );
  });

  it('blocks deployment and runtime activation when reconciliation is not clean', () => {
    const gate = source('scripts/gate-document-evidence-activation.ts');
    expect(gate).toContain("report.status !== 'reconciled'");
    expect(gate).toContain('report.errorCount !== 0');
    expect(gate).toContain('report.warningCount !== 0');
    expect(gate).not.toContain('issue.detail');
    expect(source('scripts/hostinger-managed-build.mjs')).toContain(
      'gate-document-evidence-activation.ts',
    );
    expect(source('server.js')).toContain('Canonical evidence activation gate failed');
  });

  it('keeps web and Expo lint policies independent while preserving one root gate', () => {
    const packageJson = JSON.parse(source('package.json')) as { scripts: Record<string, string> };
    const workflow = source('.github/workflows/quality.yml');
    expect(packageJson.scripts.lint).toBe('npm run lint:web && npm run lint:mobile');
    expect(packageJson.scripts['lint:web']).toBe('eslint .');
    expect(packageJson.scripts['lint:mobile']).toBe(
      'npm --prefix mobile/android-companion run lint',
    );
    expect(source('eslint.config.mjs')).toContain('"mobile/**"');
    const installMobileDependencies = workflow.indexOf(
      'npm ci --prefix mobile/android-companion',
    );
    const lint = workflow.indexOf('npm run lint');
    expect(installMobileDependencies).toBeGreaterThanOrEqual(0);
    expect(lint).toBeGreaterThan(installMobileDependencies);
  });
});
