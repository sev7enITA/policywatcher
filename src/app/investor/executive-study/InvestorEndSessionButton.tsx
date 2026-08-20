'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import styles from '@/app/admin/executive-study/executiveStudy.module.css';

export default function InvestorEndSessionButton() {
  const [pending, setPending] = useState(false);
  async function endSession() {
    if (pending) return;
    setPending(true);
    try {
      await fetch('/api/investor/logout', { method: 'DELETE', credentials: 'include' });
    } finally {
      window.location.replace('/investor/access?outcome=ended');
    }
  }
  return (
    <button type="button" className={styles.investorEndSession} onClick={endSession} disabled={pending}>
      <LogOut size={15} aria-hidden="true" /> {pending ? 'Ending session…' : 'End session'}
    </button>
  );
}
