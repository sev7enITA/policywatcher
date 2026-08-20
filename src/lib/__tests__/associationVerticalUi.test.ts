import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('consumer-association public workspace wiring', () => {
  it('renders localized routes from the public evidence gate with explicit failure handling', () => {
    const legacy = read('src/app/associazioni/page.tsx');
    const page = read('src/app/associazioni/LocalizedAssociationsPage.tsx');
    const italian = read('src/app/it/associazioni/page.tsx');
    const english = read('src/app/en/associations/page.tsx');
    const data = read('src/lib/evidencePacketData.ts');

    expect(legacy).toContain("permanentRedirect('/it/associazioni')");
    expect(page).toContain('listPublicEvidencePacketSummaries(50)');
    expect(page).toContain('buildAssociationRadarItems');
    expect(page).toContain('catalogUnavailable = true');
    expect(page).toContain('lang === \'it\' ? record.summaryIt : record.summary');
    expect(page).toContain('<PublicHeader current="associations" lang={lang} lockLang />');
    expect(page).toContain('<Footer lang={lang} lockLang />');
    expect(page).toContain('serializeJsonLd');
    expect(page).toContain("'x-default'");
    expect(italian).toContain('buildAssociationsMetadata(\'it\')');
    expect(english).toContain('buildAssociationsMetadata(\'en\')');
    expect(data).toContain('tldrIt: true');
    expect(data).toContain('aiSummaryIt: true');
    expect(data).toContain('summaryIt: change.tldrIt || change.aiSummaryIt');
    expect(data).toContain('where: publicChangeWhere(');
  });

  it('keeps watchlist and review workflow bounded to the browser', () => {
    expect(existsSync('src/app/associazioni/AssociationsClient.tsx')).toBe(true);
    const client = read('src/app/associazioni/AssociationsClient.tsx');

    expect(client).toContain('ASSOCIATION_REVIEW_STORAGE_KEY');
    expect(client).toContain('ASSOCIATION_WATCHLIST_STORAGE_KEY');
    expect(client).toContain('localStorage');
    expect(client).toContain('buildAssociationDigestMarkdown');
    expect(client).toContain('matchesAssociationContext');
    expect(client).toContain('Paese o area');
    expect(client).toContain('Country or region');
    expect(client).toContain('Area normativa');
    expect(client).toContain('Tipo di associazione');
    expect(client).toContain('non deduce coperture locali');
    expect(client).toContain('catalogUnavailable');
    expect(client).toContain('<AddToCollectionButton');
    expect(client).toContain('lang={lang}');
    expect(client).toContain("href=\"/what-changed\"");
    expect(client).toContain("href=\"/collections\"");
    expect(client).not.toMatch(/fetch\(['"]\/api\/admin/i);

    const directory = read('src/app/associazioni/CivicDirectory.tsx');
    expect(directory).toContain('buildCivicDirectorySearch');
    expect(directory).toContain('copyDirectoryLink');
    expect(directory).toContain('id="segnala-associazione"');
    expect(directory).toContain('buildCivicCorrectionMailto');
    expect(directory).toContain('Organizations may submit their own listing');
    expect(directory).toContain('Report a correction');
    expect(existsSync('public/infographics/policywatcher-civic-5w-global-directory-2026-08-18-v3.png')).toBe(true);
    expect(existsSync('public/infographics/policywatcher-civic-technical-coverage-2026-08-18-v3.png')).toBe(true);
    expect(existsSync('public/infographics/policywatcher-civic-editorial-workflow-2026-08-18.png')).toBe(true);
    expect(existsSync('public/infographics/policywatcher-civic-editorial-workflow-2026-08-18.svg')).toBe(true);
    expect(existsSync('public/infographics/policywatcher-civic-world-coverage-map-2026-08-18.png')).toBe(true);
    expect(existsSync('public/infographics/policywatcher-civic-world-coverage-map-2026-08-18.svg')).toBe(true);

    const infographics = read('src/app/infographics/page.tsx');
    expect(infographics).toContain('A descriptive Day 0-Day 10 sequence');
    expect(infographics).toContain('Marker positions');
  });

  it('makes the vertical discoverable from the public graph and machine index', () => {
    const header = read('src/components/PublicHeader.tsx');
    const footer = read('src/components/Footer.tsx');
    const sitemap = read('src/app/sitemap.ts');
    const atlas = read('src/lib/publicSections.ts');
    const llms = read('src/app/llms.txt/route.ts');

    expect(header).toContain("{ id: 'associations', href: '/en/associations'");
    expect(footer).toContain("activeLang === 'it' ? '/it/associazioni' : '/en/associations'");
    expect(sitemap).toContain('${BASE_URL}/en/associations');
    expect(sitemap).toContain('${BASE_URL}/it/associazioni');
    expect(atlas).toContain("id: 'associations'");
    expect(llms).toContain('${POLICYWATCHER_ORIGIN}/en/associations');
    expect(llms).toContain('${POLICYWATCHER_ORIGIN}/it/associazioni');
  });

  it('documents the non-collaborative MVP boundary and the 60-day pilot', () => {
    const docs = read('docs/associations-vertical.md');
    const contract = read('src/lib/associationVertical.ts');

    expect(docs).toContain('browser-local');
    expect(docs).toContain('Pilot di 60 giorni');
    expect(docs).toContain('Non introduce account');
    expect(contract).toContain('non un giudizio legale');
    expect(contract).toContain("week: 'Settimana 8'");
  });
});
