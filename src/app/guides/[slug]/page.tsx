import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicBreadcrumbs from '@/components/PublicBreadcrumbs';
import Footer from '@/components/Footer';
import { getPolicyGuide, guideMatchesPolicy, policyGuides } from '@/lib/policyGuides';
import { getPublicKnowledgeHub, type PublicKnowledgeHub } from '@/lib/publicKnowledge';
import { DEFAULT_SOCIAL_IMAGE, languageAlternates, localizedPublicPath, localizedPublicUrl, publicLanguage, PUBLISHER_ID, withSocialMetadata } from '@/lib/seo';
import styles from '../guides.module.css';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const guide = getPolicyGuide((await params).slug);
  if (!guide) notFound();
  const lang = publicLanguage((await searchParams).lang);
  const t = guide.copy[lang];
  return withSocialMetadata({ title: `${t.title} | PolicyWatcher`, description: t.description, alternates: languageAlternates(`/guides/${guide.slug}`, lang), openGraph: { type: 'article', modifiedTime: guide.updatedAt } }, lang);
}
export default async function GuidePage({ params, searchParams }: Props) {
  const guide = getPolicyGuide((await params).slug);
  if (!guide) notFound();
  const lang = publicLanguage((await searchParams).lang);
  const t = guide.copy[lang];
  const path = `/guides/${guide.slug}`;
  let hub: PublicKnowledgeHub | null = null;
  try { hub = await getPublicKnowledgeHub(); } catch { /* The guide remains available when the inventory cannot be loaded. */ }
  const policies = hub?.policies.filter((policy) => guideMatchesPolicy(guide, policy)) ?? [];
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: t.title, description: t.description,
    mainEntityOfPage: localizedPublicUrl(path, lang), inLanguage: lang, dateModified: guide.updatedAt,
    author: { '@type': 'Organization', '@id': PUBLISHER_ID, name: 'PolicyWatcher', url: 'https://policywatcher.online/about' }, publisher: { '@id': PUBLISHER_ID },
    image: DEFAULT_SOCIAL_IMAGE, isAccessibleForFree: true,
    citation: ['https://policywatcher.online/methodology/confidence', ...(t.sources || []).map((source) => new URL(source.href, 'https://policywatcher.online').href)],
  };
  return <><PublicHeader current="guides" lang={lang} lockLang /><main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }} />
    <PublicBreadcrumbs lang={lang} items={[{ name: 'PolicyWatcher', path: '/' }, { name: lang === 'it' ? 'Guide' : 'Guides', path: localizedPublicUrl('/guides', lang) }, { name: t.title, path: localizedPublicUrl(path, lang) }]} />
    <article><header className={styles.header}><h1>{t.title}</h1><p>{t.introduction}</p>
      <div className={styles.meta}><Link href="/about">PolicyWatcher</Link><span>{lang === 'it' ? 'Aggiornata il' : 'Updated'} <time dateTime={guide.updatedAt}>{guide.updatedAt}</time></span><Link href={localizedPublicPath(path, lang === 'en' ? 'it' : 'en')} hrefLang={lang === 'en' ? 'it' : 'en'}>{lang === 'en' ? 'Italiano' : 'English'}</Link></div>
    </header><div className={styles.body}>
      <nav className={styles.section} aria-label={lang === 'it' ? 'In questa guida' : 'On this page'}><ol>{t.sections.map((section, index) => <li key={section.heading}><a href={`#step-${index + 1}`}>{section.heading}</a></li>)}</ol><a href="#public-records">{lang === 'it' ? 'Policy pubbliche pertinenti' : 'Relevant public policies'}</a></nav>
      {t.sections.map((section, index) => <section className={styles.section} id={`step-${index + 1}`} key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      {t.sources && <section className={styles.section} id="sources"><h2>{lang === 'it' ? 'Fonti e documenti del caso' : 'Case sources and records'}</h2><ul>{t.sources.map((source) => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ul></section>}
      <section className={styles.section}><h2>{lang === 'it' ? 'Controlli prima di condividere' : 'Before you share a finding'}</h2><ul>{t.checklist.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className={styles.section} id="public-records"><h2>{lang === 'it' ? 'Policy pubbliche pertinenti' : 'Relevant public policies'}</h2>
        <p>{lang === 'it' ? 'Questi collegamenti includono soltanto schede che superano i controlli di pubblicazione. Non rappresentano una copertura completa del mercato né una raccomandazione dei fornitori.' : 'These links include only records that pass the publication gate. They do not represent complete market coverage or a recommendation of the providers.'}</p>
        {policies.length ? <ul>{policies.map((policy) => <li key={policy.id}><Link href={`/knowledge/companies/${policy.company.slug}/policies/${policy.id}`}>{policy.company.name} - {policy.name} ({policy.jurisdiction})</Link></li>)}</ul> : <p role="status">{!hub ? (lang === 'it' ? 'Indice temporaneamente non disponibile.' : 'The index is temporarily unavailable.') : (lang === 'it' ? 'Nessuna scheda pubblica pertinente disponibile al momento.' : 'No matching public records are currently available.')}</p>}
        <Link href="/knowledge">{lang === 'it' ? 'Apri l’indice completo' : 'Open the full policy index'}</Link>
      </section>
      <aside className={styles.note}><p>{lang === 'it' ? 'Guida redatta con assistenza AI per spiegare il metodo di lettura. Non costituisce consulenza legale o una verifica umana di ogni documento collegato.' : 'Prepared with AI assistance to explain the reading method. This guide is not legal advice or a claim that every linked document has been reviewed by a person.'}</p><nav className={styles.links}><Link href="/methodology/confidence">{lang === 'it' ? 'Metodo e limiti' : 'Methodology and limits'}</Link><Link href="/press-kit/corrections">{lang === 'it' ? 'Segnala una correzione' : 'Request a correction'}</Link></nav></aside>
      <nav className={styles.section} aria-label={lang === 'it' ? 'Guide correlate' : 'Related guides'}><h2>{lang === 'it' ? 'Continua la lettura' : 'Continue reading'}</h2><ul>{policyGuides.filter((item) => item.slug !== guide.slug).map((item) => <li key={item.slug}><Link href={localizedPublicPath(`/guides/${item.slug}`, lang)}>{item.copy[lang].title}</Link></li>)}</ul></nav>
    </div></article>
  </main><Footer lang={lang} variant="compact" lockLang /></>;
}
