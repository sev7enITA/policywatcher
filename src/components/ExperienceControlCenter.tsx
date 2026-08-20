'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Compass,
  Eye,
  Gauge,
  Info,
  Move,
  Pause,
  Sparkles,
} from 'lucide-react';
import type { EvidenceDepth, WorkspaceIntent } from '@/lib/dashboardComposer';
import {
  getExperienceNextAction,
  type ExperienceMotion,
  type ExperiencePreset,
} from '@/lib/experiencePreferences';
import styles from './ExperienceControlCenter.module.css';

interface ExperienceControlCenterProps {
  lang: 'en' | 'it';
  preset: ExperiencePreset;
  motion: ExperienceMotion;
  intent: WorkspaceIntent;
  depth: EvidenceDepth;
  region: 'EU' | 'US' | 'Global';
  onPresetChange: (preset: ExperiencePreset) => void;
  onMotionChange: (motion: ExperienceMotion) => void;
}

const PRESET_ICONS = {
  focus: Eye,
  balanced: Gauge,
  explore: Compass,
} as const;

const COPY = {
  en: {
    kicker: 'Interface settings · August 2026',
    title: 'Interface settings',
    lead: 'The evidence stays unchanged. Only hierarchy, density and secondary modules adapt locally.',
    presetLabel: 'Interface mode',
    presets: {
      focus: { label: 'Focus', detail: 'One decision at a time' },
      balanced: { label: 'Balanced', detail: 'Guidance plus evidence' },
      explore: { label: 'Explore', detail: 'More signals on screen' },
    },
    motionSystem: 'Motion: system',
    motionReduced: 'Motion: reduced',
    next: 'Recommended next step',
    why: 'Configuration basis',
    whyBody: 'This is deterministic personalization based on the selected workspace, evidence depth and your local display preference. It is not an AI judgment and never changes publication or source-quality gates.',
    local: 'Saved only in this browser',
  },
  it: {
    kicker: 'Impostazioni interfaccia · agosto 2026',
    title: 'Impostazioni interfaccia',
    lead: 'Le evidenze non cambiano. Si adattano localmente solo gerarchia, densità e moduli secondari.',
    presetLabel: 'Modalità interfaccia',
    presets: {
      focus: { label: 'Focus', detail: 'Una decisione alla volta' },
      balanced: { label: 'Bilanciata', detail: 'Guida ed evidenze' },
      explore: { label: 'Esplora', detail: 'Più segnali sullo schermo' },
    },
    motionSystem: 'Movimento: sistema',
    motionReduced: 'Movimento: ridotto',
    next: 'Prossimo passo consigliato',
    why: 'Criterio di configurazione',
    whyBody: 'È una personalizzazione deterministica basata su workspace, profondità delle evidenze e preferenza visiva locale. Non è un giudizio AI e non modifica mai i gate di pubblicazione o qualità delle fonti.',
    local: 'Salvato solo in questo browser',
  },
} as const;

export default function ExperienceControlCenter({
  lang,
  preset,
  motion,
  intent,
  depth,
  region,
  onPresetChange,
  onMotionChange,
}: ExperienceControlCenterProps) {
  const t = COPY[lang];
  const nextAction = getExperienceNextAction(intent);

  return (
    <section className={styles.panel} aria-labelledby="experience-control-title" data-testid="experience-control-center">
      <div className={styles.intro}>
        <span className={styles.kicker}>
          <Sparkles size={14} aria-hidden="true" />
          {t.kicker}
        </span>
        <h2 id="experience-control-title">{t.title}</h2>
        <p>{t.lead}</p>
      </div>

      <div className={styles.controls}>
        <span className={styles.controlLabel}>{t.presetLabel}</span>
        <div className={styles.presetGroup} role="group" aria-label={t.presetLabel}>
          {(['focus', 'balanced', 'explore'] as const).map((option) => {
            const Icon = PRESET_ICONS[option];
            const copy = t.presets[option];
            return (
              <button
                key={option}
                type="button"
                className={styles.presetButton}
                data-active={preset === option ? 'true' : 'false'}
                aria-pressed={preset === option}
                onClick={() => onPresetChange(option)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  <strong>{copy.label}</strong>
                  <small>{copy.detail}</small>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.motionButton}
          aria-pressed={motion === 'reduced'}
          onClick={() => onMotionChange(motion === 'reduced' ? 'system' : 'reduced')}
        >
          {motion === 'reduced' ? <Pause size={16} aria-hidden="true" /> : <Move size={16} aria-hidden="true" />}
          {motion === 'reduced' ? t.motionReduced : t.motionSystem}
        </button>
      </div>

      <div className={styles.actionCard}>
        <span>{t.next}</span>
        <strong>{nextAction.label[lang]}</strong>
        <p>{nextAction.detail[lang]}</p>
        <Link href={nextAction.href}>
          {nextAction.label[lang]}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <details className={styles.explainer}>
        <summary>
          <Info size={15} aria-hidden="true" />
          {t.why}
        </summary>
        <p>{t.whyBody}</p>
        <div className={styles.contextLine}>
          <span>{intent}</span>
          <span>{depth}</span>
          <span>{region}</span>
          <span>{t.local}</span>
        </div>
      </details>
    </section>
  );
}
