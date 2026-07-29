import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import PulseEvidenceVisual from '@/components/pulse/PulseEvidenceVisual';
import PulseActions, { PulseStoryViewTracker } from '@/components/pulse/PulseActions';
import { getPulseCardUrl, getPulseStory, getPulseStoryUrl, pulseBeatLabels, pulseStories, type PulseLocale } from '@/lib/editorialPulse';
import styles from '@/components/pulse/pulse.module.css';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

export function generateStaticParams() { return pulseStories.map((story) => ({ slug: story.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = getPulseStory((await params).slug);
  if (!story) return { title: 'Story not found | PolicyWatcher Pulse' };
  const url = getPulseStoryUrl(story);
  const image = getPulseCardUrl(story, 'og', 'en');
  return { title: `${story.headline.en} | PolicyWatcher Pulse`, description: story.deck.en, alternates: { canonical: url }, openGraph: { title: story.headline.en, description: story.deck.en, url, type: 'article', publishedTime: story.asOf, modifiedTime: story.updatedAt, images: [{ url: image, width: 1200, height: 630, alt: story.headline.en }] }, twitter: { card: 'summary_large_image', title: story.headline.en, description: story.deck.en, images: [image] } };
}

export default async function PulseStoryPage({ params, searchParams }: Props) {
  const story = getPulseStory((await params).slug); if (!story) notFound();
  const lang: PulseLocale = (await searchParams).lang === 'it' ? 'it' : 'en';
  const url = getPulseStoryUrl(story);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: story.headline.en, description: story.deck.en, datePublished: story.asOf, dateModified: story.updatedAt, articleSection: pulseBeatLabels[story.beat].en, mainEntityOfPage: url, isAccessibleForFree: true, image: [getPulseCardUrl(story, 'og', 'en')], author: { '@type': 'Person', name: 'Fabrizio Degni', url: 'https://policywatcher.online/about' }, publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: 'https://policywatcher.online' }, citation: story.sourceLinks.map((source) => new URL(source.href, 'https://policywatcher.online').toString()), speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#story-deck', '#verified-facts'] } };
  return <div className={styles.page} lang={lang}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><PulseStoryViewTracker story={story} lang={lang} /><PublicHeader current="pulse" lang={lang} /><main className={styles.storyMain}>
    <nav className={styles.storyTopbar}><Link href={`/pulse?lang=${lang}`}><ArrowLeft size={14} />Pulse desk</Link><span>{pulseBeatLabels[story.beat][lang]} · {story.status} · {story.asOf}</span><Link href={`/pulse/${story.slug}?lang=${lang === 'en' ? 'it' : 'en'}`}>{lang === 'en' ? 'Italiano' : 'English'}</Link></nav>
    <article><header className={styles.storyHero}><p className={styles.kicker}>VERIFIED STORY LEAD · PACK v{story.version}</p><h1>{story.headline[lang]}</h1><p id="story-deck">{story.deck[lang]}</p><dl><div><dt>Beat</dt><dd>{pulseBeatLabels[story.beat][lang]}</dd></div><div><dt>Status</dt><dd><CheckCircle2 size={14} />Verified</dd></div><div><dt>As of</dt><dd>{story.asOf}</dd></div><div><dt>Pack</dt><dd>v{story.version}</dd></div></dl></header>
      <div className={styles.storyLayout}><div className={styles.storyContent}>
        <section><h2>{lang === 'en' ? 'Why this is a story' : 'Perche e una storia'}</h2><p className={styles.largeText}>{story.whyItMatters[lang]}</p></section>
        <section id="verified-facts"><h2>{lang === 'en' ? 'Verified facts' : 'Fatti verificati'}</h2><div className={styles.factRows}>{story.facts.map((fact) => <div key={fact.id}><strong>{fact.value}</strong><div><h3>{fact.label[lang]}</h3><p>{fact.detail[lang]}</p><Link href={fact.proofHref}>Claim {fact.claimId}<ArrowRight size={13} /></Link></div></div>)}</div></section>
        <section><h2>{lang === 'en' ? 'Evidence visual' : 'Visuale delle evidenze'}</h2><PulseEvidenceVisual story={story} lang={lang} /></section>
        <section className={styles.caveat}><ShieldAlert size={22} /><div><h2>{lang === 'en' ? 'What the data does not establish' : 'Cosa non stabiliscono i dati'}</h2><p>{story.boundary[lang]}</p></div></section>
        <section><h2>{lang === 'en' ? 'Sources and citation' : 'Fonti e citazione'}</h2><ul className={styles.sourceList}>{story.sourceLinks.map((source) => <li key={source.href}><Link href={source.href}>{source.label[lang]}<ExternalLink size={13} /></Link>{source.claimId ? <span>Claim {source.claimId}</span> : null}</li>)}</ul><blockquote>{story.citation[lang]}</blockquote></section>
      </div><aside className={styles.reusePanel}><p className={styles.kicker}>{lang === 'en' ? 'Reuse this story' : 'Riusa questa storia'}</p><h2>{lang === 'en' ? 'Files, cards and citation' : 'File, card e citazione'}</h2><p>{lang === 'en' ? 'Every action points to this frozen story version.' : 'Ogni azione punta a questa versione congelata della storia.'}</p><PulseActions story={story} lang={lang} /><nav><Link href="/press-kit/data">Data Room</Link><Link href="/press-kit#claim-registry">Claim Registry</Link></nav></aside></div>
    </article></main><Footer lang={lang} variant="compact" /></div>;
}
