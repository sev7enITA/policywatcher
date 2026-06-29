/**
 * Database Diagnostic Script for PolicyWatcher KPI Matrix
 * 
 * Run with: npx tsx scripts/db-diagnostic.ts
 * 
 * Shows exactly what the database contains for each company/policy,
 * including all 15 KPI values, risk scores, and AI governance indicators.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KPI_FIELDS = [
  // Privacy & Data Protection
  'kpiDataCollection',
  'kpiThirdPartySharing',
  'kpiDataRetention',
  'kpiRightToDeletion',
  'kpiCrossBorderTransfer',
  // AI Governance
  'kpiAiTrainingOptOut',
  'kpiAiOutputOwnership',
  'kpiAlgoTransparency',
  'kpiAutomatedDecision',
  'kpiAiBiasFairness',
  // Ethics & Corporate Governance
  'kpiConsentMechanism',
  'kpiRegulatoryCompliance',
  'kpiBreachNotification',
  'kpiIndependentAudit',
  'kpiContentModeration',
] as const;

type KpiField = (typeof KPI_FIELDS)[number];

const KPI_LABELS: Record<string, string> = {
  kpiDataCollection: 'Data Collection Scope',
  kpiThirdPartySharing: 'Third-Party Sharing',
  kpiDataRetention: 'Data Retention',
  kpiRightToDeletion: 'Right to Deletion',
  kpiCrossBorderTransfer: 'Cross-Border Transfer',
  kpiAiTrainingOptOut: 'AI Training Opt-Out',
  kpiAiOutputOwnership: 'AI Output Ownership',
  kpiAlgoTransparency: 'Algorithmic Transparency',
  kpiAutomatedDecision: 'Automated Decisions',
  kpiAiBiasFairness: 'AI Bias & Fairness',
  kpiConsentMechanism: 'Consent Mechanism',
  kpiRegulatoryCompliance: 'Regulatory Compliance',
  kpiBreachNotification: 'Breach Notification',
  kpiIndependentAudit: 'Independent Audit',
  kpiContentModeration: 'Content Moderation',
};

async function main() {
  console.log('='.repeat(80));
  console.log('POLICYWATCHER DATABASE DIAGNOSTIC');
  console.log('='.repeat(80));

  // 1. Company overview
  const companies = await prisma.company.findMany({
    include: {
      policies: {
        include: {
          changes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`\nTotal companies: ${companies.length}`);
  console.log(`Total policies: ${companies.reduce((sum, c) => sum + c.policies.length, 0)}`);

  const totalChanges = companies.reduce(
    (sum, c) => sum + c.policies.reduce((s2, p) => s2 + p.changes.length, 0),
    0
  );
  console.log(`Total policy changes (latest per policy): ${totalChanges}`);

  // 2. Per-company KPI breakdown
  console.log('\n' + '='.repeat(80));
  console.log('KPI MATRIX DATA (latest PolicyChange per policy per company)');
  console.log('='.repeat(80));

  for (const company of companies) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`COMPANY: ${company.name} (${company.industry})`);
    console.log(`${'─'.repeat(60)}`);

    if (company.policies.length === 0) {
      console.log('  [NO POLICIES]');
      continue;
    }

    for (const policy of company.policies) {
      const change = policy.changes[0];
      if (!change) {
        console.log(`  Policy: ${policy.name} (${policy.type}) -> [NO CHANGES]`);
        continue;
      }

      console.log(`\n  Policy: ${policy.name} (${policy.type})`);
      console.log(`  Risk Score: ${change.overallScore}/10 (${change.overallRisk})`);
      console.log(`  Created: ${change.createdAt}`);

      // Legacy AI governance fields
      console.log(`  AI Training Opt-Out (legacy): ${change.aiTrainingOptOut}`);
      console.log(`  AI Data Scraping (legacy): ${change.aiDataScrapingRestricted}`);
      console.log(`  AI IP Licensing (legacy): ${change.aiIpLicensing}`);
      console.log(`  AI Prompt Retention (legacy): ${change.aiPromptRetention}`);

      // 15 KPI values
      console.log(`\n  15 KPIs:`);
      let assessedCount = 0;
      let notAssessedCount = 0;

      for (const field of KPI_FIELDS) {
        const value = (change as unknown as Record<KpiField, string | null>)[field] || 'Not assessed';
        const label = KPI_LABELS[field] || field;
        const isDefault = value === 'Not assessed';
        
        if (isDefault) notAssessedCount++;
        else assessedCount++;

        const marker = isDefault ? ' [DEFAULT]' : '';
        console.log(`    ${label.padEnd(28)} = ${value}${marker}`);
      }

      console.log(`\n  KPI Coverage: ${assessedCount}/${KPI_FIELDS.length} assessed, ${notAssessedCount} at default`);

      // Risk reasons
      if (change.riskReasonsJson) {
        try {
          const reasons = JSON.parse(change.riskReasonsJson) as Array<{
            deltaScore: number;
            textEn: string;
          }>;
          console.log(`\n  Risk Reasons (${reasons.length}):`);
          for (const r of reasons) {
            console.log(`    [${r.deltaScore > 0 ? '+' : ''}${r.deltaScore}] ${r.textEn}`);
          }
        } catch {
          console.log('  Risk Reasons: [INVALID JSON]');
        }
      }

      // TL;DR
      if (change.tldrEn) {
        console.log(`\n  TL;DR: ${change.tldrEn}`);
      }
    }
  }

  // 3. KPI value distribution (what values does Gemini actually produce?)
  console.log('\n' + '='.repeat(80));
  console.log('KPI VALUE DISTRIBUTION (across all changes)');
  console.log('='.repeat(80));

  const allChanges = await prisma.policyChange.findMany({
    select: Object.fromEntries(KPI_FIELDS.map(f => [f, true])),
  });

  for (const field of KPI_FIELDS) {
    const label = KPI_LABELS[field] || field;
    const values: Record<string, number> = {};
    for (const change of allChanges) {
      const val = (change as unknown as Record<KpiField, string | null>)[field] || 'Not assessed';
      values[val] = (values[val] || 0) + 1;
    }

    console.log(`\n  ${label}:`);
    for (const [val, count] of Object.entries(values).sort((a, b) => b[1] - a[1])) {
      const bar = '#'.repeat(count);
      console.log(`    ${val.padEnd(30)} ${bar} (${count})`);
    }
  }

  // 4. Score distribution
  console.log('\n' + '='.repeat(80));
  console.log('RISK SCORE DISTRIBUTION');
  console.log('='.repeat(80));

  const scores = await prisma.policyChange.findMany({
    select: {
      overallScore: true,
      overallRisk: true,
      policy: { select: { name: true, company: { select: { name: true } } } },
    },
    orderBy: { overallScore: 'desc' },
  });

  const scoreGroups: Record<string, number> = {};
  for (const s of scores) {
    scoreGroups[s.overallScore] = (scoreGroups[s.overallScore] || 0) + 1;
  }

  console.log('\n  Distribution:');
  for (let i = 1; i <= 10; i++) {
    const count = scoreGroups[i] || 0;
    const bar = '#'.repeat(count);
    console.log(`    Score ${i.toString().padStart(2)}: ${bar.padEnd(30)} (${count})`);
  }

  console.log('\n  Top 10 highest risk:');
  for (const s of scores.slice(0, 10)) {
    console.log(`    ${s.overallScore}/10 (${s.overallRisk.padEnd(6)}) - ${s.policy.company.name} / ${s.policy.name}`);
  }

  console.log('\n  Top 5 lowest risk:');
  for (const s of scores.slice(-5).reverse()) {
    console.log(`    ${s.overallScore}/10 (${s.overallRisk.padEnd(6)}) - ${s.policy.company.name} / ${s.policy.name}`);
  }

  // 5. Region impact consistency
  console.log('\n' + '='.repeat(80));
  console.log('REGION IMPACT COVERAGE');
  console.log('='.repeat(80));

  const changesWithImpacts = await prisma.policyChange.findMany({
    select: {
      id: true,
      policy: { select: { name: true, company: { select: { name: true } } } },
      regionImpacts: { select: { region: true, perspective: true, riskLevel: true } },
    },
  });

  let missingImpacts = 0;
  for (const c of changesWithImpacts) {
    if (c.regionImpacts.length !== 6) {
      missingImpacts++;
      console.log(`  [WARNING] ${c.policy.company.name} / ${c.policy.name}: ${c.regionImpacts.length}/6 region impacts`);
    }
  }

  if (missingImpacts === 0) {
    console.log('  All policy changes have exactly 6 region impacts (EU/US/Global x Individual/Enterprise)');
  } else {
    console.log(`\n  ${missingImpacts} policy changes with incomplete region impacts`);
  }

  await prisma.$disconnect();
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
}

main().catch((e) => {
  console.error('Diagnostic failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
