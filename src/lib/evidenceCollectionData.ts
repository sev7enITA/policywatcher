import 'server-only';
import { buildEvidenceCollection } from './evidenceCollection';
import { getPublicEvidencePacket } from './evidencePacketData';

export async function getPublicEvidenceCollection(changeIds: readonly string[]) {
  const packets = await Promise.all(changeIds.map((changeId) => getPublicEvidencePacket(changeId)));
  if (packets.some((packet) => !packet || packet.publicationGate !== 'published')) return null;
  return buildEvidenceCollection(packets as NonNullable<(typeof packets)[number]>[]);
}
