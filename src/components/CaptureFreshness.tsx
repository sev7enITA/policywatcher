import { captureFreshness } from '@/lib/seo';

export default function CaptureFreshness({ lastRetrievedAt }: { lastRetrievedAt: string | null }) {
  const freshness = captureFreshness(lastRetrievedAt);
  if (freshness.status === 'recent') return null;
  return <p role="note" style={{ padding: '12px 16px', marginTop: 16, borderLeft: '3px solid #8d4b17', lineHeight: 1.6 }}>
    {freshness.status === 'dated'
      ? `The latest recorded successful retrieval is ${freshness.ageDays} days old. The source may have changed since that capture.`
      : 'A reliable date for the latest successful retrieval is not available.'}
    {' '}A capture date does not establish the current status of every monitored source.
  </p>;
}
