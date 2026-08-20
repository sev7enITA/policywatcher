#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db';
import { createConfiguredPolicy } from '../src/lib/configuredPolicy';
import {
  deleteCanonicalEntityForLegacyCompany,
  dualWriteCanonicalEntity,
  dualWriteCanonicalPolicyGraph,
  isDocumentEvidenceDualWriteEnabled,
  sha256Text,
} from '../src/lib/documentEvidenceSync';
import { establishVerifiedPolicyBaseline } from '../src/lib/policyBaseline';
import { reconcileDocumentEvidence } from '../src/lib/documentEvidenceReconciliation';
import { getDatabaseUrl } from '../src/lib/databaseUrl';

const SMOKE_ACK = 'I_ACKNOWLEDGE_DOCUMENT_EVIDENCE_SMOKE_WRITES';

function argument(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function assertSafeTarget(): void {
  const databaseUrl = getDatabaseUrl();
  const target = databaseUrl.toLowerCase();
  if (
    process.env.NODE_ENV === 'production' ||
    !/(rehearsal|staging|sandbox|test|policywatcher_ci)/.test(target) ||
    process.env.POLICYWATCHER_DOCUMENT_EVIDENCE_SMOKE_ACK !== SMOKE_ACK
  ) {
    throw new Error(
      `Smoke writes require a rehearsal/staging/sandbox/test/CI database and POLICYWATCHER_DOCUMENT_EVIDENCE_SMOKE_ACK=${SMOKE_ACK}.`,
    );
  }
  if (!isDocumentEvidenceDualWriteEnabled()) {
    throw new Error('POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE=1 is required.');
  }
}

async function main(): Promise<void> {
  assertSafeTarget();
  const startedAt = new Date();
  const suffix = randomUUID().slice(0, 8);
  const company = await db.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: `Document Evidence Smoke ${suffix}`,
        slug: `document-evidence-smoke-${suffix}`,
        industry: 'Rehearsal fixture',
        website: 'https://example.com/',
      },
    });
    await dualWriteCanonicalEntity(tx, created.id);
    return created;
  });

  const policy = await db.$transaction(async (tx) =>
    createConfiguredPolicy(tx, {
      companyId: company.id,
      name: 'Rehearsal Terms',
      type: 'terms',
      url: 'https://example.com/terms',
      jurisdiction: 'Global',
    }),
  );

  const baselineText = 'Document evidence dual-write rehearsal baseline.';
  const baselineHash = sha256Text(baselineText);
  const baselineAt = new Date();
  await db.$transaction(async (tx) =>
    establishVerifiedPolicyBaseline(tx, {
      policyId: policy.id,
      text: baselineText,
      hash: baselineHash,
      checkedAt: baselineAt,
      ingestionMethod: 'Direct Scrape',
      source: 'direct',
      finalUrl: policy.url,
      reasonCode: 'verified',
    }),
  );

  const changedText = `${baselineText}\nAI training is available with an opt-out.`;
  const changedHash = sha256Text(changedText);
  await db.$transaction(async (tx) => {
    const oldSnapshot = await tx.policySnapshot.findFirstOrThrow({
      where: { policyId: policy.id },
      orderBy: { version: 'desc' },
    });
    const capturedAt = new Date();
    const newSnapshot = await tx.policySnapshot.create({
      data: {
        policyId: policy.id,
        version: oldSnapshot.version + 1,
        text: changedText,
        hash: changedHash,
        publicEvidence: true,
        createdAt: capturedAt,
      },
    });
    await tx.policyChange.create({
      data: {
        policyId: policy.id,
        oldSnapshotId: oldSnapshot.id,
        newSnapshotId: newSnapshot.id,
        diff: '[]',
        aiSummaryEn: 'The rehearsal terms add an AI-training opt-out.',
        aiSummaryIt: 'I termini di prova aggiungono un opt-out per il training AI.',
        tldrEn: 'AI training is available with an opt-out.',
        tldrIt: 'Il training AI prevede un opt-out.',
        overallRisk: 'Medium',
        overallScore: 5,
        remediationsJson: '[]',
        publicEvidence: true,
        publicPublishedAt: capturedAt,
        aiTrainingOptOut: 'Opt-out available',
        aiDataScrapingRestricted: 'Not specified',
        aiIpLicensing: 'Protected',
        aiPromptRetention: '30 days',
        kpiAiTrainingOptOut: 'Opt-out available',
        kpiThirdPartySharing: 'Not assessed',
        kpiDataRetention: '30 days',
        kpiAiOutputOwnership: 'Protected',
        createdAt: capturedAt,
      },
    });
    await tx.policy.update({
      where: { id: policy.id },
      data: {
        currentText: changedText,
        currentHash: changedHash,
        lastCheckDate: capturedAt,
        lastSuccessfulCheckDate: capturedAt,
        dataStatus: 'Available',
        ingestionMethod: 'Direct Scrape',
      },
    });
    await dualWriteCanonicalPolicyGraph(tx, policy.id);
  });

  const graph = await db.document.findUniqueOrThrow({
    where: { legacyPolicyId: policy.id },
    include: {
      entity: true,
      versions: true,
      changes: { include: { provisions: true } },
    },
  });
  const detectedChange = graph.changes.find((change) => change.kind === 'detected');
  const assertions = {
    entityBridge: graph.entity.legacyCompanyId === company.id,
    documentBridge: graph.legacyPolicyId === policy.id,
    versionCount: graph.versions.length === 2,
    changeCount: graph.changes.length === 2,
    detectedProvisionCount: detectedChange?.provisions.length === 6,
    stablePublicIds: [
      graph.entity.publicId,
      graph.publicId,
      ...graph.versions.map((version) => version.publicId),
      ...graph.changes.map((change) => change.publicId),
    ].every((value) => /^(ent|doc|ver|chg)_[a-f0-9]{32}$/.test(value)),
  };
  if (Object.values(assertions).some((assertion) => assertion !== true)) {
    throw new Error('document_evidence_dual_write_assertion_failed');
  }

  await db.$transaction(async (tx) => {
    await deleteCanonicalEntityForLegacyCompany(tx, company.id);
    await tx.company.delete({ where: { id: company.id } });
  });
  const reconciliation = await db.$transaction(
    async (tx) => reconcileDocumentEvidence(tx),
    { maxWait: 10_000, timeout: 120_000 },
  );
  const report = {
    contractVersion: '1.0.0',
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    status: reconciliation.status === 'reconciled' ? 'passed' : 'failed',
    assertions,
    syntheticGraph: {
      entities: 1,
      documents: 1,
      versions: graph.versions.length,
      changes: graph.changes.length,
      provisions: detectedChange?.provisions.length || 0,
    },
    cleanupReconciliation: reconciliation,
  };

  const reportPath = argument(process.argv.slice(2), '--report');
  if (reportPath) {
    const absolutePath = path.resolve(reportPath);
    if (fs.existsSync(absolutePath)) throw new Error(`Report already exists: ${absolutePath}`);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'passed') process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
