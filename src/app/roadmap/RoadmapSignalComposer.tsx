'use client';

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardCopy,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  ROADMAP_SIGNAL_FIELD_LIMITS,
  ROADMAP_SIGNAL_STORAGE_KEY,
  bringRoadmapSignalStepIntoView,
  buildRoadmapSignalIssueUrl,
  createRoadmapSignalDraft,
  generateRoadmapSignalIssue,
  parseRoadmapSignalDraft,
  serializeRoadmapSignalDraft,
  validateRoadmapSignalFields,
  type RoadmapSignalDraft,
  type RoadmapSignalField,
  type RoadmapSignalFields,
  type RoadmapSignalStep,
  type RoadmapSignalValidationErrors,
} from '@/lib/roadmapSignals';
import styles from './roadmap.module.css';

const repositoryUrl = 'https://github.com/sev7enITA/policywatcher';
const stepNames = ['Need', 'Evidence', 'Limits', 'Review'] as const;
const stepFields: Record<Exclude<RoadmapSignalStep, 3>, RoadmapSignalField[]> = {
  0: ['title', 'track', 'role', 'decision'],
  1: ['workaround', 'evidenceNeed', 'evidenceDepth'],
  2: ['limitations'],
};
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type RoadmapSignalComposerRequest =
  | { id: number; mode: 'new' }
  | { id: number; mode: 'resume' }
  | { id: number; mode: 'candidate'; title: string; track: string };

type RoadmapSignalComposerProps = {
  request: RoadmapSignalComposerRequest | null;
  tracks: string[];
  onClose: () => void;
  onDraftAvailabilityChange: (available: boolean) => void;
};

function FieldCounter({ field, value }: { field: keyof typeof ROADMAP_SIGNAL_FIELD_LIMITS; value: string }) {
  const limit = ROADMAP_SIGNAL_FIELD_LIMITS[field];
  return (
    <span className={styles.fieldCounter} id={`${field}-counter`}>
      {value.length}/{limit}
    </span>
  );
}

function FieldError({ field, errors }: { field: RoadmapSignalField; errors: RoadmapSignalValidationErrors }) {
  if (!errors[field]) return null;
  return <span className={styles.fieldError} id={`${field}-error`}>{errors[field]}</span>;
}

function hasDraftContent(fields: RoadmapSignalFields) {
  return Object.values(fields).some((value) => value.trim().length > 0);
}

