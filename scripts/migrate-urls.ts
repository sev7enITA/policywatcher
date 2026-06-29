#!/usr/bin/env npx tsx
/**
 * URL Migration Script — Fix failing policy URLs
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
  oldUrlPart: string;     // partial match against current URL
  newUrl: string;
  reason: string;
}

const URL_UPDATES: UrlUpdate[] = [
  // ── Meta (http_400 → mbasic.facebook.com serves static HTML) ──
  {
    company: 'Meta',
    policyName: 'Privacy Policy',
    oldUrlPart: 'facebook.com/privacy/explanation',
    newUrl: 'https://mbasic.facebook.com/privacy/policy',
    reason: 'mbasic.facebook.com serves static HTML without JS/bot-blocking',
  },
  {
    company: 'Meta',
    policyName: 'Privacy Policy',
    oldUrlPart: 'facebook.com/privacy/policy',
    newUrl: 'https://mbasic.facebook.com/privacy/policy',
    reason: 'mbasic.facebook.com serves static HTML without JS/bot-blocking',
  },
  {
    company: 'Meta',
    policyName: 'Terms of Service',
    oldUrlPart: 'facebook.com/legal/terms',
    newUrl: 'https://mbasic.facebook.com/legal/terms',
    reason: 'mbasic.facebook.com serves static HTML without JS/bot-blocking',
  },

  // ── PayPal (captcha → legacy /webapps/mpp/ua/ path) ──
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

  // ── Wise (content_too_short → US locale serves SSR HTML) ──
  {
    company: 'Wise',
    policyName: 'Privacy Policy',
    oldUrlPart: 'wise.com/gb/legal/privacy-policy',
    newUrl: 'https://wise.com/us/legal/privacy-policy',
    reason: 'US locale serves SSR content (506KB text)',
  },
  {
    company: 'Wise',
    policyName: 'Terms of Use',
    oldUrlPart: 'wise.com/gb/legal/terms-of-use',
    newUrl: 'https://wise.com/us/legal/terms-of-use',
    reason: 'GB terms returned 404; US path works',
  },

  // ── Klarna (content_too_short → CDN serves static HTML) ──
  {
    company: 'Klarna',
    policyName: 'Privacy Notice',
    oldUrlPart: 'klarna.com/us/privacy',
    newUrl: 'https://cdn.klarna.com/1.0/shared/content/legal/terms/en-us/privacy',
    reason: 'CDN serves plain static HTML without Cloudflare (57KB text)',
  },
  {
    company: 'Klarna',
    policyName: 'Privacy Notice',
    oldUrlPart: 'klarna.com/it/privacy',
    newUrl: 'https://www.klarna.com/international/privacy-policy/',
    reason: 'International path serves SSR HTML (111KB text)',
  },
  {
    company: 'Klarna',
    policyName: 'Terms of Service',
    oldUrlPart: 'klarna.com/us/terms',
    newUrl: 'https://cdn.klarna.com/1.0/shared/content/legal/terms/en-us/terms',
    reason: 'CDN serves plain static HTML without Cloudflare',
  },
  {
    company: 'Klarna',
    policyName: 'Terms of Service',
    oldUrlPart: 'klarna.com/it/terms',
    newUrl: 'https://www.klarna.com/international/terms-and-conditions/',
    reason: 'International path serves SSR HTML',
  },

  // ── Plaid (captcha → /legal single page works) ──
  {
    company: 'Plaid',
    policyName: 'Privacy Policy',
    oldUrlPart: 'plaid.com/legal/#privacy',
    newUrl: 'https://plaid.com/legal',
    reason: 'Anchor-less /legal page returns 200 with 1MB text (no CAPTCHA)',
  },
  {
    company: 'Plaid',
    policyName: 'End User Services Agreement',
    oldUrlPart: 'plaid.com/legal/#end-user-services',
    newUrl: 'https://plaid.com/legal',
    reason: 'Anchor-less /legal page returns 200 with 1MB text (no CAPTCHA)',
  },

  // ── TikTok Community Guidelines (content_too_short → /legal/page/) ──
  {
    company: 'TikTok',
    policyName: 'Community Guidelines',
    oldUrlPart: 'tiktok.com/community-guidelines',
    newUrl: 'https://www.tiktok.com/legal/page/global/community-guidelines',
    reason: '/legal/page/ path serves SSR HTML (23KB text)',
  },

  // ── Amazon AWS DPA (404 → integrated into service-terms) ──
  {
    company: 'Amazon',
    policyName: 'AWS Data Processing Addendum',
    oldUrlPart: 'aws.amazon.com/compliance/data-processing-addendum',
    newUrl: 'https://aws.amazon.com/service-terms/',
    reason: 'DPA page was removed; now part of service-terms (908KB)',
  },
];

async function main() {
  console.log('\n🔧 PolicyWatcher — URL Migration\n');
  console.log(`${URL_UPDATES.length} URL updates to apply.\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const upd of URL_UPDATES) {
    // Find matching policy by URL substring
    const policy = await prisma.policy.findFirst({
      where: {
        url: { contains: upd.oldUrlPart },
      },
      include: { company: { select: { name: true } } },
    });

    if (!policy) {
      console.log(`⚠️  NOT FOUND: ${upd.company} / ${upd.policyName} (url contains "${upd.oldUrlPart}")`);
      notFound++;
      continue;
    }

    if (policy.url === upd.newUrl) {
      console.log(`⏭  SKIP: ${policy.company.name} / ${policy.name} — already updated`);
      skipped++;
      continue;
    }

    await prisma.policy.update({
      where: { id: policy.id },
      data: { url: upd.newUrl },
    });

    console.log(`✅ ${policy.company.name} / ${policy.name}`);
    console.log(`   ${policy.url}`);
    console.log(`   → ${upd.newUrl}`);
    console.log(`   (${upd.reason})\n`);
    updated++;
  }

  console.log('─'.repeat(50));
  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Not found: ${notFound}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
