#!/usr/bin/env npx tsx
/**
 * URL Migration Script - Fix failing policy URLs
 *
 * Usage:
 *   npx tsx scripts/migrate-urls.ts
 *
 * Updates policy URLs in the database to use working alternatives
 * based on real-world testing (June 2026).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UrlUpdate {
  company: string;
  policyName: string;
  jurisdictions?: string[];
  oldUrlPart: string;     // partial match against current URL
  newUrl: string;
  reason: string;
}

interface MigrationResult {
  updated: number;
  skipped: number;
  notFound: number;
}

const URL_UPDATES: UrlUpdate[] = [
  // Microsoft: privacy.microsoft.com redirects to www.microsoft.com and was
  // rejected by host-drift protection; use the official final hosts.
  {
    company: 'Microsoft',
    policyName: 'Privacy Statement',
    jurisdictions: ['EU'],
    oldUrlPart: 'privacy.microsoft.com/it-it/privacystatement',
    newUrl: 'https://www.microsoft.com/en-gb/privacy/privacystatement',
    reason: 'Official final Microsoft Privacy Statement URL; avoids host-drift rejection',
  },
  {
    company: 'Microsoft',
    policyName: 'Privacy Statement',
    jurisdictions: ['US'],
    oldUrlPart: 'privacy.microsoft.com/en-us/privacystatement',
    newUrl: 'https://www.microsoft.com/en-us/privacy/privacystatement',
    reason: 'Official final Microsoft Privacy Statement URL; avoids host-drift rejection',
  },
  {
    company: 'Microsoft',
    policyName: 'Privacy Statement',
    jurisdictions: ['Global'],
    oldUrlPart: 'privacy.microsoft.com/en/privacystatement',
    newUrl: 'https://www.microsoft.com/en-us/privacy/privacystatement',
    reason: 'Official Microsoft Privacy Statement baseline; legacy /en path is not a fetchable final URL',
  },

  // Zoom: explore.zoom.us redirects to zoom.com and was rejected by
  // host-drift protection; use current official trust-center URLs.
  {
    company: 'Zoom',
    policyName: 'Privacy Statement',
    oldUrlPart: 'explore.zoom.us/en/privacy',
    newUrl: 'https://www.zoom.com/en/trust/privacy/privacy-statement/',
    reason: 'Current official Zoom Trust Center privacy URL',
  },
  {
    company: 'Zoom',
    policyName: 'Terms of Service',
    oldUrlPart: 'explore.zoom.us/en/terms',
    newUrl: 'https://www.zoom.com/en/trust/terms/',
    reason: 'Current official Zoom Trust Center terms URL',
  },

  // Meta: mbasic.facebook.com was DISCONTINUED by Meta in 2024: it now
  // returns HTTP 400 even over HTTP/2. The www pages are SPAs and are
  // recovered by the rendered-fetch strategy via the VPS renderer.
  {
    company: 'Meta',
    policyName: 'Privacy Policy',
    oldUrlPart: 'facebook.com/privacy/explanation',
    newUrl: 'https://www.facebook.com/privacy/policy/',
    reason: 'mbasic discontinued (HTTP 400); www SPA handled by renderer strategy',
  },
  {
    company: 'Meta',
    policyName: 'Privacy Policy',
    oldUrlPart: 'mbasic.facebook.com/privacy/policy',
    newUrl: 'https://www.facebook.com/privacy/policy/',
    reason: 'mbasic discontinued (HTTP 400); www SPA handled by renderer strategy',
  },
  {
    company: 'Meta',
    policyName: 'Terms of Service',
    oldUrlPart: 'mbasic.facebook.com/legal/terms',
    newUrl: 'https://www.facebook.com/legal/terms',
    reason: 'mbasic discontinued (HTTP 400); www SPA handled by renderer strategy',
  },

  // PayPal: captcha to legacy /webapps/mpp/ua/ path.
  {
    company: 'PayPal',
    policyName: 'Privacy Statement',
    oldUrlPart: 'paypal.com/us/legalhub/paypal/privacy-full',
    newUrl: 'https://www.paypal.com/us/webapps/mpp/ua/privacy-full',
    reason: 'Legacy path bypasses CAPTCHA on datacenter IPs',
  },
  {
    company: 'PayPal',
    policyName: 'Privacy Statement',
    oldUrlPart: 'paypal.com/lu/legalhub/paypal/privacy-full',
    newUrl: 'https://www.paypal.com/lu/webapps/mpp/ua/privacy-full',
    reason: 'Legacy path bypasses CAPTCHA on datacenter IPs',
  },

  // Wise: content_too_short to US locale serves SSR HTML.
  {
    company: 'Wise',
    policyName: 'Privacy Policy',
    jurisdictions: ['EU', 'Global'],
    oldUrlPart: 'wise.com/gb/legal/privacy-policy',
    newUrl: 'https://wise.com/gb/legal/privacy-notice-personal-en',
    reason: 'Official Wise personal privacy notice applies globally and includes country-specific provisions',
  },
  {
    company: 'Wise',
    policyName: 'Privacy Policy',
    jurisdictions: ['US'],
    oldUrlPart: 'wise.com/gb/legal/privacy-policy',
    newUrl: 'https://wise.com/us/legal/privacy-policy',
    reason: 'US policy record should use the US-specific Wise privacy source',
  },
  {
    company: 'Wise',
    policyName: 'Terms of Use',
    oldUrlPart: 'wise.com/gb/legal/terms-of-use',
    newUrl: 'https://wise.com/us/legal/terms-of-use',
    reason: 'GB terms returned 404; US path works',
  },

  // Klarna: replace broad/international or stale CDN paths with current
  // market sources; EU terms remains suspended if the source body is too
  // short for evidence-grade publication.
  {
    company: 'Klarna',
    policyName: 'Privacy Notice',
    oldUrlPart: 'klarna.com/us/privacy',
    newUrl: 'https://www.klarna.com/us/privacy/',
    reason: 'Official US privacy page is directly fetchable',
  },
  {
    company: 'Klarna',
    policyName: 'Privacy Notice',
    jurisdictions: ['US'],
    oldUrlPart: 'cdn.klarna.com/1.0/shared/content/legal/terms/en-us/privacy',
    newUrl: 'https://www.klarna.com/us/privacy/',
    reason: 'Replace previous CDN workaround with official US privacy page',
  },
  {
    company: 'Klarna',
    policyName: 'Privacy Notice',
    jurisdictions: ['EU'],
    oldUrlPart: 'klarna.com/international/privacy-policy',
    newUrl: 'https://www.klarna.com/ie/privacy/',
    reason: 'Official English EU/Ireland privacy page is directly fetchable',
  },
  {
    company: 'Klarna',
    policyName: 'Terms of Service',
    oldUrlPart: 'klarna.com/us/terms',
    newUrl: 'https://www.klarna.com/us/terms-of-use/',
    reason: 'Official US terms page replaces stale CDN URL',
  },
  {
    company: 'Klarna',
    policyName: 'Terms of Service',
    jurisdictions: ['US'],
    oldUrlPart: 'cdn.klarna.com/1.0/shared/content/legal/terms/en-us/terms',
    newUrl: 'https://www.klarna.com/us/terms-of-use/',
    reason: 'Replace previous CDN workaround with official US terms page',
  },
  {
    company: 'Klarna',
    policyName: 'Terms of Service',
    jurisdictions: ['EU'],
    oldUrlPart: 'klarna.com/international/terms-and-conditions',
    newUrl: 'https://www.klarna.com/ie/terms-and-conditions/',
    reason: 'Official English EU/Ireland terms page; QA will suspend if the returned body is too short',
  },

  // Plaid: the /legal hub is too broad; anchor-scoped extraction keeps the
  // monitored evidence to the intended legal section.
  {
    company: 'Plaid',
    policyName: 'Privacy Policy',
    jurisdictions: ['US', 'EU'],
    oldUrlPart: 'plaid.com/legal',
    newUrl: 'https://plaid.com/legal#end-user-privacy-policy',
    reason: 'Anchor-scoped End User Privacy Policy prevents full legal-hub partial captures',
  },
  {
    company: 'Plaid',
    policyName: 'End User Services Agreement',
    jurisdictions: ['US'],
    oldUrlPart: 'plaid.com/legal',
    newUrl: 'https://plaid.com/legal#end-user-services-agreement-us',
    reason: 'Anchor-scoped US EUSA prevents full legal-hub partial captures',
  },
  {
    company: 'Plaid',
    policyName: 'End User Services Agreement',
    jurisdictions: ['EU'],
    oldUrlPart: 'plaid.com/legal',
    newUrl: 'https://plaid.com/legal#end-user-services-agreement-eea',
    reason: 'Anchor-scoped EEA EUSA prevents full legal-hub partial captures',
  },

  // TikTok Community Guidelines: content_too_short to /legal/page/.
  {
    company: 'TikTok',
    policyName: 'Community Guidelines',
    oldUrlPart: 'tiktok.com/community-guidelines',
    newUrl: 'https://www.tiktok.com/legal/page/global/community-guidelines',
    reason: '/legal/page/ path serves SSR HTML (23KB text)',
  },

  // Amazon AWS DPA: service-terms is too broad; use focused AWS DPA source.
  {
    company: 'Amazon',
    policyName: 'AWS Data Processing Addendum',
    oldUrlPart: 'aws.amazon.com/compliance/data-processing-addendum',
    newUrl: 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html',
    reason: 'Focused AWS DPA documentation avoids broad service-terms partial capture',
  },
  {
    company: 'Amazon',
    policyName: 'AWS Data Processing Addendum',
    oldUrlPart: 'aws.amazon.com/service-terms',
    newUrl: 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html',
    reason: 'Focused AWS DPA documentation avoids broad service-terms partial capture',
  },

  // Revolut: the previous EU and UK records pointed at the same generic
  // UK/default paths. Split the configured sources by market. Revolut may
  // still challenge automated retrieval; these URL updates are remediation
  // candidates, not proof that the source is publishable.
  {
    company: 'Revolut',
    policyName: 'Privacy Policy',
    jurisdictions: ['EU'],
    oldUrlPart: 'revolut.com/legal/privacy',
    newUrl: 'https://www.revolut.com/en-LT/legal/privacy/',
    reason: 'Region-specific EEA Customer Privacy Notice; provider protection may require official PDF or traced admin review',
  },
  {
    company: 'Revolut',
    policyName: 'Privacy Policy',
    jurisdictions: ['UK'],
    oldUrlPart: 'revolut.com/legal/privacy',
    newUrl: 'https://www.revolut.com/legal/privacy/',
    reason: 'Official UK Customer Privacy Notice; provider protection may require official PDF or traced admin review',
  },
  {
    company: 'Revolut',
    policyName: 'Terms of Use',
    jurisdictions: ['EU'],
    oldUrlPart: 'revolut.com/legal/terms',
    newUrl: 'https://www.revolut.com/en-LT/legal/terms/',
    reason: 'Region-specific EEA Personal Terms; provider protection may require official PDF or traced admin review',
  },
  {
    company: 'Revolut',
    policyName: 'Terms of Use',
    jurisdictions: ['UK'],
    oldUrlPart: 'revolut.com/legal/terms',
    newUrl: 'https://www.revolut.com/legal/terms/',
    reason: 'Official UK Personal Terms; provider protection may require official PDF or traced admin review',
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('\nPolicyWatcher URL Migration\n');
  console.log(`${URL_UPDATES.length} URL updates to apply.\n`);
  if (dryRun) {
    console.log('DRY RUN: no database rows will be changed.\n');
  }

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const upd of URL_UPDATES) {
    const result = await applyUrlUpdate(upd, dryRun);
    updated += result.updated;
    skipped += result.skipped;
    notFound += result.notFound;
  }

  console.log('-'.repeat(50));
  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Not found: ${notFound}`);
  console.log('');

  await prisma.$disconnect();
}

async function applyUrlUpdate(upd: UrlUpdate, dryRun: boolean): Promise<MigrationResult> {
  // Scope by company and policy name first, then match either the old URL
  // fragment or the already-migrated URL. This keeps the migration idempotent
  // and prevents a shared URL fragment from updating the wrong company/policy.
  const policies = await prisma.policy.findMany({
    where: {
      company: { name: upd.company },
      name: upd.policyName,
      ...(upd.jurisdictions ? { jurisdiction: { in: upd.jurisdictions } } : {}),
      OR: [
        { url: { contains: upd.oldUrlPart } },
        { url: upd.newUrl },
      ],
    },
    include: {
      company: { select: { name: true } },
      snapshots: {
        where: { publicEvidence: true },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [
      { jurisdiction: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  if (policies.length === 0) {
    console.log(`[NOT FOUND] ${upd.company} / ${upd.policyName} (url contains "${upd.oldUrlPart}")`);
    return { updated: 0, skipped: 0, notFound: 1 };
  }

  let updated = 0;
  let skipped = 0;

  for (const policy of policies) {
    const label = `${policy.company.name} / ${policy.name} / ${policy.jurisdiction}`;

    if (policy.url === upd.newUrl) {
      console.log(`[SKIP] ${label} - already updated`);
      skipped++;
      continue;
    }

    if (!policy.url.includes(upd.oldUrlPart)) {
      // Defensive guard in case the query is expanded in the future.
      console.log(`[SKIP] ${label} - URL does not match expected source fragment`);
      console.log(`   current: ${policy.url}`);
      skipped++;
      continue;
    }

    if (!dryRun) {
      const nextStatus = policy.snapshots.length > 0 ? 'Needs Review' : 'Configured';
      await prisma.$transaction([
        prisma.policy.update({
          where: { id: policy.id },
          data: {
            url: upd.newUrl,
            dataStatus: nextStatus,
          },
        }),
        prisma.policyCheckLog.create({
          data: {
            policyId: policy.id,
            status: nextStatus,
            source: 'source_remediation',
            reason: 'source_url_remediation',
            finalUrl: upd.newUrl,
          },
        }),
      ]);
    }

    console.log(`[${dryRun ? 'DRY' : 'UPDATE'}] ${label}`);
    console.log(`   ${policy.url}`);
    console.log(`   -> ${upd.newUrl}`);
    console.log(`   (${upd.reason})\n`);
    updated++;
  }

  return { updated, skipped, notFound: 0 };
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