export default function RoadmapSignalComposer({
  request,
  tracks,
  onClose,
  onDraftAvailabilityChange,
}: RoadmapSignalComposerProps) {
  const [draft, setDraft] = useState<RoadmapSignalDraft>(() => createRoadmapSignalDraft());
  const [highestStep, setHighestStep] = useState<RoadmapSignalStep>(0);
  const [errors, setErrors] = useState<RoadmapSignalValidationErrors>({});
  const [draftStatus, setDraftStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousStepRef = useRef<RoadmapSignalStep | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = window.localStorage.getItem(ROADMAP_SIGNAL_STORAGE_KEY);
      const saved = parseRoadmapSignalDraft(raw);
      if (raw && !saved) {
        window.localStorage.removeItem(ROADMAP_SIGNAL_STORAGE_KEY);
        queueMicrotask(() => {
          if (!cancelled) setDraftStatus('An invalid or oversized local draft was removed safely.');
        });
      }
      onDraftAvailabilityChange(Boolean(saved && hasDraftContent(saved.fields)));
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setDraftStatus('Local draft storage is unavailable in this browser.');
      });
      onDraftAvailabilityChange(false);
    }
    return () => {
      cancelled = true;
    };
  }, [onDraftAvailabilityChange]);

  useEffect(() => {
    if (!request) return;

    let next = createRoadmapSignalDraft({}, new Date().toISOString());
    let nextHighest: RoadmapSignalStep = 0;
    let shouldPersist = false;
    let nextStatus = '';

    if (request.mode === 'candidate') {
      next = createRoadmapSignalDraft(
        { title: request.title, track: request.track },
        new Date().toISOString(),
      );
      shouldPersist = true;
    } else if (request.mode === 'resume') {
      try {
        const saved = parseRoadmapSignalDraft(window.localStorage.getItem(ROADMAP_SIGNAL_STORAGE_KEY));
        if (saved) {
          next = saved;
          nextHighest = saved.step;
          nextStatus = `Local draft restored from ${new Date(saved.savedAt).toLocaleString()}.`;
        } else {
          nextStatus = 'No valid local draft was available. A new proposal was opened.';
        }
      } catch {
        nextStatus = 'Local draft storage is unavailable in this browser.';
      }
    } else {
      nextStatus = request.mode === 'new'
        ? 'New proposal. It will stay local to this browser after you begin editing.'
        : 'Candidate profile prepared locally in this browser.';
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setDraft(next);
      setHighestStep(nextHighest);
      setErrors({});
      setCopyStatus('');
      setConfirmDelete(false);
      setDraftStatus(nextStatus);
      setIsDirty(shouldPersist);
    });
    return () => {
      cancelled = true;
    };
  }, [request]);

  useEffect(() => {
    if (!request || !isDirty) return;
    const timeout = window.setTimeout(() => {
      const updated = { ...draft, savedAt: new Date().toISOString() };
      try {
        window.localStorage.setItem(ROADMAP_SIGNAL_STORAGE_KEY, serializeRoadmapSignalDraft(updated));
        setDraft(updated);
        setDraftStatus('Draft saved locally in this browser.');
        setIsDirty(false);
        onDraftAvailabilityChange(hasDraftContent(updated.fields));
      } catch {
        setDraftStatus('This browser could not save the local draft. You can still copy the reviewed proposal.');
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draft, isDirty, onDraftAvailabilityChange, request]);

  useEffect(() => {
    if (!request) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    });

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose, request]);

  useEffect(() => {
    if (!request) {
      previousStepRef.current = null;
      return;
    }
    if (previousStepRef.current === null) {
      previousStepRef.current = draft.step;
      return;
    }
    if (previousStepRef.current === draft.step) return;
    previousStepRef.current = draft.step;
    const frame = window.requestAnimationFrame(() => {
      const body = bodyRef.current;
      if (!body) return;
      const heading = body.querySelector<HTMLElement>('[data-composer-step-heading]');
      bringRoadmapSignalStepIntoView(body, heading);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [draft.step, request]);

  const issue = useMemo(() => {
    if (Object.keys(validateRoadmapSignalFields(draft.fields)).length > 0) return null;
    return generateRoadmapSignalIssue(draft.fields);
  }, [draft.fields]);

  const issueUrl = useMemo(
    () => (issue ? buildRoadmapSignalIssueUrl(draft.fields, repositoryUrl) : null),
    [draft.fields, issue],
  );

  if (!request) return null;

  function updateField(field: RoadmapSignalField, value: string) {
    setDraft((current) => ({ ...current, fields: { ...current.fields, [field]: value } }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setIsDirty(true);
    setCopyStatus('');
  }

  function goToStep(nextStep: RoadmapSignalStep) {
    if (nextStep < draft.step) {
      setDraft((current) => ({ ...current, step: nextStep }));
      setErrors({});
      setIsDirty(true);
      return;
    }

    const allErrors = validateRoadmapSignalFields(draft.fields);
    const relevantFields = draft.step === 3 ? Object.keys(allErrors) as RoadmapSignalField[] : stepFields[draft.step];
    const nextErrors = Object.fromEntries(
      relevantFields.filter((field) => allErrors[field]).map((field) => [field, allErrors[field]]),
    ) as RoadmapSignalValidationErrors;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setDraft((current) => ({ ...current, step: nextStep }));
    setHighestStep((current) => Math.max(current, nextStep) as RoadmapSignalStep);
    setErrors({});
    setIsDirty(true);
  }

  async function copyProposal() {
    if (!issue) return;
    try {
      await navigator.clipboard.writeText(`${issue.title}\n\n${issue.body}`);
      setCopyStatus('Proposal copied.');
    } catch {
      setCopyStatus('Copy is unavailable. Select the reviewed proposal text below.');
    }
  }

  function deleteDraft() {
    try {
      window.localStorage.removeItem(ROADMAP_SIGNAL_STORAGE_KEY);
    } catch {
      // Reset still succeeds in memory when browser storage is restricted.
    }
    setDraft(createRoadmapSignalDraft({}, new Date().toISOString()));
    setHighestStep(0);
    setErrors({});
    setCopyStatus('');
    setDraftStatus('Local draft deleted. A new empty proposal is ready.');
    setConfirmDelete(false);
    setIsDirty(false);
    onDraftAvailabilityChange(false);
  }

  function trapEnterOnTextarea(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && draft.step < 3) {
      event.preventDefault();
      goToStep((draft.step + 1) as RoadmapSignalStep);
    }
  }

  const describedBy = (field: RoadmapSignalField, counter?: keyof typeof ROADMAP_SIGNAL_FIELD_LIMITS) =>
    [counter ? `${counter}-counter` : '', errors[field] ? `${field}-error` : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={styles.composerOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.composerDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-signal-title"
        aria-describedby="roadmap-signal-boundary"
      >
        <header className={styles.composerHeader}>
          <div>
            <span className={styles.composerKicker}>Browser-local signal composer</span>
            <h2 id="roadmap-signal-title">Build an evidence-ready proposal</h2>
            <p id="roadmap-signal-boundary">
              Your draft stays in this browser. PolicyWatcher does not receive these contents; GitHub opens only after your explicit review action.
            </p>
          </div>
          <button type="button" className={styles.composerClose} onClick={onClose} aria-label="Close proposal composer" data-dialog-focus>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.composerSteps} aria-label="Proposal steps">
          {stepNames.map((name, index) => {
            const step = index as RoadmapSignalStep;
            const isCurrent = draft.step === step;
            const isComplete = step < draft.step || (step <= highestStep && step !== draft.step);
            return (
              <button
                key={name}
                type="button"
                className={isCurrent ? styles.composerStepCurrent : ''}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={step > highestStep}
                onClick={() => goToStep(step)}
              >
                <span>{isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
                {name}
              </button>
            );
          })}
        </nav>

        <div className={styles.composerBody} ref={bodyRef}>
          <div className={styles.composerLocalNotice} role="status" aria-live="polite">
            <Save size={17} aria-hidden="true" />
            <span>{draftStatus || 'Draft storage is local to this browser and bounded in size.'}</span>
          </div>

          {Object.keys(errors).length > 0 ? (
            <div className={styles.validationSummary} role="alert">
              Review the highlighted fields before continuing.
            </div>
          ) : null}

          {draft.step === 0 ? (
            <section className={styles.composerPanel} aria-labelledby="signal-need-heading">
              <div className={styles.composerPanelHeading}>
                <span>01 / Need</span>
                <h3 id="signal-need-heading" tabIndex={-1} data-composer-step-heading>Name the job before the feature</h3>
                <p>Give reviewers enough context to understand who needs this and what decision it should support.</p>
              </div>
              <div className={styles.composerFields}>
                <label className={styles.composerField}>
                  <span>Proposal title <FieldCounter field="title" value={draft.fields.title} /></span>
                  <input
                    value={draft.fields.title}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.title}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('title', event.target.value)}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={describedBy('title', 'title')}
                    placeholder="Example: Cross-version review workspace"
                  />
                  <FieldError field="title" errors={errors} />
                </label>
                <label className={styles.composerField}>
                  <span>Roadmap track <FieldCounter field="track" value={draft.fields.track} /></span>
                  <input
                    list="roadmap-track-options"
                    value={draft.fields.track}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.track}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('track', event.target.value)}
                    aria-invalid={Boolean(errors.track)}
                    aria-describedby={describedBy('track', 'track')}
                    placeholder="Choose or name a track"
                  />
                  <datalist id="roadmap-track-options">
                    {tracks.map((track) => <option value={track} key={track} />)}
                  </datalist>
                  <FieldError field="track" errors={errors} />
                </label>
                <label className={styles.composerField}>
                  <span>Your role <FieldCounter field="role" value={draft.fields.role} /></span>
                  <input
                    value={draft.fields.role}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.role}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('role', event.target.value)}
                    aria-invalid={Boolean(errors.role)}
                    aria-describedby={describedBy('role', 'role')}
                    placeholder="Researcher, citizen, GRC reviewer, builder..."
                  />
                  <FieldError field="role" errors={errors} />
                </label>
                <label className={styles.composerField}>
                  <span>Decision or job to accomplish <FieldCounter field="decision" value={draft.fields.decision} /></span>
                  <textarea
                    value={draft.fields.decision}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.decision}
                    onChange={(event) => updateField('decision', event.target.value)}
                    onKeyDown={trapEnterOnTextarea}
                    aria-invalid={Boolean(errors.decision)}
                    aria-describedby={describedBy('decision', 'decision')}
                    placeholder="What should PolicyWatcher help you decide, verify or communicate?"
                  />
                  <FieldError field="decision" errors={errors} />
                </label>
              </div>
            </section>
          ) : null}

          {draft.step === 1 ? (
            <section className={styles.composerPanel} aria-labelledby="signal-evidence-heading">
              <div className={styles.composerPanelHeading}>
                <span>02 / Evidence</span>
                <h3 id="signal-evidence-heading" tabIndex={-1} data-composer-step-heading>Describe the proof and output</h3>
                <p>Separate the current workaround from the evidence surface that would make the proposal useful.</p>
              </div>
              <div className={styles.composerFields}>
                <label className={styles.composerField}>
                  <span>Current workflow or workaround <FieldCounter field="workaround" value={draft.fields.workaround} /></span>
                  <textarea
                    value={draft.fields.workaround}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.workaround}
                    onChange={(event) => updateField('workaround', event.target.value)}
                    onKeyDown={trapEnterOnTextarea}
                    aria-invalid={Boolean(errors.workaround)}
                    aria-describedby={describedBy('workaround', 'workaround')}
                    placeholder="What do you do today, and where does it break down?"
                  />
                  <FieldError field="workaround" errors={errors} />
                </label>
                <label className={styles.composerField}>
                  <span>Evidence, view or export needed <FieldCounter field="evidenceNeed" value={draft.fields.evidenceNeed} /></span>
                  <textarea
                    value={draft.fields.evidenceNeed}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.evidenceNeed}
                    onChange={(event) => updateField('evidenceNeed', event.target.value)}
                    onKeyDown={trapEnterOnTextarea}
                    aria-invalid={Boolean(errors.evidenceNeed)}
                    aria-describedby={describedBy('evidenceNeed', 'evidenceNeed')}
                    placeholder="Name the source evidence, comparison, alert, view or export you need."
                  />
                  <FieldError field="evidenceNeed" errors={errors} />
                </label>
                <fieldset className={styles.depthChoice} aria-invalid={Boolean(errors.evidenceDepth)} aria-describedby={errors.evidenceDepth ? 'evidenceDepth-error' : undefined}>
                  <legend>Preferred evidence depth</legend>
                  <div>
                    {(['snapshot', 'operational', 'forensic'] as const).map((depth) => (
                      <label key={depth}>
                        <input
                          type="radio"
                          name="roadmap-evidence-depth"
                          value={depth}
                          checked={draft.fields.evidenceDepth === depth}
                          onChange={() => updateField('evidenceDepth', depth)}
                        />
                        <span>{depth}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError field="evidenceDepth" errors={errors} />
                </fieldset>
              </div>
            </section>
          ) : null}

          {draft.step === 2 ? (
            <section className={styles.composerPanel} aria-labelledby="signal-limits-heading">
              <div className={styles.composerPanelHeading}>
                <span>03 / Limits</span>
                <h3 id="signal-limits-heading" tabIndex={-1} data-composer-step-heading>Make the boundary reviewable</h3>
                <p>A useful signal explains what uncertainty, risk or implementation constraint would still be acceptable.</p>
              </div>
              <div className={styles.composerFields}>
                <label className={styles.composerField}>
                  <span>Acceptable limitations or risks <FieldCounter field="limitations" value={draft.fields.limitations} /></span>
                  <textarea
                    value={draft.fields.limitations}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.limitations}
                    onChange={(event) => updateField('limitations', event.target.value)}
                    onKeyDown={trapEnterOnTextarea}
                    aria-invalid={Boolean(errors.limitations)}
                    aria-describedby={describedBy('limitations', 'limitations')}
                    placeholder="What must remain explicit? Which tradeoffs are acceptable?"
                  />
                  <FieldError field="limitations" errors={errors} />
                </label>
                <label className={styles.composerField}>
                  <span>Optional acceptance signal <FieldCounter field="acceptanceSignal" value={draft.fields.acceptanceSignal} /></span>
                  <textarea
                    value={draft.fields.acceptanceSignal}
                    maxLength={ROADMAP_SIGNAL_FIELD_LIMITS.acceptanceSignal}
                    onChange={(event) => updateField('acceptanceSignal', event.target.value)}
                    onKeyDown={trapEnterOnTextarea}
                    aria-describedby={describedBy('acceptanceSignal', 'acceptanceSignal')}
                    placeholder="How would you know the proposal is useful enough to adopt?"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {draft.step === 3 && issue && issueUrl ? (
            <section className={styles.composerReview} aria-labelledby="signal-review-heading">
              <div className={styles.composerPanelHeading}>
                <span>04 / Review</span>
                <h3 id="signal-review-heading" tabIndex={-1} data-composer-step-heading>Review the dossier before handoff</h3>
                <p>No issue is created until you choose to open GitHub and complete its submission flow.</p>
              </div>
              <div className={styles.dossierRail} aria-label="Proposal evidence sequence">
                {stepNames.map((name, index) => (
                  <div key={name}>
                    <span><Check size={14} aria-hidden="true" /></span>
                    <strong>{name}</strong>
                    {index < stepNames.length - 1 ? <ChevronRight size={16} aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
              <dl className={styles.reviewSummary}>
                <div><dt>Proposal</dt><dd>{draft.fields.title}</dd></div>
                <div><dt>Track</dt><dd>{draft.fields.track}</dd></div>
                <div><dt>Role</dt><dd>{draft.fields.role}</dd></div>
                <div><dt>Evidence depth</dt><dd>{draft.fields.evidenceDepth}</dd></div>
                <div className={styles.reviewWide}><dt>Need</dt><dd>{draft.fields.decision}</dd></div>
                <div className={styles.reviewWide}><dt>Evidence</dt><dd>{draft.fields.evidenceNeed}</dd></div>
                <div className={styles.reviewWide}><dt>Limits</dt><dd>{draft.fields.limitations}</dd></div>
              </dl>
              <label className={styles.proposalPreview}>
                <span>GitHub issue preview</span>
                <textarea readOnly value={`${issue.title}\n\n${issue.body}`} aria-label="Reviewed GitHub issue title and body" />
              </label>
              <p className={styles.githubBoundary}>
                GitHub availability, authentication and repository permissions are external to PolicyWatcher.
              </p>
            </section>
          ) : null}
        </div>

        <footer className={styles.composerFooter}>
          <div className={styles.deleteDraftArea}>
            {!confirmDelete ? (
              <button type="button" className={styles.deleteDraftButton} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} aria-hidden="true" />
                Reset and delete local draft
              </button>
            ) : (
              <div className={styles.deleteConfirm} role="group" aria-label="Confirm local draft deletion">
                <span>Delete this browser-local draft?</span>
                <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button type="button" onClick={deleteDraft}>Delete draft</button>
              </div>
            )}
          </div>
          <div className={styles.composerActions}>
            {draft.step > 0 ? (
              <button type="button" className={styles.composerBack} onClick={() => goToStep((draft.step - 1) as RoadmapSignalStep)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
            ) : null}
            {draft.step < 3 ? (
              <button type="button" className={styles.composerNext} onClick={() => goToStep((draft.step + 1) as RoadmapSignalStep)}>
                Continue to {stepNames[draft.step + 1]} <ChevronRight size={16} aria-hidden="true" />
              </button>
            ) : issueUrl ? (
              <>
                <button type="button" className={styles.composerCopy} onClick={() => void copyProposal()}>
                  <ClipboardCopy size={16} aria-hidden="true" /> Copy proposal
                </button>
                <a className={styles.composerNext} href={issueUrl} target="_blank" rel="noopener noreferrer">
                  Open reviewed proposal on GitHub <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </>
            ) : null}
          </div>
          <span className={styles.composerLiveStatus} role="status" aria-live="polite">{copyStatus}</span>
        </footer>
      </div>
    </div>
  );
}
