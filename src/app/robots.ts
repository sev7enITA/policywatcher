import type { MetadataRoute } from 'next';
import { POLICYWATCHER_ORIGIN } from '@/lib/publicKnowledge';

const disallowedRoutes = [
  '/admin',
  '/api/admin',
  '/api/cron',
  '/api/chat',
  '/api/scrape',
  '/api/seed',
  '/api/subscribe',
  '/api/subscribers',
  '/api/press-metrics',
  '/api/policy-inquiries',
  '/api/policies',
  '/api/report',
  '/api/compare',
  '/api/matrix',
  '/api/tts',
  '/api/v2',
];

const publicRules = { allow: '/', disallow: disallowedRoutes };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', ...publicRules },
      { userAgent: 'OAI-SearchBot', ...publicRules },
      { userAgent: 'PerplexityBot', ...publicRules },
    ],
    sitemap: `${POLICYWATCHER_ORIGIN}/sitemap.xml`,
    host: POLICYWATCHER_ORIGIN,
  };
}
