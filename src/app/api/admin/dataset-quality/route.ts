/**
 * Admin Dataset Quality API
 *
 * GET /api/admin/dataset-quality
 *
 * Read-only quality gate for the PolicyWatcher dataset. It checks entity
 * coverage, URL hygiene, hash/snapshot integrity, AI analysis completeness,
 * KPI coverage, regional impact coverage, freshness, and subscriber hygiene.
 * Accessible by both admin and auditor roles.
 */

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import {
  SUBSCRIBER_FREQUENCIES,
  SUBSCRIBER_INDUSTRIES,
  SUBSCRIBER_REGIONS,
  normalizePreferenceValue,
} from '@/lib/subscriberPreferences';

const KPI_FIELDS = [
  'kpiDataCollection',
  'kpiThirdPartySharing',
  'kpiDataRetention',
  'kpiRightToDeletion',
  'kpiCrossBorderTransfer',
  'kpiAiTrainingOptOut',
  'kpiAiOutputOwnership',
  'kpiAlgoTransparency',
  'kpiAutomatedDecision',
  'kpiAiBiasFairness',
  'kpiConsentMechanism',
  'kpiRegulatoryCompliance',
  'kpiBreachNotification',
  'kpiIndependentAudit',
  'kpiContentModeration',
] as const;

const EXPECTED_REGION_IMPACTS = [
  ['EU', 'Individual'],
  ['EU', 'Enterprise'],
  ['US', 'Individual'],
  ['US', 'Enterprise'],
  ['Global', 'Individual'],
  ['Global', 'Enterprise'],
] as const;

const VALID_RISKS = new Set(['Low', 'Medium', 'High']);
const VALID_SUBSCRIBER_REGIONS = new Set<string>(SUBSCRIBER_REGIONS);
const VALID_SUBSCRIBER_INDUSTRIES = new Set<string>(SUBSCRIBER_INDUSTRIES);
const VALID_FREQUENCIES = new Set<string>(SUBSCRIBER_FREQUENCIES);
const STALE_POLICY_DAYS = 30;
const MAX_ISSUES_RETURNED = 250;

type Severity = 'critical' | 'warning' | 'info';
type GateStatus = 'pass' | 'warn' | 'fail';

interface DatasetIssue {
  id: string;
  severity: Severity;
  area: string;
  entityType: 'company' | 'policy' | 'snapshot' | 'change' | 'subscriber' | 'system';
  entityId?: string;
  companyName?: string;
  policyName?: string;
  label: string;
  detail: string;
  action: string;
}

interface GateCheck {
  id: string;
  label: string;
  status: GateStatus;
  passed: number;
  total: number;
  detail: string;
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function expectedRisk(score: number): string {
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function parseJsonArray(value: string | null): { valid: boolean; count: number } {
  if (!value) return { valid: false, count: 0 };
  try {
    const parsed = JSON.parse(value) as unknown;
    return { valid: Array.isArray(parsed), count: Array.isArray(parsed) ? parsed.length : 0 };
  } catch {
    return { valid: false, count: 0 };
  }
}

function gateStatus(passed: number, total: number): GateStatus {
  if (total === 0) return 'fail';
  if (passed === total) return 'pass';
  return passed / total >= 0.8 ? 'warn' : 'fail';
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return true;
  }
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return true;
  }
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function normalizePolicyUrl(rawUrl: string): { normalized?: string; reason?: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { reason: 'Only HTTP(S) URLs can be monitored.' };
    }
    if (parsed.username || parsed.password) {
      return { reason: 'Policy URL contains credentials.' };
    }
    if (isPrivateHostname(parsed.hostname)) {
      return { reason: 'Policy URL targets a private or local hostname.' };
    }
    parsed.hash = '';
    return { normalized: parsed.href.replace(/\/$/, '').toLowerCase() };
  } catch {
    return { reason: 'Policy URL is not parseable.' };
  }
}

