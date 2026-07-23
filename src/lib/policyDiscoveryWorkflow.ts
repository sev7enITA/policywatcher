import { db } from '@/lib/db';
import { discoverPolicySources } from '@/lib/policyDiscovery';
import {
  claimDiscoveryJob,
  completeDiscoveryJob,
  failDiscoveryJob,
} from '@/lib/policyDiscoveryJobs';
import { getErrorMessage } from '@/lib/safeErrors';

export interface DiscoveryCompany {
  id: string;
  name: string;
  website: string;
}

export async function runPolicyDiscoveryJob(
  company: DiscoveryCompany,
  runToken: string
) {
  try {
    const results = await discoverPolicySources(company);
    const existingPolicies = await db.policy.findMany({
      where: { companyId: company.id },
      select: { type: true, jurisdiction: true, url: true },
    });
    const existingKeys = new Set(
      existingPolicies.map((policy) => `${policy.type}|${policy.jurisdiction}|${policy.url}`)
    );
    let candidateCount = 0;

    for (const candidate of results) {
      const policyKey = `${candidate.type}|${candidate.jurisdiction}|${candidate.url}`;
      if (existingKeys.has(policyKey)) continue;

      const unique = {
        companyId_url_type_jurisdiction: {
          companyId: company.id,
          url: candidate.url,
          type: candidate.type,
          jurisdiction: candidate.jurisdiction,
        },
      };
      await db.policyDiscoveryCandidate.upsert({
        where: unique,
        create: {
          companyId: company.id,
          name: candidate.name,
          type: candidate.type,
          url: candidate.url,
          jurisdiction: candidate.jurisdiction,
          confidence: candidate.confidence,
          discoverySource: candidate.discoverySource,
          retrievalSource: candidate.retrievalSource,
          reason: candidate.reason,
          diagnosticsJson: JSON.stringify(candidate.diagnostics),
        },
        update: {
          name: candidate.name,
          confidence: candidate.confidence,
          discoverySource: candidate.discoverySource,
          retrievalSource: candidate.retrievalSource,
          reason: candidate.reason,
          diagnosticsJson: JSON.stringify(candidate.diagnostics),
        },
      });
      candidateCount++;
    }

    await completeDiscoveryJob(db, company.id, runToken, candidateCount);
  } catch (error) {
    console.error(`[Policy Discovery] ${company.name}:`, error);
    try {
      await failDiscoveryJob(db, company.id, runToken, getErrorMessage(error));
    } catch (persistenceError) {
      console.error(
        `[Policy Discovery] ${company.name}: failed to persist the terminal job state`,
        persistenceError
      );
    }
  }
}

export async function startPolicyDiscovery(company: DiscoveryCompany) {
  const claimed = await claimDiscoveryJob(db, company.id);
  return claimed;
}
