'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, KeyRound, Lightbulb, X } from 'lucide-react';
import { getAdminGuide } from '@/lib/adminGuides';
import styles from '@/app/admin/admin.module.css';

export function AdminPageGuide({ pathname }: { pathname: string }) {
  const guide = getAdminGuide(pathname);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
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
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  if (!guide) return null;

  return (
    <>
      <div className={`${styles.guideToolbar} ${pathname === '/admin' ? styles.guideToolbarCompact : ''}`}>
        <div className={styles.guideToolbarContext}>
          <BookOpen size={16} aria-hidden="true" />
          <span>Need help with {guide.title}?</span>
        </div>
        <button
          type="button"
          className={styles.guideTrigger}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <BookOpen size={16} aria-hidden="true" />
          Guide to this page
        </button>
      </div>

      {open && (
        <div
          className={styles.guideBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <aside
            ref={dialogRef}
            className={styles.guideDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-guide-title"
          >
            <header className={styles.guideHeader}>
              <div>
                <span className={styles.guideEyebrow}>Guide to this page</span>
                <h2 id="admin-guide-title">{guide.title}</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.guideClose}
                onClick={() => setOpen(false)}
                aria-label="Close page guide"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.guideBody}>
              <section className={styles.guideSection}>
                <h3>What this page is for</h3>
                <p>{guide.purpose}</p>
              </section>

              <section className={styles.guideSection}>
                <h3>How to use it</h3>
                <ol className={styles.guideSteps}>
                  {guide.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </section>

              <section className={styles.guideSection}>
                <h3><KeyRound size={16} aria-hidden="true" /> Key terms</h3>
                <dl className={styles.guideTerms}>
                  {guide.keyTerms.map((item) => (
                    <div key={item.term}>
                      <dt>{item.term}</dt>
                      <dd>{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className={styles.guideMistake}>
                <h3><Lightbulb size={16} aria-hidden="true" /> Common mistake to avoid</h3>
                <p>{guide.commonMistake}</p>
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
