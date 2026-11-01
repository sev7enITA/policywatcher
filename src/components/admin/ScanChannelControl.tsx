'use client';
import { useState } from 'react';
import type { ScanChannel, scanChannelCapabilities } from '@/lib/scanChannels';
import type { channelRunReport, recentChannelRuns } from '@/lib/engine/channelReports';
import styles from '@/app/admin/admin.module.css';

type Report = NonNullable<Awaited<ReturnType<typeof channelRunReport>>>;
export default function ScanChannelControl({ channel, onChange, capabilities, runs, disabled }: {
  channel: ScanChannel; onChange: (value: ScanChannel) => void;
  capabilities?: ReturnType<typeof scanChannelCapabilities>;
  runs: Awaited<ReturnType<typeof recentChannelRuns>>; disabled: boolean;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function openReport(id: string) {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/cron-status?channelRunId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('The report is unavailable. Refresh the scan status and try again.');
      setReport(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load the report.'); }
    finally { setLoading(false); }
  }
  return <section aria-label="Scan engine selection" style={{ marginBottom: 24 }}>
    <label className={styles.scanControlField}>
      <span className={styles.statusLabel}>Scan engine</span>
      <select className={styles.input} value={channel === 'stable' ? 'stable' : 'preview'} disabled={disabled}
        onChange={event => onChange(event.target.value as ScanChannel)} aria-describedby="scan-channel-help">
        <option value="stable" disabled={capabilities?.stable === false}>Stable · current operational scanner</option>
        <option value="preview" disabled={!capabilities?.preview}>Engine 6 Preview · private trial</option>
      </select>
    </label>
    <p id="scan-channel-help" className={styles.metaText}>{channel === 'stable'
      ? 'Stable can update the official baseline and history after the current publication checks. Manual runs send no notifications. Stable identifies the operational version, not a guarantee of completeness.'
      : 'Preview saves private observations. It does not update official baselines, publish changes or notify subscribers. A separate worker processes the saved queue.'}</p>
    {channel !== 'stable' && <label style={{ display: 'block', margin: '12px 0' }}>
      <input type="checkbox" checked={channel === 'compare'} disabled={disabled || !capabilities?.compare}
        onChange={event => onChange(event.target.checked ? 'compare' : 'preview')} />{' '}
      Compare stable and preview extraction on the same capture
      <span className={styles.scanControlHelp}> The comparison does not run a second public scan or compare AI models. Differences require source review.</span>
    </label>}
    {capabilities?.reason && <p className={styles.metaText}>{capabilities.reason}</p>}
    {capabilities?.preview && <p className={styles.metaText}>{capabilities.stable
      ? 'Isolated workspace. Stable and Preview run one at a time; a conflicting start is rejected.'
      : 'Separate private preview. Stable remains available on the main PolicyWatcher service. The comparison here uses its extractor on the same captured response.'}</p>}
    {runs.length > 0 && <div style={{ marginTop: 20 }}>
      <h3>Private preview runs</h3>
      <p className={styles.metaText}>The channel and scope are fixed when a run starts. No automatic fallback to Stable.</p>
      {runs.map(run => <p key={run.id}>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} disabled={loading}
          onClick={() => void openReport(run.id)}>View {run.channel === 'compare' ? 'comparison' : 'preview'} report</button>{' '}
        {new Date(run.createdAt).toLocaleString()} · {run.status.replaceAll('_', ' ')} · {run.selected} policies
      </p>)}
    </div>}
    {error && <p role="alert">{error}</p>}
    {report && <section aria-label="Private scan report" style={{ marginTop: 20, overflowX: 'auto' }}>
      <h3>{report.metadata.channel === 'compare' ? 'Same-capture extraction comparison' : 'Preview observation report'}</h3>
      <p>Run {report.runId} · {report.status.replaceAll('_', ' ')} · {report.selected} selected</p>
      {report.metadata.channel === 'compare' && <p>{report.comparisonCounts.policyRows} policy rows: {report.comparisonCounts.different} different · {report.comparisonCounts.identicalUnqualified} identical, unqualified · {report.comparisonCounts.pending} pending · {report.comparisonCounts.unavailable} unavailable.</p>}
      <p className={styles.metaText}>{report.boundary}</p>
      <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} disabled={loading} onClick={() => void openReport(report.runId)}>Refresh report</button>{' '}
      <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} onClick={() => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `policywatcher-${report.runId}.json`; link.click(); URL.revokeObjectURL(url);
      }}>Export report JSON</button>
      <table style={{ width: '100%', marginTop: 16, textAlign: 'left' }}>
        <caption>Source outcomes. Missing captures remain unavailable; they are not counted as agreement.</caption>
        <thead><tr><th>Source</th><th>Preview outcome</th><th>Stable text</th><th>Preview text</th><th>Comparison</th></tr></thead>
        <tbody>{report.rows.map(row => <tr key={row.taskId}>
          <td style={{ maxWidth: 350, overflowWrap: 'anywhere', padding: 8 }}>{row.sourceUrl}</td>
          <td>{row.outcome || row.status}<br />{row.error || row.reasons.join(', ')}</td>
          <td>{row.comparison ? `${row.comparison.stable.chars.toLocaleString()} characters` : 'Not compared'}</td>
          <td>{row.comparison ? `${row.comparison.preview.chars.toLocaleString()} characters` : 'Not compared'}</td>
          <td>{!row.comparison ? row.comparisonState === 'not_requested' ? 'Comparison not requested'
            : row.comparisonState === 'pending' ? 'Waiting for capture' : 'Comparison unavailable; no fallback performed'
            : row.comparison.identicalText ? 'Completeness unqualified; identical extractor output' : 'Different extractor output; review required'}
            {row.comparison && !row.comparison.identicalText && <details><summary>Inspect differences</summary>
              <p>Stable-only and preview-only passages describe extractor output, not a policy change.</p>
              {row.comparison.differences.map((part, i) => <blockquote key={i} style={{ whiteSpace: 'pre-wrap' }}><strong>{part.side} only</strong><br />{part.text}{part.truncated ? '\n[Excerpt truncated]' : ''}</blockquote>)}
              {row.comparison.differencesTruncated && <p>Difference display is limited. Review the preserved source capture for the complete document.</p>}
            </details>}
          </td>
        </tr>)}</tbody>
      </table>
      <details><summary>Run provenance</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(report.metadata, null, 2)}</pre></details>
    </section>}
  </section>;
}
