import { captureFreshness } from '@/lib/seo';

export default function CaptureFreshness({ lastRetrievedAt, lang = 'en' }: { lastRetrievedAt: string | null; lang?: 'it' | 'en' }) {
  const freshness = captureFreshness(lastRetrievedAt);
  if (freshness.status === 'recent') return null;
  return <p role="note" style={{ padding: '12px 16px', marginTop: 16, borderLeft: '3px solid #8d4b17', lineHeight: 1.6 }}>
    {lang === 'it' ? (freshness.status === 'dated' ? `L’ultimo recupero riuscito risale a ${freshness.ageDays} giorni fa. La fonte potrebbe essere cambiata.` : 'La data dell’ultimo recupero riuscito è sconosciuta.') : freshness.status === 'dated'
      ? `The latest recorded successful retrieval is ${freshness.ageDays} days old. The source may have changed since that capture.`
      : 'A reliable date for the latest successful retrieval is not available.'}
    {' '}{lang === 'it' ? 'La data della rilevazione non garantisce che tutte le fonti siano aggiornate.' : 'A capture date does not establish the current status of every monitored source.'}
  </p>;
}
