'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileCheck2,
  MailCheck,
  RefreshCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import styles from './outreach.module.css';
import {
  EDITORIAL_CAMPAIGN_REGISTRY_VERSION,
  OUTREACH_OPERATION_TYPES,
  OUTREACH_READINESS_ITEMS,
  OUTREACH_READINESS_STORAGE_KEY,
  buildCampaignLandingUrl,
  editorialCampaignById,
  editorialCampaigns,
  type EditorialCampaignId,
  type OutreachOperationType,
} from '@/lib/editorialCampaigns';
import { buildEditorialOutreachKpis, type PressMetricCounts } from '@/lib/pressMetrics';
import {
  POLICYWATCHER_RELEASE_DATE,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION_DISPLAY,
} from '@/lib/release';

type Role = 'admin' | 'auditor';

interface MetricsResponse {
  role: Role;
  data: {
    pressNewsroom: {
      available: boolean;
      allTime: PressMetricCounts;
      trailing30Days: PressMetricCounts;
      trailingWindowStartedAt: string;
      boundary: string;
    };
  };
}

const OPERATION_LABELS: Record<OutreachOperationType, string> = {
  pitch_sent: 'Pitch sent',
  reply_received: 'Reply received',
  interview_requested: 'Interview requested',
  coverage_confirmed: 'Coverage confirmed',
  correction_requested: 'Correction requested',
};

function numberPair(allTime: number, trailing: number) {
  return <><strong>{allTime}</strong><span>{trailing} in 30 days</span></>;
}

