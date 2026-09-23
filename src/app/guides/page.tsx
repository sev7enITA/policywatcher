import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicBreadcrumbs from '@/components/PublicBreadcrumbs';
import Footer from '@/components/Footer';
import { policyGuides } from '@/lib/policyGuides';
import { languageAlternates, localizedPublicPath, localizedPublicUrl, publicLanguage, PUBLISHER_ID, withSocialMetadata } from '@/lib/seo';
import styles from './guides.module.css';

type Props = { searchParams: Promise<{ lang?: string }> };
const copy = {
  en: { title: 'Guides to monitoring policy changes', description: 'Practical guides to comparing privacy notices, AI provider policies, terms of service and data processing agreements using dated public evidence.' },
  it: { title: 'Guide al monitoraggio delle modifiche alle policy', description: 'Guide pratiche per confrontare informative privacy, policy AI, termini di servizio e accordi sul trattamento dei dati usando evidenze pubbliche datate.' },
};
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({ title: `${copy[lang].title} | PolicyWatcher`, description: copy[lang].description, alternates: languageAlternates('/guides', lang) }, lang);
}
export default async function GuidesPage({ searchParams }: Props) {
  const lang = publicLanguage((await searchParams).lang);
  const t = copy[lang];
  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.title, description: t.description,
    url: localizedPublicUrl('/guides', lang), inLanguage: lang, publisher: { '@id': PUBLISHER_ID },
    mainEntity: { '@type': 'ItemList', itemListElement: policyGuides.map((guide, index) => ({ '@type': 'ListItem', position: index + 1, name: guide.copy[lang].title, url: localizedPublicUrl(`/guides/${guide.slug}`, lang) })) },
  };
  return <><PublicHeader current="guides" lang={lang} lockLang /><main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }} />
    <PublicBreadcrumbs lang={lang} items={[{ name: 'PolicyWatcher', path: '/' }, { name: lang === 'it' ? 'Guide' : 'Guides', path: localizedPublicUrl('/guides', lang) }]} />
    <header className={styles.header}><h1>{t.title}</h1><p>{t.description}</p><Link href={localizedPublicPath('/guides', lang === 'en' ? 'it' : 'en')} hrefLang={lang === 'en' ? 'it' : 'en'}>{lang === 'en' ? 'Italiano' : 'English'}</Link></header>
    <ul className={styles.cards}>{policyGuides.map((guide) => <li key={guide.slug}><h2><Link href={localizedPublicPath(`/guides/${guide.slug}`, lang)}>{guide.copy[lang].title}</Link></h2><p>{guide.copy[lang].description}</p></li>)}</ul>
    <p className={styles.note}>{lang === 'it' ? 'Le guide spiegano come leggere le evidenze: non sono consulenza legale né valutazioni di conformità dei fornitori. Le schede collegate mantengono visibili fonti, date e limiti del confronto.' : 'These guides explain how to read the evidence. They are not legal advice or provider compliance assessments. Linked records retain their source, dates and comparison limits.'}</p>
    <nav className={styles.links}><Link href="/knowledge">{lang === 'it' ? 'Esplora le policy pubbliche' : 'Explore public policy records'}</Link><Link href="/methodology/confidence">{lang === 'it' ? 'Metodo e limiti' : 'Methodology and limits'}</Link></nav>
  </main><Footer lang={lang} variant="compact" lockLang /></>;
}
