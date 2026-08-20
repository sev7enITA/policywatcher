'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Languages } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import { PULSE_DESK_AS_OF, pulseBeatLabels, pulseStories, type PulseBeat, type PulseLocale } from '@/lib/editorialPulse';
import { recordPressMetric } from '@/lib/pressMetrics';
import { editorialCampaignById, parseCampaignLandingSearch } from '@/lib/editorialCampaigns';
import styles from './pulse.module.css';

export default function PulseIndexClient() {
  const [lang, setLang] = useState<PulseLocale>('en');
  const [beat, setBeat] = useState<PulseBeat | 'all'>('all');
  const landingRecorded = useRef(false);
  const filtered = beat === 'all' ? pulseStories : pulseStories.filter((story) => story.beat === beat);

  useEffect(() => {
    if (landingRecorded.current) return;
    landingRecorded.current = true;
    const campaign = parseCampaignLandingSearch(window.location.search);
    if (campaign) recordPressMetric('campaign_landing', campaign, editorialCampaignById[campaign].locale);
  }, []);
  return <div className={styles.page} lang={lang}>
    <PublicHeader current="pulse" lang={lang} />
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroRule}><span>EDITORIAL DESK · AS OF {PULSE_DESK_AS_OF}</span><button type="button" onClick={() => setLang(lang === 'en' ? 'it' : 'en')}><Languages size={14} />{lang === 'en' ? 'Italiano' : 'English'}</button></div>
        <div className={styles.heroGrid}><div><p className={styles.kicker}>{lang === 'en' ? 'EDITORIAL LEAD REGISTRY' : 'REGISTRO SPUNTI EDITORIALI'}</p><h1>PolicyWatcher Pulse</h1><p className={styles.lede}>{lang === 'en' ? 'The registry contains human-approved editorial leads with public facts, citations and scope notes.' : 'Il registro contiene spunti editoriali approvati da una persona, con fatti pubblici, citazioni e note sul perimetro.'}</p></div><aside><strong>{pulseStories.length}</strong><span>{lang === 'en' ? 'verified leads' : 'lead verificati'}</span><p>{lang === 'en' ? 'Each lead has a dated Story Pack, source links and a visible scope boundary.' : 'Ogni lead include Story Pack datato, link alle fonti e un limite di perimetro visibile.'}</p></aside></div>
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
          <Link className={styles.openStory} href={lang === 'it' ? `/pulse/${story.slug}?lang=it` : `/pulse/${story.slug}`}>{lang === 'en' ? 'Open story' : 'Apri storia'}<ArrowRight size={16} /></Link>
        </article>)}
      </section>
    </main><Footer lang={lang} variant="compact" />
  </div>;
}
