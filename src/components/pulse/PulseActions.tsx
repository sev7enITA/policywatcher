'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Clipboard, Code2, Download, Image as ImageIcon } from 'lucide-react';
import { getPulseCardUrl, getPulseStoryPackUrl, pulseCardDimensions, type PulseCardFormat, type PulseLocale, type PulseStory } from '@/lib/editorialPulse';
import { recordPressMetric, type PressMetricTarget } from '@/lib/pressMetrics';
import styles from './pulse.module.css';

export function PulseStoryViewTracker({ story, lang }: { story: PulseStory; lang: PulseLocale }) {
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordPressMetric('pulse_story_view', story.slug as PressMetricTarget, lang);
  }, [lang, story.slug]);
  return null;
}

export default function PulseActions({ story, lang }: { story: PulseStory; lang: PulseLocale }) {
  const [copied, setCopied] = useState<'citation' | 'embed' | null>(null);
  const storyPack = getPulseStoryPackUrl(story, lang).replace('https://policywatcher.online', '');
  const embedUrl = `https://policywatcher.online/embed/pulse/${story.slug}?lang=${lang}&theme=light`;
  const embedCode = `<iframe src="${embedUrl}" title="${story.headline[lang]} - PolicyWatcher evidence visual" width="760" height="520" loading="lazy" style="border:0;width:100%;max-width:760px"></iframe>`;

  async function copy(kind: 'citation' | 'embed', value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
    recordPressMetric(kind === 'citation' ? 'citation_copy' : 'embed_copy', (kind === 'citation' ? 'pulse-story' : story.slug) as PressMetricTarget, lang);
  }

  return (
    <div className={styles.actionStack}>
      <span className={styles.liveStatus} role="status" aria-live="polite" aria-atomic="true">
        {copied === 'citation'
          ? (lang === 'it' ? 'Citazione copiata.' : 'Citation copied.')
          : copied === 'embed'
            ? (lang === 'it' ? 'Codice embed copiato.' : 'Embed code copied.')
            : ''}
      </span>
      <a className={styles.primaryAction} href={storyPack} download onClick={() => recordPressMetric('story_pack_download', story.slug as PressMetricTarget, lang)}><Download size={17} /> Story Pack v{story.version}</a>
      <button type="button" onClick={() => copy('citation', story.citation[lang])}>{copied === 'citation' ? <Check size={16} /> : <Clipboard size={16} />}{copied === 'citation' ? (lang === 'it' ? 'Copiata' : 'Copied') : (lang === 'it' ? 'Copia citazione' : 'Copy citation')}</button>
      <button type="button" onClick={() => copy('embed', embedCode)}>{copied === 'embed' ? <Check size={16} /> : <Code2 size={16} />}{copied === 'embed' ? (lang === 'it' ? 'Copiato' : 'Copied') : (lang === 'it' ? 'Copia codice embed' : 'Copy embed code')}</button>
      <div className={styles.cardDownloads} aria-label={lang === 'it' ? 'Formati social card' : 'Social card formats'}>
        {(Object.keys(pulseCardDimensions) as PulseCardFormat[]).map((format) => {
          const size = pulseCardDimensions[format];
          return <a key={format} href={getPulseCardUrl(story, format, lang).replace('https://policywatcher.online', '')} download onClick={() => recordPressMetric('social_card_download', format, lang)}><ImageIcon size={14} /><span>{size.label}</span><small>{size.width}×{size.height}</small></a>;
        })}
      </div>
    </div>
  );
}