function sourceFitWarning(rawUrl: string, jurisdiction: string): { label: string; detail: string; action: string } | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const pathSegments = parsed.pathname.toLowerCase().split('/').filter(Boolean);
    const query = parsed.searchParams.toString().toLowerCase();
    const hasItalianLocale =
      host.endsWith('.it') ||
      pathSegments.includes('it') ||
      pathSegments.includes('it-it') ||
      query.includes('locale.x=it') ||
      query.includes('locale=it');
    const regionalSegments = new Set([
      'au', 'br', 'ca', 'de', 'es', 'fr', 'gb', 'ie', 'it', 'jp', 'kr', 'lu', 'mx', 'nl', 'uk', 'us',
      'en-au', 'en-ca', 'en-gb', 'en-ie', 'en-it', 'en-lu', 'it-it',
    ]);
    const hasRegionalPath = pathSegments.some((segment) => regionalSegments.has(segment));

    if (jurisdiction === 'Global' && hasRegionalPath) {
      return {
        label: 'Global source uses a regional URL',
        detail: 'A Global policy should point to the provider\'s canonical English/global source, not a localized market page.',
        action: 'Replace with the canonical global English policy URL or reclassify the policy jurisdiction.',
      };
    }

    if ((jurisdiction === 'EU' || jurisdiction === 'US') && hasItalianLocale) {
      return {
        label: 'Localized source for market-level policy',
        detail: `The ${jurisdiction} source URL appears to be Italian-localized. Localized pages can diverge from the primary legal source used for analysis.`,
        action: jurisdiction === 'EU'
          ? 'Prefer the official English EU/EEA policy source, then use localized URLs only as secondary references.'
          : 'Prefer the official US or global English policy source for US analysis.',
      };
    }
  } catch {
    return null;
  }

  return null;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return 'invalid-email';
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [companies, subscribers] = await Promise.all([
      db.company.findMany({
        include: {
          policies: {
            include: {
              snapshots: {
                orderBy: { version: 'desc' },
                select: {
                  id: true,
                  version: true,
                  text: true,
                  hash: true,
                  createdAt: true,
                },
              },
              changes: {
                orderBy: { createdAt: 'desc' },
                include: {
                  regionImpacts: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.subscriber.findMany({
        select: {
          id: true,
          email: true,
          regions: true,
          industries: true,
          frequency: true,
          unsubscribeToken: true,
          isActive: true,
        },
      }),
    ]);

    const issues: DatasetIssue[] = [];
    const counts: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
    const areaCounts: Record<string, number> = {};
    let issueSeq = 0;

    const addIssue = (
      severity: Severity,
      issue: Omit<DatasetIssue, 'id' | 'severity'>
    ) => {
      counts[severity]++;
      areaCounts[issue.area] = (areaCounts[issue.area] || 0) + 1;
      if (issues.length >= MAX_ISSUES_RETURNED) return;
      issueSeq++;
      issues.push({
        id: `${issue.area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${issueSeq}`,
        severity,
        ...issue,
      });
    };

    const now = Date.now();
    const staleCutoffMs = STALE_POLICY_DAYS * 24 * 60 * 60 * 1000;
    const policies = companies.flatMap((company) =>
      company.policies.map((policy) => ({ ...policy, companyName: company.name }))
    );
    const snapshots = policies.flatMap((policy) =>
      policy.snapshots.map((snapshot) => ({ ...snapshot, policyId: policy.id }))
    );
    const changes = policies.flatMap((policy) =>
      policy.changes.map((change) => ({
        ...change,
        policyName: policy.name,
        companyName: policy.companyName,
      }))
    );

    if (companies.length === 0) {
      addIssue('critical', {
        area: 'Inventory',
        entityType: 'system',
        label: 'No companies found',
        detail: 'The monitored-company inventory is empty.',
        action: 'Seed or add monitored companies before publishing the dataset.',
      });
    }
    if (policies.length === 0) {
      addIssue('critical', {
        area: 'Inventory',
        entityType: 'system',
        label: 'No policies found',
        detail: 'No policy documents are currently monitored.',
        action: 'Add at least one policy for each monitored company.',
      });
    }

    const seenCompanySlugs = new Set<string>();
    const seenPolicyUrls = new Map<string, string>();
    const invalidUrlPolicyIds = new Set<string>();
    const sourceFitIssueIds = new Set<string>();
    const hashFailureIds = new Set<string>();
    const stalePolicyIds = new Set<string>();
    let policiesWithSnapshots = 0;
    let policiesWithChanges = 0;

    for (const company of companies) {
      const slug = company.slug.toLowerCase();
      if (seenCompanySlugs.has(slug)) {
        addIssue('warning', {
          area: 'Inventory',
          entityType: 'company',
          entityId: company.id,
          companyName: company.name,
          label: 'Duplicate company slug ignoring case',
          detail: `Company slug "${company.slug}" collides when normalized.`,
          action: 'Keep slugs unique after lower-casing to avoid ambiguous URLs.',
        });
      }
      seenCompanySlugs.add(slug);
    }

    for (const policy of policies) {
      const urlResult = normalizePolicyUrl(policy.url);
      if (!urlResult.normalized) {
        invalidUrlPolicyIds.add(policy.id);
        addIssue('critical', {
          area: 'URL Hygiene',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Invalid policy URL',
          detail: urlResult.reason || 'Policy URL failed validation.',
          action: 'Replace the monitored URL with a public HTTP(S) policy page.',
        });
      } else {
        const previousPolicyId = seenPolicyUrls.get(urlResult.normalized);
        if (previousPolicyId && previousPolicyId !== policy.id) {
          invalidUrlPolicyIds.add(policy.id);
          addIssue('warning', {
            area: 'URL Hygiene',
            entityType: 'policy',
            entityId: policy.id,
            companyName: policy.companyName,
            policyName: policy.name,
            label: 'Duplicate policy URL',
            detail: 'Another monitored policy points to the same normalized URL.',
            action: 'Verify whether these policies should be merged or given distinct source URLs.',
          });
        }
        seenPolicyUrls.set(urlResult.normalized, policy.id);

        const sourceWarning = sourceFitWarning(policy.url, policy.jurisdiction);
        if (sourceWarning) {
          sourceFitIssueIds.add(policy.id);
          addIssue('warning', {
            area: 'Source Fit',
            entityType: 'policy',
            entityId: policy.id,
            companyName: policy.companyName,
            policyName: policy.name,
            label: sourceWarning.label,
            detail: sourceWarning.detail,
            action: sourceWarning.action,
          });
        }
      }

      if (!policy.currentText || policy.currentText.trim().length < 500) {
        addIssue('warning', {
          area: 'Coverage',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Policy text is missing or very short',
          detail: `Current text length is ${policy.currentText?.length || 0} characters.`,
          action: 'Re-scan the policy source and confirm scraper extraction quality.',
        });
      }

      if (!policy.currentHash || hashText(policy.currentText) !== policy.currentHash) {
        hashFailureIds.add(policy.id);
        addIssue('critical', {
          area: 'Hash Integrity',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Current policy hash mismatch',
          detail: 'The stored currentHash does not match the SHA-256 hash of currentText.',
          action: 'Rebuild this policy snapshot from source before relying on diffs.',
        });
      }

      if (policy.snapshots.length > 0) {
        policiesWithSnapshots++;
      } else {
        addIssue('warning', {
          area: 'Coverage',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Policy has no snapshots',
          detail: 'Snapshot history is required for reproducible change analysis.',
          action: 'Run the scraper/seed pipeline to create an initial snapshot.',
        });
      }

      if (policy.changes.length > 0) {
        policiesWithChanges++;
      } else {
        addIssue('warning', {
          area: 'Coverage',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Policy has no AI change analysis',
          detail: 'No PolicyChange rows exist for this monitored policy.',
          action: 'Run a scan or seed an initial analysis so public views have assessment data.',
        });
      }

      const latestSnapshot = policy.snapshots[0];
      if (latestSnapshot && latestSnapshot.hash !== policy.currentHash) {
        hashFailureIds.add(latestSnapshot.id);
        addIssue('critical', {
          area: 'Hash Integrity',
          entityType: 'snapshot',
          entityId: latestSnapshot.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Latest snapshot does not match current policy hash',
          detail: `Latest snapshot version ${latestSnapshot.version} is not aligned with policy.currentHash.`,
          action: 'Reconcile current policy fields with the latest snapshot before publishing.',
        });
      }

      const versionsAsc = [...policy.snapshots].sort((a, b) => a.version - b.version);
      for (let i = 0; i < versionsAsc.length; i++) {
        const snapshot = versionsAsc[i];
        if (hashText(snapshot.text) !== snapshot.hash) {
          hashFailureIds.add(snapshot.id);
          addIssue('critical', {
            area: 'Hash Integrity',
            entityType: 'snapshot',
            entityId: snapshot.id,
            companyName: policy.companyName,
            policyName: policy.name,
            label: 'Snapshot hash mismatch',
            detail: `Snapshot version ${snapshot.version} hash does not match its text.`,
            action: 'Regenerate or quarantine the affected snapshot.',
          });
        }
        if (snapshot.version !== i + 1) {
          addIssue('warning', {
            area: 'Snapshot Chain',
            entityType: 'snapshot',
            entityId: snapshot.id,
            companyName: policy.companyName,
            policyName: policy.name,
            label: 'Snapshot version gap',
            detail: `Expected version ${i + 1}, found version ${snapshot.version}.`,
            action: 'Inspect historical imports and normalize version sequencing if needed.',
          });
        }
      }

      if (now - policy.updatedAt.getTime() > staleCutoffMs) {
        stalePolicyIds.add(policy.id);
        addIssue('warning', {
          area: 'Freshness',
          entityType: 'policy',
          entityId: policy.id,
          companyName: policy.companyName,
          policyName: policy.name,
          label: 'Policy scan is stale',
          detail: `Policy has not been updated in more than ${STALE_POLICY_DAYS} days.`,
          action: 'Run a fresh cron scan and verify the source page is reachable.',
        });
      }
    }

    let validJsonFields = 0;
    let totalJsonFields = 0;
    let assessedKpiCells = 0;
    let totalKpiCells = 0;
    let presentRegionImpacts = 0;
    const expectedRegionImpacts = changes.length * EXPECTED_REGION_IMPACTS.length;

    for (const change of changes) {
      if (!VALID_RISKS.has(change.overallRisk) || change.overallScore < 1 || change.overallScore > 10) {
        addIssue('critical', {
          area: 'Risk Scoring',
          entityType: 'change',
          entityId: change.id,
          companyName: change.companyName,
          policyName: change.policyName,
          label: 'Invalid risk score or label',
          detail: `Score=${change.overallScore}, risk=${change.overallRisk}.`,
          action: 'Re-run AI analysis or correct the affected PolicyChange row.',
        });
      } else if (expectedRisk(change.overallScore) !== change.overallRisk) {
        addIssue('warning', {
          area: 'Risk Scoring',
          entityType: 'change',
          entityId: change.id,
          companyName: change.companyName,
          policyName: change.policyName,
          label: 'Risk label does not match score band',
          detail: `Score ${change.overallScore} maps to ${expectedRisk(change.overallScore)}, but row stores ${change.overallRisk}.`,
          action: 'Normalize risk labels to keep filters and badges consistent.',
        });
      }

      if (!change.aiSummaryEn || !change.aiSummaryIt || change.aiSummaryEn.length < 80 || change.aiSummaryIt.length < 80) {
        addIssue('warning', {
          area: 'AI Analysis',
          entityType: 'change',
          entityId: change.id,
          companyName: change.companyName,
          policyName: change.policyName,
          label: 'AI summary is missing or too short',
          detail: 'Executive summaries should be present in both English and Italian.',
          action: 'Re-run Gemini analysis for this change.',
        });
      }

      if (!change.tldrEn || !change.tldrIt) {
        addIssue('warning', {
          area: 'AI Analysis',
          entityType: 'change',
          entityId: change.id,
          companyName: change.companyName,
          policyName: change.policyName,
          label: 'TL;DR is incomplete',
          detail: 'The public pages rely on concise bilingual takeaways.',
          action: 'Re-run analysis or backfill TL;DR fields.',
        });
      }

      for (const [fieldName, value] of [
        ['keyPointsJson', change.keyPointsJson],
        ['riskReasonsJson', change.riskReasonsJson],
        ['remediationsJson', change.remediationsJson],
      ] as const) {
        totalJsonFields++;
        const parsed = parseJsonArray(value);
        if (!parsed.valid) {
          addIssue('critical', {
            area: 'AI JSON',
            entityType: 'change',
            entityId: change.id,
            companyName: change.companyName,
            policyName: change.policyName,
            label: `Invalid ${fieldName}`,
            detail: 'Structured AI JSON could not be parsed as an array.',
            action: 'Regenerate structured AI output for this PolicyChange.',
          });
        } else if (parsed.count === 0) {
          addIssue('warning', {
            area: 'AI JSON',
            entityType: 'change',
            entityId: change.id,
            companyName: change.companyName,
            policyName: change.policyName,
            label: `Empty ${fieldName}`,
            detail: 'Structured AI JSON exists but has no items.',
            action: 'Backfill meaningful structured analysis items.',
          });
          validJsonFields++;
        } else {
          validJsonFields++;
        }
      }

      let assessedForChange = 0;
      for (const field of KPI_FIELDS) {
        totalKpiCells++;
        const value = (change as unknown as Record<string, string>)[field];
        if (value && value !== 'Not assessed') {
          assessedKpiCells++;
          assessedForChange++;
        }
      }
      if (assessedForChange < KPI_FIELDS.length) {
        addIssue('warning', {
          area: 'KPI Coverage',
          entityType: 'change',
          entityId: change.id,
          companyName: change.companyName,
          policyName: change.policyName,
          label: 'Incomplete KPI assessment',
          detail: `${assessedForChange}/${KPI_FIELDS.length} KPI fields are assessed.`,
          action: 'Re-run analysis with the structured KPI schema.',
        });
      }

      const impactKeys = new Set(
        change.regionImpacts.map((impact) => `${impact.region}:${impact.perspective}`)
      );
      for (const [region, perspective] of EXPECTED_REGION_IMPACTS) {
        if (impactKeys.has(`${region}:${perspective}`)) {
          presentRegionImpacts++;
        } else {
          addIssue('warning', {
            area: 'Region Impact',
            entityType: 'change',
            entityId: change.id,
            companyName: change.companyName,
            policyName: change.policyName,
            label: 'Missing regional impact',
            detail: `Missing ${region}/${perspective} analysis.`,
            action: 'Backfill the six expected region-perspective impact rows.',
          });
        }
      }

      for (const impact of change.regionImpacts) {
        if (!VALID_RISKS.has(impact.riskLevel) || !impact.impactAnalysisEn || !impact.impactAnalysisIt) {
          addIssue('warning', {
            area: 'Region Impact',
            entityType: 'change',
            entityId: change.id,
            companyName: change.companyName,
            policyName: change.policyName,
            label: 'Incomplete regional impact row',
            detail: `${impact.region}/${impact.perspective} is missing valid risk or bilingual analysis.`,
            action: 'Regenerate the regional impact for this change.',
          });
        }
      }
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const subscriber of subscribers) {
      if (!emailRe.test(subscriber.email)) {
        addIssue('warning', {
          area: 'Subscribers',
          entityType: 'subscriber',
          entityId: subscriber.id,
          label: 'Invalid subscriber email',
          detail: `${maskEmail(subscriber.email)} does not look like a valid email address.`,
          action: 'Correct or deactivate this subscriber record.',
        });
      }
      if (!subscriber.unsubscribeToken || subscriber.unsubscribeToken.length < 16) {
        addIssue('critical', {
          area: 'Subscribers',
          entityType: 'subscriber',
          entityId: subscriber.id,
          label: 'Missing unsubscribe token',
          detail: `${maskEmail(subscriber.email)} has no usable unsubscribe token.`,
          action: 'Regenerate the subscriber token before sending email.',
        });
      }
      if (!VALID_FREQUENCIES.has(subscriber.frequency)) {
        addIssue('warning', {
          area: 'Subscribers',
          entityType: 'subscriber',
          entityId: subscriber.id,
          label: 'Invalid subscriber frequency',
          detail: `${maskEmail(subscriber.email)} uses frequency "${subscriber.frequency}".`,
          action: 'Normalize frequency to INSTANT or WEEKLY.',
        });
      }

      const regions = subscriber.regions.split(',').map((region) => normalizePreferenceValue(region)).filter(Boolean);
      const industries = subscriber.industries.split(',').map((industry) => normalizePreferenceValue(industry)).filter(Boolean);
      if (regions.length === 0 || regions.some((region) => !VALID_SUBSCRIBER_REGIONS.has(region))) {
        addIssue('warning', {
          area: 'Subscribers',
          entityType: 'subscriber',
          entityId: subscriber.id,
          label: 'Invalid subscriber regions',
          detail: `${maskEmail(subscriber.email)} has unsupported region preferences.`,
          action: 'Normalize regions to EU, US, and/or Global.',
        });
      }
      if (industries.length === 0 || industries.some((industry) => !VALID_SUBSCRIBER_INDUSTRIES.has(industry))) {
        addIssue('warning', {
          area: 'Subscribers',
          entityType: 'subscriber',
          entityId: subscriber.id,
          label: 'Invalid subscriber industries',
          detail: `${maskEmail(subscriber.email)} has unsupported industry preferences.`,
          action: 'Normalize industries to the public subscription allowlist.',
        });
      }
    }

    const kpiCoveragePct = totalKpiCells
      ? Math.round((assessedKpiCells / totalKpiCells) * 1000) / 10
      : 0;
    const regionCoveragePct = expectedRegionImpacts
      ? Math.round((presentRegionImpacts / expectedRegionImpacts) * 1000) / 10
      : 0;
    const jsonCoveragePct = totalJsonFields
      ? Math.round((validJsonFields / totalJsonFields) * 1000) / 10
      : 0;

    const checks: GateCheck[] = [
      {
        id: 'inventory',
        label: 'Inventory',
        status: gateStatus(
          Number(companies.length > 0) + Number(policies.length > 0),
          2
        ),
        passed: Number(companies.length > 0) + Number(policies.length > 0),
        total: 2,
        detail: `${companies.length} companies and ${policies.length} policies loaded.`,
      },
      {
        id: 'url-hygiene',
        label: 'URL Hygiene',
        status: gateStatus(policies.length - invalidUrlPolicyIds.size, policies.length),
        passed: Math.max(policies.length - invalidUrlPolicyIds.size, 0),
        total: policies.length,
        detail: 'Public HTTP(S) source URLs without credentials or private hosts.',
      },
      {
        id: 'source-fit',
        label: 'Source Fit',
        status: gateStatus(policies.length - sourceFitIssueIds.size, policies.length),
        passed: Math.max(policies.length - sourceFitIssueIds.size, 0),
        total: policies.length,
        detail: 'Policy source URLs should match the declared jurisdiction and use canonical English/global sources where applicable.',
      },
      {
        id: 'snapshot-coverage',
        label: 'Snapshot Coverage',
        status: gateStatus(policiesWithSnapshots, policies.length),
        passed: policiesWithSnapshots,
        total: policies.length,
        detail: 'Each monitored policy should have at least one stored snapshot.',
      },
      {
        id: 'hash-integrity',
        label: 'Hash Integrity',
        status: gateStatus(policies.length + snapshots.length - hashFailureIds.size, policies.length + snapshots.length),
        passed: Math.max(policies.length + snapshots.length - hashFailureIds.size, 0),
        total: policies.length + snapshots.length,
        detail: 'Current policy text and snapshots must match their SHA-256 hashes.',
      },
      {
        id: 'freshness',
        label: 'Freshness',
        status: gateStatus(policies.length - stalePolicyIds.size, policies.length),
        passed: Math.max(policies.length - stalePolicyIds.size, 0),
        total: policies.length,
        detail: `Policies updated within the last ${STALE_POLICY_DAYS} days.`,
      },
      {
        id: 'ai-json',
        label: 'AI JSON',
        status: gateStatus(validJsonFields, totalJsonFields),
        passed: validJsonFields,
        total: totalJsonFields,
        detail: 'Structured key points, risk reasons, and remediations parse cleanly.',
      },
      {
        id: 'kpi-coverage',
        label: 'KPI Coverage',
        status: gateStatus(assessedKpiCells, totalKpiCells),
        passed: assessedKpiCells,
        total: totalKpiCells,
        detail: `${kpiCoveragePct}% of KPI cells are assessed.`,
      },
      {
        id: 'region-impact',
        label: 'Region Impact',
        status: gateStatus(presentRegionImpacts, expectedRegionImpacts),
        passed: presentRegionImpacts,
        total: expectedRegionImpacts,
        detail: `${regionCoveragePct}% of expected regional impact rows exist.`,
      },
      {
        id: 'policy-analysis',
        label: 'Policy Analysis',
        status: gateStatus(policiesWithChanges, policies.length),
        passed: policiesWithChanges,
        total: policies.length,
        detail: 'Each monitored policy should have at least one PolicyChange analysis.',
      },
    ];

    const qualityScore = Math.max(
      0,
      Math.min(100, 100 - counts.critical * 8 - counts.warning * 3 - counts.info)
    );
    const status: GateStatus =
      counts.critical > 0 || qualityScore < 75
        ? 'fail'
        : counts.warning > 0 || qualityScore < 95
          ? 'warn'
          : 'pass';

    const latestChangeAt = changes.reduce<Date | null>(
      (latest, change) => (!latest || change.createdAt > latest ? change.createdAt : latest),
      null
    );
    const latestPolicyUpdateAt = policies.reduce<Date | null>(
      (latest, policy) => (!latest || policy.updatedAt > latest ? policy.updatedAt : latest),
      null
    );

    return NextResponse.json({
      role: session.role,
      generatedAt: new Date().toISOString(),
      summary: {
        status,
        qualityScore,
        companies: companies.length,
        policies: policies.length,
        snapshots: snapshots.length,
        changes: changes.length,
        subscribers: subscribers.length,
        activeSubscribers: subscribers.filter((subscriber) => subscriber.isActive).length,
        criticalIssues: counts.critical,
        warningIssues: counts.warning,
        infoIssues: counts.info,
        returnedIssues: issues.length,
        maxIssuesReturned: MAX_ISSUES_RETURNED,
        stalePolicies: stalePolicyIds.size,
        hashFailures: hashFailureIds.size,
        kpiCoveragePct,
        regionCoveragePct,
        jsonCoveragePct,
        latestChangeAt,
        latestPolicyUpdateAt,
      },
      checks,
      areaSummary: Object.entries(areaCounts)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count),
      issues,
    });
  } catch (error) {
    console.error('[Admin Dataset Quality] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
