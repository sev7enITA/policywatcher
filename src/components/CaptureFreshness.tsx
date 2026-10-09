import { captureFreshness } from '@/lib/seo';

export default function CaptureFreshness({ lastRetrievedAt, lang = 'en' }: { lastRetrievedAt: string | null; lang?: 'en' | 'it' }) {
  const freshness = captureFreshness(lastRetrievedAt);
  if (freshness.status === 'recent') return null;
  return <p role="note" style={{ padding: '12px 16px', marginTop: 16, borderLeft: '3px solid #8d4b17', lineHeight: 1.6 }}>
    {freshness.status === 'dated'
      ? lang === 'it' ? `L’ultima acquisizione riuscita risale a ${freshness.ageDays} giorni fa. La fonte potrebbe essere cambiata da allora.` : `The latest recorded successful retrieval is ${freshness.ageDays} days old. The source may have changed since that capture.`
      : lang === 'it' ? 'Non è disponibile una data affidabile dell’ultima acquisizione riuscita.' : 'A reliable date for the latest successful retrieval is not available.'}
    {' '}{lang === 'it' ? 'La data di acquisizione non dimostra lo stato attuale di tutte le fonti monitorate.' : 'A capture date does not establish the current status of every monitored source.'}
  </p>;
}
