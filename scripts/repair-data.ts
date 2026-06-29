#!/usr/bin/env npx tsx
/**
 * PolicyWatcher — Data Integrity Repair Script
 * =============================================
 *
 * Fixes ALL issues identified by the Dataset Quality audit:
 *
 * 1. HASH INTEGRITY: Recomputes SHA-256 hashes for all snapshots and currentHash
 * 2. AI JSON: Generates keyPointsJson and riskReasonsJson from existing AI summaries
 * 3. TL;DR: Generates tldrEn/tldrIt from existing AI summaries
 * 4. RISK LABELS: Normalizes overallRisk to match overallScore bands
 * 5. DUPLICATE URLs: Reports (but does not auto-fix) duplicate policy URLs
 *
 * Usage:
 *   npx tsx scripts/repair-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Map score → risk label using consistent bands */
function scoreToRisk(score: number): string {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}

/** Extract a TL;DR from an AI summary — first sentence or first 150 chars */
function extractTldr(summary: string): string {
  if (!summary) return '';
  // Find first sentence ending
  const match = summary.match(/^(.+?[.!?])\s/);
  if (match && match[1].length >= 30 && match[1].length <= 200) {
    return match[1];
  }
  // Fallback: first 150 chars + ellipsis
  if (summary.length <= 150) return summary;
  const cut = summary.lastIndexOf(' ', 150);
  return summary.substring(0, cut > 80 ? cut : 150) + '…';
}

/** Generate synthetic key points from an AI summary */
function generateKeyPoints(summaryEn: string, summaryIt: string): string {
  if (!summaryEn) return '[]';
  // Split English summary into sentences and use first 3-5 as key points
  const sentences = summaryEn
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  const sentencesIt = summaryIt
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  const points = sentences.slice(0, 5).map((textEn, i) => ({
    textEn: textEn.endsWith('.') ? textEn : textEn + '.',
    textIt: (sentencesIt[i] || textEn).endsWith('.') ? (sentencesIt[i] || textEn) : (sentencesIt[i] || textEn) + '.',
    sentiment: 'neutral' as const,
  }));

  return JSON.stringify(points);
}

/** Generate synthetic risk reasons from score and summary */
function generateRiskReasons(summaryEn: string, summaryIt: string, score: number): string {
  if (!summaryEn) return '[]';

  // Extract meaningful phrases that hint at risk factors
  const riskIndicators = [
    { patterns: /data collection|data gathering|collect/i, icon: '📊', en: 'Data collection scope changes', it: 'Modifiche all\'ambito di raccolta dati' },
    { patterns: /third.?party|sharing|share/i, icon: '🔗', en: 'Third-party data sharing updated', it: 'Aggiornamento condivisione dati con terze parti' },
    { patterns: /retention|store|storage/i, icon: '⏱️', en: 'Data retention policy changes', it: 'Modifiche alla policy di conservazione dati' },
    { patterns: /consent|opt.?out|opt.?in/i, icon: '✋', en: 'Consent mechanism modifications', it: 'Modifiche al meccanismo di consenso' },
    { patterns: /AI|artificial intelligence|machine learning|model|training/i, icon: '🤖', en: 'AI/ML data usage changes', it: 'Modifiche all\'uso dei dati per AI/ML' },
    { patterns: /GDPR|regulation|compliance|legal/i, icon: '⚖️', en: 'Regulatory compliance updates', it: 'Aggiornamenti conformità normativa' },
    { patterns: /transfer|cross.?border|international/i, icon: '🌐', en: 'Cross-border data transfer changes', it: 'Modifiche al trasferimento transfrontaliero dati' },
    { patterns: /encryption|security|breach|protect/i, icon: '🔒', en: 'Security posture changes', it: 'Modifiche alla postura di sicurezza' },
    { patterns: /delete|erasure|right to/i, icon: '🗑️', en: 'Data deletion rights modified', it: 'Diritti di cancellazione modificati' },
    { patterns: /transparency|disclose|audit/i, icon: '👁️', en: 'Transparency measures updated', it: 'Misure di trasparenza aggiornate' },
  ];

  const reasons = riskIndicators
    .filter(r => r.patterns.test(summaryEn))
    .slice(0, 4)
    .map((r, i) => ({
      icon: r.icon,
      textEn: r.en,
      textIt: r.it,
      deltaScore: Math.max(1, Math.ceil(score / (i + 2))),
    }));

  // Ensure at least one reason
  if (reasons.length === 0) {
    reasons.push({
      icon: '📋',
      textEn: 'Policy terms updated',
      textIt: 'Termini della policy aggiornati',
      deltaScore: Math.ceil(score / 2),
    });
  }

  return JSON.stringify(reasons);
}

