import {
  EDITORIAL_CAMPAIGN_IDS,
  OUTREACH_OPERATION_TYPES,
  type EditorialCampaignId,
  type OutreachOperationType,
} from './editorialCampaigns';

export const PRESS_METRIC_TARGETS = {
  press_package_download: ['en', 'it'],
  data_room_view: ['data-room'],
  press_contact_intent: ['press', 'fact-checking', 'interview', 'speaking'],
  pulse_story_view: ['configured-policy-evidence-scope', 'public-evidence-publication-gate', 'versioned-beta-release-records'],
  story_pack_download: ['configured-policy-evidence-scope', 'public-evidence-publication-gate', 'versioned-beta-release-records'],
  social_card_download: ['og', 'square', 'feed', 'story'],
  citation_copy: ['pulse-story', 'data-room', 'release'],
  embed_copy: ['configured-policy-evidence-scope', 'public-evidence-publication-gate', 'versioned-beta-release-records'],
  launch_outbound: ['product-hunt', 'show-hn'],
  campaign_landing: EDITORIAL_CAMPAIGN_IDS,
} as const;

export type PressMetricEventType = keyof typeof PRESS_METRIC_TARGETS;
export type PressMetricLocale = 'en' | 'it';
export type PressMetricTarget = (typeof PRESS_METRIC_TARGETS)[PressMetricEventType][number];

export interface PressMetricPayload {
  eventType: PressMetricEventType;
  target: PressMetricTarget;
  locale: PressMetricLocale;
}

export interface PressMetricGroup {
  eventType: string;
  target: string;
  _count: { _all: number };
}

export interface PressMetricCounts {
  pressPackageDownloadIntents: { total: number; en: number; it: number };
  dataRoomViews: { total: number };
  pressContactIntents: {
    total: number;
    press: number;
    factChecking: number;
    interview: number;
    speaking: number;
  };
  editorialFunnel: {
    storyViews: number;
    storyPackDownloads: number;
    socialCardDownloads: number;
    citationCopies: number;
    embedCopies: number;
    launchOutboundActions: number;
  };
  campaignLandings: {
    total: number;
    byCampaign: Record<EditorialCampaignId, number>;
  };
  outreachOperations: {
    total: number;
    pitchSent: number;
    replyReceived: number;
    interviewRequested: number;
    coverageConfirmed: number;
    correctionRequested: number;
    byCampaign: Record<EditorialCampaignId, Record<OutreachOperationType, number>>;
  };
}

const PAYLOAD_KEYS = ['eventType', 'target', 'locale'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parsePressMetricPayload(value: unknown): PressMetricPayload | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== PAYLOAD_KEYS.length || keys.some((key) => !PAYLOAD_KEYS.includes(key as typeof PAYLOAD_KEYS[number]))) {
    return null;
  }

  const { eventType, target, locale } = value;
  if (typeof eventType !== 'string' || !(eventType in PRESS_METRIC_TARGETS)) return null;
  if (locale !== 'en' && locale !== 'it') return null;
  if (typeof target !== 'string') return null;
  const allowedTargets = PRESS_METRIC_TARGETS[eventType as PressMetricEventType] as readonly string[];
  if (!allowedTargets.includes(target)) return null;

  return { eventType: eventType as PressMetricEventType, target: target as PressMetricTarget, locale };
}

export function createPressMetricRecord(payload: PressMetricPayload, createdAt: Date) {
  return {
    eventType: payload.eventType,
    target: payload.target,
    locale: payload.locale,
    createdAt,
  };
}

export function emptyPressMetricCounts(): PressMetricCounts {
  const emptyOperations = () => Object.fromEntries(
    OUTREACH_OPERATION_TYPES.map((eventType) => [eventType, 0])
  ) as Record<OutreachOperationType, number>;
  return {
    pressPackageDownloadIntents: { total: 0, en: 0, it: 0 },
    dataRoomViews: { total: 0 },
    pressContactIntents: { total: 0, press: 0, factChecking: 0, interview: 0, speaking: 0 },
    editorialFunnel: {
      storyViews: 0,
      storyPackDownloads: 0,
      socialCardDownloads: 0,
      citationCopies: 0,
      embedCopies: 0,
      launchOutboundActions: 0,
    },
    campaignLandings: {
      total: 0,
      byCampaign: Object.fromEntries(EDITORIAL_CAMPAIGN_IDS.map((id) => [id, 0])) as Record<EditorialCampaignId, number>,
    },
    outreachOperations: {
      total: 0,
      pitchSent: 0,
      replyReceived: 0,
      interviewRequested: 0,
      coverageConfirmed: 0,
      correctionRequested: 0,
      byCampaign: Object.fromEntries(EDITORIAL_CAMPAIGN_IDS.map((id) => [id, emptyOperations()])) as Record<EditorialCampaignId, Record<OutreachOperationType, number>>,
    },
  };
}

