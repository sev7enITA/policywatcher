/**
 * @file SubscribeModal.tsx
 *
 * Modal dialog that lets users subscribe to email alerts for policy changes.
 *
 * Collects:
 *  - Email address (required)
 *  - Name (optional)
 *  - Regions of interest (EU / US / Global)
 *  - Industry sectors
 *  - Notification frequency (real-time or weekly digest)
 *
 * On submit, POSTs to `/api/subscribers`. Handles 409 (duplicate email)
 * and generic errors gracefully. After success, shows a confirmation
 * banner with unsubscribe instructions.
 *
 * Supports EN/IT localisation.
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { IconSubscribe } from '@/components/icons/PolicyWatcherIcons';
import type { Lang } from '@/types';
import styles from './SubscribeModal.module.css';

/** Props for the {@link SubscribeModal} component. */
interface SubscribeModalProps {
  /** Whether the modal overlay is currently visible. */
  isOpen: boolean;
  /** Dismiss callback. */
  onClose: () => void;
  /** Active UI language. */
  lang: Lang;
}

const translations = {
  en: {
    title: 'Subscribe to Policy Alerts',
    subtitle:
      'Get notified when monitored companies update their privacy policies, terms of service, or AI governance terms.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    nameLabel: 'Name (Optional)',
    namePlaceholder: 'Your name',
    regionsLabel: 'Regions of Interest',
    industriesLabel: 'Industries',
    frequencyLabel: 'Notification Frequency',
    freqInstant: 'Real-time Alerts',
    freqWeekly: 'Weekly Digest',
    submitText: 'Subscribe',
    submitting: 'Subscribing...',
    successTitle: 'Subscription confirmed',
    successMessage:
      'You will receive alerts when policy changes are detected in your selected regions. A confirmation email has been sent with your subscription details and instructions on how to unsubscribe at any time.',
    errorDuplicate: 'This email is already subscribed.',
    errorGeneric: 'An error occurred. Please try again.',
    emailRequired: 'Please enter a valid email address.',
  },
  it: {
    title: 'Iscriviti agli Avvisi Policy',
    subtitle:
      'Ricevi notifiche quando le aziende monitorate aggiornano le loro policy sulla privacy, termini di servizio o regole di governance AI.',
    emailLabel: 'Indirizzo Email',
    emailPlaceholder: 'la-tua@email.com',
    nameLabel: 'Nome (Facoltativo)',
    namePlaceholder: 'Il tuo nome',
    regionsLabel: 'Regioni di Interesse',
    industriesLabel: 'Settori',
    frequencyLabel: 'Frequenza Notifiche',
    freqInstant: 'In tempo reale',
    freqWeekly: 'Riepilogo settimanale',
    submitText: 'Iscriviti',
    submitting: 'Iscrizione in corso...',
    successTitle: 'Iscrizione confermata',
    successMessage:
      'Riceverai notifiche quando verranno rilevati cambiamenti nelle policy delle regioni selezionate. Ti abbiamo inviato un\'email di conferma con i dettagli dell\'iscrizione e le istruzioni per disiscriverti in qualsiasi momento.',
    errorDuplicate: 'Questa email risulta già iscritta.',
    errorGeneric: 'Si è verificato un errore. Riprova.',
    emailRequired: 'Inserisci un indirizzo email valido.',
  },
};

const REGIONS = ['EU', 'US', 'Global'] as const;
const INDUSTRIES = ['Tech Giant', 'FinTech'] as const;

/**
 * Email alert subscription form rendered as a modal overlay.
 *
 * Manages its own form state and async submission lifecycle.
 * Locks body scroll and traps focus while open.
 *
 * @param props - {@link SubscribeModalProps}
 * @returns The modal overlay, or `null` when closed.
 */
export default function SubscribeModal({
  isOpen,
  onClose,
  lang,
}: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['EU']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([
    'Tech Giant',
  ]);
  const [frequency, setFrequency] = useState<'INSTANT' | 'WEEKLY'>('INSTANT');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus trap: focus the modal on open
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  /**
   * Generic toggle helper for multi-select checkbox groups.
   * Adds the item if absent, removes it if already selected.
   */
  const toggleItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  /** Validates the email field, then POSTs the subscription to the API. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage(t.emailRequired);
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          regions: selectedRegions,
          industries: selectedIndustries,
          frequency,
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setErrorMessage(t.errorDuplicate);
        } else {
          setErrorMessage(data.error || t.errorGeneric);
        }
        setStatus('error');
      }
    } catch {
      setErrorMessage(t.errorGeneric);
      setStatus('error');
    }
  };

  /** Closes the modal when the user clicks the backdrop (not the card). */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className={styles.modal} ref={modalRef} tabIndex={-1}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <IconSubscribe size={22} />
            <h2 className={styles.title}>{t.title}</h2>
          </div>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        {status === 'success' ? (
          <div className={styles.feedbackSuccess}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
              {t.successTitle}
            </div>
            {t.successMessage}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="subscribe-email">
                {t.emailLabel}
              </label>
              <input
                id="subscribe-email"
                type="email"
                className={styles.input}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="subscribe-name">
                {t.nameLabel}
              </label>
              <input
                id="subscribe-name"
                type="text"
                className={styles.input}
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Regions */}
            <div className={styles.fieldGroup}>
              <span className={styles.label}>{t.regionsLabel}</span>
              <div className={styles.checkboxGroup}>
                {REGIONS.map((region) => (
                  <label
                    key={region}
                    className={`${styles.checkboxLabel} ${
                      selectedRegions.includes(region)
                        ? styles.checkboxLabelActive
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedRegions.includes(region)}
                      onChange={() =>
                        toggleItem(selectedRegions, setSelectedRegions, region)
                      }
                    />
                    {region}
                  </label>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className={styles.fieldGroup}>
              <span className={styles.label}>{t.industriesLabel}</span>
              <div className={styles.checkboxGroup}>
                {INDUSTRIES.map((industry) => (
                  <label
                    key={industry}
                    className={`${styles.checkboxLabel} ${
                      selectedIndustries.includes(industry)
                        ? styles.checkboxLabelActive
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIndustries.includes(industry)}
                      onChange={() =>
                        toggleItem(
                          selectedIndustries,
                          setSelectedIndustries,
                          industry
                        )
                      }
                    />
                    {industry}
                  </label>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className={styles.fieldGroup}>
              <span className={styles.label}>{t.frequencyLabel}</span>
              <div className={styles.checkboxGroup}>
                <label className={`${styles.checkboxLabel} ${frequency === 'INSTANT' ? styles.checkboxLabelActive : ''}`}>
                  <input
                    type="radio"
                    name="frequency"
                    style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                    checked={frequency === 'INSTANT'}
                    onChange={() => setFrequency('INSTANT')}
                  />
                  {t.freqInstant}
                </label>
                <label className={`${styles.checkboxLabel} ${frequency === 'WEEKLY' ? styles.checkboxLabelActive : ''}`}>
                  <input
                    type="radio"
                    name="frequency"
                    style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                    checked={frequency === 'WEEKLY'}
                    onChange={() => setFrequency('WEEKLY')}
                  />
                  {t.freqWeekly}
                </label>
              </div>
            </div>

            {/* Error feedback */}
            {status === 'error' && errorMessage && (
              <div className={styles.feedbackError}>{errorMessage}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t.submitText}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