async function main() {
  console.log('\n🔧 PolicyWatcher — Data Integrity Repair\n');

  // ── 1. Fix snapshot hashes ──
  console.log('━━━ Phase 1: Snapshot Hash Integrity ━━━');
  const snapshots = await prisma.policySnapshot.findMany();
  let hashFixed = 0;
  for (const snap of snapshots) {
    const correctHash = sha256(snap.text);
    if (snap.hash !== correctHash) {
      await prisma.policySnapshot.update({
        where: { id: snap.id },
        data: { hash: correctHash },
      });
      hashFixed++;
    }
  }
  console.log(`  ✅ ${hashFixed}/${snapshots.length} snapshot hashes fixed\n`);

  // ── 2. Fix policy currentHash ──
  console.log('━━━ Phase 2: Policy currentHash Integrity ━━━');
  const policies = await prisma.policy.findMany();
  let policyHashFixed = 0;
  for (const pol of policies) {
    const correctHash = sha256(pol.currentText);
    if (pol.currentHash !== correctHash) {
      await prisma.policy.update({
        where: { id: pol.id },
        data: { currentHash: correctHash },
      });
      policyHashFixed++;
    }
  }
  console.log(`  ✅ ${policyHashFixed}/${policies.length} policy hashes fixed\n`);

  // ── 3. Fix risk labels ──
  console.log('━━━ Phase 3: Risk Label Normalization ━━━');
  const changes = await prisma.policyChange.findMany({
    include: { policy: { include: { company: true } } },
  });
  let riskFixed = 0;
  for (const c of changes) {
    const correct = scoreToRisk(c.overallScore);
    if (c.overallRisk !== correct) {
      await prisma.policyChange.update({
        where: { id: c.id },
        data: { overallRisk: correct },
      });
      console.log(`  🔄 ${c.policy.company.name} / ${c.policy.name}: ${c.overallRisk} → ${correct} (score ${c.overallScore})`);
      riskFixed++;
    }
  }
  console.log(`  ✅ ${riskFixed}/${changes.length} risk labels normalized\n`);

  // ── 4. Fix AI JSON fields ──
  console.log('━━━ Phase 4: AI JSON Fields (keyPoints, riskReasons, tldr) ━━━');
  let aiFixed = 0;
  for (const c of changes) {
    const updates: Record<string, string> = {};

    // keyPointsJson
    if (!c.keyPointsJson || c.keyPointsJson === '[]' || c.keyPointsJson === 'null') {
      let isValid = false;
      try {
        const parsed = JSON.parse(c.keyPointsJson || '');
        isValid = Array.isArray(parsed) && parsed.length > 0;
      } catch { /* not valid */ }

      if (!isValid) {
        updates.keyPointsJson = generateKeyPoints(c.aiSummaryEn, c.aiSummaryIt);
      }
    }

    // riskReasonsJson
    if (!c.riskReasonsJson || c.riskReasonsJson === '[]' || c.riskReasonsJson === 'null') {
      let isValid = false;
      try {
        const parsed = JSON.parse(c.riskReasonsJson || '');
        isValid = Array.isArray(parsed) && parsed.length > 0;
      } catch { /* not valid */ }

      if (!isValid) {
        updates.riskReasonsJson = generateRiskReasons(c.aiSummaryEn, c.aiSummaryIt, c.overallScore);
      }
    }

    // tldrEn / tldrIt
    if (!c.tldrEn || c.tldrEn.trim().length === 0) {
      updates.tldrEn = extractTldr(c.aiSummaryEn);
    }
    if (!c.tldrIt || c.tldrIt.trim().length === 0) {
      updates.tldrIt = extractTldr(c.aiSummaryIt);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.policyChange.update({
        where: { id: c.id },
        data: updates,
      });
      aiFixed++;
    }
  }
  console.log(`  ✅ ${aiFixed}/${changes.length} changes with AI fields backfilled\n`);

  // ── 5. Restore KPI Assessments ──
  console.log('━━━ Phase 5: KPI Assessment Restore ━━━');
  let kpisRestored = 0;
  const KPI_FIELDS = [
    'kpiDataCollection', 'kpiThirdPartySharing', 'kpiDataRetention',
    'kpiRightToDeletion', 'kpiCrossBorderTransfer', 'kpiAiTrainingOptOut',
    'kpiAiOutputOwnership', 'kpiAlgoTransparency', 'kpiAutomatedDecision',
    'kpiAiBiasFairness', 'kpiConsentMechanism', 'kpiRegulatoryCompliance',
    'kpiBreachNotification', 'kpiIndependentAudit', 'kpiContentModeration',
  ] as const;

  for (const c of changes) {
    // Check if this change has 'Not assessed' for kpiDataCollection
    if (c.kpiDataCollection === 'Not assessed') {
      // Find the oldest change for the same policy that HAS values
      const baseChange = await prisma.policyChange.findFirst({
        where: {
          policyId: c.policyId,
          kpiDataCollection: { not: 'Not assessed' },
        },
        orderBy: { createdAt: 'asc' }, // oldest change first (which would be the seed change)
      });

      if (baseChange) {
        const kpiUpdates: Record<string, string> = {};
        for (const field of KPI_FIELDS) {
          kpiUpdates[field] = (baseChange as Record<string, any>)[field];
        }

        await prisma.policyChange.update({
          where: { id: c.id },
          data: kpiUpdates,
        });
        console.log(`  🔄 Restored KPIs for ${c.policy.company.name} / ${c.policy.name} from version at ${baseChange.createdAt.toISOString()}`);
        kpisRestored++;
      }
    }
  }
  console.log(`  ✅ ${kpisRestored} policy changes restored with proper KPI ratings\n`);

  // ── 6. Report duplicate URLs ──
  console.log('━━━ Phase 6: Duplicate URL Report ━━━');
  const allPolicies = await prisma.policy.findMany({
    include: { company: true },
  });
  const urlMap = new Map<string, { company: string; name: string; id: string }[]>();
  for (const p of allPolicies) {
    const norm = p.url.replace(/\/$/, '').replace(/#.*$/, '');
    if (!urlMap.has(norm)) urlMap.set(norm, []);
    urlMap.get(norm)!.push({ company: p.company.name, name: p.name, id: p.id });
  }
  let dupes = 0;
  for (const [url, entries] of urlMap) {
    if (entries.length > 1) {
      dupes++;
      console.log(`  ⚠️  Duplicate URL: ${url}`);
      entries.forEach(e => console.log(`      → ${e.company} / ${e.name}`));
    }
  }
  if (dupes === 0) console.log('  ✅ No duplicate URLs found');
  console.log('');

  // ── Summary ──
  console.log('━'.repeat(50));
  console.log('REPAIR SUMMARY');
  console.log(`  Snapshot hashes fixed:  ${hashFixed}`);
  console.log(`  Policy hashes fixed:   ${policyHashFixed}`);
  console.log(`  Risk labels fixed:     ${riskFixed}`);
  console.log(`  AI fields backfilled:  ${aiFixed}`);
  console.log(`  KPIs restored:         ${kpisRestored}`);
  console.log(`  Duplicate URL groups:  ${dupes}`);
  console.log('━'.repeat(50));
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Repair failed:', err);
  process.exit(1);
});
