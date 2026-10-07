'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { reviewedMetrics } from '@/lib/evidenceQuality';
type Metrics = ReturnType<typeof reviewedMetrics>;

export default function ReviewedEvidenceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/evidence-quality?metricsOnly=1', { signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error('Unavailable');
      setMetrics((await r.json()).metrics);
    }).catch(e => { if (e.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, []);
  const value = (v: Metrics['citationSupport']) => v.percent === null ? 'Not assessed (0 reviewed)' : `${v.percent}% (${v.numerator}/${v.denominator})`;
  return <section aria-label="Reviewed evidence quality" style={{ marginBlock: 24 }}>
    <h2>Human-reviewed evidence</h2>
    {metrics ? <><p>False-positive share among reviewed detected changes: <strong>{value(metrics.falsePositiveShare)}</strong></p>
      <p>Supported AI citations in the reviewed sample: <strong>{value(metrics.citationSupport)}</strong></p>
      <p>Outdated reviews excluded: {metrics.staleReviews}. These sample measurements do not change the dataset score or establish population accuracy.</p></>
      : <p>{error ? 'Review metrics unavailable.' : 'Loading review metrics…'}</p>}
    <Link href="/admin/evidence-quality">Review evidence and EU archive metadata</Link>
  </section>;
}
