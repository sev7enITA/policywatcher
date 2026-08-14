import { notFound } from 'next/navigation';
import PulseEvidenceVisual from '@/components/pulse/PulseEvidenceVisual';
import { getPulseStory, type PulseLocale } from '@/lib/editorialPulse';
import styles from '@/components/pulse/pulse.module.css';

export default async function PulseEmbedPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; theme?: string }> }) {
  const story = getPulseStory((await params).slug); if (!story) notFound();
  const query = await searchParams; const lang: PulseLocale = query.lang === 'it' ? 'it' : 'en'; const theme = query.theme === 'dark' ? 'dark' : 'light';
  const storyUrl = lang === 'it'
    ? `https://policywatcher.online/pulse/${story.slug}?lang=it`
    : `https://policywatcher.online/pulse/${story.slug}`;
  return <main className={styles.embed} data-theme={theme} lang={lang}><header><strong>PolicyWatcher</strong><span>Verified story lead · as of {story.asOf}</span></header><h1>{story.headline[lang]}</h1><PulseEvidenceVisual story={story} lang={lang} compact /><footer><p>{story.citation[lang]}</p><a href={storyUrl} target="_blank" rel="noreferrer">Open evidence and sources ↗</a></footer></main>;
}
