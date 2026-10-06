import type { CitizenFeed } from '../../../../shared/citizen';

/** The newest catalog is authoritative even while browsing an older history page. */
export function mergeCitizenPage(current: CitizenFeed, next: CitizenFeed): CitizenFeed {
  const known = new Map(next.services.map(service => [service.id, new Set(service.policies.map(policy => policy.id))]));
  const changes = [...new Map([...current.changes, ...next.changes].map(change => [change.id, change])).values()]
    .filter(change => known.get(change.serviceId)?.has(change.policyId));
  if (changes.length > 2000) throw new Error('HISTORY_WINDOW_LIMIT');
  return { ...next, changes };
}
