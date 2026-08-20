import { db } from '@/lib/db';
import { dualWriteCanonicalEntity } from '@/lib/documentEvidenceSync';
import { runPolicyDiscoveryJob, startPolicyDiscovery } from '@/lib/policyDiscoveryWorkflow';

export interface CreateCompanyForOnboardingInput {
  name: string;
  slug: string;
  industry: string;
  website: string;
  logo?: string | null;
}

export type BackgroundScheduler = (task: () => Promise<void>) => void;

export function normalizeCompanySlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function validateCompanyWebsite(value: string): URL {
  let website: URL;
  try {
    website = new URL(value);
  } catch {
    throw new Error('INVALID_WEBSITE');
  }
  if (!['http:', 'https:'].includes(website.protocol)) throw new Error('INVALID_WEBSITE');
  website.hash = '';
  return website;
}

export async function createCompanyAndStartDiscovery(
  input: CreateCompanyForOnboardingInput,
  schedule: BackgroundScheduler
) {
  const name = input.name.trim().slice(0, 160);
  const slug = normalizeCompanySlug(input.slug || name);
  const industry = input.industry.trim().slice(0, 120);
  const website = validateCompanyWebsite(input.website).toString();
  if (!name || !slug || !industry) throw new Error('MISSING_COMPANY_FIELDS');

  const existing = await db.company.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) throw new Error('COMPANY_EXISTS');

  const company = await db.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: { name, slug, industry, website, logo: input.logo || null },
    });
    await dualWriteCanonicalEntity(tx, created.id);
    return created;
  });

  try {
    const discovery = await startPolicyDiscovery(company);
    if (discovery.claimed) {
      schedule(() => runPolicyDiscoveryJob(company, discovery.runToken));
    }
    return { company, discovery: discovery.job, discoveryError: null };
  } catch (error) {
    console.error('[Company onboarding] Company created but discovery could not start:', error);
    return {
      company,
      discovery: null,
      discoveryError: 'Policy discovery storage is unavailable. Apply database migrations, then retry discovery.',
    };
  }
}
