import type {
  DashboardComposition,
  DashboardDensity,
  DashboardView,
  WorkspaceIntent,
} from './dashboardComposer';

export const EXPERIENCE_PREFERENCES_STORAGE_KEY = 'policywatcher:experience-preferences:v1';

export type ExperiencePreset = 'focus' | 'balanced' | 'explore';
export type ExperienceMotion = 'system' | 'reduced';

export interface ExperiencePreferences {
  preset: ExperiencePreset;
  motion: ExperienceMotion;
}

export interface ExperiencePresentation {
  density: DashboardDensity;
  view: DashboardView;
  showStats: boolean;
  showMarketPulse: boolean;
}

export interface ExperienceNextAction {
  href: string;
  label: { en: string; it: string };
  detail: { en: string; it: string };
}

export const DEFAULT_EXPERIENCE_PREFERENCES: ExperiencePreferences = Object.freeze({
  preset: 'balanced',
  motion: 'system',
});

const NEXT_ACTIONS: Record<WorkspaceIntent, ExperienceNextAction> = Object.freeze({
  citizen: {
    href: '/what-changed#paste-notice',
    label: { en: 'Check a policy notice', it: 'Verifica una comunicazione' },
    detail: {
      en: 'Start from the message you received and trace it to public evidence.',
      it: 'Parti dal messaggio ricevuto e risali alle evidenze pubbliche.',
    },
  },
  grc: {
    href: '#source-quality',
    label: { en: 'Review source quality', it: 'Rivedi la qualità delle fonti' },
    detail: {
      en: 'Resolve retrieval warnings before interpreting the evidence.',
      it: 'Risolvi gli avvisi di recupero prima di interpretare le evidenze.',
    },
  },
  research: {
    href: '/observatory',
    label: { en: 'Open the Observatory', it: 'Apri l’Osservatorio' },
    detail: {
      en: 'Move from the briefing to the curated source landscape.',
      it: 'Passa dal briefing al panorama delle fonti curate.',
    },
  },
  builder: {
    href: '/developers',
    label: { en: 'Inspect developer contracts', it: 'Esamina i contratti developer' },
    detail: {
      en: 'Continue with APIs, schemas and integration boundaries.',
      it: 'Continua con API, schemi e confini di integrazione.',
    },
  },
});

export function parseExperiencePreferences(value: string | null | undefined): ExperiencePreferences | null {
  if (!value) return null;

  try {
    const candidate = JSON.parse(value) as Partial<ExperiencePreferences>;
    if (
      (candidate.preset === 'focus' || candidate.preset === 'balanced' || candidate.preset === 'explore')
      && (candidate.motion === 'system' || candidate.motion === 'reduced')
    ) {
      return { preset: candidate.preset, motion: candidate.motion };
    }
  } catch {
    // Invalid browser state must never prevent the dashboard from loading.
  }

  return null;
}

export function getExperiencePresentation(
  preset: ExperiencePreset,
  workspace: DashboardComposition,
): ExperiencePresentation {
  if (preset === 'focus') {
    return {
      density: 'comfortable',
      view: 'focus',
      showStats: false,
      showMarketPulse: false,
    };
  }

  if (preset === 'explore') {
    return {
      density: 'compact',
      view: 'cards',
      showStats: workspace.visibleModules.includes('stats'),
      showMarketPulse: workspace.visibleModules.includes('marketPulse'),
    };
  }

  return {
    density: workspace.density,
    view: workspace.view,
    showStats: workspace.showStats,
    showMarketPulse: workspace.showMarketPulse,
  };
}

export function getExperienceNextAction(intent: WorkspaceIntent): ExperienceNextAction {
  return NEXT_ACTIONS[intent];
}
