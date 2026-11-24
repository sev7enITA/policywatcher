import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { languageAlternates, localizedPublicPath, publicLanguage, withSocialMetadata } from '@/lib/seo';
import { LIVE_DEV_DIARY_PATH, LIVE_DEV_EPISODE_001 as episode } from '@/lib/liveDevDiary';
import styles from './page.module.css';

type PageProps = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    description: 'Hands-on episodes with Fabrizio Degni on using PolicyWatcher and how it verifies evidence of policy changes.',
    firstTitle: 'A tour of the PolicyWatcher interface',
    summary: 'Explore the homepage, main menus and interactive workspace. See where to find tools for consumers, public evidence views, the Atlas and the methodology.',
    episode: 'Episode',
    displayDate: '24 November 2026',
    open: 'Open the interactive slides',
    deckLanguage: 'Presentation in English',
    resources: 'Explore the interface',
    workspace: 'Interactive workspace',
    knowledge: 'Companies and policies',
    atlas: 'Feature Atlas',
    methodology: 'Evidence methodology',
    next: 'Next episode',
    nextSummary: 'Episode 002 goes behind the interface to look at document retrieval, evidence and quality checks, and the Engine 6 Preview trials.',
    preview: 'Read the Engine 6 research diary',
  },
  it: {
    description: 'Episodi pratici con Fabrizio Degni su come usare PolicyWatcher e su come la piattaforma verifica le evidenze delle modifiche alle policy.',
    firstTitle: 'Tour dell’interfaccia di PolicyWatcher',
    summary: 'Esplora la homepage, i menu principali e l’area di lavoro interattiva. Scopri dove trovare gli strumenti per i consumatori, le evidenze pubbliche, l’Atlante e la metodologia.',
    episode: 'Episodio',
    displayDate: '24 novembre 2026',
    open: 'Apri le slide interattive',
    deckLanguage: 'Presentazione in inglese',
    resources: 'Esplora l’interfaccia',
    workspace: 'Area di lavoro',
    knowledge: 'Aziende e policy',
    atlas: 'Atlante delle funzionalità',
    methodology: 'Metodologia delle evidenze',
    next: 'Prossimo episodio',
    nextSummary: 'L’Episodio 002 entra nel motore di PolicyWatcher per mostrare come acquisisce i documenti, controlla le evidenze e sperimenta con Engine 6 Preview.',
    preview: 'Leggi il diario di ricerca Engine 6',
  },
} as const;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: 'Live Dev Diary | PolicyWatcher',
    description: copy[lang].description,
    alternates: languageAlternates(LIVE_DEV_DIARY_PATH, lang),
  }, lang);
}

export default async function LiveDevDiaryPage({ searchParams }: PageProps) {
  const lang = publicLanguage((await searchParams).lang);
  const t = copy[lang];
  const localized = (path: string) => localizedPublicPath(path, lang);
  return (
    <>
      <PublicHeader current="live-dev-diary" lang={lang} lockLang />
      <main className={styles.main} lang={lang}>
        <header className={styles.intro}>
          <h1>Live Dev Diary</h1>
          <p>{t.description}</p>
        </header>
        <article className={styles.episode} id="episode-001" aria-labelledby="episode-title">
          <p className={styles.meta}>{t.episode} {episode.number} <span aria-hidden="true">·</span> <time dateTime={episode.publishedOn}>{t.displayDate}</time></p>
          <h2 id="episode-title">{t.firstTitle}</h2>
          <p>{t.summary}</p>
          <a className={styles.open} href={episode.deckPath} hrefLang="en">{t.open}<span aria-hidden="true"> →</span></a>
          <p className={styles.language}>{t.deckLanguage}</p>
          <nav className={styles.references} aria-label={t.resources}>
            <Link href={localized('/') + '#workspace'}>{t.workspace}</Link>
            <Link href={localized('/knowledge')}>{t.knowledge}</Link>
            <Link href={localized('/feature-atlas')}>{t.atlas}</Link>
            <Link href={localized('/methodology/confidence')}>{t.methodology}</Link>
          </nav>
        </article>
        <section className={styles.next} aria-labelledby="next-episode-title">
          <h2 id="next-episode-title">{t.next}</h2>
          <p>{t.nextSummary}</p>
          <Link href={localized('/engine-6-preview') + '#validation'}>{t.preview}</Link>
        </section>
      </main>
    </>
  );
}
