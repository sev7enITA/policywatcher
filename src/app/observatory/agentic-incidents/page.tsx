import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { getAgenticIncidentObservatory } from '@/lib/agenticIncidentService';
import PublicHeader from '@/components/PublicHeader';
import styles from './agenticIncidents.module.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AgenticIncidentObservatoryPage() {
  const payload = await getAgenticIncidentObservatory({
    providerId: 'rogue-ai-tracker',
    limit: 12,
    includeVendorResponses: true,
  });
  const providerAvailable = payload.provider.retrieval.state === 'live' || payload.provider.retrieval.state === 'stale-cache';

  return (
    <>
      <PublicHeader current="observatory" lang="en" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Link href="/observatory" className={styles.backLink}>
            <ArrowLeft size={16} /> Observatory
          </Link>
          <span className={styles.eyebrow}>Agentic Incident Observatory · provider-neutral</span>
          <h1>External incidents, governed by PolicyWatcher boundaries</h1>
          <p>
            PolicyWatcher normalizes optional tracker metadata into its own versioned signal model. External records never bypass
            local review or public-evidence gates, and providers can fail without changing the PolicyWatcher core.
          </p>
          <div className={styles.boundaryGrid}>
            <article>
              <ShieldCheck size={19} />
              <strong>External score ≠ policy risk</strong>
              <span>Provider capability scores remain contextual metadata.</span>
            </article>
            <article>
              <ShieldCheck size={19} />
              <strong>Temporal association ≠ causation</strong>
              <span>Later public changes are not attributed to an incident.</span>
            </article>
            <article>
              <ShieldCheck size={19} />
              <strong>Unavailable ≠ no incidents</strong>
              <span>Disabled or failed adapters never produce a positive absence claim.</span>
            </article>
          </div>
        </section>

        <section className={styles.statusPanel} aria-label="Provider retrieval status">
          <div>
            <span>Optional adapter</span>
            <strong>{payload.provider.descriptor.name}</strong>
          </div>
          <div>
            <span>Retrieval</span>
            <strong data-state={payload.provider.retrieval.state}>{payload.provider.retrieval.state}</strong>
          </div>
          <div>
            <span>Normalized records</span>
            <strong>{payload.count ?? 'unknown'}</strong>
          </div>
          <div>
            <span>Mapping</span>
            <strong>{payload.mappingVersion}</strong>
          </div>
          <p>{payload.provider.retrieval.message}</p>
        </section>

        <section
          className={styles.vendorMonitorPanel}
          aria-label="Vendor Response Monitor coverage"
          data-truncated={payload.vendorResponseMonitor.truncated}
        >
          <div className={styles.vendorMonitorHeader}>
            <div>
              <span className={styles.eyebrow}>Vendor Response Monitor</span>
              <h2>Bounded evidence coverage</h2>
            </div>
            <strong data-state={payload.vendorResponseMonitor.state}>{payload.vendorResponseMonitor.state}</strong>
          </div>
          <div className={styles.vendorMonitorMetrics}>
            <div><span>Company candidates</span><strong>{payload.vendorResponseMonitor.companyCandidates}</strong></div>
            <div><span>Companies queried</span><strong>{payload.vendorResponseMonitor.queriedCompanies}</strong></div>
            <div><span>Companies truncated</span><strong>{payload.vendorResponseMonitor.truncatedCompanies}</strong></div>
            <div><span>Truncation</span><strong>{payload.vendorResponseMonitor.truncated ? 'yes' : 'no'}</strong></div>
          </div>
          <p>{payload.vendorResponseMonitor.message}</p>
          <small>{payload.vendorResponseMonitor.boundary}</small>
        </section>

        {!providerAvailable ? (
          <section className={styles.emptyState}>
            <TriangleAlert size={22} />
            <div>
              <h2>External provider data is not active</h2>
              <p>
                This optional adapter is disabled or unavailable. PolicyWatcher monitoring and evidence remain operational;
                no conclusion about the existence or absence of incidents is made.
              </p>
            </div>
          </section>
        ) : (
          <section className={styles.incidentSection}>
            <header>
              <span className={styles.eyebrow}>Normalized research context</span>
              <h2>Latest incident metadata</h2>
              <p>Titles, dates, links, provider-native tags and scores only. Narrative full text is not imported.</p>
            </header>
            <div className={styles.incidentGrid}>
              {payload.signals.map((signal) => {
                const timelines = payload.vendorResponseMonitor.timelines.filter((timeline) => timeline.incidentId === signal.id);
                return (
                  <article key={signal.id} className={styles.incidentCard}>
                    <div className={styles.cardTopline}>
                      <span>
                        {signal.occurredAt ? 'Occurred' : 'Published'}{' '}
                        {new Date(signal.occurredAt || signal.publishedAt).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })}
                      </span>
                      <span>{signal.externalProviderReview.status} provider review</span>
                    </div>
                    <h3>{signal.title}</h3>
                    <div className={styles.tags}>
                      {signal.tags.slice(0, 6).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    {signal.capabilityContext.length > 0 && (
                      <dl className={styles.capabilities}>
                        {signal.capabilityContext.map((capability) => (
                          <div key={capability.providerCapabilityId}>
                            <dt>{capability.providerCapabilityId}</dt>
                            <dd>{capability.score}/10 external</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className={styles.associations}>
                      <strong>Candidate entity association</strong>
                      {signal.entityAssociations.length ? signal.entityAssociations.map((association) => (
                        <p key={association.companyId}>
                          {association.companyName} · {association.localReview.status} · exact canonical-name phrase
                        </p>
                      )) : <p>None proposed.</p>}
                    </div>
                    {timelines.map((timeline) => (
                      <div key={timeline.company.companyId} className={styles.timeline}>
                        <strong>Possible later public changes · {timeline.company.companyName}</strong>
                        {timeline.possibleChanges.length ? (
                          <>
                            <ul>
                              {timeline.possibleChanges.slice(0, 4).map((change) => (
                                <li key={change.changeId}>
                                  <Link href={`/change/${change.changeId}`}>{change.policy.name}</Link>
                                  <span>{change.daysAfterIncident} days later · public-evidence-gated</span>
                                </li>
                              ))}
                            </ul>
                            {timeline.possibleChanges.length > 4 && (
                              <small>
                                Showing 4 of {timeline.possibleChanges.length} bounded changes; public JSON and Agent API retain the complete set.
                              </small>
                            )}
                          </>
                        ) : <p>No evidence-gated change in the bounded window. This is not evidence of no response.</p>}
                        <small>{timeline.boundary}</small>
                      </div>
                    ))}
                    <div className={styles.links}>
                      <a href={signal.providerUrl} target="_blank" rel="noopener noreferrer">
                        Provider record <ExternalLink size={14} />
                      </a>
                      <a href={signal.source.url} target="_blank" rel="noopener noreferrer">
                        Primary source <ExternalLink size={14} />
                      </a>
                    </div>
                    <small className={styles.digest}>PolicyWatcher ID {signal.id} · digest {signal.provenance.digest.slice(0, 16)}…</small>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className={styles.contractPanel}>
          <div>
            <span className={styles.eyebrow}>Versioned handoff</span>
            <h2>Independent public contract</h2>
            <p>Consumers can depend on PolicyWatcher’s normalized contract without depending on any single tracker.</p>
          </div>
          <div className={styles.contractLinks}>
            <Link href="/api/v1/agentic-incidents">Public JSON</Link>
            <Link href="/schemas/agentic-incident-signal/v1">JSON Schema</Link>
            <Link href="/api/v1/agent/openapi.json">Agent OpenAPI</Link>
          </div>
        </section>
      </main>
    </>
  );
}
