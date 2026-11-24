import { createHash } from 'node:crypto';
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
    const scripts = [...deck.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => digest(match[1]));
    const styles = [...deck.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(match => digest(match[1]));
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

  it('keeps the Italian index attached to the URL language', () => {
    expect(publicRequestLanguage('/live-dev-diary', 'it')).toBe('it');
    expect(publicNavigationPath('/live-dev-diary', 'it')).toBe('/live-dev-diary?lang=it');
    expect(publicRequestLanguage(deckPath, 'it')).toBe('en');
  });
});
