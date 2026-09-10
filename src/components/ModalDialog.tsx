'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalDialogProps {
  label: string;
  className: string;
  onRequestClose: () => void;
  children: ReactNode;
}

/** Native modality makes the background inert, including for assistive technology. */
export default function ModalDialog({ label, className, onRequestClose, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-label={label}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose();
      }}
      onKeyDown={(event) => {
        // Dashboard shortcuts must not open or dismiss background panels.
        event.stopPropagation();
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]',
        )).filter((node) => node.tabIndex >= 0 && !node.matches(':disabled')
          && !node.closest('[inert]') && node.getClientRects().length > 0
          && getComputedStyle(node).visibility !== 'hidden');
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      {children}
    </dialog>
  );
}
