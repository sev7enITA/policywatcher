import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EDITORIAL_CAMPAIGN_IDS,
  OUTREACH_OPERATION_TYPES,
  OUTREACH_READINESS_STORAGE_KEY,
  buildCampaignLandingUrl,
  editorialCampaigns,
  parseCampaignLandingSearch,
  parseOutreachOperationPayload,
} from '../editorialCampaigns';
import { buildEditorialOutreachKpis, buildPressMetricCounts, parsePressMetricPayload } from '../pressMetrics';
import { POLICYWATCHER_VERSION } from '../release';

const read = (path: string) => readFileSync(path, 'utf8');

describe('versioned editorial campaign registry', () => {
  it('contains exactly five public-safe cohorts and no contact-level fields', () => {
    expect(editorialCampaigns.map((campaign) => campaign.id)).toEqual(EDITORIAL_CAMPAIGN_IDS);
    expect(new Set(EDITORIAL_CAMPAIGN_IDS).size).toBe(5);
    const serialized = JSON.stringify(editorialCampaigns).toLowerCase();
    for (const forbidden of ['recipient', 'journalistname', 'emailaddress', 'outletname', 'notes', 'messagebody']) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
    expect(editorialCampaigns.every((campaign) => campaign.release === POLICYWATCHER_VERSION)).toBe(true);
  });

  it('builds stable canonical landing URLs with one allowlisted campaign value', () => {
    for (const id of EDITORIAL_CAMPAIGN_IDS) {
      const value = buildCampaignLandingUrl(id);
      const url = new URL(value);
      expect(url.origin).toBe('https://policywatcher.online');
      expect(url.pathname).toBe('/pulse');
      expect([...url.searchParams.keys()]).toEqual(['campaign']);
      expect(url.searchParams.get('campaign')).toBe(id);
      expect(parseCampaignLandingSearch(url.search)).toBe(id);
    }
    expect(parseCampaignLandingSearch('?campaign=unknown')).toBeNull();
    expect(parseCampaignLandingSearch('?campaign=beta13-press-it&recipient=x')).toBeNull();
    expect(parseCampaignLandingSearch('?campaign=beta13-press-it&campaign=beta13-press-it')).toBeNull();
  });

  it('keeps public and protected event parsers separate', () => {
    expect(parsePressMetricPayload({ eventType: 'campaign_landing', target: 'beta13-press-it', locale: 'it' })).not.toBeNull();
    for (const eventType of OUTREACH_OPERATION_TYPES) {
      expect(parsePressMetricPayload({ eventType, target: 'beta13-press-it', locale: 'it' })).toBeNull();
      expect(parseOutreachOperationPayload({ eventType, target: 'beta13-press-it', locale: 'it' })).not.toBeNull();
    }
    expect(parseOutreachOperationPayload({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'en' })).toBeNull();
    expect(parseOutreachOperationPayload({ eventType: 'pitch_sent', target: 'free-text', locale: 'it' })).toBeNull();
    expect(parseOutreachOperationPayload({ eventType: 'pitch_sent', target: 'beta13-press-it', locale: 'it', notes: 'private' })).toBeNull();
  });

  it('calculates reuse, drivers, outcomes and guardrails without percentages', () => {
    const counts = buildPressMetricCounts([
      { eventType: 'story_pack_download', target: 'configured-policy-evidence-scope', _count: { _all: 4 } },
      { eventType: 'citation_copy', target: 'pulse-story', _count: { _all: 3 } },
      { eventType: 'embed_copy', target: 'configured-policy-evidence-scope', _count: { _all: 2 } },
      { eventType: 'pulse_story_view', target: 'configured-policy-evidence-scope', _count: { _all: 10 } },
      { eventType: 'social_card_download', target: 'og', _count: { _all: 5 } },
      { eventType: 'campaign_landing', target: 'beta13-press-it', _count: { _all: 6 } },
      { eventType: 'pitch_sent', target: 'beta13-press-it', _count: { _all: 2 } },
      { eventType: 'reply_received', target: 'beta13-press-it', _count: { _all: 1 } },
      { eventType: 'interview_requested', target: 'beta13-press-it', _count: { _all: 1 } },
      { eventType: 'coverage_confirmed', target: 'beta13-press-it', _count: { _all: 1 } },
      { eventType: 'correction_requested', target: 'beta13-press-it', _count: { _all: 1 } },
    ]);
    const kpis = buildEditorialOutreachKpis(counts);
    expect(kpis.primary.qualifiedEditorialReuseEvents).toBe(9);
    expect(kpis.drivers).toEqual({ pulseStoryViews: 10, socialCardDownloads: 5, campaignLandings: 6, pitchesSent: 2 });
    expect(kpis.outcomes).toEqual({ repliesReceived: 1, interviewRequests: 1, confirmedCoverage: 1 });
    expect(kpis.guardrails.correctionRequests).toBe(1);
    expect(JSON.stringify(kpis)).not.toContain('%');
  });

  it('wires local readiness, valid Pulse landings and a protected admin desk', () => {
    const pulse = read('src/components/pulse/PulseIndexClient.tsx');
    const desk = read('src/app/admin/outreach/page.tsx');
    const navigation = read('src/app/admin/layout.tsx');
    expect(OUTREACH_READINESS_STORAGE_KEY).toContain(POLICYWATCHER_VERSION);
    expect(pulse).toContain('parseCampaignLandingSearch(window.location.search)');
    expect(pulse).toContain("recordPressMetric('campaign_landing'");
    expect(desk).toContain('Reset checklist');
    expect(desk).toContain('aria-live="polite"');
    expect(desk).toContain('No percentages are calculated');
    expect(desk).toContain("disabled={writeLoading || role !== 'admin'}");
    expect(desk).toContain('metric reads do not test writes');
    expect(desk).not.toContain('Event-write availability');
    expect(desk).not.toContain('writeLoading || !metrics');
    expect(navigation).toContain("href: '/admin/outreach'");
  });
});
