import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { DATA_STATUSES, isDataStatus } from '../src/lib/policyConfidence';
import { isSeededIngestionMethod } from '../src/lib/publicDataGate';

const prisma = new PrismaClient();

type Severity = 'blocker' | 'warning';

interface Finding {
  severity: Severity;
  area: string;
  entity: string;
  detail: string;
}

const ALLOWED_RISK_REASON_ICONS = new Set(['alert', 'warning', 'info']);

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/#.*$/, '').replace(/\/+$/, '');
}

function addFinding(
  findings: Finding[],
  severity: Severity,
  area: string,
  entity: string,
  detail: string
) {
  findings.push({ severity, area, entity, detail });
}

async function main() {
  const policies = await prisma.policy.findMany({
    include: {
      snapshots: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          text: true,
          hash: true,
          publicEvidence: true,
          createdAt: true,
        },
      },
      checkLogs: {
        orderBy: { checkedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          checkedAt: true,
          source: true,
          reason: true,
          textHash: true,
          textLength: true,
          archiveTimestamp: true,
        },
      },
      company: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
  });

  const findings: Finding[] = [];

  if (policies.length === 0) {
    addFinding(findings, 'blocker', 'inventory', 'dataset', 'No policies are present.');
  }

  for (const policy of policies) {
    const label = `${policy.company.name} / ${policy.name} / ${policy.jurisdiction}`;
    const currentHash = hashText(policy.currentText);
    const seededRecord = isSeededIngestionMethod(policy.ingestionMethod);

    if (seededRecord) {
      addFinding(
        findings,
        'blocker',
        'source-evidence',
        label,
        'Policy is backed by seeded/demo text. Run a verified scan before using it in public confidence views.'
      );
    }

    if (!isDataStatus(policy.dataStatus)) {
      addFinding(
        findings,
        'blocker',
        'confidence-status',
        label,
        `Unsupported dataStatus "${policy.dataStatus}". Expected one of ${DATA_STATUSES.join(', ')}.`
      );
    }

    if (currentHash !== policy.currentHash) {
      addFinding(
        findings,
        'blocker',
        'hash-integrity',
        label,
        `currentHash does not match currentText. expected=${currentHash} actual=${policy.currentHash}`
      );
    }

    if (policy.snapshots.length === 0) {
      addFinding(findings, 'blocker', 'snapshot-coverage', label, 'No snapshots found.');
    } else {
      const latestSnapshot = policy.snapshots[0];
      const hasPublicSnapshot = policy.snapshots.some((snapshot) => snapshot.publicEvidence);
      if (!hasPublicSnapshot) {
        addFinding(
          findings,
          'blocker',
          'public-evidence',
          label,
          'No snapshot is marked publicEvidence. This policy must remain hidden or suspended from public views.'
        );
      }
      if (latestSnapshot.hash !== policy.currentHash) {
        addFinding(
          findings,
          'blocker',
          'snapshot-chain',
          label,
          `Latest snapshot hash does not match policy currentHash. latestVersion=${latestSnapshot.version}`
        );
      }
    }

    for (const snapshot of policy.snapshots) {
      const snapshotHash = hashText(snapshot.text);
      if (snapshotHash !== snapshot.hash) {
        addFinding(
          findings,
          'blocker',
          'snapshot-hash',
          `${label} v${snapshot.version}`,
          `Snapshot hash mismatch. expected=${snapshotHash} actual=${snapshot.hash}`
        );
      }
    }

    if (policy.checkLogs.length === 0) {
      addFinding(findings, 'blocker', 'check-log', label, 'No PolicyCheckLog row found.');
    } else {
      const latestLog = policy.checkLogs[0];
      if (!isDataStatus(latestLog.status)) {
        addFinding(
          findings,
          'blocker',
          'check-log',
          label,
          `Latest check log has unsupported status "${latestLog.status}".`
        );
      }
      if (latestLog.status !== policy.dataStatus) {
        addFinding(
          findings,
          'warning',
          'check-log',
          label,
          `Latest check log status (${latestLog.status}) differs from policy dataStatus (${policy.dataStatus}).`
        );
      }
      if (isSeededIngestionMethod(latestLog.source)) {
        addFinding(
          findings,
          'blocker',
          'source-evidence',
          label,
          'Latest PolicyCheckLog source is seeded, not direct/http2/rendered/wayback/commoncrawl.'
        );
      }
      if (latestLog.textHash && latestLog.textHash !== policy.currentHash) {
        addFinding(
          findings,
          'warning',
          'check-log',
          label,
          'Latest check log textHash differs from currentHash.'
        );
      }
      if (latestLog.textLength && latestLog.textLength !== policy.currentText.length) {
        addFinding(
          findings,
          'warning',
          'check-log',
          label,
          'Latest check log textLength differs from currentText length.'
        );
      }
      if (
        latestLog.status === 'Available' &&
        (latestLog.source === 'wayback' || latestLog.source === 'commoncrawl') &&
        !latestLog.archiveTimestamp
      ) {
        addFinding(
          findings,
          'blocker',
          'archive-evidence',
          label,
          `Latest ${latestLog.source} check is Available but archiveTimestamp is missing.`
        );
      }
      if (
        latestLog.status === 'Available' &&
        (latestLog.textLength === 200_000 || latestLog.reason === 'text_truncated_at_max_length')
      ) {
        addFinding(
          findings,
          'blocker',
          'extraction-completeness',
          label,
          'Latest Available check appears truncated at the 200k storage cap.'
        );
      }
    }

    if (!policy.lastCheckDate) {
      addFinding(findings, 'blocker', 'timestamps', label, 'Missing lastCheckDate.');
    }

    if ((policy.dataStatus === 'Available' || policy.dataStatus === 'Reviewed') && !policy.lastSuccessfulCheckDate) {
      addFinding(
        findings,
        'blocker',
        'timestamps',
        label,
        'Available/Reviewed policy has no lastSuccessfulCheckDate.'
      );
    }
  }

  const urlGroups = new Map<string, string[]>();
  for (const policy of policies) {
    const normalizedUrl = normalizeUrl(policy.url);
    const entries = urlGroups.get(normalizedUrl) ?? [];
    entries.push(`${policy.company.name} / ${policy.name} / ${policy.jurisdiction}`);
    urlGroups.set(normalizedUrl, entries);
  }

  for (const [url, entries] of urlGroups) {
    if (entries.length > 1) {
      addFinding(
        findings,
        'warning',
        'url-duplicates',
        url,
        `Multiple policies share this normalized URL: ${entries.join('; ')}. Confirm this is an intentional legal-hub mapping.`
      );
    }
  }

  const changes = await prisma.policyChange.findMany({
    select: {
      id: true,
      publicEvidence: true,
      riskReasonsJson: true,
      policy: {
        select: {
          name: true,
          jurisdiction: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  for (const change of changes) {
    const label = `${change.policy.company.name} / ${change.policy.name} / ${change.policy.jurisdiction} / ${change.id}`;
    if (!change.publicEvidence) {
      addFinding(
        findings,
        'warning',
        'public-evidence',
        label,
        'PolicyChange is retained for admin review but hidden from public evidence.'
      );
    }
    if (!change.riskReasonsJson) {
      addFinding(findings, 'warning', 'ai-json', label, 'Missing riskReasonsJson.');
      continue;
    }

    try {
      const parsed = JSON.parse(change.riskReasonsJson);
      if (!Array.isArray(parsed)) {
        addFinding(findings, 'blocker', 'ai-json', label, 'riskReasonsJson is not an array.');
        continue;
      }

      for (const [index, reason] of parsed.entries()) {
        if (!reason || typeof reason !== 'object') {
          addFinding(findings, 'blocker', 'ai-json', label, `Risk reason at index ${index} is not an object.`);
          continue;
        }

        const icon = String(reason.icon ?? '');
        if (!ALLOWED_RISK_REASON_ICONS.has(icon)) {
          addFinding(
            findings,
            'blocker',
            'ai-json',
            label,
            `Risk reason at index ${index} has unsupported icon "${icon}". Expected alert, warning, or info.`
          );
        }
      }
    } catch {
      addFinding(findings, 'blocker', 'ai-json', label, 'riskReasonsJson is not valid JSON.');
    }
  }

  const blockers = findings.filter((finding) => finding.severity === 'blocker');
  const warnings = findings.filter((finding) => finding.severity === 'warning');
  const status = blockers.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

  const report = {
    status,
    generatedAt: new Date().toISOString(),
    policies: policies.length,
    blockers: blockers.length,
    warnings: warnings.length,
    findings,
  };

  console.log(JSON.stringify(report, null, 2));

  if (blockers.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Dataset assurance failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
