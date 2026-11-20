import { AUTHOR_PROFILES, PUBLIC_AUTHOR, PUBLIC_PUBLISHER, SOFTWARE_ID, SOURCE_CODE_ID } from './structuredData';
import { PRESS_KIT_LICENSE_URL, PRESS_KIT_RELEASE_DATE, PRESS_KIT_REPOSITORY_URL } from './pressKit';
import { POLICYWATCHER_RELEASE_NAME, POLICYWATCHER_VERSION } from './release';

export const PRESS_KIT_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://policywatcher.online/#software',
      name: 'PolicyWatcher',
      url: 'https://policywatcher.online/',
      applicationCategory: 'CivicTechnologyApplication',
      operatingSystem: 'Web',
      softwareVersion: POLICYWATCHER_VERSION,
      releaseNotes: 'https://policywatcher.online/roadmap',
      dateModified: PRESS_KIT_RELEASE_DATE,
      description: `${POLICYWATCHER_RELEASE_NAME} public policy evidence application. Outputs are evidence-gated and are not legal advice or compliance certification.`,
      license: PRESS_KIT_LICENSE_URL,
      image: 'https://policywatcher.online/press-kit/policywatcher-logo-square-1024.jpg',
      creator: PUBLIC_AUTHOR,
      provider: PUBLIC_PUBLISHER,
    },
    {
      ...PUBLIC_AUTHOR,
      sameAs: AUTHOR_PROFILES,
      email: 'mailto:info@policywatcher.online',
      image: 'https://policywatcher.online/press-kit/fabrizio-degni-portrait-200.png',
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': SOURCE_CODE_ID,
      name: 'PolicyWatcher source code',
      url: PRESS_KIT_REPOSITORY_URL,
      codeRepository: PRESS_KIT_REPOSITORY_URL,
      license: PRESS_KIT_LICENSE_URL,
      author: PUBLIC_AUTHOR,
      targetProduct: { '@id': SOFTWARE_ID },
    },
  ],
};
