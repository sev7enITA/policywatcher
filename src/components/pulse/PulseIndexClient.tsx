'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clipboard, Download, ExternalLink, Languages } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { PULSE_AS_OF, pulseBeatLabels, pulseLaunchKit, pulseStories, type PulseBeat, type PulseLocale } from '@/lib/editorialPulse';
import { recordPressMetric } from '@/lib/pressMetrics';
import { editorialCampaignById, parseCampaignLandingSearch } from '@/lib/editorialCampaigns';
import styles from './pulse.module.css';

export default function PulseIndexClient() {
  const [lang, setLang] = useState<PulseLocale>('en');
  const [beat, setBeat] = useState<PulseBeat | 'all'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const landingRecorded = useRef(false);
  const filtered = beat === 'all' ? pulseStories : pulseStories.filter((story) => story.beat === beat);

  useEffect(() => {
    if (landingRecorded.current) return;
    landingRecorded.current = true;
    const campaign = parseCampaignLandingSearch(window.location.search);
    if (campaign) recordPressMetric('campaign_landing', campaign, editorialCampaignById[campaign].locale);
  }, []);
  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value); setCopied(id); window.setTimeout(() => setCopied(null), 1500);
  }
  return <div className={styles.page} lang={lang}>
    <PublicHeader current="pulse" lang={lang} />
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroRule}><span>EDITORIAL DESK · AS OF {PULSE_AS_OF}</span><button type="button" onClick={() => setLang(lang === 'en' ? 'it' : 'en')}><Languages size={14} />{lang === 'en' ? 'Italiano' : 'English'}</button></div>
        <div className={styles.heroGrid}><div><p className={styles.kicker}>PolicyWatcher Pulse</p><h1>{lang === 'en' ? 'Story leads with the evidence attached.' : 'Spunti editoriali con le evidenze allegate.'}</h1><p className={styles.lede}>{lang === 'en' ? 'A human-approved registry that packages supported public facts, boundaries and reusable citations without auto-promoting database or AI rankings.' : 'Un registro approvato da persone che organizza fatti pubblici supportati, limiti e citazioni riutilizzabili senza promuovere automaticamente ranking del database o dell AI.'}</p></div><aside><strong>{pulseStories.length}</strong><span>{lang === 'en' ? 'verified leads' : 'lead verificati'}</span><p>{lang === 'en' ? 'Each lead has a dated Story Pack, source links and a visible scope boundary.' : 'Ogni lead include Story Pack datato, link alle fonti e un limite di perimetro visibile.'}</p></aside></div>
        <nav className={styles.evidenceLinks} aria-label="Evidence references"><Link href="/press-kit/data">Data Room <ArrowRight size={13} /></Link><Link href="/press-kit#claim-registry">Claim Registry <ArrowRight size={13} /></Link><Link href="/press-kit/releases">Releases <ArrowRight size={13} /></Link></nav>
      </section>
      <section className={styles.filterBar} aria-label={lang === 'en' ? 'Filter by editorial beat' : 'Filtra per area editoriale'}>
        <button type="button" data-active={beat === 'all'} onClick={() => setBeat('all')}>{lang === 'en' ? 'All beats' : 'Tutte'}</button>
        {(Object.keys(pulseBeatLabels) as PulseBeat[]).map((key) => <button key={key} type="button" data-active={beat === key} onClick={() => setBeat(key)}>{pulseBeatLabels[key][lang]}</button>)}
      </section>
      <section className={styles.storyList} aria-live="polite">
        {filtered.map((story, index) => <article className={styles.storyCard} key={story.slug}>
          <div className={styles.storyNumber}>{String(index + 1).padStart(2, '0')}</div>
          <div className={styles.storyBody}><div className={styles.storyMeta}><span>{pulseBeatLabels[story.beat][lang]}</span><span className={styles.verified}>Verified lead</span><time dateTime={story.asOf}>{story.asOf}</time></div><h2>{story.headline[lang]}</h2><p>{story.deck[lang]}</p><ul>{story.facts.slice(0, 3).map((fact) => <li key={fact.id}><strong>{fact.value}</strong><span>{fact.label[lang]}</span></li>)}</ul><p className={styles.boundary}>{story.boundary[lang]}</p></div>
          <Link className={styles.openStory} href={`/pulse/${story.slug}?lang=${lang}`}>{lang === 'en' ? 'Open story' : 'Apri storia'}<ArrowRight size={16} /></Link>
        </article>)}
      </section>
      <section className={styles.launchKit} id="launch-kit"><header><p className={styles.kicker}>Distribution desk</p><h2>Product Hunt + Show HN launch kit</h2><p>{lang === 'en' ? 'Concrete copy and correctly sized owned assets. The package does not request votes or imply endorsement.' : 'Testi concreti e asset proprietari nei formati corretti. Il pacchetto non chiede voti e non implica endorsement.'}</p></header><div className={styles.launchGrid}>
        <span className={styles.liveStatus} role="status" aria-live="polite" aria-atomic="true">{copied === 'ph' ? 'Product Hunt copy copied.' : copied === 'hn' ? 'Show HN submission copied.' : ''}</span>
        <article><span>Product Hunt</span><h3>{pulseLaunchKit.productHunt.tagline}</h3><p>{pulseLaunchKit.productHunt.description}</p><div className={styles.launchActions}><button onClick={() => copy('ph', `${pulseLaunchKit.productHunt.tagline}\n\n${pulseLaunchKit.productHunt.description}\n\n${pulseLaunchKit.productHunt.firstComment}`)}>{copied === 'ph' ? <Check size={14} /> : <Clipboard size={14} />}{copied === 'ph' ? 'Copied' : 'Copy launch copy'}</button><a href="/api/og/launch/product-hunt-thumbnail" download><Download size={14} />240×240</a><a href="/api/og/launch/product-hunt-gallery" download><Download size={14} />1270×760</a><a href="https://help.producthunt.com/en/articles/479557-how-to-post-a-product" target="_blank" rel="noreferrer" onClick={() => recordPressMetric('launch_outbound', 'product-hunt', lang)}>Posting guide<ExternalLink size={14} /></a></div></article>
        <article><span>Show HN</span><h3>{pulseLaunchKit.showHn.title}</h3><p>{pulseLaunchKit.showHn.submission}</p><div className={styles.launchActions}><button onClick={() => copy('hn', `${pulseLaunchKit.showHn.title}\n\n${pulseLaunchKit.showHn.submission}\n\nTechnical: ${pulseLaunchKit.showHn.technical}\n\nLimitations: ${pulseLaunchKit.showHn.limitations}`)}>{copied === 'hn' ? <Check size={14} /> : <Clipboard size={14} />}{copied === 'hn' ? 'Copied' : 'Copy submission'}</button><a href="https://news.ycombinator.com/showhn.html" target="_blank" rel="noreferrer" onClick={() => recordPressMetric('launch_outbound', 'show-hn', lang)}>Guidelines<ExternalLink size={14} /></a></div></article>
      </div><a className={styles.jsonDownload} href="/api/pulse/launch-kit" download><Download size={15} />Download versioned launch-kit JSON</a></section>
    </main><Footer lang={lang} variant="compact" />
  </div>;
}
