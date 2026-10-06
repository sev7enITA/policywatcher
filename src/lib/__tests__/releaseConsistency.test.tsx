import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChangelogModal from '@/components/ChangelogModal';
import { pressKitReleases } from '../pressKit';
import { FEATURE_ATLAS_FEATURES, FEATURE_ATLAS_RELEASES } from '../featureAtlas';
import { RELEASE_COLUMNS, RELEASE_IMPACT_ITEMS } from '../releaseImpact';
import { POLICYWATCHER_RELEASE_CHANNEL_LABEL, POLICYWATCHER_VERSION } from '../release';
import { publicSectionNodes, publicSectionEdges } from '../publicSections';

describe('public release consistency', () => {
  it('uses one current version across the release registers and package locks', () => {
    expect(pressKitReleases.filter(r => r.status === 'current').map(r => r.version)).toEqual([POLICYWATCHER_VERSION]);
    expect(FEATURE_ATLAS_RELEASES.filter(r => r.current).map(r => r.id)).toEqual([POLICYWATCHER_VERSION]);
    expect(RELEASE_COLUMNS.filter(r => r.state === 'current').map(r => r.id)).toEqual([POLICYWATCHER_VERSION]);
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    expect(lock.version).toBe(POLICYWATCHER_VERSION);
    expect(lock.packages[''].version).toBe(POLICYWATCHER_VERSION);
    expect(readFileSync('CHANGELOG.md', 'utf8').match(/^## (\S+)/m)?.[1]).toBe(POLICYWATCHER_VERSION);
  });

  it('keeps unique Atlas identities, valid dependencies and accurate current states', () => {
    const ids = FEATURE_ATLAS_FEATURES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const feature of FEATURE_ATLAS_FEATURES) {
      for (const dependency of feature.dependencies) expect(ids, feature.id).toContain(dependency.featureId);
      if (feature.state === 'current') expect(feature.releaseId, feature.id).toBe(POLICYWATCHER_VERSION);
    }
    for (const impact of RELEASE_IMPACT_ITEMS.filter(i => i.status === 'current')) {
      expect(impact.endRelease, impact.id).toBe(POLICYWATCHER_VERSION);
    }
    // Historical delivery retains the real version; it must not be relabelled as v5.
    expect(FEATURE_ATLAS_FEATURES.find(f => f.id === 'global-document-scope')?.releaseId).toBe('4.0.0-beta.5');
    expect(FEATURE_ATLAS_FEATURES.find(f => f.id === 'current-evidence-coverage')?.releaseId).toBe('4.0.0-beta.4');
  });

  it('exposes all six citizen steps with real section anchors and explicit boundaries', () => {
    const citizenSource = readFileSync('src/app/per-te/CitizenClient.tsx', 'utf8');
    const steps = ['citizen-service-following', 'citizen-public-feed', 'citizen-official-guides', 'citizen-local-choices', 'citizen-notice-matching', 'citizen-support-draft'];
    for (const id of steps) {
      const feature = FEATURE_ATLAS_FEATURES.find(f => f.id === id);
      expect(feature?.releaseId, id).toBe(POLICYWATCHER_VERSION);
      expect(feature?.limitation.length, id).toBeGreaterThan(40);
      expect(citizenSource, id).toContain(`id="${feature?.route?.href.split('#')[1]}"`);
    }
    const ids = publicSectionNodes.map(n => n.id);
    expect(ids).toContain('per-te');
    expect(ids).toContain('changelog');
    for (const edge of publicSectionEdges) {
      expect(ids).toContain(edge.from);
      expect(ids).toContain(edge.to);
    }
  });

  it.each(['en', 'it'] as const)('renders the current release first in the %s changelog', lang => {
    const html = renderToStaticMarkup(<ChangelogModal isOpen onClose={() => {}} lang={lang} />);
    const current = pressKitReleases.find(r => r.status === 'current')!;
    expect(html).toContain(current.title[lang]);
    expect(html).toContain(POLICYWATCHER_RELEASE_CHANNEL_LABEL);
    expect(html.indexOf(POLICYWATCHER_VERSION)).toBeLessThan(html.indexOf('4.0.0 Beta 5'));
    expect(html).toContain(lang === 'it' ? 'Release storica' : 'Historical release');
    expect(html).toContain(lang === 'it' ? 'Nessuna' : 'No push');
    expect(html).toContain(`lang=${lang}`);
    expect(html).not.toMatch(/Current Beta|Q3 2026|Q4 2026|KPI Compliance Matrix/);
    expect(html).toContain('<dialog');
  });
});

describe('release archive language handoff', () => {
  it.each(['en', 'it'] as const)('preserves %s from the changelog through the archive and detail', async lang => {
    const { default: ArchivePage, generateMetadata: archiveMetadata } = await import('@/app/press-kit/releases/page');
    const { default: DetailPage, generateMetadata: detailMetadata } = await import('@/app/press-kit/releases/[slug]/page');
    const { publicRequestLanguage } = await import('../seo');
    const release = pressKitReleases.find(r => r.status === 'current')!;
    const props = { params: Promise.resolve({ slug: release.slug }), searchParams: Promise.resolve({ lang }) };
    const archive = await ArchivePage(props);
    expect(archive.props.initialLang).toBe(lang);
    const archiveHtml = renderToStaticMarkup(archive);
    expect(archiveHtml).toContain(lang === 'it' ? 'Release prodotto datate.' : 'Dated product releases.');
    expect(archiveHtml).toContain(`/press-kit/releases/${release.slug}${lang === 'it' ? '?lang=it' : ''}`);
    const detailHtml = renderToStaticMarkup(await DetailPage(props));
    expect(detailHtml).toContain(release.summary[lang]);
    expect(detailHtml).toContain(`"inLanguage":"${lang}"`);
    expect((await detailMetadata(props)).description).toBe(release.summary[lang]);
    const expectedLocale = lang === 'it' ? 'it_IT' : 'en_US';
    expect((await archiveMetadata(props)).openGraph?.locale).toBe(expectedLocale);
    expect((await detailMetadata(props)).alternates?.canonical).toBe(`https://policywatcher.online/press-kit/releases/${release.slug}${lang === 'it' ? '?lang=it' : ''}`);
    expect(publicRequestLanguage(`/press-kit/releases/${release.slug}`, lang)).toBe(lang);
  });
});
