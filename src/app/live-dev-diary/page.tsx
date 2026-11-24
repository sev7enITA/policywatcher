import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { languageAlternates, localizedPublicPath, publicLanguage, withSocialMetadata } from '@/lib/seo';
import { LIVE_DEV_DIARY_PATH, LIVE_DEV_EPISODE_001 as episode } from '@/lib/liveDevDiary';
import styles from './page.module.css';

type PageProps = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    description: 'Hands-on episodes with Fabrizio Degni on how PolicyWatcher retrieves, verifies and publishes evidence of policy changes.',
    firstTitle: 'The evidence behind a policy update',
    summary: 'Follow a Klarna privacy notice from the public catalogue to its source, saved versions and before-and-after passages. Compare the complete EU result with the partial US result, then explore the methodology behind both.',
    episode: 'Episode',
    displayDate: '24 November 2026',
    open: 'Open the interactive slides',
    deckLanguage: 'Presentation in English',
    resources: 'Follow the evidence',
    company: 'Klarna policy records',
    eu: 'EU comparison',
    us: 'US comparison',
    methodology: 'Evidence methodology',
    next: 'Next episode',
    nextSummary: 'A look at retrieval and selective rendering, reviewed inventories, and how structured PolicyAsCode research connects findings to source evidence.',
    preview: 'Read the Engine 6 research diary',
  },
  it: {
    description: 'Episodi pratici con Fabrizio Degni su come PolicyWatcher acquisisce, verifica e pubblica le evidenze delle modifiche alle policy.',
    firstTitle: 'Le evidenze dietro l’aggiornamento di una policy',
    summary: 'Segui un’informativa privacy di Klarna dal catalogo pubblico alla fonte, alle versioni salvate e ai passaggi prima e dopo. Confronta l’esito completo UE con quello parziale USA e scopri il metodo usato per entrambi.',
    episode: 'Episodio',
    displayDate: '24 novembre 2026',
    open: 'Apri le slide interattive',
    deckLanguage: 'Presentazione in inglese',
    resources: 'Consulta le evidenze',
    company: 'Schede delle policy di Klarna',
    eu: 'Confronto UE',
    us: 'Confronto USA',
    methodology: 'Metodologia delle evidenze',
    next: 'Prossimo episodio',
    nextSummary: 'Uno sguardo ad acquisizione e rendering selettivo, inventari revisionati e ricerca PolicyAsCode per collegare i risultati strutturati alle fonti.',
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
            <Link href={episode.klarnaCompany}>{t.company}</Link>
            <Link href={localized(episode.klarnaEu)}>{t.eu}</Link>
            <Link href={localized(episode.klarnaUs)}>{t.us}</Link>
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
