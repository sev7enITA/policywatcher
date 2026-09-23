import { POLICYWATCHER_RELEASE_DATE, POLICYWATCHER_VERSION } from '@/lib/release';
import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/siteOrigin';

export const HOME_TITLE = 'PolicyWatcher | Privacy, Terms & AI Policy Changes';
export const HOME_DESCRIPTION = 'Track privacy policy, terms of service and AI policy updates. Compare recorded versions, inspect sources and follow company policy changes with PolicyWatcher.';
export const HOME_CANONICAL_URL = `${POLICYWATCHER_CANONICAL_ORIGIN}/`;
export const HOME_SOCIAL_IMAGE_URL = `${POLICYWATCHER_CANONICAL_ORIGIN}/api/og/home`;

export const HOME_FAQS = [
  {
    question: 'What does PolicyWatcher monitor?',
    answer: 'PolicyWatcher monitors public company policy sources and publishes evidence-gated records only after a baseline and source references are available.',
  },
  {
    question: 'Can I verify a reported policy change?',
    answer: 'Yes. Public records link to the monitored company, policy, verified baseline and available canonical source so readers can inspect the evidence boundary.',
  },
  {
    question: 'Does PolicyWatcher provide legal advice?',
    answer: 'No. Automated screening and published evidence support independent review; they are not legal advice, certification or a compliance determination.',
  },
] as const;

export const HOME_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#website`,
      url: HOME_CANONICAL_URL,
      name: 'PolicyWatcher',
      description: HOME_DESCRIPTION,
      inLanguage: ['en', 'it'],
      publisher: { '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#organization`,
      name: 'PolicyWatcher',
      url: HOME_CANONICAL_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${POLICYWATCHER_CANONICAL_ORIGIN}/logo.png`,
      },
      email: 'info@policywatcher.online',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'public information',
        email: 'info@policywatcher.online',
        availableLanguage: ['English', 'Italian'],
      },
      founder: { '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#founder` },
      sameAs: ['https://github.com/sev7enITA/policywatcher'],
    },
    {
      '@type': 'Person',
      '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#founder`,
      name: 'Fabrizio Degni',
      url: `${POLICYWATCHER_CANONICAL_ORIGIN}/about`,
      sameAs: [
        'https://www.linkedin.com/in/fdegni/',
        'https://github.com/sev7enITA',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#software`,
      name: 'PolicyWatcher',
      url: HOME_CANONICAL_URL,
      description: HOME_DESCRIPTION,
      applicationCategory: 'CivicTechnologyApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      softwareVersion: POLICYWATCHER_VERSION,
      dateModified: POLICYWATCHER_RELEASE_DATE,
      image: HOME_SOCIAL_IMAGE_URL,
      creator: { '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#founder` },
      provider: { '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#organization` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${POLICYWATCHER_CANONICAL_ORIGIN}/#faq`,
      mainEntity: HOME_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
} as const;
