import { serializeJsonLd } from '@/lib/structuredData';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Download,
  FileJson2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  buildPressCoverageCitation,
  formatPressCoverageDate,
  getPressCoverageSummary,
  pressCoverageKindLabels,
  pressCoverageRecords,
  PRESS_COVERAGE_AS_OF,
  PRESS_COVERAGE_BOUNDARY,
} from '@/lib/pressCoverage';
import PressCoverageRegistry, { type CoverageRecordView } from './PressCoverageRegistry';
import styles from './press.module.css';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Rassegna stampa | PolicyWatcher' : 'Coverage Registry | PolicyWatcher',
    description: lang === 'it' ? 'Articoli, fonti originali e casi documentati su PolicyWatcher.' : 'Original articles, sources and worked examples about PolicyWatcher.',
    alternates: languageAlternates('/press', lang),
  }, lang);
}

const submitReferenceHref = 'mailto:info@policywatcher.online?subject=PolicyWatcher%20public%20reference';

export default async function PressPage({ searchParams }: Props) {
  const lang = publicLanguage((await searchParams).lang);
  const it = lang === 'it';
  const kinds = it ? { 'editorial-article': 'Articolo', 'newsletter-article': 'Newsletter', 'professional-post': 'Post professionale' } : pressCoverageKindLabels;
  const boundary = it ? 'La rassegna documenta riferimenti pubblici. Una citazione non attesta approvazione, certificazione, diffusione o validazione dei risultati.' : PRESS_COVERAGE_BOUNDARY;
  const descriptions: Record<string, string> = {
    'coverage-economy-magazine-2026-11-19': 'Come seguire le revisioni delle informative e capire quali scelte riguardano i propri dati.',
    'coverage-fortune-italia-2026-11-18': 'Come risalire dalle sintesi alle fonti e rivedere le condizioni dei fornitori.',
    'coverage-toms-hardware-it-2026-07': 'Il monitoraggio delle policy come strumento civico.',
    'coverage-massimo-chiriatti-linkedin-2026-07': 'Post dedicato al repository pubblico di PolicyWatcher.',
    'coverage-michele-iaselli-linkedin-2026-07': 'Riflessione sul monitoraggio delle policy e sulla governance dell’IA.',
    'coverage-gladiatori-digitali-2026-07': 'Newsletter dedicata al monitoraggio dei termini dei servizi di IA.',
  };
  const summary = getPressCoverageSummary(pressCoverageRecords);
  const types = Object.entries(kinds).map(([kind, label]) => ({
    label,
    count: pressCoverageRecords.filter((record) => record.kind === kind).length,
  })).filter((type) => type.count > 0);
  const languages = [
    { label: it ? 'Inglese' : 'English', value: 'en', count: summary.byLanguage.en },
    { label: it ? 'Italiano' : 'Italian', value: 'it', count: summary.byLanguage.it },
  ].filter((language) => language.count > 0);
  const records: CoverageRecordView[] = pressCoverageRecords.map((record) => ({
    id: record.id,
    source: record.sourceName,
    platform: record.platform,
    kind: kinds[record.kind],
    dateLabel: formatPressCoverageDate({ ...record, language: lang }),
    language: record.language === 'it' ? (it ? 'Italiano' : 'Italian') : (it ? 'Inglese' : 'English'),
    title: it && record.titleStatus === 'registry-description' ? descriptions[record.id] ?? record.title : record.title,
    titleStatus: record.titleStatus === 'publisher-supplied'
      ? (it ? 'Titolo originale' : 'Publisher-supplied title')
      : (it ? 'Descrizione della rassegna' : 'Registry description'),
    reviewedAt: record.reviewedAt,
    summary: it ? descriptions[record.id] ?? record.summary : record.summary,
    caseSlug: record.caseSlug,
    verificationLabel: record.recordStatus === 'source-linked' ? (it ? 'Con fonte' : 'Source-linked') : record.recordStatus,
    citation: it ? buildPressCoverageCitation(record).replace('(accessed [date])', '(consultato il [data])') : buildPressCoverageCitation(record),
    href: record.sourceUrl,
    image: record.localPreview?.src,
    imageAlt: record.localPreview?.alt,
    boundary: it ? boundary : `${record.relationship}. ${PRESS_COVERAGE_BOUNDARY}`,
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'PolicyWatcher Coverage Registry',
    description: PRESS_COVERAGE_BOUNDARY,
    url: 'https://policywatcher.online/press',
    dateModified: PRESS_COVERAGE_AS_OF,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://policywatcher.online/api/press/coverage' },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://policywatcher.online/api/press/coverage?format=csv' },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: summary.total,
      itemListElement: pressCoverageRecords.map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          identifier: record.id,
          name: record.title,
          url: record.sourceUrl,
          datePublished: record.publishedDate,
          inLanguage: record.language,
        },
      })),
    },
  };

  return (
    <>
      <PublicHeader current="press" lang={lang} lockLang />
      <main className={styles.page} lang={lang}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.eyebrowRow}>
              <span className={styles.kicker}>{it ? "Registro pubblico PolicyWatcher" : "PolicyWatcher public record"}</span>
              <Link href={it ? "/press?lang=en" : "/press?lang=it"}>{it ? "English" : "Italiano"}</Link>
              <span className={styles.asOf}>{it ? 'Aggiornata al' : 'As of'} {PRESS_COVERAGE_AS_OF}</span>
            </div>
            <div className={styles.heroGrid}>
              <div>
                <h1>{it ? "Rassegna stampa" : "Coverage Registry"}</h1>
                <p className={styles.lead}>
                  {it ? "Articoli, post e newsletter su PolicyWatcher con le fonti originali." : "A source-linked registry of public articles, posts and newsletters that refer to PolicyWatcher."}
                </p>
              </div>
              <p className={styles.boundaryNote}>
                {boundary}
              </p>
            </div>
          </header>

          <section className={styles.statusStrip} aria-label={it ? "Stato della rassegna" : "Registry status"}>
            <div>
              <span>{it ? "Segnalazioni" : "Records"}</span>
              <strong>{summary.total}</strong>
              <small>{it ? "Voci in rassegna" : "Current registry entries"}</small>
            </div>
            <div>
              <span>{it ? "Con fonte" : "Source-linked"}</span>
              <strong>{summary.sourceLinked}</strong>
              <small>{it ? "Voci con il link originale" : "Records with an original URL"}</small>
            </div>
            <div>
              <span>{it ? "Citazioni editoriali" : "Editorial references"}</span>
              <strong>{summary.editorial}</strong>
              <small>{it ? "Articoli e newsletter" : "Articles and newsletters"}</small>
            </div>
            <div>
              <span>{it ? "Post professionali" : "Professional posts"}</span>
              <strong>{summary.professionalPosts}</strong>
              <small>{it ? "Citazioni professionali pubbliche" : "Public professional references"}</small>
            </div>
          </section>

          <section className={styles.qualify} aria-labelledby="qualify-title">
            <div>
              <p className={styles.kicker}>{it ? "Consultare la rassegna" : "Reading the ledger"}</p>
              <h2 id="qualify-title">{it ? "Criteri di inclusione" : "Record criteria"}</h2>
            </div>
            <dl>
              <div>
                <dt>{it ? "01 · Fonte pubblica" : "01 · Public source URL"}</dt>
                <dd>{it ? "Ogni voce conserva il collegamento alla fonte originale." : "A record stores the original public source URL available when the entry was recorded."}</dd>
              </div>
              <div>
                <dt>{it ? "02 · Dati della pubblicazione" : "02 · Recorded metadata"}</dt>
                <dd>{it ? "Sono indicati fonte, tipo, data, lingua e descrizione." : "Source, type, publication date, language and a factual description are retained together."}</dd>
              </div>
              <div>
                <dt>{it ? "03 · Significato della citazione" : "03 · Relationship boundary"}</dt>
                <dd>{it ? "Le citazioni documentano la copertura editoriale." : "Listing a reference does not establish support, product quality, legal compliance or independent review."}</dd>
              </div>
            </dl>
          </section>

          <PressCoverageRegistry records={records} lang={lang} types={types} languages={languages} />

          <section className={styles.distribution} aria-labelledby="distribution-title">
            <div>
              <p className={styles.kicker}>{it ? "Download" : "Distribution"}</p>
              <h2 id="distribution-title">{it ? "Scarica o contribuisci" : "Registry use and contributions"}</h2>
              <p>{it ? "Scarica la rassegna, consulta il kit stampa o segnala una pubblicazione." : "Download the current record set, consult the Press Kit, or send a public reference for consideration."}</p>
            </div>
            <nav aria-label={it ? "Download della rassegna" : "Registry distribution actions"}>
              <a href="/api/press/coverage" download>
                <FileJson2 size={18} /> {it ? "Rassegna JSON" : "JSON registry"} <ArrowRight size={16} />
              </a>
              <a href="/api/press/coverage?format=csv" download>
                <Download size={18} /> {it ? "Rassegna CSV" : "CSV registry"} <ArrowRight size={16} />
              </a>
              <Link href={it ? "/press-kit?lang=it" : "/press-kit"}>
                <ShieldCheck size={18} /> {it ? "Kit stampa" : "Press Kit"} <ArrowRight size={16} />
              </Link>
              <a href={submitReferenceHref}>
                <Mail size={18} /> {it ? "Segnala una fonte" : "Submit a reference"} <ArrowRight size={16} />
              </a>
            </nav>
          </section>

          <section className={styles.method} aria-labelledby="method-title">
            <div>
              <p className={styles.kicker}>{it ? "Metodo" : "Method and boundary"}</p>
              <h2 id="method-title">{it ? "Ambito e limiti della rassegna" : "Registry scope and limitations"}</h2>
            </div>
            <div>
              <p>
                {it ? "La rassegna conserva una selezione di riferimenti pubblici con i dati e i collegamenti originali." : "The registry preserves a small, reviewable set of public references with their original links and recorded metadata. It is not an exhaustive account of public discussion and does not rate, validate or endorse third-party content."}
              </p>
              <Link href="/press-kit/reference">{it ? "Consulta i materiali del kit stampa" : "Read the Press Kit reference material"} <ArrowRight size={15} /></Link>
            </div>
          </section>
        </div>
      </main>
      <Footer lang={lang} lockLang />
    </>
  );
}
