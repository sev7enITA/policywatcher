import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { html as deck } from '../../app/live-dev-diary/episode-001/deck.generated.json';
import { proxy } from '../../proxy';
import { LIVE_DEV_EPISODE_001, LIVE_DEV_EPISODE_001_CSP } from '../liveDevDiary';
import { publicNavigationPath, publicRequestLanguage } from '../seo';

const deckPath = LIVE_DEV_EPISODE_001.deckPath;
const digest = (value: string) => "'sha256-" + createHash('sha256').update(value).digest('base64') + "'";

describe('Live Dev Diary episode 001', () => {
  it('publishes the dated English deck and only its audience-facing material', () => {
    expect(deck).toContain('<html lang="en">');
    expect(deck).toContain('<strong>Episode 001</strong>');
    expect(deck).toContain('<time datetime="2026-11-24">24 November 2026</time>');
    expect([...deck.matchAll(/data-slide="(\d+)"/g)].map(match => match[1]))
      .toEqual(Array.from({ length: 11 }, (_, index) => String(index + 1).padStart(2, '0')));
    expect(deck).not.toMatch(/teleprompter|\/Users\/|staging\.policywatcher\.online/);
  });

  it('authorises the exact public deck scripts and style without relaxing adjacent routes', () => {
    const $ = load(deck);
    const scripts = $('script').map((_, tag) => digest($(tag).text())).get();
    const styles = $('style').map((_, tag) => digest($(tag).text())).get();
    expect(deck).not.toMatch(/\sstyle="/);
    expect(scripts).toHaveLength(2);
    expect(styles).toHaveLength(1);
    expect(LIVE_DEV_EPISODE_001_CSP).toContain('script-src ' + scripts.join(' '));
    expect(LIVE_DEV_EPISODE_001_CSP).toContain('style-src ' + styles[0]);
    expect(LIVE_DEV_EPISODE_001_CSP).not.toContain('unsafe-inline');
    const responseFor = (path: string) => proxy(new NextRequest('https://policywatcher.online' + path));
    expect(responseFor(deckPath).headers.get('content-security-policy')).toBe(LIVE_DEV_EPISODE_001_CSP);
    expect(responseFor('/live-dev-diary').headers.get('content-security-policy')).toContain("'strict-dynamic'");
  });

  it('covers the public interface and reserves the engine for episode 002', () => {
    const $ = load(deck);
    const agenda = $('[data-slide="02"] .agenda-list li').map((_, item) => $(item).text()).get();
    expect(agenda).toEqual([
      'Homepage and main navigation',
      'Interactive workspace and controls',
      'Citizen tools and evidence views',
      'More tools, Atlas and methodology',
    ]);
    expect($('[data-slide="10"]').text()).toContain('Episode 002');
    expect($('[data-slide] a[href*="/change/"], [data-slide] a[href*="/knowledge/companies/"]')).toHaveLength(0);
  });

  it('keeps the Italian index attached to the URL language', () => {
    expect(publicRequestLanguage('/live-dev-diary', 'it')).toBe('it');
    expect(publicNavigationPath('/live-dev-diary', 'it')).toBe('/live-dev-diary?lang=it');
    expect(publicRequestLanguage(deckPath, 'it')).toBe('en');
  });
});
