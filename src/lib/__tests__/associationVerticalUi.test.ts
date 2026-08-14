import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('consumer-association public workspace wiring', () => {
  it('renders from the public evidence gate with Italian summaries and explicit failure handling', () => {
    const page = read('src/app/associazioni/page.tsx');
    const data = read('src/lib/evidencePacketData.ts');

    expect(page).toContain('listPublicEvidencePacketSummaries(50)');
    expect(page).toContain('buildAssociationRadarItems');
    expect(page).toContain('catalogUnavailable = true');
    expect(page).toContain('<PublicHeader current="associations" lang="it" />');
    expect(page).toContain('<Footer lang="it" />');
    expect(page).toContain('serializeJsonLd');
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
    expect(client).toContain('Area normativa');
    expect(client).toContain('Tipo di associazione');
    expect(client).toContain('non deduce coperture locali');
    expect(client).toContain('catalogUnavailable');
    expect(client).toContain('<AddToCollectionButton');
    expect(client).toContain('lang="it"');
    expect(client).toContain("href=\"/what-changed\"");
    expect(client).toContain("href=\"/collections\"");
    expect(client).not.toMatch(/fetch\(['"]\/api\/admin/i);
  });

  it('makes the vertical discoverable from the public graph and machine index', () => {
    const header = read('src/components/PublicHeader.tsx');
    const footer = read('src/components/Footer.tsx');
    const sitemap = read('src/app/sitemap.ts');
    const atlas = read('src/lib/publicSections.ts');
    const llms = read('src/app/llms.txt/route.ts');

    expect(header).toContain("{ id: 'associations', href: '/associazioni'");
    expect(footer).toContain("href: '/associazioni'");
    expect(sitemap).toContain('${BASE_URL}/associazioni');
    expect(atlas).toContain("id: 'associations'");
    expect(llms).toContain('${POLICYWATCHER_ORIGIN}/associazioni');
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