export default function PressOutreachPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [metricsError, setMetricsError] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [readiness, setReadiness] = useState<Record<string, boolean>>({});
  const [readinessLoaded, setReadinessLoaded] = useState(false);
  const [campaignId, setCampaignId] = useState<EditorialCampaignId>('beta13-press-it');
  const [operation, setOperation] = useState<OutreachOperationType>('pitch_sent');
  const [writeLoading, setWriteLoading] = useState(false);
  const [lastWriteState, setLastWriteState] = useState<'not-tested' | 'available' | 'unavailable'>('not-tested');
  const [liveMessage, setLiveMessage] = useState('');
  const [writeError, setWriteError] = useState('');
  const [copied, setCopied] = useState('');

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch('/api/admin/metrics', { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null) as MetricsResponse | { error?: string } | null;
      if (!response.ok || !body || !('data' in body)) throw new Error(body && 'error' in body ? body.error : 'Aggregate metrics are unavailable.');
      setMetrics(body);
      setMetricsError('');
    } catch (error) {
      setMetricsError(error instanceof Error ? error.message : 'Aggregate metrics are unavailable.');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch('/api/admin/auth', { credentials: 'include', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((body: { role?: Role } | null) => setRole(body?.role || null))
      .catch(() => setRole(null));
    queueMicrotask(() => { void loadMetrics(); });
  }, [loadMetrics]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(OUTREACH_READINESS_STORAGE_KEY);
        setReadiness(stored ? JSON.parse(stored) as Record<string, boolean> : {});
      } catch { setReadiness({}); }
      setReadinessLoaded(true);
    });
  }, []);

  const completedReadiness = OUTREACH_READINESS_ITEMS.filter((item) => readiness[item.id]).length;
  const currentCampaign = editorialCampaignById[campaignId];
  const allKpis = useMemo(() => metrics ? buildEditorialOutreachKpis(metrics.data.pressNewsroom.allTime) : null, [metrics]);
  const trailingKpis = useMemo(() => metrics ? buildEditorialOutreachKpis(metrics.data.pressNewsroom.trailing30Days) : null, [metrics]);

  function persistReadiness(next: Record<string, boolean>) {
    setReadiness(next);
    try { window.localStorage.setItem(OUTREACH_READINESS_STORAGE_KEY, JSON.stringify(next)); } catch { /* browser-local aid remains optional */ }
  }

  async function copyText(id: string, value: string, label: string) {
    setWriteError('');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setLiveMessage(`${label} copied.`);
      window.setTimeout(() => setCopied((current) => current === id ? '' : current), 1600);
    } catch {
      setLiveMessage('');
      setWriteError(`${label} could not be copied. Select the text manually.`);
    }
  }

  async function recordOperation() {
    setWriteLoading(true);
    setWriteError('');
    setLiveMessage('');
    try {
      const response = await fetch('/api/admin/outreach-events', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: operation, target: campaignId, locale: currentCampaign.locale }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || 'The aggregate event could not be recorded.');
      setLastWriteState('available');
      setLiveMessage(`${OPERATION_LABELS[operation]} recorded for ${campaignId}.`);
      await loadMetrics();
    } catch (error) {
      setLastWriteState('unavailable');
      setWriteError(error instanceof Error ? error.message : 'The aggregate event could not be recorded.');
    } finally {
      setWriteLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Editorial operations · {POLICYWATCHER_RELEASE_DATE}</p>
          <h1>Press Outreach Desk</h1>
          <p>Review public assets, use fixed campaign copy and record privacy-minimized aggregate outreach events.</p>
        </div>
        <span className={styles.releaseBadge}>{POLICYWATCHER_VERSION_DISPLAY}<small>{POLICYWATCHER_RELEASE_NAME}</small></span>
      </header>

      <dl className={styles.statusStrip} aria-label="Outreach desk status">
        <div><dt>Release</dt><dd>{POLICYWATCHER_VERSION_DISPLAY}</dd></div>
        <div><dt>Campaign cohorts</dt><dd>{editorialCampaigns.length} allowlisted</dd></div>
        <div><dt>Measurement</dt><dd>Aggregate events only</dd></div>
        <div><dt>Registry</dt><dd>{EDITORIAL_CAMPAIGN_REGISTRY_VERSION}</dd></div>
      </dl>

      <section className={styles.launchGate} aria-labelledby="launch-gate-title">
        <header className={styles.sectionHeader}>
          <div><p>01 · Production check</p><h2 id="launch-gate-title">Launch readiness</h2></div>
          <div className={completedReadiness === OUTREACH_READINESS_ITEMS.length ? styles.gateComplete : styles.gatePending}>
            {completedReadiness === OUTREACH_READINESS_ITEMS.length ? <CheckCircle2 size={18} /> : <FileCheck2 size={18} />}
            {completedReadiness}/{OUTREACH_READINESS_ITEMS.length} operator checks
          </div>
        </header>
        <p className={styles.boundary}>This checklist is an operator aid, not an automated security, availability or publication certification. Completion is stored only in this browser and is versioned to the current release.</p>
        <ul className={styles.checklist}>
          {OUTREACH_READINESS_ITEMS.map((item) => (
            <li key={item.id} data-checked={Boolean(readiness[item.id])}>
              <label>
                <input type="checkbox" checked={Boolean(readiness[item.id])} disabled={!readinessLoaded} onChange={(event) => persistReadiness({ ...readiness, [item.id]: event.target.checked })} />
                <span aria-hidden="true"><Check size={14} /></span>
                {item.label}
              </label>
              <Link href={item.href} target="_blank">Verify <ExternalLink size={13} /></Link>
            </li>
          ))}
        </ul>
        <button className={styles.textButton} type="button" onClick={() => persistReadiness({})}><RefreshCcw size={14} />Reset checklist</button>
      </section>

      <section className={styles.section} aria-labelledby="campaign-desk-title">
        <header className={styles.sectionHeader}><div><p>02 · Reviewed messages</p><h2 id="campaign-desk-title">Campaign desk</h2></div><span>Fixed copy · fixed destination · visible boundary</span></header>
        <div className={styles.campaignList}>
          {editorialCampaigns.map((campaign, index) => {
            const landingUrl = buildCampaignLandingUrl(campaign.id);
            return <article className={styles.campaignCard} key={campaign.id}>
              <div className={styles.campaignIndex}>{String(index + 1).padStart(2, '0')}</div>
              <div className={styles.campaignBody}>
                <div className={styles.campaignMeta}><code>{campaign.id}</code><span>{campaign.locale.toUpperCase()}</span><span>v{campaign.version}</span><span>{campaign.readiness.replaceAll('-', ' ')}</span></div>
                <h3>{campaign.copy.subject}</h3>
                <p>{campaign.copy.shortPitch}</p>
                <dl><div><dt>Audience</dt><dd>{campaign.audience}</dd></div><div><dt>Purpose</dt><dd>{campaign.purpose}</dd></div><div><dt>Copy source</dt><dd><code>{campaign.availableCopySource}</code></dd></div></dl>
                <p className={styles.disclosure}><ShieldCheck size={14} />{campaign.disclosure}</p>
                <div className={styles.actionRow}>
                  <button type="button" onClick={() => void copyText(`${campaign.id}-subject`, campaign.copy.subject, `${campaign.id} subject`)}><Clipboard size={14} />{copied === `${campaign.id}-subject` ? 'Copied' : 'Copy title'}</button>
                  <button type="button" onClick={() => void copyText(`${campaign.id}-pitch`, campaign.copy.shortPitch, `${campaign.id} pitch`)}><Clipboard size={14} />{copied === `${campaign.id}-pitch` ? 'Copied' : 'Copy pitch'}</button>
                  <button type="button" onClick={() => void copyText(`${campaign.id}-url`, landingUrl, `${campaign.id} landing URL`)}><Clipboard size={14} />{copied === `${campaign.id}-url` ? 'Copied' : 'Copy URL'}</button>
                  {campaign.copy.followUp && <button type="button" onClick={() => void copyText(`${campaign.id}-follow`, campaign.copy.followUp || '', `${campaign.id} follow-up`)}><Clipboard size={14} />{copied === `${campaign.id}-follow` ? 'Copied' : 'Copy follow-up'}</button>}
                  <a href={landingUrl} target="_blank" rel="noreferrer">Preview <ExternalLink size={14} /></a>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className={styles.operationSection} aria-labelledby="record-operation-title">
        <header className={styles.sectionHeader}><div><p>03 · Manual aggregate log</p><h2 id="record-operation-title">Record an operation</h2></div><MailCheck size={23} /></header>
        <p>Record one bounded event after the action occurs. Do not use this control as a recipient list, delivery log or editorial CRM.</p>
        {role !== 'admin' ? (
          <div className={styles.readOnlyNotice}><ShieldCheck size={17} />{role === 'auditor' ? 'Auditor access is read-only. Campaign definitions and aggregate counts remain visible.' : 'Verifying the role. Operation controls are available only to administrators.'}</div>
        ) : (
          <div className={styles.operationControls}>
            <label>Campaign cohort<select value={campaignId} onChange={(event) => setCampaignId(event.target.value as EditorialCampaignId)}>{editorialCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.id}</option>)}</select></label>
            <label>Operation<select value={operation} onChange={(event) => setOperation(event.target.value as OutreachOperationType)}>{OUTREACH_OPERATION_TYPES.map((eventType) => <option key={eventType} value={eventType}>{OPERATION_LABELS[eventType]}</option>)}</select></label>
            <div className={styles.fixedLocale}><span>Fixed locale</span><strong>{currentCampaign.locale.toUpperCase()}</strong></div>
            <button type="button" className={styles.recordButton} onClick={() => void recordOperation()} disabled={writeLoading || role !== 'admin'}>{writeLoading ? <RefreshCcw className={styles.spin} size={15} /> : <Send size={15} />}{writeLoading ? 'Recording…' : 'Record aggregate event'}</button>
          </div>
        )}
        <p className={styles.dataBoundary}>Accepted fields are exactly event type, allowlisted campaign ID and fixed campaign locale. No recipient, outlet, email, notes, message body or free text is accepted or stored.</p>
      </section>

      <section className={styles.section} aria-labelledby="funnel-title">
        <header className={styles.sectionHeader}><div><p>04 · Bounded signals</p><h2 id="funnel-title">Editorial funnel</h2></div>{metrics?.data.pressNewsroom.available && <span>All time / trailing 30 days</span>}</header>
        {metricsLoading ? <div className={styles.statePanel} role="status">Loading aggregate event counts…</div> : metricsError || !metrics?.data.pressNewsroom.available || !allKpis || !trailingKpis ? <div className={styles.statePanel} role="alert"><strong>Event counts unavailable.</strong><span>{metricsError || 'The optional event store could not be read. Public and copy actions remain available.'}</span></div> : <>
          <div className={styles.kpiSequence}>
            <article className={styles.primaryKpi}><span>Primary operating KPI</span><h3>Qualified editorial reuse events</h3><div>{numberPair(allKpis.primary.qualifiedEditorialReuseEvents, trailingKpis.primary.qualifiedEditorialReuseEvents)}</div><p>Story Pack actions + citation copies + embed-code copies. These are reuse proxies, not confirmed publication.</p></article>
            <div className={styles.kpiGroup}><h3>Drivers</h3><dl><div><dt>Pulse story views</dt><dd>{numberPair(allKpis.drivers.pulseStoryViews, trailingKpis.drivers.pulseStoryViews)}</dd></div><div><dt>Social-card actions</dt><dd>{numberPair(allKpis.drivers.socialCardDownloads, trailingKpis.drivers.socialCardDownloads)}</dd></div><div><dt>Campaign landings</dt><dd>{numberPair(allKpis.drivers.campaignLandings, trailingKpis.drivers.campaignLandings)}</dd></div><div><dt>Pitches sent</dt><dd>{numberPair(allKpis.drivers.pitchesSent, trailingKpis.drivers.pitchesSent)}</dd></div></dl></div>
            <div className={styles.kpiGroup}><h3>Outcome signals</h3><dl><div><dt>Replies received</dt><dd>{numberPair(allKpis.outcomes.repliesReceived, trailingKpis.outcomes.repliesReceived)}</dd></div><div><dt>Interview requests</dt><dd>{numberPair(allKpis.outcomes.interviewRequests, trailingKpis.outcomes.interviewRequests)}</dd></div><div><dt>Confirmed coverage</dt><dd>{numberPair(allKpis.outcomes.confirmedCoverage, trailingKpis.outcomes.confirmedCoverage)}</dd></div></dl></div>
            <div className={styles.kpiGroup}><h3>Guardrails</h3><dl><div><dt>Correction requests</dt><dd>{numberPair(allKpis.guardrails.correctionRequests, trailingKpis.guardrails.correctionRequests)}</dd></div><div><dt>Last write attempt</dt><dd><strong>{lastWriteState === 'available' ? 'Accepted' : lastWriteState === 'unavailable' ? 'Unavailable' : 'Not tested'}</strong><span>{lastWriteState === 'available' ? 'endpoint accepted event' : lastWriteState === 'unavailable' ? 'endpoint returned an error' : 'metric reads do not test writes'}</span></dd></div></dl></div>
          </div>

          <div className={styles.cohortTable} role="table" aria-label="Aggregate campaign events">
            <div className={styles.tableHeader} role="row"><span role="columnheader">Campaign</span><span role="columnheader">Landings</span>{OUTREACH_OPERATION_TYPES.map((eventType) => <span role="columnheader" key={eventType}>{OPERATION_LABELS[eventType]}</span>)}</div>
            {editorialCampaigns.map((campaign) => <div className={styles.tableRow} role="row" key={campaign.id}>
              <strong role="rowheader">{campaign.id}</strong>
              <span role="cell" data-label="Landings">{metrics.data.pressNewsroom.allTime.campaignLandings.byCampaign[campaign.id]} <small>/ {metrics.data.pressNewsroom.trailing30Days.campaignLandings.byCampaign[campaign.id]} 30d</small></span>
              {OUTREACH_OPERATION_TYPES.map((eventType) => <span role="cell" data-label={OPERATION_LABELS[eventType]} key={eventType}>{metrics.data.pressNewsroom.allTime.outreachOperations.byCampaign[campaign.id][eventType]} <small>/ {metrics.data.pressNewsroom.trailing30Days.outreachOperations.byCampaign[campaign.id][eventType]} 30d</small></span>)}
            </div>)}
          </div>
          <p className={styles.measurementNote}>{metrics.data.pressNewsroom.boundary} No percentages are calculated because no visitor or session join is stored.</p>
        </>}
      </section>

      <section className={styles.operatingNotes} aria-labelledby="operating-notes-title">
        <div><p>05 · Working rule</p><h2 id="operating-notes-title">Operating notes</h2></div>
        <ol><li>Complete the local launch gate against the deployed release.</li><li>Use the cohort copy and its allowlisted campaign URL without recipient parameters.</li><li>Record the pitch only after sending it outside PolicyWatcher.</li><li>Follow up once when appropriate; do not turn aggregate events into recipient histories.</li><li>Review outcomes and correction requests as separate signals, never as a conversion rate.</li></ol>
        <nav aria-label="Outreach references"><Link href="/pulse">Pulse</Link><Link href="/press-kit">Press Kit</Link><Link href="/press-kit/data">Data Room</Link><Link href="/methodology/confidence">Methodology</Link><Link href="/privacy">Privacy</Link></nav>
      </section>

      <div className={styles.liveRegion} role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      {writeError && <div className={styles.errorToast} role="alert">{writeError}</div>}
    </div>
  );
}