export function buildPressMetricCounts(groups: PressMetricGroup[]): PressMetricCounts {
  const counts = emptyPressMetricCounts();

  for (const group of groups) {
    const count = Number.isFinite(group._count._all) ? Math.max(0, group._count._all) : 0;
    if (group.eventType === 'press_package_download' && (group.target === 'en' || group.target === 'it')) {
      counts.pressPackageDownloadIntents[group.target] += count;
      counts.pressPackageDownloadIntents.total += count;
    } else if (group.eventType === 'data_room_view' && group.target === 'data-room') {
      counts.dataRoomViews.total += count;
    } else if (group.eventType === 'press_contact_intent') {
      const key = group.target === 'fact-checking' ? 'factChecking' : group.target;
      if (key === 'press' || key === 'factChecking' || key === 'interview' || key === 'speaking') {
        counts.pressContactIntents[key] += count;
        counts.pressContactIntents.total += count;
      }
    } else if (group.eventType === 'pulse_story_view') {
      counts.editorialFunnel.storyViews += count;
    } else if (group.eventType === 'story_pack_download') {
      counts.editorialFunnel.storyPackDownloads += count;
    } else if (group.eventType === 'social_card_download') {
      counts.editorialFunnel.socialCardDownloads += count;
    } else if (group.eventType === 'citation_copy') {
      counts.editorialFunnel.citationCopies += count;
    } else if (group.eventType === 'embed_copy') {
      counts.editorialFunnel.embedCopies += count;
    } else if (group.eventType === 'launch_outbound') {
      counts.editorialFunnel.launchOutboundActions += count;
    } else if (group.eventType === 'campaign_landing' && (EDITORIAL_CAMPAIGN_IDS as readonly string[]).includes(group.target)) {
      counts.campaignLandings.total += count;
      counts.campaignLandings.byCampaign[group.target as EditorialCampaignId] += count;
    } else if ((OUTREACH_OPERATION_TYPES as readonly string[]).includes(group.eventType) && (EDITORIAL_CAMPAIGN_IDS as readonly string[]).includes(group.target)) {
      const eventType = group.eventType as OutreachOperationType;
      const campaignId = group.target as EditorialCampaignId;
      const field = {
        pitch_sent: 'pitchSent',
        reply_received: 'replyReceived',
        interview_requested: 'interviewRequested',
        coverage_confirmed: 'coverageConfirmed',
        correction_requested: 'correctionRequested',
      }[eventType] as 'pitchSent' | 'replyReceived' | 'interviewRequested' | 'coverageConfirmed' | 'correctionRequested';
      counts.outreachOperations.total += count;
      counts.outreachOperations[field] += count;
      counts.outreachOperations.byCampaign[campaignId][eventType] += count;
    }
  }

  return counts;
}

export function buildEditorialOutreachKpis(counts: PressMetricCounts) {
  return {
    primary: {
      qualifiedEditorialReuseEvents:
        counts.editorialFunnel.storyPackDownloads
        + counts.editorialFunnel.citationCopies
        + counts.editorialFunnel.embedCopies,
    },
    drivers: {
      pulseStoryViews: counts.editorialFunnel.storyViews,
      socialCardDownloads: counts.editorialFunnel.socialCardDownloads,
      campaignLandings: counts.campaignLandings.total,
      pitchesSent: counts.outreachOperations.pitchSent,
    },
    outcomes: {
      repliesReceived: counts.outreachOperations.replyReceived,
      interviewRequests: counts.outreachOperations.interviewRequested,
      confirmedCoverage: counts.outreachOperations.coverageConfirmed,
    },
    guardrails: {
      correctionRequests: counts.outreachOperations.correctionRequested,
    },
  };
}

export function recordPressMetric(eventType: PressMetricEventType, target: PressMetricTarget, locale: PressMetricLocale): void {
  if (typeof window === 'undefined') return;
  const payload = parsePressMetricPayload({ eventType, target, locale });
  if (!payload) return;

  void fetch('/api/press-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}
