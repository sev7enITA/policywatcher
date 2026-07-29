import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Database,
  Globe2,
  LockKeyhole,
  Radio,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { getPublicApiManifest, PUBLIC_API_VERSION } from '@/lib/publicApi';
import styles from './developers.module.css';

export const metadata: Metadata = {
  title: 'Developers | PolicyWatcher',
  description:
    'Read-only public integration directory for PolicyWatcher evidence and Observatory registry data.',
};

const manifest = getPublicApiManifest();

export default function DevelopersPage() {
  return (
    <>
      <PublicHeader current="developers" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <nav className={styles.topbar} aria-label="Developer documentation navigation">
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              Evidence Console
            </Link>
            <div className={styles.topbarLinks}>
              <Link href="/integrations">Integration options</Link>
              <Link href="/observatory">Observatory</Link>
              <Link href="/atlas">Site Atlas</Link>
              <Link href="/methodology/confidence">Methodology</Link>
            </div>
          </nav>

          <div className={styles.heroGrid}>
            <div>
              <span className={styles.eyebrow}>
                <Code2 size={16} />
                Public API v1 directory
              </span>
              <h1>Evidence-ready data, with its boundaries attached.</h1>
              <p>
                PolicyWatcher exposes a small anonymous, read-only integration surface for public evidence metadata, portable evidence collections and the curated Observatory registry. The contract keeps publication gates, review cadence and source limits visible to the system consuming it.
              </p>
              <div className={styles.heroActions}>
                <a href="#endpoints" className={styles.primaryAction}>
                  Inspect endpoints
                  <ArrowRight size={16} />
                </a>
                <a href="/api/v1/manifest" className={styles.secondaryAction} target="_blank" rel="noreferrer">
                  Open JSON manifest
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
            <aside className={styles.contractCard} aria-label="Public API contract summary">
              <span>Contract</span>
              <strong>{PUBLIC_API_VERSION} · read only</strong>
              <dl>
                <div><dt>Access</dt><dd>No API key</dd></div>
                <div><dt>Rate</dt><dd>{manifest.rateLimit.requests} requests / minute</dd></div>
                <div><dt>Cache</dt><dd>{manifest.cache.maxAgeSeconds} seconds shared</dd></div>
                <div><dt>Scope</dt><dd>Public evidence + curated registry</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="enterprise-api-heading">
          <header className={styles.sectionHeader}>
            <span>Enterprise pilot</span>
            <h2 id="enterprise-api-heading">Need a tenant boundary? Use API v2.</h2>
            <p>API v2 adds Microsoft Entra authentication, an allowlisted tenant claim, an Azure API Management policy and a Power Platform connector package. It remains read-only and does not replace v1.</p>
          </header>
          <div className={styles.endpointGrid}>
            <article className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span>OPENAPI</span>
                <LockKeyhole size={19} />
              </div>
              <h3>Enterprise API v2 contract</h3>
              <code>/api/v2/openapi.json</code>
              <p>The contract is public; data routes require an Entra token with the expected tenant, audience and delegated scope or application role.</p>
              <a href="/api/v2/openapi.json" target="_blank" rel="noreferrer">Open v2 contract <ArrowRight size={15} /></a>
            </article>
            <article className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span>DECIDE</span>
                <Globe2 size={19} />
              </div>
              <h3>Integration options</h3>
              <code>/integrations</code>
              <p>Compare API v1, Enterprise API v2, Azure, Power Platform, embeds and the explicitly planned Teams, Copilot, MCP, webhook and Marketplace paths.</p>
              <Link href="/integrations">Choose a surface <ArrowRight size={15} /></Link>
            </article>
          </div>
        </section>

        <section className={styles.boundaries} aria-label="Integration boundaries">
          <article>
            <ShieldCheck size={20} />
            <div><strong>Publication-aware</strong><p>Published evidence remains behind the same public gates used by the dashboard.</p></div>
          </article>
          <article>
            <Radio size={20} />
            <div><strong>Registry-aware</strong><p>Observatory records identify their local curation mode and manual review timestamp.</p></div>
          </article>
          <article>
            <LockKeyhole size={20} />
            <div><strong>Operations excluded</strong><p>There is no route here for admin records, credentials, raw content or operational diagnostics.</p></div>
          </article>
        </section>

        <section id="endpoints" className={styles.section}>
          <header className={styles.sectionHeader}>
            <span>Endpoints</span>
            <h2>Three stable entry points for this release.</h2>
            <p>All endpoints accept `GET`, permit cross-origin read access without credentials, and apply bounded public-data and rate policies. Collection exports also support Markdown and CSV.</p>
          </header>
          <div className={styles.endpointGrid}>
            <article className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span>GET</span>
                <Database size={19} />
              </div>
              <h3>Integration manifest</h3>
              <code>/api/v1/manifest</code>
              <p>Lists the current public data sources, allowed parameters, evidence gates, cache window and API boundaries.</p>
              <pre><code>{`curl https://policywatcher.online/api/v1/manifest`}</code></pre>
              <a href="/api/v1/manifest" target="_blank" rel="noreferrer">Open endpoint <ArrowRight size={15} /></a>
            </article>
            <article className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span>GET</span>
                <Globe2 size={19} />
              </div>
              <h3>Observatory registry</h3>
              <code>/api/v1/observatory?lang=en</code>
              <p>Returns localized sources, curated signals, scheduled events and the registry review context. Use `lang=it` for Italian.</p>
              <pre><code>{`curl "https://policywatcher.online/api/v1/observatory?lang=en"`}</code></pre>
              <a href="/api/v1/observatory?lang=en" target="_blank" rel="noreferrer">Open endpoint <ArrowRight size={15} /></a>
            </article>
            <article className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span>GET · AVAILABLE · BETA 17</span>
                <FolderKanban size={19} />
              </div>
              <h3>Evidence collection bundle</h3>
              <code>/api/v1/evidence-collections</code>
              <p>Resolves 1–12 canonical public change IDs into one deterministic JSON, Markdown or CSV bundle. Personal titles and review states are never accepted.</p>
              <pre><code>{`?changes={id},{id}&format=json`}</code></pre>
              <Link href="/collections">Build a bounded request <ArrowRight size={15} /></Link>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <span>Directory</span>
            <h2>Published sources remain explicit.</h2>
            <p>The manifest describes the established public data routes too. It does not turn them into unrestricted database access.</p>
          </header>
          <div className={styles.sourceTable} role="region" aria-label="Public data source directory" tabIndex={0}>
            <div className={styles.sourceHead}>
              <span>Source</span><span>Evidence boundary</span><span>Freshness</span><span>Path</span>
            </div>
            {manifest.sources.map((source) => (
              <article key={source.id}>
                <div><strong>{source.id}</strong><small>{source.description}</small></div>
                <span className={styles.gate}>{source.evidenceGate}</span>
                <span>{source.freshness.mode === 'request' ? 'Per request' : `${source.freshness.maxAgeSeconds}s TTL`}</span>
                <code>{source.endpoint}</code>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.methodBand}>
          <BookOpen size={24} />
          <div>
            <span>Operating note</span>
            <h2>Connect to the evidence, not around it.</h2>
            <p>
              Use API v1 for anonymous public reading and API v2 for a controlled Entra tenant pilot. When a source is suspended or not public, integrations receive bounded state information rather than inferred policy content. Signed outbound events and write operations remain future roadmap work.
            </p>
          </div>
          <Link href="/integrations" className={styles.bandLink}>Compare integrations <ArrowRight size={16} /></Link>
        </section>
      </main>
      <Footer lang="en" />
    </>
  );
}
