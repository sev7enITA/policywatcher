'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, Inbox, RefreshCw } from 'lucide-react';
import styles from '../admin.module.css';
import inquiryStyles from './inquiries.module.css';

type CompanyOption = { id: string; name: string; slug: string; website: string };
type Inquiry = {
  id: string; publicToken: string; status: string; kind: string; companyHint: string | null;
  normalizedDomain: string | null; sourceUrl: string | null;
  noticeDate: string | null; effectiveDate: string | null; policyTypesJson: string | null;
  matchedCompanyId: string | null; adminNote: string | null;
  createdAt: string; company?: { id: string; name: string; slug: string } | null;
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('all');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/inquiries?status=${encodeURIComponent(status)}`);
      if (!response.ok) throw new Error(response.status === 403 ? 'Admin access required.' : 'Could not load inquiries.');
      const payload = await response.json(); setInquiries(payload.inquiries); setCompanies(payload.companyOptions); setStatusCounts(payload.statusCounts || {});
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load inquiries.'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  const setDraft = (id: string, field: string, value: string) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  async function transition(inquiry: Inquiry, action: string) {
    setBusy(inquiry.id); setError('');
    try {
      const draft = drafts[inquiry.id] || {};
      const transitionInput = action === 'approve_new_company' ? {
        companyName: draft.companyName || inquiry.companyHint || '',
        website: draft.website || (inquiry.normalizedDomain ? `https://${inquiry.normalizedDomain}` : ''),
      } : {};
      const response = await fetch('/api/admin/inquiries', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: inquiry.id, action, ...transitionInput, ...draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Transition failed.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transition failed.'); }
    finally { setBusy(''); }
  }

  return <div className={styles.pageContainer}>
    <div className={`${styles.pageHeader} ${inquiryStyles.pageHeader}`}>
      <div className={styles.pageHeaderText}><h1 className={styles.pageTitle}><Inbox size={24} /> Policy inquiries</h1><p className={styles.pageSubtitle}>Human gate for public “what changed?” requests. Email content stays in the user’s browser and is never retained.</p></div>
      <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${inquiryStyles.refreshButton}`} onClick={() => void load()}><RefreshCw size={16} />Refresh</button>
    </div>
    <div className={inquiryStyles.filters} aria-label="Filter inquiries by status">
      {['all','Proposed','Approved','Onboarding','Resolved','Rejected','Duplicate'].map((value) => <button type="button" key={value} aria-pressed={status === value} className={`${styles.btn} ${status === value ? styles.btnPrimary : styles.btnSecondary} ${inquiryStyles.filterButton}`} onClick={() => setStatus(value)}>{value} <span>{value === 'all' ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0) : statusCounts[value] || 0}</span></button>)}
    </div>
    {error && <div className={`${styles.alert} ${styles.alertWarning}`} role="alert"><AlertTriangle size={16}/>{error}</div>}
    {loading ? <div className={styles.loadingScreen}><div className={styles.loadingSpinner}/></div> : inquiries.length === 0 ? <div className={styles.emptyState}><CheckCircle2 size={28}/><h3>No inquiries in this state</h3></div> : <div className={inquiryStyles.queue}>
      {inquiries.map((inquiry) => {
        const draft = drafts[inquiry.id] || {};
        const terminal = ['Resolved','Rejected','Duplicate'].includes(inquiry.status);
        return <article key={inquiry.id} className={inquiryStyles.card}>
          <header className={inquiryStyles.cardHeader}>
            <div><div style={{ fontSize: 12, color: '#667085', marginBottom: 5 }}>{inquiry.publicToken} · {new Date(inquiry.createdAt).toLocaleString()}</div><h2 style={{ margin: 0, fontSize: 19 }}>{inquiry.company?.name || inquiry.companyHint || inquiry.normalizedDomain || 'Unknown company'}</h2></div>
            <span style={{ fontWeight: 750, color: inquiry.status === 'Proposed' ? '#9a5b12' : '#33499f' }}>{inquiry.status} · {inquiry.kind}</span>
          </header>
          <div className={inquiryStyles.cardGrid}>
            <section className={inquiryStyles.evidence}><p><strong>Organization clue:</strong> {inquiry.companyHint || inquiry.normalizedDomain || '—'}</p><p><strong>Dates:</strong> notice {inquiry.noticeDate ? new Date(inquiry.noticeDate).toLocaleDateString() : '—'} · effective {inquiry.effectiveDate ? new Date(inquiry.effectiveDate).toLocaleDateString() : '—'}</p><p><strong>Types:</strong> {inquiry.policyTypesJson || '[]'}</p>{inquiry.sourceUrl && <p><a href={inquiry.sourceUrl} target="_blank" rel="noopener noreferrer">Submitted URL <ExternalLink size={13}/></a> <small>(manual review only; never fetched automatically)</small></p>}<p className={inquiryStyles.noContentStored}>No email address, subject, message body or content fingerprint is stored.</p></section>
            {!terminal && <section className={inquiryStyles.actions}>
              <label>Link existing company<select value={draft.companyId || inquiry.matchedCompanyId || ''} onChange={(event) => setDraft(inquiry.id,'companyId',event.target.value)}><option value="">Select…</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
              <button disabled={busy === inquiry.id || !(draft.companyId || inquiry.matchedCompanyId)} className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void transition(inquiry,'link_company')}>Link company</button>
              {!inquiry.matchedCompanyId && <><hr/><strong>Approve as new company</strong><input placeholder="Canonical name" value={draft.companyName || inquiry.companyHint || ''} onChange={(e)=>setDraft(inquiry.id,'companyName',e.target.value)}/><input placeholder="https://canonical.example" value={draft.website || (inquiry.normalizedDomain ? `https://${inquiry.normalizedDomain}` : '')} onChange={(e)=>setDraft(inquiry.id,'website',e.target.value)}/><input placeholder="Industry" value={draft.industry || ''} onChange={(e)=>setDraft(inquiry.id,'industry',e.target.value)}/><button disabled={busy === inquiry.id} className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void transition(inquiry,'approve_new_company')}>Approve + start discovery</button></>}
              <hr/><input placeholder="Verified public change ID" value={draft.changeId || ''} onChange={(e)=>setDraft(inquiry.id,'changeId',e.target.value)}/><button disabled={busy === inquiry.id || !draft.changeId} className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void transition(inquiry,'resolve_change')}>Resolve to public change</button>
              <textarea placeholder="Admin note" value={draft.adminNote || ''} onChange={(e)=>setDraft(inquiry.id,'adminNote',e.target.value)} rows={3}/><div className={inquiryStyles.destructiveActions}><button disabled={busy === inquiry.id} className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void transition(inquiry,'duplicate')}>Duplicate</button><button disabled={busy === inquiry.id} className={`${styles.btn} ${styles.btnDanger}`} onClick={() => void transition(inquiry,'reject')}>Reject</button></div>
            </section>}
          </div>
          {inquiry.matchedCompanyId && <footer className={inquiryStyles.managerFooter}><Link href={`/admin/companies?company=${inquiry.matchedCompanyId}`} className={`${styles.btn} ${styles.btnSecondary} ${inquiryStyles.managerLink}`}>Open Company Manager / discovery <ExternalLink size={14}/></Link></footer>}
        </article>;
      })}
    </div>}
  </div>;
}
