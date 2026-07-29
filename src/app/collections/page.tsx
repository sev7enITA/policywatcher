import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { parseEvidenceCollectionQuery } from '@/lib/evidenceCollection';
import { getPublicEvidencePacket, listPublicEvidencePacketSummaries } from '@/lib/evidencePacketData';
import CollectionsClient from './CollectionsClient';

export const metadata: Metadata = {
  title: 'Shareable Evidence Collections | PolicyWatcher',
  description:
    'Select up to 12 exact public PolicyWatcher changes, review them locally and export a deterministic evidence bundle.',
};

export const dynamic = 'force-dynamic';

interface CollectionsPageProps {
  searchParams: Promise<{ changes?: string | string[] }>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const query = await searchParams;
  const rawChanges = typeof query.changes === 'string' ? query.changes : undefined;
  const hasSharedSelection = rawChanges !== undefined;
  let requestedIds: string[] = [];
  let sharedSelectionError = '';

  if (hasSharedSelection) {
    const parsed = parseEvidenceCollectionQuery(new URLSearchParams({ changes: rawChanges ?? '' }));
    if (parsed.ok) requestedIds = parsed.changeIds;
    else sharedSelectionError = parsed.error;
  }

  let records: Awaited<ReturnType<typeof listPublicEvidencePacketSummaries>> = [];
  let catalogUnavailable = false;
  try {
    records = await listPublicEvidencePacketSummaries(50);
  } catch (error) {
    catalogUnavailable = true;
    console.error('[Collections] Public evidence catalog unavailable:', error);
  }

  const publicIds = new Set(records.map((record) => record.id.toLowerCase()));
  const missingRequestedIds = requestedIds.filter((id) => !publicIds.has(id));
  const exactPackets = await Promise.all(missingRequestedIds.map(async (id) => {
    try {
      return await getPublicEvidencePacket(id);
    } catch (error) {
      console.error('[Collections] Shared evidence packet unavailable:', error);
      return null;
    }
  }));

  for (const packet of exactPackets) {
    if (!packet || packet.publicationGate !== 'published') continue;
    records.push({
      id: packet.changeId,
      createdAt: packet.screeningDate,
      overallRisk: packet.assessment.overallRisk,
      overallScore: packet.assessment.overallScore,
      summary: packet.assessment.summary,
      sourceState: packet.sourceConfidence.state,
      policy: {
        id: packet.policy.id,
        name: packet.policy.name,
        type: packet.policy.type,
        jurisdiction: packet.policy.jurisdiction,
        dataStatus: packet.sourceConfidence.dataStatus,
        checkLogs: [],
        company: {
          name: packet.company.name,
          slug: packet.company.slug,
          industry: packet.company.industry,
        },
      },
    });
    publicIds.add(packet.changeId.toLowerCase());
  }

  const resolvedRequestedIds = requestedIds.filter((id) => publicIds.has(id));
  const unavailableSharedCount = requestedIds.length - resolvedRequestedIds.length;
  const initialSelectedIds = unavailableSharedCount === 0 ? resolvedRequestedIds : [];

  return (
    <>
      <PublicHeader current="collections" />
      <CollectionsClient
        records={records.map((record) => ({
          id: record.id,
          createdAt: record.createdAt,
          overallRisk: record.overallRisk,
          overallScore: record.overallScore,
          summary: record.summary,
          sourceState: record.sourceState,
          policy: {
            id: record.policy.id,
            name: record.policy.name,
            type: record.policy.type,
            jurisdiction: record.policy.jurisdiction,
            dataStatus: record.policy.dataStatus,
            company: record.policy.company,
          },
        }))}
        initialSelectedIds={initialSelectedIds}
        hasSharedSelection={hasSharedSelection}
        sharedSelectionError={sharedSelectionError}
        unavailableSharedCount={unavailableSharedCount}
        catalogUnavailable={catalogUnavailable}
      />
      <Footer lang="en" variant="compact" />
    </>
  );
}
